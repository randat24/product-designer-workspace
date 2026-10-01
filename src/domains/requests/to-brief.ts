// Request → initial project documentation (pure, tested). Everything here is the client's own wording,
// re-arranged into the brief's fields with workspace (ru) labels; the database keeps the original as
// client_input so the brief can mark it «зі слів клієнта» until the designer rewrites it.

import { label, labels } from "./labels";
import type { BriefSnapshot } from "./snapshot";

const join = (parts: (string | null | undefined | false)[], sep = "\n\n") => parts.filter(Boolean).join(sep) || undefined;
const line = (title: string, v: string | null | undefined) => (v ? `${title}: ${v}` : null);

export type ConversionBrief = {
  product_description?: string;
  existing_product?: string;
  target_audience?: string;
  problem?: string;
  business_requirements?: string;
  constraints?: string;
  goals?: string[];
  links?: { title: string; url: string }[];
};

export function requestToBrief(s: BriefSnapshot): ConversionBrief {
  const L = "uk" as const;
  const goals = [...labels("goals", s.about.goals.filter((g) => g !== "other"), L), ...(s.about.goal_other ? [s.about.goal_other] : [])];
  const links = [
    ...(s.existing.has && s.existing.url ? [{ title: "Поточний продукт", url: s.existing.url }] : []),
    ...s.existing.links.map((l) => ({ title: label("linkKinds", l.kind, L), url: l.url })),
    ...s.materials.links.map((l) => ({ title: `Матеріали: ${label("linkKinds", l.kind, L)}`, url: l.url })),
    ...s.references.map((r) => ({ title: r.note ? `Референс: ${r.note}`.slice(0, 200) : "Референс", url: r.url })),
  ];
  const brief: ConversionBrief = {
    product_description: join([s.about.summary, line("Що робить", s.about.what_it_does), line("Чому зараз", s.about.why_now)]),
    existing_product: s.existing.has
      ? join([s.existing.url, s.existing.description, line("Що працює", s.existing.works_well),
          line("Що не подобається", s.existing.dislikes), line("Що змінити", s.existing.must_change)])
      : undefined,
    target_audience: join([
      s.audience.audience,
      line("Основні користувачі", s.audience.primary_users),
      line("Географія", s.audience.geography),
      s.audience.market && s.audience.market !== "unknown" ? line("Ринок", label("markets", s.audience.market, L)) : null,
      line("Демографія", s.audience.demographics),
      line("Болі (зі слів клієнта)", s.audience.pain_points),
    ]),
    problem: s.about.problem ?? undefined,
    business_requirements: join([
      s.scope.items.length ? line("Очікуваний обсяг робіт", labels("scope", s.scope.items, L).join(", ")) : null,
      s.scope.needs_advice ? "Клієнт просить поради щодо обсягу робіт." : null,
      s.materials.items.length ? line("Що вже є", labels("materials", s.materials.items, L).join(", ")) : null,
    ]),
    constraints: s.additional_info ?? undefined,
    goals: goals.length ? goals.map((g) => g.slice(0, 300)) : undefined,
    links: links.length ? links.slice(0, 30) : undefined,
  };
  return Object.fromEntries(Object.entries(brief).filter(([, v]) => v !== undefined)) as ConversionBrief;
}

/** Platforms of the new project from the requested work types. */
export function requestPlatforms(types: string[]): string[] {
  const p = new Set<string>();
  for (const t of types) {
    if (t === "mobile_app") { p.add("ios"); p.add("android"); }
    if (["website", "landing_page", "web_app", "saas"].includes(t)) p.add("web");
  }
  return [...p];
}
