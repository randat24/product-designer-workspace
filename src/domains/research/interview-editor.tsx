"use client";

import { useState } from "react";
import { useAutosave, SaveToast } from "@/shared/ui/autosave";
import { TextField } from "@/shared/ui/form-section";
import { ChipGroup } from "@/shared/ui/chips";
import { Input } from "@/shared/ui/field";
import { ConfirmDelete } from "@/shared/ui/confirm-delete";
import { t } from "@/shared/i18n/ru";
import { ConfirmIconButton } from "@/shared/ui/confirm-delete";
import { ActionError, useAction } from "@/shared/ui/use-action";
import { deleteAnswer, deleteInterview, saveInterviewMeta } from "./actions";
import { AnswerField } from "./answer-field";
import { GUIDE_SECTIONS, INTERVIEW_MODES, INTERVIEW_STATUSES, type InterviewMeta } from "./schema";
import type { GuideQuestion, InterviewAnswer } from "./queries";
import Link from "next/link";
import { EntityChip } from "@/shared/ui/entity-chip";
import { SelectionActions } from "@/domains/synthesis/client";

const iv = t.research.interview;

type InterviewSynthesis = {
  quotes: { id: string; code: string; text: string; answer_id: string | null }[];
  observations: { id: string; code: string; kind: string; body_text: string }[];
};

