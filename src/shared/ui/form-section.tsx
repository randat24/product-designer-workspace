import type { ReactNode } from "react";
import { Textarea } from "@/shared/ui/field";

/** Titled panel of fields used on long entity forms (brief, competitor card). */
export function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="flex scroll-mt-8 flex-col gap-3">
      <h2 id={`${id}-h`} className="text-heading font-semibold">{title}</h2>
      <div className="flex flex-col gap-5 rounded-[14px] border border-line bg-surface p-5">{children}</div>
    </section>
  );
}

export function TextField({ id, label, hint, value, readOnly, onChange }: {
  id: string; label: string; hint?: string; value: string; readOnly: boolean; onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-fg-secondary">{label}</label>
      <Textarea id={id} value={value} readOnly={readOnly} maxLength={5000} rows={2} placeholder={hint}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-16 resize-y [field-sizing:content]" />
    </div>
  );
}

