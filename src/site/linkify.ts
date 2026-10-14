/** Splits text into plain parts and http(s) links, so a note can show its links as links. Trailing punctuation stays text. */
export function linkify(text: string): ({ text: string } | { href: string; text: string })[] {
  const out: ({ text: string } | { href: string; text: string })[] = [];
  const re = /https?:\/\/[^\s<>"]+/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    let url = m[0];
    const trail = url.match(/[.,;:!?)»”'"]+$/)?.[0] ?? "";
    // A closing bracket belongs to the link when the link opened one (wikipedia-style).
    const keepParen = trail.startsWith(")") && url.slice(0, -trail.length).includes("(");
    const cut = keepParen ? trail.slice(1) : trail;
    if (cut) url = url.slice(0, -cut.length);
    if (m.index > last) out.push({ text: text.slice(last, m.index) });
    out.push({ href: url, text: url.replace(/^https?:\/\/(www\.)?/, "") });
    last = m.index + url.length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}