export function InterviewEditor({ projectId, base, interviewId, meta, questions, answers, synthesis, canEdit }: {
  projectId: string;
  base: string;
  synthesis: InterviewSynthesis;
  interviewId: string;
  meta: InterviewMeta;
  questions: GuideQuestion[] | null;
  answers: InterviewAnswer[];
  canEdit: boolean;
}) {
  const removing = useAction();
  const { value: m, update, status, error } = useAutosave(meta, (v) => saveInterviewMeta(interviewId, v), canEdit);
  const [newNotes, setNewNotes] = useState<number[]>([]);

  const byQuestion = new Map(answers.filter((a) => a.question_id).map((a) => [a.question_id!, a]));
  const questionIds = new Set((questions ?? []).map((q) => q.id));
  const notes = answers.filter((a) => !a.question_id || !questionIds.has(a.question_id));
  const selectionActions = canEdit
    ? (sel: Parameters<typeof SelectionActions>[0]["selection"]) => (
        <SelectionActions selection={sel} projectId={projectId} interviewId={interviewId} base={base} />
      )
    : undefined;
  const quotesOf = (answerId: string | undefined) => synthesis.quotes.filter((q) => answerId && q.answer_id === answerId);

  return (
    <div className="flex flex-col gap-8">
      <SaveToast id="interview-status" status={status} error={error?.message} readOnly={!canEdit} />

      <section aria-labelledby="meta-h" className="flex flex-col gap-3">
        <h2 id="meta-h" className="text-heading font-semibold">{iv.meta}</h2>
        <div className="flex flex-col gap-5 rounded-panel border border-line bg-surface p-5">
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="conducted_at" className="text-meta font-semibold text-fg-secondary">{iv.fields.conducted_at}</label>
              <Input id="conducted_at" type="date" className="w-44" readOnly={!canEdit} value={m.conducted_at?.slice(0, 10) ?? ""}
                onChange={(e) => update({ conducted_at: e.target.value || null })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="duration_min" className="text-meta font-semibold text-fg-secondary">{iv.fields.duration_min}</label>
              <Input id="duration_min" type="number" min={1} max={600} inputMode="numeric" className="w-24" readOnly={!canEdit}
                value={m.duration_min ?? ""} onChange={(e) => update({ duration_min: e.target.value ? Number(e.target.value) : null })} />
            </div>
          </div>
          <ChipGroup label={iv.fields.mode} options={INTERVIEW_MODES} value={m.mode} disabled={!canEdit} onChange={(mode) => update({ mode })} />
          <ChipGroup label={iv.fields.status} options={INTERVIEW_STATUSES} value={m.status} disabled={!canEdit} onChange={(s) => update({ status: s })} />
        </div>
      </section>

      <section aria-labelledby="answers-h" className="flex flex-col gap-3">
        <h2 id="answers-h" className="text-heading font-semibold">{iv.answers}</h2>
        {!questions ? (
          <p className="text-fg-secondary">{iv.noGuide}</p>
        ) : (
          <ol className="flex flex-col gap-6">
            {GUIDE_SECTIONS.filter((s) => questions.some((q) => q.section === s.value)).map((s) => (
              <li key={s.value} className="flex flex-col gap-3">
                <h3 className="text-caption font-bold tracking-wide text-fg-secondary uppercase">{s.label}</h3>
                <ul className="flex flex-col gap-3">
                  {questions.filter((q) => q.section === s.value).map((q) => {
                    const a = byQuestion.get(q.id);
                    return (
                      <li key={q.id} className="flex flex-col gap-2 rounded-panel border border-line bg-surface p-4">
                        <p className="font-bold">
                          {q.text}
                          {q.is_key && <span className="ml-2 rounded-full bg-fg px-2 py-0.5 align-middle text-caption font-semibold text-canvas">{iv.key}</span>}
                        </p>
                        {q.probes.length > 0 && (
                          <p className="text-meta text-fg-secondary">{iv.probes}: {q.probes.join(" · ")}</p>
                        )}
                        <AnswerField interviewId={interviewId} questionId={q.id} answerId={a?.id ?? null} initial={a?.body_text ?? ""}
                          readOnly={!canEdit} label={`${iv.answers}: ${q.text}`} className="text-body" selectionActions={selectionActions} />
                        <QuoteChips base={base} quotes={quotesOf(a?.id)} />
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section aria-labelledby="notes-h" className="flex flex-col gap-3">
        <h2 id="notes-h" className="text-heading font-semibold">{iv.freeNotes}</h2>
        <ActionError error={removing.error} />
        <ul className="flex flex-col gap-2">
          {notes.map((n, i) => (
            <li key={n.id} className="flex items-start gap-1">
              <div className="flex-1">
                <AnswerField interviewId={interviewId} questionId={null} answerId={n.id} initial={n.body_text} readOnly={!canEdit}
                  label={`${iv.freeNotes} ${i + 1}`} placeholder={iv.notePlaceholder} selectionActions={selectionActions} />
                <QuoteChips base={base} quotes={quotesOf(n.id)} />
              </div>
              {canEdit && (
                <ConfirmIconButton label={`${iv.removeNote} ${i + 1}`} confirm={t.status.confirmDelete} disabled={removing.pending}
                  onConfirm={() => removing.run(() => deleteAnswer(n.id))}
                  className="grid size-9 place-items-center rounded-control text-fg-secondary hover:bg-subtle hover:text-danger" />
              )}
            </li>
          ))}
          {newNotes.map((k, i) => (
            <li key={`new-${k}`}>
              <AnswerField interviewId={interviewId} questionId={null} answerId={null} initial="" readOnly={!canEdit} autoFocus
                label={`${iv.freeNotes} ${notes.length + i + 1}`} placeholder={iv.notePlaceholder} />
            </li>
          ))}
        </ul>
        {canEdit && (
          <button type="button" onClick={() => setNewNotes((n) => [...n, Date.now()])}
            className="self-start rounded-control border-[1.5px] border-fg px-3 py-1.5 text-meta font-semibold hover:bg-subtle">
            + {iv.addNote}
          </button>
        )}
        <div className="rounded-panel border border-line bg-surface p-5">
          <TextField id="notes" label={iv.fields.notes} value={m.notes ?? ""} readOnly={!canEdit} onChange={(notes) => update({ notes })} />
        </div>
      </section>

      {(synthesis.quotes.length > 0 || synthesis.observations.length > 0) && (
        <section aria-labelledby="int-synth-h" className="flex flex-col gap-3">
          <h2 id="int-synth-h" className="text-heading font-semibold">{t.synthesis.quotes.inInterview}</h2>
          <ul className="flex flex-col gap-1.5 rounded-panel border border-line bg-surface p-4">
            {synthesis.quotes.map((q) => (
              <li key={q.id}>
                <Link href={`${base}/synthesis/quotes/${q.code}`} className="flex items-start gap-2 rounded-chip px-1 py-0.5 hover:bg-subtle">
                  <EntityChip type="quote" code={q.code} /><span className="text-meta">«{q.text}»</span>
                </Link>
              </li>
            ))}
            {synthesis.observations.map((o) => (
              <li key={o.id}>
                <Link href={`${base}/synthesis/observations/${o.code}`} className="flex items-start gap-2 rounded-chip px-1 py-0.5 hover:bg-subtle">
                  <EntityChip type="observation" code={o.code} /><span className="text-meta">{o.body_text}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {canEdit && (
        <ConfirmDelete action={deleteInterview} fields={{ id: interviewId }} label={iv.delete} confirm={iv.deleteConfirm} />
      )}
    </div>
  );
}

function QuoteChips({ base, quotes }: { base: string; quotes: InterviewSynthesis["quotes"] }) {
  if (!quotes.length) return null;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {quotes.map((q) => (
        <li key={q.id}>
          <Link href={`${base}/synthesis/quotes/${q.code}`} title={q.text}><EntityChip type="quote" code={q.code} title={q.text} /></Link>
        </li>
      ))}
    </ul>
  );
}
