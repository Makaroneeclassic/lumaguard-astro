/**
 * รายการหัวข้อจาก topical map 150 บท สำหรับตัวเลือก prefill ใน /admin/blog
 *
 * ข้อมูลถูก bundle ตอน build (ดู src/lib/blogwriter/topicalMap.ts) —
 * แก้ TSV แล้วต้อง deploy ใหม่ถึงเห็นการเปลี่ยนแปลง
 */
import type { APIRoute } from 'astro';
import { getTopicalMapRows } from '@/lib/blogwriter/topicalMap';
import { requireAdmin, json } from './_guard';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const guard = await requireAdmin(context);
  if (guard instanceof Response) return guard;

  try {
    return json({ rows: getTopicalMapRows() }, 200);
  } catch (e) {
    console.error('[blogwriter] อ่าน topical map ไม่สำเร็จ:', e);
    return json({ error: 'อ่าน topical map ไม่สำเร็จ' }, 500);
  }
};

export const ALL: APIRoute = () =>
  new Response(JSON.stringify({ error: 'รองรับเฉพาะเมธอด GET' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json', Allow: 'GET' },
  });
