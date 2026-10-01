"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/shared/lib/cn";
import { t } from "@/shared/i18n/uk";
import { createObservation, createQuote } from "./actions";
import { OBSERVATION_KINDS, type ObservationKind } from "./schema";

type Selection = {
  text: string;
  start: number;
  end: number;
  getAnswerId: () => Promise<string | null>;
  clear: () => void;
};

/**
 * Toolbar under a selected answer fragment: one action makes a quote (traced to
 * the answer) or an observation of a chosen kind. Alt+Q / Alt+O do the same.
 */
export function SelectionActions({ selection, projectId, interviewId, base }: {
  selection: Selection;
  projectId: string;
  interviewId: string;
  base: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [created, setCreated] = useState<{ code: string; href: string } | null>(null);
  const [kind, setKind] = useState<ObservationKind>("pain");
  const [failed, setFailed] = useState(false);

  const quote = () => startTransition(async () => {
    const answerId = await selection.getAnswerId();
    const res = await createQuote({ interviewId, answerId, text: selection.text, start: selection.start, end: selection.end });
    setFailed(!res.ok);
    if (res.ok && res.code) { setCreated({ code: res.code, href: `${base}/synthesis/quotes/${res.code}` }); router.refresh(); }
  });
  const observe = () => startTransition(async () => {
    const res = await createObservation({ projectId, interviewId, kind, text: selection.text });
    setFailed(!res.ok);
    if (res.ok && res.code) { setCreated({ code: res.code, href: `${base}/synthesis/observations/${res.code}` }); router.refresh(); }
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey || pending) return;
      if (e.code === "KeyQ") { e.preventDefault(); quote(); }
      if (e.code === "KeyO") { e.preventDefault(); observe(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div role="toolbar" aria-label={t.synthesis.quotes.selectHint}
      className="mt-1.5 flex flex-wrap items-center gap-1.5 rounded-control bg-fg px-2 py-1.5 text-canvas shadow-lg">
      <span className="max-w-60 truncate px-1 text-caption opacity-70">«{selection.text}»</span>
      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={quote} disabled={pending}
        className="rounded-chip bg-canvas px-2.5 py-1 text-meta font-bold text-fg disabled:opacity-50" title="Alt+Q">
        {t.synthesis.quotes.fromSelection} <span className="font-normal opacity-60">⌥Q</span>
      </button>
      <span className="flex items-center gap-1">
        <select aria-label={t.synthesis.board.kind} value={kind} onChange={(e) => setKind(e.target.value as ObservationKind)}
          onMouseDown={(e) => e.stopPropagation()}
          className="h-8 rounded-chip border border-canvas/30 bg-transparent px-1 text-meta [&>option]:text-fg">
          {OBSERVATION_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
        </select>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={observe} disabled={pending}
          className="rounded-chip border border-canvas/40 px-2.5 py-1 text-meta font-bold disabled:opacity-50" title="Alt+O">
          {t.synthesis.quotes.observationFromSelection} <span className="font-normal opacity-60">⌥O</span>
        </button>
      </span>
      <span role="status" aria-live="polite" className={cn("px-1 text-caption font-semibold", failed && "text-[#ffb4ab]")}>
        {failed ? t.autosave.failed : created && <Link href={created.href} className="underline underline-offset-2">{t.synthesis.quotes.created(created.code)}</Link>}
      </span>
    </div>
  );
}
