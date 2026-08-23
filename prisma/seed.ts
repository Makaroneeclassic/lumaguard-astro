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

  // 1. Seed Admin User
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

  // 2. Seed Global SEO Settings
  const existingGlobalSeo = await prisma.seoGlobal.findUnique({
    where: { id: "global" },
  });

  if (!existingGlobalSeo) {
    await prisma.seoGlobal.create({
      data: {
        id: "global",
        siteName: "LUMAGUARD",
        titleTemplate: "%s | LUMAGUARD Window Film",
        defaultDescription: "Bangkok's premier window film provider. We specialize in high-performance solar control solutions for residential and commercial spaces.",
        defaultOgImage: "/images/og-default.png",
        googleVerificationCode: "g-gsc-verification-code-placeholder",
        googleAnalyticsId: "g-ga4-measurement-id-placeholder",
        robotsTxtDirectives: "User-agent: *\nAllow: /\nSitemap: https://lumaguardthailand.com/sitemap.xml",
        primaryColor: "#0f172a",
        secondaryColor: "#0284c7",
        fontFamily: "Prompt",
        businessAddress: "หลักสี่ กรุงเทพฯ",
        businessPhone: "098-353-9369",
        businessPriceRange: "฿1,100 - ฿3,500 / sq.m.",
        businessMapUri: "https://goo.gl/maps/placeholder",
      },
    });
    console.log("Global SEO settings seeded");
  }

  // 3. Seed Page SEO Settings
  const pagesSeo = [
    {
      routePath: "/",
      pageName: "Home Page",
      title: "ฟิล์มกรองแสงอาคาร บ้าน คอนโด นาโนเซรามิก | LUMAGUARD",
      description: "ติดฟิล์มกรองแสงบ้านและคอนโด ลดความร้อนเข้าห้องสูงสุด 12°C ป้องกันรังสี UV 99.9% ด้วยฟิล์มนาโนเซรามิก LUMAGUARD ประเมินราคาหน้างานฟรี",
      keywords: "ฟิล์มกรองแสงบ้าน, ฟิล์มติดกระจกบ้าน, ฟิล์มกรองแสงคอนโด, ฟิล์มกันความร้อน, ฟิล์มนาโนเซรามิก",
      ogTitle: "ฟิล์มกรองแสงอาคาร บ้าน คอนโด | LUMAGUARD",
      ogDescription: "ลดความร้อนเข้าห้องสูงสุด 12°C ป้องกันรังสี UV 99.9% ด้วยฟิล์มนาโนเซรามิก ประเมินราคาหน้างานฟรี",
    },
    {
      routePath: "/products",
      pageName: "Products Page",
      title: "เทียบสเปกฟิล์มกรองแสง 18 รุ่น 6 ซีรีส์ | LUMAGUARD",
      description: "เปรียบเทียบค่า VLT, IRR, UVR และ TSER ของฟิล์มกรองแสงอาคารครบ 18 รุ่นใน 6 ซีรีส์ Element, Shield, Zenith, Nexus, Apex และ Guardian เลือกรุ่นที่เหมาะกับบ้านคุณ",
      keywords: "สเปกฟิล์มกรองแสง, ค่า TSER, ค่า VLT, เปรียบเทียบฟิล์มกรองแสง, ฟิล์มเซรามิก",
      ogTitle: "เทียบสเปกฟิล์มกรองแสงครบ 18 รุ่น | LUMAGUARD",
      ogDescription: "เปรียบเทียบค่า VLT, IRR, UVR และ TSER ฟิล์มกรองแสงอาคารทั้ง 6 ซีรีส์ พร้อมตารางสเปกละเอียด",
    },
    {
      routePath: "/services",
      pageName: "Services & Installation Process",
      title: "บริการติดตั้งฟิล์มกรองแสง ขั้นตอนงานติดตั้ง | LUMAGUARD",
      description: "ขั้นตอนการติดตั้งฟิล์มกรองแสงอาคารโดยทีมช่างมืออาชีพ ตั้งแต่สำรวจหน้างาน วัดขนาดกระจก ติดตั้งในพื้นที่ควบคุมฝุ่น พร้อมรับประกันคุณภาพงานติดตั้ง",
      keywords: "ติดตั้งฟิล์มกรองแสง, ช่างติดฟิล์มกระจกบ้าน, ขั้นตอนติดฟิล์ม, รับติดฟิล์มอาคาร",
      ogTitle: "บริการติดตั้งฟิล์มกรองแสงโดยทีมมืออาชีพ | LUMAGUARD",
      ogDescription: "ตั้งแต่สำรวจหน้างาน วัดขนาดกระจก จนถึงติดตั้งในพื้นที่ควบคุมฝุ่น พร้อมรับประกันคุณภาพ",
    },
    {
      routePath: "/portfolio",
      pageName: "Portfolio Page",
      title: "ผลงานติดฟิล์มกรองแสง บ้านและคอนโดในกรุงเทพฯ | LUMAGUARD",
      description: "รวมผลงานติดตั้งฟิล์มกรองแสงอาคาร บ้านเดี่ยว คอนโดมิเนียม และอาคารสำนักงานในกรุงเทพฯ ดูภาพงานจริงพร้อมรุ่นฟิล์มที่เลือกใช้ในแต่ละโครงการ",
      keywords: "ผลงานติดฟิล์ม, ติดฟิล์มคอนโด กรุงเทพ, ติดฟิล์มบ้าน, ตัวอย่างงานติดฟิล์ม",
      ogTitle: "ผลงานติดฟิล์มกรองแสงในกรุงเทพฯ | LUMAGUARD",
      ogDescription: "ภาพงานติดตั้งจริงในบ้านเดี่ยว คอนโด และอาคารสำนักงานทั่วกรุงเทพฯ",
    },
    {
      routePath: "/contact",
      pageName: "Contact Us & FAQ Page",
      title: "ติดต่อเรา ขอใบเสนอราคาฟรี | LUMAGUARD",
      description: "ขอใบเสนอราคาติดฟิล์มกรองแสงบ้านและคอนโดฟรี พร้อมบริการประเมินหน้างานในกรุงเทพฯ และปริมณฑล ติดต่อทางโทรศัพท์หรือ LINE Official Account ได้ทุกวัน",
      keywords: "ขอใบเสนอราคาฟิล์มกรองแสง, ติดต่อ LUMAGUARD, ประเมินราคาติดฟิล์มฟรี",
      ogTitle: "ติดต่อเรา ขอใบเสนอราคาฟรี | LUMAGUARD",
      ogDescription: "ประเมินหน้างานและเสนอราคาฟรีในกรุงเทพฯ และปริมณฑล ติดต่อทางโทรศัพท์หรือ LINE",
    },
    {
      routePath: "/blog",
      pageName: "Blog Listing Page",
      title: "บทความฟิล์มกรองแสงอาคาร บ้าน และคอนโด | LUMAGUARD",
      description: "รวมบทความและคู่มือเลือกฟิล์มกรองแสงอาคาร วิธีลดอุณหภูมิห้อง เทคนิคประหยัดค่าไฟ ฟิล์มนิรภัย และความรู้เรื่องฟิล์มนาโนเซรามิกจากทีมวิศวกร",
      keywords: "บทความฟิล์มกรองแสง, วิธีเลือกฟิล์มกรองแสง, ลดความร้อนในบ้าน, ประหยัดค่าแอร์",
      ogTitle: "บทความและคู่มือเลือกฟิล์มกรองแสง | LUMAGUARD",
      ogDescription: "คู่มือเลือกฟิล์มกรองแสงอาคาร วิธีลดอุณหภูมิห้อง และเทคนิคประหยัดค่าไฟ",
    },
  ];

  // ใช้ upsert เพื่อให้รัน seed ซ้ำแล้วค่า SEO อัปเดตตามไฟล์นี้ได้
  // เดิมสร้างเฉพาะตอนยังไม่มีแถว ทำให้แก้ข้อความในไฟล์แล้วรันซ้ำก็ไม่มีผล
  //
  // ข้อควรระวัง: ถ้าภายหลังแก้ค่า SEO ผ่านหน้า /admin แล้วมารัน seed ซ้ำ
  // ค่าที่แก้ไว้จะถูกเขียนทับด้วยค่าในไฟล์นี้
  for (const page of pagesSeo) {
    const data = {
      pageName: page.pageName,
      title: page.title,
      description: page.description,
      keywords: page.keywords,
      ogTitle: page.ogTitle,
      ogDescription: page.ogDescription,
    };

    await prisma.seoPage.upsert({
      where: { routePath: page.routePath },
      update: data,
      create: { routePath: page.routePath, ...data },
    });
    console.log(`Page SEO settings seeded/updated: ${page.routePath}`);
  }

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
