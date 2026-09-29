import type React from "react";
import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

const control =
  "w-full rounded-lg border border-transparent bg-subtle px-3 text-[14.5px] font-medium text-fg placeholder:font-normal placeholder:text-fg-secondary/70 hover:border-line focus:border-fg focus:bg-surface focus:outline-none aria-[invalid=true]:border-danger";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...p }, ref) {
  return <input ref={ref} className={cn(control, "h-9", className)} {...p} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...p }, ref) {
  return <textarea ref={ref} className={cn(control, "min-h-16 py-2 leading-normal", className)} {...p} />;
});

export function Field({ label, htmlFor, error, children }: { label: string; htmlFor: string; error?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[13px] font-semibold text-fg-secondary">{label}</label>
      {children}
      {error && <p id={`${htmlFor}-error`} className="text-[13px] text-danger">{error}</p>}
    </div>
  );
}

/** White card with a hairline border — the notebook's basic container. */
export function Panel({ className, children, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-[14px] border border-line bg-surface p-5", className)} {...p}>{children}</div>;
}
