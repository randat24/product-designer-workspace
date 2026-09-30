import "server-only";
import { cache } from "react";
import { createClient } from "@/shared/lib/supabase/server";

export type CaseStatus = "draft" | "review" | "published";

/** Case studies of a workspace, keyed by project, for badges in the project list. */
export const listCaseStudies = cache(async (workspaceId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("case_studies")
    .select("id, project_id, slug, status, content")
    .eq("workspace_id", workspaceId);
  if (error) throw error;
  return new Map(data.map((c) => [c.project_id, { id: c.id, slug: c.slug, status: c.status, hasContent: hasContent(c.content) }]));
});

export const getCaseForProject = cache(async (projectId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("case_studies")
    .select("id, slug, status, content, published_at, updated_at")
    .eq("project_id", projectId)
    .maybeSingle();
  if (error) throw error;
  return data && { ...data, hasContent: hasContent(data.content) };
});

/** A case shows on the site only when its snapshot has at least a title. */
function hasContent(content: unknown): boolean {
  const c = content as { uk?: { title?: string } } | null;
  return Boolean(c?.uk?.title);
}
