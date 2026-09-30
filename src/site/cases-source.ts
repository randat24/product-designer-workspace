import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { DICTIONARIES, type Case, type Locale } from "./content";

/** Published cases are re-read at most once a minute; publishing in the tool needs no rebuild. */
export const CASES_REVALIDATE = 60;

type Snapshot = Partial<Record<Locale, Partial<Case>>>;

function toCase(slug: string, content: Snapshot, locale: Locale, updatedAt?: string): Case | null {
  const c = content[locale] ?? content.uk;
  if (!c?.title) return null;
  return {
    slug,
    sticker: c.sticker ?? "var(--s3)",
    year: c.year ?? "",
    title: c.title,
    client: c.client ?? "",
    role: c.role ?? "",
    summary: c.summary ?? "",
    tags: c.tags ?? [],
    metrics: c.metrics ?? [],
    sections: c.sections ?? [],
    story: c.story,
    kind: c.kind,
    liveUrl: c.liveUrl,
    gallery: c.gallery,
    sample: c.sample,
    updatedAt,
  };
}

/**
 * Cases shown on the site: the published case studies from the workspace, in their order.
 * Falls back to the built-in samples only when the database is not reachable
 * (no keys in a local build, network error) so the site never renders empty by accident.
 */
export async function getCases(locale: Locale): Promise<Case[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const fallback = DICTIONARIES[locale].cases_list;
  if (!url || !key) return fallback;
  try {
    const db = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => fetch(input, { ...init, next: { revalidate: CASES_REVALIDATE, tags: ["cases"] } }),
      },
    });
    const { data, error } = await db
      .from("case_studies")
      .select("slug, content, updated_at")
      .eq("status", "published")
      .order("position")
      .order("published_at", { ascending: false });
    if (error || !data) return fallback;
    return data.map((r) => toCase(r.slug, r.content as Snapshot, locale, r.updated_at)).filter((c): c is Case => c !== null);
  } catch {
    return fallback;
  }
}
