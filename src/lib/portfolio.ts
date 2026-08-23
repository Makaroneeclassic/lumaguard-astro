import data from '@/data/portfolio.json';

/**
 * ผลงานติดตั้ง — แหล่งเดียวของทั้งเว็บ
 *
 * เดิมอ่านจากตาราง PortfolioItem แล้วถอยไปใช้ค่าที่เขียนไว้ในหน้า index กับ
 * หน้า portfolio เมื่อต่อฐานข้อมูลไม่ได้ ซึ่งสองชุดนั้นไม่ตรงกันอยู่แล้ว
 * และไม่มีทางแก้ข้อมูลในฐานข้อมูลได้เลยเพราะหลังบ้านไม่มีหน้าจัดการผลงาน
 *
 * ย้ายมาเป็นไฟล์ใน git แบบเดียวกับสินค้าและบทความ ตรวจทานผ่าน diff ได้
 * ย้อนกลับได้ และไม่ต้องพึ่งฐานข้อมูลตอน build
 */
export interface PortfolioItem {
  id: string;
  title: string;
  location: string;
  category: string;
  image: string;
  altText: string;
  seriesUsed: string;
  areaSize: string;
  description: string;
}

export const ALL_PORTFOLIO: PortfolioItem[] = data as PortfolioItem[];

/** ผลงานล่าสุดสำหรับหน้าแรก ซึ่งแสดงแค่บางส่วน */
export function getFeaturedPortfolio(limit = 2): PortfolioItem[] {
  return ALL_PORTFOLIO.slice(0, limit);
}
