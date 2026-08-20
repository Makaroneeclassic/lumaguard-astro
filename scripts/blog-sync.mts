/**
 * ดึงบทความจาก Google Sheet มาเขียนเป็นไฟล์ MDX ใน src/content/blog/
 *
 * ทำไมไม่ดึงตอน build โดยตรง:
 *   - บทความเป็นทรัพย์สินระยะยาว ต้องมีประวัติการแก้ไข การเขียนลง git
 *     ทำให้ `git diff` ตอบได้ว่าแก้อะไรไปเมื่ออันดับตก
 *   - ถ้าชีตล่มหรือถูกปิดสิทธิ์ การ build จะไม่พัง
 *   - การตรวจ primaryKeyword ซ้ำและกติกาความยาวยังทำงานตอน build เหมือนเดิม
 *
 * ใช้งาน: npm run blog:sync
 */
import Papa from "papaparse";
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import "dotenv/config";

/**
 * ค่าเริ่มต้นชี้ไปที่ชีตจริงของโปรเจกต์ ตั้ง env ทับได้ถ้าต้องการใช้ชีตอื่น
 *
 * ไม่ใช่ความลับเพราะชีตเปิดสิทธิ์ให้ผู้ที่มีลิงก์ดูได้อยู่แล้ว การเก็บไว้ในโค้ด
 * ทำให้ทั้งเครื่องนักพัฒนาและ GitHub Actions ใช้ค่าเดียวกันโดยไม่ต้องตั้งซ้ำ
 * และเห็นได้จากประวัติ git ว่าเคยชี้ไปที่ไหนบ้าง
 */
const SHEET_ID = process.env.BLOG_SHEET_ID ?? "1uD7tzXHfi4UruWMVSIyOTQNff0nYasJvyjQuAyg2wmg";
const SHEET_TAB = process.env.BLOG_SHEET_TAB ?? "blog";
const OUT_DIR = "src/content/blog";

/**
 * สถานะของแถวในชีต ควบคุมว่าแถวไหนถูกดึงมาลงเว็บ
 *   draft     n8n เพิ่งสร้าง ยังไม่มีคนตรวจ — ข้าม
 *   ready     ตรวจแล้ว พร้อมลงเว็บ — ดึง
 *   published ลงเว็บแล้ว — ดึงซ้ำเพื่ออัปเดตถ้ามีการแก้
 *   hold      พักไว้ก่อน — ข้าม
 */
const PULLED = new Set(["ready", "published"]);

const CLUSTERS = [
  "architectural-film", "energy-saving", "safety-security", "privacy",
  "film-technology", "ppf-automotive", "care-maintenance",
];

if (!SHEET_ID && !process.argv.includes("--file")) {
  console.error("ต้องตั้ง BLOG_SHEET_ID ในไฟล์ .env ก่อน\n" +
    "ดูได้จาก URL ของชีต: docs.google.com/spreadsheets/d/<ตรงนี้>/edit");
  process.exit(1);
}

