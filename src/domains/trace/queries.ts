import "server-only";
import { createClient } from "@/shared/lib/supabase/server";
import { isEntityType, type EntityType } from "@/shared/entities";

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
