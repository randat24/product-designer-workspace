import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

const control =
  "w-full rounded-[4px] border border-transparent bg-subtle px-2.5 text-sm text-fg placeholder:text-fg-secondary/70 hover:border-line focus:border-accent focus:bg-surface focus:outline-none aria-[invalid=true]:border-danger";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...p }, ref) {
  return <input ref={ref} className={cn(control, "h-8", className)} {...p} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...p }, ref) {
  return <textarea ref={ref} className={cn(control, "min-h-16 py-1.5 leading-5", className)} {...p} />;
});

export function Field({ label, htmlFor, error, children }: { label: string; htmlFor: string; error?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-fg-secondary">{label}</label>
      {children}
      {error && <p id={`${htmlFor}-error`} className="text-[13px] text-danger">{error}</p>}
    </div>
  );
}
