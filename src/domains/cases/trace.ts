import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { CaseTrace, TraceNode, TraceStage } from "@/site/case-trace";

type Source = { stage: TraceStage; table: "observations" | "insights" | "pain_points" | "opportunities" | "user_flows" | "screens" | "design_decisions"; title: "title" | "name" | null; archivable: boolean };

// Observations keep their text off the site (it quotes research participants): code only.
const SOURCES: Source[] = [
  { stage: "observations", table: "observations", title: null, archivable: false },
  { stage: "insights", table: "insights", title: "title", archivable: true },
  { stage: "pains", table: "pain_points", title: "title", archivable: true },
  { stage: "opportunities", table: "opportunities", title: "title", archivable: true },
  { stage: "flows", table: "user_flows", title: "name", archivable: true },
  { stage: "screens", table: "screens", title: "name", archivable: true },
  { stage: "decisions", table: "design_decisions", title: "title", archivable: true },
];

/**
 * The records of a project and the links between them, for «Слід рішень» on the site (src/site/case-trace.ts).
 * Archived records and links to them are left out; null when a read fails.
 */
export async function collectTrace(supabase: SupabaseClient<Database>, projectId: string): Promise<CaseTrace | null> {
  const lists = await Promise.all(SOURCES.map(async (s) => {
    const columns = s.title ? `id, code, ${s.title}` : "id, code";
    let q = supabase.from(s.table).select(columns).eq("project_id", projectId);
    if (s.archivable) q = q.is("archived_at", null);
    const { data, error } = await q.order("code");
    if (error || !data) return null;
    return (data as unknown as Record<string, string | null>[]).map((r) => ({ id: r.id!, node: { code: r.code!, stage: s.stage, ...(s.title && r[s.title] ? { title: r[s.title]!.slice(0, 300) } : {}) } as TraceNode }));
  }));
  if (lists.some((l) => l === null)) return null;
  const byId = new Map(lists.flatMap((l) => l!).map((r) => [r.id, r.node.code]));
  const { data: links, error } = await supabase.from("trace_links").select("source_id, target_id").eq("project_id", projectId);
  if (error || !links) return null;
  const pairs = new Set<string>();
  for (const l of links) {
    const a = byId.get(l.source_id), b = byId.get(l.target_id);
    if (a && b && a !== b) pairs.add([a, b].sort().join("\u0000"));
  }
  return {
    nodes: lists.flatMap((l) => l!.map((r) => r.node)),
    links: [...pairs].map((p) => p.split("\u0000") as [string, string]),
  };
}
