"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/shared/lib/supabase/server";
import { denied, invalid, transient, type Failure } from "@/shared/lib/action-result";
import { insertOnce, requestIdOf } from "@/shared/lib/supabase/insert-once";
import { trackedSave, updateTracked } from "@/shared/lib/supabase/tracked-update";
import { t } from "@/shared/i18n/uk";
import { flowMetaSchema, type FlowMeta } from "./schema";

// The canvas keeps its own state, so node/edge edits do not re-render the page.
// Only changes that other pages show (names, stats, screens) revalidate.
const refresh = () => revalidatePath("/w/[ws]/p/[project]", "layout");
type Result = { ok: true; id?: string; code?: string; version?: string | null } | Failure;
const done = (error: { message: string } | null, extra?: { id?: string; code?: string }): Result =>
  error ? denied() : { ok: true, ...extra };

const uuid = z.uuid();
const nodeKind = z.enum(["start", "screen", "action", "decision", "system", "error", "success", "end"]);
const branch = z.enum(["default", "yes", "no", "error", "back"]);
const coord = z.number().finite().min(-1e6).max(1e6);

async function projectBase(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("projects").select("slug, workspaces(slug)").eq("id", projectId).maybeSingle();
  return data?.workspaces ? `/w/${data.workspaces.slug}/p/${data.slug}` : "/";
}

// ---------------------------------------------------------------- flows

/** New flow with a Start node. From an opportunity it is traced as "opportunity addresses flow". */
export async function createFlow(formData: FormData): Promise<Result> {
  const projectId = uuid.safeParse(formData.get("projectId"));
  if (!projectId.success) return invalid();
  const opportunityId = uuid.safeParse(formData.get("opportunityId"));
  const name = z.string().trim().min(1).max(200).safeParse(formData.get("name"));

  const supabase = await createClient();
  let title = name.success ? name.data : "";
  if (!title && opportunityId.success) {
    const { data } = await supabase.from("opportunities").select("title").eq("id", opportunityId.data).maybeSingle();
    title = data?.title ?? "";
  }
  const id = requestIdOf(formData);
  const flow = await insertOnce("user_flows", { project_id: projectId.data, name: title || t.flows.add }, id);
  if (!flow) return denied();
  // A repeated press finds the flow of the first one: its start step and link may already be there.
  const { count } = await supabase.from("flow_nodes").select("id", { count: "exact", head: true }).eq("flow_id", flow.id);
  const start = count ? null : (await supabase.from("flow_nodes").insert({
    project_id: projectId.data, flow_id: flow.id, kind: "start", label: t.flows.newLabel.start, pos_x: 0, pos_y: 0,
  })).error;
  const linked = opportunityId.success ? (await supabase.from("trace_links").insert({
    project_id: projectId.data, source_type: "opportunity", source_id: opportunityId.data,
    target_type: "user_flow", target_id: flow.id, relation: "addresses",
  })).error : null;
  if (start || (linked && linked.code !== "23505")) {
    // Half a flow (no start step, or "from an opportunity" without the link) is undone; the press can be repeated.
    await supabase.from("user_flows").delete().eq("id", flow.id);
    return transient();
  }
  refresh();
  redirect(`${await projectBase(projectId.data)}/flows/${flow.code}`);
}

export async function saveFlowMeta(id: string, input: FlowMeta): Promise<Result> {
  const parsed = flowMetaSchema.safeParse(input);
  if (!uuid.safeParse(id).success || !parsed.success) return invalid();
  // No conflict check here: the canvas on the same page saves the viewport into this row while you type.
  return trackedSave(await updateTracked("user_flows", { column: "id", value: id }, parsed.data, "name"));
}

export async function saveViewport(id: string, viewport: { x: number; y: number; zoom: number }): Promise<Result> {
  const v = z.object({ x: coord, y: coord, zoom: z.number().min(0.05).max(4) }).safeParse(viewport);
  if (!uuid.safeParse(id).success || !v.success) return invalid();
  const supabase = await createClient();
  const { error } = await supabase.from("user_flows").update({ viewport: v.data }).eq("id", id);
  return done(error);
}

