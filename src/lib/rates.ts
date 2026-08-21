import { lowestPrice } from '@/lib/products';

/**
 * ราคาต่อตารางเมตรที่เครื่องประเมินราคาใช้
 *
 * เดิมอ่านจากตาราง Product แล้วถอยไปใช้ค่าคงที่ในคอมโพเนนต์เมื่อต่อฐานข้อมูล
 * ไม่ได้ ซึ่งสองชุดนั้นเพี้ยนจากกันอยู่จริง ราคาที่ลูกค้าเห็นจึงขึ้นกับว่า
 * ตอน build ต่อฐานข้อมูลติดหรือไม่ ตอนนี้ข้อมูลสินค้าอยู่ในไฟล์เดียวใน git
 * แล้ว จึงไม่ต้องมีค่าสำรองและไม่ต้องเป็นฟังก์ชัน async อีก
 */
export interface EstimatorRates {
  element: number;
  guardian: number;
  apex: number;
}

export function getEstimatorRates(): EstimatorRates {
  return {
    element: lowestPrice('Element'),
    guardian: lowestPrice('Guardian'),
    apex: lowestPrice('Apex'),
  };
}
