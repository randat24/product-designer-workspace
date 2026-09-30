"use client";

import { useState } from "react";
import { useAutosave, SaveToast } from "@/shared/ui/autosave";
import { Section, TextField } from "@/shared/ui/form-section";
import { ChipGroup } from "@/shared/ui/chips";
import { FieldError, Input } from "@/shared/ui/field";
import { cn } from "@/shared/lib/cn";
import { isHttpUrl, withScheme } from "@/shared/lib/url";
import { t } from "@/shared/i18n/ru";
import { deleteDecision, deleteScreen, saveDecision, saveScreen } from "./actions";
import {
  DECISION_STATUSES, SCREEN_STATUSES,
  type Alternative, type AnalyticsEvent, type DecisionFields, type ScreenSpec,
} from "./schema";

const sc = t.screens;
const dc = t.decisions;
const labelClass = "text-[13px] font-semibold text-fg-secondary";

function Line({ id, label, hint, value, readOnly, error, onChange, className }: {
  id: string; label: string; hint?: string; value: string; readOnly: boolean; error?: string;
  onChange: (v: string) => void; className?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={labelClass}>{label}</label>
      <Input id={id} value={value} readOnly={readOnly} placeholder={hint} aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined} className={className}
        onChange={(e) => onChange(e.target.value)} />
      <FieldError id={id} message={error} />
    </div>
  );
}

/** Ordered list of short strings (content hierarchy). */
function StringList({ id, label, hint, items, readOnly, onChange }: {
  id: string; label: string; hint?: string; items: string[]; readOnly: boolean; onChange: (v: string[]) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className={cn(labelClass, "mb-1.5")}>{label}</legend>
      {hint && <p className="text-caption text-fg-secondary">{hint}</p>}
      <ol className="flex flex-col gap-1.5">
        {items.map((v, i) => (
          <li key={i} className="flex items-center gap-1.5">
            <span className="w-5 text-right text-caption font-bold text-fg-secondary tabular-nums">{i + 1}</span>
            <Input id={i === 0 ? id : undefined} aria-label={`${label} ${i + 1}`} value={v} readOnly={readOnly} maxLength={300}
              placeholder={sc.itemPlaceholder} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} />
            {!readOnly && (
              <button type="button" aria-label={`${sc.removeItem} ${i + 1}`} onClick={() => onChange(items.filter((_, j) => j !== i))}
                className="grid size-9 shrink-0 place-items-center rounded-[7px] text-fg-secondary hover:bg-subtle hover:text-danger"><span aria-hidden>×</span></button>
            )}
          </li>
        ))}
      </ol>
      {!readOnly && (
        <button type="button" onClick={() => onChange([...items, ""])}
          className="self-start rounded-[9px] border-[1.5px] border-line px-3 py-1 text-[13px] font-semibold hover:border-fg">+ {sc.addItem}</button>
      )}
    </fieldset>
  );
}

function EventList({ items, readOnly, onChange }: { items: AnalyticsEvent[]; readOnly: boolean; onChange: (v: AnalyticsEvent[]) => void }) {
  const e = sc.event;
  const set = (i: number, patch: Partial<AnalyticsEvent>) => onChange(items.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className={cn(labelClass, "mb-1.5")}>{sc.fields.analytics_events}</legend>
      <ul className="flex flex-col gap-2">
        {items.map((ev, i) => (
          <li key={i} className="grid gap-1.5 sm:grid-cols-[1fr_1.4fr_1fr_auto]">
            <Input aria-label={`${e.name} ${i + 1}`} placeholder={e.name} value={ev.name} readOnly={readOnly} maxLength={120}
              className="font-mono text-[13px]" onChange={(x) => set(i, { name: x.target.value })} />
            <Input aria-label={`${e.trigger} ${i + 1}`} placeholder={e.trigger} value={ev.trigger} readOnly={readOnly} maxLength={300}
              onChange={(x) => set(i, { trigger: x.target.value })} />
            <Input aria-label={`${e.props} ${i + 1}`} placeholder={e.props} value={ev.props} readOnly={readOnly} maxLength={300}
              className="font-mono text-[13px]" onChange={(x) => set(i, { props: x.target.value })} />
            {!readOnly && (
              <button type="button" aria-label={`${sc.removeItem}: ${ev.name || i + 1}`} onClick={() => onChange(items.filter((_, j) => j !== i))}
                className="grid size-9 place-items-center rounded-[7px] text-fg-secondary hover:bg-subtle hover:text-danger"><span aria-hidden>×</span></button>
            )}
          </li>
        ))}
      </ul>
      {!readOnly && (
        <button type="button" onClick={() => onChange([...items, { name: "", trigger: "", props: "" }])}
          className="self-start rounded-[9px] border-[1.5px] border-line px-3 py-1 text-[13px] font-semibold hover:border-fg">+ {e.add}</button>
      )}
    </fieldset>
  );
}

