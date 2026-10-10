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
 * The origin that auth links (password reset, the OAuth round trip) come back to. The request's own Origin
 * is kept only when it is this deployment: the site URL, the Vercel production, deployment or branch URL,
 * or localhost when not running on Vercel. Anything else gets the site URL, so a forged Origin header
 * cannot point a link from an auth e-mail at another host.
 */
export function trustedOrigin(requested: string | null | undefined): string {
  const site = getSiteUrl();
  if (!requested) return site;
  const vercel = [process.env.VERCEL_PROJECT_PRODUCTION_URL, process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL]
    .map(clean)
    .filter((v): v is string => !!v)
    .map((host) => `https://${host}`);
  if ([site, ...vercel].includes(requested)) return requested;
  if (!process.env.VERCEL && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(requested)) return requested;
  return site;
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
