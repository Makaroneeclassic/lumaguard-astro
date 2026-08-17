---
name: astro-lead-site
description: Build and maintain SEO-focused Astro lead-generation sites deployed to Vercel, with Tailwind CSS v4, MDX blogs, and complete server-side tagging (Meta CAPI, GA4, Google Ads via server-side GTM). Use this skill whenever the user is working on an Astro project that involves lead forms, contact forms, blog posts, SEO metadata, structured data, conversion tracking, GTM, Meta Pixel, Facebook CAPI, GA4, or any analytics or marketing-tag work — even if they only mention one piece, like "add a contact form" or "why is my Meta event count doubled."
---

# Astro Lead-Gen Site

Conventions and working patterns for content-driven Astro sites whose job is to rank in search and capture leads with measurable, deduplicated attribution.

The three failure modes this skill exists to prevent:
1. Turning a static site into a server-rendered one by accident, which kills TTFB and burns serverless invocations.
2. Double-counted conversions because browser and server events don't share an `event_id`.
3. Poor ad-platform match quality because identifiers weren't normalized before hashing.

## Stack

Verify actual installed versions with `npm ls` before assuming — these are the baseline this skill was written against.

| Piece | Version | Notes |
|---|---|---|
| Astro | 7.x | Requires Node 22+. Vite 8, Rust compiler. `Astro.glob()` and `<ViewTransitions />` are gone. |
| Tailwind CSS | 4.x | Via `@tailwindcss/vite`. No `tailwind.config.js` — theme lives in CSS with `@theme`. |
| Zod | 4.x | Import from `astro/zod`, not `astro:content`. |
| Adapter | `@astrojs/vercel` | |

## Rendering strategy — get this right first

Default to `output: 'static'`. Opt individual routes into server rendering with `export const prerender = false`, and only for routes that genuinely need a request: form handlers, webhooks, dynamic OG images.

Every marketing page, blog post, and landing page stays prerendered. If a change would make a content page server-rendered, that's a signal something is wrong — move the dynamic bit into a client-side fetch against an API route instead.

## Lead capture flow

The order matters. Persist the lead before doing anything else, because tracking calls fail and a lost lead is unrecoverable while a lost analytics event is not.

```
form submit (browser)
  → generate one eventId (crypto.randomUUID())
  → dataLayer.push({ event: 'generate_lead', event_id: eventId })   ← browser side
  → POST /api/lead with the SAME eventId                            ← server side
       → validate with Zod
       → save to CRM/DB          (must succeed first)
       → forward to sGTM         (fire-and-forget, wrapped in allSettled)
  → show confirmation
```

Store `eventId`, GA4 `client_id`, `_fbp`, `_fbc`, and `gclid` alongside the lead record. Without them there's no way to send an offline conversion back when the deal closes, and the whole ad-spend-to-revenue picture breaks.

Read `references/tracking.md` before writing or debugging any tag, pixel, CAPI call, or GTM configuration.

## Server-side code rules

Never expose credentials to the browser. In Astro, only `PUBLIC_`-prefixed env vars reach client bundles — CAPI tokens, API secrets, and CRM keys must never carry that prefix, and must only be read inside `.ts` API routes or the frontmatter of server-rendered pages.

Use Web Crypto (`crypto.subtle`) rather than Node's `crypto` module for hashing, so the same code runs on both Node and Edge runtimes.

Validate every request body with Zod and return a generic error message. Detailed validation errors help attackers enumerate the schema and help nobody else.

Include a honeypot field on every public form and return `200` when it's filled, so bots don't learn they were caught.

## SEO conventions

Set `site` in `astro.config.mjs` to the real production domain — canonicals and the sitemap are generated from it, and getting this wrong silently poisons indexing.

Every page needs: canonical URL, title under 60 chars, meta description 140–160 chars, OG and Twitter tags with an absolute image URL.

Structured data by page type:
- Site-wide layout: `Organization`, `WebSite`
- Blog post: `BlogPosting` + `BreadcrumbList`
- Landing page with FAQs: `FAQPage`
- Local business: `LocalBusiness` with `openingHoursSpecification`

Use Astro's `<Image />` with explicit `width` and `height` on every image. Layout shift from unsized images is the most common Core Web Vitals regression on content sites.

Read `references/seo.md` for the content-model conventions and the blog schema.

## Content collections

Define blog schemas in `src/content.config.ts` with Zod from `astro/zod`. Required fields for every post: `title`, `description`, `pubDate`, `updatedDate`, `heroImage`, `draft`. Filter drafts out in production with `import.meta.env.PROD`.

Blog structure should follow topic clusters — one pillar page per commercial topic, cluster posts linking back to it. Reflect this in the schema with a `pillar` field rather than leaving it to editorial discipline.

## Before shipping

- `npm run build` passes and the Vercel function list contains only intended routes
- Tag Assistant preview on both Web and Server containers simultaneously
- One form submission produces exactly one `generate_lead` in GA4 DebugView
- Meta Events Manager shows the Lead event received from both browser and server, marked deduplicated
- `META_TEST_EVENT_CODE` removed from production env
- Sitemap and `robots.txt` reachable, submitted to Search Console

## Reference files

- `references/tracking.md` — sGTM setup, dedup, hashing rules, consent mode, offline conversions, debugging checklist. Read this for any analytics work.
- `references/seo.md` — metadata component, JSON-LD templates, content collection schema.
- `references/troubleshooting.md` — symptom-to-cause table for the failures that actually happen.
