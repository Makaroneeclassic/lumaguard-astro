/**
 * ใส่ security header ลงในไฟล์กำหนดเส้นทางที่ Vercel ใช้จริง
 *
 * อะแดปเตอร์ของ Astro เขียน .vercel/output/config.json ตามรูปแบบ Build Output API
 * ซึ่งเป็นตัวคุมเส้นทางทั้งหมด ไฟล์ vercel.json ที่รากโปรเจกต์จึงไม่มีผลกับ
 * header ในโหมดนี้ ต้องเพิ่มเป็น route ที่มี continue เป็นจริงไว้บนสุดแทน
 * เพื่อให้ header ติดไปกับทุกคำขอแล้วปล่อยให้เส้นทางถัดไปทำงานต่อตามปกติ
 *
 * รันต่อท้าย astro build ผ่าน npm script
 */

import { readFileSync, writeFileSync } from 'node:fs';

const CONFIG = '.vercel/output/config.json';

/**
 * CSP ตั้งเป็นโหมดรายงานอย่างเดียวก่อน
 *
 * เว็บมี inline script แปดก้อน ทั้งแบนเนอร์ขอความยินยอม กล่องค้นหา เมนูมือถือ
 * และการตั้งค่า GA4 ถ้าเปิดบังคับใช้ทันทีแล้วมีอะไรพลาด GA4 จะหยุดเก็บข้อมูล
 * เงียบ ๆ โดยไม่มีใครรู้ตัวหลายวัน โหมดรายงานจะบอกว่าอะไรจะถูกบล็อกโดยไม่บล็อกจริง
 *
 * เมื่อยืนยันว่าไม่มีอะไรพังแล้วค่อยเปลี่ยนชื่อ header เป็น Content-Security-Policy
 *
 * unsafe-inline จำเป็นเพราะหน้าเว็บสร้างตอน build จึงใส่ nonce รายคำขอไม่ได้
 * ทำให้ CSP กัน XSS ได้ไม่เต็ม แต่ยังกันการโหลดสคริปต์จากโดเมนแปลกปลอมได้อยู่
 * ซึ่งเป็นด่านที่มีค่าที่สุดสำหรับเว็บที่ไม่มีเนื้อหาจากผู้ใช้
 */
const CSP = [
  "default-src 'self'",
  // wasm-unsafe-eval จำเป็นเพราะกล่องค้นหาใช้ Pagefind ซึ่งรันดัชนีด้วย
  // WebAssembly ถ้าไม่เปิดไว้ การค้นหาจะเงียบไปเฉย ๆ โดยไม่มีอาการให้เห็น
  // และตรวจไม่พบตอนเปิดหน้าเว็บเฉย ๆ เพราะ Pagefind โหลดเมื่อกดค้นหาเท่านั้น
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self'",
  "connect-src 'self' https://*.google-analytics.com https://*.googletagmanager.com https://*.analytics.google.com",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join('; ');

const HEADERS = {
  // ห้ามเบราว์เซอร์เดาชนิดไฟล์เอง ไฟล์ที่หน้าตาเหมือนรูปแต่ข้างในเป็นสคริปต์
  // จะไม่ถูกนำไปรันโดยบังเอิญ
  'x-content-type-options': 'nosniff',

  // กัน clickjacking คือการที่เว็บอื่นฝังหน้าเราแบบโปร่งใสไว้บนหน้าปลอม
  // แล้วหลอกให้ผู้ใช้กดปุ่มในหน้าเราโดยไม่รู้ตัว
  'x-frame-options': 'SAMEORIGIN',

  // เดิมเมื่อกดลิงก์ออกไปเว็บอื่น ปลายทางจะเห็นเส้นทางเต็มที่เรามาจาก
  // รวมถึง /admin ซึ่งเป็นการบอกใบ้ว่าหลังบ้านอยู่ที่ไหน
  'referrer-policy': 'strict-origin-when-cross-origin',

  // เว็บไม่ได้ใช้กล้อง ไมค์ หรือตำแหน่ง จึงปิดไปเลยเพื่อไม่ให้สคริปต์
  // ที่อาจถูกแทรกเข้ามาในอนาคตขอสิทธิ์เหล่านี้ได้
  'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=()',

  'content-security-policy-report-only': CSP,
};

const config = JSON.parse(readFileSync(CONFIG, 'utf8'));

// ลบของเดิมก่อนถ้ามี เพื่อให้รันซ้ำได้โดยไม่เกิดรายการซ้อน
//
// ดูจาก header ที่เราใส่เองแทนการติดธงพิเศษไว้ในรายการ เพราะ Vercel ตรวจ
// รูปแบบของไฟล์นี้ตาม schema ที่กำหนดไว้ การใส่ property ที่ไม่รู้จักลงไป
// ทำให้ทั้งรายการถูกมองข้ามและ header ไม่ถูกส่งออกมาเลยโดยไม่มีข้อความแจ้ง
config.routes = config.routes.filter((r) => !r.headers?.['x-frame-options']);

// รูปแบบ src ต้องยึดตามที่อะแดปเตอร์ใช้อยู่คือ regex ที่ปิดหัวปิดท้าย
config.routes.unshift({
  src: '^/(.*)$',
  headers: HEADERS,
  continue: true,
});

writeFileSync(CONFIG, JSON.stringify(config, null, 2) + '\n');

console.log(`[headers] ใส่ security header ${Object.keys(HEADERS).length} ตัวลง ${CONFIG}`);
Object.keys(HEADERS).forEach((h) => console.log(`  ${h}`));
