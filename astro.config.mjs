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

if (existsSync(BLOG_DIR)) {
  for (const file of readdirSync(BLOG_DIR)) {
    if (!/\.mdx?$/.test(file)) continue;
    const raw = readFileSync(`${BLOG_DIR}/${file}`, 'utf8');
    const fm = raw.split('---')[1] ?? '';
    const updated = fm.match(/^updatedDate:\s*(\S+)/m)?.[1];
    const published = fm.match(/^pubDate:\s*(\S+)/m)?.[1];
    const date = (updated ?? published)?.replace(/['"]/g, '');
    if (date) blogLastmod.set(file.replace(/\.mdx?$/, ''), new Date(date).toISOString());
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
  },

  adapter: vercel({
    webAnalytics: {
      enabled: true,
    },
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
      filter: (page) => !page.includes('/admin') && !page.includes('/thank-you'),
      serialize(item) {
        const slug = item.url.match(/\/blog\/([^/]+)\/?$/)?.[1];
        const lastmod = slug && blogLastmod.get(slug);
        return lastmod ? { ...item, lastmod } : item;
      },
    }),
  ],
});