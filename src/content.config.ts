import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: ({ image }) => z.object({
    title: z.string().max(70),
    description: z.string().min(80).max(160),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroImage: image().optional(),
    heroAlt: z.string().optional(),
    author: z.string().default('Luma Guard Team'),
    tags: z.array(z.string()).default([]),
    pillar: z.string().optional(),   // slug of the pillar page this clusters under
    draft: z.boolean().default(false),
    faq: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
  }),
});

export const collections = { blog };
