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

const apply = process.argv.includes('--apply');
const fileArg = process.argv.indexOf('--file');

/** คอลัมน์ที่ขาดไม่ได้ ถ้าไม่ครบแปลว่าหัวตารางผิดหรือดึงผิดแท็บ */
const REQUIRED = ['name', 'series', 'vlt'] as const;

const SERIES_LIST = ['Element', 'Shield', 'Zenith', 'Nexus', 'Apex', 'Guardian'];

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

async function readCsv(): Promise<string> {
  if (fileArg > -1) {
    const path = process.argv[fileArg + 1];
    if (!path) throw new Error('ใส่ --file แล้วต้องตามด้วยชื่อไฟล์');
    return readFileSync(path, 'utf8');
  }

  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_TAB)}`;
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

  const noPrice = next.filter((p) => !p.price);
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
