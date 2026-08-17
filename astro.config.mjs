import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  output: 'static',

  adapter: vercel({
    webAnalytics: {
      enabled: true,
    },
  }),

  site: 'https://lumaguard.com',

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [react()],
});