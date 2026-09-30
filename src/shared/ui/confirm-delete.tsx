"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/shared/lib/cn";

/**
 * Two-step delete: the first press turns the button into «Точно удалить?», the second submits;
 * leaving the button resets it. No modal — work is not interrupted (docs/UX_LAWS.md UX-25), and a
 * misclick cannot lose data (UX-27). One component for every entity (docs/QUALITY_REVIEW.md D5).
 */
export function ConfirmDelete({ action, fields, label, confirm }: {
  action: (formData: FormData) => void | Promise<void>;
  /** Hidden form fields, e.g. { id } or { type, id }. */
  fields: Record<string, string>;
  label: string;
  confirm: string;
}) {
  const [armed, setArmed] = useState(false);
  return (
    <form action={action} onSubmit={(e) => { if (!armed) { e.preventDefault(); setArmed(true); } }}>
      {Object.entries(fields).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
      <Submit armed={armed} onBlur={() => setArmed(false)}>{armed ? confirm : label}</Submit>
    </form>
  );
}

function Submit({ armed, onBlur, children }: { armed: boolean; onBlur: () => void; children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" onBlur={onBlur} disabled={pending} aria-live="polite"
      className={cn(
        "inline-flex h-9 items-center rounded-control border-[1.5px] px-3.5 text-sm font-semibold disabled:opacity-50",
        armed ? "border-danger bg-danger text-on-status" : "border-line text-danger hover:border-danger",
      )}>
      {children}
    </button>
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
      {armed ? confirm : <span aria-hidden>×</span>}
    </button>
  );
}
