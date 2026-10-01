// One schema for the request form: the wizard validates each step with it, the server validates the whole
// payload again before calling the database (which checks the shape a third time).
// Error messages are codes; the form turns them into text in the visitor's language.

import { z } from "zod";
import { withScheme } from "@/shared/lib/url";
import {
  BUDGET_SPECIAL, CHANNELS, CURRENCIES, EXISTING_LINK_KINDS, FORM_VERSION, GOALS, LIMITS, MARKETS,
  MATERIAL_LINK_KINDS, MATERIALS, PROJECT_TYPES, SCOPE, START_OPTIONS, findBudgetRange,
} from "./config";

export const ERR = {
  required: "required",
  tooLong: "too_long",
  url: "invalid_url",
  email: "invalid_email",
  tooMany: "too_many",
  pickOne: "pick_one",
  date: "invalid_date",
  budget: "invalid_budget",
  consent: "consent",
  phone: "invalid_phone",
} as const;

/** Optional text: trimmed, empty becomes undefined. */
const text = (max: number) =>
  z.string().trim().max(max, ERR.tooLong).optional().transform((v) => (v ? v : undefined));
const requiredText = (max: number) => z.string({ error: ERR.required }).trim().min(1, ERR.required).max(max, ERR.tooLong);

/** http(s) URL with a host that has a dot; "example.com" is accepted and gets https:// (Postel's law). No credentials. */
export function normalizeUrl(value: string): string | null {
  const v = withScheme(value);
  if (!v || v.length > LIMITS.url) return null;
  try {
    const u = new URL(v);
    if (!["http:", "https:"].includes(u.protocol) || !u.hostname.includes(".") || u.username || u.password) return null;
    return u.toString();
  } catch {
    return null;
  }
}
const url = () =>
  z.string().trim().optional().transform((v, ctx) => {
    if (!v) return undefined;
    const n = normalizeUrl(v);
    if (!n) ctx.addIssue({ code: "custom", message: ERR.url });
    return n ?? undefined;
  });
const requiredUrl = () =>
  z.string({ error: ERR.required }).trim().min(1, ERR.required).transform((v, ctx) => {
    const n = normalizeUrl(v);
    if (!n) ctx.addIssue({ code: "custom", message: ERR.url });
    return n ?? v;
  });

const keys = <T extends readonly [string, ...string[]]>(values: T, max: number) =>
  z.array(z.enum(values)).max(max, ERR.tooMany).default([]).transform((a) => [...new Set(a)]);

const link = (kinds: readonly [string, ...string[]]) => z.object({ kind: z.enum(kinds).default("other"), url: requiredUrl() });

// ---------------------------------------------------------------------------------------------
// Steps (in wizard order). Conditional rules live in each step's superRefine.
// ---------------------------------------------------------------------------------------------

export const projectStep = z.object({
  types: keys(PROJECT_TYPES, PROJECT_TYPES.length).refine((a) => a.length > 0, ERR.pickOne),
  type_other: text(LIMITS.short),
  name: text(LIMITS.name),
  name_unknown: z.boolean().default(false),
}).superRefine((v, ctx) => {
  if (v.types.includes("other") && !v.type_other) ctx.addIssue({ code: "custom", path: ["type_other"], message: ERR.required });
  if (!v.name && !v.name_unknown) ctx.addIssue({ code: "custom", path: ["name"], message: ERR.required });
}).transform((v) => ({ ...v, type_other: v.types.includes("other") ? v.type_other : undefined, name: v.name_unknown ? undefined : v.name }));

export const existingStep = z.object({
  has: z.boolean({ error: ERR.required }),
  url: url(),
  description: text(LIMITS.long),
  works_well: text(LIMITS.long),
  dislikes: text(LIMITS.long),
  must_change: text(LIMITS.long),
  links: z.array(link(EXISTING_LINK_KINDS)).max(LIMITS.links, ERR.tooMany).default([]),
}).transform((v) => (v.has ? v : { has: false as const, links: [] as { kind: string; url: string }[] }));

export const aboutStep = z.object({
  summary: requiredText(LIMITS.long),
  what_it_does: text(LIMITS.long),
  problem: text(LIMITS.long),
  why_now: text(LIMITS.long),
  goals: keys(GOALS, GOALS.length),
  goal_other: text(LIMITS.short),
}).superRefine((v, ctx) => {
  if (v.goals.includes("other") && !v.goal_other) ctx.addIssue({ code: "custom", path: ["goal_other"], message: ERR.required });
}).transform((v) => ({ ...v, goal_other: v.goals.includes("other") ? v.goal_other : undefined }));

export const audienceStep = z.object({
  audience: text(LIMITS.long),
  primary_users: text(LIMITS.long),
  geography: text(LIMITS.short),
  market: z.enum(MARKETS).optional(),
  demographics: text(1000),
  pain_points: text(LIMITS.long),
});

const competitor = z.object({
  name: requiredText(LIMITS.name),
  url: url(),
  likes: text(LIMITS.note),
  dislikes: text(LIMITS.note),
  why: text(LIMITS.note),
});
const reference = z.object({ url: requiredUrl(), note: text(LIMITS.note) });

export const competitorsStep = z.object({
  knows_competitors: z.boolean().default(false),
  competitors: z.array(competitor).max(LIMITS.competitors, ERR.tooMany).default([]),
  references: z.array(reference).max(LIMITS.references, ERR.tooMany).default([]),
}).transform((v) => ({ ...v, competitors: v.knows_competitors ? v.competitors : [] }));

export const scopeStep = z.object({
  items: keys(SCOPE, SCOPE.length),
  needs_advice: z.boolean().default(false),
}).refine((v) => v.items.length > 0 || v.needs_advice, { message: ERR.pickOne, path: ["items"] });

