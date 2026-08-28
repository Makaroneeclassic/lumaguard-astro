import seriesData from '@/data/series.json';
import categoryData from '@/data/categories.json';

/**
 * ซีรีส์ฟิล์มและหมวดสินค้าทุกตัว — ใช้สร้างหน้า /products/[series]
 *
 * เดิมประกาศเป็นค่าคงที่ในไฟล์นี้ตรง ๆ การเพิ่มซีรีส์ใหม่จึงต้องแก้โค้ดทุกครั้ง
 * ย้ายมาอ่านจาก JSON ที่ npm run products:sync ดึงมาจาก Google Sheet แทน
 * เพิ่มซีรีส์ = เพิ่มแถวในชีต ไม่ต้องแตะไฟล์นี้อีก
 *
 * `slug` คือ URL ส่วน `dbName` ใช้จับคู่กับฟิลด์ series ของสินค้า
 * (ตัวพิมพ์ไม่ตรงกัน จึงต้องแยกสองฟิลด์)
 */

export interface CategoryDetail {
  id: string;
  label: string;
  blurb: string;
}

export const CATEGORIES: CategoryDetail[] = categoryData as CategoryDetail[];

export type ProductCategory = string;

/**
 * ชุดสีแบนเนอร์ที่เลือกได้ — คีย์คือค่าที่กรอกในคอลัมน์ theme ของชีต
 *
 * คลาส Tailwind ต้องอยู่ในโค้ดเป็นข้อความเต็ม ห้ามให้ชีตส่งคลาสมาเอง
 * เพราะ Tailwind สแกนหาคลาสจากซอร์สตอน build ถ้าคลาสโผล่มาตอน runtime
 * จาก JSON มันจะไม่ถูกสร้างลง CSS แล้วแบนเนอร์จะกลายเป็นสีเปล่า
 */
const THEMES: Record<string, string> = {
  slate: 'from-slate-900 to-slate-800 text-slate-100',
  emerald: 'from-emerald-950 to-teal-900 text-emerald-100',
  purple: 'from-purple-950 to-indigo-900 text-indigo-100',
  accent: 'from-accent-950 to-slate-900 text-accent-100',
  amber: 'from-neutral-950 to-amber-950 text-amber-100',
  blue: 'from-indigo-950 to-blue-900 text-blue-100',
  graphite: 'from-neutral-950 to-slate-800 text-slate-100',
  titanium: 'from-zinc-800 to-stone-600 text-zinc-50',
  sky: 'from-slate-950 to-sky-900 text-sky-100',
  violet: 'from-violet-950 to-fuchsia-900 text-fuchsia-100',
  cyan: 'from-cyan-950 to-teal-800 text-cyan-50',
};

export const THEME_NAMES = Object.keys(THEMES);

const DEFAULT_THEME = 'slate';

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

export interface SeriesDetail {
  slug: string;
  dbName: string;
  displayName: string;
  /** หมวดสินค้าที่ซีรีส์นี้สังกัด */
  category: ProductCategory;
  tag: string;
  subtitle: string;
  description: string;
  /** คลาส gradient ของแบนเนอร์ ต่อท้าย bg-gradient-to-br */
  bannerBg: string;
  /**
   * slug ของซีรีส์ฝั่งตรงข้ามที่เป็นฟิล์มม้วนเดียวกัน
   *
   * ฟิล์มบางตัวขายทั้งตลาดอาคารและตลาดรถ ใช้เนื้อฟิล์มเดียวกันแต่ตั้งชื่อแบรนด์
   * คนละชื่อและคิดราคาคนละแบบ ถ้าไม่บอกไว้ ลูกค้าที่เทียบสองหน้าจะเห็นค่าสเปก
   * ตรงกันเป๊ะแล้วนึกว่าเว็บลงของซ้ำ
   */
  sameFilmAs?: string;
}

export const SERIES: SeriesDetail[] = (seriesData as SeriesRow[]).map((row) => ({
  slug: row.slug,
  dbName: row.dbName,
  displayName: row.displayName,
  category: row.category,
  tag: row.tag,
  subtitle: row.subtitle,
  description: row.description,
  bannerBg: THEMES[row.theme] ?? THEMES[DEFAULT_THEME],
  ...(row.sameFilmAs ? { sameFilmAs: row.sameFilmAs } : {}),
}));

