/**
 * ด่านตรวจร่วมของทุก endpoint ใน /api/admin/blogwriter
 *
 * ต้องตรวจสิทธิ์ในแต่ละไฟล์เอง เพราะ middleware ดูแลเฉพาะเส้นทางที่ขึ้นต้น
 * ด้วย /admin ไม่ได้ครอบ /api (เหตุผลเดียวกับ api/leads/[id].ts)
 *
 * ไฟล์ขึ้นต้นด้วยขีดล่างเพื่อไม่ให้ Astro มองเป็น route
 */
import type { APIContext } from 'astro';
import { verifySessionToken, sessionCookie, type SessionPayload } from '@/lib/session';

export function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** คืน session เมื่อผ่านทุกด่าน หรือ Response ข้อผิดพลาดให้ return ต่อทันที */
export async function requireAdmin(
  context: Pick<APIContext, 'request' | 'cookies'>,
): Promise<SessionPayload | Response> {
  const session = await verifySessionToken(
    context.cookies.get(sessionCookie.name)?.value,
  );
  if (!session) return json({ error: 'กรุณาเข้าสู่ระบบใหม่' }, 401);

  // ป้องกันคำขอข้ามโดเมนอีกชั้น เบราว์เซอร์กันด้วย CORS อยู่แล้วสำหรับ JSON
  // แต่การตรวจซ้ำตรงนี้ไม่เสียอะไร และกันกรณีตั้งค่า CORS ผิดในอนาคต
  const origin = context.request.headers.get('origin');
  if (origin && new URL(origin).host !== new URL(context.request.url).host) {
    return json({ error: 'คำขอมาจากต้นทางที่ไม่ได้รับอนุญาต' }, 403);
  }

  return session;
}
