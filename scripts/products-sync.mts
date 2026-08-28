/**
 * ดึงข้อมูลสินค้าและราคาจาก Google Sheet มาเขียนลง src/data/products.json
 *
 * ใช้รูปแบบเดียวกับ blog-sync.mts คือเปิด Sheet ให้ดูได้แบบสาธารณะ แล้วดึง
 * ผ่านทางออก CSV ของ Google จึงไม่ต้องใช้กุญแจ API และไม่ต้องมี API เขียน
 * ข้อมูลบนเว็บให้ใครยิงเข้ามาได้
 *
 * ข้อมูลปลายทางเป็นไฟล์ใน git ไม่ใช่ฐานข้อมูล จึงตรวจทานได้ผ่าน diff
 * ก่อน deploy และย้อนกลับได้ทุกเวอร์ชัน
 *
 * วิธีใช้
 *   npm run products:sync              ← ดูว่าจะเปลี่ยนอะไร ยังไม่เขียนไฟล์
 *   npm run products:sync -- --apply   ← เขียนลง src/data/products.json
 *   npm run products:sync -- --file x.csv --apply   ← ใช้ไฟล์ในเครื่องแทน Sheet
 *
 * คอลัมน์ที่ต้องมีใน Sheet — ดูตัวอย่างได้ที่ scripts/products-sheet-template.csv
 *   id name series technology vlt uvr irr irr2 tser thickness price
 *   showOnHomepage isPopular
 */

import { readFileSync, writeFileSync } from 'node:fs';
import Papa from 'papaparse';

const SHEET_ID = process.env.PRODUCTS_SHEET_ID ?? '1uD7tzXHfi4UruWMVSIyOTQNff0nYasJvyjQuAyg2wmg';
const SHEET_TAB = process.env.PRODUCTS_SHEET_TAB ?? 'products';
const OUT = 'src/data/products.json';

/**
 * ราคาฟิล์มรถอยู่คนละแท็บ เพราะคิดคนละหน่วยกับฟิล์มอาคาร
 *
 * ฝั่งอาคารเป็นบาทต่อตารางฟุตซึ่งลงในคอลัมน์ price ของแต่ละรุ่นได้ตรง ๆ
 * ส่วนฝั่งรถเป็นราคาเหมาต่อคันแยกตามขนาดรถ ซึ่งเป็นค่าระดับซีรีส์ไม่ใช่ระดับรุ่น
 * ยัดลงตารางเดียวกันจะได้ราคาซ้ำกันห้าแถวต่อหนึ่งซีรีส์
 */
const CAR_TAB = process.env.CAR_PRICES_SHEET_TAB ?? 'car price';
const CAR_OUT = 'src/data/car-prices.json';
const CAR_SIZES = ['S', 'M', 'L', 'XL'] as const;

const SERIES_TAB = process.env.SERIES_SHEET_TAB ?? 'series';
const SERIES_OUT = 'src/data/series.json';
const CATEGORY_TAB = process.env.CATEGORIES_SHEET_TAB ?? 'categories';
const CATEGORY_OUT = 'src/data/categories.json';

const apply = process.argv.includes('--apply');
const fileArg = process.argv.indexOf('--file');

/** คอลัมน์ที่ขาดไม่ได้ ถ้าไม่ครบแปลว่าหัวตารางผิดหรือดึงผิดแท็บ */
const REQUIRED = ['name', 'series', 'vlt'] as const;

/**
 * ชื่อซีรีส์ที่ยอมรับ — เติมจากแท็บ series ตอนรันจริง
 *
 * เดิมเป็นสำเนาที่ต้องแก้ให้ตรงกับ src/lib/products.ts ด้วยมือทุกครั้งที่เพิ่ม
 * ซีรีส์ พอลืมแก้ที่ใดที่หนึ่งแถวใหม่จะถูกตีตกทั้งที่ประกาศไว้แล้วในเว็บ
 * ตอนนี้ชีตเป็นต้นทางเดียว ทั้งสคริปต์และเว็บอ่านจากที่เดียวกัน
 */
let SERIES_LIST: string[] = [];

interface Product {
  id: string;
  name: string;
  series: string;
  technology: string;
  vlt: string;
  uvr: string;
  irr: string;
  irr2: string;
  tser: string;
  thickness: string;
  price: string;
  showOnHomepage: boolean;
  isPopular: boolean;
}

