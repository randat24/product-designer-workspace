"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/shared/lib/supabase/server";
import { denied, invalid, transient, type Failure } from "@/shared/lib/action-result";
import { trackedSave, updateTracked } from "@/shared/lib/supabase/tracked-update";
import { t } from "@/shared/i18n/uk";
import {
  insightSchema, observationSchema, opportunitySchema, painPointSchema,
  type InsightFields, type OpportunityFields, type PainPointFields,
} from "./schema";

const uuid = z.uuid();
const refresh = () => revalidatePath("/w/[ws]/p/[project]", "layout");
type Result = { ok: true; id?: string; code?: string; version?: string | null } | Failure;
const fail = transient;

async function projectBase(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("projects").select("slug, workspaces(slug)").eq("id", projectId).maybeSingle();
  return data?.workspaces ? `/w/${data.workspaces.slug}/p/${data.slug}` : "/";
}

async function link(projectId: string, sourceType: string, sourceId: string, targetType: string, targetId: string, relation: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("trace_links").insert({
    project_id: projectId, source_type: sourceType, source_id: sourceId, target_type: targetType, target_id: targetId, relation,
  });
  if (error && error.code !== "23505") throw error;
}

// ---------------------------------------------------------------- quotes & observations

const quoteInput = z.object({
  interviewId: z.uuid(),
  answerId: z.uuid().nullable(),
  text: z.string().trim().min(1).max(2000),
  start: z.number().int().min(0).nullable(),
  end: z.number().int().min(0).nullable(),
});

/** Create a quote from a text selection in an answer (one action, docs/MVP.md §3). */
export async function createQuote(input: z.input<typeof quoteInput>): Promise<Result> {
  const parsed = quoteInput.safeParse(input);
  if (!parsed.success) return invalid();
  const q = parsed.data;
  const supabase = await createClient();
  const { data: iv } = await supabase.from("interviews").select("project_id").eq("id", q.interviewId).maybeSingle();
  if (!iv) return invalid();
  const { data, error } = await supabase.from("quotes").insert({
    project_id: iv.project_id, interview_id: q.interviewId, answer_id: q.answerId, text: q.text,
    start_offset: q.start, end_offset: q.end,
  }).select("id, code").single();
  if (error) return denied();
  refresh();
  return { ok: true, id: data.id, code: data.code };
}

const observationInput = z.object({
  projectId: z.uuid(),
  interviewId: z.uuid().nullable(),
  participantId: z.uuid().nullable().optional(),
  quoteId: z.uuid().nullable().optional(),
  patternId: z.uuid().nullable().optional(),
  kind: z.enum(["pain", "need", "behavior", "emotion", "fact", "workaround"]),
  text: z.string().trim().min(1).max(2000),
});

/** Create an observation; from a quote it inherits the interview and is traced to it. */
export async function createObservation(input: z.input<typeof observationInput>): Promise<Result> {
  const parsed = observationInput.safeParse(input);
  if (!parsed.success) return invalid();
  const o = parsed.data;
  const supabase = await createClient();
  let interviewId = o.interviewId;
  if (o.quoteId) {
    const { data: q } = await supabase.from("quotes").select("interview_id").eq("id", o.quoteId).maybeSingle();
    interviewId = q?.interview_id ?? interviewId;
  }
  const { data, error } = await supabase.from("observations").insert({
    project_id: o.projectId, interview_id: interviewId, participant_id: interviewId ? null : o.participantId ?? null,
    pattern_id: o.patternId ?? null, kind: o.kind, body_text: o.text, position: 1000,
  }).select("id, code").single();
  if (error) return denied();
  if (o.quoteId) await link(o.projectId, "quote", o.quoteId, "observation", data.id, "evidences");
  refresh();
  return { ok: true, id: data.id, code: data.code };
}

