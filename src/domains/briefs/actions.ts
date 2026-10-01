"use server";

import { z } from "zod";
import { t } from "@/shared/i18n/uk";
import { updateTracked } from "@/shared/lib/supabase/tracked-update";
import { briefCompleteness, briefSchema, EMPTY_BRIEF, type Brief, type BriefInput } from "./schema";

export type SaveBriefResult = { ok: true } | { ok: false; error: string; field?: string };

const KEY_COLUMNS = "product_description, target_audience, problem, goals, kpis, constraints, technical_constraints, timeline_start, timeline_end";

/** Which key fields are filled, from a raw row (arrays may come back as null). */
const keyFieldsFilled = (row: Record<string, unknown>) =>
  briefCompleteness({ ...EMPTY_BRIEF, ...row, goals: (row.goals as string[] | null) ?? [], kpis: (row.kpis as Brief["kpis"] | null) ?? [] } as Brief).missing;

/** Autosave target for the brief editor. Saves the whole brief; RLS decides who may write. */
export async function saveBrief(projectId: string, input: BriefInput): Promise<SaveBriefResult> {
  if (!z.uuid().safeParse(projectId).success) return { ok: false, error: t.brief.saveFailed };
  const parsed = briefSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue?.message ?? t.brief.saveFailed, field: issue?.path[0]?.toString() };
  }

  // The shell shows how many key brief fields are filled (stage progress in the rail).
  const res = await updateTracked("project_briefs", { column: "project_id", value: projectId }, parsed.data, KEY_COLUMNS, keyFieldsFilled);
  if (res === "error") return { ok: false, error: t.brief.saveFailed };
  if (res === "read-only") return { ok: false, error: t.brief.readOnly };
  return { ok: true };
}