const truthy = (v: unknown) =>
  ['true', 'yes', '1', 'y', 'ใช่', 'x', '✓'].includes(String(v ?? '').trim().toLowerCase());

/** ราคาที่พิมพ์มาอาจมีจุลภาค สัญลักษณ์บาท หรือช่องว่าง เก็บเฉพาะตัวเลข */
const cleanPrice = (v: unknown) => String(v ?? '').replace(/[^\d.]/g, '');

/**
 * ทำค่าเปอร์เซ็นต์ให้เป็นรูปแบบเดียวกัน
 *
 * Google Sheets แปลงข้อความที่ลงท้ายด้วย % เป็นตัวเลขให้อัตโนมัติ ค่า 5%
 * จึงถูกเก็บเป็น 0.05 และตอนดึงออกมาอาจได้ทั้ง "5.00%" หรือ "0.05" แล้วแต่
 * รูปแบบการแสดงผลของช่องนั้น ถ้าปล่อยไว้ ตารางเปรียบเทียบสเปกจะขึ้นค่าที่
 * ผิดไปร้อยเท่าโดยไม่มีใครสังเกต
 *
 * ช่องพวกนี้เป็นค่าระหว่าง 0 ถึง 100 เสมอ เลขที่น้อยกว่าหรือเท่ากับ 1
 * จึงแปลว่าถูกแปลงเป็นสัดส่วนมาแล้ว ต้องคูณกลับ
 */
function cleanPercent(v: unknown): string {
  const raw = String(v ?? '').trim();
  if (!raw) return '';

  const n = Number(raw.replace(/[%\s,]/g, ''));
  if (!Number.isFinite(n)) return raw; // อ่านไม่ออกก็ส่งต่อไปตามเดิม ให้คนตรวจเอง

  const pct = raw.includes('%') ? n : n <= 1 ? n * 100 : n;
  // ตัดทศนิยมที่ไม่จำเป็นออก 5.00% ให้เหลือ 5%
  return `${Math.round(pct * 100) / 100}%`;
}

/** ช่องที่เป็นค่าเปอร์เซ็นต์ทั้งหมด */
const PERCENT_FIELDS = ['vlt', 'uvr', 'irr', 'irr2', 'tser'] as const;

async function readCsv(tab: string = SHEET_TAB): Promise<string> {
  if (fileArg > -1 && tab === SHEET_TAB) {
    const path = process.argv[fileArg + 1];
    if (!path) throw new Error('ใส่ --file แล้วต้องตามด้วยชื่อไฟล์');
    return readFileSync(path, 'utf8');
  }

  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `ดึง Sheet ไม่สำเร็จ (${res.status})\n` +
        'ตรวจว่าเปิดสิทธิ์เป็น "ทุกคนที่มีลิงก์ ดูได้" แล้วหรือยัง',
    );
  }
  const text = await res.text();
  // Google ส่งหน้า HTML กลับมาเมื่อสิทธิ์ไม่พอ แทนที่จะตอบเป็นรหัสข้อผิดพลาด
  if (text.trim().startsWith('<')) {
    throw new Error(
      'Sheet ยังไม่เปิดให้ดูแบบสาธารณะ\n' +
        'เปิด Sheet แล้วกดแชร์ ตั้งเป็น "ทุกคนที่มีลิงก์" สิทธิ์ "ผู้อ่าน"',
    );
  }
  return text;
}

