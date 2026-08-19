/**
 * ส่ง event ฝั่งเซิร์ฟเวอร์เข้า GA4 ผ่าน Measurement Protocol
 *
 * ใช้เป็นทางหลักระหว่างที่ยังไม่มีเซิร์ฟเวอร์ sGTM ของตัวเอง ข้อดีคือ
 * event ไปถึง GA4 แน่นอนแม้ผู้ใช้จะติดตัวบล็อกโฆษณา เพราะยิงจากเซิร์ฟเวอร์
 * ไม่ผ่านเบราว์เซอร์
 *
 * ข้อสำคัญคือ clientId ต้องเป็นค่าเดียวกับที่เบราว์เซอร์ใช้ ไม่งั้น GA4 จะ
 * นับเป็นคนละคนและเชื่อมไม่ได้ว่าลูกค้ารายนี้มาจากช่องทางไหน ฟอร์มจึงอ่าน
 * ค่าจากคุกกี้ _ga แล้วส่งมาพร้อมข้อมูลลีด
 */
export interface Ga4Event {
  name: string;
  params?: Record<string, string | number | undefined>;
}

export async function sendGa4Event(
  clientId: string,
  events: Ga4Event[],
  userAgent?: string,
): Promise<void> {
  const id = import.meta.env.GA4_MEASUREMENT_ID;
  const secret = import.meta.env.GA4_API_SECRET;

  // เขียน log เมื่อยังตั้งค่าไม่ครบ เดิม return เงียบ ๆ ทำให้แยกไม่ออกว่า
  // ยังไม่ได้ตั้งค่า หรือตั้งแล้วแต่ยิงไม่สำเร็จ
  if (!id || !secret) {
    const missing = [!id && 'GA4_MEASUREMENT_ID', !secret && 'GA4_API_SECRET'].filter(Boolean);
    console.warn(`[ga4] ข้ามการส่ง event เพราะยังไม่ได้ตั้ง ${missing.join(' และ ')}`);
    return;
  }

  const url =
    `https://www.google-analytics.com/mp/collect` +
    `?measurement_id=${encodeURIComponent(id)}&api_secret=${encodeURIComponent(secret)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(userAgent ? { 'User-Agent': userAgent } : {}),
    },
    body: JSON.stringify({
      client_id: clientId,
      non_personalized_ads: false,
      events: events.map((e) => ({
        name: e.name,
        params: Object.fromEntries(
          Object.entries(e.params ?? {}).filter(([, v]) => v !== undefined && v !== ''),
        ),
      })),
    }),
  });

  // Measurement Protocol ตอบ 204 เสมอแม้ payload ผิด จึงเช็คได้แค่ระดับ transport
  if (!res.ok) throw new Error(`GA4 Measurement Protocol ตอบ ${res.status}`);
  console.log(`[ga4] ส่ง ${events.map((e) => e.name).join(', ')} เข้า ${id} แล้ว`);
}

/**
 * แปลงค่าคุกกี้ _ga เป็น client id ที่ GA4 ใช้
 * รูปแบบคุกกี้คือ GA1.1.<client_id> โดย client_id คือสองส่วนท้าย
 */
export function parseGaClientId(gaCookie: string | undefined): string | null {
  if (!gaCookie) return null;
  const parts = gaCookie.split('.');
  return parts.length >= 4 ? `${parts[2]}.${parts[3]}` : null;
}