export async function deleteFlow(formData: FormData): Promise<Result> {
  const id = uuid.safeParse(formData.get("id"));
  const projectId = uuid.safeParse(formData.get("projectId")).data;
  if (!id.success) return invalid();
  const supabase = await createClient();
  const { data, error } = await supabase.from("user_flows").delete().eq("id", id.data).select("project_id").maybeSingle();
  if (error) return denied();
  if (!data) {
    // Nothing deleted: either it is already gone (an earlier press whose answer was lost) or this is read-only access.
    const { data: still } = await supabase.from("user_flows").select("id").eq("id", id.data).maybeSingle();
    if (still || !projectId) return denied();
  }
  refresh();
  redirect(`${await projectBase(data?.project_id ?? projectId!)}/flows`);
}

// ---------------------------------------------------------------- nodes

const nodeInput = z.object({ flowId: uuid, kind: nodeKind, label: z.string().trim().max(200), x: coord, y: coord });

export async function addNode(input: z.input<typeof nodeInput>): Promise<Result> {
  const p = nodeInput.safeParse(input);
  if (!p.success) return invalid();
  const supabase = await createClient();
  const { data: flow } = await supabase.from("user_flows").select("project_id").eq("id", p.data.flowId).maybeSingle();
  if (!flow) return invalid();
  const { data, error } = await supabase.from("flow_nodes").insert({
    project_id: flow.project_id, flow_id: p.data.flowId, kind: p.data.kind, label: p.data.label, pos_x: p.data.x, pos_y: p.data.y,
  }).select("id").single();
  return done(error, { id: data?.id });
}

const nodePatch = z.object({ label: z.string().trim().max(200), kind: nodeKind }).partial();

export async function updateNode(id: string, patch: z.input<typeof nodePatch>): Promise<Result> {
  const p = nodePatch.safeParse(patch);
  if (!uuid.safeParse(id).success || !p.success) return invalid();
  const supabase = await createClient();
  // A node that stops being a Screen drops its screen (and the trace link with it).
  const extra = p.data.kind && p.data.kind !== "screen" ? { screen_id: null } : {};
  const { error } = await supabase.from("flow_nodes").update({ ...p.data, ...extra }).eq("id", id);
  return done(error);
}

export async function moveNodes(moves: { id: string; x: number; y: number }[]): Promise<Result> {
  const p = z.array(z.object({ id: uuid, x: coord, y: coord })).max(500).safeParse(moves);
  if (!p.success) return invalid();
  const supabase = await createClient();
  const results = await Promise.all(p.data.map((m) =>
    supabase.from("flow_nodes").update({ pos_x: m.x, pos_y: m.y }).eq("id", m.id)));
  return done(results.find((r) => r.error)?.error ?? null);
}

export async function deleteElements(nodeIds: string[], edgeIds: string[]): Promise<Result> {
  const ids = z.array(uuid).max(500);
  const n = ids.safeParse(nodeIds);
  const e = ids.safeParse(edgeIds);
  if (!n.success || !e.success) return invalid();
  const supabase = await createClient();
  if (e.data.length) {
    const { error } = await supabase.from("flow_edges").delete().in("id", e.data);
    if (error) return denied();
  }
  if (n.data.length) {
    const { error } = await supabase.from("flow_nodes").delete().in("id", n.data);
    if (error) return denied();
  }
  return { ok: true };
}

/** Link a Screen node to an existing screen, or unlink it (null). */
export async function linkScreen(nodeId: string, screenId: string | null): Promise<Result> {
  if (!uuid.safeParse(nodeId).success || (screenId !== null && !uuid.safeParse(screenId).success)) return invalid();
  const supabase = await createClient();
  const { error } = await supabase.from("flow_nodes").update({ screen_id: screenId }).eq("id", nodeId);
  if (!error) refresh();
  return done(error);
}