function toProducts(rows: Record<string, string>[]): Product[] {
  const out: Product[] = [];
  const problems: string[] = [];
  const seenId = new Map<string, number>();

  rows.forEach((raw, i) => {
    const line = i + 2; // +1 ข้ามหัวตาราง +1 ให้ตรงกับเลขแถวที่เห็นใน Sheet
    const row = Object.fromEntries(
      Object.entries(raw).map(([k, v]) => [k.trim(), String(v ?? '').trim()]),
    ) as Record<string, string>;

    if (!row.name && !row.series) return; // แถวว่าง ข้ามเงียบ ๆ

    const missing = REQUIRED.filter((k) => !row[k]);
    if (missing.length) {
      problems.push(`แถว ${line}: ขาด ${missing.join(', ')}`);
      return;
    }

    if (!SERIES_LIST.includes(row.series)) {
      problems.push(`แถว ${line}: ซีรีส์ "${row.series}" ไม่อยู่ในรายการ (${SERIES_LIST.join(', ')})`);
      return;
    }

    const id = row.id || `${row.series[0].toLowerCase()}${line}`;
    const dup = seenId.get(id);
    if (dup) {
      problems.push(`แถว ${line}: id "${id}" ซ้ำกับแถว ${dup}`);
      return;
    }
    seenId.set(id, line);

    const price = cleanPrice(row.price);
    if (row.price && !price) {
      problems.push(`แถว ${line}: ราคา "${row.price}" อ่านเป็นตัวเลขไม่ได้`);
    }

    const pct = Object.fromEntries(
      PERCENT_FIELDS.map((f) => [f, cleanPercent(row[f])]),
    ) as Record<(typeof PERCENT_FIELDS)[number], string>;

    // เตือนเมื่อค่าที่อ่านได้ต่างจากที่พิมพ์มา จะได้รู้ว่า Sheets แปลงค่าให้
    for (const f of PERCENT_FIELDS) {
      const before = String(row[f] ?? '').trim();
      if (before && before !== pct[f]) {
        problems.push(`แถว ${line}: ${f} "${before}" ปรับเป็น "${pct[f]}"`);
      }
    }

    out.push({
      id,
      name: row.name,
      series: row.series,
      technology: row.technology ?? '',
      ...pct,
      thickness: row.thickness ?? '',
      price,
      showOnHomepage: truthy(row.showOnHomepage),
      isPopular: truthy(row.isPopular),
    });
  });

  if (problems.length) {
    console.log('\n⚠ แถวที่มีปัญหา');
    problems.forEach((p) => console.log(`   ${p}`));
  }

  return out;
}

interface CategoryRow { id: string; label: string; blurb: string }
interface SeriesRow {
  slug: string;
  dbName: string;
  displayName: string;
  category: string;
  tag: string;
  subtitle: string;
  description: string;
  theme: string;
  sameFilmAs?: string;
}

/**
 * อ่านแท็บใดแท็บหนึ่งแล้วคืนแถวที่พาร์สแล้ว
 *
 * ชื่อแท็บที่ไม่มีอยู่จริงจะถูก Google ปัดไปใช้แท็บแรกแทนที่จะแจ้ง error
 * จึงต้องเช็คคอลัมน์บังคับก่อนเสมอ ไม่งั้นจะเอาข้อมูลผิดแท็บไปเขียนทับของดี
 */
async function readTab(
  tab: string,
  mustHave: string,
): Promise<Record<string, string>[] | null> {
  let csv: string;
  try {
    csv = await readCsv(tab);
  } catch {
    console.log(`\nข้ามแท็บ "${tab}" — อ่านไม่ได้`);
    return null;
  }

  const parsed = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true });
  const headers = parsed.meta.fields?.map((f) => f.trim()) ?? [];
  if (!headers.includes(mustHave)) {
    console.log(`\nข้ามแท็บ "${tab}" — ไม่มีคอลัมน์ ${mustHave} (ได้แท็บผิดมา?)`);
    return null;
  }
  return parsed.data;
}

/** เขียนไฟล์เมื่อข้อมูลเปลี่ยนจริงเท่านั้น จะได้ไม่มี diff เปล่า ๆ ใน git */
function writeIfChanged(out: string, next: unknown, label: string): boolean {
  let current: unknown = null;
  try {
    current = JSON.parse(readFileSync(out, 'utf8'));
  } catch {
    /* ยังไม่มีไฟล์ */
  }
  if (JSON.stringify(current) === JSON.stringify(next)) {
    console.log(`${label}: ไม่มีอะไรเปลี่ยน`);
    return false;
  }
  if (apply) {
    writeFileSync(out, JSON.stringify(next, null, 2) + '\n', 'utf8');
    console.log(`✓ เขียน ${out} แล้ว`);
  }
  return true;
}

