import { prisma } from '@/lib/db';
import { ALL_PRODUCTS_DATA } from '@/components/ProductMatrix';

/**
 * ราคาต่อตารางเมตรที่เครื่องประเมินราคาใช้
 *
 * เดิมเรตถูกฝังไว้ในตัว component ไม่ได้ดึงจากฐานข้อมูล ทำให้ราคาที่แสดง
 * ในเครื่องคำนวณกับในหน้าสินค้าต่างกันเกือบสามเท่า และการแก้ราคาผ่าน
 * หลังบ้านก็ไม่มีผลกับเครื่องคำนวณเลย ลูกค้าจึงเห็นตัวเลขคนละชุดกัน
 *
 * ดึงจากตาราง Product ที่เดียว ถ้าต่อฐานข้อมูลไม่ได้จึงถอยไปใช้ชุดข้อมูล
 * เดียวกับที่หน้าสินค้าใช้เป็นค่าสำรอง ทั้งสองที่จะได้ไม่ขัดกันไม่ว่ากรณีใด
 */
export interface EstimatorRates {
  element: number;
  guardian: number;
  apex: number;
}

/** ราคาใน DB เก็บเป็นข้อความที่มีเครื่องหมายคั่นหลักพัน เช่น "1,800" */
const parsePrice = (value: unknown): number =>
  Number(String(value ?? '').replace(/[^\d.]/g, ''));

/** ราคาต่ำสุดของซีรีส์นั้น ใช้เป็นราคาเริ่มต้นที่ลูกค้าจ่ายจริง */
function lowestPrice(items: Array<{ series: string; price?: string | null }>, series: string): number {
  const prices = items
    .filter((p) => p.series === series)
    .map((p) => parsePrice(p.price))
    .filter((n) => Number.isFinite(n) && n > 0);
  return prices.length ? Math.min(...prices) : 0;
}

export async function getEstimatorRates(): Promise<EstimatorRates> {
  let source: Array<{ series: string; price?: string | null }> = [];

  try {
    source = await prisma.product.findMany({ select: { series: true, price: true } });
  } catch {
    console.warn('[rates] ต่อฐานข้อมูลไม่ได้ ใช้ราคาสำรองชุดเดียวกับหน้าสินค้า');
  }

  if (source.length === 0) source = ALL_PRODUCTS_DATA;

  const rates = {
    element: lowestPrice(source, 'Element'),
    guardian: lowestPrice(source, 'Guardian'),
    apex: lowestPrice(source, 'Apex'),
  };

  // ถ้าซีรีส์ไหนไม่มีราคาเลย ให้ถอยไปใช้ชุดสำรองเฉพาะตัวนั้น
  // ดีกว่าปล่อยให้เครื่องคำนวณแสดงศูนย์บาท
  for (const key of ['element', 'guardian', 'apex'] as const) {
    if (!rates[key]) {
      rates[key] = lowestPrice(ALL_PRODUCTS_DATA, key[0].toUpperCase() + key.slice(1));
    }
  }

  return rates;
}
