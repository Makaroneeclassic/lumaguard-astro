/**
 * ส่งลีดต่อเข้าระบบหลังบ้าน office.thongkorn46.com
 *
 * เว็บยังเก็บลีดและแจ้งเตือนแบบเดิมทุกอย่าง ทางนี้เป็นสำเนาที่เปิดเป็นงานติดฟิล์มให้ทีมทำต่อ
 * เรียกจากเซิร์ฟเวอร์เท่านั้น เพราะ token ห้ามหลุดไปถึงเบราว์เซอร์
 * ถ้ายังไม่ได้ตั้ง OFFICE_LEAD_TOKEN จะข้ามไปเงียบ ๆ เว็บจึงทำงานได้เหมือนเดิม
 */

const DEFAULT_URL = 'https://office.thongkorn46.com/api/public/leads';

export interface OfficeLead {
  name: string;
  phone: string;
  leadType: string;
  district?: string | null;
  propertyType?: string | null;
  carBrand?: string | null;
  carModel?: string | null;
  areaSize?: number | string | null;
  estimatedArea?: number | string | null;
  recommendedFilm?: string | null;
  trafficSource?: string | null;
  utmSource?: string | null;
  utmCampaign?: string | null;
  gclid?: string | null;
  landingPage?: string | null;
  ref?: string | null;
  websiteLeadId?: string | null;
}

export async function forwardLeadToOffice(lead: OfficeLead): Promise<void> {
  const token = import.meta.env.OFFICE_LEAD_TOKEN;
  if (!token) return;

  const res = await fetch(import.meta.env.OFFICE_LEAD_URL || DEFAULT_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify(lead),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`office lead forward failed: HTTP ${res.status}`);
}