export async function saveObservation(id: string, input: z.input<typeof observationSchema>): Promise<Result> {
  const parsed = observationSchema.safeParse(input);
  if (!uuid.safeParse(id).success || !parsed.success) return invalid();
  // No conflict check: on the board the same row also changes when a card moves between patterns.
  return trackedSave(await updateTracked("observations", { column: "id", value: id }, parsed.data, "body_text", (r) => String(r.body_text ?? "").slice(0, 80)));
}

export async function saveQuoteText(id: string, text: string): Promise<Result> {
  const body = text.trim();
  if (!uuid.safeParse(id).success || !body || body.length > 2000) return invalid();
  return trackedSave(await updateTracked("quotes", { column: "id", value: id }, { text: body }, "text", (r) => String(r.text ?? "").slice(0, 80)));
}

/** Move a board card to a pattern (null = unclustered) at a position. */
export async function moveCard(kind: "observation" | "quote", id: string, patternId: string | null, position: number) {
  if (!uuid.safeParse(id).success || (patternId && !uuid.safeParse(patternId).success)) return invalid();
  const supabase = await createClient();
  const table = kind === "quote" ? "quotes" : "observations";
  const { data, error } = await supabase.from(table).update({ pattern_id: patternId, position: Math.round(position) }).eq("id", id).select("id").maybeSingle();
  if (error || !data) return fail();
  refresh();
  return { ok: true } as Result;
}

// ---------------------------------------------------------------- patterns

export async function createPattern(projectId: string, title: string) {
  const body = title.trim().slice(0, 200) || t.synthesis.board.newPattern;
  if (!uuid.safeParse(projectId).success) return invalid();
  const supabase = await createClient();
  const { count } = await supabase.from("patterns").select("id", { count: "exact", head: true }).eq("project_id", projectId);
  const { error } = await supabase.from("patterns").insert({ project_id: projectId, title: body, position: (count ?? 0) + 1, color: `s${((count ?? 0) % 7) + 1}` });
  if (error) return fail();
  refresh();
  return { ok: true } as Result;
}

export async function renamePattern(id: string, title: string): Promise<Result> {
  const body = title.trim();
  if (!uuid.safeParse(id).success || !body || body.length > 200) return invalid();
  const supabase = await createClient();
  const { data, error } = await supabase.from("patterns").update({ title: body }).eq("id", id).select("id").maybeSingle();
  if (error) return fail();
  return data ? { ok: true } : denied();
}

export async function deletePattern(id: string) {
  if (!uuid.safeParse(id).success) return invalid();
  const supabase = await createClient();
  const { error } = await supabase.from("patterns").delete().eq("id", id);
  if (error) return fail();
  refresh();
  return { ok: true } as Result;
}

/**
 * "Сформулювати інсайт" from a board column: the insight gets every card of the
 * cluster as a source and the pattern as its origin (docs/MVP.md §3).
 */
export async function createInsightFromPattern(formData: FormData) {
  const patternId = uuid.parse(formData.get("patternId"));
  const supabase = await createClient();
  const { data: pattern } = await supabase.from("patterns").select("id, project_id, title").eq("id", patternId).single();
  if (!pattern) throw new Error("pattern not found");
  const [{ data: obs }, { data: quotes }] = await Promise.all([
    supabase.from("observations").select("id").eq("pattern_id", patternId),
    supabase.from("quotes").select("id").eq("pattern_id", patternId),
  ]);
  const { data: insight, error } = await supabase.from("insights")
    .insert({ project_id: pattern.project_id, title: pattern.title }).select("id, code").single();
  if (error) throw error;
  const rows = [
    { source_type: "pattern", source_id: pattern.id, relation: "derived_from" },
    ...(obs ?? []).map((o) => ({ source_type: "observation", source_id: o.id, relation: "evidences" })),
    ...(quotes ?? []).map((q) => ({ source_type: "quote", source_id: q.id, relation: "evidences" })),
  ].map((r) => ({ ...r, project_id: pattern.project_id, target_type: "insight", target_id: insight.id }));
  const { error: e2 } = await supabase.from("trace_links").insert(rows);
  if (e2) throw e2;
  refresh();
  redirect(`${await projectBase(pattern.project_id)}/insights/${insight.code}`);
}

