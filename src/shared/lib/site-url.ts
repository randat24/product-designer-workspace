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
 * The origin that auth links (password reset, the OAuth round trip) come back to: the origin the visitor is
 * on, so the sign-in cookie set there is found again — on the main domain, an alias, a preview or localhost.
 * The Origin header is believed only when it names the host this request was sent to; a header that
 * disagrees with the request, or is not a URL, gets the site URL instead.
 */
export function trustedOrigin(requested: string | null | undefined, requestHost: string | null | undefined): string {
  const site = getSiteUrl();
  if (!requested || !requestHost) return site;
  try {
    const url = new URL(requested);
    const sameHost = url.host.toLowerCase() === requestHost.trim().toLowerCase();
    return sameHost && (url.protocol === "https:" || url.protocol === "http:") ? url.origin : site;
  } catch {
    return site;
  }
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
