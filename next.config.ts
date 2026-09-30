import type { NextConfig } from "next";

// Indexing is decided per deployment (same rule as src/shared/lib/site-url.ts#isIndexable):
// Vercel production, or a self-hosted production with SITE_INDEXABLE=true.
const indexable = process.env.VERCEL_ENV ? process.env.VERCEL_ENV === "production" : process.env.SITE_INDEXABLE === "true";

const NOINDEX = { key: "X-Robots-Tag", value: "noindex, nofollow" };

// Safe everywhere: no script-src/style-src, so Next.js, Supabase, GA4 and Speed Insights keep working.
// It only forbids framing, <base> hijacking and plugins. HSTS is set by Vercel for every domain.
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
];

const config: NextConfig = {
  typedRoutes: false,
  poweredByHeader: false,
  // Fonts read from disk by the Open Graph image route.
  outputFileTracingIncludes: { "/og": ["./src/site/og/fonts/**"] },
  // globalNotFound: one 404 page (app/global-not-found.tsx) for the several root layouts.
  experimental: { serverActions: { bodySizeLimit: "2mb" }, globalNotFound: true },
  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      // The private workspace and auth never go to search results (metadata says so too;
      // the header also covers redirects and route handlers).
      ...["/app", "/app/:path*", "/w/:path*", "/account", "/account/:path*", "/login", "/auth/:path*"].map((source) => ({
        source,
        headers: [NOINDEX],
      })),
      // Preview and development deployments: nothing is indexed.
      ...(indexable ? [] : [{ source: "/:path*", headers: [NOINDEX] }]),
    ];
  },
};

export default config;
