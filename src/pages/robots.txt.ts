import type { APIRoute } from "astro";
import { SITE_URL } from "@/lib/site";

export const GET: APIRoute = () =>
  new Response(
    [
      "User-agent: *",
      "Allow: /",
      "",
      "# หลังบ้านและ endpoint ต้องไม่ถูก crawl",
      "Disallow: /admin",
      "Disallow: /admin/",
      "Disallow: /api/",
      "",
      `Sitemap: ${SITE_URL}/sitemap-index.xml`,
      "",
    ].join("\n"),
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
