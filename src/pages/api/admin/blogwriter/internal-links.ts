/**
 * รายการลิงก์ภายในที่อนุญาตให้ AI ใช้ตอนเขียนบทความ
 *
 * บทความที่เผยแพร่แล้ว + หน้าบริการหลัก — ฝั่ง client เอาไปใส่ใน prompt
 * และฝั่ง publish ใช้ตรวจซ้ำว่าลิงก์ในเนื้อหาอยู่ในรายการจริง
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { requireAdmin, json } from './_guard';

export const prerender = false;

/**
 * ลงท้ายด้วย / ทุกเส้นทางตาม trailingSlash: 'always' ใน astro.config.mjs
 *
 * ถ้าปล่อยไม่มี / โมเดลจะเขียนลิงก์ตามรายการนี้ตรง ๆ บทความใหม่ทุกบทจึงมี
 * ลิงก์ที่โดน 308 redirect หนึ่งจังหวะก่อนถึงหน้าจริง ซึ่งทำให้ลิงก์ภายใน
 * ส่งน้ำหนักได้ไม่เต็มและกิน crawl budget ไปกับ hop ที่ไม่จำเป็น
 */
const SERVICE_LINKS = [
  { path: '/home-film/', title: 'บริการฟิล์มอาคาร/บ้าน' },
  { path: '/car-film/', title: 'บริการฟิล์มรถยนต์' },
  { path: '/products/', title: 'รวมสินค้าฟิล์มทุกรุ่น' },
  { path: '/contact/', title: 'ติดต่อขอใบเสนอราคา' },
];

export const GET: APIRoute = async (context) => {
  const guard = await requireAdmin(context);
  if (guard instanceof Response) return guard;

  try {
    const posts = await getCollection('blog', ({ data }) => !data.draft);
    const links = [
      ...SERVICE_LINKS,
      ...posts.map((p) => ({ path: `/blog/${p.id}/`, title: p.data.title })),
    ];
    return json({ links }, 200);
  } catch (e) {
    console.error('[blogwriter] อ่านรายการลิงก์ไม่สำเร็จ:', e);
    return json({ error: 'อ่านรายการลิงก์ไม่สำเร็จ' }, 500);
  }
};

export const ALL: APIRoute = () =>
  new Response(JSON.stringify({ error: 'รองรับเฉพาะเมธอด GET' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json', Allow: 'GET' },
  });
