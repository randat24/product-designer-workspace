import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { dict, isLocale } from "@/site/content";
import { JsonLd } from "@/site/json-ld";
import { NoteEntry } from "@/site/note-entry";
import { getNotes } from "@/site/notes-source";
import { breadcrumbLd, graph, localeUrl, notesLd, pageMetadata } from "@/site/seo";
import { container } from "@/site/ui";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = dict(locale);
  const meta = pageMetadata({ locale, path: "/notes", title: d.seo.notes.title, description: d.seo.notes.description });
  return { ...meta, alternates: { ...meta.alternates, types: { "application/rss+xml": localeUrl(locale, "/notes/rss.xml") } } };
}

/** «Нотатки»: short posts, newest first, each with its reactions and the way to its thread. */
export default async function Notes({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = dict(locale);
  const notes = await getNotes(locale);
  const followUps = (n: number) => notes.filter((x) => x.parent === n).length;

  return (
    <div className={`${container} pb-20 pt-12 sm:pt-16`}>
      <JsonLd
        data={graph(
          notesLd(locale, notes, d.seo.notes.title, d.seo.notes.description),
          breadcrumbLd([
            { name: d.ui.home, url: localeUrl(locale, "") },
            { name: d.notes.title, url: localeUrl(locale, "/notes") },
          ]),
        )}
      />
      <header className="mb-10 flex max-w-[640px] flex-col gap-5">
        <p className="sg-eyebrow text-fg-secondary"><span className="sg-section-index">{String(notes.length).padStart(2, "0")} /</span>{d.nav.notes}</p>
        <h1 className="sg-heading">{d.notes.title}</h1>
        <p className="sg-lead">{d.notes.lead}</p>
        <p><a href={`/${locale}/notes/rss.xml`} className="sg-link">{d.notes.rss}</a></p>
      </header>
      {notes.length === 0 ? (
        <p className="sg-notes sg-note-empty">{d.notes.empty}</p>
      ) : (
        <div className="sg-notes">
          {notes.map((note) => (
            <NoteEntry key={note.number} note={note} locale={locale} link followUps={followUps(note.number)} location="notes" />
          ))}
        </div>
      )}
    </div>
  );
}
