import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

/**
 * Cluster ของเนื้อหา — ทุกบทความต้องสังกัด cluster เดียว
 *
 * โครงตาม topical map ของ LumaGuard: ฟิล์มอาคารเป็นแกนหลัก
 * และ PPF รถยนต์เป็นสายเสริม การบังคับเป็น enum ทำให้เพิ่ม cluster ใหม่
 * ต้องตั้งใจ ไม่ใช่พิมพ์ผิดแล้วเกิด cluster ใหม่โดยไม่รู้ตัว
 */
export const CLUSTERS = [
  'architectural-film',   // ฟิล์มอาคาร/บ้าน/คอนโด — pillar หลัก
  'energy-saving',        // ลดความร้อน ประหยัดค่าไฟ
  'safety-security',      // ฟิล์มนิรภัย กันกระจกแตก
  'privacy',              // ฟิล์มฝ้า ทึบแสง
  'film-technology',      // นาโนเซรามิก ค่า VLT/TSER/IRR สเปกฟิล์ม
  'ppf-automotive',       // ฟิล์มใสกันรอยรถยนต์ — สายเสริม
  'care-maintenance',     // ดูแลรักษา ปัญหาหลังติดตั้ง
] as const;

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: () =>
    z.object({
      // จำกัดความยาวตั้งแต่ระดับ schema เพื่อให้ build fail ทันทีที่ metadata บาง
      // แทนที่จะไปรู้ตัวใน Search Console อีกสามเดือนถัดมา
      title: z.string().max(70),
      description: z.string().min(80).max(160),

      /**
       * คำหลักหนึ่งคำต่อหนึ่งบทความ ห้ามซ้ำกันทั้งคอลเลกชัน
       * ตรวจสอบตอน build ที่ src/lib/blog.ts — keyword cannibalization
       * คือสาเหตุอันดับหนึ่งที่ทำให้บล็อกขนาด 150 บทอันดับร่วงพร้อมกัน
       */
      primaryKeyword: z.string().min(2),
      secondaryKeywords: z.array(z.string()).max(5).default([]),

      cluster: z.enum(CLUSTERS),
      pillar: z.string().optional(),

      /** หน้าปลายทางของ CTA ในบทความ — บังคับให้ทุกบทมีทางเข้าหน้าขาย */
      relatedServiceUrl: z.string().startsWith('/'),

      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),

      // เก็บเป็น path ใต้ public/ แทน image() เพราะคนเขียนบทความกรอกผ่าน
      // Google Sheet ซึ่งอ้างไฟล์ในโฟลเดอร์ src/ ไม่ได้
      heroImage: z.string().startsWith('/').optional(),
      heroAlt: z.string().optional(),
      // เก็บขนาดจริงไว้เพื่อให้เบราว์เซอร์จองพื้นที่ก่อนรูปโหลดเสร็จ (กัน CLS)
      heroWidth: z.number().optional(),
      heroHeight: z.number().optional(),

      author: z.string().default('ทีมงานวิศวกร LUMAGUARD'),
      tags: z.array(z.string()).max(4).default([]),

      draft: z.boolean().default(false),
      noindex: z.boolean().default(false),

      faq: z
        .array(z.object({ q: z.string(), a: z.string() }))
        .optional(),
    })
    // heroAlt ต้องมาคู่กับ heroImage เสมอ ไม่งั้นรูปจะไม่มี alt
    .refine((data) => !data.heroImage || !!data.heroAlt, {
      message: 'heroAlt is required when heroImage is set',
      path: ['heroAlt'],
    }),
});

export const collections = { blog };
