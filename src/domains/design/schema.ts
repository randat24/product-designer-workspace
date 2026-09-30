import { z } from "zod";
import type { Enums } from "@/types/database";
import { t } from "@/shared/i18n/ru";
import { isHttpUrl, withScheme } from "@/shared/lib/url";

export type ScreenStatus = Enums<"screen_status">;
export type StateKind = Enums<"screen_state_kind">;
export type StateStatus = Enums<"screen_state_status">;
export type DecisionStatus = Enums<"decision_status">;

const opts = <K extends string>(labels: Record<K, string>) =>
  (Object.keys(labels) as K[]).map((value) => ({ value, label: labels[value] }));

export const SCREEN_STATUSES = opts(t.screens.statuses);
export const STATE_KINDS = opts(t.screens.states.kinds);
export const STATE_STATUSES = opts(t.screens.states.statuses);
export const DECISION_STATUSES = opts(t.decisions.statuses);
/** States whose absence the overview reports (docs/MVP.md §3). */
export const KEY_STATES: StateKind[] = ["loading", "empty", "error"];

const text = (max = 5000) => z.string().trim().max(max).nullish().transform((v) => v || null);
// "figma.com/design/…" gets https:// added; other schemes (javascript:, file:) are rejected.
const url = z.string().trim().max(2000).nullish()
  .transform((v) => (v ? withScheme(v) : null))
  .refine((v) => v === null || isHttpUrl(v), { message: "url" });

export const screenSpecSchema = z.object({
  name: z.string().trim().min(1).max(200),
  purpose: text(),
  user_goal: text(),
  entry_points: text(),
  primary_action: text(1000),
  secondary_actions: text(),
  content_hierarchy: z.array(z.string().trim().max(300)).max(50).transform((a) => a.filter(Boolean)),
  permissions: text(),
  analytics_events: z.array(z.object({
    name: z.string().trim().max(120), trigger: z.string().trim().max(300), props: z.string().trim().max(300),
  })).max(50).transform((a) => a.filter((e) => e.name || e.trigger || e.props)),
  api_data_requirements: text(),
  status: z.enum(["sketch", "wireframe", "prototype", "tested", "ready"]),
  figma_url: url,
});
export type ScreenSpec = z.input<typeof screenSpecSchema>;

export const decisionSchema = z.object({
  title: z.string().trim().min(1).max(300),
  context: text(),
  decision: text(),
  reason: text(),
  alternatives: z.array(z.object({ option: z.string().trim().max(300), why_rejected: z.string().trim().max(1000) }))
    .max(20).transform((a) => a.filter((x) => x.option || x.why_rejected)),
  status: z.enum(["proposed", "accepted", "superseded", "rejected"]),
  decided_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish().or(z.literal("")).transform((v) => v || null),
  superseded_by_id: z.uuid().nullish().or(z.literal("")).transform((v) => v || null),
});
export type DecisionFields = z.input<typeof decisionSchema>;

export type AnalyticsEvent = { name: string; trigger: string; props: string };
export type Alternative = { option: string; why_rejected: string };

/** jsonb from the database → typed arrays for editors. */
export const asStrings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
export const asEvents = (v: unknown): AnalyticsEvent[] =>
  Array.isArray(v) ? v.map((e) => ({ name: String(e?.name ?? ""), trigger: String(e?.trigger ?? ""), props: String(e?.props ?? "") })) : [];
export const asAlternatives = (v: unknown): Alternative[] =>
  Array.isArray(v) ? v.map((a) => ({ option: String(a?.option ?? ""), why_rejected: String(a?.why_rejected ?? "") })) : [];
