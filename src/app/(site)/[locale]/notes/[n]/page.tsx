import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { LOCALES, dict, isLocale, type Locale } from "@/site/content";
import { JsonLd } from "@/site/json-ld";
import { NoteEntry } from "@/site/note-entry";
import { getNotes, threadOf } from "@/site/notes-source";
import { breadcrumbLd, clampDescription, graph, localeUrl, noteHeadline, noteLd, pageMetadata } from "@/site/seo";
import { container } from "@/site/ui";

// Notes published later render on first visit and are then cached.
export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  const lists = await Promise.all(LOCALES.map(async (locale) => ({ locale, notes: await getNotes(locale).catch(() => []) })));
  return lists.flatMap(({ locale, notes }) => notes.map((n) => ({ locale, n: String(n.number) })));
}

type Params = Promise<{ locale: string; n: string }>;

async function load(locale: Locale, raw: string) {
  const number = Number(raw);
  if (!Number.isInteger(number) || number < 1) return null;
  const notes = await getNotes(locale);
  const note = notes.find((x) => x.number === number);
  return note ? { note, notes } : null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, n } = await params;
  if (!isLocale(locale)) return {};
  const found = await load(locale, n).catch(() => null);
  if (!found) return {};
  // A note without English text exists only in Ukrainian; hreflang says so.
  const inEn = locale === "en" || (await getNotes("en").catch(() => [])).some((x) => x.number === found.note.number);
  return pageMetadata({
    locale,
    path: `/notes/${found.note.number}`,
    title: noteHeadline(found.note.body),
    description: clampDescription(found.note.body),
    type: "article",
    noteNumber: found.note.number,
    locales: inEn ? undefined : ["uk"],
  });
}

/** One note with its whole thread and its reactions. */
export default async function NotePage({ params }: { params: Params }) {
  const { locale, n } = await params;
  if (!isLocale(locale)) notFound();
  const found = await load(locale, n);
  if (!found) {
    // The language switch on a note written only in Ukrainian lands here: the English feed, not a 404.
    if (locale === "en" && (await load("uk", n))) redirect("/en/notes");
    notFound();
  }
  const { note, notes } = found;
  const d = dict(locale);
  const thread = threadOf(notes, note.number);

  return (
    <div className={`${container} pb-20 pt-12 sm:pt-16`}>
      <JsonLd
        data={graph(
          noteLd(locale, note),
          breadcrumbLd([
            { name: d.ui.home, url: localeUrl(locale, "") },
            { name: d.notes.title, url: localeUrl(locale, "/notes") },
            { name: `N-${note.number}`, url: localeUrl(locale, `/notes/${note.number}`) },
          ]),
        )}
      />
      <header className="mb-10 flex max-w-[40rem] flex-col gap-5">
        <p className="sg-eyebrow text-fg-secondary">
          <Link href={`/${locale}/notes`} className="hover:text-fg">← {d.notes.back}</Link>
        </p>
        <h1 className="sg-heading">
          {thread.length > 1 ? d.notes.thread : d.nav.notes}
          <span className="sg-heading-count">[N-{note.number}]</span>
        </h1>
      </header>
      <div className="sg-notes">
        {thread.map((x) => (
          <NoteEntry key={x.number} note={x} locale={locale} link={x.number !== note.number} current={thread.length > 1 && x.number === note.number} location="note" />
        ))}
      </div>
    </div>
  );
}
