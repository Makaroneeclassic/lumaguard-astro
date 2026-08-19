/**
 * ส่ง event ไปยังเซิร์ฟเวอร์เก็บข้อมูลฝั่งเซิร์ฟเวอร์ของเราเอง
 *
 * ปลายทางกำหนดผ่าน TRACKING_ENDPOINT_URL จะเป็นเซิร์ฟเวอร์ที่เขียนเองหรือ
 * คอนเทนเนอร์ sGTM ที่โฮสต์เองก็ได้ เพราะรับ JSON ธรรมดา
 *
 * ยิงจากเซิร์ฟเวอร์ไม่ผ่านเบราว์เซอร์ จึงไม่ถูกตัวบล็อกโฆษณาสกัด
 * และไม่เพิ่มงานให้หน้าเว็บเลย
 */

export interface TrackingEvent {
  /** ชื่อ event เช่น Lead */
  event_name: string;
  /** ใช้ตัดข้อมูลซ้ำฝั่งปลายทาง กรณีมีการยิงซ้ำ */
  event_id: string;
  event_time: number;
  user_data: Record<string, string | undefined>;
  custom_data: Record<string, string | number | undefined>;
  client_ip_address?: string;
  client_user_agent?: string;
  source_url?: string;
}

const TIMEOUT_MS = 4000;

/**
 * ส่ง event พร้อมลองใหม่หนึ่งครั้งเมื่อเจอปัญหาชั่วคราว
 *
 * ต้องมี timeout เสมอ เพราะ endpoint นี้ถูกเรียกระหว่างที่ผู้ใช้รอผลส่งฟอร์ม
 * ถ้าปลายทางค้าง ผู้ใช้จะค้างตาม
 */
export async function sendTrackingEvent(event: TrackingEvent): Promise<void> {
  const url = import.meta.env.TRACKING_ENDPOINT_URL ?? import.meta.env.SGTM_URL;
  if (!url) return;

  const secret = import.meta.env.TRACKING_ENDPOINT_SECRET;

  const attempt = async (): Promise<Response> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      return await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // เซิร์ฟเวอร์ปลายทางต้องตรวจค่านี้ ไม่งั้นใครก็ยิง conversion ปลอมเข้าไปได้
          ...(secret ? { 'X-Tracking-Secret': secret } : {}),
        },
        body: JSON.stringify(event),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  };

  let res: Response;
  try {
    res = await attempt();
  } catch {
    // ลองใหม่หนึ่งครั้ง ครอบคลุมกรณีเครือข่ายสะดุดหรือปลายทางเพิ่งรีสตาร์ต
    res = await attempt();
  }

  // 4xx คือเราส่งผิดเอง ลองใหม่ก็ไม่ช่วย ให้ฟ้องออกไปเลย
  if (!res.ok) {
    throw new Error(`tracking endpoint ตอบ ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
}