/** Create a screen (SCR-###) named after the node and link it. */
export async function createScreenForNode(nodeId: string): Promise<Result & { name?: string }> {
  if (!uuid.safeParse(nodeId).success) return invalid();
  const supabase = await createClient();
  const { data: node } = await supabase.from("flow_nodes").select("project_id, label").eq("id", nodeId).maybeSingle();
  if (!node) return invalid();
  const name = node.label.trim() || t.flows.newLabel.screen;
  const { data: screen, error } = await supabase.from("screens").insert({ project_id: node.project_id, name }).select("id, code").single();
  if (error) return denied();
  const linked = await supabase.from("flow_nodes").update({ screen_id: screen.id }).eq("id", nodeId).select("id");
  if (linked.error || !linked.data.length) {
    // An unlinked screen would be left behind with nobody knowing it was made: remove it.
    await supabase.from("screens").delete().eq("id", screen.id);
    return denied();
  }
  refresh();
  return { ok: true, id: screen.id, code: screen.code, name };
}

// ---------------------------------------------------------------- edges

export async function addEdge(input: { flowId: string; source: string; target: string; branch?: string }): Promise<Result> {
  const p = z.object({ flowId: uuid, source: uuid, target: uuid, branch: branch.default("default") }).safeParse(input);
  if (!p.success || p.data.source === p.data.target) return invalid();
  const supabase = await createClient();
  const { data: flow } = await supabase.from("user_flows").select("project_id").eq("id", p.data.flowId).maybeSingle();
  if (!flow) return invalid();
  const { data, error } = await supabase.from("flow_edges").insert({
    project_id: flow.project_id, flow_id: p.data.flowId, source_node_id: p.data.source, target_node_id: p.data.target, branch: p.data.branch,
  }).select("id").single();
  return done(error, { id: data?.id });
}

const edgePatch = z.object({
  label: z.string().trim().max(120).transform((v) => v || null),
  branch,
  condition: z.string().trim().max(2000).transform((v) => v || null),
}).partial();

export async function updateEdge(id: string, patch: z.input<typeof edgePatch>): Promise<Result> {
  const p = edgePatch.safeParse(patch);
  if (!uuid.safeParse(id).success || !p.success) return invalid();
  const supabase = await createClient();
  const { error } = await supabase.from("flow_edges").update(p.data).eq("id", id);
  return done(error);
}

// ---------------------------------------------------------------- edge cases

const casePatch = z.object({
  status: z.enum(["missing", "covered", "not_applicable"]),
  description: z.string().trim().max(500).transform((v) => v || null),
  nodeId: uuid.nullable(),
}).partial();

export async function saveEdgeCase(id: string, patch: z.input<typeof casePatch>): Promise<Result> {
  const p = casePatch.safeParse(patch);
  if (!uuid.safeParse(id).success || !p.success) return invalid();
  const { nodeId, ...rest } = p.data;
  const supabase = await createClient();
  const { error } = await supabase.from("flow_edge_cases")
    .update({ ...rest, ...(nodeId !== undefined ? { node_id: nodeId } : {}) }).eq("id", id);
  if (!error && rest.status) refresh();
  return done(error);
}

export async function addEdgeCase(flowId: string, description: string): Promise<Result> {
  const d = z.string().trim().min(1).max(500).safeParse(description);
  if (!uuid.safeParse(flowId).success || !d.success) return invalid();
  const supabase = await createClient();
  const { data: flow } = await supabase.from("user_flows").select("project_id").eq("id", flowId).maybeSingle();
  if (!flow) return invalid();
  const { data, error } = await supabase.from("flow_edge_cases").insert({
    project_id: flow.project_id, flow_id: flowId, kind: "custom", description: d.data, position: 100,
  }).select("id").single();
  if (!error) refresh();
  return done(error, { id: data?.id });
}

export async function deleteEdgeCase(id: string): Promise<Result> {
  if (!uuid.safeParse(id).success) return invalid();
  const supabase = await createClient();
  const { error } = await supabase.from("flow_edge_cases").delete().eq("id", id).eq("kind", "custom");
  if (!error) refresh();
  return done(error);
}
