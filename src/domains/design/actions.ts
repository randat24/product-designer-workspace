"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/shared/lib/supabase/server";
import { denied, invalid, transient, type Failure } from "@/shared/lib/action-result";
import { insertOnce, requestIdOf } from "@/shared/lib/supabase/insert-once";
import { trackedSave, updateTracked } from "@/shared/lib/supabase/tracked-update";
import { t } from "@/shared/i18n/uk";
import { isHttpUrl, withScheme } from "@/shared/lib/url";
import { decisionSchema, screenSpecSchema, type DecisionFields, type ScreenSpec } from "./schema";

const refresh = () => revalidatePath("/w/[ws]/p/[project]", "layout");
type Result = { ok: true; id?: string; version?: string | null } | Failure;
const uuid = z.uuid();
const isDuplicate = (error: { code?: string } | null) => error?.code === "23505";

async function projectBase(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("projects").select("slug, workspaces(slug)").eq("id", projectId).maybeSingle();
  return data?.workspaces ? `/w/${data.workspaces.slug}/p/${data.slug}` : "/";
}

// ---------------------------------------------------------------- screens

export async function createScreen(formData: FormData): Promise<Result> {
  const projectId = uuid.safeParse(formData.get("projectId"));
  const name = z.string().trim().min(1).max(200).safeParse(formData.get("name"));
  if (!projectId.success) return invalid();
  if (!name.success) return invalid(t.screens.nameRequired, "name");
  const screen = await insertOnce("screens", { project_id: projectId.data, name: name.data }, requestIdOf(formData));
  if (!screen) return denied();
  refresh();
  redirect(`${await projectBase(projectId.data)}/screens/${screen.code}`);
}

export async function saveScreen(id: string, input: ScreenSpec, version?: string | null): Promise<Result> {
  const parsed = screenSpecSchema.safeParse(input);
  if (!uuid.safeParse(id).success) return invalid();
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? "");
    return invalid(field === "figma_url" ? t.screens.invalidUrl : undefined, field);
  }
  // The shell shows the screen's name (⌘K); spec text does not touch it.
  return trackedSave(await updateTracked("screens", { column: "id", value: id }, parsed.data, "name", undefined, version));
}

export async function deleteScreen(formData: FormData): Promise<Result> {
  const id = uuid.safeParse(formData.get("id"));
  const projectId = uuid.safeParse(formData.get("projectId")).data;
  if (!id.success) return invalid();
  const supabase = await createClient();
  const { data: files } = await supabase.from("attachments").select("storage_path").eq("entity_type", "screen").eq("entity_id", id.data);
  const { data, error } = await supabase.from("screens").delete().eq("id", id.data).select("project_id").maybeSingle();
  if (data && files?.length) await supabase.storage.from("attachments").remove(files.map((f) => f.storage_path));
  if (error) return denied();
  if (!data) {
    // Nothing deleted: either it is already gone (an earlier press whose answer was lost) or this is read-only access.
    const { data: still } = await supabase.from("screens").select("id").eq("id", id.data).maybeSingle();
    if (still || !projectId) return denied();
  }
  refresh();
  redirect(`${await projectBase(data?.project_id ?? projectId!)}/screens`);
}

const statePatch = z.object({
  status: z.enum(["missing", "designed", "n_a"]),
  description: z.string().trim().max(1000).transform((v) => v || null),
  figma_url: z.string().trim().max(2000).transform((v) => (v ? withScheme(v) : null)).refine((v) => v === null || isHttpUrl(v)),
}).partial();

export async function saveState(id: string, patch: z.input<typeof statePatch>): Promise<Result> {
  const p = statePatch.safeParse(patch);
  if (!uuid.safeParse(id).success) return invalid();
  if (!p.success) return invalid(t.screens.invalidUrl, "figma_url");
  const supabase = await createClient();
  const { data, error } = await supabase.from("screen_states").update(p.data).eq("id", id).select("id");
  // Row-level security filters instead of failing: no row back means nothing was written.
  if (error || !data.length) return denied();
  if (p.data.status) refresh();
  return { ok: true };
}

const stateKind = z.enum(["default", "loading", "empty", "error", "success", "disabled", "permission_denied", "offline", "partial"]);

export async function addState(screenId: string, kind: string): Promise<Result> {
  const k = stateKind.safeParse(kind);
  if (!uuid.safeParse(screenId).success || !k.success) return invalid();
  const supabase = await createClient();
  const { data: screen } = await supabase.from("screens").select("project_id").eq("id", screenId).maybeSingle();
  if (!screen) return invalid();
  const { data, error } = await supabase.from("screen_states")
    .insert({ project_id: screen.project_id, screen_id: screenId, kind: k.data, position: 100 }).select("id").single();
  if (error) return denied();
  refresh();
  return { ok: true, id: data.id };
}