/** Screen specification (docs/IA.md /screens/[code]), autosaved as a whole. */
export function ScreenEditor({ id, initial, canEdit }: { id: string; initial: ScreenSpec; canEdit: boolean }) {
  const { value: v, update, status, error } = useAutosave(initial, (x) => saveScreen(id, x), canEdit);
  const f = sc.fields;
  const ro = !canEdit;
  return (
    <div className="flex flex-col gap-8">
      <SaveToast id="screen-status" status={status} error={error?.message} readOnly={ro} />
      <Section id="spec" title={sc.sections.spec}>
        <Line id="name" label={f.name} value={v.name} readOnly={ro} error={error?.field === "name" ? error.message : undefined} className="h-11 text-[17px] font-bold"
          onChange={(name) => update({ name })} />
        <ChipGroup label={f.status} options={SCREEN_STATUSES} value={v.status} disabled={ro} onChange={(s) => update({ status: s })} />
        <TextField id="purpose" label={f.purpose} hint={f.purposeHint} value={v.purpose ?? ""} readOnly={ro} onChange={(purpose) => update({ purpose })} />
        <TextField id="user_goal" label={f.user_goal} value={v.user_goal ?? ""} readOnly={ro} onChange={(user_goal) => update({ user_goal })} />
        <TextField id="entry_points" label={f.entry_points} hint={f.entry_pointsHint} value={v.entry_points ?? ""} readOnly={ro}
          onChange={(entry_points) => update({ entry_points })} />
      </Section>
      <Section id="content" title={sc.sections.content}>
        <Line id="primary_action" label={f.primary_action} value={v.primary_action ?? ""} readOnly={ro} onChange={(primary_action) => update({ primary_action })} />
        <TextField id="secondary_actions" label={f.secondary_actions} value={v.secondary_actions ?? ""} readOnly={ro}
          onChange={(secondary_actions) => update({ secondary_actions })} />
        <StringList id="content_hierarchy" label={f.content_hierarchy} hint={f.content_hierarchyHint} items={v.content_hierarchy} readOnly={ro}
          onChange={(content_hierarchy) => update({ content_hierarchy })} />
      </Section>
      <Section id="tech" title={sc.sections.tech}>
        <TextField id="permissions" label={f.permissions} value={v.permissions ?? ""} readOnly={ro} onChange={(permissions) => update({ permissions })} />
        <EventList items={v.analytics_events} readOnly={ro} onChange={(analytics_events) => update({ analytics_events })} />
        <TextField id="api_data_requirements" label={f.api_data_requirements} value={v.api_data_requirements ?? ""} readOnly={ro}
          onChange={(api_data_requirements) => update({ api_data_requirements })} />
      </Section>
      <Section id="design" title={sc.sections.design}>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="figma_url" className={labelClass}>{f.figma_url}</label>
          <div className="flex flex-wrap items-center gap-2">
            <Input id="figma_url" type="url" inputMode="url" value={v.figma_url ?? ""} readOnly={ro} placeholder="https://www.figma.com/design/…"
              aria-invalid={error?.field === "figma_url"} aria-describedby={error?.field === "figma_url" ? "figma-error" : undefined}
              className="min-w-0 flex-1" onChange={(e) => update({ figma_url: e.target.value })} />
            {v.figma_url && isHttpUrl(withScheme(v.figma_url)) && (
              <a href={withScheme(v.figma_url)} target="_blank" rel="noreferrer" className="text-[13px] font-semibold underline underline-offset-2">{sc.openFigma}</a>
            )}
          </div>
          {error?.field === "figma_url" && <p id="figma-error" className="text-[13px] text-danger">{error.message}</p>}
        </div>
      </Section>
    </div>
  );
}

function ArmedDelete({ action, id, label, confirm }: { action: (fd: FormData) => Promise<void>; id: string; label: string; confirm: string }) {
  const [armed, setArmed] = useState(false);
  return (
    <form action={action} onSubmit={(e) => { if (!armed) { e.preventDefault(); setArmed(true); } }}>
      <input type="hidden" name="id" value={id} />
      <button type="submit" onBlur={() => setArmed(false)}
        className={cn("rounded-[9px] border-[1.5px] px-3.5 py-1.5 text-sm font-semibold",
          armed ? "border-danger bg-danger text-white" : "border-line text-danger hover:border-danger")}>
        {armed ? confirm : label}
      </button>
    </form>
  );
}
export const DeleteScreenButton = ({ id }: { id: string }) => <ArmedDelete action={deleteScreen} id={id} label={sc.delete} confirm={sc.deleteConfirm} />;
export const DeleteDecisionButton = ({ id }: { id: string }) => <ArmedDelete action={deleteDecision} id={id} label={dc.delete} confirm={dc.deleteConfirm} />;

