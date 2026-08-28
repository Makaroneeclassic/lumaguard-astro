import data from '@/data/car-prices.json';

/**
 * ราคาฟิล์มรถ คิดเหมาต่อคันแยกตามขนาดรถ
 *
 * ต่างจากฟิล์มอาคารที่คิดเป็นบาทต่อตารางฟุตรายรุ่น ฝั่งรถคิดเป็นราคาเดียวต่อ
 * ซีรีส์ต่อขนาดรถ ทุกระดับความเข้มในซีรีส์เดียวกันราคาเท่ากัน จึงเก็บแยกไฟล์
 * แทนที่จะยัดลงคอลัมน์ price ของแต่ละรุ่นซึ่งจะซ้ำกันห้าแถวต่อซีรีส์
 *
 * ปรับปรุงด้วย npm run products:sync ซึ่งดึงจากแท็บ "car price" ในชีตเดียวกัน
 */
export interface CarPrice {
  series: string;
  S: number;
  M: number;
  L: number;
  XL: number;
  /** ค่าติดตั้งซันรูฟ คิดเพิ่มจากราคาตามขนาดรถ */
  sunroof: number;
}

export const CAR_PRICES: CarPrice[] = data as CarPrice[];

/**
 * ขนาดรถที่ใช้คิดราคา
 *
 * `example` คือบรรทัดที่ลูกค้าใช้ตัดสินว่าตัวเองต้องจ่ายคอลัมน์ไหน
 * ตารางราคาที่มีแต่ตัวอักษร S/M/L/XL ลอย ๆ ทำให้คนกดออกไปถามแทนที่จะตัดสินใจเอง
 */
export const CAR_SIZES = [
  { key: 'S', example: 'อีโคคาร์ / ซิตี้คาร์' },
  { key: 'M', example: 'ซีดาน / แฮทช์แบ็ก' },
  { key: 'L', example: 'SUV / กระบะ 4 ประตู' },
  { key: 'XL', example: 'รถตู้ / กระบะแค็บ' },
] as const satisfies ReadonlyArray<{ key: keyof Omit<CarPrice, 'series' | 'sunroof'>; example: string }>;

export const getCarPrice = (seriesDbName: string): CarPrice | undefined =>
  CAR_PRICES.find((c) => c.series === seriesDbName);

export const formatBaht = (n: number): string => `฿${n.toLocaleString('en-US')}`;
