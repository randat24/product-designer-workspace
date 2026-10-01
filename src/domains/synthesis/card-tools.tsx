"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FieldSaveNote, useFieldAutosave, useAutosave, SaveToast } from "@/shared/ui/autosave";
import { ChipGroup } from "@/shared/ui/chips";
import { Button } from "@/shared/ui/button";
import { t } from "@/shared/i18n/uk";
import { createObservation, saveObservation, saveQuoteText } from "./actions";
import { OBSERVATION_KINDS, type ObservationKind } from "./schema";

const area = "w-full resize-y rounded-control border border-transparent bg-subtle px-3 py-2 text-heading leading-relaxed [field-sizing:content] focus:border-fg focus:bg-surface focus:outline-none";

export function QuoteText({ id, initial, canEdit }: { id: string; initial: string; canEdit: boolean }) {
  const f = useFieldAutosave(initial, (v) => saveQuoteText(id, v), canEdit);
  return (
    <>
      <textarea aria-label={t.synthesis.quotes.text} value={f.value} readOnly={!canEdit} maxLength={2000} aria-invalid={f.invalid}
        onChange={(e) => f.onChange(e.target.value)} onBlur={f.onBlur} className={`${area} italic`} />
      <FieldSaveNote status={f.status} error={f.error} />
    </>
  );
}

/** Quote → observation in one action; the observation is traced to the quote. */
export function QuoteToObservation({ projectId, quoteId, text }: { projectId: string; quoteId: string; text: string }) {
  const router = useRouter();
  const [kind, setKind] = useState<ObservationKind>("pain");
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-wrap items-end gap-3">
      <ChipGroup label={t.synthesis.board.kind} options={OBSERVATION_KINDS} value={kind} onChange={setKind} size="sm" />
      <Button disabled={pending} onClick={() => startTransition(async () => {
        const res = await createObservation({ projectId, interviewId: null, quoteId, kind, text });
        if (res.ok) router.refresh();
      })}>{t.synthesis.quotes.toObservation}</Button>
    </div>
  );
}

export function ObservationEditor({ id, initial, canEdit }: { id: string; initial: { kind: ObservationKind; body_text: string }; canEdit: boolean }) {
  const { value, update, status, error } = useAutosave(initial, (v) => saveObservation(id, v), canEdit);
  return (
    <div className="flex flex-col gap-4">
      <SaveToast id="obs-status" status={status} error={error?.message} readOnly={!canEdit} />
      <ChipGroup label={t.synthesis.board.kind} options={OBSERVATION_KINDS} value={value.kind} disabled={!canEdit} onChange={(kind) => update({ kind })} />
      <textarea aria-label={t.synthesis.observation.text} value={value.body_text} readOnly={!canEdit} maxLength={2000}
        onChange={(e) => update({ body_text: e.target.value })} className={area} />
    </div>
  );
}
