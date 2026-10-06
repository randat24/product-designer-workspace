import "server-only";
import { revalidatePath } from "next/cache";
import { conflict, denied, transient, type Failure } from "@/shared/lib/action-result";
import { createClient } from "./server";

/** Re-renders the project shell: stage progress in the navigation rail and the ⌘K labels. */
export const refreshProjectShell = () => revalidatePath("/w/[ws]/p/[project]", "layout");

type Row = Record<string, unknown>;
export type TrackedResult =
  | { status: "ok"; version: string | null }
  | { status: "error" | "read-only" | "conflict" };

/**
 * Autosave of one row that re-renders the project shell only when something the shell shows changed
 * (Doherty threshold, docs/UX_LAWS.md UX-24; docs/QUALITY_REVIEW.md A3). Typing a description no longer
 * re-runs every query of the project; renaming a screen or filling a key brief field still updates the rail.
 *
 * `shown` — the columns the shell reads; `derive` — what it displays from them (a label, a done/not-done flag).
 * `expected` — the row's `updated_at` as this editor last saw it: when given, the row is changed only if nobody
 * changed it since (another tab, another member), otherwise the result is a conflict and nothing is written.
 * The new `updated_at` comes back as `version` for the next save.
 */
export async function updateTracked(
  table: string,
  match: { column: string; value: string },
  fields: object,
  shown: string,
  derive: (row: Row) => unknown = (row) => row,
  expected?: string | null,
): Promise<TrackedResult> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic over tables; callers validate fields with their schema
  const from = () => (supabase.from(table as never) as any);
  const columns = `${shown}, updated_at`;
  const { data: before } = await from().select(columns).eq(match.column, match.value).maybeSingle();
  let update = from().update(fields).eq(match.column, match.value);
  if (expected) update = update.eq("updated_at", expected);
  const { data: after, error } = await update.select(columns).maybeSingle();
  if (error) return { status: "error" };
  if (!after) {
    // Nothing written: either the row changed since the editor loaded it, or RLS hides it (read-only access).
    if (expected) {
      const { data: now } = await from().select("updated_at").eq(match.column, match.value).maybeSingle();
      if (now && (now as Row).updated_at !== expected) return { status: "conflict" };
    }
    return { status: "read-only" };
  }
  const { updated_at: version, ...shownAfter } = after as Row;
  const { updated_at: _was, ...shownBefore } = (before as Row | null) ?? {};
  if (JSON.stringify(derive(shownBefore)) !== JSON.stringify(derive(shownAfter))) refreshProjectShell();
  return { status: "ok", version: typeof version === "string" ? version : null };
}

/** The usual autosave answer for a tracked update. */
export function trackedSave(res: TrackedResult, messages: { failed?: string; readOnly?: string } = {}): { ok: true; version: string | null } | Failure {
  switch (res.status) {
    case "ok": return { ok: true, version: res.version };
    case "conflict": return conflict();
    case "read-only": return denied(messages.readOnly);
    default: return transient(messages.failed);
  }
}
