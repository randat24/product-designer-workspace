import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import { trackAttrs } from "./analytics/track";
import { dict, type Locale } from "./content";
import { SIZES, responsive } from "./img";
import { linkify } from "./linkify";
import { NoteReactions } from "./note-reactions";
import type { Note } from "./notes-source";
import { sg } from "./signal/ui";

const dateFormat = (locale: Locale, iso: string) =>
  new Intl.DateTimeFormat(locale === "uk" ? "uk-UA" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Kyiv" }).format(new Date(iso));

/**
 * One note on the site: date and number, the note it continues, its text with links, picture, tags and reactions.
 * In a list (`link`) it ends with the way to its own page; on that page the current note is marked.
 */
export function NoteEntry({ note, locale, link, current, followUps, location }: {
  note: Note;
  locale: Locale;
  /** In a list: the number is a link, and «Відкрити нотатку →» closes it. */
  link?: boolean;
  current?: boolean;
  /** How many notes continue this one, shown in a list. */
  followUps?: number;
  location: "notes" | "note";
}) {
  const d = dict(locale);
  const href = `/${locale}/notes/${note.number}`;
  const open = trackAttrs("note_open", { note_number: note.number, location });
  return (
    <article className={cn("sg-note", current && "sg-note--current")} aria-current={current ? "true" : undefined}
      aria-labelledby={`note-${note.number}-h`}>
      <header className="sg-note-meta">
        <p className={sg.eyebrow} id={`note-${note.number}-h`}>
          {link ? <Link href={href} {...open}>N-{note.number}</Link> : <>N-{note.number}</>}
          <span aria-hidden> · </span>
          <time dateTime={note.publishedAt}>{dateFormat(locale, note.publishedAt)}</time>
        </p>
        {note.parent != null && (
          <Link href={`/${locale}/notes/${note.parent}`} className="sg-note-thread">{d.notes.continues(note.parent)}</Link>
        )}
      </header>
      <p className="sg-note-body">
        {linkify(note.body).map((part, i) =>
          "href" in part
            ? <a key={i} href={part.href} target="_blank" rel="noopener noreferrer nofollow">{part.text}</a>
            : part.text)}
      </p>
      {note.image && (
        // eslint-disable-next-line @next/next/no-img-element -- public Storage file, sizes known
        <img className="sg-note-image" {...responsive(note.image.src, note.image.width, SIZES.note)} alt={note.image.alt}
          width={note.image.width} height={note.image.height} loading="lazy" decoding="async" />
      )}
      {note.tags.length > 0 && (
        <ul className="mt-5 flex flex-wrap gap-2">
          {note.tags.map((tag) => <li key={tag} className={sg.tag}>#{tag}</li>)}
        </ul>
      )}
      <div className="sg-note-foot">
        <NoteReactions number={note.number} initial={note.reactions} labels={d.notes.reactions} groupLabel={d.notes.reactionsLabel} failed={d.notes.reactionFailed} />
        {link && (
          <Link href={href} className={sg.link} {...open}>
            {followUps ? `${d.notes.continued(followUps)} · ` : ""}{d.notes.open} <span aria-hidden>→</span>
          </Link>
        )}
      </div>
    </article>
  );
}
