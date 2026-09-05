import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import { readFileSync, readdirSync, existsSync } from 'node:fs';

/**
 * อ่านวันที่ของบทความจาก frontmatter เพื่อใส่ lastmod ใน sitemap
 *
 * lastmod บอก Google ว่าหน้าไหนเพิ่งแก้ ทำให้จัดลำดับการกลับมาเก็บข้อมูลใหม่
 * ได้ตรงกว่า สำคัญมากตอนวนแก้บทความเก่าเพื่อดันอันดับ เพราะถ้าไม่มีสัญญาณนี้
 * Google อาจไม่กลับมาอ่านฉบับที่แก้แล้วเป็นเดือน
 *
 * ใส่เฉพาะบทความเพราะเป็นที่เดียวที่มีวันที่จริง หน้าอื่นปล่อยว่างดีกว่า
 * ใส่วันที่ build ซึ่งจะกลายเป็นการบอกว่าทุกหน้าเปลี่ยนทุกครั้งที่ deploy
 */
const BLOG_DIR = 'src/content/blog';
const blogLastmod = new Map();

/**
 * บทความที่ตั้ง noindex ไว้ ต้องไม่ถูกประกาศใน sitemap
 *
 * sitemap คือการบอก Google ว่า "หน้าพวกนี้อยากให้เก็บ" ส่วน noindex บอกว่า
 * "อย่าเก็บหน้านี้" การส่งทั้งสองอย่างพร้อมกันคือสัญญาณที่ขัดกันเอง
 * และทำให้ Google เสียเวลาไล่เก็บหน้าที่เราไม่ได้อยากให้เก็บตั้งแต่แรก
 */
const noindexBlogSlugs = new Set();

if (existsSync(BLOG_DIR)) {
  for (const file of readdirSync(BLOG_DIR)) {
    if (!/\.mdx?$/.test(file)) continue;
    const raw = readFileSync(`${BLOG_DIR}/${file}`, 'utf8');
    const fm = raw.split('---')[1] ?? '';
    const slug = file.replace(/\.mdx?$/, '');
    const updated = fm.match(/^updatedDate:\s*(\S+)/m)?.[1];
    const published = fm.match(/^pubDate:\s*(\S+)/m)?.[1];
    const date = (updated ?? published)?.replace(/['"]/g, '');
    if (date) blogLastmod.set(slug, new Date(date).toISOString());
    if (/^noindex:\s*true\s*$/m.test(fm)) noindexBlogSlugs.add(slug);
  }
}

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  output: 'static',

  /**
   * บทความสองบทแรกเป็นเนื้อหาตัวอย่างที่ลบออกแล้ว
   *
   * ทั้งคู่เคยอยู่ใน sitemap และถูกส่งให้ Google ไปแล้ว ถ้าปล่อยให้กลายเป็น 404
   * คนที่กดจากผลค้นหาหรือลิงก์เก่าจะเจอหน้าไม่พบ พาไปหน้ารวมบทความแทนเพื่อ
   * ไม่ให้ทางตัน และคงไว้ถาวรเพราะลิงก์เก่าอาจโผล่มาอีกได้หลายปี
   */
  redirects: {
    '/blog/film-kan-ron-ban-lot-kha-fai': '/blog',
    '/blog/ppf-paint-protection-film-guide': '/blog',

    /**
     * /services ยุบไปรวมกับหน้าขายฟิล์มบ้านแล้ว
     *
     * เนื้อหาจริงคือขั้นตอนการทำงานสี่ข้อซึ่งเป็นงานอาคารล้วน ส่วนฝั่งรถมีขั้นตอน
     * ของตัวเองอยู่ใน /car-film อยู่แล้ว การมีหน้ากลางที่พูดถึงงานอาคารอย่างเดียว
     * แต่อยู่ใน nav ให้ทุกคนกด ทำให้คนหาฟิล์มรถเข้าไปเจอเรื่องวัดพื้นที่กระจกบ้าน
     *
     * 301 ไม่ใช่ 404 เพราะหน้านี้เคยอยู่ใน sitemap และถูกส่งให้ Google ไปแล้ว
     */
    '/services': '/home-film',
  },

  adapter: vercel({
    webAnalytics: {
      enabled: true,
    },

    /**
     * /admin/blog ให้ AI เขียนบทความยาวซึ่งใช้เวลาได้ถึง 2-3 นาที
     * ค่า default ของ Vercel ฆ่า function ก่อนเขียนเสร็จ ทำให้กด Generate
     * แล้วได้ error ทั้งที่โมเดลกำลังทำงานปกติ
     */
    maxDuration: 300,
  }),

  // ต้องตรงกับโดเมนจริง มิฉะนั้น canonical/OG/sitemap จะชี้ไปโดเมนอื่น
  // ซึ่งบอก Google ว่าเนื้อหาตัวจริงอยู่ที่อื่นและทำให้เว็บหลุด index
  site: 'https://lumaguardthailand.com',

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [
    react(),
    mdx(),
    sitemap({
      // sitemap ต้องไม่ประกาศหน้าที่ตั้ง noindex ไว้ — เป็นสัญญาณที่ขัดกันเอง
      filter: (page) => {
        if (page.includes('/admin') || page.includes('/thank-you')) return false;
        const slug = page.match(/\/blog\/([^/]+)\/?$/)?.[1];
        return !(slug && noindexBlogSlugs.has(slug));
      },
      serialize(item) {
        const slug = item.url.match(/\/blog\/([^/]+)\/?$/)?.[1];
        const lastmod = slug && blogLastmod.get(slug);
        return lastmod ? { ...item, lastmod } : item;
      },
    }),
  ],
});