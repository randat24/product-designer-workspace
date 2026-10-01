"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/shared/lib/supabase/server";
import { updateTracked } from "@/shared/lib/supabase/tracked-update";
import { t } from "@/shared/i18n/uk";
import { flowMetaSchema, type FlowMeta } from "./schema";

// The canvas keeps its own state, so node/edge edits do not re-render the page.
// Only changes that other pages show (names, stats, screens) revalidate.
const refresh = () => revalidatePath("/w/[ws]/p/[project]", "layout");
type Result = { ok: true; id?: string; code?: string } | { ok: false; error: string };
const fail = (error: string = t.autosave.failed): Result => ({ ok: false, error });
const done = (error: { message: string } | null, extra?: { id?: string; code?: string }): Result =>
  error ? fail(t.autosave.readOnly) : { ok: true, ...extra };

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
export async function createFlow(formData: FormData) {
  const projectId = uuid.safeParse(formData.get("projectId"));
  if (!projectId.success) return;
  const opportunityId = uuid.safeParse(formData.get("opportunityId"));
  const name = z.string().trim().min(1).max(200).safeParse(formData.get("name"));

  const supabase = await createClient();
  let title = name.success ? name.data : "";
  if (!title && opportunityId.success) {
    const { data } = await supabase.from("opportunities").select("title").eq("id", opportunityId.data).maybeSingle();
    title = data?.title ?? "";
  }
  const { data: flow, error } = await supabase.from("user_flows")
    .insert({ project_id: projectId.data, name: title || t.flows.add }).select("id, code").single();
  if (error) return;
  await supabase.from("flow_nodes").insert({
    project_id: projectId.data, flow_id: flow.id, kind: "start", label: t.flows.newLabel.start, pos_x: 0, pos_y: 0,
  });
  if (opportunityId.success) {
    await supabase.from("trace_links").insert({
      project_id: projectId.data, source_type: "opportunity", source_id: opportunityId.data,
      target_type: "user_flow", target_id: flow.id, relation: "addresses",
    });
  }
  refresh();
  redirect(`${await projectBase(projectId.data)}/flows/${flow.code}`);
}

export async function saveFlowMeta(id: string, input: FlowMeta): Promise<Result> {
  const parsed = flowMetaSchema.safeParse(input);
  if (!uuid.safeParse(id).success || !parsed.success) return fail();
  const res = await updateTracked("user_flows", { column: "id", value: id }, parsed.data, "name");
  return res === "ok" ? { ok: true } : fail();
}

export async function saveViewport(id: string, viewport: { x: number; y: number; zoom: number }): Promise<Result> {
  const v = z.object({ x: coord, y: coord, zoom: z.number().min(0.05).max(4) }).safeParse(viewport);
  if (!uuid.safeParse(id).success || !v.success) return fail();
  const supabase = await createClient();
  const { error } = await supabase.from("user_flows").update({ viewport: v.data }).eq("id", id);
  return done(error);
}

export async function deleteFlow(formData: FormData) {
  const id = uuid.safeParse(formData.get("id"));
  if (!id.success) return;
  const supabase = await createClient();
  const { data } = await supabase.from("user_flows").delete().eq("id", id.data).select("project_id").maybeSingle();
  if (!data) return;
  refresh();
  redirect(`${await projectBase(data.project_id)}/flows`);
}

// ---------------------------------------------------------------- nodes

const nodeInput = z.object({ flowId: uuid, kind: nodeKind, label: z.string().trim().max(200), x: coord, y: coord });

export async function addNode(input: z.input<typeof nodeInput>): Promise<Result> {
  const p = nodeInput.safeParse(input);
  if (!p.success) return fail();
  const supabase = await createClient();
  const { data: flow } = await supabase.from("user_flows").select("project_id").eq("id", p.data.flowId).maybeSingle();
  if (!flow) return fail();
  const { data, error } = await supabase.from("flow_nodes").insert({
    project_id: flow.project_id, flow_id: p.data.flowId, kind: p.data.kind, label: p.data.label, pos_x: p.data.x, pos_y: p.data.y,
  }).select("id").single();
  return done(error, { id: data?.id });
}

const nodePatch = z.object({ label: z.string().trim().max(200), kind: nodeKind }).partial();

export async function updateNode(id: string, patch: z.input<typeof nodePatch>): Promise<Result> {
  const p = nodePatch.safeParse(patch);
  if (!uuid.safeParse(id).success || !p.success) return fail();
  const supabase = await createClient();
  // A node that stops being a Screen drops its screen (and the trace link with it).
  const extra = p.data.kind && p.data.kind !== "screen" ? { screen_id: null } : {};
  const { error } = await supabase.from("flow_nodes").update({ ...p.data, ...extra }).eq("id", id);
  return done(error);
}

