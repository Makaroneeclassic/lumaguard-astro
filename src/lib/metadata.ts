import type { Metadata } from "next";
import { prisma } from "@/lib/db";

/**
 * Fetches per-route SEO overrides from the seoPage table and maps to
 * Next.js Metadata. Returns {} on miss or DB error so pages can layer
 * their own defaults on top.
 */
export async function fetchPageSeo(routePath: string): Promise<Metadata> {
  try {
    const pageSeo = await prisma.seoPage.findUnique({
      where: { routePath },
    });
    if (!pageSeo) return {};

    return {
      title: pageSeo.title,
      description: pageSeo.description,
      keywords: pageSeo.keywords
        ? pageSeo.keywords.split(",").map((k) => k.trim())
        : undefined,
      alternates: pageSeo.canonicalUrl
        ? { canonical: pageSeo.canonicalUrl }
        : undefined,
      openGraph: {
        title: pageSeo.ogTitle || pageSeo.title,
        description: pageSeo.ogDescription || pageSeo.description,
        images: pageSeo.ogImage ? [{ url: pageSeo.ogImage }] : undefined,
      },
      robots: {
        index: !pageSeo.noindex,
        follow: !pageSeo.nofollow,
      },
    };
  } catch {
    if (process.env.NODE_ENV !== "production") {
      console.error(`Failed to fetch SEO for ${routePath}`);
    }
    return {};
  }
}
