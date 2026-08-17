import { defineConfig } from "prisma/config";
import "dotenv/config";

/**
 * ตั้งค่าฝั่ง Prisma CLI (db push, migrate, seed)
 *
 * Prisma 7 ถอด `url` ออกจากไฟล์ schema แล้ว คำสั่ง CLI จึงอ่าน connection URL
 * จากที่นี่แทน ส่วนตอนแอปทำงานจริงจะต่อผ่าน driver adapter ใน src/lib/db.ts
 *
 * ใช้ DIRECT_URL (session pooler พอร์ต 5432) สำหรับงาน DDL เพราะ transaction
 * pooler (6543) รันคำสั่งสร้าง/แก้ตารางไม่ได้
 *
 * อ่านจาก process.env ตรง ๆ แทน env() ของ Prisma เพราะ env() จะ throw ทันที
 * เมื่อไม่พบตัวแปร ทำให้เขียน fallback ไม่ได้
 */
const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    "ต้องตั้ง DIRECT_URL หรือ DATABASE_URL ในไฟล์ .env ก่อนรันคำสั่งของ Prisma\n" +
      "ดู connection string ได้ที่ Supabase → ปุ่ม Connect → แท็บ ORM → Prisma",
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: { url },
  migrations: {
    seed: "npx tsx prisma/seed.ts",
  },
});