async function syncCategories(): Promise<string[]> {
  const rows = await readTab(CATEGORY_TAB, 'id');
  if (!rows) return [];

  const next: CategoryRow[] = [];
  for (const [i, row] of rows.entries()) {
    const id = (row.id ?? '').trim();
    if (!id) continue;
    if (!/^[a-z][a-z0-9-]*$/.test(id)) {
      console.log(`   ⚠ แถว ${i + 2}: id "${id}" ต้องเป็นตัวพิมพ์เล็ก ตัวเลข และขีดกลางเท่านั้น`);
      continue;
    }
    next.push({ id, label: (row.label ?? '').trim(), blurb: (row.blurb ?? '').trim() });
  }

  if (next.length === 0) {
    console.log(`\nข้ามหมวดสินค้า — ไม่พบแถวที่ใช้ได้ในแท็บ "${CATEGORY_TAB}"`);
    return [];
  }

  console.log(`\nหมวดสินค้า: ${next.length} หมวด — ${next.map((c) => c.label).join(' · ')}`);
  writeIfChanged(CATEGORY_OUT, next, '   ');
  return next.map((c) => c.id);
}

async function syncSeries(categoryIds: string[]): Promise<string[]> {
  // เช็คด้วย dbName ไม่ใช่ slug เพราะแท็บบทความก็มีคอลัมน์ slug เหมือนกัน
  // เวลา Google ปัดไปแท็บแรกให้ ตัวกันจะไม่ทำงานถ้าเช็คด้วยชื่อที่ซ้ำกันได้
  const rows = await readTab(SERIES_TAB, 'dbName');
  if (!rows) return [];

  const next: SeriesRow[] = [];
  const problems: string[] = [];

  for (const [i, row] of rows.entries()) {
    const line = i + 2;
    const slug = (row.slug ?? '').trim().toLowerCase();
    if (!slug) continue;

    const get = (k: string) => (row[k] ?? '').trim();
    const missing = ['dbName', 'displayName', 'category', 'tag', 'subtitle', 'description'].filter(
      (k) => !get(k),
    );
    if (missing.length) {
      problems.push(`แถว ${line} (${slug}): ขาด ${missing.join(', ')}`);
      continue;
    }
    if (categoryIds.length && !categoryIds.includes(get('category'))) {
      problems.push(
        `แถว ${line} (${slug}): หมวด "${get('category')}" ไม่มีในแท็บ ${CATEGORY_TAB}`,
      );
      continue;
    }

    next.push({
      slug,
      dbName: get('dbName'),
      displayName: get('displayName'),
      category: get('category'),
      tag: get('tag'),
      subtitle: get('subtitle'),
      description: get('description'),
      theme: get('theme'),
      ...(get('sameFilmAs') ? { sameFilmAs: get('sameFilmAs').toLowerCase() } : {}),
    });
  }

  if (problems.length) {
    console.log(`\n⚠ แท็บ ${SERIES_TAB}`);
    problems.forEach((p) => console.log(`   ${p}`));
  }
  if (next.length === 0) {
    console.log(`\nข้ามซีรีส์ — ไม่พบแถวที่ใช้ได้ในแท็บ "${SERIES_TAB}"`);
    return [];
  }

  const byCat = new Map<string, number>();
  next.forEach((s) => byCat.set(s.category, (byCat.get(s.category) ?? 0) + 1));
  console.log(
    `\nซีรีส์: ${next.length} ซีรีส์ — ` +
      [...byCat].map(([c, n]) => `${c} ${n}`).join(' · '),
  );
  writeIfChanged(SERIES_OUT, next, '   ');
  return next.map((s) => s.dbName);
}

interface CarPrice {
  series: string;
  S: number;
  M: number;
  L: number;
  XL: number;
  sunroof: number;
}

/** ราคารถกรอกกันหลายแบบ "8,900" "฿8900" "8900 บาท" ตัดให้เหลือตัวเลขก่อน */
const toBaht = (v: unknown): number => Number(String(v ?? '').replace(/[^\d.]/g, ''));