const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_TAB)}`;

// รับไฟล์ CSV ในเครื่องได้ด้วย เผื่อทดสอบหรือกรณีที่ชีตถูกปิดสิทธิ์ชั่วคราว
//   npm run blog:sync -- --file path/to/export.csv
const fileArg = process.argv.indexOf("--file");
let csv: string;

if (fileArg !== -1 && process.argv[fileArg + 1]) {
  csv = readFileSync(process.argv[fileArg + 1], "utf8");
  console.log(`อ่านจากไฟล์: ${process.argv[fileArg + 1]}\n`);
} else {
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`ดึงชีตไม่สำเร็จ (HTTP ${res.status}) — ตรวจว่าเปิดสิทธิ์ "ผู้ที่มีลิงก์ดูได้" แล้วหรือยัง`);
    process.exit(1);
  }
  csv = await res.text();
}
if (csv.trim().startsWith("<")) {
  console.error("ได้หน้า HTML กลับมาแทนข้อมูล — ชีตยังไม่เปิดสิทธิ์สาธารณะ");
  process.exit(1);
}

const parsed = Papa.parse<Record<string, string>>(csv, {
  header: true,
  skipEmptyLines: "greedy",
  transformHeader: (h) => h.trim(),
});

const rows = parsed.data.filter((r) => (r.slug ?? "").trim());

// ชีตที่ยังไม่มีบทความเป็นสถานะปกติของงานที่รันตามเวลาทุกวัน ไม่ใช่ความผิดพลาด
// ถ้าให้ล้มเหลวทุกครั้งที่ไม่มีอะไรให้ทำ คนจะชินกับอีเมลแจ้งเตือนแล้วเลิกอ่าน
// พอถึงวันที่พังจริงก็จะไม่มีใครสังเกต
if (rows.length === 0) {
  console.log(`ยังไม่มีบทความในแท็บ "${SHEET_TAB}" — ไม่มีอะไรต้องทำ`);
  process.exit(0);
}

/** ค่าที่ผู้ใช้พิมพ์ว่า TRUE/ใช่/1 ให้ถือเป็นจริง */
const bool = (v?: string) => /^(true|yes|ใช่|1)$/i.test((v ?? "").trim());
const list = (v?: string) =>
  (v ?? "").split(",").map((s) => s.trim()).filter(Boolean);

/** ใส่เครื่องหมายคำพูดให้ค่าที่จะไปอยู่ใน YAML อย่างปลอดภัย */
const yamlStr = (v: string) => `"${v.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

const IMG_DIR = "public/images/blog";
mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(IMG_DIR, { recursive: true });

/**
 * รูปที่ n8n สร้างจะอยู่บน URL ภายนอกซึ่งหมดอายุได้ จึงต้องดึงมาเก็บไว้เอง
 * แปลงเป็น WebP เพื่อลดขนาด แล้วคืน path ที่ใช้ในเว็บ
 */
/**
 * ดาวน์โหลดรูปมาเก็บในโปรเจกต์ แปลงเป็น WebP แล้วคืน path กับขนาดจริง
 *
 * รูปที่ AI สร้างมักอยู่บน URL ชั่วคราวที่หมดอายุภายในไม่กี่ชั่วโมง
 * ถ้าปล่อยให้บทความอ้าง URL นั้นตรง ๆ วันหนึ่งรูปจะหายโดยไม่มีสัญญาณเตือน
 */
async function downloadImage(name: string, src: string) {
  const sharp = (await import("sharp")).default;
  const res = await fetch(src);
  if (!res.ok) throw new Error(`ดาวน์โหลดรูปไม่สำเร็จ (HTTP ${res.status})`);

  const out = await sharp(Buffer.from(await res.arrayBuffer()))
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  const meta = await sharp(out).metadata();
  writeFileSync(join(IMG_DIR, `${name}.webp`), out);
  console.log(`    ↳ รูป: /images/blog/${name}.webp  ${meta.width}x${meta.height}  ${Math.round(out.length / 1024)}KB`);

  return { path: `/images/blog/${name}.webp`, width: meta.width, height: meta.height };
}

