import type { MetadataRoute } from "next";
import { getSiteUrl, isIndexable } from "@/shared/lib/site-url";

// Production: the portfolio is open, the private workspace is not crawled (it also sends noindex).
// /login and /auth are not disallowed on purpose: crawlers must be able to read their noindex.
// Preview / development deployments: nothing is crawled.
export default function robots(): MetadataRoute.Robots {
  const origin = getSiteUrl();
  if (!isIndexable()) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/app", "/w/", "/account"] }],
    sitemap: `${origin}/sitemap.xml`,
  };
}
