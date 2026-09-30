import "server-only";
import { cache } from "react";
import { createClient } from "@/shared/lib/supabase/server";
import { ENTITIES, isEntityType, type EntityType } from "@/shared/entities";

export type TraceEdge = {
  linkId: string;
  direction: "up" | "down";
  depth: number;
  relation: string;
  source: { type: EntityType; id: string };
  target: { type: EntityType; id: string };
  origin: "manual" | "ai_accepted" | "system";
};

/** Upstream (sources) and downstream (what it became) for one entity. RLS applies. */
export async function getTraceGraph(type: EntityType, id: string, maxDepth = 6) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("trace_graph", { p_type: type, p_id: id, p_max_depth: maxDepth });
  if (error) throw error;

  const edges: TraceEdge[] = (data ?? [])
    .filter((e) => isEntityType(e.source_type) && isEntityType(e.target_type))
    .map((e) => ({
      linkId: e.link_id,
      direction: e.direction === "up" ? "up" : "down",
      depth: e.depth,
      relation: e.relation,
      source: { type: e.source_type as EntityType, id: e.source_id },
      target: { type: e.target_type as EntityType, id: e.target_id },
      origin: e.origin,
    }));

  return {
    upstream: edges.filter((e) => e.direction === "up"),
    downstream: edges.filter((e) => e.direction === "down"),
  };
}

export type ResolvedEntity = {
  type: EntityType;
  id: string;
  code: string;
  title: string;
  href: string;
  /** Participant code behind research entities, for evidence lists. */
  participant?: string;
};

// Table and title column per traceable type that exists so far.
const SOURCES: Partial<Record<EntityType, { table: string; title: string; extra?: string }>> = {
  competitor: { table: "competitors", title: "name" },
  research_plan: { table: "research_plans", title: "title" },
  participant: { table: "participants", title: "role" },
  interview: { table: "interviews", title: "code", extra: "participants(code, role)" },
  answer: { table: "interview_answers", title: "body_text", extra: "interviews(code, participants(code))" },
  quote: { table: "quotes", title: "text", extra: "participants(code)" },
  observation: { table: "observations", title: "body_text", extra: "participants(code)" },
  pattern: { table: "patterns", title: "title" },
  insight: { table: "insights", title: "title" },
  pain_point: { table: "pain_points", title: "title" },
  opportunity: { table: "opportunities", title: "title" },
  user_flow: { table: "user_flows", title: "name" },
  screen: { table: "screens", title: "name" },
};

type Row = { id: string; code: string; [k: string]: unknown };
type Nested = { code?: string; role?: string | null; participants?: { code: string } | null } | null;

/** Code, title and link for a set of entity references (one query per type). */
export async function resolveEntities(base: string, refs: { type: EntityType; id: string }[]) {
  const supabase = await createClient();
  const byType = new Map<EntityType, Set<string>>();
  for (const r of refs) byType.set(r.type, (byType.get(r.type) ?? new Set()).add(r.id));

  const out = new Map<string, ResolvedEntity>();
  await Promise.all([...byType].map(async ([type, ids]) => {
    const src = SOURCES[type];
    if (!src) return;
    const columns = ["id", "code", src.title === "code" ? null : src.title, src.extra].filter(Boolean).join(", ");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- table name comes from the registry above
    const { data } = await (supabase.from(src.table as any) as any).select(columns).in("id", [...ids]);
    for (const row of (data ?? []) as Row[]) {
      const title = String(row[src.title] ?? "").trim();
      let href = `${base}/${ENTITIES[type].segment}/${row.code}`;
      let participant: string | undefined;
      if (type === "answer") {
        const iv = row.interviews as Nested;
        href = `${base}/research/interviews/${iv?.code ?? ""}`;
        participant = iv?.participants?.code;
      } else if (type === "pattern") {
        href = `${base}/synthesis#${row.code}`;
      } else if (type === "screen") {
        href = `${base}/screens`; // screen pages ship in Phase 8a
      } else if (type === "interview") {
        const p = row.participants as Nested;
        participant = p?.code;
      } else if (type === "quote" || type === "observation") {
        participant = (row.participants as Nested)?.code;
      }
      out.set(`${type}:${row.id}`, {
        type, id: row.id, code: row.code,
        title: type === "interview" ? [participant, (row.participants as Nested)?.role].filter(Boolean).join(" · ") : title,
        href, participant,
      });
    }
  }));
  return out;
}

export type LinkRule = { source_type: string; target_type: string; relation: string };

export const listRules = cache(async (): Promise<LinkRule[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("trace_relation_rules").select("source_type, target_type, relation");
  if (error) throw error;
  return data;
});

/** Entities of the given types in a project, for the link picker. */
export async function listLinkCandidates(base: string, projectId: string, types: EntityType[]) {
  const supabase = await createClient();
  const refs: { type: EntityType; id: string }[] = [];
  await Promise.all(types.map(async (type) => {
    const src = SOURCES[type];
    if (!src) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- table name comes from the registry above
    const { data } = await (supabase.from(src.table as any) as any).select("id").eq("project_id", projectId).limit(500);
    for (const r of (data ?? []) as { id: string }[]) refs.push({ type, id: r.id });
  }));
  const resolved = await resolveEntities(base, refs);
  return [...resolved.values()].sort((a, b) => a.code.localeCompare(b.code, "ru", { numeric: true }));
}
