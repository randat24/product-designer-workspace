"use client";

import { ArrowLeft, ArrowRight, Check, Clock, Send } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { submitProjectRequest, type SubmitResult } from "@/domains/requests/actions";
import {
  BUDGET_RANGES, BUDGET_SPECIAL, CHANNELS, CURRENCIES, DEADLINE_REASONS, EXISTING_LINK_KINDS, GOALS, LIMITS, MARKETS,
  MATERIAL_LINK_KINDS, MATERIALS, PROJECT_TYPES, SCOPE, START_OPTIONS, budgetBand, type Currency,
} from "@/domains/requests/config";
import { budgetLabel, label, labels } from "@/domains/requests/labels";
import { STEP_ORDER, STEPS, type StepId } from "@/domains/requests/schema";
import { cn } from "@/shared/lib/cn";
import { track } from "../analytics/track";
import type { Locale } from "../content";
import { INTAKE } from "./content";
import { clearDraft, readDone, readDraft, writeDone, writeDraft, type DoneState } from "./draft";
import { AddButton, Checkbox, ChoiceGroup, ItemCard, Select, TextArea, TextField } from "./fields";
import { Done } from "./done";
import { Turnstile } from "./turnstile";

type Link_ = { kind: string; url: string };
export type FormState = {
  project: { types: string[]; type_other: string; name: string; name_unknown: boolean };
  existing: { has?: boolean; url: string; description: string; works_well: string; dislikes: string; must_change: string; links: Link_[] };
  about: { summary: string; what_it_does: string; problem: string; why_now: string; goals: string[]; goal_other: string };
  audience: { audience: string; primary_users: string; geography: string; market?: string; demographics: string; pain_points: string };
  competitors: {
    knows_competitors?: boolean;
    competitors: { name: string; url: string; likes: string; dislikes: string; why: string }[];
    references: { url: string; note: string }[];
  };
  scope: { items: string[]; needs_advice: boolean };
  materials: { items: string[]; links: Link_[] };
  budget: {
    range: string; currency: Currency; min: string; max: string; note: string; start: string;
    has_deadline?: boolean; deadline_date: string; deadline_reason: string;
  };
  contact: {
    name: string; email: string; company: string; role: string; phone: string; telegram: string; website: string;
    preferred_channel: string; preferred_channel_note: string; additional_info: string;
  };
};

const EMPTY_CONTACT: FormState["contact"] = {
  name: "", email: "", company: "", role: "", phone: "", telegram: "", website: "", preferred_channel: "email",
  preferred_channel_note: "", additional_info: "",
};
const empty = (locale: Locale): FormState => ({
  project: { types: [], type_other: "", name: "", name_unknown: false },
  existing: { url: "", description: "", works_well: "", dislikes: "", must_change: "", links: [] },
  about: { summary: "", what_it_does: "", problem: "", why_now: "", goals: [], goal_other: "" },
  audience: { audience: "", primary_users: "", geography: "", demographics: "", pain_points: "" },
  competitors: { competitors: [], references: [] },
  scope: { items: [], needs_advice: false },
  materials: { items: [], links: [] },
  budget: {
    range: "", currency: locale === "uk" ? "UAH" : "USD", min: "", max: "", note: "", start: "",
    deadline_date: "", deadline_reason: "",
  },
  contact: EMPTY_CONTACT,
});

type Errors = Record<string, string>;
const TOTAL = STEP_ORDER.length;
const REVIEW = TOTAL; // the step index after the questions

/** Validate one step with the shared schema; returns path → error code. */
function validate(id: StepId, data: FormState): Errors {
  const value = id === "budget"
    ? { ...data.budget, has_deadline: data.budget.has_deadline ?? false }
    : id === "competitors" ? { ...data.competitors, knows_competitors: data.competitors.knows_competitors ?? false }
    : data[id];
  const r = STEPS[id].safeParse(value);
  if (r.success) return {};
  const out: Errors = {};
  for (const issue of r.error.issues) {
    const path = issue.path.join(".") || "_";
    out[path] ??= issue.message;
  }
  return out;
}

const fieldId = (step: StepId, path: string) => `q-${step}-${path.replace(/\./g, "-")}`;

