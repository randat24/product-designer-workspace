import { isLocale } from "@/site/content";
import { localeUrl } from "@/site/seo";
import { agentResponse, pageMarkdown } from "@/site/agents/source";

// Markdown twins of the public pages, for AI agents (src/site/agents/markdown.ts). Reached only through the
// rewrites in next.config.ts: /uk.md, /uk/about.md, /uk/cases/<slug>.md…, or the page URL itself requested
// with `Accept: text/markdown`. Opened directly, /md/… is the site 404 (the middleware does not know it).
export const revalidate = 60;

export async function GET(_req: Request, { params }: { params: Promise<{ locale: string; path?: string[] }> }) {
  const { locale, path = [] } = await params;
  if (!isLocale(locale)) return new Response("Not found\n", { status: 404 });
  const page = path.length ? `/${path.join("/")}` : "";
  const md = await pageMarkdown(locale, page);
  if (!md) return new Response("Not found\n", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  return agentResponse(md.body, "text/markdown", { canonical: localeUrl(locale, page), noindex: md.noindex });
}
