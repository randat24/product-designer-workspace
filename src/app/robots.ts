import type { MetadataRoute } from "next";
import { getSiteUrl, isIndexable } from "@/shared/lib/site-url";

// Production: the portfolio is open, the private workspace is not crawled (it also sends noindex).
// /login and /auth are not disallowed on purpose: crawlers must be able to read their noindex.
// AI assistants are named on purpose (docs/SEO.md, «AI-поиск»): their search and on-demand crawlers
// fetch the pages they cite, so a stricter "*" rule later must not shut them out by accident.
// Preview / development deployments: nothing is crawled.
const PRIVATE = ["/app", "/w/", "/account"];

/** Search and user-triggered crawlers of AI assistants (ChatGPT, Claude, Perplexity, Gemini, Copilot). */
const AI_AGENTS = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "GPTBot",
  "Claude-SearchBot",
  "Claude-User",
  "ClaudeBot",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Bingbot",
  "Applebot-Extended",
];

export default function robots(): MetadataRoute.Robots {
  const origin = getSiteUrl();
  if (!isIndexable()) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      { userAgent: AI_AGENTS, allow: "/", disallow: PRIVATE },
    ],
    sitemap: `${origin}/sitemap.xml`,
  };
}
