"use client";

import { X } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { t } from "@/shared/i18n/uk";
import { IconButton } from "@/shared/ui/button";
import { transient } from "@/shared/lib/action-result";
import { ChipGroup } from "@/shared/ui/chips";
import { Textarea } from "@/shared/ui/field";
import { deleteReview, saveReview } from "./actions";
import { average1, reviewOverall, type ReviewCriterion, type ReviewCriterionInfo } from "./schema";
import type { ScreenReview } from "./queries";

const rv = t.screens.review;
const SCORES = Array.from({ length: 10 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }));
const EMPTY: ScreenReview["scores"] = { familiar: null, choice: null, memory: null, gestalt: null, motion: null, quality: null };
/** Id of my review shown before the database has created it. */
const PENDING = "pending";
const fmt = (n: number | null) => (n === null ? rv.none : n.toFixed(1).replace(".0", ""));
const scaleOf = (n: number) => rv.scale.find((s) => n >= s.from && n <= s.to)?.label ?? "";

type Patch = Partial<Record<ReviewCriterion, number | null>> & { note?: string };

/**
 * A screen scored by the team (awwwards' jury votes, on the laws of UX): my own scores, one row of 1–10 per
 * group of laws with its question, saved as each is picked (picking the chosen score again takes it back);
 * then every reviewer's scores and the average. Optimistic: a choice shows at once. The writes go to the
 * database one after another, and when the last one answers the panel settles on my review as the database
 * holds it, so quick clicks or a removal during a save can never leave the panel and the database apart.
 */
