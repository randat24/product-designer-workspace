"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/shared/lib/supabase/server";
import { denied, invalid, transient, type Failure } from "@/shared/lib/action-result";
import { trackedSave, updateTracked } from "@/shared/lib/supabase/tracked-update";
import { t } from "@/shared/i18n/uk";
import {
  GUIDE_SECTIONS, GUIDE_TEMPLATE, guideMetaSchema, interviewMetaSchema, participantSchema, planSchema, questionSchema,
  type GuideMeta, type InterviewMeta, type ParticipantFields, type PlanFields,
} from "./schema";

const uuid = z.uuid();
const refresh = () => revalidatePath("/w/[ws]/p/[project]", "layout");
type Result = { ok: true; id?: string; version?: string | null } | Failure;
const fail = transient;

async function projectBase(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("projects").select("slug, workspaces(slug)").eq("id", projectId).maybeSingle();
  return data?.workspaces ? `/w/${data.workspaces.slug}/p/${data.slug}` : "/";
}

/** Shared update-by-id with RLS read-back: no row means read-only access. */
/** What the project shell shows from each table: participant names in ⌘K, interview status and the
 *  plan's participant target in research progress. Guides show nothing there. */
const SHOWN = {
  participants: "display_name, role",
  interviews: "status",
  research_plans: "participants_target",
  interview_guides: "id",
} as const;

async function updateRow(table: keyof typeof SHOWN, id: string, fields: object, version?: string | null): Promise<Result> {
  if (!uuid.safeParse(id).success) return invalid();
  return trackedSave(await updateTracked(table, { column: "id", value: id }, fields, SHOWN[table], undefined, version));
}
function firstIssue(err: z.ZodError): Result {
  const issue = err.issues[0];
  return invalid(issue?.message, issue?.path[0]?.toString());
}

// ---------------------------------------------------------------- plans

export async function createPlan(formData: FormData) {
  const projectId = uuid.parse(formData.get("projectId"));
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("research_plans").insert({ project_id: projectId, title: t.research.plan.newTitle }).select("code").single();
  if (error) throw error;
  refresh();
  redirect(`${await projectBase(projectId)}/research/plans/${data.code}`);
}

export async function savePlan(id: string, input: PlanFields, version?: string | null): Promise<Result> {
  const parsed = planSchema.safeParse(input);
  return parsed.success ? updateRow("research_plans", id, parsed.data, version) : firstIssue(parsed.error);
}

// ---------------------------------------------------------------- guides

export async function createGuide(formData: FormData) {
  const projectId = uuid.parse(formData.get("projectId"));
  const planId = uuid.safeParse(formData.get("planId")).data ?? null;
  const withTemplate = formData.get("template") === "1";
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("interview_guides")
    .insert({ project_id: projectId, research_plan_id: planId, title: t.research.guide.newTitle })
    .select("id")
    .single();
  if (error) throw error;
  if (withTemplate) await insertTemplate(projectId, data.id);
  refresh();
  redirect(`${await projectBase(projectId)}/research/guides/${data.id}`);
}

async function insertTemplate(projectId: string, guideId: string) {
  const supabase = await createClient();
  const { data: existing } = await supabase.from("interview_questions").select("section, position").eq("guide_id", guideId);
  const next = new Map<string, number>();
  for (const q of existing ?? []) next.set(q.section, Math.max(next.get(q.section) ?? 0, q.position));
  const rows = GUIDE_TEMPLATE.map((q) => {
    const position = (next.get(q.section) ?? 0) + 1;
    next.set(q.section, position);
    return { project_id: projectId, guide_id: guideId, section: q.section, position, text: q.text, probes: q.probes, is_key: !!q.is_key };
  });
  const { error } = await supabase.from("interview_questions").insert(rows);
  if (error) throw error;
}

export async function applyGuideTemplate(projectId: string, guideId: string) {
  if (!uuid.safeParse(projectId).success || !uuid.safeParse(guideId).success) return invalid();
  await insertTemplate(projectId, guideId);
  refresh();
  return { ok: true } as Result;
}

export async function saveGuideMeta(id: string, input: GuideMeta, version?: string | null): Promise<Result> {
  const parsed = guideMetaSchema.safeParse(input);
  return parsed.success ? updateRow("interview_guides", id, parsed.data, version) : firstIssue(parsed.error);
}

