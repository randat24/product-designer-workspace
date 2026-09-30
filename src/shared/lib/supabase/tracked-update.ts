import "server-only";
import { revalidatePath } from "next/cache";
import { createClient } from "./server";

/** Re-renders the project shell: stage progress in the navigation rail and the ⌘K labels. */
export const refreshProjectShell = () => revalidatePath("/w/[ws]/p/[project]", "layout");

type Row = Record<string, unknown>;
export type TrackedResult = "ok" | "error" | "read-only";

/**
 * Autosave of one row that re-renders the project shell only when something the shell shows changed
 * (Doherty threshold, docs/UX_LAWS.md UX-24; docs/QUALITY_REVIEW.md A3). Typing a description no longer
 * re-runs every query of the project; renaming a screen or filling a key brief field still updates the rail.
 *
 * `shown` — the columns the shell reads; `derive` — what it displays from them (a label, a done/not-done flag).
 */
export async function updateTracked(
  table: string,
  match: { column: string; value: string },
  fields: object,
  shown: string,
  derive: (row: Row) => unknown = (row) => row,
): Promise<TrackedResult> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic over tables; callers validate fields with their schema
  const from = () => (supabase.from(table as never) as any);
  const { data: before } = await from().select(shown).eq(match.column, match.value).maybeSingle();
  const { data: after, error } = await from().update(fields).eq(match.column, match.value).select(shown).maybeSingle();
  if (error) return "error";
  // No row back: RLS filtered the update — read-only access.
  if (!after) return "read-only";
  if (JSON.stringify(derive((before as Row | null) ?? {})) !== JSON.stringify(derive(after as Row))) refreshProjectShell();
  return "ok";
}