export function ReviewPanel({ screenId, criteria, initial, userId, canEdit }: {
  screenId: string; criteria: ReviewCriterionInfo[]; initial: ScreenReview[]; userId: string | null; canEdit: boolean;
}) {
  const [reviews, setReviews] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  // The note field remounts (empty) only when my review is removed, never while it is being created.
  const [noteKey, setNoteKey] = useState(0);
  // My review as the database last confirmed it, and the queue of writes not answered yet.
  const stored = useRef<ScreenReview | null>(initial.find((r) => r.reviewerId === userId) ?? null);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const waiting = useRef(0);
  // The first refusal in a run of writes: shown when the run settles, even if later writes went through.
  const refused = useRef<string | null>(null);
  const mine = reviews.find((r) => r.reviewerId === userId) ?? null;
  const scored = reviews.map((r) => reviewOverall(r.scores)).filter((n): n is number => n !== null);
  const average = average1(scored);

  /** The list with my review replaced by `next` (or taken out when null). */
  const withMine = (rs: ScreenReview[], next: ScreenReview | null) =>
    next ? (rs.some((r) => r.reviewerId === userId) ? rs.map((r) => (r.reviewerId === userId ? next : r)) : [...rs, next])
      : rs.filter((r) => r.reviewerId !== userId);

  /** Runs a write after the ones before it; when it is the last, the panel shows what the database holds. */
  const enqueue = <T extends { ok: true } | { ok: false; error: string }>(write: () => Promise<T>, onOk: (res: T) => void): Promise<boolean> => {
    waiting.current++;
    const done = queue.current.then(async () => {
      let ok = false;
      try {
        const res: T | ReturnType<typeof transient> = await write().catch(() => transient());
        ok = res.ok;
        if (res.ok) onOk(res as T); else refused.current ??= res.error;
      } finally {
        // Whatever happened above, this write is answered; the last one settles the panel on the database.
        if (--waiting.current === 0) {
          setReviews((rs) => withMine(rs, stored.current));
          setError(refused.current);
          refused.current = null;
        }
      }
      return ok;
    });
    // A write that threw must not stop the ones after it.
    queue.current = done.catch(() => false);
    return done.catch(() => false);
  };

  const save = (patch: Patch): Promise<boolean> => {
    if (!userId) return Promise.resolve(false);
    setReviews((rs) => {
      const base = rs.find((r) => r.reviewerId === userId) ?? { id: PENDING, reviewerId: userId, name: null, scores: EMPTY, note: null };
      const { note, ...scores } = patch;
      return withMine(rs, { ...base, scores: { ...base.scores, ...scores }, ...(note !== undefined ? { note: note || null } : {}) });
    });
    return enqueue(() => saveReview(screenId, patch), (res) => {
      if (res.ok) stored.current = res.review ? { reviewerId: userId, name: stored.current?.name ?? null, ...res.review } : null;
    });
  };

  const clear = () => {
    if (!mine) return;
    setReviews((rs) => withMine(rs, null));
    void enqueue(() => deleteReview(screenId), () => { stored.current = null; setNoteKey((k) => k + 1); });
  };

  return (
    <section aria-labelledby="review-h" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="review-h" className="text-heading font-semibold">{rv.title}</h2>
        <span className="text-meta font-semibold text-fg-secondary">
          {average === null ? rv.count(0) : `${rv.outOf(fmt(average))} · ${rv.count(scored.length)}`}
        </span>
      </div>
      <p className="text-meta text-fg-secondary">{rv.lede}</p>
      {error && <p role="alert" className="text-meta font-semibold text-danger">{error}</p>}

      {canEdit && userId && (
        <div className="flex flex-col gap-2.5 rounded-panel border border-line bg-surface p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold">{rv.mine}</h3>
            <div className="flex items-center gap-1.5">
              {mine && <span className="text-meta font-semibold">{rv.overall}: {fmt(reviewOverall(mine.scores))}</span>}
              {mine && (
                <IconButton tone="danger" size="sm" label={rv.clear} onClick={clear}><X className="size-4" /></IconButton>
              )}
            </div>
          </div>
          <ul className="flex flex-col gap-4">
            {criteria.map((c) => {
              const value = mine?.scores[c.key] ?? null;
              return (
                <li key={c.key} className="flex flex-col gap-1">
                  <ChipGroup label={c.title} options={SCORES} value={value === null ? "" : String(value)} size="sm"
                    onChange={(v) => save({ [c.key]: Number(v) === value ? null : Number(v) })} />
                  <p className="text-caption text-fg-secondary">
                    {c.question}{value !== null && <span className="font-semibold text-fg"> · {scaleOf(value)}</span>}
                  </p>
                </li>
              );
            })}
          </ul>
          <NoteInput key={noteKey} initial={mine?.note ?? ""} onSave={(note) => save({ note })} />
        </div>
      )}

      <h3 className="mt-2 font-bold">{rv.team}</h3>
      {reviews.length === 0 ? <p className="text-fg-secondary">{rv.teamEmpty}</p> : (
        <ul className="flex flex-col gap-2">
          {reviews.map((r) => (
            <li key={r.reviewerId} aria-busy={r.id === PENDING || undefined}
              className={cn("enter flex flex-col gap-2.5 rounded-panel border border-line bg-surface p-3.5", r.id === PENDING && "opacity-60")}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-semibold">{r.reviewerId === userId ? rv.you : r.name || rv.unnamed}</span>
                <span className="text-meta font-semibold">{rv.overall}: {fmt(reviewOverall(r.scores))}</span>
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
                {criteria.map((c) => (
                  <div key={c.key} className="flex items-baseline justify-between gap-2 text-meta">
                    <dt className="text-fg-secondary">{c.title}</dt>
                    <dd className="font-semibold tabular-nums">{fmt(r.scores[c.key])}</dd>
                  </div>
                ))}
              </dl>
              {r.note && <p className="text-meta text-fg-secondary">{r.note}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** The note, saved when the field is left with a value other than the one saved last (a refused one is retried). */
function NoteInput({ initial, onSave }: { initial: string; onSave: (v: string) => Promise<boolean> }) {
  const [value, setValue] = useState(initial);
  const saved = useRef(initial);
  return (
    <Textarea aria-label={rv.note} placeholder={rv.note} value={value} maxLength={1000} rows={2}
      className="resize-y text-meta [field-sizing:content]" onChange={(e) => setValue(e.target.value)}
      onBlur={async () => { if (value !== saved.current && (await onSave(value))) saved.current = value; }} />
  );
}
