"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/shared/lib/supabase/server";
import { slugify } from "@/shared/lib/slug";
import { t } from "@/shared/i18n/ru";
import { createProjectSchema } from "./schema";

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