/** Decision Log entry (docs/IA.md /decisions/[code]), autosaved as a whole. */
export function DecisionEditor({ id, initial, others, canEdit }: {
  id: string; initial: DecisionFields; others: { id: string; code: string; title: string }[]; canEdit: boolean;
}) {
  const { value: v, update, status, error } = useAutosave(initial, (x) => saveDecision(id, x), canEdit);
  const f = dc.fields;
  const ro = !canEdit;
  const alts: Alternative[] = v.alternatives;
  const setAlt = (i: number, patch: Partial<Alternative>) => update({ alternatives: alts.map((a, j) => (j === i ? { ...a, ...patch } : a)) });
  return (
    <div className="flex flex-col gap-8">
      <SaveToast id="decision-status" status={status} error={error?.message} readOnly={ro} />
      <Section id="decision" title={dc.section}>
        <Line id="title" label={f.title} value={v.title} readOnly={ro} error={error?.field === "title" ? error.message : undefined} className="h-11 text-[17px] font-bold"
          onChange={(title) => update({ title })} />
        <TextField id="context" label={f.context} hint={f.contextHint} value={v.context ?? ""} readOnly={ro} onChange={(context) => update({ context })} />
        <TextField id="decision-text" label={f.decision} value={v.decision ?? ""} readOnly={ro} onChange={(decision) => update({ decision })} />
        <TextField id="reason" label={f.reason} hint={f.reasonHint} value={v.reason ?? ""} readOnly={ro} onChange={(reason) => update({ reason })} />
      </Section>

      <Section id="alternatives" title={f.alternatives}>
        <ul className="flex flex-col gap-3">
          {alts.map((a, i) => (
            <li key={i} className="flex flex-col gap-1.5 rounded-[12px] border border-line p-3">
              <div className="flex items-center gap-1.5">
                <Input aria-label={`${f.option} ${i + 1}`} placeholder={f.option} value={a.option} readOnly={ro} maxLength={300}
                  className="font-semibold" onChange={(e) => setAlt(i, { option: e.target.value })} />
                {!ro && (
                  <button type="button" aria-label={`${dc.removeAlternative} ${i + 1}`} onClick={() => update({ alternatives: alts.filter((_, j) => j !== i) })}
                    className="grid size-9 shrink-0 place-items-center rounded-[7px] text-fg-secondary hover:bg-subtle hover:text-danger"><span aria-hidden>×</span></button>
                )}
              </div>
              <Input aria-label={`${f.why_rejected} ${i + 1}`} placeholder={f.why_rejected} value={a.why_rejected} readOnly={ro} maxLength={1000}
                onChange={(e) => setAlt(i, { why_rejected: e.target.value })} />
            </li>
          ))}
        </ul>
        {!ro && (
          <button type="button" onClick={() => update({ alternatives: [...alts, { option: "", why_rejected: "" }] })}
            className="self-start rounded-[9px] border-[1.5px] border-line px-3 py-1 text-[13px] font-semibold hover:border-fg">+ {dc.addAlternative}</button>
        )}
      </Section>

      <Section id="status" title={f.status}>
        <ChipGroup label={f.status} options={DECISION_STATUSES} value={v.status} disabled={ro} onChange={(s) => update({ status: s })} />
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="decided_at" className={labelClass}>{f.decided_at}</label>
            <Input id="decided_at" type="date" className="w-44" readOnly={ro} value={v.decided_at ?? ""}
              onChange={(e) => update({ decided_at: e.target.value || null })} />
          </div>
          <div className="flex min-w-64 flex-1 flex-col gap-1.5">
            <label htmlFor="superseded_by" className={labelClass}>{f.superseded_by}</label>
            <select id="superseded_by" disabled={ro} value={v.superseded_by_id ?? ""} aria-invalid={error?.field === "superseded_by_id"}
              onChange={(e) => update({ superseded_by_id: e.target.value || null, ...(e.target.value ? { status: "superseded" as const } : {}) })}
              className="h-9 rounded-[8px] border border-line bg-surface px-2 text-sm disabled:opacity-70">
              <option value="">{dc.supersededNone}</option>
              {others.map((o) => <option key={o.id} value={o.id}>{o.code} {o.title}</option>)}
            </select>
          </div>
        </div>
      </Section>
    </div>
  );
}
