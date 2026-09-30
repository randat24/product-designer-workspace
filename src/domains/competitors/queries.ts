import "server-only";
import { cache } from "react";
import { createClient } from "@/shared/lib/supabase/server";
import type { FeatureValue } from "./schema";

const LIST_COLUMNS =
  "id, code, name, url, kind, is_own_product, positioning, strengths, weaknesses, borrow, position, updated_at";

/** Competitors of a project; our product first, then by position. */
export const listCompetitors = cache(async (projectId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("competitors")
    .select(LIST_COLUMNS)
    .eq("project_id", projectId)
    .is("archived_at", null)
    .order("is_own_product", { ascending: false })
    .order("position")
    .order("created_at");
  if (error) throw error;
  return data;
});
export type CompetitorListItem = Awaited<ReturnType<typeof listCompetitors>>[number];

export const getCompetitorByCode = cache(async (projectId: string, code: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("competitors")
    .select("*")
    .eq("project_id", projectId)
    .eq("code", code.toUpperCase())
    .maybeSingle();
  if (error) throw error;
  return data;
});

export type MatrixKind = "feature" | "ux";
export type CellNote = { note: string; done: boolean };

/** Rows of one kind (features or UX criteria) with values and notes per competitor. */
export const getMatrix = cache(async (projectId: string, kind: MatrixKind = "feature") => {
  const supabase = await createClient();
  const [features, values] = await Promise.all([
    supabase.from("comparison_features").select("id, name, group_name, position").eq("project_id", projectId).eq("kind", kind)
      .order("position").order("created_at"),
    supabase.from("competitor_feature_values").select("competitor_id, comparison_feature_id, value, note, note_done, comparison_features!inner(kind)")
      .eq("project_id", projectId).eq("comparison_features.kind", kind),
  ]);
  if (features.error) throw features.error;
  if (values.error) throw values.error;
  const cells: Record<string, FeatureValue> = {};
  const notes: Record<string, CellNote> = {};
  for (const v of values.data) {
    const key = `${v.comparison_feature_id}:${v.competitor_id}`;
    cells[key] = v.value;
    if (v.note) notes[key] = { note: v.note, done: v.note_done };
  }
  return { features: features.data, cells, notes };
});

export type Reminder = {
  competitorId: string; featureId: string; competitor: string; competitorCode: string;
  feature: string; kind: MatrixKind; note: string; done: boolean;
};

/**
 * Red cells of competitors with a note: things they lack that our product should get right.
 * Shown while designing (screens, flows) until marked done.
 */
export const listReminders = cache(async (projectId: string): Promise<Reminder[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("competitor_feature_values")
    .select("competitor_id, comparison_feature_id, note, note_done, competitors!inner(code, name, is_own_product), comparison_features!inner(name, kind, position)")
    .eq("project_id", projectId).eq("value", "no").not("note", "is", null).eq("competitors.is_own_product", false);
  if (error) throw error;
  return data
    .filter((r) => r.note?.trim())
    .map((r) => ({
      competitorId: r.competitor_id, featureId: r.comparison_feature_id,
      competitor: r.competitors.name, competitorCode: r.competitors.code,
      feature: r.comparison_features.name, kind: r.comparison_features.kind, note: r.note!.trim(), done: r.note_done,
    }))
    .sort((a, b) => Number(a.done) - Number(b.done) || a.kind.localeCompare(b.kind) || a.feature.localeCompare(b.feature, "ru"));
});

export type Screenshot = { id: string; fileName: string; caption: string | null; url: string | null };

/** Screenshots of an entity with short-lived signed URLs (the bucket is private). */
export const listScreenshots = cache(async (entityType: string, entityId: string): Promise<Screenshot[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attachments")
    .select("id, storage_path, file_name, caption")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("position")
    .order("created_at");
  if (error) throw error;
  if (!data.length) return [];
  const { data: signed } = await supabase.storage.from("attachments").createSignedUrls(data.map((a) => a.storage_path), 60 * 60);
  const urls = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));
  return data.map((a) => ({ id: a.id, fileName: a.file_name, caption: a.caption, url: urls.get(a.storage_path) ?? null }));
});

/** First screenshot per competitor, for card thumbnails. */
export const listCompetitorCovers = cache(async (projectId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attachments")
    .select("entity_id, storage_path, position, created_at")
    .eq("project_id", projectId)
    .eq("entity_type", "competitor")
    .order("position")
    .order("created_at");
  if (error) throw error;
  const first = new Map<string, string>();
  for (const a of data) if (!first.has(a.entity_id)) first.set(a.entity_id, a.storage_path);
  if (!first.size) return new Map<string, string>();
  const { data: signed } = await supabase.storage.from("attachments").createSignedUrls([...first.values()], 60 * 60);
  const urls = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));
  return new Map([...first].map(([id, path]) => [id, urls.get(path) ?? ""]));
});
