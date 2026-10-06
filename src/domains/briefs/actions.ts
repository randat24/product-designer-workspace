"use server";

import { z } from "zod";
import { t } from "@/shared/i18n/uk";
import { invalid, type Failure } from "@/shared/lib/action-result";
import { trackedSave, updateTracked } from "@/shared/lib/supabase/tracked-update";
import { briefCompleteness, briefSchema, EMPTY_BRIEF, type Brief, type BriefInput } from "./schema";

export type SaveBriefResult = { ok: true; version: string | null } | Failure;

const KEY_COLUMNS = "product_description, target_audience, problem, goals, kpis, constraints, technical_constraints, timeline_start, timeline_end";

/** Which key fields are filled, from a raw row (arrays may come back as null). */
const keyFieldsFilled = (row: Record<string, unknown>) =>
  briefCompleteness({ ...EMPTY_BRIEF, ...row, goals: (row.goals as string[] | null) ?? [], kpis: (row.kpis as Brief["kpis"] | null) ?? [] } as Brief).missing;

/** Autosave target for the brief editor. Saves the whole brief; RLS decides who may write.
 *  `version` — the brief's `updated_at` as the editor saw it: a newer edit elsewhere is reported, not overwritten. */
export async function saveBrief(projectId: string, input: BriefInput, version?: string | null): Promise<SaveBriefResult> {
  if (!z.uuid().safeParse(projectId).success) return invalid();
  const parsed = briefSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return invalid(issue?.message, issue?.path[0]?.toString());
  }

  // The shell shows how many key brief fields are filled (stage progress in the rail).
  const res = await updateTracked("project_briefs", { column: "project_id", value: projectId }, parsed.data, KEY_COLUMNS, keyFieldsFilled, version);
  return trackedSave(res, { readOnly: t.brief.readOnly });
}
