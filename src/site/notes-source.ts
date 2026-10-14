import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { Locale } from "./content";

export const NOTES_TAG = "notes";
/** Published notes are re-read at most once a minute; publishing in the tool revalidates at once. */
export const NOTES_REVALIDATE = 60;

export type NoteReactions = { agree?: number; disagree?: number; new?: number };
export type Note = {
  number: number;
  body: string;
  image: { src: string; alt: string; width: number; height: number } | null;
  tags: string[];
  /** The note this one continues, when it is published. */
  parent: number | null;
  publishedAt: string;
  reactions: NoteReactions;
};

type Row = {
  number: number; body_uk: string; body_en: string | null; image: Note["image"]; tags: string[] | null;
  parent: number | null; published_at: string; reactions: NoteReactions | null;
};

function isImage(v: unknown): v is NonNullable<Note["image"]> {
  if (!v || typeof v !== "object") return false;
  const i = v as Record<string, unknown>;
  return typeof i.src === "string" && /^(\/|https?:\/\/)/.test(i.src) && typeof i.width === "number" && typeof i.height === "number";
}

/**
 * Published notes in a language, newest first. The English site shows only notes with English text. Without
 * database settings (a local or CI build) there are none, and the pages say so. A database that cannot be
 * read throws: a built page keeps its last good version.
 */
export async function getNotes(locale: Locale): Promise<Note[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (process.env.SITE_SAMPLE_CASES === "1" || !url || !key) return [];
  const db = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...init, next: { revalidate: NOTES_REVALIDATE, tags: [NOTES_TAG] } }) },
  });
  const { data, error } = await db.rpc("site_notes");
  if (error) throw new Error("notes: the database could not be read", { cause: error });
  const rows = (Array.isArray(data) ? data : []) as unknown as Row[];
  return rows.flatMap((r) => {
    const body = (locale === "en" ? r.body_en : r.body_uk)?.trim();
    if (!body) return [];
    return [{
      number: r.number,
      body,
      image: isImage(r.image) ? { ...r.image, alt: typeof r.image.alt === "string" ? r.image.alt : "" } : null,
      tags: r.tags ?? [],
      parent: r.parent,
      publishedAt: r.published_at,
      reactions: r.reactions ?? {},
    }];
  });
}

/**
 * The thread a note belongs to, oldest first: the notes it continues, the note, and the notes that continue
 * it (each continuation's own continuations too). Missing links (a note hidden in this language) end the chain.
 */
export function threadOf(notes: Note[], number: number): Note[] {
  const by = new Map(notes.map((n) => [n.number, n]));
  const note = by.get(number);
  if (!note) return [];
  const before: Note[] = [];
  const seen = new Set([number]);
  for (let p = note.parent; p != null && !seen.has(p); p = by.get(p)?.parent ?? null) {
    const parent = by.get(p);
    if (!parent) break;
    seen.add(p);
    before.unshift(parent);
  }
  const after: Note[] = [];
  const queue = [number];
  while (queue.length) {
    const current = queue.shift()!;
    for (const child of notes.filter((n) => n.parent === current && !seen.has(n.number)).sort((a, b) => a.publishedAt.localeCompare(b.publishedAt))) {
      seen.add(child.number);
      after.push(child);
      queue.push(child.number);
    }
  }
  return [...before, note, ...after];
}
