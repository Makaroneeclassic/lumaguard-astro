# SEO Reference

## Metadata component

One `<SEO />` component used by every layout. Deriving the canonical from `Astro.url` and `site` prevents the drift that happens when canonicals are hand-written per page.

```astro
---
interface Props {
  title: string;
  description: string;
  image?: string;
  type?: 'website' | 'article';
  publishedTime?: Date;
  modifiedTime?: Date;
  noindex?: boolean;
}
const { title, description, image = '/og-default.jpg', type = 'website',
        publishedTime, modifiedTime, noindex = false } = Astro.props;

const canonical = new URL(Astro.url.pathname, Astro.site).href;
const ogImage = new URL(image, Astro.site).href;
---
<title>{title}</title>
<meta name="description" content={description} />
<link rel="canonical" href={canonical} />
{noindex && <meta name="robots" content="noindex,nofollow" />}

<meta property="og:type" content={type} />
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:image" content={ogImage} />
<meta property="og:url" content={canonical} />
<meta property="og:locale" content="th_TH" />
{publishedTime && <meta property="article:published_time" content={publishedTime.toISOString()} />}
{modifiedTime && <meta property="article:modified_time" content={modifiedTime.toISOString()} />}

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content={title} />
<meta name="twitter:description" content={description} />
<meta name="twitter:image" content={ogImage} />
```

Title under 60 characters, description 140–160. Longer gets truncated in results and wastes the click-through opportunity.

## Content collection schema

```ts
// src/content.config.ts
import { defineCollection, z } from 'astro/zod';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: ({ image }) => z.object({
    title: z.string().max(70),
    description: z.string().min(80).max(160),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroImage: image(),
    heroAlt: z.string(),
    author: z.string().default('Team'),
    tags: z.array(z.string()).default([]),
    pillar: z.string().optional(),   // slug of the pillar page this clusters under
    draft: z.boolean().default(false),
    faq: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
  }),
});

export const collections = { blog };
```

Enforcing description length in the schema catches thin metadata at build time rather than in a Search Console report three months later.

Filter drafts in production:

```ts
const posts = await getCollection('blog', ({ data }) => import.meta.env.PROD ? !data.draft : true);
```

## JSON-LD

Emit as `<script type="application/ld+json" set:html={JSON.stringify(schema)} />`. Using `set:html` avoids Astro escaping the JSON.

**Site-wide, in the base layout:**

```ts
{
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'Organization', '@id': `${site}#org`, name, url: site,
      logo: `${site}logo.png`, sameAs: [/* social profiles */] },
    { '@type': 'WebSite', '@id': `${site}#website`, url: site, name,
      publisher: { '@id': `${site}#org` } },
  ],
}
```

**Blog post:**

```ts
{
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: post.data.title,
  description: post.data.description,
  image: absoluteHeroUrl,
  datePublished: post.data.pubDate.toISOString(),
  dateModified: (post.data.updatedDate ?? post.data.pubDate).toISOString(),
  author: { '@type': 'Person', name: post.data.author },
  publisher: { '@id': `${site}#org` },
  mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
}
```

`dateModified` must reflect real edits. Bumping it without changing content is a pattern search engines discount.

**FAQ** — only when the questions are visibly on the page. Marking up invisible content risks a manual action.

## Content structure

Topic clusters: one pillar page per commercial intent keyword, cluster posts covering long-tail sub-questions, every cluster post linking back to its pillar with descriptive anchor text. The `pillar` field in the schema makes it possible to render those links automatically instead of relying on writers to remember.

Blog posts serve the funnel, so each one needs a contextual CTA — inline mid-article for high-intent topics, end-of-post for informational ones. Track them as separate `dataLayer` events with a `cta_position` parameter, which reveals which content actually produces leads rather than just traffic.

## Performance

- `<Image />` with explicit `width`/`height` everywhere. Unsized images are the top CLS cause.
- `loading="eager"` and `fetchpriority="high"` on the LCP image only.
- Self-host fonts with `font-display: swap`, preload the one weight used above the fold.
- `client:visible` or `client:idle` for interactive islands — `client:load` only when the component must be interactive at first paint.
- Astro's `prefetch` with `defaultStrategy: 'viewport'` makes navigation feel instant on content sites.
- Targets: LCP under 2.5s, CLS under 0.1, INP under 200ms.

GTM itself is usually the heaviest thing on a marketing page. Load it after the LCP image, and audit tag count quarterly — abandoned tags accumulate.
