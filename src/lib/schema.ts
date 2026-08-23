import { SITE_URL, BUSINESS, absoluteUrl } from '@/lib/site';

const ORG_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;

/**
 * JSON-LD ระดับเว็บ ใส่ครั้งเดียวใน Layout
 *
 * ใช้ @graph กับ @id เพื่อให้ entity อ้างถึงกันได้ แทนที่จะประกาศ Organization
 * ซ้ำในทุกหน้าแบบไม่เชื่อมกัน ซึ่ง Google จะมองเป็นคนละองค์กร
 *
 * HomeAndConstructionBusiness เป็น subtype ของ LocalBusiness ที่ตรงกับงาน
 * ติดตั้งฟิล์มอาคารมากที่สุด
 */
export function buildSiteSchema() {
  // ประกาศ address เมื่อรู้อย่างน้อยระดับเขตและจังหวัด ส่วนเลขที่/ถนน
  // ใส่เพิ่มเมื่อมี — ที่อยู่ระดับเขตยังช่วย Local SEO ได้ ดีกว่าไม่ประกาศเลย
  const hasAddress = Boolean(BUSINESS.address.addressLocality && BUSINESS.address.addressRegion);

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': ORG_ID,
        name: BUSINESS.name,
        legalName: BUSINESS.legalName,
        description: BUSINESS.description,
        url: SITE_URL,
        logo: {
          '@type': 'ImageObject',
          url: absoluteUrl('/logo.png'),
        },
        ...(BUSINESS.sameAs.length > 0 && { sameAs: BUSINESS.sameAs }),
      },
      {
        '@type': 'WebSite',
        '@id': WEBSITE_ID,
        url: SITE_URL,
        name: BUSINESS.name,
        inLanguage: 'th-TH',
        publisher: { '@id': ORG_ID },
      },
      {
        '@type': 'HomeAndConstructionBusiness',
        '@id': `${SITE_URL}/#localbusiness`,
        name: BUSINESS.name,
        description: BUSINESS.description,
        url: SITE_URL,
        image: absoluteUrl('/og-default.jpg'),
        parentOrganization: { '@id': ORG_ID },
        priceRange: BUSINESS.priceRange,
        ...(BUSINESS.telephone && { telephone: BUSINESS.telephone }),
        ...(BUSINESS.email && { email: BUSINESS.email }),
        // ปล่อย address ทิ้งไว้ดีกว่าใส่ข้อมูลไม่ครบ — address ที่ขาดส่วนสำคัญ
        // ทำให้ Google ไม่ยอมรับทั้งก้อน
        ...(hasAddress && {
          address: {
            '@type': 'PostalAddress',
            ...(BUSINESS.address.streetAddress && {
              streetAddress: BUSINESS.address.streetAddress,
            }),
            addressLocality: BUSINESS.address.addressLocality,
            addressRegion: BUSINESS.address.addressRegion,
            ...(BUSINESS.address.postalCode && { postalCode: BUSINESS.address.postalCode }),
            addressCountry: BUSINESS.address.addressCountry,
          },
        }),
        areaServed: BUSINESS.areaServed.map((name) => ({ '@type': 'AdministrativeArea', name })),

        // เวลาทำการเหมือนกันทุกวัน จึงรวมเป็นรายการเดียวที่ระบุครบเจ็ดวัน
        // ตามที่ schema.org รองรับ แทนการเขียนแยกทีละวันซึ่งยาวโดยไม่จำเป็น
        openingHoursSpecification: [
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: BUSINESS.openingHours.days,
            opens: BUSINESS.openingHours.opens,
            closes: BUSINESS.openingHours.closes,
          },
        ],
      },
    ],
  };
}

interface ArticleSchemaInput {
  title: string;
  description: string;
  canonical: string;
  image?: string;
  author: string;
  publishedAt: Date;
  modifiedAt?: Date;
}

export function buildArticleSchema(input: ArticleSchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: input.title,
    description: input.description,
    ...(input.image && { image: [input.image] }),
    datePublished: input.publishedAt.toISOString(),
    // dateModified ต้องสะท้อนการแก้ไขจริง การขยับวันโดยไม่แก้เนื้อหา
    // เป็นรูปแบบที่ search engine ลดน้ำหนักให้
    dateModified: (input.modifiedAt ?? input.publishedAt).toISOString(),
    author: { '@type': 'Person', name: input.author },
    publisher: { '@id': ORG_ID },
    mainEntityOfPage: { '@type': 'WebPage', '@id': input.canonical },
    inLanguage: 'th-TH',
  };
}

/** ใส่ได้เฉพาะเมื่อคำถามคำตอบแสดงบนหน้าจริง ไม่งั้นเสี่ยงโดน manual action */
export function buildFaqSchema(faq: ReadonlyArray<{ q: string; a: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
}

export function buildBreadcrumbSchema(trail: ReadonlyArray<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.url),
    })),
  };
}