export async function addQuestion(projectId: string, guideId: string, section: string, text: string) {
  const sectionOk = GUIDE_SECTIONS.some((s) => s.value === section);
  const body = text.trim();
  if (!uuid.safeParse(projectId).success || !uuid.safeParse(guideId).success || !sectionOk || !body || body.length > 1000) return invalid();
  const supabase = await createClient();
  const { data: last } = await supabase
    .from("interview_questions").select("position").eq("guide_id", guideId).eq("section", section as never)
    .order("position", { ascending: false }).limit(1).maybeSingle();
  const { error } = await supabase.from("interview_questions").insert({
    project_id: projectId, guide_id: guideId, section: section as (typeof GUIDE_SECTIONS)[number]["value"],
    position: (last?.position ?? 0) + 1, text: body,
  });
  if (error) return fail();
  refresh();
  return { ok: true } as Result;
}

export async function saveQuestion(id: string, input: z.input<typeof questionSchema>): Promise<Result> {
  const parsed = questionSchema.safeParse(input);
  if (!parsed.success || !uuid.safeParse(id).success) return invalid();
  const supabase = await createClient();
  const { data, error } = await supabase.from("interview_questions").update(parsed.data).eq("id", id).select("id").maybeSingle();
  if (error) return fail();
  if (!data) return denied();
  return { ok: true };
}

export async function deleteQuestion(id: string) {
  if (!uuid.safeParse(id).success) return invalid();
  const supabase = await createClient();
  const { error } = await supabase.from("interview_questions").delete().eq("id", id);
  if (error) return fail();
  refresh();
  return { ok: true } as Result;
}

/** Move a question up/down within its section (keyboard-friendly alternative to drag and drop). */
export async function moveQuestion(id: string, direction: -1 | 1) {
  if (!uuid.safeParse(id).success) return invalid();
  const supabase = await createClient();
  const { data: q } = await supabase.from("interview_questions").select("guide_id, section").eq("id", id).single();
  if (!q) return invalid();
  const { data: siblings } = await supabase
    .from("interview_questions").select("id, position").eq("guide_id", q.guide_id).eq("section", q.section).order("position").order("created_at");
  const list = siblings ?? [];
  const i = list.findIndex((s) => s.id === id);
  const j = i + direction;
  if (i < 0 || j < 0 || j >= list.length) return { ok: true } as Result;
  [list[i], list[j]] = [list[j]!, list[i]!];
  // Renumber the section so equal positions never make the order ambiguous.
  for (const [k, s] of list.entries()) {
    const { error } = await supabase.from("interview_questions").update({ position: k + 1 }).eq("id", s.id);
    if (error) return fail();
  }
  refresh();
  return { ok: true } as Result;
}

// ---------------------------------------------------------------- participants

export async function createParticipant(formData: FormData) {
  const projectId = uuid.parse(formData.get("projectId"));
  const role = String(formData.get("role") ?? "").trim().slice(0, 200) || null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("participants").insert({ project_id: projectId, role }).select("code").single();
  if (error) throw error;
  refresh();
  redirect(`${await projectBase(projectId)}/research/participants/${data.code}`);
}

export async function saveParticipant(id: string, input: ParticipantFields & { consentAt?: string | null }, version?: string | null): Promise<Result> {
  const parsed = participantSchema.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error);
  const { consent, ...fields } = parsed.data;
  // Keep the original consent timestamp while consent stays given.
  const consent_at = consent ? (input.consentAt ?? new Date().toISOString()) : null;
  return updateRow("participants", id, { ...fields, consent_at }, version);
}

export async function deleteParticipant(formData: FormData) {
  const id = uuid.parse(formData.get("id"));
  const supabase = await createClient();
  const { data } = await supabase.from("participants").delete().eq("id", id).select("project_id").maybeSingle();
  if (!data) throw new Error(t.autosave.readOnly);
  refresh();
  redirect(`${await projectBase(data.project_id)}/research/participants`);
}

// ---------------------------------------------------------------- interviews

export async function createInterview(formData: FormData) {
  const participantId = uuid.parse(formData.get("participantId"));
  const guideId = uuid.safeParse(formData.get("guideId")).data ?? null;
  const live = formData.get("live") === "1";
  const supabase = await createClient();
  const { data: p } = await supabase.from("participants").select("project_id").eq("id", participantId).single();
  if (!p) throw new Error("participant not found");
  let planId: string | null = null;
  if (guideId) {
    const { data: g } = await supabase.from("interview_guides").select("research_plan_id").eq("id", guideId).single();
    planId = g?.research_plan_id ?? null;
  }
  const { data, error } = await supabase
    .from("interviews")
    .insert({ project_id: p.project_id, participant_id: participantId, guide_id: guideId, research_plan_id: planId })
    .select("code")
    .single();
  if (error) throw error;
  refresh();
  redirect(`${await projectBase(p.project_id)}/research/interviews/${data.code}${live ? "/live" : ""}`);
}

