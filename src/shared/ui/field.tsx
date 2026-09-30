import type React from "react";
import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

const control =
  "w-full rounded-control border border-transparent bg-subtle px-3 text-body font-medium text-fg placeholder:font-normal placeholder:text-fg-secondary hover:border-line focus:border-fg focus:bg-surface focus:outline-none aria-[invalid=true]:border-danger";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...p }, ref) {
  return <input ref={ref} className={cn(control, "h-9", className)} {...p} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...p }, ref) {
  return <textarea ref={ref} className={cn(control, "min-h-16 py-2 leading-normal", className)} {...p} />;
});

/**
 * A select styled as a field (same fill, border, focus as Input). size="sm" for selects inside cards and rows
 * (moving a card to a column, a step's type): 32 px, meta text. Always give it a label or aria-label.
 */
export const Select = forwardRef<HTMLSelectElement, Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & { size?: "md" | "sm" }>(
  function Select({ className, size = "md", ...p }, ref) {
    return <select ref={ref} className={cn(control, "select-control min-w-0 cursor-pointer disabled:cursor-default disabled:opacity-60", size === "md" ? "h-9" : "h-8 pl-2 text-meta", className)} {...p} />;
  },
);

/** A checkbox in the ink colour, 16 px; wrap it with its text in a <label>. */
export const Checkbox = forwardRef<HTMLInputElement, Omit<InputHTMLAttributes<HTMLInputElement>, "type">>(function Checkbox({ className, ...p }, ref) {
  return <input ref={ref} type="checkbox" className={cn("size-4 shrink-0 cursor-pointer accent-fg disabled:cursor-default", className)} {...p} />;
});

export function Field({ label, htmlFor, error, children }: { label: string; htmlFor: string; error?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-meta font-semibold text-fg-secondary">{label}</label>
      {children}
      {error && <p id={`${htmlFor}-error`} className="text-meta text-danger">{error}</p>}
    </div>
  );
}

/**
 * A validation message right under its field (docs/UX_LAWS.md UX-13: where the eye is at the moment of
 * input, not only in the floating save status). Link it with aria-describedby={`${id}-error`}.
 */
export function FieldError({ id, message }: { id: string; message?: string | null }) {
  if (!message) return null;
  return <p id={`${id}-error`} className="text-meta text-danger">{message}</p>;
}

/** White card with a hairline border — the notebook's basic container. */
export function Panel({ className, children, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-panel border border-line bg-surface p-5", className)} {...p}>{children}</div>;
}
