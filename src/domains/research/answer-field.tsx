"use client";

import { useRef, useState, type ReactNode } from "react";
import { useFieldAutosave } from "@/shared/ui/autosave";
import { cn } from "@/shared/lib/cn";
import { t } from "@/shared/i18n/ru";
import { saveAnswer } from "./actions";

/**
 * Autosaving answer to one question (or a free note when questionId is null).
 * Remembers the created row id so later saves update the same answer.
 */
export type AnswerSelection = {
  text: string;
  start: number;
  end: number;
  /** Saves pending text first, then returns the answer row id. */
  getAnswerId: () => Promise<string | null>;
  clear: () => void;
};

export function AnswerField({ interviewId, questionId, answerId, initial, readOnly, label, placeholder, className, id, rows = 3, autoFocus, selectionActions }: {
  interviewId: string;
  questionId: string | null;
  answerId: string | null;
  initial: string;
  readOnly: boolean;
  label: string;
  placeholder?: string;
  className?: string;
  id?: string;
  rows?: number;
  autoFocus?: boolean;
  /** Toolbar shown while a fragment is selected (quote / observation from selection). */
  selectionActions?: (selection: AnswerSelection) => ReactNode;
}) {
  const [sel, setSel] = useState<{ start: number; end: number } | null>(null);
  const rowId = useRef(answerId);
  const field = useFieldAutosave(initial, async (text) => {
    const res = await saveAnswer({ interviewId, questionId, answerId: rowId.current, text });
    if (res.ok && res.id) rowId.current = res.id;
    return res;
  }, !readOnly);

  const onSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const { selectionStart: start, selectionEnd: end } = e.currentTarget;
    setSel(end > start && field.value.slice(start, end).trim() ? { start, end } : null);
  };
  const selection: AnswerSelection | null = sel && {
    text: field.value.slice(sel.start, sel.end).trim(),
    start: sel.start + (field.value.slice(sel.start, sel.end).length - field.value.slice(sel.start, sel.end).trimStart().length),
    end: sel.end - (field.value.slice(sel.start, sel.end).length - field.value.slice(sel.start, sel.end).trimEnd().length),
    getAnswerId: async () => {
      await field.onBlur();
      return rowId.current;
    },
    clear: () => setSel(null),
  };

  return (
    <div onBlur={(e) => {
      // Drop the selection when focus leaves both the field and its toolbar.
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setSel(null);
    }}>
      <div className="relative">
      <textarea id={id} aria-label={label} value={field.value} readOnly={readOnly} rows={rows} autoFocus={autoFocus}
        onSelect={selectionActions ? onSelect : undefined}
        placeholder={placeholder ?? t.research.interview.answerPlaceholder} maxLength={20000}
        onChange={(e) => field.onChange(e.target.value)} onBlur={field.onBlur}
        aria-invalid={field.status === "error"}
        className={cn(
          "w-full resize-y rounded-lg border border-transparent bg-subtle px-3 py-2 leading-normal font-medium [field-sizing:content]",
          "placeholder:font-normal placeholder:text-fg-secondary hover:border-line focus:border-fg focus:bg-surface focus:outline-none",
          "aria-[invalid=true]:border-danger",
          className,
        )} />
      <span aria-live="polite" className="pointer-events-none absolute right-2 bottom-1.5 text-caption text-fg-secondary">
        {field.status === "saving" ? t.autosave.saving : field.status === "error" ? <span className="text-danger">{t.autosave.failed}</span> : ""}
      </span>
      </div>
      {selectionActions && selection && selectionActions(selection)}
    </div>
  );
}
