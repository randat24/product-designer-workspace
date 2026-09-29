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

export const listProjects = cache(async (workspaceId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, slug, description, status, platforms, updated_at")
    .eq("workspace_id", workspaceId)
    .is("archived_at", null)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data;
});

export const getProjectBySlug = cache(async (workspaceId: string, slug: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, workspace_id, name, slug, description, status, platforms, created_at, updated_at")
    .eq("workspace_id", workspaceId)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
});
