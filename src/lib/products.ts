import data from '@/data/products.json';
import { SERIES, getSeriesByCategory } from '@/lib/series';

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

/** ชื่อซีรีส์ทั้งหมดที่ระบบรู้จัก เรียงตามลำดับแถวในชีต */
export const SERIES_LIST: string[] = SERIES.map((s) => s.dbName);

export const ALL_PRODUCTS: Product[] = data as Product[];

/** ชื่อซีรีส์เฉพาะหมวดอาคาร — ใช้กับเครื่องมือที่คิดราคาเป็นตารางฟุต */
export const ARCHITECTURAL_SERIES: string[] = getSeriesByCategory('architectural').map(
  (s) => s.dbName,
);

/**
 * สินค้าที่เลือกให้ขึ้นหน้าแรก ถ้าไม่ได้ติ๊กไว้เลยให้ใช้ตัวแรกของแต่ละซีรีส์แทน
 *
 * ทางสำรองจำกัดไว้เฉพาะซีรีส์อาคาร เพราะหน้าแรกทั้งหน้าพูดเรื่องบ้านและคอนโด
 * ถ้าปล่อยให้ไล่ทุกซีรีส์ วันที่เพิ่มฟิล์มรถเข้ามาหน้าแรกจะมีรุ่นรถโผล่ขึ้นมาเอง
 * โดยไม่มีใครสั่ง
 */
export function getHomepageProducts(): Product[] {
  const picked = ALL_PRODUCTS.filter((p) => p.showOnHomepage);
  if (picked.length > 0) return picked;

  return ARCHITECTURAL_SERIES.map((s) => ALL_PRODUCTS.find((p) => p.series === s)).filter(
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

/**
 * ลำดับความพรีเมียมของซีรีส์ เรียงจากราคาถูกไปแพง ใช้ตัดสินว่าตัวไหนคือรุ่นท็อป
 *
 * เทียบเฉพาะภายในหมวดเดียวกัน เพราะราคาฟิล์มอาคารเป็นบาทต่อตารางฟุต
 * ส่วนฟิล์มรถคิดเป็นคัน เอามาเรียงรวมกันจะได้ลำดับที่ไม่มีความหมาย
 */
export function seriesByPrice(list: readonly string[] = ARCHITECTURAL_SERIES): string[] {
  return [...list].sort((a, b) => lowestPrice(a) - lowestPrice(b));
}

/**
 * ตัดรหัสรุ่นออกก่อนส่งข้อมูลให้คอมโพเนนต์ฝั่งเบราว์เซอร์
 *
 * ชื่ออย่าง DNC05 หรือ PNC 35 HD เป็นรหัสที่ใช้คุยกับโรงงาน ไม่ใช่ข้อมูลที่ลูกค้า
 * ใช้ตัดสินใจ ลูกค้าเลือกจากซีรีส์กับระดับความเข้ม การโชว์รหัสจึงเพิ่มความสับสน
 * โดยไม่ได้ช่วยอะไร และเปิดเผยข้อมูลฝั่งซัพพลายเชนโดยไม่จำเป็น
 *
 * ต้องตัดตั้งแต่ตอนส่งข้อมูล ไม่ใช่แค่ซ่อนตอนแสดงผล เพราะ Astro ฝังข้อมูลที่
 * ส่งให้ island ไว้ในแอตทริบิวต์ของหน้าเพื่อใช้ตอน hydrate ถ้าซ่อนแค่ตอนเรนเดอร์
 * รหัสจะยังอ่านได้จากซอร์สอยู่ดี
 */
export function withoutFactoryCodes(list: Product[]): Product[] {
  return list.map((p) => ({ ...p, name: '' }));
}
