/**
 * Cluster ของเนื้อหา — ทุกบทความต้องสังกัด cluster เดียว
 *
 * โครงตาม topical map ของ LumaGuard: ฟิล์มอาคารเป็นแกนหลัก
 * และ PPF รถยนต์เป็นสายเสริม การบังคับเป็น enum ทำให้เพิ่ม cluster ใหม่
 * ต้องตั้งใจ ไม่ใช่พิมพ์ผิดแล้วเกิด cluster ใหม่โดยไม่รู้ตัว
 *
 * แยกออกมาจาก content.config.ts เพราะฟอร์มใน /admin/blog (โค้ดฝั่ง
 * เบราว์เซอร์) ต้องใช้รายการนี้ด้วย แต่ import content.config ตรง ๆ ไม่ได้
 * เนื่องจากไฟล์นั้นดึง astro/loaders ซึ่งเป็นโค้ดฝั่ง Node เท่านั้น
 */
export const CLUSTERS = [
  'architectural-film',   // ฟิล์มอาคาร/บ้าน/คอนโด — pillar หลัก
  'energy-saving',        // ลดความร้อน ประหยัดค่าไฟ
  'safety-security',      // ฟิล์มนิรภัย กันกระจกแตก
  'privacy',              // ฟิล์มฝ้า ทึบแสง
  'film-technology',      // นาโนเซรามิก ค่า VLT/TSER/IRR สเปกฟิล์ม
  'ppf-automotive',       // ฟิล์มใสกันรอยรถยนต์ — สายเสริม
  'care-maintenance',     // ดูแลรักษา ปัญหาหลังติดตั้ง
] as const;

export type Cluster = (typeof CLUSTERS)[number];