async function localizeHeroImage(slug: string, src: string) {
  if (!/^https?:\/\//.test(src)) return { path: src, width: undefined, height: undefined };
  return await downloadImage(slug, src);
}

/**
 * ดึงรูปที่อ้างอยู่ในเนื้อหา markdown มาเก็บด้วย
 *
 * แปลง ![alt](url) เป็นแท็ก img ที่มี width/height จริง เพราะรูปที่ไม่ระบุ
 * ขนาดทำให้หน้ากระตุกตอนโหลด (CLS) ซึ่งเป็นสัญญาณที่ Google ใช้จัดอันดับ
 * ต้นทางในชีตยังเขียนเป็น markdown ตามปกติ การแปลงเกิดตอนสร้างไฟล์เท่านั้น
 */
async function localizeBodyImages(slug: string, body: string): Promise<string> {
  const pattern = /!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g;
  const found = [...body.matchAll(pattern)];
  if (found.length === 0) return body;

  let result = body;
  for (const [i, m] of found.entries()) {
    const [full, alt, url] = m;
    const img = await downloadImage(`${slug}-${i + 1}`, url);
    result = result.replace(
      full,
      `<img src="${img.path}" alt="${alt.replace(/"/g, "&quot;")}" width="${img.width}" height="${img.height}" loading="lazy" decoding="async" />`,
    );
  }
  return result;
}


/** ผลลัพธ์รายแถว ส่งกลับให้ n8n เขียนสถานะกลับเข้าชีต */
const report: Array<{ slug: string; row: number; result: string; url?: string; error?: string }> = [];
const errors: string[] = [];
const seenKeyword = new Map<string, string>();
const seenSlug = new Set<string>();
let written = 0, skipped = 0;

for (const [i, row] of rows.entries()) {
  const line = i + 2; // +2 เพราะแถวแรกเป็นหัวคอลัมน์ และนับจาก 1
  const slug = row.slug.trim();
  const fail = (msg: string) => errors.push(`  แถว ${line} (${slug}): ${msg}`);

  if (seenSlug.has(slug)) fail("slug ซ้ำกับแถวก่อนหน้า");
  seenSlug.add(slug);

  if (!/^[a-z0-9-]+$/.test(slug)) fail("slug ต้องเป็น a-z, 0-9 และ - เท่านั้น");

  const title = (row.title ?? "").trim();
  if (!title) fail("ไม่มี title");
  else if (title.length > 70) fail(`title ยาว ${title.length} ตัว (เกิน 70)`);

  const description = (row.description ?? "").trim();
  if (description.length < 80 || description.length > 160)
    fail(`description ยาว ${description.length} ตัว (ต้อง 80-160)`);

  const keyword = (row.primaryKeyword ?? "").trim();
  if (!keyword) fail("ไม่มี primaryKeyword");
  else {
    const key = keyword.toLowerCase();
    const prev = seenKeyword.get(key);
    // คำหลักซ้ำทำให้ Google เลือกไม่ถูกว่าจะจัดอันดับหน้าไหน อันดับตกทั้งคู่
    if (prev) fail(`primaryKeyword "${keyword}" ซ้ำกับ ${prev}`);
    else seenKeyword.set(key, slug);
  }

  const cluster = (row.cluster ?? "").trim();
  if (!CLUSTERS.includes(cluster))
    fail(`cluster "${cluster}" ไม่ถูกต้อง — ต้องเป็นหนึ่งใน: ${CLUSTERS.join(", ")}`);

  const serviceUrl = (row.relatedServiceUrl ?? "").trim();
  if (!serviceUrl.startsWith("/")) fail("relatedServiceUrl ต้องขึ้นต้นด้วย /");

  const pubDate = (row.pubDate ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(pubDate)) fail("pubDate ต้องเป็นรูปแบบ YYYY-MM-DD");

  const body = (row.body ?? "").trim();
  if (!body) fail("ไม่มีเนื้อหาในคอลัมน์ body");

  const status = (row.status ?? "").trim().toLowerCase() || "draft";
  if (!PULLED.has(status)) {
    console.log(`  ข้าม: ${slug} (status = ${status})`);
    report.push({ slug, row: line, result: "skipped" });
    skipped++;
    continue;
  }

  let heroImage = (row.heroImage ?? "").trim();
  let heroSize: { w?: number; h?: number } = {};
  const heroAlt = (row.heroAlt ?? "").trim();
  if (heroImage && !heroAlt) fail("ใส่ heroImage แล้วต้องใส่ heroAlt ด้วย");

  const rowErrors = errors.filter((e) => e.startsWith(`  แถว ${line} `));
  if (rowErrors.length) {
    report.push({ slug, row: line, result: "error", error: rowErrors.join("; ") });
    skipped++;
    continue;
  }

  const fm: string[] = [
    "---",
    `title: ${yamlStr(title)}`,
    `description: ${yamlStr(description)}`,
    `primaryKeyword: ${yamlStr(keyword)}`,
  ];

  const secondary = list(row.secondaryKeywords).slice(0, 5);
  if (secondary.length) fm.push(`secondaryKeywords: [${secondary.map(yamlStr).join(", ")}]`);

  fm.push(`cluster: ${yamlStr(cluster)}`);
  if ((row.pillar ?? "").trim()) fm.push(`pillar: ${yamlStr(row.pillar.trim())}`);
  fm.push(`relatedServiceUrl: ${yamlStr(serviceUrl)}`);
  fm.push(`pubDate: ${pubDate}`);

  const updated = (row.updatedDate ?? "").trim();
  if (updated) fm.push(`updatedDate: ${updated}`);
  if (heroImage) {
    try {
      const hero = await localizeHeroImage(slug, heroImage);
      heroImage = hero.path;
      heroSize = { w: hero.width, h: hero.height };
    } catch (e) {
      fail(`รูปหน้าปก: ${(e as Error).message}`);
      skipped++;
      continue;
    }
    fm.push(`heroImage: ${yamlStr(heroImage)}`);
    fm.push(`heroAlt: ${yamlStr(heroAlt)}`);
    if (heroSize.w && heroSize.h) {
      fm.push(`heroWidth: ${heroSize.w}`);
      fm.push(`heroHeight: ${heroSize.h}`);
    }
  }
  if ((row.author ?? "").trim()) fm.push(`author: ${yamlStr(row.author.trim())}`);

  const tags = list(row.tags).slice(0, 4);
  if (tags.length) fm.push(`tags: [${tags.map(yamlStr).join(", ")}]`);

  fm.push("draft: false");
  if (bool(row.noindex)) fm.push("noindex: true");

  // คอลัมน์ faq รูปแบบ "คำถาม | คำตอบ" บรรทัดละหนึ่งข้อ
  const faqLines = (row.faq ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
  if (faqLines.length) {
    fm.push("faq:");
    for (const l of faqLines) {
      const [q, ...rest] = l.split("|");
      const a = rest.join("|").trim();
      if (!q?.trim() || !a) { fail(`บรรทัด faq ผิดรูปแบบ: "${l}" (ต้องเป็น คำถาม | คำตอบ)`); continue; }
      fm.push(`  - q: ${yamlStr(q.trim())}`);
      fm.push(`    a: ${yamlStr(a)}`);
    }
  }

  fm.push("---", "");

  let finalBody = body;
  try {
    finalBody = await localizeBodyImages(slug, body);
  } catch (e) {
    fail(`รูปในเนื้อหา: ${(e as Error).message}`);
    skipped++;
    continue;
  }

  const file = join(OUT_DIR, `${slug}.mdx`);
  const isNew = !existsSync(file);
  writeFileSync(file, fm.join("\n") + "\n" + finalBody + "\n");
  console.log(`  ${isNew ? "สร้าง" : "อัปเดต"}: ${slug}.mdx`);
  report.push({ slug, row: line, result: "published", url: `/blog/${slug}` });
  written++;
}

// --report <path> ให้ n8n อ่านไปอัปเดตคอลัมน์ status กลับเข้าชีต
const reportArg = process.argv.indexOf("--report");
if (reportArg !== -1 && process.argv[reportArg + 1]) {
  writeFileSync(process.argv[reportArg + 1], JSON.stringify(report, null, 2));
  console.log(`\nเขียนรายงาน: ${process.argv[reportArg + 1]}`);
}

console.log("");
if (errors.length) {
  console.error(`พบข้อผิดพลาด ${errors.length} จุด (ข้าม ${skipped} แถว):`);
  console.error(errors.join("\n"));
  console.error("\nแก้ในชีตแล้วรันใหม่: npm run blog:sync");
  process.exit(1);
}
if (written === 0) {
  console.log(`ไม่มีบทความที่พร้อมเผยแพร่ (ข้าม ${skipped} แถวที่สถานะยังไม่ใช่ ready)`);
} else {
  console.log(`เสร็จสิ้น — เขียนไฟล์ ${written} บท`);
  console.log("ขั้นถัดไป: ตรวจด้วย git diff แล้ว commit");
}
