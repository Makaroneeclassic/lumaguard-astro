import { SERIES_LIST, lowestPrice } from '@/lib/products';

/**
 * ราคาต่อตารางฟุตของทุกซีรีส์ สำหรับเครื่องประเมินราคา
 *
 * เดิมคืนค่าเฉพาะสามซีรีส์ที่เครื่องคำนวณแสดงอยู่ตอนนั้น พอจะเปลี่ยนว่าจะโชว์
 * ซีรีส์ไหนก็ต้องแก้ทั้งไฟล์นี้และหน้าที่เรียกใช้ทุกหน้า คืนมาให้ครบทุกซีรีส์
 * แล้วให้ฝั่งแสดงผลเลือกเอง จึงเปลี่ยนได้ที่เดียว
 */
export type EstimatorRates = Record<string, number>;

export function getEstimatorRates(): EstimatorRates {
  return Object.fromEntries(SERIES_LIST.map((s) => [s, lowestPrice(s)]));
}
