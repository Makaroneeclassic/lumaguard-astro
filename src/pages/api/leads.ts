/**
 * ทางเรียกสำรองของ /api/lead
 *
 * ต้องประกาศ prerender ตรงนี้เป็นค่าคงที่ ห้ามใช้ re-export
 * เพราะ Astro วิเคราะห์ค่านี้ตอน build แบบ static ถ้าเขียนเป็น
 *   export { POST, prerender } from './lead';
 * Astro จะมองไม่เห็นว่าเป็น false แล้วสร้างเป็นไฟล์ static ตาม
 * output: 'static' ผลคือ POST ตอบ 405 และฟอร์มส่งข้อมูลไม่ได้เลย
 */
export const prerender = false;

export { POST } from './lead';
