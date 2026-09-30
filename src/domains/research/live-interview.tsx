"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/shared/lib/cn";
import { t } from "@/shared/i18n/ru";
import { setInterviewStatus } from "./actions";
import { AnswerField } from "./answer-field";
import { sectionLabel } from "./schema";
import type { GuideQuestion, InterviewAnswer } from "./queries";

const lv = t.research.live;

type Step =
  | { kind: "intro"; text: string | null }
  | { kind: "question"; q: GuideQuestion }
  | { kind: "outro"; text: string | null };

/**
 * Live interview (docs/IA.md: /research/interviews/[code]/live): one question at a time,
 * large input, timer. Built for a tablet held in landscape or portrait (768px+),
 * usable on a phone. All answer fields stay mounted so nothing typed is lost.
 */
export function LiveInterview({ interviewId, code, participant, status: initialStatus, startedAt: initialStart, intro, outro, questions, answers, detailHref, canEdit }: {
  interviewId: string;
  /** conducted_at of an interview already in progress, so the timer survives a reload. */
  startedAt: string | null;
  code: string;
  participant: string;
  status: string;
  intro: string | null;
  outro: string | null;
  questions: GuideQuestion[];
  answers: InterviewAnswer[];
  detailHref: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState(initialStatus);
  const [startedAt, setStartedAt] = useState<number | null>(
    initialStatus === "in_progress" ? (initialStart ? new Date(initialStart).getTime() : Date.now()) : null,
  );
  const [now, setNow] = useState(Date.now());
  const [i, setI] = useState(0);

  const steps: Step[] = [{ kind: "intro", text: intro }, ...questions.map((q) => ({ kind: "question" as const, q })), { kind: "outro", text: outro }];
  const step = steps[i]!;
  const byQuestion = new Map(answers.filter((a) => a.question_id).map((a) => [a.question_id!, a]));
  const note = answers.find((a) => !a.question_id);
  const finished = status === "done" || status === "synthesized";

  useEffect(() => {
    if (!startedAt || finished) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startedAt, finished]);

  // Focus lands in the interview, not behind it (it covers the page like a modal).
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => root.current?.focus(), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Esc: in a text field it only leaves the field (no lost context mid-sentence); otherwise it exits.
      if (e.key === "Escape") {
        const el = document.activeElement;
        if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) el.blur();
        else router.push(detailHref);
        return;
      }
      if (!e.altKey) return;
      if (e.key === "ArrowRight") { e.preventDefault(); setI((x) => Math.min(x + 1, steps.length - 1)); }
      if (e.key === "ArrowLeft") { e.preventDefault(); setI((x) => Math.max(x - 1, 0)); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [steps.length, router, detailHref]);

  const elapsed = startedAt ? Math.max(0, Math.floor((now - startedAt) / 1000)) : 0;
  const clock = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;

  const start = () => startTransition(async () => {
    const res = await setInterviewStatus(interviewId, "in_progress");
    if (res.ok) { const t0 = Date.now(); setStatus("in_progress"); setStartedAt(t0); setNow(t0); setI(Math.min(1, steps.length - 1)); }
  });
  const finish = () => startTransition(async () => {
    const res = await setInterviewStatus(interviewId, "done", startedAt ? (Date.now() - startedAt) / 60000 : undefined);
    if (res.ok) { setStatus("done"); router.refresh(); }
  });

  return (
    <div ref={root} tabIndex={-1} role="dialog" aria-modal="true" aria-label={`${lv.title} ${code}`}
      className="fixed inset-0 z-40 flex flex-col bg-canvas focus:outline-none">
      <header className="flex items-center justify-between gap-3 bg-rail px-4 py-3 text-rail-fg sm:px-6">
        <div className="min-w-0">
          <p className="text-caption font-semibold opacity-70">{lv.title} · {code}</p>
          <p className="truncate font-display text-xl leading-tight font-bold uppercase">{participant}</p>
        </div>
        <div className="flex items-center gap-3">
          {startedAt && (
            <span className="display-num text-2xl tabular-nums" role="timer" aria-label={`${lv.timer} ${clock}`}>{clock}</span>
          )}
          <Link href={detailHref} className="rounded-lg border border-rail-fg/30 px-3 py-1.5 text-sm font-semibold hover:border-rail-fg/70">{lv.exit}</Link>
        </div>
      </header>

      <div className="h-1 bg-line" aria-hidden>
        <div className="h-full bg-fg transition-[width] duration-[240ms]" style={{ width: `${((i + 1) / steps.length) * 100}%` }} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-10 sm:py-10">
        <div className="mx-auto flex max-w-3xl flex-col gap-5">
          <p className="text-sm font-semibold text-fg-secondary tabular-nums" aria-live="polite">
            {lv.step(i + 1, steps.length)} · {step.kind === "question" ? sectionLabel(step.q.section) : step.kind === "intro" ? lv.intro : lv.outro}
          </p>

          {step.kind !== "question" && (
            <p className="text-lg leading-relaxed whitespace-pre-line">{step.text || "—"}</p>
          )}
          {step.kind === "question" && (
            <>
              <h1 className="text-[26px] leading-tight font-bold sm:text-[32px]">{step.q.text}</h1>
              {step.q.probes.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  {step.q.probes.map((p) => (
                    <li key={p} className="rounded-full border-[1.5px] border-line px-3 py-1 text-sm font-semibold text-fg-secondary">↳ {p}</li>
                  ))}
                </ul>
              )}
            </>
          )}

          {/* Every field stays mounted; only the current one is shown. */}
          {questions.map((q, k) => {
            const a = byQuestion.get(q.id);
            return (
              <div key={q.id} hidden={step.kind !== "question" || step.q.id !== q.id}>
                <AnswerField interviewId={interviewId} questionId={q.id} answerId={a?.id ?? null} initial={a?.body_text ?? ""}
                  readOnly={!canEdit} rows={8} label={`${t.research.interview.answers}: ${q.text}`} placeholder={lv.answerPlaceholder}
                  id={`live-answer-${k}`} className="min-h-[40vh] text-lg" />
              </div>
            );
          })}
          <div hidden={step.kind !== "outro"} className="flex flex-col gap-2">
            <h2 className="text-heading font-semibold">{lv.notes}</h2>
            <AnswerField interviewId={interviewId} questionId={null} answerId={note?.id ?? null} initial={note?.body_text ?? ""}
              readOnly={!canEdit} rows={5} label={lv.notes} placeholder={t.research.interview.notePlaceholder} className="text-lg" />
          </div>

          {step.kind === "intro" && canEdit && !startedAt && !finished && (
            <button type="button" onClick={start} disabled={pending}
              className="self-start rounded-[12px] bg-fg px-6 py-3.5 text-lg font-bold text-canvas disabled:opacity-50">
              {lv.start}
            </button>
          )}
          {step.kind === "outro" && canEdit && !finished && (
            <button type="button" onClick={finish} disabled={pending}
              className="self-start rounded-[12px] bg-success px-6 py-3.5 text-lg font-bold text-white disabled:opacity-50">
              {lv.finish}
            </button>
          )}
          {finished && step.kind === "outro" && (
            <p role="status" className="flex flex-wrap items-center gap-3 font-semibold text-success">
              ✓ {lv.finished}
              <Link href={detailHref} className="text-fg underline underline-offset-2">{lv.toDetail}</Link>
            </p>
          )}
        </div>
      </div>

      <footer className="flex items-center justify-between gap-3 border-t border-line bg-surface px-4 py-3 sm:px-6">
        <button type="button" onClick={() => setI((x) => Math.max(x - 1, 0))} disabled={i === 0}
          className="h-12 min-w-28 rounded-[12px] border-[1.5px] border-fg px-5 text-base font-bold disabled:opacity-30">
          ← {lv.prev}
        </button>
        <p className="hidden text-caption text-fg-secondary md:block">{lv.shortcuts}</p>
        <button type="button" onClick={() => setI((x) => Math.min(x + 1, steps.length - 1))} disabled={i === steps.length - 1}
          className={cn("h-12 min-w-28 rounded-[12px] bg-fg px-5 text-base font-bold text-canvas disabled:opacity-30")}>
          {lv.next} →
        </button>
      </footer>
    </div>
  );
}
