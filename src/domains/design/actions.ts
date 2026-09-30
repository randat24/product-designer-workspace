"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/shared/lib/supabase/server";
import { t } from "@/shared/i18n/ru";
import { isHttpUrl, withScheme } from "@/shared/lib/url";
import { decisionSchema, screenSpecSchema, type DecisionFields, type ScreenSpec } from "./schema";

const refresh = () => revalidatePath("/w/[ws]/p/[project]", "layout");
type Result = { ok: true; id?: string } | { ok: false; error: string; field?: string };
const fail = (error: string = t.autosave.failed, field?: string): Result => ({ ok: false, error, field });
const uuid = z.uuid();

async function projectBase(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("projects").select("slug, workspaces(slug)").eq("id", projectId).maybeSingle();
  return data?.workspaces ? `/w/${data.workspaces.slug}/p/${data.slug}` : "/";
}

// ---------------------------------------------------------------- screens

export async function createScreen(formData: FormData) {
  const projectId = uuid.safeParse(formData.get("projectId"));
  const name = z.string().trim().min(1).max(200).safeParse(formData.get("name"));
  if (!projectId.success || !name.success) return;
  const supabase = await createClient();
  const { data, error } = await supabase.from("screens").insert({ project_id: projectId.data, name: name.data }).select("code").single();
  if (error) return;
  refresh();
  redirect(`${await projectBase(projectId.data)}/screens/${data.code}`);
}

export async function saveScreen(id: string, input: ScreenSpec): Promise<Result> {
  const parsed = screenSpecSchema.safeParse(input);
  if (!uuid.safeParse(id).success) return fail();
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? "");
    return fail(field === "figma_url" ? t.screens.invalidUrl : t.autosave.failed, field);
  }
  const supabase = await createClient();
  const { data, error } = await supabase.from("screens").update(parsed.data).eq("id", id).select("id").maybeSingle();
  if (error) return fail();
  if (!data) return fail(t.autosave.readOnly);
  refresh();
  return { ok: true };
}

export async function deleteScreen(formData: FormData) {
  const id = uuid.safeParse(formData.get("id"));
  if (!id.success) return;
  const supabase = await createClient();
  const { data: files } = await supabase.from("attachments").select("storage_path").eq("entity_type", "screen").eq("entity_id", id.data);
  const { data } = await supabase.from("screens").delete().eq("id", id.data).select("project_id").maybeSingle();
  if (!data) return;
  if (files?.length) await supabase.storage.from("attachments").remove(files.map((f) => f.storage_path));
  refresh();
  redirect(`${await projectBase(data.project_id)}/screens`);
}

const statePatch = z.object({
  status: z.enum(["missing", "designed", "n_a"]),
  description: z.string().trim().max(1000).transform((v) => v || null),
  figma_url: z.string().trim().max(2000).transform((v) => (v ? withScheme(v) : null)).refine((v) => v === null || isHttpUrl(v)),
}).partial();

export async function saveState(id: string, patch: z.input<typeof statePatch>): Promise<Result> {
  const p = statePatch.safeParse(patch);
  if (!uuid.safeParse(id).success) return fail();
  if (!p.success) return fail(t.screens.invalidUrl, "figma_url");
  const supabase = await createClient();
  const { error } = await supabase.from("screen_states").update(p.data).eq("id", id);
  if (error) return fail(t.autosave.readOnly);
  if (p.data.status) refresh();
  return { ok: true };
}

const stateKind = z.enum(["default", "loading", "empty", "error", "success", "disabled", "permission_denied", "offline", "partial"]);

export async function addState(screenId: string, kind: string): Promise<Result> {
  const k = stateKind.safeParse(kind);
  if (!uuid.safeParse(screenId).success || !k.success) return fail();
  const supabase = await createClient();
  const { data: screen } = await supabase.from("screens").select("project_id").eq("id", screenId).maybeSingle();
  if (!screen) return fail();
  const { data, error } = await supabase.from("screen_states")
    .insert({ project_id: screen.project_id, screen_id: screenId, kind: k.data, position: 100 }).select("id").single();
  if (error) return fail(t.autosave.readOnly);
  refresh();
  return { ok: true, id: data.id };
}

export async function deleteState(id: string): Promise<Result> {
  if (!uuid.safeParse(id).success) return fail();
  const supabase = await createClient();
  // The standard five stay; mark them "Не нужно" instead.
  const { error } = await supabase.from("screen_states").delete().eq("id", id)
    .not("kind", "in", "(default,loading,empty,error,success)");
  if (error) return fail(t.autosave.readOnly);
  refresh();
  return { ok: true };
}

// ---------------------------------------------------------------- decisions

/** New decision. From a screen (or flow) it is linked as "decision implements screen". */
export async function createDecision(formData: FormData) {
  const projectId = uuid.safeParse(formData.get("projectId"));
  if (!projectId.success) return;
  const target = z.object({ type: z.enum(["screen", "user_flow"]), id: uuid })
    .safeParse({ type: formData.get("targetType"), id: formData.get("targetId") });
  const supabase = await createClient();
  const { data, error } = await supabase.from("design_decisions")
    .insert({ project_id: projectId.data, title: t.decisions.newTitle, decided_at: new Date().toISOString().slice(0, 10) })
    .select("id, code").single();
  if (error) return;
  if (target.success) {
    await supabase.from("trace_links").insert({
      project_id: projectId.data, source_type: "design_decision", source_id: data.id,
      target_type: target.data.type, target_id: target.data.id, relation: "implements",
    });
  }
  refresh();
  redirect(`${await projectBase(projectId.data)}/decisions/${data.code}`);
}

export async function saveDecision(id: string, input: DecisionFields): Promise<Result> {
  const parsed = decisionSchema.safeParse(input);
  if (!uuid.safeParse(id).success || !parsed.success) return fail(t.autosave.failed, String(parsed.error?.issues[0]?.path[0] ?? ""));
  const supabase = await createClient();
  const { data, error } = await supabase.from("design_decisions").update(parsed.data).eq("id", id).select("id").maybeSingle();
  if (error) return fail(t.autosave.failed, error.code === "23503" ? "superseded_by_id" : undefined);
  if (!data) return fail(t.autosave.readOnly);
  refresh();
  return { ok: true };
}

export async function deleteDecision(formData: FormData) {
  const id = uuid.safeParse(formData.get("id"));
  if (!id.success) return;
  const supabase = await createClient();
  const { data } = await supabase.from("design_decisions").delete().eq("id", id.data).select("project_id").maybeSingle();
  if (!data) return;
  refresh();
  redirect(`${await projectBase(data.project_id)}/decisions`);
}

const evidenceType = z.enum(["interview", "quote", "observation", "insight", "pain_point", "opportunity", "competitor"]);

/** One-click evidence from the suggestions (trace link "… justifies decision"). */
export async function addEvidence(formData: FormData) {
  const decisionId = uuid.safeParse(formData.get("decisionId"));
  const sourceId = uuid.safeParse(formData.get("sourceId"));
  const sourceType = evidenceType.safeParse(formData.get("sourceType"));
  if (!decisionId.success || !sourceId.success || !sourceType.success) return;
  const supabase = await createClient();
  const { data: d } = await supabase.from("design_decisions").select("project_id").eq("id", decisionId.data).maybeSingle();
  if (!d) return;
  await supabase.from("trace_links").insert({
    project_id: d.project_id, source_type: sourceType.data, source_id: sourceId.data,
    target_type: "design_decision", target_id: decisionId.data, relation: "justifies",
  });
  refresh();
}
