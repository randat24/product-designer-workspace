import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { DICTIONARIES, type Case, type Locale } from "./content";
import { snapshotToCase } from "./case-snapshot";

/** Published cases are re-read at most once a minute; publishing in the tool needs no rebuild. */
export const CASES_REVALIDATE = 60;

/** The database could not be read: the page says "temporarily unavailable" instead of showing other cases. */
export class CasesUnavailableError extends Error {
  constructor(cause?: unknown) {
    super("cases: the database could not be read", { cause });
    this.name = "CasesUnavailableError";
  }
}

/**
 * Cases shown on the site: the published case studies, in their order (docs/HANDOFF_TRIAGE.md, F04).
 * - The built-in sample cases are shown only in the explicit offline mode: SITE_SAMPLE_CASES=1 (a CI build with
 *   no database running) or no database settings at all (a local build).
 * - With settings, only the database counts. When it cannot be read, this throws: an already built page
 *   keeps its last good version (ISR does not replace it with an error), and a new render shows the
 *   «temporarily unavailable» page — never sample cases or an outdated copy from the code.
 * - A snapshot whose shape the page cannot render is left out, with a log line, instead of breaking the list.
 */
export async function getCases(locale: Locale): Promise<Case[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (process.env.SITE_SAMPLE_CASES === "1" || !url || !key) return DICTIONARIES[locale].cases_list;
  let rows: { slug: string; content: unknown; content_updated_at: string | null }[];
  try {
    const db = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => fetch(input, { ...init, next: { revalidate: CASES_REVALIDATE, tags: ["cases"] } }),
      },
    });
    const { data, error } = await db
      .from("case_studies")
      .select("slug, content, content_updated_at")
      .eq("status", "published")
      .order("position")
      .order("published_at", { ascending: false });
    if (error || !data) throw error ?? new Error("no data");
    rows = data;
  } catch (e) {
    throw new CasesUnavailableError(e);
  }
  return rows.flatMap((r) => {
    const item = snapshotToCase(r.slug, r.content, locale, r.content_updated_at ?? undefined);
    if (!item) console.error(`cases: the published snapshot of "${r.slug}" (${locale}) cannot be shown; check it in the case editor`);
    return item ? [item] : [];
  });
}