export async function saveInterviewMeta(id: string, input: InterviewMeta): Promise<Result> {
  const parsed = interviewMetaSchema.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error);
  const { conducted_at, ...rest } = parsed.data;
  return updateRow("interviews", id, { ...rest, conducted_at: conducted_at ? new Date(conducted_at).toISOString() : null });
}

/** Live mode start/finish. Starting stamps the date if it is empty. */
export async function setInterviewStatus(id: string, status: "in_progress" | "done", durationMin?: number) {
  if (!uuid.safeParse(id).success) return invalid();
  const supabase = await createClient();
  const { data: current } = await supabase.from("interviews").select("conducted_at, duration_min").eq("id", id).single();
  const patch: { status: typeof status; conducted_at?: string; duration_min?: number } = { status };
  if (status === "in_progress" && !current?.conducted_at) patch.conducted_at = new Date().toISOString();
  if (status === "done" && durationMin && !current?.duration_min) patch.duration_min = Math.min(Math.max(Math.round(durationMin), 1), 600);
  const res = await updateRow("interviews", id, patch);
  if (res.ok) refresh();
  return res;
}

export async function deleteInterview(formData: FormData) {
  const id = uuid.parse(formData.get("id"));
  const supabase = await createClient();
  const { data } = await supabase.from("interviews").delete().eq("id", id).select("project_id, participant_id").maybeSingle();
  if (!data) throw new Error(t.autosave.readOnly);
  const { data: p } = await supabase.from("participants").select("code").eq("id", data.participant_id).single();
  refresh();
  redirect(`${await projectBase(data.project_id)}/research/participants/${p?.code ?? ""}`);
}

// ---------------------------------------------------------------- answers

const answerSchema = z.object({
  interviewId: z.uuid(),
  questionId: z.uuid().nullable(),
  answerId: z.uuid().nullable(),
  text: z.string().max(20000),
});

/**
 * Upsert one answer (question) or free note (no question). Returns the row id so
 * the editor can keep updating the same note.
 */
export async function saveAnswer(input: z.input<typeof answerSchema>): Promise<Result & { id?: string }> {
  const parsed = answerSchema.safeParse(input);
  if (!parsed.success) return invalid();
  const { interviewId, questionId, answerId, text } = parsed.data;
  const supabase = await createClient();

  if (answerId) {
    const { data, error } = await supabase.from("interview_answers").update({ body_text: text }).eq("id", answerId).select("id").maybeSingle();
    if (error) return fail();
    return data ? { ok: true, id: data.id } : denied();
  }
  const { data: interview } = await supabase.from("interviews").select("project_id").eq("id", interviewId).maybeSingle();
  if (!interview) return invalid();
  if (questionId) {
    const { data: existing } = await supabase
      .from("interview_answers").select("id").eq("interview_id", interviewId).eq("question_id", questionId).maybeSingle();
    if (existing) return saveAnswer({ interviewId, questionId, answerId: existing.id, text });
  }
  const { data, error } = await supabase
    .from("interview_answers")
    .insert({ project_id: interview.project_id, interview_id: interviewId, question_id: questionId, body_text: text, position: 1000 })
    .select("id")
    .single();
  if (error) return fail();
  return { ok: true, id: data.id };
}

export async function deleteAnswer(id: string) {
  if (!uuid.safeParse(id).success) return invalid();
  const supabase = await createClient();
  const { error } = await supabase.from("interview_answers").delete().eq("id", id);
  if (error) return fail();
  refresh();
  return { ok: true } as Result;
}

/** Matrix: add a respondent column = new participant + planned interview on this guide. */
export async function addRespondent(projectId: string, guideId: string) {
  if (!uuid.safeParse(projectId).success || !uuid.safeParse(guideId).success) return invalid();
  const supabase = await createClient();
  const { data: p, error } = await supabase.from("participants").insert({ project_id: projectId }).select("id").single();
  if (error) return fail();
  const { data: g } = await supabase.from("interview_guides").select("research_plan_id").eq("id", guideId).single();
  const { error: e2 } = await supabase
    .from("interviews").insert({ project_id: projectId, participant_id: p.id, guide_id: guideId, research_plan_id: g?.research_plan_id ?? null });
  if (e2) return fail();
  refresh();
  return { ok: true } as Result;
}

/** Inline edit of a participant's label from a matrix column header. */
export async function renameParticipant(id: string, fields: { display_name?: string; role?: string }) {
  const clean = {
    ...(fields.display_name !== undefined && { display_name: fields.display_name.trim().slice(0, 120) || null }),
    ...(fields.role !== undefined && { role: fields.role.trim().slice(0, 200) || null }),
  };
  return updateRow("participants", id, clean);
}
