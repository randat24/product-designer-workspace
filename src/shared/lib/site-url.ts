// One canonical origin for everything that must be absolute: canonical URLs, hreflang,
// sitemap, robots, Open Graph, JSON-LD. Preview deployment URLs are never used here.
//
// Order: NEXT_PUBLIC_SITE_URL (set it to the final custom domain) → the Vercel production
// domain (VERCEL_PROJECT_PRODUCTION_URL, set by Vercel on every deployment) → localhost.

const clean = (v: string | undefined) => v?.trim().replace(/^["']|["']$/g, "").replace(/\/+$/, "") || undefined;

export function getSiteUrl(): string {
  const explicit = clean(process.env.NEXT_PUBLIC_SITE_URL);
  if (explicit) return explicit;
  const vercelProd = clean(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  if (vercelProd) return `https://${vercelProd}`;
  return "http://localhost:3000";
}

/**
 * Search engines may index this deployment only on Vercel production, or when a self-hosted
 * production sets SITE_INDEXABLE=true. Preview and development deployments are always noindex.
 */
export function isIndexable(): boolean {
  if (process.env.VERCEL_ENV) return process.env.VERCEL_ENV === "production";
  return process.env.SITE_INDEXABLE === "true";
}

/** Analytics runs where indexing does: production only (or when forced for a local check). */
export function isAnalyticsEnabled(): boolean {
  return isIndexable() || process.env.ANALYTICS_FORCE === "true";
}
