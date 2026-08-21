import type { APIRoute } from 'astro';
import { prisma } from '@/lib/db';
import { verifySessionToken, sessionCookie } from '@/lib/session';

/**
 * แก้สถานะลีดจากหน้าหลังบ้าน
 *
 * LeadDashboard เรียก endpoint นี้มาตั้งแต่ต้น แต่ไม่เคยมีไฟล์อยู่จริง
 * ทุกครั้งที่กดเปลี่ยนสถานะจึงได้ 404 กลับไปและขึ้นข้อความว่าอัปเดตไม่สำเร็จ
 * ผลคือลีดทุกรายค้างอยู่ที่ "รอดำเนินการ" ตลอด ทีมขายแยกไม่ออกว่าติดต่อใครไปแล้ว
 *
 * ต้องตรวจสิทธิ์ในไฟล์นี้เอง เพราะ middleware ดูแลเฉพาะเส้นทางที่ขึ้นต้นด้วย
 * /admin ไม่ได้ครอบ /api ดังนั้นถ้าไม่ตรวจตรงนี้ ใครก็แก้สถานะลีดได้
 */

export const prerender = false;

/** ค่าที่ยอมรับ ต้องตรงกับตัวกรองใน LeadDashboard */
const ALLOWED_STATUS = new Set(['new', 'contacted', 'archived']);

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const PATCH: APIRoute = async ({ params, request, cookies }) => {
  const session = await verifySessionToken(cookies.get(sessionCookie.name)?.value);
  if (!session) {
    return json({ error: 'กรุณาเข้าสู่ระบบใหม่' }, 401);
  }

  // ป้องกันคำขอข้ามโดเมนอีกชั้น เบราว์เซอร์กันด้วย CORS อยู่แล้วสำหรับ JSON
  // แต่การตรวจซ้ำตรงนี้ไม่เสียอะไร และกันกรณีตั้งค่า CORS ผิดในอนาคต
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    return json({ error: 'คำขอมาจากต้นทางที่ไม่ได้รับอนุญาต' }, 403);
  }

  const id = params.id;
  if (!id) {
    return json({ error: 'ไม่พบรหัสลีด' }, 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'รูปแบบข้อมูลไม่ถูกต้อง' }, 400);
  }

  const status = (body as { status?: unknown })?.status;
  if (typeof status !== 'string' || !ALLOWED_STATUS.has(status)) {
    return json({ error: 'สถานะไม่ถูกต้อง' }, 400);
  }

  try {
    const lead = await prisma.lead.update({
      where: { id },
      data: { status },
      select: { id: true, status: true },
    });

    console.log(`[leads] ${session.email} เปลี่ยนสถานะลีด ${lead.id} เป็น ${status}`);
    return json({ success: true, lead }, 200);
  } catch (error) {
    // P2025 คือ Prisma หาแถวที่จะแก้ไม่เจอ ซึ่งเป็นความผิดฝั่งผู้เรียก ไม่ใช่ของเซิร์ฟเวอร์
    const code = (error as { code?: string })?.code;
    if (code === 'P2025') {
      return json({ error: 'ไม่พบลีดนี้ในระบบ' }, 404);
    }

    console.error('[leads] แก้สถานะไม่สำเร็จ:', error);
    return json({ error: 'บันทึกไม่สำเร็จ กรุณาลองใหม่' }, 500);
  }
};

/** ตอบให้ชัดว่าเมธอดอื่นไม่รองรับ ดีกว่าปล่อยให้ได้ 404 ซึ่งชวนเข้าใจผิดว่าไม่มี endpoint */
export const ALL: APIRoute = () =>
  new Response(JSON.stringify({ error: 'รองรับเฉพาะเมธอด PATCH' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json', Allow: 'PATCH' },
  });