// ---------------------------------------------------------------- insights / pain points / opportunities

type Downstream = "insight" | "pain_point" | "opportunity";
const TABLE: Record<Downstream, "insights" | "pain_points" | "opportunities"> = {
  insight: "insights", pain_point: "pain_points", opportunity: "opportunities",
};
const SEGMENT: Record<Downstream, string> = { insight: "insights", pain_point: "pain-points", opportunity: "opportunities" };

/**
 * Create an insight / pain point / opportunity, optionally derived from an upstream
 * entity (insight → pain point → opportunity) so the chain stays connected.
 */
export async function createSynthesisEntity(formData: FormData) {
  const type = z.enum(["insight", "pain_point", "opportunity"]).parse(formData.get("type"));
  const projectId = uuid.parse(formData.get("projectId"));
  const fromType = z.enum(["insight", "pain_point"]).safeParse(formData.get("fromType")).data;
  const fromId = uuid.safeParse(formData.get("fromId")).data;
  const supabase = await createClient();
  let title: string = t.synthesis.newTitle[type] ?? type;
  if (fromType && fromId) {
    const { data } = await supabase.from(TABLE[fromType]).select("title").eq("id", fromId).maybeSingle();
    if (data?.title) title = data.title;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- three tables share project_id + title
  const { data, error } = await (supabase.from(TABLE[type]) as any).insert({ project_id: projectId, title }).select("id, code").single();
  if (error) throw error;
  if (fromType && fromId) await link(projectId, fromType, fromId, type, data.id, "derived_from");
  refresh();
  redirect(`${await projectBase(projectId)}/${SEGMENT[type]}/${data.code}`);
}

async function save(table: "insights" | "pain_points" | "opportunities", id: string, fields: object, version?: string | null): Promise<Result> {
  if (!uuid.safeParse(id).success) return invalid();
  // The shell shows code + title in ⌘K.
  return trackedSave(await updateTracked(table, { column: "id", value: id }, fields, "title", undefined, version));
}
function issue(err: z.ZodError): Result {
  const i = err.issues[0];
  return invalid(i?.message, i?.path[0]?.toString());
}

export async function saveInsight(id: string, input: InsightFields, version?: string | null): Promise<Result> {
  const p = insightSchema.safeParse(input);
  return p.success ? save("insights", id, p.data, version) : issue(p.error);
}
export async function savePainPoint(id: string, input: PainPointFields, version?: string | null): Promise<Result> {
  const p = painPointSchema.safeParse(input);
  return p.success ? save("pain_points", id, p.data, version) : issue(p.error);
}
export async function saveOpportunity(id: string, input: OpportunityFields, version?: string | null): Promise<Result> {
  const p = opportunitySchema.safeParse(input);
  return p.success ? save("opportunities", id, p.data, version) : issue(p.error);
}

/** Delete a synthesis entity and go back to its list. Links are cleaned up by the database. */
export async function deleteSynthesisEntity(formData: FormData) {
  const type = z.enum(["insight", "pain_point", "opportunity", "quote", "observation"]).parse(formData.get("type"));
  const id = uuid.parse(formData.get("id"));
  const table = { insight: "insights", pain_point: "pain_points", opportunity: "opportunities", quote: "quotes", observation: "observations" }[type];
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- table from a closed list
  const { data } = await (supabase.from(table as any) as any).delete().eq("id", id).select("project_id").maybeSingle();
  if (!data) throw new Error(t.autosave.readOnly);
  refresh();
  const back = type === "quote" || type === "observation" ? "synthesis" : SEGMENT[type as Downstream];
  redirect(`${await projectBase(data.project_id)}/${back}`);
}
