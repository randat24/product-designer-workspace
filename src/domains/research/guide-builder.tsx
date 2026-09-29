"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAutosave, SaveToast } from "@/shared/ui/autosave";
import { TextField } from "@/shared/ui/form-section";
import { Input } from "@/shared/ui/field";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/cn";
import { t } from "@/shared/i18n/ru";
import { addQuestion, applyGuideTemplate, deleteQuestion, moveQuestion, saveGuideMeta, saveQuestion } from "./actions";
import { GUIDE_SECTIONS, type GuideMeta, type GuideSection } from "./schema";
import type { GuideQuestion } from "./queries";

const g = t.research.guide;

/** Interview Builder: 8 sections, questions with probes and a "key" mark (docs/IA.md). */
export function GuideBuilder({ projectId, guideId, meta, questions, canEdit }: {
  projectId: string;
  guideId: string;
  meta: GuideMeta;
  questions: GuideQuestion[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { value: m, update, status, error } = useAutosave(meta, (v) => saveGuideMeta(guideId, v), canEdit);
  const run = (fn: () => Promise<unknown>) => startTransition(async () => { await fn(); router.refresh(); });

  return (
    <div className="flex flex-col gap-8">
      <SaveToast id="guide-status" status={status} error={error?.message} readOnly={!canEdit} />
      <div className="flex flex-col gap-5 rounded-[14px] border border-line bg-surface p-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="guide-title" className="text-[13px] font-semibold text-fg-secondary">{g.title}</label>
          <Input id="guide-title" value={m.title} readOnly={!canEdit} maxLength={200} className="text-base font-bold"
            onChange={(e) => update({ title: e.target.value })} />
        </div>
        <TextField id="intro" label={g.intro} hint={g.introHint} value={m.intro ?? ""} readOnly={!canEdit} onChange={(intro) => update({ intro })} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-fg-secondary">{g.total(questions.length)}</p>
        {canEdit && (
          <Button variant="secondary" disabled={pending} onClick={() => run(() => applyGuideTemplate(projectId, guideId))}>{g.template}</Button>
        )}
      </div>

      <ol className="flex flex-col gap-6">
        {GUIDE_SECTIONS.map((section, si) => {
          const items = questions.filter((q) => q.section === section.value);
          return (
            <li key={section.value} aria-labelledby={`sec-${section.value}`} className="flex flex-col gap-2.5">
              <div className="flex items-baseline gap-3">
                <span className="display-num text-[22px] leading-none text-fg-secondary tabular-nums">{si + 1}</span>
                <div>
                  <h2 id={`sec-${section.value}`} className="text-heading font-semibold">{section.label}</h2>
                  <p className="text-[13px] text-fg-secondary">{section.hint}</p>
                </div>
              </div>
              {items.length === 0 && !canEdit && <p className="text-[13px] text-fg-secondary">{g.emptySection}</p>}
              <ul className="flex flex-col gap-2">
                {items.map((q, i) => (
                  <QuestionRow key={q.id} q={q} canEdit={canEdit} first={i === 0} last={i === items.length - 1}
                    onMove={(d) => run(() => moveQuestion(q.id, d))} onDelete={() => run(() => deleteQuestion(q.id))}
                    onSectionSaved={() => router.refresh()} />
                ))}
              </ul>
              {canEdit && <AddQuestion onAdd={(text) => run(() => addQuestion(projectId, guideId, section.value, text))} disabled={pending} sectionLabel={section.label} />}
            </li>
          );
        })}
      </ol>

      <div className="rounded-[14px] border border-line bg-surface p-5">
        <TextField id="outro" label={g.outro} hint={g.outroHint} value={m.outro ?? ""} readOnly={!canEdit} onChange={(outro) => update({ outro })} />
      </div>
    </div>
  );
}

function QuestionRow({ q, canEdit, first, last, onMove, onDelete, onSectionSaved }: {
  q: GuideQuestion; canEdit: boolean; first: boolean; last: boolean; onMove: (d: -1 | 1) => void; onDelete: () => void;
  onSectionSaved: () => void;
}) {
  const { value, update, status } = useAutosave(
    { section: q.section as GuideSection, text: q.text, probes: q.probes, is_key: q.is_key },
    async (v) => {
      if (!v.text.trim()) return { ok: true as const };
      const res = await saveQuestion(q.id, v);
      // Moving to another section re-sorts the list on the server.
      if (res.ok && v.section !== q.section) onSectionSaved();
      return res;
    },
    canEdit,
  );
  const icon = "grid size-8 place-items-center rounded-[7px] text-fg-secondary hover:bg-subtle hover:text-fg disabled:opacity-30";

  return (
    <li className={cn("flex flex-col gap-2 rounded-[12px] border border-line bg-surface p-2.5 pl-3", value.is_key && "border-l-4 border-l-fg")}>
      <div className="flex items-start gap-2">
        <Input aria-label={`${t.research.matrix.question}: ${value.text}`} value={value.text} readOnly={!canEdit} maxLength={1000}
          aria-invalid={status === "error"} onChange={(e) => update({ text: e.target.value })} className="font-semibold" />
        {canEdit && (
          <div className="flex shrink-0 flex-wrap items-center justify-end">
            <select aria-label={`${g.section}: ${value.text}`} value={value.section}
              onChange={(e) => update({ section: e.target.value as GuideSection })}
              className="mr-1 h-8 max-w-36 rounded-lg border border-line bg-surface px-1.5 text-caption font-semibold text-fg-secondary">
              {GUIDE_SECTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <label className="mr-1 flex cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] border-line px-2.5 py-1 text-caption font-semibold has-[:checked]:border-fg has-[:checked]:bg-fg has-[:checked]:text-canvas">
              <input type="checkbox" className="sr-only" checked={value.is_key} onChange={(e) => update({ is_key: e.target.checked })} />
              {g.isKey}
            </label>
            <button type="button" className={icon} disabled={first} onClick={() => onMove(-1)} aria-label={`${g.moveUp}: ${value.text}`}>↑</button>
            <button type="button" className={icon} disabled={last} onClick={() => onMove(1)} aria-label={`${g.moveDown}: ${value.text}`}>↓</button>
            <button type="button" className={cn(icon, "hover:text-danger")} onClick={onDelete} aria-label={`${g.remove}: ${value.text}`}>×</button>
          </div>
        )}
        {!canEdit && value.is_key && <span className="shrink-0 rounded-full bg-fg px-2.5 py-0.5 text-caption font-semibold text-canvas">{g.isKey}</span>}
      </div>
      {(value.probes.length > 0 || canEdit) && (
        <div className="flex flex-col gap-1 pl-4">
          {value.probes.map((probe, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span aria-hidden className="text-fg-secondary">↳</span>
              <Input aria-label={`${g.probes} ${i + 1}`} value={probe} readOnly={!canEdit} maxLength={300} placeholder={g.probePlaceholder}
                className="h-8 text-[13px]" onChange={(e) => update({ probes: value.probes.map((x, j) => (j === i ? e.target.value : x)) })} />
              {canEdit && (
                <button type="button" className={icon} aria-label={`${t.brief.fields.remove}: ${g.probes} ${i + 1}`}
                  onClick={() => update({ probes: value.probes.filter((_, j) => j !== i) })}>×</button>
              )}
            </div>
          ))}
          {canEdit && value.probes.length < 10 && (
            <button type="button" onClick={() => update({ probes: [...value.probes, ""] })}
              className="self-start px-1 text-caption font-semibold text-fg-secondary hover:text-fg">{g.addProbe}</button>
          )}
        </div>
      )}
    </li>
  );
}

function AddQuestion({ onAdd, disabled, sectionLabel }: { onAdd: (text: string) => void; disabled: boolean; sectionLabel: string }) {
  const [text, setText] = useState("");
  return (
    <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (text.trim()) { onAdd(text); setText(""); } }}>
      <Input aria-label={`${g.addQuestion}: ${sectionLabel}`} value={text} maxLength={1000} placeholder={g.questionPlaceholder}
        onChange={(e) => setText(e.target.value)} className="bg-transparent" />
      <Button type="submit" variant="secondary" disabled={disabled || !text.trim()} className="shrink-0">{g.addQuestion}</Button>
    </form>
  );
}
