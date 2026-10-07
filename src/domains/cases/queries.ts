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
    .select("id, slug, status, content, draft, published_at, content_updated_at, updated_at")
    .eq("project_id", projectId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    ...data,
    // What the site shows (`content`) and what the editor and settings change (`draft`).
    hasContent: hasContent(data.content),
    hasDraftContent: hasContent(data.draft),
    // jsonb comes back with its keys in a fixed order, so equal snapshots serialise equally. The published copy also
    // carries `process` (counted on publish, never in the draft), which is not an edit.
    // A copy published before the counts existed has none: publishing again adds them.
    hasUnpublished: JSON.stringify(data.draft) !== JSON.stringify(withoutProcess(data.content)) || !hasProcess(data.content),
    adult: isAdult(data.draft),
    sample: isSample(data.draft),
    figma: figmaOf(data.draft),
  };
});

function hasProcess(content: unknown): boolean {
  return !!content && typeof content === "object" && "process" in content;
}

function withoutProcess(content: unknown): unknown {
  if (!content || typeof content !== "object" || Array.isArray(content)) return content;
  const { process: _process, ...rest } = content as Record<string, unknown>;
  return rest;
}

/** Made for an 18+ audience: the flag sits in every language of the snapshot (see setCaseStatus). */
export function isAdult(content: unknown): boolean {
  const c = content as Record<string, { adult?: boolean } | undefined> | null;
  return Boolean(c?.uk?.adult ?? c?.en?.adult);
}

/** Placeholder texts: the site marks the case «Приклад» and keeps it out of search (see setCaseStatus). */
export function isSample(content: unknown): boolean {
  const c = content as Record<string, { sample?: boolean } | undefined> | null;
  return Boolean(c?.uk?.sample ?? c?.en?.sample);
}

/** Figma file shown on the case page (see setCaseStatus); empty when there is none. */
export function figmaOf(content: unknown): string {
  const c = content as Record<string, { figma?: string } | undefined> | null;
  return c?.uk?.figma ?? c?.en?.figma ?? "";
}

/** A case shows on the site only when its snapshot has at least a title. */
function hasContent(content: unknown): boolean {
  const c = content as { uk?: { title?: string } } | null;
  return Boolean(c?.uk?.title);
}
