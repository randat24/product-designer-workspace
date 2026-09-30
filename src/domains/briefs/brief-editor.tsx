"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { FieldError, Input } from "@/shared/ui/field";
import { cn } from "@/shared/lib/cn";
import { t } from "@/shared/i18n/ru";
import { useAutosave, SaveToast } from "@/shared/ui/autosave";
import { Section, TextField } from "@/shared/ui/form-section";
import { saveBrief } from "./actions";
import type { Brief } from "./schema";

const f = t.brief.fields;
type TextKey = {
  [K in keyof Brief]: Brief[K] extends string | null ? K : never;
}[keyof Brief];

export function BriefEditor({ projectId, initial, canEdit, platforms, settingsHref }: {
  projectId: string;
  initial: Brief;
  canEdit: boolean;
  platforms: string[];
  settingsHref: string;
}) {
  const { value: brief, update, status, error } = useAutosave(initial, (b) => saveBrief(projectId, b), canEdit);

  const text = (key: TextKey, label: string, hint?: string) => (
    <TextField id={key} label={label} hint={hint} value={brief[key] ?? ""} readOnly={!canEdit}
      onChange={(v) => update({ [key]: v } as Partial<Brief>)} />
  );

  return (
    <div className="flex flex-col gap-8">
      <SaveToast id="brief-status" status={status} error={error?.message} readOnly={!canEdit} />

      <Section id="product" title={t.brief.sections.product}>
        {text("product_description", f.product_description, f.product_descriptionHint)}
        {text("existing_product", f.existing_product, f.existing_productHint)}
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-fg-secondary">{f.platforms}</span>
          <p className="flex flex-wrap items-baseline gap-x-3">
            <span>{platforms.length ? platforms.join(", ") : <span className="text-fg-secondary">{f.platformsNone}</span>}</span>
            <Link href={settingsHref} className="text-[13px] font-semibold underline underline-offset-2">{f.platformsEdit}</Link>
          </p>
        </div>
      </Section>

      <Section id="business" title={t.brief.sections.business}>
        {text("business", f.business, f.businessHint)}
        {text("business_requirements", f.business_requirements)}
      </Section>

      <Section id="audience" title={t.brief.sections.audience}>
        {text("target_audience", f.target_audience, f.target_audienceHint)}
        {text("problem", f.problem, f.problemHint)}
      </Section>

      <Section id="goals" title={t.brief.sections.goals}>
        <ListField id="goals-list" label={f.goals} addLabel={f.addGoal} readOnly={!canEdit}
          rows={brief.goals} empty="" onChange={(goals) => update({ goals })}
          render={(goal, set, i) => (
            <Input aria-label={`${f.goals} ${i + 1}`} value={goal} readOnly={!canEdit} maxLength={300}
              placeholder={f.goalPlaceholder} onChange={(e) => set(e.target.value)} />
          )} />
        <ListField id="kpis-list" label={f.kpis} addLabel={f.addKpi} readOnly={!canEdit}
          columns={[f.kpiName, f.kpiTarget, f.kpiCurrent]} gridClass="sm:grid-cols-[2fr_1fr_1fr]"
          rows={brief.kpis} empty={{ name: "", target: "", current: "" }} onChange={(kpis) => update({ kpis })}
          render={(k, set, i) => (
            <>
              <Input aria-label={`${f.kpiName} ${i + 1}`} value={k.name} readOnly={!canEdit} maxLength={200} onChange={(e) => set({ ...k, name: e.target.value })} />
              <Input aria-label={`${f.kpiTarget} ${i + 1}`} value={k.target} readOnly={!canEdit} maxLength={200} onChange={(e) => set({ ...k, target: e.target.value })} />
              <Input aria-label={`${f.kpiCurrent} ${i + 1}`} value={k.current} readOnly={!canEdit} maxLength={200} onChange={(e) => set({ ...k, current: e.target.value })} />
            </>
          )} />
      </Section>

      <Section id="constraints" title={t.brief.sections.constraints}>
        {text("constraints", f.constraints, f.constraintsHint)}
        {text("technical_constraints", f.technical_constraints)}
      </Section>

      <Section id="timeline" title={t.brief.sections.timeline}>
        <div className="grid gap-4 sm:grid-cols-2 sm:max-w-md">
          {(["timeline_start", "timeline_end"] as const).map((key) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label htmlFor={key} className="text-[13px] font-semibold text-fg-secondary">{f[key]}</label>
              <Input id={key} type="date" value={brief[key] ?? ""} readOnly={!canEdit}
                aria-invalid={error?.field === key}
                aria-describedby={error?.field === key ? `${key}-error` : undefined}
                onChange={(e) => update({ [key]: e.target.value || null })} />
              <FieldError id={key} message={error?.field === key ? error.message : null} />
            </div>
          ))}
        </div>
        <ListField id="team-list" label={f.team} addLabel={f.addMember} readOnly={!canEdit}
          columns={[f.memberName, f.memberRole]} gridClass="sm:grid-cols-2"
          rows={brief.team} empty={{ name: "", role: "" }} onChange={(team) => update({ team })}
          render={(m, set, i) => (
            <>
              <Input aria-label={`${f.memberName} ${i + 1}`} value={m.name} readOnly={!canEdit} maxLength={200} onChange={(e) => set({ ...m, name: e.target.value })} />
              <Input aria-label={`${f.memberRole} ${i + 1}`} value={m.role} readOnly={!canEdit} maxLength={200} onChange={(e) => set({ ...m, role: e.target.value })} />
            </>
          )} />
      </Section>

      <Section id="links" title={t.brief.sections.links}>
        <ListField id="links-list" label={f.links} hideLegend addLabel={f.addLink} readOnly={!canEdit}
          columns={[f.linkTitle, f.linkUrl]} gridClass="sm:grid-cols-[1fr_2fr]"
          rows={brief.links} empty={{ title: "", url: "" }} onChange={(links) => update({ links })}
          render={(l, set, i) => (
            <>
              <Input aria-label={`${f.linkTitle} ${i + 1}`} value={l.title} readOnly={!canEdit} maxLength={200} onChange={(e) => set({ ...l, title: e.target.value })} />
              <Input aria-label={`${f.linkUrl} ${i + 1}`} type="url" inputMode="url" value={l.url} readOnly={!canEdit} maxLength={2000}
                placeholder="https://" onChange={(e) => set({ ...l, url: e.target.value })} />
            </>
          )} />
      </Section>
    </div>
  );
}

