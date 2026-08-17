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
      title: "LUMAGUARD | Advanced Window Film Solutions Bangkok",
      description: "Enjoy natural light without the intense heat. Reduce indoor temperature by up to 12°C with our advanced nano-ceramic window films.",
      keywords: "window film, solar control, heat rejection, uv protection, bangkok window film, ceramic film",
      ogTitle: "LUMAGUARD | Advanced Window Film Solutions",
      ogDescription: "Enjoy natural light without the intense heat. Reduce indoor temperature by up to 12°C with our advanced nano-ceramic window films.",
    },
    {
      routePath: "/products",
      pageName: "Products Page",
      title: "Product Comparison & Specs | LUMAGUARD Window Films",
      description: "Compare our window film series: Element Carbon, Guardian Ceramic, and Apex Multi-Layer Sputtered. Find the perfect fit for your home or office.",
      keywords: "element carbon, guardian ceramic, apex sputter, window film specs, tser, irr",
      ogTitle: "Product Comparison & Performance Matrix | LUMAGUARD",
      ogDescription: "Compare our window film series: Element Carbon, Guardian Ceramic, and Apex Sputtered. Detailed technical data sheets.",
    },
    {
      routePath: "/services",
      pageName: "Services & Installation Process",
      title: "Our Services & Precision Installation Process | LUMAGUARD",
      description: "Learn about our professional installation workflow, from site survey and laser measurements to dust-controlled application and digital warranty.",
      keywords: "installation process, site survey, laser measurement, digital warranty, window film service",
      ogTitle: "Professional Window Film Installation Process | LUMAGUARD",
      ogDescription: "Learn about our professional installation workflow, from site survey and laser measurements to dust-controlled application.",
    },
    {
      routePath: "/portfolio",
      pageName: "Portfolio Page",
      title: "Bangkok Project Portfolio | LUMAGUARD Window Films",
      description: "Explore our premium window film installations across Bangkok's finest residences, condos in Sukhumvit, and commercial offices.",
      keywords: "portfolio, bangkok condo installation, luxury estate tinting, window film case studies",
      ogTitle: "Bangkok Project Portfolio | LUMAGUARD",
      ogDescription: "Explore our premium window film installations across Bangkok's finest residences, condos, and commercial offices.",
    },
    {
      routePath: "/contact",
      pageName: "Contact Us & FAQ Page",
      title: "Contact & FAQ Support | LUMAGUARD Window Films",
      description: "Get a free quote and on-site demonstration in Bangkok. Find answers to common questions about window film maintenance, warranty, and tech specs.",
      keywords: "contact lumaguard, free quote bangkok, window film faq, warranty, window film care",
      ogTitle: "Contact & Technical FAQ Support | LUMAGUARD",
      ogDescription: "Get a free quote and on-site demonstration in Bangkok. Find answers to common questions about window film maintenance and warranty.",
    },
    {
      routePath: "/blog",
      pageName: "Blog Listing Page",
      title: "Insights & Energy Efficiency Blog | LUMAGUARD",
      description: "Read our latest articles on home comfort, solar heat reduction science, energy savings, privacy technology, and modern architecture.",
      keywords: "blog, energy saving tips, window tinting guide, home comfort, uv protection insights",
      ogTitle: "Insights & Energy Efficiency Blog | LUMAGUARD",
      ogDescription: "Read our latest articles on home comfort, solar heat reduction science, energy savings, privacy technology, and modern architecture.",
    },
  ];

  for (const page of pagesSeo) {
    const existingPageSeo = await prisma.seoPage.findUnique({
      where: { routePath: page.routePath },
    });

    if (!existingPageSeo) {
      await prisma.seoPage.create({
        data: {
          routePath: page.routePath,
          pageName: page.pageName,
          title: page.title,
          description: page.description,
          keywords: page.keywords,
          ogTitle: page.ogTitle,
          ogDescription: page.ogDescription,
        },
      });
      console.log(`Page SEO settings seeded for: ${page.routePath}`);
    }
  }

  // (บล็อกย้ายไปเก็บเป็น MDX ใน src/content/blog/ แล้ว ไม่ต้อง seed)

  // 5. Seed Portfolio Items
  const portfolioItems = [
    {
      title: "The Monument Thong Lo",
      location: "Thong Lo, Bangkok",
      category: "condo",
      image: "/images/gallery/portfolio-monument-thonglo.webp",
      altText: "Luxury condo penthouse Thong Lo floor to ceiling windows",
      seriesUsed: "Apex Sputter 20",
      areaSize: "45 m²",
      description: "Sleek multi-layer sputtered film application on floor-to-ceiling double-glazed panels, achieving 76% TSER while preserving panoramic city views at sunset.",
    },
    {
      title: "Santi Pura Residence",
      location: "Bang Na, Bangkok",
      category: "house",
      image: "/images/gallery/portfolio-santipura-residence.webp",
      altText: "Modern tropical villa Bang Na with large pool windows",
      seriesUsed: "Guardian Ceramic 70",
      areaSize: "180 m²",
      description: "Complete architectural protection of a modern tropical villa, reducing solar heat gain without altering the visual facade of the glass.",
    },
    {
      title: "Park Origin Phrom Phong",
      location: "Sukhumvit 24, Bangkok",
      category: "condo",
      image: "/images/gallery/portfolio-park-origin-phrom-phong.webp",
      altText: "Bedroom windows with night vision film overlooking Sukhumvit",
      seriesUsed: "Guardian Ceramic 35",
      areaSize: "32 m²",
      description: "Installation in dual master bedrooms, providing privacy and significant glare reduction during bright morning hours.",
    },
  ];

  for (const item of portfolioItems) {
    const existingItem = await prisma.portfolioItem.findFirst({
      where: { title: item.title },
    });

    if (!existingItem) {
      await prisma.portfolioItem.create({
        data: item,
      });
      console.log(`Portfolio item seeded: ${item.title}`);
    }
  }

  // 6. Seed Testimonials
  const testimonials = [
    {
      authorName: "Khun Somchai R.",
      role: "Lumpini Suite Owner",
      content: "The temperature difference was immediate. My living room finally feels usable during the hot Bangkok afternoons.",
      rating: 5,
      isFeatured: true,
    },
    {
      authorName: "Sarah Williams",
      role: "Architectural Consultant",
      content: "Installation was clean, fast, and professional. The Apex series maintains our view perfectly while blocking all the heat.",
      rating: 5,
      isFeatured: true,
    },
    {
      authorName: "Khun Pattama",
      role: "Private Estate Homeowner",
      content: "Excellent service from site survey to installation. I’ve recommended LUMAGUARD to all my neighbors.",
      rating: 5,
      isFeatured: true,
    },
  ];

  for (const t of testimonials) {
    const existingT = await prisma.testimonial.findFirst({
      where: { authorName: t.authorName },
    });

    if (!existingT) {
      await prisma.testimonial.create({
        data: t,
      });
      console.log(`Testimonial seeded: ${t.authorName}`);
    }
  }

  // 7. Seed Products
  console.log("Cleaning existing products...");
  await prisma.product.deleteMany({});

  const products = [
    // Element Series
    {
      name: "Element Series 5%",
      series: "Element",
      vlt: "5%",
      irr: "70%",
      irr2: "75%",
      uvr: "99%",
      tser: "62%",
      technology: "Ceramic Film",
      thickness: "2MIL (50 micron)",
      description: "ฟิล์มเซรามิคกันความร้อนคุณภาพระดับมาตรฐาน ดำเข้มสนิทจากภายนอก ให้ความเป็นส่วนตัวสูง สัญญาณผ่านได้สะดวก",
      price: "1,100",
    },
    {
      name: "Element Series 15%",
      series: "Element",
      vlt: "15%",
      irr: "70%",
      irr2: "75%",
      uvr: "99%",
      tser: "58%",
      technology: "Ceramic Film",
      thickness: "2MIL (50 micron)",
      description: "ฟิล์มเซรามิคกันความร้อนคุณภาพระดับมาตรฐาน ความเข้มปานกลาง สบายตา สัญญาณผ่านได้สะดวก",
      price: "1,100",
    },
    {
      name: "Element Series 35%",
      series: "Element",
      vlt: "35%",
      irr: "70%",
      irr2: "75%",
      uvr: "99%",
      tser: "52%",
      technology: "Ceramic Film",
      thickness: "2MIL (50 micron)",
      description: "ฟิล์มเซรามิคใสสว่างนวลตา ขับขี่สบายใจทั้งกลางวันและกลางคืน ป้องกันความร้อนสะสมดีเยี่ยม",
      price: "1,100",
    },
    // Shield Series
    {
      name: "Shield Series 5%",
      series: "Shield",
      vlt: "5%",
      irr: "90%",
      irr2: "90%",
      uvr: "99%",
      tser: "68%",
      technology: "Nano Ceramic film",
      thickness: "2MIL (50 micron)",
      description: "ฟิล์มนาโนเซรามิคระดับพรีเมียม ป้องกันรังสีความร้อนอินฟราเรดสูงถึง 90% ให้ความมืดเป็นส่วนตัวและทัศนวิสัยส่องสว่างชัดเจนจากภายใน",
      price: "1,500",
    },
    {
      name: "Shield Series 20%",
      series: "Shield",
      vlt: "20%",
      irr: "90%",
      irr2: "90%",
      uvr: "99%",
      tser: "62%",
      technology: "Nano Ceramic film",
      thickness: "2MIL (50 micron)",
      description: "ฟิล์มนาโนเซรามิคความเข้มระดับเป็นส่วนตัวกลาง ป้องกันความร้อนได้ดีเยี่ยม ทัศนวิสัยเคลียร์ระดับ HD",
      price: "1,500",
    },
    {
      name: "Shield Series 35%",
      series: "Shield",
      vlt: "35%",
      irr: "90%",
      irr2: "90%",
      uvr: "99%",
      tser: "56%",
      technology: "Nano Ceramic film",
      thickness: "2MIL (50 micron)",
      description: "ฟิล์มนาโนเซรามิคใสสว่างนุ่มตา ป้องกันความร้อนสูง ให้ความรู้สึกโล่งสบาย สบายผิวสูงสุด",
      price: "1,500",
    },
    // Zenith Series
    {
      name: "Zenith Series 7%",
      series: "Zenith",
      vlt: "7%",
      irr: "90%",
      irr2: "93%",
      uvr: "99%",
      tser: "73%",
      technology: "Premium Nano Ceramic Film",
      thickness: "2MIL (50 micron)",
      description: "ฟิล์มระดับพรีเมียมสูงสุดด้วยอนุภาคนาโนเซรามิคหนาแน่นพิเศษ บล็อกอินฟราเรดช่วงคลื่นกว้างได้สูงสุด ให้โทนสีสวยงามและทนทานเป็นพิเศษ",
      price: "2,000",
    },
    {
      name: "Zenith Series 20%",
      series: "Zenith",
      vlt: "20%",
      irr: "90%",
      irr2: "93%",
      uvr: "99%",
      tser: "71%",
      technology: "Premium Nano Ceramic Film",
      thickness: "2MIL (50 micron)",
      description: "ฟิล์มระดับพรีเมียมพิเศษสำหรับคอนโดและบ้านหรู ทัศนวิสัยภายในสว่างเป็นธรรมชาติ ภายนอกมืดสงบเป็นส่วนตัว",
      price: "2,000",
    },
    {
      name: "Zenith Series 35%",
      series: "Zenith",
      vlt: "35%",
      irr: "90%",
      irr2: "93%",
      uvr: "99%",
      tser: "65%",
      technology: "Premium Nano Ceramic Film",
      thickness: "2MIL (50 micron)",
      description: "ฟิล์มใสสว่างระดับพรีเมียมเคลียร์วิชั่น ให้ความใสเคลียร์พิเศษ ลดความร้อนสูงโดยไม่เปลี่ยนสีของกระจกเดิม",
      price: "2,000",
    },
    // Nexus Series
    {
      name: "Nexus Series 7%",
      series: "Nexus",
      vlt: "7%",
      irr: "85%",
      irr2: "93%",
      uvr: "99%",
      tser: "75%",
      technology: "Sputtering Film",
      thickness: "2MIL (50 micron)",
      description: "ฟิล์มสปัตเตอร์หลายชั้นสะท้อนความร้อนประสิทธิภาพสูง ป้องกันแดดจัดได้ทันทีก่อนความร้อนสะสมในกระจก มืดเป็นส่วนตัวและลดแสงจ้าดีเยี่ยม",
      price: "2,400",
    },
    {
      name: "Nexus Series 25%",
      series: "Nexus",
      vlt: "25%",
      irr: "85%",
      irr2: "93%",
      uvr: "99%",
      tser: "68%",
      technology: "Sputtering Film",
      thickness: "2MIL (50 micron)",
      description: "ฟิล์มสปัตเตอร์สะท้อนความร้อนประสิทธิภาพสูง ความเข้มกลางนุ่มนวลตา ลดความร้อนสะสมได้อย่างดีเยี่ยม",
      price: "2,400",
    },
    {
      name: "Nexus Series 35%",
      series: "Nexus",
      vlt: "35%",
      irr: "85%",
      irr2: "93%",
      uvr: "99%",
      tser: "65%",
      technology: "Sputtering Film",
      thickness: "2MIL (50 micron)",
      description: "ฟิล์มสปัตเตอร์ใสป้องกันความร้อนสะสม ให้ห้องสว่างเป็นธรรมชาติพร้อมคุณสมบัติสะท้อนพลังงานแสงอาทิตย์ยอดเยี่ยม",
      price: "2,400",
    },
    // Apex Series
    {
      name: "Apex Series 7%",
      series: "Apex",
      vlt: "7%",
      irr: "90%",
      irr2: "95%",
      uvr: "99%",
      tser: "80%",
      technology: "Nano Sputtering Film",
      thickness: "2MIL (50 micron)",
      description: "ที่สุดแห่งนวัตกรรมฟิล์มสปัตเตอร์สุญญากาศหลายชั้น เคลือบทองคำและไทเทเนียมระดับนาโนเมตร สะท้อนรังสีอินฟราเรดทันทีก่อนเข้าสู่กระจก ป้องกันความร้อนสูงสุดถึง 80%",
      price: "2,800",
    },
    {
      name: "Apex Series 20%",
      series: "Apex",
      vlt: "20%",
      irr: "90%",
      irr2: "95%",
      uvr: "99%",
      tser: "76%",
      technology: "Nano Sputtering Film",
      thickness: "2MIL (50 micron)",
      description: "ที่สุดของความเย็นสบายและความเป็นส่วนตัว ด้วยนวัตกรรมสปัตเตอร์หลายชั้น เคลือบโลหะมีค่าสะท้อนความร้อนสูงสุดถึง 76%",
      price: "2,800",
    },
    {
      name: "Apex Series 35%",
      series: "Apex",
      vlt: "35%",
      irr: "90%",
      irr2: "95%",
      uvr: "99%",
      tser: "70%",
      technology: "Nano Sputtering Film",
      thickness: "2MIL (50 micron)",
      description: "ฟิล์มสปัตเตอร์ระดับท็อป ความสว่างใสเป็นธรรมชาติ สะท้อนความร้อนสูงสุดถึง 70% ให้ความสบายสายตาและป้องกันแสงจ้าดีเยี่ยม",
      price: "2,800",
    },
    // Guardian Series
    {
      name: "Guardian Series 5%",
      series: "Guardian",
      vlt: "5%",
      irr: "80%",
      irr2: "85%",
      uvr: "100%",
      tser: "85%",
      technology: "UHD Ceramic",
      thickness: "2MIL (50 micron)",
      description: "ฟิล์มเซรามิคเกรดพิเศษ UHD Ceramic ป้องกันรังสี UV 100% สกัดรังสีอินฟราเรดเพื่อลดอุณหภูมิภายในห้องได้ยอดเยี่ยม สีสันคงทนยาวนาน",
      price: "1,800",
    },
    {
      name: "Guardian Series 15%",
      series: "Guardian",
      vlt: "15%",
      irr: "80%",
      irr2: "85%",
      uvr: "100%",
      tser: "78%",
      technology: "UHD Ceramic",
      thickness: "2MIL (50 micron)",
      description: "ฟิล์มเซรามิคเกรดพิเศษ UHD Ceramic ความเข้มปานกลาง สบายตาและเป็นส่วนตัว ป้องกันรังสี UV 100% และลดความร้อนสะสม",
      price: "1,800",
    },
    {
      name: "Guardian Series 35%",
      series: "Guardian",
      vlt: "35%",
      irr: "80%",
      irr2: "85%",
      uvr: "100%",
      tser: "70%",
      technology: "UHD Ceramic",
      thickness: "2MIL (50 micron)",
      description: "ฟิล์มเซรามิคใสเกรดพิเศษ UHD Ceramic ให้แสงธรรมชาติผ่าน สปอร์ตสวยงาม ป้องกันรังสี UV 100% เคลียร์ใสระดับสูงสุด",
      price: "1,800",
    },
  ];

  for (const p of products) {
    await prisma.product.create({
      data: p,
    });
    console.log(`Product seeded: ${p.name}`);
  }

  // 8. Seed Homepage Modules Settings
  const homepageModules = [
    {
      key: "hero",
      title: "LUMAGUARD",
      subtitle: "เกราะป้องกันความร้อนสูงสุด",
      content: {
        description: "สัมผัสแสงธรรมชาติที่สว่างไสวโดยไม่มีความร้อนสะสม เทคโนโลยีฟิล์มกรองแสงเซรามิกระดับนาโนที่สกัดกั้นรังสี UV 99.9% และความร้อนอินฟราเรด โดยยังคงรักษาทัศนียภาพที่คมชัดระดับ HD",
        btnTextPrimary: "เลือกชมรุ่นฟิล์มกรองแสง",
        btnLinkPrimary: "/products",
        btnTextSecondary: "ประเมินราคาฟรี",
        btnLinkSecondary: "/contact",
        bgImage: "/images/gallery/home-penthouse-interior.webp",
      },
      isActive: true,
    },
    {
      key: "why-us",
      title: "วิทยาศาสตร์การปกป้องอาคาร",
      subtitle: "ทำไมคอนโดและบ้านหรูจึงเลือก LUMAGUARD",
      content: {
        features: [
          {
            icon: "ShieldCheck",
            title: "ป้องกันรังสี UV 100%",
            description: "ปกป้องผิวหนังครอบครัวของคุณจากการโดนทำลายด้วยรังสีสีม่วง และช่วยป้องกันเฟอร์นิเจอร์หรู พื้นไม้จริง หรือชิ้นงานศิลปะจากการซีดจาง กรอบเสียรูปทรง",
          },
          {
            icon: "Thermometer",
            title: "ลดอุณหภูมิห้องสูงสุด 12°C",
            description: "สกัดความร้อนอินฟราเรดได้สูงสุดถึง 98% ช่วยให้บ้านเย็นสบายในเวลากลางวัน ลดการทำงานของเครื่องปรับอากาศ ประหยัดพลังงานไฟและบิลค่าไฟได้ในทันที",
          },
          {
            icon: "Eye",
            title: "ทัศนียภาพคมชัดระดับ HD",
            description: "ลดแสงสะท้อนจ้า (Glare) จากภายนอกโดยไม่สูญเสียความสว่างของแสงธรรมชาติ ให้ทัศนียภาพที่เคลียร์ สะอาดตา เหมือนใส่เลนส์โพลาไรซ์ระดับพรีเมียมให้กระจกบ้าน",
          },
        ],
      },
      isActive: true,
    },
    {
      key: "products",
      title: "รุ่นและกลุ่มผลิตภัณฑ์",
      subtitle: "ฟิล์มกรองแสงสเปกสากลที่เหมาะกับความต้องการของคุณ",
      content: {
        description: "เราคัดสรรเทคโนโลยีที่ดีที่สุด ตั้งแต่คาร์บอนเสถียร เซรามิกนาโน ไปจนถึงกระบวนการสปัตเตอร์โลหะมีค่าหลายชั้น",
      },
      isActive: true,
    },
    {
      key: "process",
      title: "ขั้นตอนการบริการมาตรฐานสากล",
      subtitle: "",
      content: {
        steps: [
          {
            stepNo: "01",
            title: "ปรึกษาการเลือกฟิล์ม",
            description: "เจ้าหน้าที่ประเมินความร้อนภายนอกและทิศทางแดด เพื่อแนะนำสเปกฟิล์มและ VLT (ความสว่าง) ที่ถูกต้อง",
          },
          {
            stepNo: "02",
            title: "สำรวจวัดพื้นที่จริงด้วยเลเซอร์",
            description: "ทีมวิศวกรเข้าวัดขนาดกระจกด้วยเครื่องเลเซอร์ความแม่นยำสูง ตรวจเช็คคุณสมบัติกระจกเพื่อเลี่ยงการกระจกแตก",
          },
          {
            stepNo: "03",
            title: "ติดตั้งระบบความคุมฝุ่น",
            description: "ทีมช่างเทคนิคที่ผ่านการรับรองจาก IWFA ดำเนินการติดตั้งด้วยขั้นตอนต้านฝุ่นสูงสุด เพื่อความเรียบใสไร้ฟองอากาศ",
          },
          {
            stepNo: "04",
            title: "ตรวจสอบรับประกันดิจิทัล",
            description: "ตรวจเช็คความคลีนหลังกาวเซ็ตตัว ส่งมอบระบบประกันสินค้าแบบดิจิทัล รันนัมเบอร์ความถูกต้องของฟิล์มกรองแสง",
          },
        ],
      },
      isActive: true,
    },
    {
      key: "estimator",
      title: "โปร่งใส ไร้ค่าใช้จ่ายแอบแฝง",
      subtitle: "ประเมินงบประมาณการติดตั้งฟิล์มตามขนาดตารางเมตรของคุณได้อย่างแม่นยำ",
      content: {},
      isActive: true,
    },
    {
      key: "visualizer",
      title: "ตัวอย่างการกรองแสงและสะท้อนความร้อน",
      subtitle: "สัมผัสความโปร่งโล่งแบบสะท้อนแดดจ้า",
      content: {
        description: "ฟิล์มกรองแสงพรีเมียมของเราช่วยลดแสงจ้าสะท้อนเข้าสู่สายตา แต่ยังยอมให้ช่วงความถี่แสงสว่างที่เป็นประโยชน์ผ่านกระจกเข้ามาได้ ทำให้ห้องสว่างนวลตา ลื่นรมย์ ไม่มืดทึบ",
        linkText: "ชมภาพผลงานโครงการจริงทั้งหมด",
        linkUrl: "/portfolio",
      },
      isActive: true,
    },
    {
      key: "testimonials",
      title: "เสียงสะท้อนความไว้วางใจจากลูกค้า",
      subtitle: "",
      content: {},
      isActive: true,
    },
    {
      key: "contact",
      title: "พร้อมที่จะมอบความเย็นสบายและปกป้องบ้านของคุณหรือยัง?",
      subtitle: "สอบถามรายละเอียดเพิ่มเติมจากทีมงานติดตั้งมืออาชีพ บริการสำรวจประเมินหน้างาน ตรวจอุณหภูมิกระจกฟรีก่อนตัดสินใจ ทั่วเขตพื้นที่กรุงเทพฯ และปริมณฑล",
      content: {
        phone: "+66 2 123 4567",
        line: "@LUMAGUARD",
      },
      isActive: true,
    },
  ];

  for (const m of homepageModules) {
    const existingM = await prisma.homepageModule.findUnique({
      where: { key: m.key },
    });

    if (!existingM) {
      await prisma.homepageModule.create({
        data: {
          key: m.key,
          title: m.title,
          subtitle: m.subtitle,
          content: m.content,
          isActive: m.isActive,
        },
      });
      console.log(`Homepage module seeded: ${m.key}`);
    }
  }

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
