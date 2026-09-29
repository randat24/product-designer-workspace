"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/shared/lib/supabase/server";
import { slugify } from "@/shared/lib/slug";
import { t } from "@/shared/i18n/ru";
import { z } from "zod";
import { createProjectSchema, updateProjectSchema } from "./schema";

export type CreateProjectState = { error?: string; fieldErrors?: Partial<Record<"name", string>> } | undefined;

export async function createProject(_prev: CreateProjectState, formData: FormData): Promise<CreateProjectState> {
  const parsed = createProjectSchema.safeParse({
    workspaceId: formData.get("workspaceId"),
    name: formData.get("name"),
    description: formData.get("description") ?? undefined,
    platforms: formData.getAll("platforms"),
  });
  if (!parsed.success) {
    const nameIssue = parsed.error.issues.find((i) => i.path[0] === "name");
    return { fieldErrors: { name: nameIssue?.message ?? t.workspace.nameRequired } };
  }

  const { workspaceId, name, description, platforms } = parsed.data;
  const supabase = await createClient();
  const base = slugify(name);

  // Retry on slug collisions within the workspace: base, base-2, base-3…
  for (let attempt = 1; attempt <= 20; attempt++) {
    const slug = attempt === 1 ? base : `${base.slice(0, 44)}-${attempt}`;
    const { error } = await supabase
      .from("projects")
      .insert({ workspace_id: workspaceId, name, description, platforms, slug });

    if (!error) {
      const { data: ws } = await supabase.from("workspaces").select("slug").eq("id", workspaceId).single();
      revalidatePath(`/w/${ws?.slug}`);
      redirect(`/w/${ws?.slug}/p/${slug}`);
    }
    if (error.code !== "23505") return { error: t.workspace.createFailed };
  }
  return { error: t.workspace.createFailed };
}

async function projectPath(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("slug, name, workspaces(slug)")
    .eq("id", projectId)
    .maybeSingle();
  if (!data?.workspaces) return null;
  return { ws: `/w/${data.workspaces.slug}`, project: `/w/${data.workspaces.slug}/p/${data.slug}`, name: data.name };
}

export type UpdateProjectState = { ok?: boolean; error?: string; fieldErrors?: Partial<Record<"name", string>> } | undefined;

export async function updateProject(_prev: UpdateProjectState, formData: FormData): Promise<UpdateProjectState> {
  const parsed = updateProjectSchema.safeParse({
    projectId: formData.get("projectId"),
    name: formData.get("name"),
    description: formData.get("description") ?? undefined,
    platforms: formData.getAll("platforms"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    const nameIssue = parsed.error.issues.find((i) => i.path[0] === "name");
    return nameIssue ? { fieldErrors: { name: nameIssue.message } } : { error: t.settings.saveFailed };
  }

  const { projectId, ...fields } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.from("projects").update(fields).eq("id", projectId).select("id").maybeSingle();
  if (error || !data) return { error: t.settings.saveFailed };

  const path = await projectPath(projectId);
  if (path) revalidatePath(path.ws, "layout");
  return { ok: true };
}

/** Archive keeps everything and hides the project from the main list; restore brings it back. */
export async function setProjectArchived(formData: FormData) {
  const projectId = z.uuid().parse(formData.get("projectId"));
  const archived = formData.get("archived") === "1";
  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", projectId);
  if (error) throw error;

  const path = await projectPath(projectId);
  if (path) revalidatePath(path.ws, "layout");
}

export type DeleteProjectState = { error?: string } | undefined;

export async function deleteProject(_prev: DeleteProjectState, formData: FormData): Promise<DeleteProjectState> {
  const projectId = z.uuid().safeParse(formData.get("projectId"));
  if (!projectId.success) return { error: t.settings.deleteFailed };
  const path = await projectPath(projectId.data);
  if (!path) return { error: t.settings.deleteFailed };
  if (String(formData.get("confirm") ?? "").trim() !== path.name) return { error: t.settings.deleteConfirmMismatch };

  const supabase = await createClient();
  // Only owners pass RLS; count tells us whether anything was deleted.
  const { error, count } = await supabase.from("projects").delete({ count: "exact" }).eq("id", projectId.data);
  if (error || !count) return { error: t.settings.deleteForbidden };

  revalidatePath(path.ws, "layout");
  redirect(path.ws);
}

export async function createDemoProject(formData: FormData) {
  const workspaceId = z.uuid().parse(formData.get("workspaceId"));
  const supabase = await createClient();
  const [{ data: slug, error }, { data: ws }] = await Promise.all([
    supabase.rpc("create_demo_project", { p_workspace: workspaceId }),
    supabase.from("workspaces").select("slug").eq("id", workspaceId).single(),
  ]);
  if (error) throw error;
  revalidatePath(`/w/${ws?.slug}`);
  redirect(`/w/${ws?.slug}/p/${slug}`);
}
