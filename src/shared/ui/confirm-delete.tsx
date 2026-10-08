"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/shared/lib/cn";
import { ActionError, useAction, type ActionResult } from "@/shared/ui/use-action";

/**
 * Two-step delete: the first press turns the button into «Точно удалить?», the second submits;
 * leaving the button resets it. No modal — work is not interrupted (docs/UX_LAWS.md UX-25), and a
 * misclick cannot lose data (UX-27). One component for every entity (docs/QUALITY_REVIEW.md D5).
 */
export function ConfirmDelete({ action, fields, label, confirm }: {
  action: (formData: FormData) => Promise<ActionResult>;
  /** Hidden form fields, e.g. { id } or { type, id }. */
  fields: Record<string, string>;
  label: string;
  confirm: string;
}) {
  const [armed, setArmed] = useState(false);
  // A refused or failed delete says so next to the button (docs/HANDOFF_TRIAGE.md, F03).
  const { pending, run, error } = useAction();
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      if (!armed) { setArmed(true); return; }
      const data = new FormData(e.currentTarget);
      setArmed(false);
      run(() => action(data));
    }}>
      {Object.entries(fields).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
      <button type="submit" onBlur={() => setArmed(false)} disabled={pending} aria-live="polite"
        className={cn(
          "inline-flex h-9 items-center rounded-control border px-3.5 text-sm font-semibold disabled:opacity-50",
          armed ? "border-danger bg-danger text-on-status" : "border-line text-danger hover:border-danger",
        )}>
        {armed ? confirm : label}
      </button>
      <ActionError error={error} className="mt-1.5 text-meta text-danger" />
    </form>
  );
}

/**
 * Icon-sized two-step delete (×) for rows, columns and notes: the first press shows «Удалить?»,
 * the second runs `onConfirm`; leaving resets. Prevents losing data to a stray tap on a phone.
 */
export function ConfirmIconButton({ label, confirm, onConfirm, disabled, className }: {
  label: string;
  confirm: string;
  onConfirm: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const [armed, setArmed] = useState(false);
  return (
    <button type="button" disabled={disabled} aria-label={armed ? confirm : label} aria-live="polite"
      onClick={() => { if (armed) { setArmed(false); onConfirm(); } else setArmed(true); }}
      onBlur={() => setArmed(false)}
      className={cn(armed ? "rounded-control bg-danger px-2 text-caption font-semibold text-on-status" : className)}>
      {armed ? confirm : <X aria-hidden className="size-4" />}
    </button>
  );
}
