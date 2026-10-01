import { z } from "zod";

const text = (max = 5000) => z.string().trim().max(max).nullish().transform((v) => v || null);

export const OBSERVATION_KINDS = [
  { value: "pain", label: "Біль", color: "var(--entity-problem)" },
  { value: "need", label: "Потреба", color: "var(--entity-opportunity)" },
  { value: "behavior", label: "Поведінка", color: "var(--entity-research)" },
  { value: "emotion", label: "Емоція", color: "var(--entity-synthesis)" },
  { value: "fact", label: "Факт", color: "var(--entity-decision)" },
  { value: "workaround", label: "Обхідний шлях", color: "var(--entity-structure)" },
] as const;
export type ObservationKind = (typeof OBSERVATION_KINDS)[number]["value"];
export const kindOf = (k: string) => OBSERVATION_KINDS.find((x) => x.value === k) ?? OBSERVATION_KINDS[2];

export const LEVELS = [
  { value: "low", label: "Низька" },
  { value: "medium", label: "Середня" },
  { value: "high", label: "Висока" },
] as const;
export const IMPACT_LEVELS = [
  { value: "low", label: "Низький" },
  { value: "medium", label: "Середній" },
  { value: "high", label: "Високий" },
] as const;
export const EFFORT_LEVELS = [
  { value: "low", label: "Малі" },
  { value: "medium", label: "Середні" },
  { value: "high", label: "Великі" },
] as const;
export const INSIGHT_STATUSES = [
  { value: "draft", label: "Чернетка" },
  { value: "validated", label: "Підтверджено" },
  { value: "rejected", label: "Відхилено" },
] as const;
export const SEVERITIES = [
  { value: "critical", label: "Критична" },
  { value: "high", label: "Висока" },
  { value: "medium", label: "Середня" },
  { value: "low", label: "Низька" },
] as const;
export const OPPORTUNITY_STATUSES = [
  { value: "open", label: "Відкрита" },
  { value: "in_design", label: "У проєктуванні" },
  { value: "addressed", label: "Розв'язана" },
  { value: "dropped", label: "Відкладена" },
] as const;
export const labelOf = (list: readonly { value: string; label: string }[], v: string) => list.find((x) => x.value === v)?.label ?? v;

/** Severity weight for sorting pain points by priority (severity × frequency). */
export const SEVERITY_WEIGHT: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };

export const insightSchema = z.object({
  title: z.string().trim().min(1, { error: "Сформулюйте інсайт" }).max(300),
  statement: text(),
  confidence: z.enum(["low", "medium", "high"]),
  status: z.enum(["draft", "validated", "rejected"]),
});
export type InsightFields = z.output<typeof insightSchema>;

export const painPointSchema = z.object({
  title: z.string().trim().min(1, { error: "Назвіть біль" }).max(300),
  description: text(),
  severity: z.enum(["critical", "high", "medium", "low"]),
  segment_label: text(80),
});
export type PainPointFields = z.output<typeof painPointSchema>;

export const opportunitySchema = z.object({
  title: z.string().trim().min(1, { error: "Назвіть можливість" }).max(300),
  description: text(),
  hmw: text(1000),
  impact: z.enum(["low", "medium", "high"]),
  effort: z.enum(["low", "medium", "high"]),
  status: z.enum(["open", "in_design", "addressed", "dropped"]),
});
export type OpportunityFields = z.output<typeof opportunitySchema>;

export const observationSchema = z.object({
  kind: z.enum(["pain", "need", "behavior", "emotion", "fact", "workaround"]),
  body_text: z.string().trim().min(1).max(2000),
});

/** Participant sticky colour by code number (P01 → s1 … P08 → s1). */
export const participantColor = (code: string | null | undefined) => {
  const n = Number((code ?? "").replace(/\D/g, ""));
  return n ? `var(--s${((n - 1) % 7) + 1})` : "var(--line)";
};

export const INSIGHT_TYPES = ["insight", "pain_point", "opportunity"] as const;
