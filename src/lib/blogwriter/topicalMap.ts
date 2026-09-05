/**
 * อ่าน topical map 150 บทมาเป็นข้อมูลให้ตัวเลือกหัวข้อใน /admin/blog
 *
 * ใช้ ?raw import เพื่อให้ไฟล์ถูก bundle ตอน build — บน Vercel serverless
 * ไม่มี scripts/ ให้อ่านตอน runtime การ bundle ทำให้ endpoint ทำงานได้เสมอ
 * ข้อแลกเปลี่ยน: แก้ TSV แล้วต้อง deploy ใหม่ถึงเห็น (ระบุไว้ใน UI แล้ว)
 */
import Papa from 'papaparse';
// @ts-expect-error — Vite ?raw import ไม่มี type declaration
import tsvRaw from '../../../scripts/topical-map-150.tsv?raw';

export interface TopicalMapRow {
  status: string;
  seedKeyword: string;
  slug: string;
  title: string;
  description: string;
  primaryKeyword: string;
  secondaryKeywords: string;
  cluster: string;
  pillar: string;
  relatedServiceUrl: string;
  pubDate: string;
  updatedDate: string;
  heroImage: string;
  heroAlt: string;
  author: string;
  tags: string;
  /** true = ให้ Google ค้นเจอ (ค่าปกติ) — แปลงมาจากคอลัมน์ noindex เดิม */
  showInGoogle: boolean;
  faq: string;
}

let cached: TopicalMapRow[] | null = null;

export function getTopicalMapRows(): TopicalMapRow[] {
  if (cached) return cached;

  const parsed = Papa.parse<Record<string, string>>(tsvRaw as string, {
    header: true,
    delimiter: '\t',
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim(),
  });

  cached = parsed.data
    .filter((r) => (r.slug ?? '').trim())
    .map((r) => {
      /**
       * TSV เก่าใช้คอลัมน์ noindex (TRUE = ซ่อน) ส่วนชีตปัจจุบันใช้
       * showInGoogle (FALSE = ซ่อน) — รองรับทั้งสอง โดยตีความตาม
       * blog-sync.mts: ค่าเริ่มต้นคือให้ค้นเจอ ต้องระบุชัดเจนเท่านั้นจึงซ่อน
       */
      let showInGoogle = true;
      const noindexVal = (r.noindex ?? '').trim();
      const showVal = (r.showInGoogle ?? '').trim();
      if (/^(true|yes|ใช่|1)$/i.test(noindexVal)) showInGoogle = false;
      if (/^(false|no|ไม่|0)$/i.test(showVal)) showInGoogle = false;

      return {
        status: (r.status ?? '').trim(),
        seedKeyword: (r.seedKeyword ?? '').trim(),
        slug: (r.slug ?? '').trim(),
        title: (r.title ?? '').trim(),
        description: (r.description ?? '').trim(),
        primaryKeyword: (r.primaryKeyword ?? '').trim(),
        secondaryKeywords: (r.secondaryKeywords ?? '').trim(),
        cluster: (r.cluster ?? '').trim(),
        pillar: (r.pillar ?? '').trim(),
        relatedServiceUrl: (r.relatedServiceUrl ?? '').trim(),
        pubDate: (r.pubDate ?? '').trim(),
        updatedDate: (r.updatedDate ?? '').trim(),
        heroImage: (r.heroImage ?? '').trim(),
        heroAlt: (r.heroAlt ?? '').trim(),
        author: (r.author ?? '').trim(),
        tags: (r.tags ?? '').trim(),
        showInGoogle,
        faq: (r.faq ?? '').trim(),
        // คอลัมน์ body/articleImage ตัดทิ้ง — มีขนาดใหญ่และหน้านี้ให้ AI เขียนใหม่
      };
    });

  return cached;
}
