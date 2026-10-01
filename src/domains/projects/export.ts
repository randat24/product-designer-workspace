import "server-only";
import { createClient } from "@/shared/lib/supabase/server";

/**
 * Every table that holds a project's data (a `project_id` column), in reading order: from the brief
 * to decisions and the case. `project_counters` is left out: it is internal (next free code number)
 * and not readable through row-level security. Files in Storage are listed in `attachments`
 * (paths and metadata), the files themselves are not inside the JSON.
 */
export const EXPORT_TABLES = [
  "project_briefs",
  "competitors", "comparison_features", "competitor_feature_values",
  "research_plans", "interview_guides", "interview_questions", "participants", "interviews", "interview_answers",
  "quotes", "observations", "patterns", "insights", "pain_points", "opportunities",
  "user_flows", "flow_nodes", "flow_edges", "flow_edge_cases",
  "screens", "screen_states", "design_decisions",
  "trace_links", "attachments", "case_studies", "activity_log",
] as const;

export const EXPORT_FORMAT = "pdw-project-export";
export const EXPORT_VERSION = 1;

const PAGE = 1000; // PostgREST returns at most this many rows per request.

/** Primary key per table, for a stable page order; `id` unless the table has a composite key. */
const ORDER: Partial<Record<(typeof EXPORT_TABLES)[number], string[]>> = {
  competitor_feature_values: ["competitor_id", "comparison_feature_id"],
};

/** The whole project as one JSON document, read with the signed-in person's rights (RLS). */
export async function buildProjectExport(projectId: string) {
  const supabase = await createClient();
  const { data: project, error } = await supabase.from("projects").select("*").eq("id", projectId).single();
  if (error) throw error;

  const tables: Record<string, unknown[]> = {};
  for (const table of EXPORT_TABLES) {
    const rows: unknown[] = [];
    for (let from = 0; ; from += PAGE) {
      // Table names come from the fixed list above; the typed client cannot narrow a loop variable.
      let query = supabase
        .from(table as "projects")
        .select("*")
        .eq("project_id" as "id", projectId);
      for (const column of ORDER[table] ?? ["id"]) query = query.order(column as "id");
      const { data, error: tableError } = await query.range(from, from + PAGE - 1);
      if (tableError) throw tableError;
      rows.push(...(data ?? []));
      if (!data || data.length < PAGE) break;
    }
    tables[table] = rows;
  }

  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exported_at: new Date().toISOString(),
    project,
    counts: Object.fromEntries(Object.entries(tables).map(([k, v]) => [k, v.length])),
    tables,
  };
}
