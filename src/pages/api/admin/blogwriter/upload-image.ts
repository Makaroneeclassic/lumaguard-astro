/**
 * อัพโหลดรูปประกอบบทความ — commit เข้า public/images/blog/ ผ่าน GitHub API
 *
 * ฝั่ง client ย่อและแปลงเป็น WebP มาแล้ว (ดู imageUpload.ts) ที่นี่แค่ตรวจ
 * ว่าเป็น WebP จริงแล้ว commit — ใช้โฟลเดอร์เดียวกับรูปจาก blog-sync
 * รูปจะใช้ได้บนเว็บหลัง Vercel deploy รอบถัดไป (คู่กับตอนกดบันทึกบทความ)
 */
import type { APIRoute } from 'astro';
import { checkRateLimit } from '@/lib/ratelimit';
import { putFile } from '@/lib/github';
import { requireAdmin, json } from './_guard';

export const prerender = false;

const MAX_BYTES = 3.5 * 1024 * 1024;

export const POST: APIRoute = async (context) => {
  const guard = await requireAdmin(context);
  if (guard instanceof Response) return guard;

  const rate = await checkRateLimit(context.request, 'ai');
  if (!rate.success) return json({ error: 'อัพโหลดถี่เกินไป กรุณารอสักครู่' }, 429);

  let body: { slug?: unknown; kind?: unknown; base64?: unknown };
  try {
    body = await context.request.json();
  } catch {
    return json({ error: 'รูปแบบข้อมูลไม่ถูกต้อง' }, 400);
  }

  const { slug, kind, base64 } = body;
  if (typeof slug !== 'string' || !/^[a-z0-9-]+$/.test(slug)) {
    return json({ error: 'slug ไม่ถูกต้อง — กรอก slug ในฟอร์มบันทึกก่อนอัพโหลดรูป' }, 400);
  }
  if (kind !== 'hero' && kind !== 'body') {
    return json({ error: 'ชนิดรูปไม่ถูกต้อง' }, 400);
  }
  if (typeof base64 !== 'string' || !base64) {
    return json({ error: 'ไม่มีข้อมูลรูป' }, 400);
  }

  let bytes: Buffer;
  try {
    bytes = Buffer.from(base64, 'base64');
  } catch {
    return json({ error: 'ข้อมูลรูปเสียหาย' }, 400);
  }
  if (bytes.length > MAX_BYTES) {
    return json({ error: 'รูปใหญ่เกิน 3.5MB' }, 400);
  }
  // ตรวจ magic bytes ของ WebP (RIFF....WEBP) — client แปลงมาให้แล้ว
  if (bytes.length < 12 || bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WEBP') {
    return json({ error: 'ไฟล์ไม่ใช่ WebP — อัพโหลดผ่านหน้า /admin/blog เท่านั้น' }, 400);
  }

  /**
   * ตั้งชื่อไฟล์: hero ใช้ชื่อเดียวต่อบทความ (อัพซ้ำ = แทนที่) ส่วนรูปใน
   * เนื้อหาต่อท้ายเวลากันชนกันเอง — ตรงกับธรรมเนียมโฟลเดอร์ของ blog-sync
   */
  const filename =
    kind === 'hero' ? `${slug}-hero.webp` : `${slug}-${Date.now().toString(36)}.webp`;
  const repoPath = `public/images/blog/${filename}`;
  const publicPath = `/images/blog/${filename}`;

  try {
    // hero อาจอัพซ้ำเพื่อเปลี่ยนรูป — ต้องส่ง sha เดิมถ้ามีไฟล์อยู่แล้ว
    let sha: string | undefined;
    if (kind === 'hero') {
      const { getFile } = await import('@/lib/github');
      sha = (await getFile(repoPath))?.sha;
    }
    await putFile(
      repoPath,
      bytes,
      `content: รูปประกอบบทความ ${slug} (จาก /admin/blog)`,
      sha,
    );
    console.log(`[blogwriter] ${guard.email} อัพโหลดรูป ${publicPath}`);
    return json({ success: true, path: publicPath }, 200);
  } catch (e) {
    console.error('[blogwriter] อัพโหลดรูปไม่สำเร็จ:', e);
    return json({ error: (e as Error).message || 'อัพโหลดไม่สำเร็จ' }, 502);
  }
};

export const ALL: APIRoute = () =>
  new Response(JSON.stringify({ error: 'รองรับเฉพาะเมธอด POST' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json', Allow: 'POST' },
  });