function toCarPrices(rows: Record<string, string>[]): CarPrice[] {
  const out: CarPrice[] = [];
  const problems: string[] = [];

  rows.forEach((row, i) => {
    const line = i + 2;
    const series = (row.series ?? '').trim();
    if (!series) return; // แถวว่าง ข้ามเงียบ ๆ

    if (!SERIES_LIST.includes(series)) {
      problems.push(`แถว ${line}: ซีรีส์ "${series}" ไม่อยู่ในรายการ`);
      return;
    }

    const sizes = CAR_SIZES.map((k) => toBaht(row[k]));
    if (sizes.some((n) => !Number.isFinite(n) || n <= 0)) {
      problems.push(`แถว ${line}: ${series} มีช่องขนาดรถที่อ่านเป็นราคาไม่ได้ — ข้ามทั้งแถว`);
      return;
    }

    // ราคาต้องไล่จากรถเล็กไปรถใหญ่ ถ้าสลับกันแปลว่ากรอกผิดคอลัมน์
    for (let k = 1; k < sizes.length; k++) {
      if (sizes[k] < sizes[k - 1]) {
        problems.push(
          `แถว ${line}: ${series} ราคา ${CAR_SIZES[k]} (${sizes[k]}) ถูกกว่า ${CAR_SIZES[k - 1]} (${sizes[k - 1]}) — สลับคอลัมน์หรือเปล่า`,
        );
      }
    }

    out.push({
      series,
      S: sizes[0],
      M: sizes[1],
      L: sizes[2],
      XL: sizes[3],
      sunroof: toBaht(row.sunroof),
    });
  });

  if (problems.length) {
    console.log('\n⚠ แท็บราคารถ');
    problems.forEach((p) => console.log(`   ${p}`));
  }
  return out;
}

async function syncCarPrices(): Promise<Set<string>> {
  let csv: string;
  try {
    csv = await readCsv(CAR_TAB);
  } catch {
    console.log(`\nข้ามราคารถ — อ่านแท็บ "${CAR_TAB}" ไม่ได้`);
    return new Set();
  }

  const parsed = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true });
  const headers = parsed.meta.fields?.map((f) => f.trim()) ?? [];
  // ชื่อแท็บที่ไม่มีอยู่จริงจะถูก Google ปัดไปใช้แท็บแรกแทนที่จะแจ้ง error
  // ถ้าหัวตารางไม่มีคอลัมน์ series แปลว่าได้แท็บผิดมา อย่าเขียนทับของเดิม
  if (!headers.includes('series')) {
    console.log(`\nข้ามราคารถ — แท็บ "${CAR_TAB}" ไม่มีคอลัมน์ series (ได้แท็บผิดมา?)`);
    return new Set();
  }

  const next = toCarPrices(parsed.data);
  if (next.length === 0) {
    console.log(`\nข้ามราคารถ — ไม่พบแถวที่ใช้ได้ในแท็บ "${CAR_TAB}"`);
    return new Set();
  }

  let current: CarPrice[] = [];
  try {
    current = JSON.parse(readFileSync(CAR_OUT, 'utf8'));
  } catch {
    /* ยังไม่มีไฟล์ ถือว่าเริ่มจากศูนย์ */
  }

  const seriesWithCarPrice = new Set(next.map((c) => c.series));
  const same = JSON.stringify(current) === JSON.stringify(next);
  console.log(`\nราคารถ: อ่านได้ ${next.length} ซีรีส์${same ? ' (ไม่มีอะไรเปลี่ยน)' : ''}`);
  if (same) return seriesWithCarPrice;

  next.forEach((c) =>
    console.log(
      `   ${c.series.padEnd(11)} S ${c.S} · M ${c.M} · L ${c.L} · XL ${c.XL} · ซันรูฟ +${c.sunroof}`,
    ),
  );

  if (!apply) return seriesWithCarPrice;
  writeFileSync(CAR_OUT, JSON.stringify(next, null, 2) + '\n', 'utf8');
  console.log(`✓ เขียน ${CAR_OUT} แล้ว`);
  return seriesWithCarPrice;
}

function diff(before: Product[], after: Product[]) {
  const byId = (list: Product[]) => new Map(list.map((p) => [p.id, p]));
  const a = byId(before);
  const b = byId(after);
  const added = after.filter((p) => !a.has(p.id));
  const removed = before.filter((p) => !b.has(p.id));
  const changed: Array<{ id: string; name: string; field: string; from: string; to: string }> = [];

  for (const p of after) {
    const old = a.get(p.id);
    if (!old) continue;
    for (const k of Object.keys(p) as Array<keyof Product>) {
      if (String(old[k] ?? '') !== String(p[k] ?? '')) {
        changed.push({ id: p.id, name: p.name, field: k, from: String(old[k] ?? ''), to: String(p[k] ?? '') });
      }
    }
  }
  return { added, removed, changed };
}

