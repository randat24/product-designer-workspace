"use client";

import { useState } from "react";
import { useAutosave, SaveToast } from "@/shared/ui/autosave";
import { Section, TextField } from "@/shared/ui/form-section";
import { Input } from "@/shared/ui/field";
import { cn } from "@/shared/lib/cn";
import { t } from "@/shared/i18n/ru";
import { deleteCompetitor, saveCompetitor } from "./actions";
import { COMPETITOR_KINDS, type CompetitorFields } from "./schema";

const f = t.competitors.fields;
type TextKey = Exclude<keyof CompetitorFields, "name" | "url" | "kind">;

export function CompetitorEditor({ id, initial, isOwn, canEdit, screenshots }: {
  id: string;
  initial: CompetitorFields;
  isOwn: boolean;
  canEdit: boolean;
  screenshots: React.ReactNode;
}) {
  const { value: c, update, status, error } = useAutosave(initial, (v) => saveCompetitor(id, v), canEdit);
  const [armed, setArmed] = useState(false);

  const text = (key: TextKey, hint?: string) => (
    <TextField id={key} label={f[key]} hint={hint} value={c[key] ?? ""} readOnly={!canEdit}
      onChange={(v) => update({ [key]: v } as Partial<CompetitorFields>)} />
  );

  return (
    <div className="flex flex-col gap-8">
      <SaveToast id="competitor-status" status={status} error={error?.message} readOnly={!canEdit} />

      <Section id="main" title={t.competitors.sections.main}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-[13px] font-semibold text-fg-secondary">{f.name}</label>
            <Input id="name" value={c.name} readOnly={!canEdit} maxLength={120} className="text-base font-bold"
              aria-invalid={error?.field === "name"} aria-describedby={error?.field === "name" ? "competitor-status" : undefined}
              onChange={(e) => update({ name: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="url" className="text-[13px] font-semibold text-fg-secondary">{f.url}</label>
            <Input id="url" type="url" inputMode="url" placeholder="https://" value={c.url ?? ""} readOnly={!canEdit} maxLength={2000}
              onChange={(e) => update({ url: e.target.value })} />
          </div>
        </div>
        {!isOwn && (
          <fieldset className="flex flex-col gap-1.5">
            <legend className="mb-1.5 text-[13px] font-semibold text-fg-secondary">{f.kind}</legend>
            <div className="flex flex-wrap gap-1.5">
              {COMPETITOR_KINDS.map((k) => (
                <button key={k.value} type="button" aria-pressed={c.kind === k.value} disabled={!canEdit}
                  onClick={() => update({ kind: k.value })}
                  className={cn(
                    "rounded-full border-[1.5px] px-3 py-1 text-[13px] font-semibold disabled:cursor-default",
                    c.kind === k.value ? "border-fg bg-fg text-canvas" : "border-line text-fg-secondary hover:border-fg",
                  )}>
                  {k.label}
                </button>
              ))}
            </div>
          </fieldset>
        )}
      </Section>

      <Section id="positioning-s" title={t.competitors.sections.positioning}>
        {text("positioning", f.positioningHint)}
        {text("target_audience")}
        {text("pricing")}
      </Section>

      {!isOwn && (
        <Section id="assessment" title={t.competitors.sections.assessment}>
          <div className="grid gap-4 md:grid-cols-2">
            {text("strengths", f.strengthsHint)}
            {text("weaknesses", f.weaknessesHint)}
          </div>
          {text("reviews_summary", f.reviews_summaryHint)}
        </Section>
      )}

      {!isOwn && (
        <Section id="takeaways" title={t.competitors.sections.takeaways}>
          {text("borrow", f.borrowHint)}
          {text("opportunities", f.opportunitiesHint)}
        </Section>
      )}

      <Section id="ux" title={t.competitors.sections.ux}>
        <div className="grid gap-4 md:grid-cols-2">
          {text("onboarding_notes", f.onboarding_notesHint)}
          {text("navigation_notes")}
          {text("ux_patterns", f.ux_patternsHint)}
          {text("ui_patterns")}
        </div>
      </Section>

      {screenshots}

      {canEdit && (
        <form action={deleteCompetitor} onSubmit={(e) => { if (!armed) { e.preventDefault(); setArmed(true); } }}>
          <input type="hidden" name="id" value={id} />
          <button type="submit" onBlur={() => setArmed(false)}
            className={cn(
              "rounded-[9px] border-[1.5px] px-3.5 py-1.5 text-sm font-semibold",
              armed ? "border-danger bg-danger text-white" : "border-line text-danger hover:border-danger",
            )}>
            {armed ? t.competitors.deleteConfirm : t.competitors.delete}
          </button>
        </form>
      )}
    </div>
  );
}