export async function moveNodes(moves: { id: string; x: number; y: number }[]): Promise<Result> {
  const p = z.array(z.object({ id: uuid, x: coord, y: coord })).max(500).safeParse(moves);
  if (!p.success) return fail();
  const supabase = await createClient();
  const results = await Promise.all(p.data.map((m) =>
    supabase.from("flow_nodes").update({ pos_x: m.x, pos_y: m.y }).eq("id", m.id)));
  return done(results.find((r) => r.error)?.error ?? null);
}

export async function deleteElements(nodeIds: string[], edgeIds: string[]): Promise<Result> {
  const ids = z.array(uuid).max(500);
  const n = ids.safeParse(nodeIds);
  const e = ids.safeParse(edgeIds);
  if (!n.success || !e.success) return fail();
  const supabase = await createClient();
  if (e.data.length) {
    const { error } = await supabase.from("flow_edges").delete().in("id", e.data);
    if (error) return fail(t.autosave.readOnly);
  }
  if (n.data.length) {
    const { error } = await supabase.from("flow_nodes").delete().in("id", n.data);
    if (error) return fail(t.autosave.readOnly);
  }
  return { ok: true };
}

/** Link a Screen node to an existing screen, or unlink it (null). */
export async function linkScreen(nodeId: string, screenId: string | null): Promise<Result> {
  if (!uuid.safeParse(nodeId).success || (screenId !== null && !uuid.safeParse(screenId).success)) return fail();
  const supabase = await createClient();
  const { error } = await supabase.from("flow_nodes").update({ screen_id: screenId }).eq("id", nodeId);
  if (!error) refresh();
  return done(error);
}

/** Create a screen (SCR-###) named after the node and link it. */
export async function createScreenForNode(nodeId: string): Promise<Result & { name?: string }> {
  if (!uuid.safeParse(nodeId).success) return fail();
  const supabase = await createClient();
  const { data: node } = await supabase.from("flow_nodes").select("project_id, label").eq("id", nodeId).maybeSingle();
  if (!node) return fail();
  const name = node.label.trim() || t.flows.newLabel.screen;
  const { data: screen, error } = await supabase.from("screens").insert({ project_id: node.project_id, name }).select("id, code").single();
  if (error) return fail(t.autosave.readOnly);
  const linked = await supabase.from("flow_nodes").update({ screen_id: screen.id }).eq("id", nodeId);
  if (linked.error) return fail(t.autosave.readOnly);
  refresh();
  return { ok: true, id: screen.id, code: screen.code, name };
}

// ---------------------------------------------------------------- edges

export async function addEdge(input: { flowId: string; source: string; target: string; branch?: string }): Promise<Result> {
  const p = z.object({ flowId: uuid, source: uuid, target: uuid, branch: branch.default("default") }).safeParse(input);
  if (!p.success || p.data.source === p.data.target) return fail();
  const supabase = await createClient();
  const { data: flow } = await supabase.from("user_flows").select("project_id").eq("id", p.data.flowId).maybeSingle();
  if (!flow) return fail();
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
  if (!uuid.safeParse(id).success || !p.success) return fail();
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
  if (!uuid.safeParse(id).success || !p.success) return fail();
  const { nodeId, ...rest } = p.data;
  const supabase = await createClient();
  const { error } = await supabase.from("flow_edge_cases")
    .update({ ...rest, ...(nodeId !== undefined ? { node_id: nodeId } : {}) }).eq("id", id);
  if (!error && rest.status) refresh();
  return done(error);
}

export async function addEdgeCase(flowId: string, description: string): Promise<Result> {
  const d = z.string().trim().min(1).max(500).safeParse(description);
  if (!uuid.safeParse(flowId).success || !d.success) return fail();
  const supabase = await createClient();
  const { data: flow } = await supabase.from("user_flows").select("project_id").eq("id", flowId).maybeSingle();
  if (!flow) return fail();
  const { data, error } = await supabase.from("flow_edge_cases").insert({
    project_id: flow.project_id, flow_id: flowId, kind: "custom", description: d.data, position: 100,
  }).select("id").single();
  if (!error) refresh();
  return done(error, { id: data?.id });
}

export async function deleteEdgeCase(id: string): Promise<Result> {
  if (!uuid.safeParse(id).success) return fail();
  const supabase = await createClient();
  const { error } = await supabase.from("flow_edge_cases").delete().eq("id", id).eq("kind", "custom");
  if (!error) refresh();
  return done(error);
}
