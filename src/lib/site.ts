/**
 * ข้อมูลธุรกิจศูนย์กลาง — ใช้กับ JSON-LD, robots.txt, sitemap และ footer
 *
 * NAP (Name/Address/Phone) ต้องตรงกันเป๊ะทุกที่ ทั้งบนเว็บ Google Business Profile
 * และไดเรกทอรีอื่น ไม่งั้น Local SEO จะอ่อนลง จึงรวมไว้ที่เดียว
 */

export const SITE_URL = "https://lumaguardthailand.com";

export const BUSINESS = {
  name: "LUMAGUARD",
  legalName: "LUMAGUARD Thailand",
  description:
    "ผู้ผลิตและติดตั้งฟิล์มกรองแสงอาคาร บ้าน คอนโด และฟิล์มใสกันรอยรถยนต์ (PPF) เทคโนโลยีนาโนเซรามิก",

  /** รูปแบบ E.164 สำหรับ schema.org — ตัด 0 นำหน้าออกแล้วใส่รหัสประเทศ */
  telephone: "+66983539369",
  /** รูปแบบที่ใช้แสดงบนหน้าเว็บและใน tel: link */
  telephoneDisplay: "098-353-9369",

  email: "",
  /**
   * บัญชี LINE ที่ลูกค้าใช้ติดต่อ
   *
   * ข้อความที่แสดงกับปลายทางของลิงก์แยกกันโดยตั้งใจ เพราะยังไม่ได้ซื้อ
   * Premium ID จึงแสดงชื่อที่ต้องการไว้ก่อน แต่ลิงก์ต้องชี้ไอดีจริงไม่งั้น
   * กดแล้วเจอหน้า 404
   *
   * เมื่อซื้อ @lumaguard สำเร็จแล้ว ให้แก้ lineId เป็น @lumaguard
   * แล้วสองค่านี้จะตรงกันเอง
   *
   * หมายเหตุ: บัญชี @541sdiuc เป็นบัญชีสำหรับแจ้งเตือนทีมงานภายใน
   * คนละบัญชีกับที่ลูกค้าติดต่อ และไม่ควรนำมาแสดงบนหน้าเว็บ
   */
  lineId: "@585kyyhj",
  lineOfficialAccount: "@lumaguard",
  lineUrl: "https://line.me/R/ti/p/@585kyyhj",

  address: {
    // TODO: เติมเลขที่และถนนเมื่อพร้อม — Google Business Profile ต้องใช้ที่อยู่เต็ม
    streetAddress: "",
    addressLocality: "เขตหลักสี่",
    addressRegion: "กรุงเทพมหานคร",
    // รหัสไปรษณีย์ของเขตหลักสี่ — รบกวนยืนยันอีกครั้งว่าตรงกับที่ตั้งจริง
    postalCode: "10210",
    addressCountry: "TH",
  },

  areaServed: ["กรุงเทพมหานคร", "ปริมณฑล"],
  priceRange: "฿฿",
  sameAs: [] as string[], // TODO: ใส่ URL Facebook / Google Business Profile เมื่อสร้างแล้ว
} as const;

export const absoluteUrl = (path: string): string => new URL(path, SITE_URL).href;
