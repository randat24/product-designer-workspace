import { z } from "zod";
import { t } from "@/shared/i18n/ru";

const text = (max = 5000) =>
  z.string().trim().max(max).nullish().transform((v) => v || null);
const cell = (max = 200) => z.string().trim().max(max).catch("");
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .nullish()
  .catch(null)
  .transform((v) => v || null);

/** Accepts "example.com" as well as full URLs; anything else is kept as typed. */
const url = cell(2000).transform((v) => (v && !/^[a-z][a-z0-9+.-]*:/i.test(v) ? `https://${v}` : v));

// Empty rows are dropped on save; the editor keeps them locally while the user types.
export const briefSchema = z
  .object({
    product_description: text(),
    existing_product: text(),
    business: text(),
    business_requirements: text(),
    target_audience: text(),
    problem: text(),
    goals: z.array(cell(300)).max(30).catch([]).transform((a) => a.filter(Boolean)),
    kpis: z
      .array(z.object({ name: cell(), target: cell(), current: cell() }))
      .max(30)
      .catch([])
      .transform((a) => a.filter((k) => k.name || k.target || k.current)),
    constraints: text(),
    technical_constraints: text(),
    timeline_start: date,
    timeline_end: date,
    team: z
      .array(z.object({ name: cell(), role: cell() }))
      .max(50)
      .catch([])
      .transform((a) => a.filter((m) => m.name || m.role)),
    links: z
      .array(z.object({ title: cell(), url }))
      .max(50)
      .catch([])
      .transform((a) => a.filter((l) => l.title || l.url)),
  })
  .refine((b) => !b.timeline_start || !b.timeline_end || b.timeline_end >= b.timeline_start, {
    path: ["timeline_end"],
    error: t.brief.timelineOrder,
  });

export type Brief = z.output<typeof briefSchema>;
export type BriefInput = z.input<typeof briefSchema>;

export const EMPTY_BRIEF: Brief = briefSchema.parse({});

/**
 * Fields that make a brief usable for the next stages. Drives brief progress
 * on the Overview and its next actions.
 */
export const BRIEF_KEY_FIELDS = [
  { key: "product_description", filled: (b: Brief) => !!b.product_description },
  { key: "target_audience", filled: (b: Brief) => !!b.target_audience },
  { key: "problem", filled: (b: Brief) => !!b.problem },
  { key: "goals", filled: (b: Brief) => b.goals.length > 0 },
  { key: "kpis", filled: (b: Brief) => b.kpis.length > 0 },
  { key: "constraints", filled: (b: Brief) => !!b.constraints || !!b.technical_constraints },
  { key: "timeline", filled: (b: Brief) => !!b.timeline_start && !!b.timeline_end },
] as const;

export type BriefKeyField = (typeof BRIEF_KEY_FIELDS)[number]["key"];

export function briefCompleteness(b: Brief) {
  const missing = BRIEF_KEY_FIELDS.filter((f) => !f.filled(b)).map((f) => f.key);
  return { filled: BRIEF_KEY_FIELDS.length - missing.length, total: BRIEF_KEY_FIELDS.length, missing };
}
