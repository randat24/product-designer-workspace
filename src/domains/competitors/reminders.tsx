"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import { t } from "@/shared/i18n/ru";
import { setReminderDone } from "./actions";
import type { Reminder } from "./queries";

const r = t.competitors.reminders;

/**
 * "Где мы можем быть лучше": notes on competitors' red cells, shown on the competitor matrices
 * and while designing screens and flows, until marked done.
 */
export function RemindersPanel({ base, initial, canEdit, compact = false }: {
  base: string; initial: Reminder[]; canEdit: boolean; compact?: boolean;
}) {
  const [items, setItems] = useState(initial);
  const open = items.filter((x) => !x.done);
  const done = items.filter((x) => x.done);
  if (compact && open.length === 0) return null;

  const toggle = async (x: Reminder) => {
    const key = (y: Reminder) => `${y.competitorId}:${y.featureId}`;
    setItems((xs) => xs.map((y) => (key(y) === key(x) ? { ...y, done: !y.done } : y)));
    const res = await setReminderDone(x.competitorId, x.featureId, !x.done);
    if (!res.ok) setItems((xs) => xs.map((y) => (key(y) === key(x) ? x : y)));
  };

  const row = (x: Reminder) => (
    <li key={`${x.competitorId}:${x.featureId}`} className="flex items-start gap-2.5 py-2">
      <input type="checkbox" checked={x.done} disabled={!canEdit} onChange={() => toggle(x)}
        aria-label={`${r.done}: ${x.note}`} className="mt-0.5 size-4 shrink-0 accent-[var(--success)]" />
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm leading-snug font-semibold", x.done && "text-fg-secondary line-through")}>{x.note}</p>
        <p className="text-caption text-fg-secondary">
          <Link href={`${base}/competitors/${x.kind === "ux" ? "ux" : "matrix"}`} className="hover:underline">{r.source[x.kind]}</Link>
          {" · "}<Link href={`${base}/competitors/${x.competitorCode}`} className="hover:underline">{x.competitor}</Link>
          {" · "}{x.feature}
        </p>
      </div>
    </li>
  );

  return (
    <section aria-labelledby="reminders-h" className="flex flex-col gap-2 rounded-panel border-[1.5px] border-danger/40 bg-surface p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="reminders-h" className="font-bold">💡 {r.title}</h2>
        <span className={cn("text-caption font-semibold", open.length ? "text-danger" : "text-success")}>
          {open.length ? r.open(open.length) : r.allDone}
        </span>
      </div>
      {!compact && <p className="text-meta text-fg-secondary">{r.lede}</p>}
      {items.length === 0 ? <p className="text-meta text-fg-secondary">{r.empty}</p> : (
        <ul className="divide-y divide-line">{open.map(row)}</ul>
      )}
      {!compact && done.length > 0 && (
        <details>
          <summary className="cursor-pointer text-caption font-semibold text-fg-secondary hover:text-fg">{r.showDone(done.length)}</summary>
          <ul className="divide-y divide-line">{done.map(row)}</ul>
        </details>
      )}
    </section>
  );
}