export function IntakeWizard({ locale, turnstileSiteKey, privacyHref }: { locale: Locale; turnstileSiteKey?: string; privacyHref: string }) {
  const t = INTAKE[locale];
  const L = locale;
  const [data, setData] = useState<FormState>(() => empty(locale));
  const [step, setStep] = useState<number | null>(null); // null = intro
  const [errors, setErrors] = useState<Errors>({});
  const [backToReview, setBackToReview] = useState(false);
  const [draftFound, setDraftFound] = useState(false);
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState<Exclude<SubmitResult, { ok: true }>["error"] | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [done, setDone] = useState<DoneState | null>(null);
  const meta = useRef({ idempotencyKey: "", startedAt: 0 });
  const honeypot = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const top = useRef<HTMLDivElement>(null);
  const summary = useRef<HTMLDivElement>(null);
  const moved = useRef(false);

  // A sent request survives a reload of this tab; an unfinished draft is offered on the intro.
  useEffect(() => {
    const d = readDone();
    if (d) return setDone(d);
    if (readDraft<FormState>()) setDraftFound(true);
  }, []);

  // Autosave (without contact details) while the form is open.
  useEffect(() => {
    if (step === null || done) return;
    const h = setTimeout(() => {
      writeDraft<FormState>({
        step, data: { ...data, contact: EMPTY_CONTACT },
        idempotencyKey: meta.current.idempotencyKey, startedAt: meta.current.startedAt,
      });
    }, 400);
    return () => clearTimeout(h);
  }, [data, step, done]);

  // Focus the step heading after a move, so screen readers and keyboards start at the new question.
  useEffect(() => {
    if (!moved.current) return;
    top.current?.scrollIntoView({ block: "start" });
    heading.current?.focus({ preventScroll: true });
  }, [step]);

  const set = useCallback(<K extends keyof FormState>(k: K, patch: Partial<FormState[K]>) => {
    setData((d) => ({ ...d, [k]: { ...d[k], ...patch } }));
  }, []);

  const start = (resume: boolean) => {
    const draft = resume ? readDraft<FormState>() : null;
    if (draft) {
      setData({ ...empty(locale), ...draft.data, contact: EMPTY_CONTACT });
      meta.current = { idempotencyKey: draft.idempotencyKey, startedAt: draft.startedAt };
      setStep(Math.min(draft.step, REVIEW));
    } else {
      clearDraft();
      setData(empty(locale));
      meta.current = { idempotencyKey: crypto.randomUUID(), startedAt: Date.now() };
      setStep(0);
    }
    track("project_request_started");
    moved.current = true;
  };

  const go = (n: number) => {
    setErrors({});
    setFailure(null);
    moved.current = true;
    setStep(n);
    if (n === REVIEW) track("project_request_reviewed");
  };

  const next = () => {
    if (step === null || step >= REVIEW) return;
    const id = STEP_ORDER[step]!;
    const e = validate(id, data);
    if (Object.keys(e).length) {
      setErrors(e);
      requestAnimationFrame(() => summary.current?.focus());
      return;
    }
    track("project_request_step_completed", { step: step + 1, step_id: id });
    if (backToReview) {
      setBackToReview(false);
      return go(REVIEW);
    }
    go(step + 1);
  };

  const edit = (id: StepId) => {
    setBackToReview(true);
    go(STEP_ORDER.indexOf(id));
  };

  const submit = async () => {
    if (!consent) {
      setConsentError(true);
      document.getElementById("q-consent")?.focus();
      return;
    }
    // Every step once more: a resumed draft may predate a fix.
    for (const [i, id] of STEP_ORDER.entries()) {
      const e = validate(id, data);
      if (Object.keys(e).length) {
        setBackToReview(true);
        go(i);
        setErrors(e);
        return;
      }
    }
    setSubmitting(true);
    setFailure(null);
    const input = {
      locale,
      ...data,
      existing: data.existing,
      competitors: { ...data.competitors, knows_competitors: data.competitors.knows_competitors ?? false },
      budget: { ...data.budget, has_deadline: data.budget.has_deadline ?? false },
      consent: true,
    };
    let res: SubmitResult;
    try {
      res = await submitProjectRequest(input, {
        idempotencyKey: meta.current.idempotencyKey,
        startedAt: meta.current.startedAt,
        honeypot: honeypot.current?.value,
        turnstileToken: turnstileToken ?? undefined,
      });
    } catch {
      res = { ok: false, error: "server" };
    }
    setSubmitting(false);
    if (!res.ok) {
      setFailure(res.error);
      track("project_request_failed", { reason: res.error });
      return;
    }
    const d: DoneState = { code: res.code, token: res.token, submittedAt: res.submittedAt, projectName: res.projectName, duplicate: res.duplicate };
    clearDraft();
    writeDone(d);
    setDone(d);
    track("project_request_submitted", {
      project_types_count: data.project.types.length,
      has_existing: Boolean(data.existing.has),
      budget_band: budgetBand(data.budget.range),
    });
    window.scrollTo({ top: 0 });
  };

  const restartAfterDone = () => {
    writeDone(null);
    setDone(null);
    setDraftFound(false);
    setStep(null);
    setConsent(false);
  };

  if (done) return <Done locale={locale} done={done} onNew={restartAfterDone} />;

  // ------------------------------------------------------------------ intro
  if (step === null) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex max-w-[680px] flex-col gap-4">
          <p className="font-display text-[13px] font-semibold uppercase tracking-[0.12em] text-fg-secondary">{t.intro.eyebrow}</p>
          <h1 className="font-display text-[clamp(38px,6vw,64px)] font-bold uppercase leading-[1.1]">{t.intro.title}</h1>
          <p className="text-[clamp(17px,2vw,19px)] leading-[1.55] text-fg-secondary">{t.intro.lead}</p>
        </div>
        <ul className="flex max-w-[680px] flex-col gap-2.5">
          {t.intro.points.map((p) => (
            <li key={p} className="flex gap-3 text-[16px] leading-snug">
              <Check aria-hidden className="mt-0.5 size-5 shrink-0 text-success" />
              {p}
            </li>
          ))}
        </ul>
        {draftFound ? (
          <section aria-labelledby="draft-h" className="flex max-w-[680px] flex-col gap-4 rounded-[14px] border-[1.5px] border-fg bg-surface p-5 sm:p-6">
            <h2 id="draft-h" className="font-display text-[22px] font-bold uppercase leading-[1.1]">{t.draft.title}</h2>
            <p className="text-[15px] text-fg-secondary">{t.draft.text}</p>
            <div className="flex flex-wrap gap-3">
              <PrimaryButton onClick={() => start(true)} icon={<ArrowRight aria-hidden className="size-4" />}>{t.draft.resume}</PrimaryButton>
              <SecondaryButton onClick={() => start(false)}>{t.draft.restart}</SecondaryButton>
            </div>
          </section>
        ) : (
          <div className="flex flex-wrap items-center gap-4">
            <PrimaryButton onClick={() => start(false)} icon={<ArrowRight aria-hidden className="size-4" />}>{t.intro.start}</PrimaryButton>
            <span className="inline-flex items-center gap-2 text-[15px] text-fg-secondary">
              <Clock aria-hidden className="size-4" />
              {t.intro.time}
            </span>
          </div>
        )}
      </div>
    );
  }

  const id = step < REVIEW ? STEP_ORDER[step]! : null;
  const err = (path: string) => (errors[path] ? (t.errors[errors[path]!] ?? t.errors.generic) : undefined);
  const f = (path: string) => fieldId(id ?? "project", path);
  const opt = t.optional;
  const s = t.steps;

  // ------------------------------------------------------------------ steps
  const body = (() => {
    switch (id) {
      case "project": {
        const d = data.project;
        return (
          <>
            <ChoiceGroup id={f("types")} legend={s.project.types.label} error={err("types")}
              options={PROJECT_TYPES.map((k) => ({ value: k, label: label("types", k, L) }))}
              value={d.types} onChange={(v) => set("project", { types: v as string[] })} />
            {d.types.includes("other") && (
              <TextField id={f("type_other")} {...s.project.typeOther} error={err("type_other")} maxLength={LIMITS.short}
                value={d.type_other} onChange={(v) => set("project", { type_other: v })} />
            )}
            <div className="flex flex-col gap-3">
              {!d.name_unknown && (
                <TextField id={f("name")} {...s.project.name} error={err("name")} maxLength={LIMITS.name}
                  value={d.name} onChange={(v) => set("project", { name: v })} />
              )}
              <Checkbox id={f("name_unknown")} label={s.project.nameUnknown} checked={d.name_unknown}
                onChange={(v) => set("project", { name_unknown: v })} />
            </div>
          </>
        );
      }
      case "existing": {
        const d = data.existing;
        return (
          <>
            <ChoiceGroup id={f("has")} legend={s.existing.has.label} multiple={false} columns error={err("has")}
              options={[{ value: "yes", label: s.existing.yes }, { value: "no", label: s.existing.no }]}
              value={d.has === undefined ? undefined : d.has ? "yes" : "no"}
              onChange={(v) => set("existing", { has: v === "yes" })} />
            {d.has && (
              <>
                <TextField id={f("url")} {...s.existing.url} optional={opt} error={err("url")} type="url" inputMode="url"
                  value={d.url} onChange={(v) => set("existing", { url: v })} />
                <TextArea id={f("description")} {...s.existing.description} optional={opt} error={err("description")} maxLength={LIMITS.long}
                  value={d.description} onChange={(v) => set("existing", { description: v })} />
                <TextArea id={f("works_well")} {...s.existing.worksWell} optional={opt} error={err("works_well")} rows={3} maxLength={LIMITS.long}
                  value={d.works_well} onChange={(v) => set("existing", { works_well: v })} />
                <TextArea id={f("dislikes")} {...s.existing.dislikes} optional={opt} error={err("dislikes")} rows={3} maxLength={LIMITS.long}
                  value={d.dislikes} onChange={(v) => set("existing", { dislikes: v })} />
                <TextArea id={f("must_change")} {...s.existing.mustChange} optional={opt} error={err("must_change")} rows={3} maxLength={LIMITS.long}
                  value={d.must_change} onChange={(v) => set("existing", { must_change: v })} />
                <LinkList step="existing" title={s.existing.links.label} hint={s.existing.links.hint} addLabel={s.existing.addLink}
                  kinds={EXISTING_LINK_KINDS} links={d.links} errors={errors} locale={locale}
                  onChange={(links) => set("existing", { links })} />
                <p className="rounded-[10px] bg-subtle px-4 py-3 text-[14px] text-fg-secondary">{s.existing.noPasswords}</p>
              </>
            )}
          </>
        );
      }
      case "about": {
        const d = data.about;
        return (
          <>
            <TextArea id={f("summary")} {...s.about.summary} error={err("summary")} rows={3} maxLength={LIMITS.long}
              value={d.summary} onChange={(v) => set("about", { summary: v })} />
            <TextArea id={f("what_it_does")} {...s.about.whatItDoes} optional={opt} error={err("what_it_does")} rows={3} maxLength={LIMITS.long}
              value={d.what_it_does} onChange={(v) => set("about", { what_it_does: v })} />
            <TextArea id={f("problem")} {...s.about.problem} optional={opt} error={err("problem")} rows={3} maxLength={LIMITS.long}
              value={d.problem} onChange={(v) => set("about", { problem: v })} />
            <TextArea id={f("why_now")} {...s.about.whyNow} optional={opt} error={err("why_now")} rows={3} maxLength={LIMITS.long}
              value={d.why_now} onChange={(v) => set("about", { why_now: v })} />
            <ChoiceGroup id={f("goals")} legend={s.about.goals.label} optional={opt} error={err("goals")}
              options={GOALS.map((k) => ({ value: k, label: label("goals", k, L) }))}
              value={d.goals} onChange={(v) => set("about", { goals: v as string[] })} />
            {d.goals.includes("other") && (
              <TextField id={f("goal_other")} {...s.about.goalOther} error={err("goal_other")} maxLength={LIMITS.short}
                value={d.goal_other} onChange={(v) => set("about", { goal_other: v })} />
            )}
          </>
        );
      }
      case "audience": {
        const d = data.audience;
        return (
          <>
            <TextArea id={f("audience")} {...s.audience.audience} optional={opt} error={err("audience")} rows={3} maxLength={LIMITS.long}
              value={d.audience} onChange={(v) => set("audience", { audience: v })} />
            <TextArea id={f("primary_users")} {...s.audience.primaryUsers} optional={opt} error={err("primary_users")} rows={3} maxLength={LIMITS.long}
              value={d.primary_users} onChange={(v) => set("audience", { primary_users: v })} />
            <TextField id={f("geography")} {...s.audience.geography} optional={opt} error={err("geography")} maxLength={LIMITS.short}
              value={d.geography} onChange={(v) => set("audience", { geography: v })} />
            <ChoiceGroup id={f("market")} legend={s.audience.market.label} optional={opt} multiple={false}
              options={MARKETS.map((k) => ({ value: k, label: label("markets", k, L) }))}
              value={d.market} onChange={(v) => set("audience", { market: v as string })} />
            <TextField id={f("demographics")} {...s.audience.demographics} optional={opt} error={err("demographics")} maxLength={1000}
              value={d.demographics} onChange={(v) => set("audience", { demographics: v })} />
            <TextArea id={f("pain_points")} {...s.audience.painPoints} optional={opt} error={err("pain_points")} rows={3} maxLength={LIMITS.long}
              value={d.pain_points} onChange={(v) => set("audience", { pain_points: v })} />
          </>
        );
      }
      case "competitors": {
        const d = data.competitors;
        const c = s.competitors;
        const setC = (i: number, patch: Partial<FormState["competitors"]["competitors"][number]>) =>
          set("competitors", { competitors: d.competitors.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
        const setR = (i: number, patch: Partial<FormState["competitors"]["references"][number]>) =>
          set("competitors", { references: d.references.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
        return (
          <>
            <ChoiceGroup id={f("knows_competitors")} legend={c.knows.label} multiple={false} columns
              options={[{ value: "yes", label: c.yes }, { value: "no", label: c.no }]}
              value={d.knows_competitors === undefined ? undefined : d.knows_competitors ? "yes" : "no"}
              onChange={(v) => set("competitors", {
                knows_competitors: v === "yes",
                competitors: v === "yes" && d.competitors.length === 0 ? [{ name: "", url: "", likes: "", dislikes: "", why: "" }] : d.competitors,
              })} />
            {d.knows_competitors && (
              <div className="flex flex-col gap-4">
                {d.competitors.map((x, i) => (
                  <ItemCard key={i} title={`${c.competitor} ${i + 1}`} removeLabel={t.removeItem(i + 1)}
                    onRemove={() => set("competitors", { competitors: d.competitors.filter((_, j) => j !== i) })}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <TextField id={f(`competitors.${i}.name`)} {...c.name} error={err(`competitors.${i}.name`)} maxLength={LIMITS.name}
                        value={x.name} onChange={(v) => setC(i, { name: v })} />
                      <TextField id={f(`competitors.${i}.url`)} {...c.url} optional={opt} error={err(`competitors.${i}.url`)} type="url" inputMode="url"
                        value={x.url} onChange={(v) => setC(i, { url: v })} />
                    </div>
                    <TextArea id={f(`competitors.${i}.likes`)} {...c.likes} optional={opt} rows={2} maxLength={LIMITS.note}
                      error={err(`competitors.${i}.likes`)} value={x.likes} onChange={(v) => setC(i, { likes: v })} />
                    <TextArea id={f(`competitors.${i}.dislikes`)} {...c.dislikes} optional={opt} rows={2} maxLength={LIMITS.note}
                      error={err(`competitors.${i}.dislikes`)} value={x.dislikes} onChange={(v) => setC(i, { dislikes: v })} />
                    <TextArea id={f(`competitors.${i}.why`)} {...c.why} optional={opt} rows={2} maxLength={LIMITS.note}
                      error={err(`competitors.${i}.why`)} value={x.why} onChange={(v) => setC(i, { why: v })} />
                  </ItemCard>
                ))}
                {err("competitors") && <p className="text-[14px] font-semibold text-danger">{err("competitors")}</p>}
                <AddButton disabled={d.competitors.length >= LIMITS.competitors}
                  onClick={() => set("competitors", { competitors: [...d.competitors, { name: "", url: "", likes: "", dislikes: "", why: "" }] })}>
                  {c.add}
                </AddButton>
              </div>
            )}
            <div className="flex flex-col gap-4 border-t border-line pt-6">
              <div>
                <h3 className="text-[15px] font-semibold">{c.references.label} <span className="font-normal text-fg-secondary">({opt})</span></h3>
                <p className="mt-1 text-[14px] text-fg-secondary">{c.references.hint}</p>
              </div>
              {d.references.map((x, i) => (
                <ItemCard key={i} title={`${i + 1}`} removeLabel={t.removeItem(i + 1)}
                  onRemove={() => set("competitors", { references: d.references.filter((_, j) => j !== i) })}>
                  <TextField id={f(`references.${i}.url`)} {...c.referenceUrl} error={err(`references.${i}.url`)} type="url" inputMode="url"
                    value={x.url} onChange={(v) => setR(i, { url: v })} />
                  <TextArea id={f(`references.${i}.note`)} {...c.referenceNote} optional={opt} rows={2} maxLength={LIMITS.note}
                    error={err(`references.${i}.note`)} value={x.note} onChange={(v) => setR(i, { note: v })} />
                </ItemCard>
              ))}
              <AddButton disabled={d.references.length >= LIMITS.references}
                onClick={() => set("competitors", { references: [...d.references, { url: "", note: "" }] })}>
                {c.addReference}
              </AddButton>
            </div>
          </>
        );
      }
      case "scope": {
        const d = data.scope;
        return (
          <>
            <ChoiceGroup id={f("items")} legend={s.scope.items.label} error={err("items")}
              options={SCOPE.map((k) => ({ value: k, label: label("scope", k, L) }))}
              value={d.items} onChange={(v) => set("scope", { items: v as string[] })} />
            <Checkbox id={f("needs_advice")} label={<strong>{s.scope.advice}</strong>} hint={s.scope.adviceHint}
              checked={d.needs_advice} onChange={(v) => set("scope", { needs_advice: v })} />
          </>
        );
      }
      case "materials": {
        const d = data.materials;
        return (
          <>
            <ChoiceGroup id={f("items")} legend={s.materials.items.label} optional={opt}
              options={MATERIALS.map((k) => ({ value: k, label: label("materials", k, L) }))}
              value={d.items} onChange={(v) => set("materials", { items: v as string[] })} />
            <LinkList step="materials" title={s.materials.links.label} hint={s.materials.links.hint} addLabel={s.materials.addLink}
              kinds={MATERIAL_LINK_KINDS} links={d.links} errors={errors} locale={locale}
              onChange={(links) => set("materials", { links })} />
            <p className="rounded-[10px] bg-subtle px-4 py-3 text-[14px] text-fg-secondary">{s.materials.filesNote}</p>
          </>
        );
      }
      case "budget": {
        const d = data.budget;
        const b = s.budget;
        const ranges = BUDGET_RANGES[d.currency];
        return (
          <>
            <Select id={f("currency")} label={b.currency.label} className="max-w-[200px]"
              options={CURRENCIES.map((c) => ({ value: c, label: c }))} value={d.currency}
              onChange={(v) => set("budget", { currency: v as Currency, range: (BUDGET_SPECIAL as readonly string[]).includes(d.range) ? d.range : "" })} />
            <ChoiceGroup id={f("range")} legend={b.range.label} multiple={false} columns error={err("range")}
              options={[
                { value: "undecided", label: label("budgetSpecial", "undecided", L) },
                ...ranges.map((r) => ({ value: r.key, label: budgetLabel({ min: r.min, max: r.max, currency: d.currency }, L) })),
                { value: "estimate", label: label("budgetSpecial", "estimate", L) },
                { value: "custom", label: label("budgetSpecial", "custom", L) },
              ]}
              value={d.range} onChange={(v) => set("budget", { range: v as string })} />
            {d.range === "custom" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField id={f("min")} label={`${b.min.label}, ${d.currency}`} error={err("min")} inputMode="numeric"
                  value={d.min} onChange={(v) => set("budget", { min: v })} />
                <TextField id={f("max")} label={`${b.max.label}, ${d.currency}`} optional={opt} error={err("max")} inputMode="numeric"
                  value={d.max} onChange={(v) => set("budget", { max: v })} />
              </div>
            )}
            <TextField id={f("note")} {...b.note} optional={opt} error={err("note")} maxLength={1000}
              value={d.note} onChange={(v) => set("budget", { note: v })} />
            <ChoiceGroup id={f("start")} legend={b.start.label} multiple={false} columns error={err("start")}
              options={START_OPTIONS.map((k) => ({ value: k, label: label("start", k, L) }))}
              value={d.start} onChange={(v) => set("budget", { start: v as string })} />
            <ChoiceGroup id={f("has_deadline")} legend={b.deadline.label} multiple={false}
              options={[{ value: "yes", label: b.yes }, { value: "no", label: b.no }]}
              value={d.has_deadline === undefined ? undefined : d.has_deadline ? "yes" : "no"}
              onChange={(v) => set("budget", { has_deadline: v === "yes" })} />
            {d.has_deadline && (
              <div className="flex flex-col gap-4 rounded-[14px] border-[1.5px] border-line bg-surface p-4 sm:p-5">
                <TextField id={f("deadline_date")} {...b.deadlineDate} error={err("deadline_date")} type="date" className="max-w-[240px]"
                  value={d.deadline_date} onChange={(v) => set("budget", { deadline_date: v })} />
                <TextField id={f("deadline_reason")} {...b.deadlineReason} optional={opt} error={err("deadline_reason")} maxLength={1000}
                  value={d.deadline_reason} onChange={(v) => set("budget", { deadline_reason: v })} />
                <div className="flex flex-wrap gap-2">
                  {DEADLINE_REASONS.map((k) => (
                    <button key={k} type="button" onClick={() => set("budget", { deadline_reason: label("deadlineReasons", k, L) })}
                      className="rounded-full border border-line px-3 py-1 text-[13px] font-semibold hover:border-fg">
                      {label("deadlineReasons", k, L)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        );
      }
      case "contact": {
        const d = data.contact;
        const c = s.contact;
        return (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField id={f("name")} {...c.name} error={err("name")} autoComplete="name" maxLength={LIMITS.name}
                value={d.name} onChange={(v) => set("contact", { name: v })} />
              <TextField id={f("email")} {...c.email} error={err("email")} type="email" inputMode="email" autoComplete="email" maxLength={254}
                value={d.email} onChange={(v) => set("contact", { email: v })} />
              <TextField id={f("company")} {...c.company} optional={opt} error={err("company")} autoComplete="organization" maxLength={160}
                value={d.company} onChange={(v) => set("contact", { company: v })} />
              <TextField id={f("role")} {...c.role} optional={opt} error={err("role")} autoComplete="organization-title" maxLength={LIMITS.name}
                value={d.role} onChange={(v) => set("contact", { role: v })} />
            </div>
            <ChoiceGroup id={f("preferred_channel")} legend={c.channel.label} multiple={false}
              options={CHANNELS.map((k) => ({ value: k, label: label("channels", k, L) }))}
              value={d.preferred_channel} onChange={(v) => set("contact", { preferred_channel: v as string })} />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField id={f("telegram")} {...c.telegram} optional={d.preferred_channel === "telegram" ? undefined : opt}
                error={err("telegram")} maxLength={64} value={d.telegram} onChange={(v) => set("contact", { telegram: v })} />
              <TextField id={f("phone")} {...c.phone} optional={d.preferred_channel === "phone" ? undefined : opt} error={err("phone")}
                type="tel" inputMode="tel" autoComplete="tel" maxLength={40} value={d.phone} onChange={(v) => set("contact", { phone: v })} />
            </div>
            {d.preferred_channel === "other" && (
              <TextField id={f("preferred_channel_note")} {...c.channelNote} error={err("preferred_channel_note")} maxLength={LIMITS.short}
                value={d.preferred_channel_note} onChange={(v) => set("contact", { preferred_channel_note: v })} />
            )}
            <TextField id={f("website")} {...c.website} optional={opt} error={err("website")} type="url" inputMode="url" autoComplete="url"
              value={d.website} onChange={(v) => set("contact", { website: v })} />
            <TextArea id={f("additional_info")} {...c.additional} optional={opt} error={err("additional_info")} rows={6} maxLength={LIMITS.additional}
              value={d.additional_info} onChange={(v) => set("contact", { additional_info: v })} />
          </>
        );
      }
      default:
        return null;
    }
  })();

  const title = id ? s[id].title : t.review.title;
  const lead = id ? s[id].lead : t.review.lead;
  const errorList = Object.keys(errors);

  return (
    <div ref={top} className="flex scroll-mt-24 flex-col gap-8">
      <Progress n={Math.min(step + 1, TOTAL)} total={TOTAL} label={step < REVIEW ? t.progress(step + 1, TOTAL) : t.review.title} review={step === REVIEW} />
      <div className="flex flex-col gap-3">
        <h1 ref={heading} tabIndex={-1} className="scroll-mt-28 font-display text-[clamp(30px,5vw,48px)] font-bold uppercase leading-[1.1] outline-none">
          {title}
        </h1>
        <p className="max-w-[640px] text-[17px] leading-[1.55] text-fg-secondary">{lead}</p>
      </div>

      {errorList.length > 0 && (
        <div ref={summary} tabIndex={-1} role="alert" className="rounded-[14px] border-[1.5px] border-danger bg-surface p-4 outline-none">
          <p className="font-semibold">{t.errors.summary}</p>
          <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-[15px]">
            {errorList.map((p) => (
              <li key={p}>
                <a href={`#${fieldId(id ?? "project", p)}`} className="text-danger underline underline-offset-4"
                  onClick={(e) => { e.preventDefault(); document.getElementById(fieldId(id ?? "project", p))?.focus(); }}>
                  {t.errors[errors[p]!] ?? t.errors.generic}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form noValidate onSubmit={(e) => { e.preventDefault(); if (step < REVIEW) next(); else void submit(); }} className="flex flex-col gap-7">
        {/* Honeypot: hidden from people and assistive tech; bots fill every field. */}
        <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label htmlFor="q-company-fax">Fax</label>
          <input ref={honeypot} id="q-company-fax" name="company_fax" tabIndex={-1} autoComplete="off" />
        </div>

        {step < REVIEW ? body : (
          <Review locale={locale} data={data} onEdit={edit} />
        )}

        {step === REVIEW && (
          <div className="flex flex-col gap-5 border-t-[1.5px] border-fg pt-6">
            <Checkbox id="q-consent" checked={consent}
              onChange={(v) => { setConsent(v); if (v) setConsentError(false); }}
              error={consentError ? t.errors.consent : undefined}
              label={<>{t.review.consent} <Link href={privacyHref} target="_blank" className="font-semibold underline underline-offset-4">{t.review.consentLink}</Link></>} />
            {turnstileSiteKey && <Turnstile siteKey={turnstileSiteKey} locale={locale} onToken={setTurnstileToken} />}
            {failure && (
              <p role="alert" className="rounded-[10px] border-[1.5px] border-danger bg-surface px-4 py-3 text-[15px] font-semibold text-danger">
                {t.failed[failure]}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 border-t border-line pt-6">
          {step > 0 && !backToReview && (
            <SecondaryButton onClick={() => go(step - 1)} icon={<ArrowLeft aria-hidden className="size-4" />}>{t.nav.back}</SecondaryButton>
          )}
          {step < REVIEW ? (
            <PrimaryButton type="submit" icon={<ArrowRight aria-hidden className="size-4" />}>
              {backToReview ? t.nav.toReview : step === REVIEW - 1 ? t.nav.review : t.nav.next}
            </PrimaryButton>
          ) : (
            <PrimaryButton type="submit" busy={submitting} icon={<Send aria-hidden className="size-4" />}>
              {submitting ? t.review.submitting : t.review.submit}
            </PrimaryButton>
          )}
          <span className="ml-auto text-[13px] text-fg-secondary" aria-live="polite">{t.draft.saved}</span>
        </div>
      </form>
    </div>
  );
}

function Progress({ n, total, label: text, review }: { n: number; total: number; label: string; review: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[14px] font-semibold text-fg-secondary" aria-hidden>{text}</p>
      <div role="progressbar" aria-label={text} aria-valuemin={0} aria-valuemax={total} aria-valuenow={review ? total : n - 1}
        className="h-1.5 w-full overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-fg transition-[width] duration-300" style={{ width: `${((review ? total : n - 1) / total) * 100}%` }} />
      </div>
    </div>
  );
}

function LinkList({ step, title, hint, addLabel, kinds, links, errors, locale, onChange }: {
  step: StepId; title: string; hint?: string; addLabel: string; kinds: readonly string[]; links: Link_[];
  errors: Errors; locale: Locale; onChange: (links: Link_[]) => void;
}) {
  const t = INTAKE[locale];
  const e = (p: string) => (errors[p] ? (t.errors[errors[p]!] ?? t.errors.generic) : undefined);
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h3 className="text-[15px] font-semibold">{title} <span className="font-normal text-fg-secondary">({t.optional})</span></h3>
        {hint && <p className="mt-1 text-[14px] text-fg-secondary">{hint}</p>}
      </div>
      {links.map((l, i) => (
        <div key={i} className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 sm:grid-cols-[180px_minmax(0,1fr)_auto]">
          <Select id={fieldId(step, `links.${i}.kind`)} label={t.linkKind} className="col-span-2 sm:col-span-1"
            options={kinds.map((k) => ({ value: k, label: label("linkKinds", k, locale) }))}
            value={l.kind} onChange={(v) => onChange(links.map((x, j) => (j === i ? { ...x, kind: v } : x)))} />
          <TextField id={fieldId(step, `links.${i}.url`)} label={t.linkUrl} type="url" inputMode="url" error={e(`links.${i}.url`)}
            value={l.url} onChange={(v) => onChange(links.map((x, j) => (j === i ? { ...x, url: v } : x)))} />
          <button type="button" onClick={() => onChange(links.filter((_, j) => j !== i))} aria-label={t.removeItem(i + 1)}
            className={cn("hit mb-1.5 grid size-9 place-items-center rounded-[8px] text-fg-secondary hover:bg-subtle hover:text-fg", e(`links.${i}.url`) && "mb-8")}>
            ×
          </button>
        </div>
      ))}
      <AddButton disabled={links.length >= LIMITS.links} onClick={() => onChange([...links, { kind: kinds[0]!, url: "" }])}>{addLabel}</AddButton>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------- review

function Review({ locale, data, onEdit }: { locale: Locale; data: FormState; onEdit: (id: StepId) => void }) {
  const t = INTAKE[locale];
  const r = t.review.rows;
  const L = locale;
  const list = (v: string[]) => v.filter(Boolean).join(", ");
  const d = data;
  const budget = d.budget.range === "custom"
    ? budgetLabel({ range: "custom", min: d.budget.min ? Number(d.budget.min.replace(/[\s,]/g, "")) : null, max: d.budget.max ? Number(d.budget.max.replace(/[\s,]/g, "")) : null, currency: d.budget.currency }, L)
    : (() => {
        const range = BUDGET_RANGES[d.budget.currency].find((x) => x.key === d.budget.range);
        return range ? budgetLabel({ min: range.min, max: range.max, currency: d.budget.currency }, L) : label("budgetSpecial", d.budget.range, L);
      })();
  const sections: { key: keyof typeof t.review.sections; step: StepId; rows: [string, React.ReactNode][] }[] = [
    { key: "project", step: "project", rows: [
      [r.projectName, d.project.name_unknown ? t.done.noName : d.project.name],
      [r.types, list([...labels("types", d.project.types.filter((x) => x !== "other"), L), d.project.types.includes("other") ? d.project.type_other : ""])],
    ] },
    { key: "existing", step: "existing", rows: d.existing.has ? [
      [r.url, d.existing.url], [r.description, d.existing.description], [r.worksWell, d.existing.works_well],
      [r.dislikes, d.existing.dislikes], [r.mustChange, d.existing.must_change],
      [r.links, d.existing.links.map((l) => `${label("linkKinds", l.kind, L)}: ${l.url}`).join("\n")],
    ] : [[r.description, t.review.noExisting]] },
    { key: "goals", step: "about", rows: [
      [r.summary, d.about.summary], [r.whatItDoes, d.about.what_it_does], [r.problem, d.about.problem], [r.whyNow, d.about.why_now],
      [r.goals, list([...labels("goals", d.about.goals.filter((x) => x !== "other"), L), d.about.goals.includes("other") ? d.about.goal_other : ""])],
    ] },
    { key: "audience", step: "audience", rows: [
      [r.audience, d.audience.audience], [r.primaryUsers, d.audience.primary_users], [r.geography, d.audience.geography],
      [r.market, label("markets", d.audience.market, L)], [r.demographics, d.audience.demographics], [r.painPoints, d.audience.pain_points],
    ] },
    { key: "competitors", step: "competitors", rows: d.competitors.knows_competitors && d.competitors.competitors.length
      ? d.competitors.competitors.map((c) => [c.name, [c.url, c.likes && `+ ${c.likes}`, c.dislikes && `− ${c.dislikes}`, c.why].filter(Boolean).join("\n") || t.review.empty])
      : [[r.items, t.review.noCompetitors]] },
    { key: "references", step: "competitors", rows: d.competitors.references.map((x, i) => [`${i + 1}`, [x.url, x.note].filter(Boolean).join("\n")]) },
    { key: "scope", step: "scope", rows: [
      [r.items, list(labels("scope", d.scope.items, L))], ...(d.scope.needs_advice ? [["", t.review.advice] as [string, string]] : []),
    ] },
    { key: "materials", step: "materials", rows: [
      [r.items, list(labels("materials", d.materials.items, L))],
      [r.links, d.materials.links.map((l) => `${label("linkKinds", l.kind, L)}: ${l.url}`).join("\n")],
    ] },
    { key: "budget", step: "budget", rows: [[r.range, budget], [r.note, d.budget.note]] },
    { key: "timeline", step: "budget", rows: [
      [r.start, label("start", d.budget.start, L)],
      [r.deadline, d.budget.has_deadline ? d.budget.deadline_date : t.review.deadlineNone],
      ...(d.budget.has_deadline ? [[r.reason, d.budget.deadline_reason] as [string, string]] : []),
    ] },
    { key: "client", step: "contact", rows: [
      [r.name, d.contact.name], [r.email, d.contact.email], [r.company, d.contact.company], [r.role, d.contact.role],
      [r.phone, d.contact.phone], [r.telegram, d.contact.telegram], [r.website, d.contact.website],
      [r.channel, d.contact.preferred_channel === "other" ? d.contact.preferred_channel_note : label("channels", d.contact.preferred_channel, L)],
    ] },
    { key: "additional", step: "contact", rows: [["", d.contact.additional_info]] },
  ];
  return (
    <div className="flex flex-col gap-4">
      {sections.map((sec) => {
        const rows = sec.rows.filter(([, v]) => v);
        return (
          <section key={sec.key} aria-labelledby={`rv-${sec.key}`} className="rounded-[14px] border-[1.5px] border-line bg-surface p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 id={`rv-${sec.key}`} className="font-display text-[19px] font-bold uppercase tracking-[0.01em]">{t.review.sections[sec.key]}</h2>
              <button type="button" onClick={() => onEdit(sec.step)} aria-label={`${t.review.edit}: ${t.review.sections[sec.key]}`}
                className="hit rounded-[8px] px-2.5 py-1 text-[14px] font-semibold underline underline-offset-4 hover:bg-subtle">
                {t.review.edit}
              </button>
            </div>
            {rows.length === 0 ? <p className="text-fg-secondary">{t.review.empty}</p> : (
              <dl className="grid gap-x-6 gap-y-2.5 sm:grid-cols-[180px_1fr]">
                {rows.map(([k, v], i) => (
                  <div key={i} className="contents">
                    <dt className="text-[14px] font-semibold text-fg-secondary">{k}</dt>
                    <dd className="whitespace-pre-line break-words text-[15px] leading-[1.5]">{v}</dd>
                  </div>
                ))}
              </dl>
            )}
          </section>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------- buttons

const btn = "inline-flex h-12 items-center justify-center gap-2 rounded-[10px] border-[1.5px] px-5 text-[15px] font-semibold transition-colors duration-[120ms]";

export function PrimaryButton({ children, icon, onClick, type = "button", busy }: {
  children: React.ReactNode; icon?: React.ReactNode; onClick?: () => void; type?: "button" | "submit"; busy?: boolean;
}) {
  return (
    <button type={type} onClick={onClick} aria-busy={busy || undefined} disabled={busy}
      className={cn(btn, "border-accent bg-accent text-on-accent hover:bg-accent-hover disabled:cursor-progress disabled:opacity-80")}>
      {children}
      {icon}
    </button>
  );
}

export function SecondaryButton({ children, icon, onClick }: { children: React.ReactNode; icon?: React.ReactNode; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cn(btn, "border-fg text-fg hover:bg-subtle")}>
      {icon}
      {children}
    </button>
  );
}
