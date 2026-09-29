"use server";

import { z } from "zod";
import { createClient } from "@/shared/lib/supabase/server";
import { t } from "@/shared/i18n/ru";
import { briefSchema, type BriefInput } from "./schema";

export type SaveBriefResult = { ok: true; savedAt: string } | { ok: false; error: string; field?: string };

/** Autosave target for the brief editor. Saves the whole brief; RLS decides who may write. */
export async function saveBrief(projectId: string, input: BriefInput): Promise<SaveBriefResult> {
  if (!z.uuid().safeParse(projectId).success) return { ok: false, error: t.brief.saveFailed };
  const parsed = briefSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue?.message ?? t.brief.saveFailed, field: issue?.path[0]?.toString() };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_briefs")
    .update(parsed.data)
    .eq("project_id", projectId)
    .select("updated_at")
    .maybeSingle();

  if (error) return { ok: false, error: t.brief.saveFailed };
  // No row back means RLS filtered the update: read-only access.
  if (!data) return { ok: false, error: t.brief.readOnly };

  return { ok: true, savedAt: data.updated_at };
}
