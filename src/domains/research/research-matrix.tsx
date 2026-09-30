"use client";

import Link from "next/link";
import { useFieldAutosave } from "@/shared/ui/autosave";
import { cn } from "@/shared/lib/cn";
import { t } from "@/shared/i18n/ru";
import { ActionError, useAction } from "@/shared/ui/use-action";
import { addRespondent, renameParticipant } from "./actions";
import { AnswerField } from "./answer-field";
import { participantTitle } from "./schema";
import type { GuideQuestion } from "./queries";

const mx = t.research.matrix;
const STICKY = ["var(--s1)", "var(--s2)", "var(--s3)", "var(--s4)", "var(--s5)", "var(--s6)", "var(--s7)"];

type Column = {
  id: string;
  code: string;
  participant: { id: string; code: string; display_name: string | null; role: string | null } | null;
};

/** Question × Participant repository, laid out like the notebook's research table. */
export function ResearchMatrix({ projectId, guideId, base, questions, interviews, cells, canEdit }: {
  projectId: string;
  guideId: string;
  base: string;
  questions: GuideQuestion[];
  interviews: Column[];
  cells: Record<string, { id: string; text: string }>;
  canEdit: boolean;
}) {
  const { pending, run, error } = useAction();

  if (questions.length === 0) {
    return <p className="rounded-panel border-[1.5px] border-dashed border-line p-7 text-center text-fg-secondary">{mx.noQuestions}</p>;
  }

  return (
    <>
    <ActionError error={error} className="mb-2 text-meta text-danger" />
    {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- scrolls sideways: reachable by keyboard */}
    <div tabIndex={0} role="region" aria-label={mx.title} className="overflow-x-auto rounded-panel border border-line bg-surface">
      <table className="min-w-full border-collapse">
        <thead>
          <tr>
            <th scope="col" className="sticky left-0 z-[1] min-w-[170px] max-w-[210px] border-r border-b border-line bg-surface p-3 text-left align-bottom text-meta font-bold sm:min-w-[210px]">
              {mx.question}
            </th>
            {interviews.map((iv, i) => (
              <th key={iv.id} scope="col" className="min-w-[220px] max-w-[250px] border-b border-line p-2.5 align-bottom font-normal">
                {iv.participant && (
                  <StickyHeader color={STICKY[i % 7]!} tilt={i % 2 ? "rotate-[.7deg]" : "-rotate-[.6deg]"} participant={iv.participant}
                    href={`${base}/research/interviews/${iv.code}`} canEdit={canEdit} />
                )}
              </th>
            ))}
            {canEdit && (
              <th className="min-w-[120px] border-b border-line p-2.5 align-middle">
                <button type="button" disabled={pending}
                  onClick={() => run(() => addRespondent(projectId, guideId))}
                  className="rounded-control border-[1.5px] border-fg px-3 py-1.5 text-sm font-semibold whitespace-nowrap hover:bg-subtle disabled:opacity-50">
                  {mx.addRespondent}
                </button>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {questions.map((q) => (
            <tr key={q.id}>
              <th scope="row" className="sticky left-0 z-[1] max-w-[210px] border-r border-b border-line bg-surface p-3 text-left align-top text-meta font-bold">
                {q.text}
              </th>
              {interviews.map((iv, i) => {
                const cell = cells[`${q.id}:${iv.id}`];
                const who = iv.participant ? `${iv.participant.code} · ${participantTitle(iv.participant)}` : iv.code;
                return (
                  <td key={iv.id} className="border-b border-line p-2 align-top"
                    style={{ background: `color-mix(in srgb, ${STICKY[i % 7]} 16%, var(--surface))` }}>
                    <AnswerField interviewId={iv.id} questionId={q.id} answerId={cell?.id ?? null} initial={cell?.text ?? ""}
                      readOnly={!canEdit} rows={4} label={mx.cellLabel(q.text, who)} placeholder={mx.answerPlaceholder}
                      className="min-h-[90px] bg-transparent px-1.5 py-1 text-meta focus:bg-surface" />
                  </td>
                );
              })}
              {canEdit && <td className="border-b border-line" />}
            </tr>
          ))}
        </tbody>
      </table>
      {interviews.length === 0 && <p className="p-5 text-center text-fg-secondary">{mx.noInterviews}</p>}
    </div>
    </>
  );
}

function StickyHeader({ color, tilt, participant, href, canEdit }: {
  color: string;
  tilt: string;
  participant: NonNullable<Column["participant"]>;
  href: string;
  canEdit: boolean;
}) {
  const name = useFieldAutosave(participant.display_name ?? "", (v) => renameParticipant(participant.id, { display_name: v }), canEdit);
  const role = useFieldAutosave(participant.role ?? "", (v) => renameParticipant(participant.id, { role: v }), canEdit);
  const input = "w-full rounded-chip border border-transparent bg-transparent p-0.5 text-center text-on-sticky placeholder:text-on-sticky/80 focus:bg-white/55 focus:outline-none";
  return (
    <div className={cn("flex flex-col gap-0.5 rounded-chip px-2.5 pt-2.5 pb-2 text-center text-on-sticky shadow-[0_6px_10px_-6px_rgba(0,0,0,.35)]", tilt)}
      style={{ background: color }}>
      <Link href={href} className="self-end text-caption font-semibold opacity-80 hover:opacity-100">{participant.code} →</Link>
      <input aria-label={`${mx.namePlaceholder} ${participant.code}`} value={name.value} readOnly={!canEdit} maxLength={120}
        placeholder={mx.namePlaceholder} onChange={(e) => name.onChange(e.target.value)} onBlur={name.onBlur}
        className={cn(input, "text-body font-bold")} />
      <input aria-label={`${mx.rolePlaceholder} ${participant.code}`} value={role.value} readOnly={!canEdit} maxLength={200}
        placeholder={mx.rolePlaceholder} onChange={(e) => role.onChange(e.target.value)} onBlur={role.onBlur}
        className={cn(input, "text-sm")} />
    </div>
  );
}
