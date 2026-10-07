import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { CaseProcess } from "@/site/case-process";

type Table = "competitors" | "research_plans" | "observations" | "insights" | "pain_points" | "opportunities" | "user_flows" | "screens" | "design_decisions";

// Stage → table. Archived records are left out, as in the tool's own lists; observations are never archived.
const TABLES: [keyof CaseProcess, Table, boolean][] = [
  ["competitors", "competitors", true],
  ["research", "research_plans", true],
  ["observations", "observations", false],
  ["insights", "insights", true],
  ["pains", "pain_points", true],
  ["opportunities", "opportunities", true],
  ["flows", "user_flows", true],
  ["screens", "screens", true],
  ["decisions", "design_decisions", true],
];

/** Counts the records of each stage of a project, as the signed-in member sees them; null when a count fails. */
export async function countProcess(supabase: SupabaseClient<Database>, projectId: string): Promise<CaseProcess | null> {
  const results = await Promise.all(TABLES.map(async ([, table, archivable]) => {
    let q = supabase.from(table).select("id", { count: "exact", head: true }).eq("project_id", projectId);
    if (archivable) q = q.is("archived_at", null);
    const { count, error } = await q;
    return error ? null : (count ?? 0);
  }));
  if (results.some((n) => n === null)) return null;
  return Object.fromEntries(TABLES.map(([key], i) => [key, results[i]])) as CaseProcess;
}