export async function deleteState(id: string): Promise<Result> {
  if (!uuid.safeParse(id).success) return invalid();
  const supabase = await createClient();
  // The standard five stay; mark them "Не потрібно" instead.
  const { data, error } = await supabase.from("screen_states").delete().eq("id", id)
    .not("kind", "in", "(default,loading,empty,error,success)").select("id");
  if (error || !data.length) return denied();
  refresh();
  return { ok: true };
}

// ---------------------------------------------------------------- decisions

/** New decision. From a screen (or flow) it is linked as "decision implements screen". */
export async function createDecision(formData: FormData): Promise<Result> {
  const projectId = uuid.safeParse(formData.get("projectId"));
  if (!projectId.success) return invalid();
  const target = z.object({ type: z.enum(["screen", "user_flow"]), id: uuid })
    .safeParse({ type: formData.get("targetType"), id: formData.get("targetId") });
  const decision = await insertOnce("design_decisions",
    { project_id: projectId.data, title: t.decisions.newTitle, decided_at: new Date().toISOString().slice(0, 10) }, requestIdOf(formData));
  if (!decision) return denied();
  if (target.success) {
    const supabase = await createClient();
    const { error } = await supabase.from("trace_links").insert({
      project_id: projectId.data, source_type: "design_decision", source_id: decision.id,
      target_type: target.data.type, target_id: target.data.id, relation: "implements",
    });
    if (error && !isDuplicate(error)) {
      // A decision "from a screen" without its link would look made from nowhere: undo it, the press can be repeated.
      await supabase.from("design_decisions").delete().eq("id", decision.id);
      return transient();
    }
  }
  refresh();
  redirect(`${await projectBase(projectId.data)}/decisions/${decision.code}`);
}

export async function saveDecision(id: string, input: DecisionFields, version?: string | null): Promise<Result> {
  const parsed = decisionSchema.safeParse(input);
  if (!uuid.safeParse(id).success || !parsed.success) return invalid(undefined, String(parsed.error?.issues[0]?.path[0] ?? ""));
  if (parsed.data.superseded_by_id) {
    // Checked up front: a missing decision would otherwise surface as a bare foreign-key error.
    const supabase = await createClient();
    const { data: target } = await supabase.from("design_decisions").select("id").eq("id", parsed.data.superseded_by_id).maybeSingle();
    if (!target) return invalid(undefined, "superseded_by_id");
  }
  return trackedSave(await updateTracked("design_decisions", { column: "id", value: id }, parsed.data, "title", undefined, version));
}

export async function deleteDecision(formData: FormData): Promise<Result> {
  const id = uuid.safeParse(formData.get("id"));
  const projectId = uuid.safeParse(formData.get("projectId")).data;
  if (!id.success) return invalid();
  const supabase = await createClient();
  const { data, error } = await supabase.from("design_decisions").delete().eq("id", id.data).select("project_id").maybeSingle();
  if (error) return denied();
  if (!data) {
    // Nothing deleted: either it is already gone (an earlier press whose answer was lost) or this is read-only access.
    const { data: still } = await supabase.from("design_decisions").select("id").eq("id", id.data).maybeSingle();
    if (still || !projectId) return denied();
  }
  refresh();
  redirect(`${await projectBase(data?.project_id ?? projectId!)}/decisions`);
}

const evidenceType = z.enum(["interview", "quote", "observation", "insight", "pain_point", "opportunity", "competitor"]);

/** One-click evidence from the suggestions (trace link "… justifies decision"). */
export async function addEvidence(formData: FormData): Promise<Result> {
  const decisionId = uuid.safeParse(formData.get("decisionId"));
  const sourceId = uuid.safeParse(formData.get("sourceId"));
  const sourceType = evidenceType.safeParse(formData.get("sourceType"));
  if (!decisionId.success || !sourceId.success || !sourceType.success) return invalid();
  const supabase = await createClient();
  const { data: d } = await supabase.from("design_decisions").select("project_id").eq("id", decisionId.data).maybeSingle();
  if (!d) return invalid();
  const { error } = await supabase.from("trace_links").insert({
    project_id: d.project_id, source_type: sourceType.data, source_id: sourceId.data,
    target_type: "design_decision", target_id: decisionId.data, relation: "justifies",
  });
  // Already linked (a second press): the evidence is there, which is what was asked.
  if (error && !isDuplicate(error)) return denied();
  refresh();
  return { ok: true };
}
