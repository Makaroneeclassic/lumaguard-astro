/**
 * ทดสอบว่าตั้งค่าแจ้งเตือนลีดถูกต้องหรือยัง โดยไม่ต้องรอลูกค้าจริง
 *
 * เรียก API เดียวกับที่ระบบใช้ตอนมีลีดเข้ามา และรายงานสาเหตุที่ชัดเจน
 * เมื่อล้มเหลว เพราะข้อความ error ดิบของ LINE และ Resend อ่านเข้าใจยาก
 *
 * ใช้งาน: npm run notify:test
 */
import 'dotenv/config';

const msg = [
  '🔔 ทดสอบระบบแจ้งเตือนลีด',
  '',
  'ชื่อ: ทดสอบระบบ',
  'โทร: 098-353-9369',
  'เขต/พื้นที่: หลักสี่',
  '',
  'ถ้าได้รับข้อความนี้ แปลว่าตั้งค่าเรียบร้อยแล้ว',
].join('\n');

let ok = 0, fail = 0;

// ── LINE ──────────────────────────────────────────────
const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const recipients = (process.env.LINE_ADMIN_USER_ID ?? '').split(',').map((s) => s.trim()).filter(Boolean);

if (!token || recipients.length === 0) {
  console.log('⬜ LINE  ข้าม — ยังไม่ได้ตั้ง LINE_CHANNEL_ACCESS_TOKEN หรือ LINE_ADMIN_USER_ID');
} else {
  for (const to of recipients) {
    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ to, messages: [{ type: 'text', text: msg }] }),
    });
    if (res.ok) {
      console.log(`✅ LINE  ส่งถึง ${to.slice(0, 10)}... แล้ว`);
      ok++;
    } else {
      const body = await res.text();
      console.log(`❌ LINE  ${to.slice(0, 10)}... ล้มเหลว HTTP ${res.status}`);
      if (res.status === 401) console.log('        โทเคนไม่ถูกต้องหรือหมดอายุ');
      else if (body.includes('Invalid to')) console.log('        userId ไม่ถูกต้อง ต้องขึ้นต้นด้วย U และยาว 33 ตัว');
      else if (body.includes('not found')) console.log('        บัญชีนี้ยังไม่ได้เพิ่ม Official Account เป็นเพื่อน');
      else console.log('        ' + body.slice(0, 160));
      fail++;
    }
  }
}

// ── อีเมล ─────────────────────────────────────────────
const key = process.env.RESEND_API_KEY;
const to = process.env.LEAD_NOTIFY_EMAIL;
const from = process.env.LEAD_NOTIFY_FROM || 'LUMAGUARD <onboarding@resend.dev>';

if (!key || !to) {
  console.log('⬜ อีเมล ข้าม — ยังไม่ได้ตั้ง RESEND_API_KEY หรือ LEAD_NOTIFY_EMAIL');
} else {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ from, to: [to], subject: 'ทดสอบแจ้งเตือนลีด | LUMAGUARD', text: msg }),
  });
  if (res.ok) {
    console.log(`✅ อีเมล ส่งถึง ${to} แล้ว (ผู้ส่ง: ${from})`);
    ok++;
  } else {
    const body = await res.text();
    console.log(`❌ อีเมล ล้มเหลว HTTP ${res.status}`);
    if (res.status === 403 && body.includes('testing emails')) {
      console.log('        ที่อยู่ผู้ส่งเป็นของทดสอบ ส่งได้เฉพาะอีเมลเจ้าของบัญชี Resend');
      console.log('        แก้โดยยืนยันโดเมนใน Resend แล้วตั้ง LEAD_NOTIFY_FROM');
    } else if (res.status === 401) {
      console.log('        API key ไม่ถูกต้อง');
    } else {
      console.log('        ' + body.slice(0, 200));
    }
    fail++;
  }
}

console.log(`\nสรุป: สำเร็จ ${ok} | ล้มเหลว ${fail}`);
process.exit(fail > 0 ? 1 : 0);
