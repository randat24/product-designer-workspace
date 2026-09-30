import "server-only";
import { cache } from "react";
import { createClient } from "@/shared/lib/supabase/server";
import { listScreenshots } from "@/domains/competitors";
import { resolveEntities } from "@/domains/trace/queries";
import type { EntityType } from "@/shared/entities";

/** Screens of a project with list numbers: missing key states, flows, upstream links, decisions. */
export const listScreens = cache(async (projectId: string) => {
  const supabase = await createClient();
  const [screens, stats] = await Promise.all([
    supabase.from("screens").select("id, code, name, status, purpose").eq("project_id", projectId).is("archived_at", null).order("code"),
    supabase.rpc("screen_stats", { p_project: projectId }),
  ]);
  if (screens.error) throw screens.error;
  if (stats.error) throw stats.error;
  const byId = new Map(stats.data.map((s) => [s.screen_id, s]));
  return screens.data.map((s) => {
    const st = byId.get(s.id);
    return { ...s, missingStates: st?.missing_states ?? 0, flows: st?.flows ?? [], upstream: st?.upstream ?? 0, decisions: st?.decisions ?? 0 };
  });
});

/** Key states (loading / empty / error) per screen, for the list indicators. */
export const listKeyStates = cache(async (projectId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("screen_states").select("screen_id, kind, status")
    .eq("project_id", projectId).in("kind", ["loading", "empty", "error"]);
  if (error) throw error;
  const out = new Map<string, Record<string, string>>();
  for (const s of data) out.set(s.screen_id, { ...(out.get(s.screen_id) ?? {}), [s.kind]: s.status });
  return out;
});

export type ScreenState = { id: string; kind: string; description: string | null; figma_url: string | null; status: string };

/** One screen: spec, states, where it is used, preview images. */
export const getScreenByCode = cache(async (projectId: string, code: string) => {
  const supabase = await createClient();
  const { data: screen } = await supabase.from("screens").select("*").eq("project_id", projectId).eq("code", code.toUpperCase()).maybeSingle();
  if (!screen) return null;
  const [states, nodes, previews] = await Promise.all([
    supabase.from("screen_states").select("id, kind, description, figma_url, status").eq("screen_id", screen.id).order("position").order("created_at"),
    supabase.from("flow_nodes").select("id, label, user_flows(code, name)").eq("screen_id", screen.id),
    listScreenshots("screen", screen.id),
  ]);
  if (states.error) throw states.error;
  if (nodes.error) throw nodes.error;
  const flows = new Map<string, { code: string; name: string; steps: string[] }>();
  for (const n of nodes.data) {
    if (!n.user_flows) continue;
    const f = flows.get(n.user_flows.code) ?? { ...n.user_flows, steps: [] };
    f.steps.push(n.label);
    flows.set(n.user_flows.code, f);
  }
  return { ...screen, states: states.data as ScreenState[], flows: [...flows.values()], previews };
});

/** Decisions that implement a screen (upstream design_decision → screen). */
export async function listScreenDecisions(screenId: string) {
  const supabase = await createClient();
  const { data: links } = await supabase.from("trace_links").select("source_id")
    .eq("target_type", "screen").eq("target_id", screenId).eq("source_type", "design_decision");
  const ids = (links ?? []).map((l) => l.source_id);
  if (!ids.length) return [];
  const { data } = await supabase.from("design_decisions").select("id, code, title, status").in("id", ids).order("code");
  return data ?? [];
}

// ---------------------------------------------------------------- decisions

export const listDecisions = cache(async (projectId: string) => {
  const supabase = await createClient();
  const [decisions, stats] = await Promise.all([
    supabase.from("design_decisions").select("id, code, title, status, decided_at, created_at, profiles!design_decisions_author_id_fkey(full_name)")
      .eq("project_id", projectId).is("archived_at", null).order("code", { ascending: false }),
    supabase.rpc("decision_stats", { p_project: projectId }),
  ]);
  if (decisions.error) throw decisions.error;
  if (stats.error) throw stats.error;
  const byId = new Map(stats.data.map((s) => [s.decision_id, s]));
  return decisions.data.map((d) => ({
    id: d.id, code: d.code, title: d.title, status: d.status, decidedAt: d.decided_at ?? d.created_at.slice(0, 10),
    author: d.profiles?.full_name ?? null,
    evidence: byId.get(d.id)?.evidence ?? 0, targets: byId.get(d.id)?.targets ?? 0,
  }));
});

export const getDecisionByCode = cache(async (projectId: string, code: string) => {
  const supabase = await createClient();
  const { data } = await supabase.from("design_decisions")
    .select("*, profiles!design_decisions_author_id_fkey(full_name)")
    .eq("project_id", projectId).eq("code", code.toUpperCase()).maybeSingle();
  return data;
});

// Research entities that may justify a decision (trace_relation_rules, relation "justifies").
const EVIDENCE_TYPES: EntityType[] = ["interview", "quote", "observation", "insight", "pain_point", "opportunity", "competitor"];

/**
 * Evidence suggestions: everything upstream of the screens and flows this decision implements
 * (docs/MVP.md §3 "из trace-графа экрана"), minus what already justifies it.
 */
export async function getEvidenceSuggestions(base: string, decisionId: string) {
  const supabase = await createClient();
  const { data: links } = await supabase.from("trace_links").select("source_type, source_id, target_type, target_id, relation")
    .or(`and(source_type.eq.design_decision,source_id.eq.${decisionId}),and(target_type.eq.design_decision,target_id.eq.${decisionId})`);
  const targets = (links ?? []).filter((l) => l.source_id === decisionId && l.relation === "implements");
  const existing = new Set((links ?? []).filter((l) => l.target_id === decisionId).map((l) => `${l.source_type}:${l.source_id}`));
  const found = new Map<string, { type: EntityType; id: string }>();
  await Promise.all(targets.map(async (tg) => {
    const { data } = await supabase.rpc("trace_graph", { p_type: tg.target_type, p_id: tg.target_id, p_direction: "up", p_max_depth: 6 });
    for (const e of data ?? []) {
      const type = e.source_type as EntityType;
      if (!EVIDENCE_TYPES.includes(type) || existing.has(`${type}:${e.source_id}`)) continue;
      found.set(`${type}:${e.source_id}`, { type, id: e.source_id });
    }
  }));
  const resolved = await resolveEntities(base, [...found.values()]);
  const order = (t: string) => EVIDENCE_TYPES.indexOf(t as EntityType);
  return [...resolved.values()].sort((a, b) => order(b.type) - order(a.type) || a.code.localeCompare(b.code, "ru", { numeric: true }));
}
