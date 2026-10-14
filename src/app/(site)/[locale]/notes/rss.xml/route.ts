import { dict, isLocale } from "@/site/content";
import { getNotes } from "@/site/notes-source";
import { localeUrl, noteHeadline } from "@/site/seo";

export const revalidate = 300;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** RSS 2.0 of the notes in one language: for readers and for cross-posting. */
export async function GET(_: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return new Response("Not found", { status: 404 });
  const d = dict(locale);
  const notes = (await getNotes(locale)).slice(0, 50);
  const feed = localeUrl(locale, "/notes");
  const items = notes.map((n) => {
    const url = localeUrl(locale, `/notes/${n.number}`);
    return `<item><title>${esc(noteHeadline(n.body))}</title><link>${url}</link><guid isPermaLink="true">${url}</guid>`
      + `<pubDate>${new Date(n.publishedAt).toUTCString()}</pubDate><description>${esc(n.body)}</description>`
      + n.tags.map((t) => `<category>${esc(t)}</category>`).join("") + `</item>`;
  }).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>`
    + `<title>${esc(`${d.notes.title} — ${d.name}`)}</title><link>${feed}</link><description>${esc(d.seo.notes.description)}</description>`
    + `<language>${locale}</language><atom:link href="${feed}/rss.xml" rel="self" type="application/rss+xml"/>`
    + (notes[0] ? `<lastBuildDate>${new Date(notes[0].publishedAt).toUTCString()}</lastBuildDate>` : "")
    + `${items}</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } });
}
