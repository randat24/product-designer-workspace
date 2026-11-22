import "server-only";
import { dict, type Locale } from "../content";
import { getCases } from "../cases-source";
import { getNotes } from "../notes-source";
import { getSiteProfile } from "../profile-source";
import { applyProfile } from "../site-profile";
import { isIndexable } from "@/shared/lib/site-url";
import { aboutMarkdown, caseMarkdown, casesMarkdown, homeMarkdown, notesMarkdown } from "./markdown";

/**
 * The Markdown of a page by its locale-less path ("" is home, "/cases/<slug>" a case), or null when there is no
 * such page. `noindex`: a sample case, kept out of search like its HTML page.
 */
export async function pageMarkdown(locale: Locale, path: string): Promise<{ body: string; noindex?: boolean } | null> {
  if (path === "/notes") return { body: notesMarkdown(locale, dict(locale), await getNotes(locale)) };
  if (path === "/about") return { body: aboutMarkdown(locale, applyProfile(dict(locale), await getSiteProfile(locale))) };
  const d = dict(locale);
  if (path === "") return { body: homeMarkdown(locale, applyProfile(d, await getSiteProfile(locale)), await getCases(locale)) };
  if (path === "/cases") return { body: casesMarkdown(locale, d, await getCases(locale)) };
  const slug = /^\/cases\/([a-z0-9-]+)$/.exec(path)?.[1];
  if (!slug) return null;
  const item = (await getCases(locale)).find((c) => c.slug === slug);
  return item ? { body: caseMarkdown(locale, d, item), noindex: item.sample } : null;
}

/**
 * A text response for agents. The canonical Link header points search engines to the HTML page, so the
 * Markdown twin is not a duplicate in their index; previews stay out of every index, like the rest of the site.
 */
export function agentResponse(body: string, type: string, opts: { canonical?: string; noindex?: boolean } = {}): Response {
  const headers: Record<string, string> = {
    "Content-Type": `${type}; charset=utf-8`,
    "Access-Control-Allow-Origin": "*",
    "Vary": "Accept",
  };
  if (opts.canonical) headers.Link = `<${opts.canonical}>; rel="canonical"`;
  if (!isIndexable() || opts.noindex) headers["X-Robots-Tag"] = "noindex";
  return new Response(body, { headers });
}
