import "server-only";
import { cache } from "react";
import { createClient } from "@/shared/lib/supabase/server";

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
});

/** Workspaces the user belongs to, personal first. */
export const listMyWorkspaces = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workspaces")
    .select("id, name, slug, is_personal")
    .order("is_personal", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
});

export const getWorkspaceBySlug = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workspaces")
    .select("id, name, slug, is_personal")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
});

/** All projects of a workspace, most recently changed first. Archived ones are filtered by the caller. */
export const listProjects = cache(async (workspaceId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, slug, description, status, platforms, updated_at, archived_at")
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data;
});

export const getProjectBySlug = cache(async (workspaceId: string, slug: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, workspace_id, name, slug, description, status, platforms, created_at, updated_at, archived_at")
    .eq("workspace_id", workspaceId)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
});

/** The signed-in user's role in a workspace, or null if not a member. */
export const getMyRole = cache(async (workspaceId: string) => {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  return data?.role ?? null;
});

export type ActivityItem = {
  id: number;
  entityType: string;
  action: string;
  changedKeys: string[];
  actorName: string | null;
  createdAt: string;
};

/** Latest changes in a project (written by DB triggers). */
export const listRecentActivity = cache(async (projectId: string, limit = 8): Promise<ActivityItem[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_log")
    .select("id, entity_type, action, changed_keys, actor_id, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;

  const actorIds = [...new Set(data.map((a) => a.actor_id).filter((id): id is string => !!id))];
  const { data: actors } = actorIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", actorIds)
    : { data: [] };
  const names = new Map((actors ?? []).map((p) => [p.id, p.full_name]));

  return data.map((a) => ({
    id: a.id,
    entityType: a.entity_type,
    action: a.action,
    changedKeys: a.changed_keys ?? [],
    actorName: (a.actor_id && names.get(a.actor_id)) || null,
    createdAt: a.created_at,
  }));
});
