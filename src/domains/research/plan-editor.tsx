"use client";

import { Plus, X } from "lucide-react";
import { useAutosave, SaveToast } from "@/shared/ui/autosave";
import { Section, TextField } from "@/shared/ui/form-section";
import { ChipGroup } from "@/shared/ui/chips";
import { FieldError, Input } from "@/shared/ui/field";
import { t } from "@/shared/i18n/ru";
import { savePlan } from "./actions";
import { RESEARCH_METHODS, RESEARCH_STATUSES, type PlanFields } from "./schema";
import { Button, IconButton } from "@/shared/ui/button";

const f = t.research.plan.fields;

export function PlanEditor({ id, initial, canEdit }: { id: string; initial: PlanFields; canEdit: boolean }) {
  const { value: p, update, status, error } = useAutosave(initial, (v) => savePlan(id, v), canEdit);
  const text = (key: "goal" | "hypotheses_text" | "audience" | "success_criteria", label: string, hint?: string) => (
    <TextField id={key} label={label} hint={hint} value={p[key] ?? ""} readOnly={!canEdit} onChange={(v) => update({ [key]: v })} />
  );

  return (
    <div className="flex flex-col gap-8">
      <SaveToast id="plan-status" status={status} error={error?.message} readOnly={!canEdit} />
      <Section id="goal-s" title={t.research.plan.sections.goal}>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="title" className="text-meta font-semibold text-fg-secondary">{f.title}</label>
          <Input id="title" value={p.title} readOnly={!canEdit} maxLength={200} className="text-base font-bold"
            aria-invalid={error?.field === "title"} aria-describedby={error?.field === "title" ? "title-error" : undefined}
            onChange={(e) => update({ title: e.target.value })} />
          <FieldError id="title" message={error?.field === "title" ? error.message : null} />
        </div>
        {text("goal", f.goal, f.goalHint)}
        <ChipGroup label={f.status} options={RESEARCH_STATUSES} value={p.status} disabled={!canEdit} onChange={(status) => update({ status })} />
      </Section>

      <Section id="questions-s" title={t.research.plan.sections.questions}>
        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 text-meta font-semibold text-fg-secondary">{f.questions}</legend>
          <ol className="flex flex-col gap-1.5">
            {p.questions.map((q, i) => (
              <li key={i} className="grid grid-cols-[28px_1fr_auto] items-center gap-1">
                <span className="display-num text-lg text-fg-secondary tabular-nums">{i + 1}</span>
                <Input aria-label={`${f.questions} ${i + 1}`} value={q} readOnly={!canEdit} maxLength={500} placeholder={f.questionPlaceholder}
                  onChange={(e) => update({ questions: p.questions.map((x, j) => (j === i ? e.target.value : x)) })} />
                {canEdit && (
                  <IconButton tone="danger" label={`${t.brief.fields.remove}: ${f.questions} ${i + 1}`}
                    onClick={() => update({ questions: p.questions.filter((_, j) => j !== i) })}><X className="size-4" /></IconButton>
                )}
              </li>
            ))}
          </ol>
          {canEdit && (
            <Button variant="secondary" size="sm" className="self-start" onClick={() => update({ questions: [...p.questions, ""] })}>
              <Plus aria-hidden className="size-4" />{f.addQuestion}
            </Button>
          )}
        </fieldset>
        {text("hypotheses_text", f.hypotheses_text, f.hypothesesHint)}
      </Section>

      <Section id="audience-s" title={t.research.plan.sections.audience}>
        {text("audience", f.audience, f.audienceHint)}
        <ChipGroup label={f.method} options={RESEARCH_METHODS} value={p.method} disabled={!canEdit} onChange={(method) => update({ method })} />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="participants_target" className="text-meta font-semibold text-fg-secondary">{f.participants_target}</label>
          <Input id="participants_target" type="number" min={1} max={500} inputMode="numeric" className="w-28" readOnly={!canEdit}
            value={p.participants_target ?? ""}
            onChange={(e) => update({ participants_target: e.target.value ? Number(e.target.value) : null })} />
        </div>
      </Section>

      <Section id="result-s" title={t.research.plan.sections.result}>
        {text("success_criteria", f.success_criteria, f.successHint)}
      </Section>
    </div>
  );
}