export const materialsStep = z.object({
  items: keys(MATERIALS, MATERIALS.length),
  links: z.array(link(MATERIAL_LINK_KINDS)).max(LIMITS.links, ERR.tooMany).default([]),
});

const money = z.union([z.number(), z.string()]).optional().transform((v, ctx) => {
  if (v === undefined || v === "") return undefined;
  const n = typeof v === "number" ? v : Number(String(v).replace(/[\s,]/g, ""));
  if (!Number.isFinite(n) || n < 0 || n > 1e10) {
    ctx.addIssue({ code: "custom", message: ERR.budget });
    return undefined;
  }
  return Math.round(n * 100) / 100;
});

export const budgetStep = z.object({
  range: z.string().min(1, ERR.required),
  currency: z.enum(CURRENCIES).default("USD"),
  min: money,
  max: money,
  note: text(1000),
  start: z.enum(START_OPTIONS, { error: ERR.required }),
  has_deadline: z.boolean().default(false),
  deadline_date: z.string().optional(),
  deadline_reason: text(1000),
}).superRefine((v, ctx) => {
  const special = (BUDGET_SPECIAL as readonly string[]).includes(v.range);
  const range = findBudgetRange(v.range);
  if (!special && !range) ctx.addIssue({ code: "custom", path: ["range"], message: ERR.required });
  if (range && range.currency !== v.currency) ctx.addIssue({ code: "custom", path: ["range"], message: ERR.budget });
  if (v.range === "custom") {
    if (v.min === undefined && v.max === undefined) ctx.addIssue({ code: "custom", path: ["min"], message: ERR.required });
    if (v.min !== undefined && v.max !== undefined && v.max < v.min) ctx.addIssue({ code: "custom", path: ["max"], message: ERR.budget });
  }
  if (v.has_deadline) {
    if (!v.deadline_date || !/^\d{4}-\d{2}-\d{2}$/.test(v.deadline_date) || Number.isNaN(Date.parse(v.deadline_date))) {
      ctx.addIssue({ code: "custom", path: ["deadline_date"], message: ERR.date });
    }
  }
}).transform((v) => {
  const range = findBudgetRange(v.range);
  // Store the bounds of a chosen range too, so the workspace can sort by budget; custom keeps typed bounds.
  const min = range ? range.min : v.range === "custom" ? v.min : undefined;
  const max = range ? (range.max ?? undefined) : v.range === "custom" ? v.max : undefined;
  const hasAmount = range || v.range === "custom";
  return {
    range: v.range,
    currency: hasAmount ? v.currency : undefined,
    min,
    max,
    note: v.note,
    start: v.start,
    has_deadline: v.has_deadline,
    deadline_date: v.has_deadline ? v.deadline_date : undefined,
    deadline_reason: v.has_deadline ? v.deadline_reason : undefined,
  };
});

export const contactStep = z.object({
  name: requiredText(LIMITS.name),
  email: z.string({ error: ERR.required }).trim().min(1, ERR.required).max(254, ERR.tooLong)
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, ERR.email),
  company: text(160),
  role: text(LIMITS.name),
  phone: text(40).refine((v) => !v || /^[+()\d\s.-]{5,40}$/.test(v), ERR.phone),
  telegram: text(64),
  website: url(),
  preferred_channel: z.enum(CHANNELS).default("email"),
  preferred_channel_note: text(LIMITS.short),
  additional_info: text(LIMITS.additional),
}).superRefine((v, ctx) => {
  if (v.preferred_channel === "telegram" && !v.telegram) ctx.addIssue({ code: "custom", path: ["telegram"], message: ERR.required });
  if (v.preferred_channel === "phone" && !v.phone) ctx.addIssue({ code: "custom", path: ["phone"], message: ERR.required });
  if (v.preferred_channel === "other" && !v.preferred_channel_note) ctx.addIssue({ code: "custom", path: ["preferred_channel_note"], message: ERR.required });
});

export const STEPS = {
  project: projectStep,
  existing: existingStep,
  about: aboutStep,
  audience: audienceStep,
  competitors: competitorsStep,
  scope: scopeStep,
  materials: materialsStep,
  budget: budgetStep,
  contact: contactStep,
} as const;
export type StepId = keyof typeof STEPS;
export const STEP_ORDER = Object.keys(STEPS) as StepId[];

export const requestSchema = z.object({
  locale: z.enum(["uk", "en"]),
  project: projectStep,
  existing: existingStep,
  about: aboutStep,
  audience: audienceStep,
  competitors: competitorsStep,
  scope: scopeStep,
  materials: materialsStep,
  budget: budgetStep,
  contact: contactStep,
  consent: z.literal(true, { error: ERR.consent }),
});
export type RequestInput = z.input<typeof requestSchema>;
export type RequestData = z.output<typeof requestSchema>;

/** The JSON the database function expects (see submit_project_request in the migration). */
export function toDbPayload(d: RequestData) {
  const { additional_info, ...client } = d.contact;
  return {
    locale: d.locale,
    form_version: FORM_VERSION,
    client,
    project: d.project,
    existing: d.existing,
    about: d.about,
    audience: d.audience,
    competitors: d.competitors.competitors,
    references: d.competitors.references,
    scope: d.scope,
    materials: d.materials,
    budget: {
      range: d.budget.range, min: d.budget.min, max: d.budget.max, currency: d.budget.currency, note: d.budget.note,
    },
    timeline: {
      start: d.budget.start, has_deadline: d.budget.has_deadline,
      deadline_date: d.budget.deadline_date, deadline_reason: d.budget.deadline_reason,
    },
    additional_info,
    consent: { given: d.consent },
  };
}
