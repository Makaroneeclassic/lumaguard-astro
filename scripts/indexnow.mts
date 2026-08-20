/**
 * แจ้ง IndexNow ว่ามีหน้าใหม่หรือหน้าที่เพิ่งแก้
 *
 * Bing และ Yandex รองรับ ส่วน Google ไม่รองรับ จึงไม่ช่วยเรื่องอันดับใน Google
 * แต่ทำให้ Bing เก็บข้อมูลเร็วขึ้นมากโดยไม่มีค่าใช้จ่ายและไม่กระทบหน้าเว็บ
 *
 * Google ปิด endpoint สำหรับ ping sitemap ไปตั้งแต่ปี 2023 และ Indexing API
 * ใช้ได้เฉพาะ JobPosting กับ BroadcastEvent จึงไม่มีวิธีแจ้ง Google โดยตรง
 * สำหรับหน้าทั่วไป ต้องรอให้กลับมาเก็บเอง
 *
 * ใช้งาน: npm run indexnow            ส่งทุก URL ใน sitemap
 *         npm run indexnow -- /blog/x  ส่งเฉพาะที่ระบุ
 */
import 'dotenv/config';

const HOST = 'lumaguardthailand.com';
/**
 * กุญแจ IndexNow ไม่ใช่ความลับ ตัวมาตรฐานกำหนดให้เผยแพร่ไว้ที่
 * https://โดเมน/<key>.txt เพื่อพิสูจน์ว่าเราคุมโดเมนนั้นจริง ใครก็เปิดอ่านได้
 * จึงเก็บไว้ในโค้ดให้ตรงกับไฟล์ใน public/ ไม่ต้องตั้ง secret ซ้ำอีกที่
 */
const KEY = process.env.INDEXNOW_KEY ?? "bceebc4241e8ec1f0bcd87418484b88b";

const explicit = process.argv.slice(2).filter((a) => a.startsWith('/'));

async function urlsFromSitemap(): Promise<string[]> {
  const res = await fetch(`https://${HOST}/sitemap-0.xml`);
  if (!res.ok) throw new Error(`ดึง sitemap ไม่สำเร็จ (HTTP ${res.status})`);
  return [...(await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

const urlList = explicit.length
  ? explicit.map((p) => `https://${HOST}${p}`)
  : await urlsFromSitemap();

console.log(`ส่ง ${urlList.length} URL ไปยัง IndexNow`);

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({
    host: HOST,
    key: KEY,
    keyLocation: `https://${HOST}/${KEY}.txt`,
    urlList,
  }),
});

// 200 คือรับแล้ว ส่วน 202 คือรับไว้แต่ยังตรวจกุญแจไม่เสร็จ ทั้งคู่ถือว่าสำเร็จ
if (res.status === 200 || res.status === 202) {
  console.log(`สำเร็จ (HTTP ${res.status})`);
} else {
  console.error(`ล้มเหลว HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  process.exit(1);
}
