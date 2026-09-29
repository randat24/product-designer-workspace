import "server-only";
import { cache } from "react";
import { createClient } from "@/shared/lib/supabase/server";
import { GUIDE_SECTIONS } from "./schema";

const sectionOrder = (s: string) => GUIDE_SECTIONS.findIndex((x) => x.value === s);

export const listPlans = cache(async (projectId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("research_plans")
    .select("id, code, title, goal, method, status, participants_target, updated_at")
    .eq("project_id", projectId)
    .is("archived_at", null)
    .order("created_at");
  if (error) throw error;
  return data;
});

export const getPlanByCode = cache(async (projectId: string, code: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("research_plans")
    .select("*")
    .eq("project_id", projectId)
    .eq("code", code.toUpperCase())
    .maybeSingle();
  if (error) throw error;
  return data;
});

export const listGuides = cache(async (projectId: string) => {
  const supabase = await createClient();
  const [guides, questions] = await Promise.all([
    supabase.from("interview_guides").select("id, title, research_plan_id, updated_at").eq("project_id", projectId).order("created_at"),
    supabase.from("interview_questions").select("guide_id").eq("project_id", projectId),
  ]);
  if (guides.error) throw guides.error;
  if (questions.error) throw questions.error;
  const counts = new Map<string, number>();
  for (const q of questions.data) counts.set(q.guide_id, (counts.get(q.guide_id) ?? 0) + 1);
  return guides.data.map((g) => ({ ...g, questionCount: counts.get(g.id) ?? 0 }));
});

export type GuideQuestion = { id: string; section: string; position: number; text: string; probes: string[]; is_key: boolean };

/** Guide with questions in section order. */
export const getGuide = cache(async (projectId: string, guideId: string) => {
  const supabase = await createClient();
  const [guide, questions] = await Promise.all([
    supabase.from("interview_guides").select("id, title, intro, outro, research_plan_id").eq("project_id", projectId).eq("id", guideId).maybeSingle(),
    supabase.from("interview_questions").select("id, section, position, text, probes, is_key").eq("guide_id", guideId),
  ]);
  if (guide.error) throw guide.error;
  if (!guide.data) return null;
  if (questions.error) throw questions.error;
  const sorted: GuideQuestion[] = [...questions.data].sort(
    (a, b) => sectionOrder(a.section) - sectionOrder(b.section) || a.position - b.position,
  );
  return { ...guide.data, questions: sorted };
});

/** Participants with their latest interview (status drives the table and progress). */
export const listParticipants = cache(async (projectId: string) => {
  const supabase = await createClient();
  const [participants, interviews] = await Promise.all([
    supabase.from("participants")
      .select("id, code, display_name, role, segment_label, age_range, consent_at, tags, updated_at")
      .eq("project_id", projectId).is("archived_at", null).order("code"),
    supabase.from("interviews").select("id, code, participant_id, status, conducted_at, guide_id, created_at")
      .eq("project_id", projectId).order("created_at"),
  ]);
  if (participants.error) throw participants.error;
  if (interviews.error) throw interviews.error;
  const latest = new Map<string, (typeof interviews.data)[number]>();
  for (const i of interviews.data) latest.set(i.participant_id, i);
  return participants.data.map((p) => ({ ...p, interview: latest.get(p.id) ?? null }));
});
export type ParticipantListItem = Awaited<ReturnType<typeof listParticipants>>[number];

export const getParticipantByCode = cache(async (projectId: string, code: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("participants").select("*").eq("project_id", projectId).eq("code", code.toUpperCase()).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const { data: interviews, error: e2 } = await supabase
    .from("interviews").select("id, code, status, conducted_at, mode, guide_id").eq("participant_id", data.id).order("created_at");
  if (e2) throw e2;
  return { ...data, interviews };
});

export const listInterviews = cache(async (projectId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("interviews")
    .select("id, code, status, conducted_at, guide_id, participant_id, participants(code, display_name, role)")
    .eq("project_id", projectId)
    .order("created_at");
  if (error) throw error;
  return data;
});

export type InterviewAnswer = { id: string; code: string; question_id: string | null; body_text: string; position: number };

export const getInterviewByCode = cache(async (projectId: string, code: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("interviews")
    .select("*, participants(id, code, display_name, role, segment_label)")
    .eq("project_id", projectId)
    .eq("code", code.toUpperCase())
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const [guide, answers] = await Promise.all([
    data.guide_id ? getGuide(projectId, data.guide_id) : Promise.resolve(null),
    supabase.from("interview_answers").select("id, code, question_id, body_text, position").eq("interview_id", data.id).order("position").order("created_at"),
  ]);
  if (answers.error) throw answers.error;
  return { ...data, guide, answers: answers.data as InterviewAnswer[] };
});

/** Question × Participant repository for one guide (docs/IA.md: /research/matrix). */
export const getResearchMatrix = cache(async (projectId: string, guideId: string) => {
  const guide = await getGuide(projectId, guideId);
  if (!guide) return null;
  const supabase = await createClient();
  const { data: interviews, error } = await supabase
    .from("interviews")
    .select("id, code, status, participants(id, code, display_name, role, segment_label)")
    .eq("guide_id", guideId)
    .order("created_at");
  if (error) throw error;
  const ids = interviews.map((i) => i.id);
  const { data: answers, error: e2 } = ids.length
    ? await supabase.from("interview_answers").select("id, interview_id, question_id, body_text").in("interview_id", ids).not("question_id", "is", null)
    : { data: [], error: null };
  if (e2) throw e2;
  const cells: Record<string, { id: string; text: string }> = {};
  for (const a of answers ?? []) cells[`${a.question_id}:${a.interview_id}`] = { id: a.id, text: a.body_text };
  return { guide, interviews, cells };
});

/** Numbers for the research overview and the project dashboard. */
export const getResearchStats = cache(async (projectId: string) => {
  const [plans, guides, participants] = await Promise.all([listPlans(projectId), listGuides(projectId), listParticipants(projectId)]);
  const interviews = participants.flatMap((p) => (p.interview ? [p.interview] : []));
  const conducted = interviews.filter((i) => i.status === "done" || i.status === "synthesized").length;
  const target = plans.find((p) => p.participants_target)?.participants_target ?? null;
  return {
    plans: plans.length,
    guides: guides.length,
    questions: guides.reduce((s, g) => s + g.questionCount, 0),
    participants: participants.length,
    interviews: interviews.length,
    conducted,
    target,
  };
});