/**
 * หมวดที่ไม่แสดงรหัสรุ่นและรหัสซีรีส์ให้ลูกค้าเห็น
 *
 * ฝั่งรถลูกค้าเลือกจากระดับความเข้มกับงบ ไม่ได้เลือกจากรหัสอย่าง PNC 35 HD
 * หรือ RT3599HD การโชว์รหัสจึงเป็นข้อมูลที่ไม่ช่วยตัดสินใจและทำให้ตารางอ่านยาก
 * ส่วนฝั่งอาคารยังโชว์อยู่ เพราะลูกค้ากลุ่มนั้นอ้างอิงรหัสรุ่นตอนขอใบเสนอราคา
 */
const CATEGORIES_WITHOUT_MODEL_CODES = new Set<ProductCategory>(['automotive']);

export const showsModelCodes = (category: ProductCategory): boolean =>
  !CATEGORIES_WITHOUT_MODEL_CODES.has(category);

export const getSeries = (slug: string): SeriesDetail | undefined =>
  SERIES.find((s) => s.slug === slug.toLowerCase());

export const getSeriesByCategory = (category: ProductCategory): SeriesDetail[] =>
  SERIES.filter((s) => s.category === category);

/**
 * ตรวจข้อมูลที่มาจากชีตตอน build
 *
 * ข้อมูลชุดนี้คนกรอกเอง ไม่ใช่โค้ด ตัวตรวจจึงต้องอยู่ตรงนี้เพื่อให้ build พัง
 * ทันทีที่กรอกผิด ดีกว่าไปรู้ตัวตอนหน้าเว็บหายหรือแบนเนอร์กลายเป็นสีเปล่า
 */
function assertSeriesData(): void {
  const problems: string[] = [];
  const categoryIds = new Set(CATEGORIES.map((c) => c.id));
  const slugs = new Set<string>();
  const dbNames = new Set<string>();
  const rows = seriesData as SeriesRow[];

  for (const row of rows) {
    const at = `ซีรีส์ "${row.slug || '(ไม่มี slug)'}"`;

    for (const key of ['slug', 'dbName', 'displayName', 'category', 'tag', 'subtitle', 'description'] as const) {
      if (!row[key]?.trim()) problems.push(`${at}: ช่อง ${key} ว่าง`);
    }

    if (slugs.has(row.slug)) problems.push(`${at}: slug ซ้ำ`);
    slugs.add(row.slug);

    if (dbNames.has(row.dbName)) problems.push(`${at}: dbName "${row.dbName}" ซ้ำ`);
    dbNames.add(row.dbName);

    // หน้าหมวดกับหน้าซีรีส์อยู่ใต้ /products/ ด้วยกัน slug ที่ชนชื่อหมวด
    // จะทำให้ route หนึ่งทับอีก route หนึ่งเงียบ ๆ โดยไม่มี error
    if (categoryIds.has(row.slug)) {
      problems.push(`${at}: slug ชนกับชื่อหมวดสินค้า — เปลี่ยนเป็นชื่ออื่น`);
    }

    if (!categoryIds.has(row.category)) {
      problems.push(
        `${at}: หมวด "${row.category}" ไม่มีอยู่จริง — ที่มีคือ ${[...categoryIds].join(', ')}`,
      );
    }

    if (row.theme && !THEMES[row.theme]) {
      problems.push(`${at}: ธีม "${row.theme}" ไม่มีอยู่จริง — ที่มีคือ ${THEME_NAMES.join(', ')}`);
    }
  }

  for (const row of rows) {
    if (!row.sameFilmAs) continue;
    const twin = rows.find((r) => r.slug === row.sameFilmAs);
    if (!twin) {
      problems.push(`ซีรีส์ "${row.slug}": sameFilmAs ชี้ไป "${row.sameFilmAs}" ซึ่งไม่มีอยู่`);
    } else if (twin.sameFilmAs !== row.slug) {
      // ต้องชี้กลับหากันทั้งสองทาง ไม่งั้นหน้าหนึ่งบอกว่าเป็นฟิล์มม้วนเดียวกัน
      // แต่อีกหน้าเงียบ ลูกค้าที่เข้าจากอีกทางจะไม่เห็นคำอธิบาย
      problems.push(
        `ซีรีส์ "${row.slug}" กับ "${twin.slug}": sameFilmAs ต้องชี้กลับหากันทั้งคู่ ` +
          `ตอนนี้ "${twin.slug}" ชี้ไป "${twin.sameFilmAs || '(ว่าง)'}"`,
      );
    }
  }

  if (problems.length) {
    throw new Error(
      `ข้อมูลซีรีส์ในชีตมีปัญหา ${problems.length} จุด\n\n` +
        problems.map((p) => `  • ${p}`).join('\n') +
        `\n\nแก้ในแท็บ series แล้วรัน npm run products:sync -- --apply\n`,
    );
  }
}

assertSeriesData();