async function main() {
  // ต้องอ่านหมวดกับซีรีส์ก่อน เพราะทั้งสองอย่างเป็นตัวตรวจของแถวสินค้า
  const categoryIds = await syncCategories();
  const seriesNames = await syncSeries(categoryIds);

  /**
   * ถ้าอ่านแท็บ series ไม่ได้ ให้ถอยไปใช้ไฟล์ที่มีอยู่แทนการล้มทั้งงาน
   *
   * ระหว่างที่ยังสร้างแท็บไม่เสร็จ การซิงก์สินค้ากับราคารถต้องทำงานได้ตามปกติ
   * ถ้าปล่อยให้ throw จะกลายเป็นว่าเพิ่มฟีเจอร์แล้วของเดิมใช้ไม่ได้
   */
  SERIES_LIST = seriesNames.length
    ? seriesNames
    : (JSON.parse(readFileSync(SERIES_OUT, 'utf8')) as Array<{ dbName: string }>).map(
        (r) => r.dbName,
      );
  if (!seriesNames.length) {
    console.log(`   ใช้ ${SERIES_OUT} ที่มีอยู่แทน (${SERIES_LIST.length} ซีรีส์)`);
  }

  const csv = await readCsv();
  const parsed = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true });

  const headers = parsed.meta.fields?.map((f) => f.trim()) ?? [];
  const missingCols = REQUIRED.filter((k) => !headers.includes(k));
  if (missingCols.length) {
    throw new Error(
      `หัวตารางขาดคอลัมน์ ${missingCols.join(', ')}\n` +
        `พบ: ${headers.join(', ') || '(ไม่มี)'}\n` +
        'ดูตัวอย่างที่ scripts/products-sheet-template.csv',
    );
  }

  const next = toProducts(parsed.data);
  if (next.length === 0) {
    console.log(`\nไม่พบสินค้าที่ใช้ได้ในแท็บ "${SHEET_TAB}" — ไม่เขียนทับของเดิม`);
    return;
  }

  const current: Product[] = JSON.parse(readFileSync(OUT, 'utf8'));
  const { added, removed, changed } = diff(current, next);
  const carSeries = await syncCarPrices();

  console.log(`\nอ่านจาก Sheet ได้ ${next.length} รายการ (ของเดิม ${current.length})`);

  if (added.length) {
    console.log(`\n➕ เพิ่มใหม่ ${added.length}`);
    added.forEach((p) => console.log(`   ${p.series} · ${p.name} · ${p.price || '(ไม่มีราคา)'}`));
  }
  if (removed.length) {
    console.log(`\n➖ หายไป ${removed.length}`);
    removed.forEach((p) => console.log(`   ${p.series} · ${p.name}`));
  }
  if (changed.length) {
    console.log(`\n✏️  แก้ไข ${changed.length} ค่า`);
    changed.forEach((c) => console.log(`   ${c.name} · ${c.field}: ${c.from || '(ว่าง)'} → ${c.to || '(ว่าง)'}`));
  }
  if (!added.length && !removed.length && !changed.length) {
    console.log('\nไม่มีอะไรเปลี่ยน');
    return;
  }

  // ซีรีส์ที่มีราคาในแท็บรถไม่ต้องมีราคาต่อตารางฟุต การเตือนจะกลายเป็นเสียงรบกวน
  const noPrice = next.filter((p) => !p.price && !carSeries.has(p.series));
  if (noPrice.length) {
    console.log(`\n⚠ ยังไม่มีราคา ${noPrice.length} รายการ: ${noPrice.map((p) => p.name).join(', ')}`);
  }

  if (!apply) {
    console.log('\nยังไม่ได้เขียนไฟล์ — ใส่ --apply เพื่อบันทึกจริง');
    return;
  }

  writeFileSync(OUT, JSON.stringify(next, null, 2) + '\n', 'utf8');
  console.log(`\n✓ เขียน ${OUT} แล้ว`);
  console.log('  ตรวจด้วย git diff แล้ว commit เพื่อให้ขึ้นเว็บในการ deploy ครั้งถัดไป');
}

main().catch((e) => {
  console.error(`\n${e instanceof Error ? e.message : e}`);
  process.exitCode = 1;
});
