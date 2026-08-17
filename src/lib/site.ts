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
  // TODO: ยืนยันเบอร์โทรจริงก่อน deploy — ตัวเลขนี้เป็น placeholder
  telephone: "",
  email: "",
  lineOfficialAccount: "@LUMAGUARD",
  lineUrl: "https://line.me/R/ti/p/@LUMAGUARD",
  address: {
    // TODO: เติมเลขที่/ถนน/รหัสไปรษณีย์จริงก่อน deploy
    streetAddress: "",
    addressLocality: "เขตหลักสี่",
    addressRegion: "กรุงเทพมหานคร",
    postalCode: "",
    addressCountry: "TH",
  },
  areaServed: ["กรุงเทพมหานคร", "ปริมณฑล"],
  priceRange: "฿฿",
  sameAs: [] as string[], // TODO: ใส่ URL Facebook / Google Business Profile เมื่อสร้างแล้ว
} as const;

export const absoluteUrl = (path: string): string => new URL(path, SITE_URL).href;
