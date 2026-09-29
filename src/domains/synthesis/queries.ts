import "server-only";
import { cache } from "react";
import { createClient } from "@/shared/lib/supabase/server";

type P = { code: string; role: string | null } | null;

export type BoardCard = {
  kind: "observation" | "quote";
  id: string;
  code: string;
  text: string;
  obsKind: string | null;
  patternId: string | null;
  position: number;
  participant: P;
};

/** Synthesis board: patterns (columns) and all observations + quotes (cards). */
export const getBoard = cache(async (projectId: string) => {
  const supabase = await createClient();
  const [patterns, observations, quotes] = await Promise.all([
    supabase.from("patterns").select("id, code, title, description, color, position").eq("project_id", projectId).order("position").order("created_at"),
    supabase.from("observations").select("id, code, kind, body_text, pattern_id, position, participants(code, role)").eq("project_id", projectId).order("position").order("created_at"),
    supabase.from("quotes").select("id, code, text, pattern_id, position, participants(code, role)").eq("project_id", projectId).order("position").order("created_at"),
  ]);
  if (patterns.error) throw patterns.error;
  if (observations.error) throw observations.error;
  if (quotes.error) throw quotes.error;
  const cards: BoardCard[] = [
    ...observations.data.map((o) => ({ kind: "observation" as const, id: o.id, code: o.code, text: o.body_text, obsKind: o.kind, patternId: o.pattern_id, position: o.position, participant: o.participants })),
    ...quotes.data.map((q) => ({ kind: "quote" as const, id: q.id, code: q.code, text: q.text, obsKind: null, patternId: q.pattern_id, position: q.position, participant: q.participants })),
  ];
  return { patterns: patterns.data, cards };
});

export type Stats = { sources: number; participants: number };

/** Sources and unique participants for insights, pain points and opportunities of a project. */
export const getSynthesisStats = cache(async (projectId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("synthesis_stats", { p_project: projectId });
  if (error) throw error;
  return new Map<string, Stats>((data ?? []).map((s) => [s.entity_id, { sources: s.source_count, participants: s.participant_count }]));
});

export const listInsights = cache(async (projectId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("insights")
    .select("id, code, title, statement, confidence, status, origin, updated_at")
    .eq("project_id", projectId).is("archived_at", null).order("created_at");
  if (error) throw error;
  return data;
});

export const listPainPoints = cache(async (projectId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("pain_points")
    .select("id, code, title, description, severity, segment_label, updated_at")
    .eq("project_id", projectId).is("archived_at", null).order("created_at");
  if (error) throw error;
  return data;
});

export const listOpportunities = cache(async (projectId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("opportunities")
    .select("id, code, title, hmw, impact, effort, status, updated_at")
    .eq("project_id", projectId).is("archived_at", null).order("created_at");
  if (error) throw error;
  return data;
});

async function byCode<T>(table: "insights" | "pain_points" | "opportunities", projectId: string, code: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from(table).select("*").eq("project_id", projectId).eq("code", code.toUpperCase()).maybeSingle();
  if (error) throw error;
  return data as T | null;
}
export const getInsightByCode = cache((projectId: string, code: string) =>
  byCode<import("@/types/database").Tables<"insights">>("insights", projectId, code));
export const getPainPointByCode = cache((projectId: string, code: string) =>
  byCode<import("@/types/database").Tables<"pain_points">>("pain_points", projectId, code));
export const getOpportunityByCode = cache((projectId: string, code: string) =>
  byCode<import("@/types/database").Tables<"opportunities">>("opportunities", projectId, code));

export const getQuoteByCode = cache(async (projectId: string, code: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("quotes")
    .select("*, participants(code, role), interviews(code)")
    .eq("project_id", projectId).eq("code", code.toUpperCase()).maybeSingle();
  if (error) throw error;
  return data;
});

export const getObservationByCode = cache(async (projectId: string, code: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("observations")
    .select("*, participants(code, role), interviews(code)")
    .eq("project_id", projectId).eq("code", code.toUpperCase()).maybeSingle();
  if (error) throw error;
  return data;
});

/** Quotes and observations of one interview, to show next to the answers. */
export const listInterviewSynthesis = cache(async (interviewId: string) => {
  const supabase = await createClient();
  const [quotes, observations] = await Promise.all([
    supabase.from("quotes").select("id, code, text, answer_id").eq("interview_id", interviewId).order("created_at"),
    supabase.from("observations").select("id, code, kind, body_text").eq("interview_id", interviewId).order("created_at"),
  ]);
  if (quotes.error) throw quotes.error;
  if (observations.error) throw observations.error;
  return { quotes: quotes.data, observations: observations.data };
});

/** Numbers for the dashboard: synthesis progress and gaps. */
export const getSynthesisOverview = cache(async (projectId: string) => {
  const supabase = await createClient();
  const [board, insights, painPoints, opportunities, stats, interviews] = await Promise.all([
    getBoard(projectId), listInsights(projectId), listPainPoints(projectId), listOpportunities(projectId),
    getSynthesisStats(projectId),
    supabase.from("interviews").select("id, code, status").eq("project_id", projectId).in("status", ["done", "synthesized"]),
  ]);
  const { data: withObs } = await supabase.from("observations").select("interview_id").eq("project_id", projectId).not("interview_id", "is", null);
  const { data: withQuotes } = await supabase.from("quotes").select("interview_id").eq("project_id", projectId);
  const touched = new Set([...(withObs ?? []).map((o) => o.interview_id), ...(withQuotes ?? []).map((q) => q.interview_id)]);
  const unsupported = insights.filter((i) => (stats.get(i.id)?.sources ?? 0) === 0);
  return {
    quotes: board.cards.filter((c) => c.kind === "quote").length,
    observations: board.cards.filter((c) => c.kind === "observation").length,
    patterns: board.patterns.length,
    insights: insights.length,
    painPoints: painPoints.length,
    opportunities: opportunities.length,
    unsupported: unsupported.map((i) => i.code),
    interviewsWithoutSynthesis: (interviews.data ?? []).filter((i) => !touched.has(i.id)).map((i) => i.code),
  };
});
