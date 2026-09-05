/**
 * บันทึกบทความจาก /admin/blog — commit ไฟล์ .mdx เข้า GitHub main
 *
 * Vercel serverless เขียนไฟล์ลงเครื่องถาวรไม่ได้ การ commit เข้า repo คือ
 * ทางที่บทความขึ้นเว็บได้เอง (Vercel deploy ตาม push) และได้ git history
 * เหมือนบทความจากชีตทุกอย่าง
 *
 * endpoint นี้เป็นด่านสุดท้ายก่อนเนื้อหาเข้า main — ไฟล์ที่ไม่ผ่าน schema
 * หรือ primaryKeyword ซ้ำจะทำให้ astro build ล้มและบล็อกทุก deploy ถัดไป
 * การตรวจที่นี่จึงยอมหลวมไม่ได้
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { checkRateLimit } from '@/lib/ratelimit';
import { publishPayloadSchema, findDisallowedLinks } from '@/lib/blogwriter/validation';
import { buildMdxFile } from '@/lib/blogwriter/mdx';
import { getFile, putFile } from '@/lib/github';
import { requireAdmin, json } from './_guard';

export const prerender = false;

const BLOG_DIR = 'src/content/blog';

/** หน้าบริการที่ลิงก์ได้นอกเหนือจากบทความ — ตรงกับหน้า .astro ที่มีจริง */
const SERVICE_PATHS = ['/', '/home-film', '/car-film', '/products', '/contact', '/blog'];

export const POST: APIRoute = async (context) => {
  const guard = await requireAdmin(context);
  if (guard instanceof Response) return guard;

  // publish เกิดไม่บ่อย ใช้ bucket admin (10/15 นาที) พอ ไม่เปลืองโควตา ai
  const rate = await checkRateLimit(context.request, 'admin');
  if (!rate.success) {
    return json({ error: 'บันทึกถี่เกินไป กรุณารอสักครู่' }, 429);
  }

  let raw: unknown;
  try {
    raw = await context.request.json();
  } catch {
    return json({ error: 'รูปแบบข้อมูลไม่ถูกต้อง' }, 400);
  }

  const parsed = publishPayloadSchema.safeParse(raw);
  if (!parsed.success) {
    return json(
      {
        error: 'ข้อมูลไม่ผ่านการตรวจสอบ',
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      },
      400,
    );
  }
  const { slug, frontmatter, markdownBody, overwrite } = parsed.data;

  /**
   * ตรวจ primaryKeyword ซ้ำกับบทความที่มีอยู่ (mirror assertUniquePrimaryKeywords
   * ใน src/lib/blog.ts ซึ่งจะ throw ตอน build)
   *
   * ข้อจำกัดที่รู้อยู่: คอลเลกชันที่เห็นตรงนี้คือของตอน deploy ล่าสุด —
   * บทความที่เพิ่ง commit ไปเมื่อครู่แต่ยัง deploy ไม่เสร็จจะยังไม่ถูกนับ
   * ช่องว่างแคบ (~2 นาที) และผู้ใช้เป็น admin คนเดียว จึงยอมรับได้
   */
  const existing = await getCollection('blog');
  const newKeyword = frontmatter.primaryKeyword.trim().toLowerCase();
  const conflict = existing.find(
    (p) => p.id !== slug && p.data.primaryKeyword.trim().toLowerCase() === newKeyword,
  );
  if (conflict) {
    return json(
      {
        error: `primaryKeyword "${frontmatter.primaryKeyword}" ซ้ำกับบทความ "${conflict.id}" — keyword ซ้ำทำให้ build พังทั้งเว็บ`,
        reason: 'duplicate-primary-keyword',
        conflictingSlug: conflict.id,
      },
      409,
    );
  }

  // ตรวจลิงก์ในเนื้อหา — AI ห้ามแต่ง URL เอง ลิงก์ได้เฉพาะหน้าที่มีจริง
  const allowedPaths = new Set([
    ...SERVICE_PATHS,
    ...existing.map((p) => `/blog/${p.id}`),
    `/blog/${slug}`, // กันกรณีลิงก์วนหาตัวเอง (ไม่ควรมี แต่ไม่ใช่ลิงก์เสีย)
  ]);
  const badLinks = findDisallowedLinks(markdownBody, allowedPaths);
  if (badLinks.length) {
    return json(
      {
        error: `พบลิงก์ที่ไม่ได้รับอนุญาตในเนื้อหา: ${badLinks.join(', ')} — แก้หรือลบออกก่อนบันทึก`,
        reason: 'disallowed-links',
        badLinks,
      },
      400,
    );
  }

  const path = `${BLOG_DIR}/${slug}.mdx`;

  try {
    const current = await getFile(path);
    if (current && !overwrite) {
      return json(
        { error: `มีบทความ slug "${slug}" อยู่แล้ว`, reason: 'slug-exists' },
        409,
      );
    }

    const fileContent = buildMdxFile(frontmatter, markdownBody);
    const message = current
      ? `content: อัปเดตบทความ ${frontmatter.title} (จาก /admin/blog)`
      : `content: เพิ่มบทความ ${frontmatter.title} (จาก /admin/blog)`;

    const result = await putFile(path, fileContent, message, current?.sha);

    console.log(`[blogwriter] ${guard.email} ${current ? 'อัปเดต' : 'เพิ่ม'}บทความ ${slug}`);
    return json(
      {
        success: true,
        path,
        commitUrl: result.commitUrl,
        blogUrl: `/blog/${slug}`,
        updated: Boolean(current),
      },
      200,
    );
  } catch (e) {
    console.error('[blogwriter] บันทึกบทความไม่สำเร็จ:', e);
    return json({ error: (e as Error).message || 'บันทึกไม่สำเร็จ กรุณาลองใหม่' }, 502);
  }
};

export const ALL: APIRoute = () =>
  new Response(JSON.stringify({ error: 'รองรับเฉพาะเมธอด POST' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json', Allow: 'POST' },
  });
