"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/shared/lib/supabase/server";
import { t } from "@/shared/i18n/ru";
import {
  ATTACHMENT_MAX_BYTES, ATTACHMENT_MIME, competitorSchema, featureSchema, FEATURE_VALUES,
  type CompetitorInput, type FeatureValue,
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

export type SaveResult = { ok: true } | { ok: false; error: string; field?: string };

/** Autosave target for the competitor card. */
export async function saveCompetitor(id: string, input: CompetitorInput): Promise<SaveResult> {
  if (!uuid.safeParse(id).success) return { ok: false, error: t.autosave.failed };
  const parsed = competitorSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue?.message ?? t.autosave.failed, field: issue?.path[0]?.toString() };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.from("competitors").update(parsed.data).eq("id", id).select("id").maybeSingle();
  if (error) return { ok: false, error: t.autosave.failed };
  if (!data) return { ok: false, error: t.autosave.readOnly };
  return { ok: true };
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

export async function addFeature(projectId: string, input: { name: string; group_name?: string | null }) {
  const parsed = featureSchema.safeParse(input);
  if (!uuid.safeParse(projectId).success || !parsed.success) return { ok: false as const };
  const supabase = await createClient();
  const { count } = await supabase.from("comparison_features").select("id", { count: "exact", head: true }).eq("project_id", projectId);
  const { error } = await supabase.from("comparison_features").insert({ project_id: projectId, ...parsed.data, position: (count ?? 0) + 1 });
  if (error) return { ok: false as const };
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

// ---------------------------------------------------------------- screenshots

const attachmentSchema = z.object({
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
  if (!parsed.success || !parsed.data.storagePath.startsWith(`${parsed.data.projectId}/competitor/`)) return { ok: false as const };
  const a = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("attachments").insert({
    project_id: a.projectId, entity_type: "competitor", entity_id: a.entityId,
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