function ListField<T>({ id, label, hideLegend, addLabel, rows, empty, onChange, render, readOnly, columns, gridClass }: {
  id: string;
  label: string;
  /** When the section heading already says the same thing. */
  hideLegend?: boolean;
  addLabel: string;
  rows: T[];
  empty: T;
  onChange: (rows: T[]) => void;
  render: (row: T, set: (row: T) => void, index: number) => ReactNode;
  readOnly: boolean;
  columns?: string[];
  gridClass?: string;
}) {
  const set = (i: number) => (row: T) => onChange(rows.map((r, j) => (j === i ? row : r)));
  return (
    <fieldset id={id} className="flex flex-col gap-1.5">
      <legend className={cn("mb-1.5 text-[13px] font-semibold text-fg-secondary", hideLegend && "sr-only")}>{label}</legend>
      {columns && rows.length > 0 && (
        <div aria-hidden className={cn("hidden gap-2 pr-9 text-caption text-fg-secondary sm:grid", gridClass)}>
          {columns.map((c) => <span key={c}>{c}</span>)}
        </div>
      )}
      <ul className="flex flex-col gap-1.5">
        {rows.map((row, i) => (
          <li key={i} className="flex items-start gap-1">
            <div className={cn("grid flex-1 gap-2", gridClass)}>{render(row, set(i), i)}</div>
            {!readOnly && (
              <button type="button" onClick={() => onChange(rows.filter((_, j) => j !== i))}
                aria-label={`${t.brief.fields.remove}: ${label} ${i + 1}`}
                className="grid size-9 shrink-0 place-items-center rounded-[7px] text-base text-fg-secondary hover:bg-subtle hover:text-fg">
                <span aria-hidden>×</span>
              </button>
            )}
          </li>
        ))}
      </ul>
      {!readOnly && (
        <button type="button" onClick={() => onChange([...rows, empty])}
          className="self-start rounded-[9px] border-[1.5px] border-fg px-3 py-1.5 text-[13px] font-semibold hover:bg-subtle">
          + {addLabel}
        </button>
      )}
    </fieldset>
  );
}
