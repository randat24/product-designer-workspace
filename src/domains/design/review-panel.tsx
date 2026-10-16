"use client";

import { X } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { t } from "@/shared/i18n/uk";
import { IconButton } from "@/shared/ui/button";
import { ChipGroup } from "@/shared/ui/chips";
import { Textarea } from "@/shared/ui/field";
import { deleteReview, saveReview } from "./actions";
import { reviewOverall, type ReviewCriterion, type ReviewCriterionInfo } from "./schema";
import type { ScreenReview } from "./queries";

const rv = t.screens.review;
const SCORES = Array.from({ length: 10 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }));
const EMPTY: ScreenReview["scores"] = { familiar: null, choice: null, memory: null, gestalt: null, motion: null, quality: null };
/** Id of my review shown before the database has created it. */
const PENDING = "pending";
const fmt = (n: number | null) => (n === null ? rv.none : n.toFixed(1).replace(".0", ""));
const scaleOf = (n: number) => rv.scale.find((s) => n >= s.from && n <= s.to)?.label ?? "";

type Patch = Partial<Record<ReviewCriterion, number>> & { note?: string };

/**
 * A screen scored by the team (awwwards' jury votes, on the laws of UX): my own scores, one row of 1–10 per
 * group of laws with its question, saved as each is picked; then every reviewer's scores and the average.
 * Optimistic like StatesPanel: the choice shows at once, and only that choice goes back if the database refuses.
 */
export function ReviewPanel({ screenId, criteria, initial, userId, canEdit }: {
  screenId: string; criteria: ReviewCriterionInfo[]; initial: ScreenReview[]; userId: string | null; canEdit: boolean;
}) {
  const [reviews, setReviews] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  // The note field remounts (empty) only when my review is removed, never while it is being created.
  const [noteKey, setNoteKey] = useState(0);
  const mine = reviews.find((r) => r.reviewerId === userId) ?? null;
  const pending = mine?.id === PENDING;
  const scored = reviews.map((r) => reviewOverall(r.scores)).filter((n): n is number => n !== null);
  const average = scored.length ? Math.round((scored.reduce((a, b) => a + b, 0) / scored.length) * 10) / 10 : null;

  const apply = (rs: ScreenReview[], patch: Patch, id?: string): ScreenReview[] => {
    const base = rs.find((r) => r.reviewerId === userId) ?? { id: PENDING, reviewerId: userId!, name: null, scores: EMPTY, note: null };
    const { note, ...scores } = patch;
    const next = { ...base, ...(id ? { id } : {}), scores: { ...base.scores, ...scores }, ...(note !== undefined ? { note: note || null } : {}) };
    return rs.some((r) => r.reviewerId === userId) ? rs.map((r) => (r.reviewerId === userId ? next : r)) : [...rs, next];
  };

  const save = async (patch: Patch): Promise<boolean> => {
    if (!userId) return false;
    // What to put back if this save is refused: only the fields it changed, as they were.
    const was = mine;
    const undo: Patch = Object.fromEntries(Object.keys(patch).map((k) => [k, k === "note" ? (was?.note ?? "") : (was?.scores[k as ReviewCriterion] ?? null)]));
    setReviews((rs) => apply(rs, patch));
    const res = await saveReview(screenId, patch);
    if (!res.ok) {
      // Put back only what this save changed; a review still being created goes only if nothing is left in it.
      setReviews((rs) => apply(rs, undo).filter((r) => r.reviewerId !== userId || r.id !== PENDING
        || r.note || Object.values(r.scores).some((v) => v !== null)));
      setError(res.error);
      return false;
    }
    setError(null);
    if (res.id) setReviews((rs) => apply(rs, {}, res.id));
    return true;
  };

  const clear = async () => {
    if (!mine || pending) return;
    const was = mine;
    setReviews((rs) => rs.filter((r) => r.reviewerId !== userId));
    const res = await deleteReview(screenId);
    if (res.ok) { setError(null); setNoteKey((k) => k + 1); }
    else { setReviews((rs) => [...rs, was]); setError(res.error); }
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
                // Until the database has created my review there is nothing to remove yet.
                <IconButton tone="danger" size="sm" label={rv.clear} disabled={pending} onClick={clear}><X className="size-4" /></IconButton>
              )}
            </div>
          </div>
          <ul className="flex flex-col gap-4">
            {criteria.map((c) => {
              const value = mine?.scores[c.key] ?? null;
              return (
                <li key={c.key} className="flex flex-col gap-1">
                  <ChipGroup label={c.title} options={SCORES} value={value === null ? "" : String(value)} size="sm"
                    onChange={(v) => Number(v) !== value && save({ [c.key]: Number(v) })} />
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
