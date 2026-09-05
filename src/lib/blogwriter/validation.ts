/**
 * ตัวตรวจ payload สำหรับ publish บทความจาก /admin/blog
 *
 * กติกา mirror มาจาก src/content.config.ts (ด่านจริงตอน build) บวกกติกาของ
 * scripts/blog-sync.mts (slug, pubDate) — ใช้ร่วมกันทั้งฟอร์มฝั่ง client
 * และ API route ฝั่ง server เพื่อไม่ให้เกิดสำเนากติกาชุดที่สี่ที่เพี้ยนจากกัน
 *
 * สำคัญ: ไฟล์ที่ไม่ผ่าน schema ของ content.config จะทำให้ astro build
 * ล้มเหลวและบล็อกทุก deploy ถัดไป — การตรวจที่นี่จึงต้องเข้มเท่าของจริง
 */
import { z } from 'astro/zod';
import { CLUSTERS } from '../clusters';

export const publishFrontmatterSchema = z
  .object({
    title: z.string().min(1, 'ต้องมี title').max(70, 'title ยาวเกิน 70 ตัวอักษร'),
    description: z
      .string()
      .min(80, 'description สั้นกว่า 80 ตัวอักษร')
      .max(160, 'description ยาวเกิน 160 ตัวอักษร'),
    primaryKeyword: z.string().min(2, 'ต้องมี primaryKeyword'),
    secondaryKeywords: z.array(z.string()).max(5).default([]),
    cluster: z.enum(CLUSTERS),
    pillar: z.string().optional(),
    relatedServiceUrl: z.string().startsWith('/', 'relatedServiceUrl ต้องขึ้นต้นด้วย /'),
    pubDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'pubDate ต้องเป็นรูปแบบ YYYY-MM-DD'),
    updatedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    heroImage: z.string().startsWith('/').optional(),
    heroAlt: z.string().optional(),
    heroWidth: z.number().optional(),
    heroHeight: z.number().optional(),
    author: z.string().default('ทีมงานวิศวกร LUMAGUARD'),
    tags: z.array(z.string()).max(4).default([]),
    draft: z.boolean().default(true),
    noindex: z.boolean().default(false),
    faq: z.array(z.object({ q: z.string().min(1), a: z.string().min(1) })).optional(),
  })
  .refine((data) => !data.heroImage || !!data.heroAlt, {
    message: 'ต้องใส่ heroAlt เมื่อมี heroImage',
    path: ['heroAlt'],
  });

export const publishPayloadSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'slug ใช้ได้เฉพาะ a-z, 0-9 และขีดกลาง'),
  frontmatter: publishFrontmatterSchema,
  markdownBody: z.string().min(200, 'เนื้อหาสั้นผิดปกติ'),
  overwrite: z.boolean().optional(),
});

export type PublishPayload = z.infer<typeof publishPayloadSchema>;

/**
 * ตรวจว่าลิงก์ทุกตัวในเนื้อหาเป็นลิงก์ภายในที่อยู่ในรายการอนุญาต
 *
 * AI ชอบแต่ง URL ที่ดูสมจริงแต่ไม่มีอยู่จริง — ลิงก์เสียบนบทความคือ soft 404
 * ที่ทั้งผู้อ่านและ Google เจอ คืนรายการลิงก์ที่ไม่ผ่านให้ผู้ใช้เห็นและแก้
 */
export function findDisallowedLinks(markdown: string, allowedPaths: Set<string>): string[] {
  const bad: string[] = [];
  for (const match of markdown.matchAll(/\]\(([^)\s]+)\)/g)) {
    const url = match[1];
    if (url.startsWith('#')) continue; // ลิงก์ในหน้าเดียวกัน
    const path = url.split('#')[0].replace(/\/$/, '') || '/';
    if (!url.startsWith('/') || !allowedPaths.has(path)) bad.push(url);
  }
  return [...new Set(bad)];
}
