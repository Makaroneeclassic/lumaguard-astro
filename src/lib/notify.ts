/**
 * แจ้งเตือนลีดใหม่ไปยัง LINE Official Account และอีเมล
 *
 * ทุกช่องทางทำงานแยกกัน ช่องทางที่ล้มเหลวจะไม่ทำให้ช่องอื่นล้มตาม
 * และไม่มีช่องไหน throw ออกไปข้างนอก เพราะการแจ้งเตือนล้มเหลว
 * ต้องไม่ทำให้ลูกค้าเห็นหน้า error ทั้งที่ระบบรับข้อมูลไว้แล้ว
 *
 * หมายเหตุ: LINE Notify ปิดบริการไปแล้ว จึงใช้ Messaging API push แทน
 */

export interface LeadNotification {
  name: string;
  phone: string;
  district: string;
  propertyType?: string;
  areaSize?: number | null;
  recommendedFilm?: string;
  utmSource?: string;
  utmCampaign?: string;
  gclid?: string;
  landingPage?: string;
  savedToDatabase: boolean;
}

function formatMessage(lead: LeadNotification): string {
  const lines = [
    '🔔 ลีดใหม่จากเว็บไซต์',
    '',
    `ชื่อ: ${lead.name}`,
    `โทร: ${lead.phone}`,
    `เขต/พื้นที่: ${lead.district}`,
  ];

  if (lead.propertyType) lines.push(`ประเภท: ${lead.propertyType}`);
  if (lead.areaSize) lines.push(`พื้นที่: ${lead.areaSize} ตร.ม.`);
  if (lead.recommendedFilm) lines.push(`ฟิล์มที่แนะนำ: ${lead.recommendedFilm}`);

  const source = lead.gclid ? 'Google Ads' : (lead.utmSource ?? 'organic/direct');
  lines.push('', `ที่มา: ${source}`);
  if (lead.utmCampaign) lines.push(`แคมเปญ: ${lead.utmCampaign}`);
  if (lead.landingPage) lines.push(`หน้าที่เข้ามา: ${lead.landingPage}`);

  // ถ้าบันทึกลง DB ไม่สำเร็จ ข้อความนี้คือสำเนาเดียวที่เหลืออยู่
  if (!lead.savedToDatabase) {
    lines.push('', '⚠️ บันทึกลงฐานข้อมูลไม่สำเร็จ — ข้อความนี้คือสำเนาเดียวของลีดนี้ กรุณาบันทึกด้วยตนเอง');
  }

  return lines.join('\n');
}

async function pushToLine(message: string): Promise<void> {
  const token = import.meta.env.LINE_CHANNEL_ACCESS_TOKEN;
  // รองรับผู้รับหลายคนโดยคั่นด้วยจุลภาค ถ้าผูกไว้กับคนเดียวแล้ววันหนึ่ง
  // คนนั้นลาออกหรือเปลี่ยนบัญชี ลีดจะเงียบไปโดยไม่มีใครรู้
  const recipients = (import.meta.env.LINE_ADMIN_USER_ID ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (!token || recipients.length === 0) return;

  const results = await Promise.allSettled(
    recipients.map(async (to) => {
      const res = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ to, messages: [{ type: 'text', text: message }] }),
      });
      if (!res.ok) throw new Error(`${to.slice(0, 8)}...: ${res.status} ${await res.text()}`);
    }),
  );

  const failed = results.filter((r) => r.status === 'rejected');
  // ส่งไม่ถึงบางคนยังถือว่าแจ้งเตือนสำเร็จ ขอแค่มีคนได้รับอย่างน้อยหนึ่งคน
  if (failed.length === recipients.length) {
    throw new Error(`LINE push ล้มเหลวทุกปลายทาง: ${failed.map((f: any) => f.reason?.message).join(' | ')}`);
  }
}

async function sendEmail(lead: LeadNotification, message: string): Promise<void> {
  const apiKey = import.meta.env.RESEND_API_KEY;
  const to = import.meta.env.LEAD_NOTIFY_EMAIL;
  if (!apiKey || !to) return;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      // onboarding@resend.dev เป็นที่อยู่ทดสอบของ Resend ซึ่งส่งได้เฉพาะไปยัง
      // อีเมลเจ้าของบัญชีเท่านั้น ถ้า LEAD_NOTIFY_EMAIL เป็นที่อยู่อื่นจะส่งไม่ผ่าน
      // ใช้งานจริงต้องยืนยันโดเมนใน Resend แล้วตั้ง LEAD_NOTIFY_FROM
      from: import.meta.env.LEAD_NOTIFY_FROM || 'LUMAGUARD <onboarding@resend.dev>',
      to: [to],
      subject: `ลีดใหม่: ${lead.name} (${lead.district})`,
      text: message,
    }),
  });

  if (!res.ok) {
    throw new Error(`Resend failed: ${res.status} ${await res.text()}`);
  }
}

export async function notifyNewLead(lead: LeadNotification): Promise<void> {
  const message = formatMessage(lead);

  const results = await Promise.allSettled([pushToLine(message), sendEmail(lead, message)]);

  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      const channel = index === 0 ? 'LINE' : 'email';
      console.error(`[notify] ส่งแจ้งเตือนทาง ${channel} ไม่สำเร็จ:`, result.reason);
    }
  });
}
