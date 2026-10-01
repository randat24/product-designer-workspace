// Answer options of the project request form. Keys are stored in the database, so a label can be
// renamed freely; removing a key keeps old requests readable (the label falls back to the key).
// Labels for the site (uk/en) and the workspace (ru) are in ./labels.ts.

export const PROJECT_TYPES = [
  "new_product", "redesign", "website", "landing_page", "web_app", "mobile_app", "saas",
  "ux_audit", "ui_audit", "design_system", "prototype_mvp", "other",
] as const;

export const GOALS = [
  "increase_conversion", "improve_usability", "modernize_visual", "launch_mvp", "from_scratch",
  "improve_mobile", "simplify_flows", "build_design_system", "prepare_for_dev", "improve_ux", "other",
] as const;

export const MARKETS = ["b2b", "b2c", "b2b2c", "internal", "unknown"] as const;

export const SCOPE = [
  "ux_research", "competitor_analysis", "information_architecture", "user_flow", "wireframes", "ux_design",
  "ui_design", "prototype", "mobile_design", "responsive_web", "design_system", "ui_kit", "dev_handoff",
  "usability_testing", "ux_audit", "design_review",
] as const;

export const MATERIALS = [
  "idea_only", "requirements", "tech_spec", "brand_identity", "logo", "existing_website", "existing_app",
  "wireframes", "design", "figma", "analytics", "user_research", "customer_feedback", "existing_code", "nothing",
] as const;

export const EXISTING_LINK_KINDS = ["website", "app_store", "google_play", "figma", "behance", "dribbble", "other"] as const;
export const MATERIAL_LINK_KINDS = ["figma", "google_drive", "dropbox", "notion", "website", "other"] as const;

export const CHANNELS = ["email", "telegram", "phone", "other"] as const;

export const START_OPTIONS = ["asap", "two_weeks", "month", "one_three_months", "later", "undecided"] as const;
export const DEADLINE_REASONS = ["launch", "investors", "dev_schedule", "marketing", "internal"] as const;

export const CURRENCIES = ["USD", "EUR", "UAH"] as const;
export type Currency = (typeof CURRENCIES)[number];

/**
 * Budget ranges per currency. `tier` (1–6) makes ranges comparable across currencies for sorting and
 * for the anonymous analytics band; `max: null` is an open upper bound.
 */
export type BudgetRange = { key: string; min: number; max: number | null; tier: number };
export const BUDGET_RANGES: Record<Currency, BudgetRange[]> = {
  USD: [
    { key: "usd_lt_500", min: 0, max: 500, tier: 1 },
    { key: "usd_500_1000", min: 500, max: 1000, tier: 2 },
    { key: "usd_1000_2500", min: 1000, max: 2500, tier: 3 },
    { key: "usd_2500_5000", min: 2500, max: 5000, tier: 4 },
    { key: "usd_5000_10000", min: 5000, max: 10000, tier: 5 },
    { key: "usd_10000_plus", min: 10000, max: null, tier: 6 },
  ],
  EUR: [
    { key: "eur_lt_500", min: 0, max: 500, tier: 1 },
    { key: "eur_500_1000", min: 500, max: 1000, tier: 2 },
    { key: "eur_1000_2500", min: 1000, max: 2500, tier: 3 },
    { key: "eur_2500_5000", min: 2500, max: 5000, tier: 4 },
    { key: "eur_5000_10000", min: 5000, max: 10000, tier: 5 },
    { key: "eur_10000_plus", min: 10000, max: null, tier: 6 },
  ],
  UAH: [
    { key: "uah_lt_20000", min: 0, max: 20000, tier: 1 },
    { key: "uah_20000_40000", min: 20000, max: 40000, tier: 2 },
    { key: "uah_40000_100000", min: 40000, max: 100000, tier: 3 },
    { key: "uah_100000_200000", min: 100000, max: 200000, tier: 4 },
    { key: "uah_200000_400000", min: 200000, max: 400000, tier: 5 },
    { key: "uah_400000_plus", min: 400000, max: null, tier: 6 },
  ],
};
/** Budget answers that are not a range. */
export const BUDGET_SPECIAL = ["undecided", "estimate", "custom"] as const;

export function findBudgetRange(key: string | null | undefined): (BudgetRange & { currency: Currency }) | null {
  if (!key) return null;
  for (const currency of CURRENCIES) {
    const r = BUDGET_RANGES[currency].find((x) => x.key === key);
    if (r) return { ...r, currency };
  }
  return null;
}

/** Anonymous band for analytics: never the amount, only a coarse bucket. */
export function budgetBand(key: string | null | undefined): "undecided" | "estimate" | "custom" | "lt_1k" | "1k_5k" | "5k_plus" {
  if (key === "estimate" || key === "custom") return key;
  const r = findBudgetRange(key);
  if (!r) return "undecided";
  return r.tier <= 2 ? "lt_1k" : r.tier <= 4 ? "1k_5k" : "5k_plus";
}

/** Limits shared by the form, the server and the database (see the migration). */
export const LIMITS = {
  short: 200,
  name: 120,
  long: 4000,
  additional: 6000,
  note: 2000,
  url: 500,
  competitors: 10,
  references: 10,
  links: 15,
} as const;

/** Bump when the questions change; stored with each request. */
export const FORM_VERSION = 1;
/** Date of the privacy notice edition shown next to the consent checkbox. */
export const PRIVACY_POLICY_VERSION = "2026-10-01";
