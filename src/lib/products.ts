import data from '@/data/products.json';

/**
 * แหล่งข้อมูลสินค้าแหล่งเดียวของทั้งเว็บ
 *
 * เดิมข้อมูลสินค้าอยู่สองที่พร้อมกัน คือตาราง Product ในฐานข้อมูล กับค่าคงที่
 * ALL_PRODUCTS_DATA ที่ฝังไว้ในคอมโพเนนต์ตารางเปรียบเทียบ หน้าเว็บอ่านจาก
 * ฐานข้อมูลก่อนแล้วถอยไปใช้ค่าคงที่เมื่อต่อไม่ได้ สองชุดนี้จึงเพี้ยนจากกัน
 * ได้เรื่อย ๆ โดยไม่มีใครรู้ ตอนตรวจพบ ราคาต่างกันสี่ซีรีส์จากหกซีรีส์
 * และซีรีส์ Guardian สลับกันคนละทาง ส่วนชื่อรุ่นที่ลูกค้าเห็นบนเว็บก็เป็น
 * ชื่อชั่วคราวอย่าง "Element Series 5%" แทนรหัสรุ่นจริงอย่าง "DNC05"
 *
 * ย้ายมาเก็บเป็นไฟล์เดียวใน git แทน ข้อมูลจึงตรวจทานได้ผ่าน diff ย้อนกลับได้
 * และไม่ต้องพึ่งฐานข้อมูลตอน build ปรับปรุงด้วย npm run products:sync
 * ซึ่งดึงจาก Google Sheet มาเขียนทับไฟล์นี้ แบบเดียวกับที่บทความทำอยู่
 */

export interface Product {
  id: string;
  name: string;
  series: string;
  technology: string;
  vlt: string;
  uvr: string;
  irr: string;
  irr2: string;
  tser: string;
  thickness?: string;
  price?: string;
  showOnHomepage?: boolean;
  isPopular?: boolean;
}

export const SERIES_LIST = ['Element', 'Shield', 'Zenith', 'Nexus', 'Apex', 'Guardian'] as const;

export const ALL_PRODUCTS: Product[] = data as Product[];

/** สินค้าที่เลือกให้ขึ้นหน้าแรก ถ้าไม่ได้ติ๊กไว้เลยให้ใช้ตัวแรกของแต่ละซีรีส์แทน */
export function getHomepageProducts(): Product[] {
  const picked = ALL_PRODUCTS.filter((p) => p.showOnHomepage);
  if (picked.length > 0) return picked;

  return SERIES_LIST.map((s) => ALL_PRODUCTS.find((p) => p.series === s)).filter(
    (p): p is Product => Boolean(p),
  );
}

export function getProductsBySeries(series: string): Product[] {
  return ALL_PRODUCTS.filter((p) => p.series.toLowerCase() === series.toLowerCase());
}

/** ราคาใน Sheet อาจมีจุลภาคหรือคำว่าบาทติดมา ตัดให้เหลือแต่ตัวเลขก่อนคำนวณ */
export const parsePrice = (value: unknown): number =>
  Number(String(value ?? '').replace(/[^\d.]/g, ''));

/** ราคาต่ำสุดของซีรีส์ ใช้เป็นราคาเริ่มต้นที่ลูกค้าจ่ายจริง */
export function lowestPrice(series: string): number {
  const prices = getProductsBySeries(series)
    .map((p) => parsePrice(p.price))
    .filter((n) => Number.isFinite(n) && n > 0);
  return prices.length ? Math.min(...prices) : 0;
}

/** ชื่อเทคโนโลยีของซีรีส์ ดึงจากสินค้ารุ่นแรกของซีรีส์นั้น */
export function technologyOf(series: string): string {
  return getProductsBySeries(series)[0]?.technology ?? '';
}

/** ลำดับความพรีเมียมของซีรีส์ เรียงจากราคาถูกไปแพง ใช้ตัดสินว่าตัวไหนคือรุ่นท็อป */
export function seriesByPrice(): string[] {
  return [...SERIES_LIST].sort((a, b) => lowestPrice(a) - lowestPrice(b));
}
