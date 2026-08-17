import { prisma } from '@/lib/db';

export interface PageSeoOverride {
  title: string;
  description: string;
  noindex: boolean;
}

/**
 * อ่านค่า SEO ต่อหน้าจากตาราง SeoPage เพื่อให้แก้ผ่านหน้า /admin ได้
 *
 * เดิมมีเพียงหน้าแรกที่อ่านค่าจากตารางนี้ อีก 5 หน้าเขียน title ไว้ในโค้ดตรง ๆ
 * ทำให้ฟอร์มแก้ SEO ในหลังบ้านบันทึกได้แต่ไม่มีผลกับหน้าเว็บจริง
 *
 * ค่าที่ส่งเข้ามาเป็น fallback จะถูกใช้เมื่อยังไม่มีแถวใน DB หรือต่อ DB ไม่ได้
 * หน้าเว็บจึงยังมี title/description ที่ถูกต้องเสมอแม้ฐานข้อมูลล่ม
 */
export async function getPageSeo(
  routePath: string,
  fallback: { title: string; description: string },
): Promise<PageSeoOverride> {
  try {
    const row = await prisma.seoPage.findUnique({ where: { routePath } });
    if (row) {
      return {
        title: row.title?.trim() || fallback.title,
        description: row.description?.trim() || fallback.description,
        noindex: row.noindex,
      };
    }
  } catch {
    console.warn(`[seo] อ่านค่า SEO ของ ${routePath} จากฐานข้อมูลไม่ได้ ใช้ค่าสำรองแทน`);
  }

  return { ...fallback, noindex: false };
}
