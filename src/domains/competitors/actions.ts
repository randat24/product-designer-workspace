"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/shared/lib/supabase/server";
import { invalid, type Failure } from "@/shared/lib/action-result";
import { trackedSave, updateTracked } from "@/shared/lib/supabase/tracked-update";
import { t } from "@/shared/i18n/uk";
import {
  ATTACHMENT_MAX_BYTES, ATTACHMENT_MIME, competitorSchema, featureSchema, FEATURE_VALUES, isAssessed, UX_TEMPLATES,
  type CompetitorInput, type FeatureValue, type UxTemplate,
} from "./schema";

const uuid = z.uuid();
const refresh = () => revalidatePath("/w/[ws]/p/[project]", "layout");

async function projectBase(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("projects").select("slug, workspaces(slug)").eq("id", projectId).maybeSingle();
  return data?.workspaces ? `/w/${data.workspaces.slug}/p/${data.slug}` : null;
}

/** Creates a competitor (or "our product") and opens its card. */
export async function createCompetitor(formData: FormData) {
  const projectId = uuid.parse(formData.get("projectId"));
  const own = formData.get("own") === "1";
  const supabase = await createClient();
  const { count } = await supabase.from("competitors").select("id", { count: "exact", head: true }).eq("project_id", projectId);
  const { data, error } = await supabase
    .from("competitors")
    .insert({
      project_id: projectId,
      name: own ? t.competitors.ownDefaultName : t.competitors.newName((count ?? 0) + 1),
      is_own_product: own,
      position: count ?? 0,
    })
    .select("code")
    .single();
  if (error) throw error;
  const base = await projectBase(projectId);
  refresh();
  redirect(`${base}/competitors/${data.code}`);
}

export type SaveResult = { ok: true; version: string | null } | Failure;

/** Autosave target for the competitor card. */
export async function saveCompetitor(id: string, input: CompetitorInput, version?: string | null): Promise<SaveResult> {
  if (!uuid.safeParse(id).success) return invalid();
  const parsed = competitorSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return invalid(issue?.message, issue?.path[0]?.toString());
  }
  // The shell shows the name (⌘K) and whether the competitor counts as assessed (stage progress).
  const res = await updateTracked("competitors", { column: "id", value: id }, parsed.data, "name, strengths, weaknesses, is_own_product",
    (r) => [r.name, isAssessed(r as Parameters<typeof isAssessed>[0])], version);
  return trackedSave(res);
}

export async function deleteCompetitor(formData: FormData) {
  const id = uuid.parse(formData.get("id"));
  const supabase = await createClient();
  const { data: competitor } = await supabase.from("competitors").select("project_id").eq("id", id).single();
  const { data: files } = await supabase.from("attachments").select("storage_path").eq("entity_type", "competitor").eq("entity_id", id);
  if (files?.length) await supabase.storage.from("attachments").remove(files.map((f) => f.storage_path));
  const { error } = await supabase.from("competitors").delete().eq("id", id);
  if (error) throw error;
  const base = competitor && (await projectBase(competitor.project_id));
  refresh();
  redirect(`${base}/competitors`);
}

// ---------------------------------------------------------------- matrix

export async function addFeature(projectId: string, input: { name: string; group_name?: string | null }, kind: "feature" | "ux" = "feature") {
  const parsed = featureSchema.safeParse(input);
  if (!uuid.safeParse(projectId).success || !parsed.success || !["feature", "ux"].includes(kind)) return { ok: false as const };
  const supabase = await createClient();
  const { count } = await supabase.from("comparison_features").select("id", { count: "exact", head: true }).eq("project_id", projectId).eq("kind", kind);
  const { error } = await supabase.from("comparison_features").insert({ project_id: projectId, ...parsed.data, kind, position: (count ?? 0) + 1 });
  if (error) return { ok: false as const };
  refresh();
  return { ok: true as const };
}

/** Adds a UX review template (Nielsen heuristics or UX laws), skipping rows that already exist. */
export async function addUxTemplate(projectId: string, template: UxTemplate) {
  const tpl = UX_TEMPLATES[template];
  if (!uuid.safeParse(projectId).success || !tpl) return { ok: false as const };
  const supabase = await createClient();
  const { data: existing } = await supabase.from("comparison_features").select("name").eq("project_id", projectId).eq("kind", "ux");
  const have = new Set((existing ?? []).map((r) => r.name));
  const start = existing?.length ?? 0;
  const rows = tpl.rows.filter((name) => !have.has(name))
    .map((name, i) => ({ project_id: projectId, name, group_name: tpl.group, kind: "ux" as const, position: start + i + 1 }));
  if (rows.length) {
    const { error } = await supabase.from("comparison_features").insert(rows);
    if (error) return { ok: false as const };
  }
  refresh();
  return { ok: true as const };
}

