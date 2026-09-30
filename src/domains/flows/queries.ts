import "server-only";
import { cache } from "react";
import { createClient } from "@/shared/lib/supabase/server";

/** Flows of a project with list numbers (steps, screen steps, missing edge cases). */
export const listFlows = cache(async (projectId: string) => {
  const supabase = await createClient();
  const [flows, stats] = await Promise.all([
    supabase.from("user_flows").select("id, code, name, description, status, updated_at").eq("project_id", projectId).order("code"),
    supabase.rpc("flow_stats", { p_project: projectId }),
  ]);
  if (flows.error) throw flows.error;
  if (stats.error) throw stats.error;
  const byId = new Map(stats.data.map((s) => [s.flow_id, s]));
  return flows.data.map((f) => ({
    ...f,
    steps: byId.get(f.id)?.node_count ?? 0,
    screens: byId.get(f.id)?.screen_count ?? 0,
    missing: byId.get(f.id)?.missing_cases ?? 0,
  }));
});

export type FlowNode = {
  id: string; kind: string; label: string; x: number; y: number;
  screen: { id: string; code: string; name: string } | null;
};
export type FlowEdge = { id: string; source: string; target: string; label: string | null; branch: string; condition: string | null };
export type EdgeCase = { id: string; kind: string; description: string | null; status: string; nodeId: string | null };

/** One flow with its canvas (nodes, edges) and edge-case checklist. */
export const getFlowByCode = cache(async (projectId: string, code: string) => {
  const supabase = await createClient();
  const { data: flow } = await supabase.from("user_flows")
    .select("id, code, name, description, status, viewport").eq("project_id", projectId).eq("code", code.toUpperCase()).maybeSingle();
  if (!flow) return null;
  const [nodes, edges, cases] = await Promise.all([
    supabase.from("flow_nodes").select("id, kind, label, pos_x, pos_y, screens(id, code, name)").eq("flow_id", flow.id).order("created_at"),
    supabase.from("flow_edges").select("id, source_node_id, target_node_id, label, branch, condition").eq("flow_id", flow.id).order("created_at"),
    supabase.from("flow_edge_cases").select("id, kind, description, status, node_id").eq("flow_id", flow.id).order("position").order("created_at"),
  ]);
  if (nodes.error) throw nodes.error;
  if (edges.error) throw edges.error;
  if (cases.error) throw cases.error;
  return {
    ...flow,
    nodes: nodes.data.map((n): FlowNode => ({ id: n.id, kind: n.kind, label: n.label, x: n.pos_x, y: n.pos_y, screen: n.screens })),
    edges: edges.data.map((e): FlowEdge => ({
      id: e.id, source: e.source_node_id, target: e.target_node_id, label: e.label, branch: e.branch, condition: e.condition,
    })),
    edgeCases: cases.data.map((c): EdgeCase => ({ id: c.id, kind: c.kind, description: c.description, status: c.status, nodeId: c.node_id })),
  };
});

/** Screens a Screen node can link to. */
export const listScreenOptions = cache(async (projectId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("screens").select("id, code, name").eq("project_id", projectId)
    .is("archived_at", null).order("code");
  if (error) throw error;
  return data;
});
