/**
 * รายการ + เนื้อหาบทความที่มีอยู่ สำหรับโหมดแก้ไขบทความเก่า
 *
 * อ่านจาก GitHub ไม่ใช่ getCollection เพราะ collection คือ snapshot ตอน
 * deploy ล่าสุด — บทความที่เพิ่ง commit จากหน้านี้เมื่อครู่จะยังไม่อยู่ใน
 * collection แต่ต้องแก้ไขได้ทันที ของจริงอยู่ที่ repo เสมอ
 *
 *   GET /api/admin/blogwriter/posts            → รายชื่อไฟล์ทั้งหมด
 *   GET /api/admin/blogwriter/posts?slug=xxx   → frontmatter + เนื้อหาของบทนั้น
 */
import type { APIRoute } from 'astro';
import { getFile, listDir } from '@/lib/github';
import { parseMdxFile } from '@/lib/blogwriter/mdx';
import { htmlToMarkdown } from '@/lib/blogwriter/markdown';
import { requireAdmin, json } from './_guard';

export const prerender = false;

const BLOG_DIR = 'src/content/blog';

export const GET: APIRoute = async (context) => {
  const guard = await requireAdmin(context);
  if (guard instanceof Response) return guard;

  const slug = new URL(context.request.url).searchParams.get('slug');

  try {
    if (!slug) {
      const files = await listDir(BLOG_DIR);
      const posts = files
        .filter((f) => /\.mdx?$/.test(f.name))
        .map((f) => ({ slug: f.name.replace(/\.mdx?$/, '') }));
      return json({ posts }, 200);
    }

    if (!/^[a-z0-9-]+$/.test(slug)) return json({ error: 'slug ไม่ถูกต้อง' }, 400);

    // บทความอาจเป็น .mdx (ปกติ) หรือ .md — ลองตามลำดับ
    const file =
      (await getFile(`${BLOG_DIR}/${slug}.mdx`)) ??
      (await getFile(`${BLOG_DIR}/${slug}.md`));
    if (!file) return json({ error: 'ไม่พบบทความนี้' }, 404);

    const parsed = parseMdxFile(file.content);
    if (!parsed) return json({ error: 'อ่านโครงสร้างไฟล์ไม่สำเร็จ' }, 500);

    // เนื้อหาเก่าบางบทเป็น HTML (จากยุคชีต) — แปลงเป็น markdown ให้แก้ง่าย
    const body = /<[a-z][\s\S]*>/i.test(parsed.body)
      ? htmlToMarkdown(parsed.body)
      : parsed.body;

    return json({ slug, frontmatter: parsed.frontmatter, body }, 200);
  } catch (e) {
    console.error('[blogwriter] อ่านบทความไม่สำเร็จ:', e);
    return json({ error: (e as Error).message || 'อ่านบทความไม่สำเร็จ' }, 502);
  }
};

export const ALL: APIRoute = () =>
  new Response(JSON.stringify({ error: 'รองรับเฉพาะเมธอด GET' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json', Allow: 'GET' },
  });
