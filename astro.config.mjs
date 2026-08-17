import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  output: 'static',

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
    }),
  ],
});