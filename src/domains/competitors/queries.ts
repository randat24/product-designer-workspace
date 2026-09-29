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

export const getMatrix = cache(async (projectId: string) => {
  const supabase = await createClient();
  const [features, values] = await Promise.all([
    supabase.from("comparison_features").select("id, name, group_name, position").eq("project_id", projectId)
      .order("position").order("created_at"),
    supabase.from("competitor_feature_values").select("competitor_id, comparison_feature_id, value").eq("project_id", projectId),
  ]);
  if (features.error) throw features.error;
  if (values.error) throw values.error;
  const cells: Record<string, FeatureValue> = {};
  for (const v of values.data) cells[`${v.comparison_feature_id}:${v.competitor_id}`] = v.value;
  return { features: features.data, cells };
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
