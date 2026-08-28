import { ARCHITECTURAL_SERIES, lowestPrice } from '@/lib/products';

/**
 * ราคาต่อตารางฟุตของทุกซีรีส์ สำหรับเครื่องประเมินราคา
 *
 * เดิมคืนค่าเฉพาะสามซีรีส์ที่เครื่องคำนวณแสดงอยู่ตอนนั้น พอจะเปลี่ยนว่าจะโชว์
 * ซีรีส์ไหนก็ต้องแก้ทั้งไฟล์นี้และหน้าที่เรียกใช้ทุกหน้า คืนมาให้ครบทุกซีรีส์
 * แล้วให้ฝั่งแสดงผลเลือกเอง จึงเปลี่ยนได้ที่เดียว
 *
 * จำกัดไว้เฉพาะหมวดอาคาร เพราะเครื่องประเมินราคาคิดจากพื้นที่กระจกคูณเรตต่อ
 * ตารางฟุต ส่วนฟิล์มรถขายเป็นคันหรือรายบาน เรตต่อตารางฟุตของมันจึงไม่มีความหมาย
 */
export type EstimatorRates = Record<string, number>;

export function getEstimatorRates(): EstimatorRates {
  return Object.fromEntries(ARCHITECTURAL_SERIES.map((s) => [s, lowestPrice(s)]));
}
