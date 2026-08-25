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
 * CSP บังคับใช้จริงแล้ว
 *
 * ผ่านโหมดรายงานมาก่อนแล้ว ซึ่งจับได้ว่านโยบายรอบแรกลืมเปิดทาง WebAssembly
 * ให้กล่องค้นหา ถ้าเปิดบังคับใช้ตั้งแต่แรกการค้นหาจะพังโดยไม่มีอาการให้เห็น
 * หลังแก้แล้วไล่ตรวจทุกหน้าพร้อมกดใช้งานจริงจนไม่มีรายงานเหลือจึงเปลี่ยนมาบังคับใช้
 *
 * ถ้าวันหน้าเพิ่มบริการภายนอกใหม่ เช่น แชท วิดีโอ หรือเครื่องมือวิเคราะห์อื่น
 * ต้องเพิ่มโดเมนนั้นในนโยบายนี้ก่อน ไม่งั้นเบราว์เซอร์จะบล็อกและใช้งานไม่ได้
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

  'content-security-policy': CSP,
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

/**
 * ให้ redirect รับทั้งแบบมีและไม่มีทับปิดท้าย
 *
 * Astro สร้าง regex ที่ปิดท้ายด้วย $ พอดี เช่น ^/blog/ชื่อบทความ$ ซึ่งไม่ match
 * URL ที่มีทับต่อท้าย และการใส่ทั้งสองรูปแบบใน astro.config ก็ไม่ช่วย เพราะ
 * Astro รวมให้เป็นรายการเดียวกันแล้วเตือนว่าชนกัน
 *
 * ปัญหาคือ canonical ของเว็บใช้แบบมีทับปิดท้าย URL ที่ Google เก็บไปจึงเป็น
 * แบบนั้น ถ้าไม่ครอบให้ คนที่กดจากผลค้นหาจะเจอหน้าไม่พบทั้งที่ตั้ง redirect ไว้แล้ว
 */
let widened = 0;
for (const r of config.routes) {
  if (!r.headers?.Location || !r.src?.endsWith('$')) continue;
  if (r.src.endsWith('/?$')) continue;
  r.src = r.src.replace(/\$$/, '/?$');
  widened++;
}

writeFileSync(CONFIG, JSON.stringify(config, null, 2) + '\n');

if (widened > 0) {
  console.log(`[headers] ขยาย redirect ${widened} รายการให้รับทับปิดท้ายด้วย`);
}

console.log(`[headers] ใส่ security header ${Object.keys(HEADERS).length} ตัวลง ${CONFIG}`);
Object.keys(HEADERS).forEach((h) => console.log(`  ${h}`));
