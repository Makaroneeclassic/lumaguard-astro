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
  const adminPassword = process.env.ADMIN_PASSWORD || "adminpassword123";
  const adminName = process.env.ADMIN_NAME || "Lumaguard Admin";

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

  // 4. Seed Blog Posts
  const blogPosts = [
    {
      title: "How to Keep Your Home 12°C Cooler This Summer with Nano-Ceramic Window Film",
      slug: "keep-home-12c-cooler-summer-nano-ceramic-film",
      excerpt: "Discover the science behind nano-ceramic window films and how they can drastically reduce your AC bills while maintaining perfect visibility.",
      content: `As global temperatures continue to rise, the struggle to maintain a comfortable indoor environment becomes more than just a matter of luxury—it's about sustainability and cost-efficiency. Traditional cooling methods often lead to skyrocketing energy bills, but the secret to a cooler home might lie in the very glass you look through.

## The Science of Solar Rejection
Nano-ceramic window films represent the pinnacle of light filtration technology. Unlike metallic films that interfere with electronic signals, nano-ceramic particles are small enough to be invisible to the naked eye but dense enough to block up to 99% of infrared heat and UV rays.

In our recent laboratory tests, homes equipped with LUMAGUARD Titan series film maintained an internal surface temperature on furniture and flooring that was consistently 12.4°C lower than non-treated equivalents during peak sun hours.

### Key Benefits of Nano-Ceramic Installation:
- **Selective Filtration:** Allows natural visible light in while reflecting the thermal energy that causes heat gain.
- **UV Protection:** Blocks 99.9% of harmful rays that fade your premium upholstery and hardwood floors.
- **Signal Clarity:** Zero interference with 5G, Wi-Fi, or GPS signals due to the non-metallic composition.

## Sustainable Luxury
Beyond the immediate comfort, installing high-performance window film is an investment in your property's value. By reducing the load on your HVAC system, you extend the life of your equipment and significantly reduce your carbon footprint. It is the most invisible way to make a visible impact on your energy consumption.`,
      coverImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuCAkS6xVyLEoNixpQdJGX08H9PZheN2B8h_EIlO6IgqKxEAllHs2hhuXXdVgPjKX2QAgnh0FvW9dcQQcmxqNnD3XuZnDT1ZjcO3DA7tkjaeAXM0SpX4jE4haaJmVKTmhgFG6lECesVYWFbYBcCfgT8OG6wdJw93gBAiJvFEDvyU4MXK3mcL2zW80l93RQIjT_GH2TjS4DGYxxc70GsZXFME3doQnqqlf9OuoCD-XySQIftDwqfO2Ce77MsRR_o4-Ks1H39eAFeovYrC",
      authorName: "Marcus Thorne",
      authorImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuBlljv2Ii_FXtn87-35BHHMI_vNKJnqjUZIy1L-7Uhuun-OA6wlgUtd1wD6CAsogVVjlX6kZbEYXJSu1kon0gcyTA69nQAvurMp50OiKqwNO4f2bByRkRtY3w1XP3NAYwF7KXTF3ZXOabSD7reGON7P6d_JGhUfy6eTh4LghtdnQ0UoOKrvbrbeANMBelc2m_SyjtkJmAAvJqfvh5SrwZSXHMjF3T2Pi1m9X3s-_Ys_f86sxzJkFo-JxXDL5G6ExtBMa1HYaGRo7mgk",
      category: "Energy Efficiency",
      readingTime: "8 min read",
      seoTitle: "How to Keep Your Home 12°C Cooler This Summer | LUMAGUARD",
      seoDesc: "Discover the science behind nano-ceramic window films and how they can drastically reduce your AC bills while maintaining perfect visibility.",
      seoKeywords: "nano-ceramic window film, solar heat rejection, energy saving tips",
    },
    {
      title: "Reinforcing Your Glass: A Security Masterclass",
      slug: "reinforcing-glass-security-masterclass",
      excerpt: "Learn how safety window films provide an invisible barrier against break-ins and accidental glass impacts.",
      content: `Home security is multi-layered. While alarms and cameras warn you of an intrusion, they do not physical delay access. Windows are the primary entry point for intruders. This is where security window film acts as your invisible shield.

## How Security Film Works
Made from heavy-duty polyester and bonded by aggressive adhesives, security film is designed to hold shattered glass together. If a window is hit by a heavy object, the glass cracks but remains firmly held in the frame, preventing easy entry.

### Critical Safety Benefits:
- **Delay Intrusion:** Gives homeowners valuable minutes to contact authorities or move to safety.
- **Accidental Impact Protection:** Prevents injury from flying glass shards during heavy storms or accidental impacts.
- **Invisible Defense:** Maintains the pristine look of your luxury facade without needing unsightly metal bars.`,
      coverImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuD6XfKzP8x0MdNxhYVPk904PiQtHp3soztCsw24md_pVD27VRql4zFOu9up1jo-KZxRSGW8NkriOsl0SAkf5GBKPL57vheZUvl-H0ol6vn9ZiScU2oLKaobIJox3Whe6NEDplA7mSfXeDPJJ7BagjZRGMteHGGMeObjUsLy8XCgfNlEyv7bXKNzokd2eGjP18FulstfCKQ5GidiHvwyGwHFfojS7mcZXiVeM4y1UArg-hrEecf0Mg8bWyU4JGh4fJ_-CxbjOhKT8bD_",
      authorName: "Marcus Thorne",
      authorImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuBlljv2Ii_FXtn87-35BHHMI_vNKJnqjUZIy1L-7Uhuun-OA6wlgUtd1wD6CAsogVVjlX6kZbEYXJSu1kon0gcyTA69nQAvurMp50OiKqwNO4f2bByRkRtY3w1XP3NAYwF7KXTF3ZXOabSD7reGON7P6d_JGhUfy6eTh4LghtdnQ0UoOKrvbrbeANMBelc2m_SyjtkJmAAvJqfvh5SrwZSXHMjF3T2Pi1m9X3s-_Ys_f86sxzJkFo-JxXDL5G6ExtBMa1HYaGRo7mgk",
      category: "Home Security",
      readingTime: "5 min read",
      seoTitle: "Reinforcing Your Glass: Security Film Guide | LUMAGUARD",
      seoDesc: "Learn how safety window films provide an invisible barrier against break-ins and accidental glass impacts.",
      seoKeywords: "security window film, safety film, shatterproof glass",
    },
    {
      title: "Preserving Your Artwork and Flooring from UV Damage",
      slug: "preserving-artwork-flooring-uv-damage",
      excerpt: "UV rays are the silent killers of fine art and upholstery. Learn how to block 99% of them while letting light in.",
      content: `Discerning homeowners spend thousands on designer furniture, original artwork, and premium hardwood flooring. Yet, solar exposure is a constant threat. Ultraviolet radiation causes fading, discoloration, and structural degradation of materials.

## The Chemistry of Fading
Fading is caused by a combination of UV rays (40%), visible light (25%), and solar heat (25%). To truly protect your interior, you need a film that targets all three of these components.

Our premium series filters block 99.9% of UV radiation. By selecting a film with targeted visible light transmission (VLT), you keep the interior bright while ensuring your assets are shielded.`,
      coverImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuDnHJJO0eenAHHdgNQOkyM9AkSbPm1Y-d-E8fM9RgrzoCn0X1OhXVNc-tIDLh32pqEjSbRfz3rtkB7A5QEPmGw_oO6O_g_OtVxDbGrp3rplKQEFP9KFukYVVk2UgnR02gSljn4fqRzyPke3iK5JZv-hopvdJ5lBbKFeOQ70nPVCcvHsDq1NUAlxHcSP7paWEooOGrsEbOiXFfbFD068sooTbYwnuOM5QQLI0_d7dMCoEMzam6wt9GbBxwlzmO9hjlVDFgKq_2kL1Pu1",
      authorName: "Marcus Thorne",
      authorImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuBlljv2Ii_FXtn87-35BHHMI_vNKJnqjUZIy1L-7Uhuun-OA6wlgUtd1wD6CAsogVVjlX6kZbEYXJSu1kon0gcyTA69nQAvurMp50OiKqwNO4f2bByRkRtY3w1XP3NAYwF7KXTF3ZXOabSD7reGON7P6d_JGhUfy6eTh4LghtdnQ0UoOKrvbrbeANMBelc2m_SyjtkJmAAvJqfvh5SrwZSXHMjF3T2Pi1m9X3s-_Ys_f86sxzJkFo-JxXDL5G6ExtBMa1HYaGRo7mgk",
      category: "Interior Design",
      readingTime: "6 min read",
      seoTitle: "Protecting Art and Floors from UV Fading | LUMAGUARD",
      seoDesc: "UV rays are the silent killers of fine art and upholstery. Learn how to block 99% of them while letting light in.",
      seoKeywords: "uv protection, fading prevention, museum grade film",
    },
  ];

  for (const post of blogPosts) {
    const existingPost = await prisma.blogPost.findUnique({
      where: { slug: post.slug },
    });

    if (!existingPost) {
      await prisma.blogPost.create({
        data: post,
      });
      console.log(`Blog post seeded: ${post.title}`);
    }
  }

  // 5. Seed Portfolio Items
  const portfolioItems = [
    {
      title: "The Monument Thong Lo",
      location: "Thong Lo, Bangkok",
      category: "condo",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCj3aBLG7sUb1FGlWSBzeQnmaSBjM2NzPffLQXB-ShkHLTdDVhvbCP2mUDtdJ6mZP3bjqSTzinczicYlea97m43CFG1MzlsLfjRJwOHjey3h6pJzeOiUpAngYd7JMAkFCxg1GDO1GKzU4EyZxK51rFewo9skCoHVBRAycVXLdgpPUzLOG0eUvdOATl4mQZ9r5kBIyIyvRfs4B9Oruxe-h-E6IxQI1IvYYWumILmNWizIB7nETJV_i7GxEuWtqOZoN6Vs0Z-gSHg6gYm",
      altText: "Luxury condo penthouse Thong Lo floor to ceiling windows",
      seriesUsed: "Apex Sputter 20",
      areaSize: "45 m²",
      description: "Sleek multi-layer sputtered film application on floor-to-ceiling double-glazed panels, achieving 76% TSER while preserving panoramic city views at sunset.",
    },
    {
      title: "Santi Pura Residence",
      location: "Bang Na, Bangkok",
      category: "house",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCI2UtsVnRDZPeKdjPpuFIqEzlMMvlaqGP8b5BOuvMFNtur0BsilWjUjbhCHZ0FAQRLaz-zWaGUEcLOvBv-APfQtIglErHMvkJKZiBwkwsE647NbZ5ID7qQ0W4IW5y8QOgs4bxNDRQibYQg_FlvKSBS_9WXgjjpffYzg4Ug0cXfxfBvFTSX0EHX3UtZOyprkktNj3o4TOWGdW7vWBwM4YfE_V-AUP8JP30cY2Ii9n2nBdy2Y9dVRDW3QyzQq1o5B4ZRm_-UVxFPRWjj",
      altText: "Modern tropical villa Bang Na with large pool windows",
      seriesUsed: "Guardian Ceramic 70",
      areaSize: "180 m²",
      description: "Complete architectural protection of a modern tropical villa, reducing solar heat gain without altering the visual facade of the glass.",
    },
    {
      title: "Park Origin Phrom Phong",
      location: "Sukhumvit 24, Bangkok",
      category: "condo",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDMAl99TSLKz9hLDWfKCxJdQz-VY0rq4AzQo1Y9tyz9vFlL9a8OameuPkzIDmPmsKpH0yBNUw6BtTjBCoUiOMh84VDGoiQeMRRMTX4Uk5z-pl1grjFFubrXyZng3CJTUdVOK4g2F4dXx279mySVIPHDQBye7nPFpK9ns7xhaRc7yGEL-F4uDRpZ6I5vosr_qgf0AR_6rqcHgMBKAsEIr323FAbBqFUJkdbi1wVzjbuLLuK6WoSqHRG5jP12TazLZBP-hOIHvzwlvgwA",
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
        bgImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuDnVROa8cqtTIq7_9E77pWVQpAtdz9OLYdNAJ7nGW0-Pl85wCkGi0TDT4IRC8o2_losMlkRb5QnegGPx4_u0MVaiAWYYNMwu7tdJnBJELGDzJyglM3_6XRvyCyxsKjhJQqD5s1tnHDHHizvaveh6pLJ9txAywWBsS-P9hkWpsJi2CxLPrzth2GknOhZuPlU5e7EkonPV9LBs8uRncfTOiyFJaMUxuuYgULZyojPqmbtXJxF0zcZthUL4-xXMWwCc3-b2lxVlYYUc-NG",
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
