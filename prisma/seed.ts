import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import * as crypto from "crypto";
import bcrypt from "bcryptjs";
import "dotenv/config";

// Setup database connection
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 12);
}

async function main() {
  console.log("Start seeding...");

  // สร้างหรืออัปเดตผู้ดูแลระบบจากค่าใน .env
  const adminEmail = process.env.ADMIN_EMAIL || "admin@lumaguardthailand.com";
  const adminName = process.env.ADMIN_NAME || "Lumaguard Admin";

  // เดิมมีค่าเริ่มต้นเป็น "adminpassword123" ซึ่งอันตราย เพราะถ้าลืมตั้ง
  // ADMIN_PASSWORD จะได้บัญชีแอดมินที่ใช้รหัสผ่านซึ่งเดาได้ทันที
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || adminPassword.length < 12) {
    throw new Error(
      "ต้องตั้ง ADMIN_PASSWORD ในไฟล์ .env และต้องยาวอย่างน้อย 12 ตัวอักษร\n" +
        "สร้างรหัสผ่านได้ด้วย: openssl rand -base64 24",
    );
  }

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashPassword(adminPassword),
      name: adminName,
    },
    create: {
      email: adminEmail,
      password: hashPassword(adminPassword),
      name: adminName,
    },
  });
  console.log(`Admin user seeded/updated: ${adminEmail}`);

  // (บล็อกย้ายไปเก็บเป็น MDX ใน src/content/blog/ แล้ว ไม่ต้อง seed)

  console.log("Seeding finished successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // Close Prisma connection
  });
