"use client";

import { useAutosave, SaveToast } from "@/shared/ui/autosave";
import { Section, TextField } from "@/shared/ui/form-section";
import { ChipGroup } from "@/shared/ui/chips";
import { FieldError, Input } from "@/shared/ui/field";
import { ConfirmDelete } from "@/shared/ui/confirm-delete";
import { t } from "@/shared/i18n/uk";
import { deleteSynthesisEntity, saveInsight, saveOpportunity, savePainPoint } from "./actions";
import {
  EFFORT_LEVELS, IMPACT_LEVELS, INSIGHT_STATUSES, LEVELS, OPPORTUNITY_STATUSES, SEVERITIES,
  type InsightFields, type OpportunityFields, type PainPointFields,
} from "./schema";

const s = t.synthesis;

function TitleInput({ id, label, hint, value, readOnly, error, onChange }: {
  id: string; label: string; hint?: string; value: string; readOnly: boolean; error?: string; onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-meta font-semibold text-fg-secondary">{label}</label>
      <Input id={id} value={value} readOnly={readOnly} maxLength={300} placeholder={hint} aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(e) => onChange(e.target.value)} className="h-11 text-heading font-bold" />
      <FieldError id={id} message={error} />
    </div>
  );
}

export function InsightEditor({ id, initial, canEdit, version = null }: { id: string; initial: InsightFields; canEdit: boolean; version?: string | null }) {
  const { value: v, update, status, error } = useAutosave(initial, (x, ver) => saveInsight(id, x, ver), canEdit, version);
  const f = s.insights.fields;
  return (
    <Section id="insight" title={s.insights.title.slice(0, -1)}>
      <SaveToast id="insight-status" status={status} error={error?.message} readOnly={!canEdit} />
      <TitleInput id="title" label={f.title} hint={f.titleHint} value={v.title} readOnly={!canEdit} error={error?.field === "title" ? error.message : undefined} onChange={(title) => update({ title })} />
      <TextField id="statement" label={f.statement} hint={f.statementHint} value={v.statement ?? ""} readOnly={!canEdit} onChange={(statement) => update({ statement })} />
      <div className="flex flex-wrap gap-6">
        <ChipGroup label={f.confidence} options={LEVELS} value={v.confidence} disabled={!canEdit} onChange={(confidence) => update({ confidence })} />
        <ChipGroup label={f.status} options={INSIGHT_STATUSES} value={v.status} disabled={!canEdit} onChange={(st) => update({ status: st })} />
      </div>
    </Section>
  );
}

export function PainPointEditor({ id, initial, canEdit, version = null }: { id: string; initial: PainPointFields; canEdit: boolean; version?: string | null }) {
  const { value: v, update, status, error } = useAutosave(initial, (x, ver) => savePainPoint(id, x, ver), canEdit, version);
  const f = s.painPoints.fields;
  return (
    <Section id="pain" title={f.title}>
      <SaveToast id="pain-status" status={status} error={error?.message} readOnly={!canEdit} />
      <TitleInput id="title" label={f.title} hint={f.titleHint} value={v.title} readOnly={!canEdit} error={error?.field === "title" ? error.message : undefined} onChange={(title) => update({ title })} />
      <TextField id="description" label={f.description} value={v.description ?? ""} readOnly={!canEdit} onChange={(description) => update({ description })} />
      <ChipGroup label={f.severity} options={SEVERITIES} value={v.severity} disabled={!canEdit} onChange={(severity) => update({ severity })} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="segment_label" className="text-meta font-semibold text-fg-secondary">{f.segment_label}</label>
        <Input id="segment_label" value={v.segment_label ?? ""} readOnly={!canEdit} maxLength={80} className="max-w-xs"
          onChange={(e) => update({ segment_label: e.target.value })} />
      </div>
    </Section>
  );
}

export function OpportunityEditor({ id, initial, canEdit, version = null }: { id: string; initial: OpportunityFields; canEdit: boolean; version?: string | null }) {
  const { value: v, update, status, error } = useAutosave(initial, (x, ver) => saveOpportunity(id, x, ver), canEdit, version);
  const f = s.opportunities.fields;
  return (
    <Section id="opportunity" title={f.title}>
      <SaveToast id="opp-status" status={status} error={error?.message} readOnly={!canEdit} />
      <TitleInput id="title" label={f.title} value={v.title} readOnly={!canEdit} error={error?.field === "title" ? error.message : undefined} onChange={(title) => update({ title })} />
      <TextField id="hmw" label={f.hmw} hint={f.hmwHint} value={v.hmw ?? ""} readOnly={!canEdit} onChange={(hmw) => update({ hmw })} />
      <TextField id="description" label={f.description} value={v.description ?? ""} readOnly={!canEdit} onChange={(description) => update({ description })} />
      <div className="flex flex-wrap gap-6">
        <ChipGroup label={f.impact} options={IMPACT_LEVELS} value={v.impact} disabled={!canEdit} onChange={(impact) => update({ impact })} />
        <ChipGroup label={f.effort} options={EFFORT_LEVELS} value={v.effort} disabled={!canEdit} onChange={(effort) => update({ effort })} />
      </div>
      <ChipGroup label={f.status} options={OPPORTUNITY_STATUSES} value={v.status} disabled={!canEdit} onChange={(st) => update({ status: st })} />
    </Section>
  );
}

/** Two-step delete used on synthesis detail pages. */
export function DeleteEntityButton({ type, id, label }: { type: string; id: string; label: string }) {
  return <ConfirmDelete action={deleteSynthesisEntity} fields={{ type, id }} label={label} confirm={s.deleteConfirm} />;
}