export async function updateFeature(id: string, input: { name: string; group_name?: string | null }) {
  const parsed = featureSchema.safeParse(input);
  if (!uuid.safeParse(id).success || !parsed.success) return { ok: false as const };
  const supabase = await createClient();
  const { error } = await supabase.from("comparison_features").update(parsed.data).eq("id", id);
  if (error) return { ok: false as const };
  refresh();
  return { ok: true as const };
}

export async function deleteFeature(id: string) {
  if (!uuid.safeParse(id).success) return { ok: false as const };
  const supabase = await createClient();
  const { error } = await supabase.from("comparison_features").delete().eq("id", id);
  if (error) return { ok: false as const };
  refresh();
  return { ok: true as const };
}

export async function setFeatureValue(competitorId: string, featureId: string, value: FeatureValue) {
  if (!uuid.safeParse(competitorId).success || !uuid.safeParse(featureId).success || !FEATURE_VALUES.includes(value)) {
    return { ok: false as const };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("competitor_feature_values")
    .upsert({ competitor_id: competitorId, comparison_feature_id: featureId, value }, { onConflict: "competitor_id,comparison_feature_id" });
  return error ? { ok: false as const } : { ok: true as const };
}

/** A note in a matrix cell. On a competitor's red cell it becomes a reminder for our design. */
export async function setCellNote(competitorId: string, featureId: string, note: string) {
  const n = z.string().trim().max(500).safeParse(note);
  if (!uuid.safeParse(competitorId).success || !uuid.safeParse(featureId).success || !n.success) return { ok: false as const };
  const supabase = await createClient();
  const { error } = await supabase.from("competitor_feature_values")
    .upsert({ competitor_id: competitorId, comparison_feature_id: featureId, note: n.data || null, note_done: false },
      { onConflict: "competitor_id,comparison_feature_id" });
  if (error) return { ok: false as const };
  refresh();
  return { ok: true as const };
}

export async function setReminderDone(competitorId: string, featureId: string, done: boolean) {
  if (!uuid.safeParse(competitorId).success || !uuid.safeParse(featureId).success) return { ok: false as const };
  const supabase = await createClient();
  const { error } = await supabase.from("competitor_feature_values").update({ note_done: done })
    .eq("competitor_id", competitorId).eq("comparison_feature_id", featureId);
  if (error) return { ok: false as const };
  refresh();
  return { ok: true as const };
}

// ---------------------------------------------------------------- screenshots

const attachmentSchema = z.object({
  entityType: z.enum(["competitor", "screen"]).default("competitor"),
  projectId: z.uuid(),
  entityId: z.uuid(),
  storagePath: z.string().max(300),
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.enum(ATTACHMENT_MIME),
  sizeBytes: z.number().int().min(1).max(ATTACHMENT_MAX_BYTES),
});

/** Registers a file the browser has already uploaded to Storage (RLS guards both steps). */
export async function registerScreenshot(input: z.input<typeof attachmentSchema>) {
  const parsed = attachmentSchema.safeParse(input);
  if (!parsed.success || !parsed.data.storagePath.startsWith(`${parsed.data.projectId}/${parsed.data.entityType}/`)) return { ok: false as const };
  const a = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("attachments").insert({
    project_id: a.projectId, entity_type: a.entityType, entity_id: a.entityId,
    storage_path: a.storagePath, file_name: a.fileName, mime_type: a.mimeType, size_bytes: a.sizeBytes,
  });
  if (error) {
    await supabase.storage.from("attachments").remove([a.storagePath]);
    return { ok: false as const };
  }
  refresh();
  return { ok: true as const };
}

export async function deleteScreenshot(id: string) {
  if (!uuid.safeParse(id).success) return { ok: false as const };
  const supabase = await createClient();
  const { data } = await supabase.from("attachments").delete().eq("id", id).select("storage_path").maybeSingle();
  if (!data) return { ok: false as const };
  await supabase.storage.from("attachments").remove([data.storage_path]);
  refresh();
  return { ok: true as const };
}
