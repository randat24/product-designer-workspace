"use client";

// Form controls of the project request, in the site's language: 1.5px ink borders, 10–14px radii,
// 16px text in inputs (no zoom on iOS). Every control has a visible label, an optional hint and an error
// tied with aria-describedby; checkbox and radio groups are native inputs styled as chips.

import { Plus, X } from "lucide-react";
import { useId } from "react";
import { cn } from "@/shared/lib/cn";

const control =
  "w-full rounded-[10px] border-[1.5px] bg-surface px-3.5 text-[16px] text-fg placeholder:text-fg-secondary/70 transition-colors duration-[120ms] focus:border-fg";
const ok = "border-line hover:border-fg-secondary";
const bad = "border-danger";

export function FieldShell({ id, label, hint, error, optional, children, className }: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-[15px] font-semibold">
        {label}
        {optional && <span className="ml-1.5 font-normal text-fg-secondary">({optional})</span>}
      </label>
      {hint && <p id={`${id}-hint`} className="text-[14px] leading-snug text-fg-secondary">{hint}</p>}
      {children}
      {error && <p id={`${id}-error`} className="text-[14px] font-semibold text-danger">{error}</p>}
    </div>
  );
}

const describedBy = (id: string, hint?: string, error?: string) =>
  [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;

export function TextField({ id, label, hint, error, optional, value, onChange, type = "text", placeholder, inputMode, autoComplete, maxLength, className }: {
  id: string; label: string; hint?: string; error?: string; optional?: string;
  value: string; onChange: (v: string) => void;
  type?: "text" | "email" | "tel" | "url" | "date" | "number";
  placeholder?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]; autoComplete?: string; maxLength?: number;
  className?: string;
}) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} optional={optional} className={className}>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete={autoComplete}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={cn(control, "h-12", error ? bad : ok)}
      />
    </FieldShell>
  );
}

export function TextArea({ id, label, hint, error, optional, value, onChange, rows = 4, placeholder, maxLength }: {
  id: string; label: string; hint?: string; error?: string; optional?: string;
  value: string; onChange: (v: string) => void; rows?: number; placeholder?: string; maxLength?: number;
}) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} optional={optional}>
      <textarea
        id={id}
        name={id}
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={cn(control, "min-h-[96px] resize-y py-3 leading-[1.5]", error ? bad : ok)}
      />
    </FieldShell>
  );
}

/** A chip group: checkboxes (multiple) or radios (one), in a fieldset with a legend. */
export function ChoiceGroup({ id, legend, hint, error, optional, options, value, onChange, multiple = true, columns }: {
  id: string; legend: string; hint?: string; error?: string; optional?: string;
  options: { value: string; label: string }[];
  value: string[] | string | undefined;
  onChange: (v: string[] | string) => void;
  multiple?: boolean;
  /** Stack options as full-width rows (long labels, yes/no questions). */
  columns?: boolean;
}) {
  const selected = Array.isArray(value) ? value : value ? [value] : [];
  return (
    <fieldset id={id} tabIndex={-1} aria-describedby={describedBy(id, hint, error)} className="flex flex-col gap-2 outline-none">
      <legend className="mb-1.5 text-[15px] font-semibold">
        {legend}
        {optional && <span className="ml-1.5 font-normal text-fg-secondary">({optional})</span>}
      </legend>
      {hint && <p id={`${id}-hint`} className="-mt-1 mb-1 text-[14px] leading-snug text-fg-secondary">{hint}</p>}
      <div className={cn(columns ? "grid gap-2 sm:grid-cols-2" : "flex flex-wrap gap-2")}>
        {options.map((o) => {
          const on = selected.includes(o.value);
          return (
            <label key={o.value} className="relative">
              <input
                type={multiple ? "checkbox" : "radio"}
                name={id}
                value={o.value}
                checked={on}
                onChange={() => {
                  if (!multiple) return onChange(o.value);
                  onChange(on ? selected.filter((v) => v !== o.value) : [...selected, o.value]);
                }}
                className="peer absolute inset-0 size-full cursor-pointer opacity-0"
              />
              <span
                className={cn(
                  "flex min-h-11 items-center gap-2 rounded-[10px] border-[1.5px] px-3.5 py-2 text-[15px] font-semibold transition-colors duration-[120ms]",
                  "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-fg",
                  on ? "border-fg bg-fg text-canvas" : cn("bg-surface hover:border-fg-secondary", error ? "border-danger" : "border-line"),
                )}
              >
                <span aria-hidden className={cn("grid size-4 shrink-0 place-items-center border-[1.5px] border-current", multiple ? "rounded-[4px]" : "rounded-full")}>
                  {on && <span className={cn("size-2 bg-current", multiple ? "rounded-[1px]" : "rounded-full")} />}
                </span>
                {o.label}
              </span>
            </label>
          );
        })}
      </div>
      {error && <p id={`${id}-error`} className="text-[14px] font-semibold text-danger">{error}</p>}
    </fieldset>
  );
}

export function Checkbox({ id, label, hint, checked, onChange, error }: {
  id: string; label: React.ReactNode; hint?: string; checked: boolean; onChange: (v: boolean) => void; error?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-[15px] leading-snug">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, hint, error)}
          className="mt-0.5 size-5 shrink-0 cursor-pointer accent-[var(--fg)]"
        />
        <span>{label}</span>
      </label>
      {hint && <p id={`${id}-hint`} className="pl-8 text-[14px] text-fg-secondary">{hint}</p>}
      {error && <p id={`${id}-error`} className="pl-8 text-[14px] font-semibold text-danger">{error}</p>}
    </div>
  );
}

export function Select({ id, label, value, onChange, options, error, className }: {
  id: string; label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; error?: string; className?: string;
}) {
  return (
    <FieldShell id={id} label={label} error={error} className={className}>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, undefined, error)}
        className={cn(control, "h-12 cursor-pointer", error ? bad : ok)}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </FieldShell>
  );
}

/** A repeatable card (competitor, reference, link) with a remove button that names the item. */
export function ItemCard({ title, removeLabel, onRemove, children }: {
  title: string; removeLabel: string; onRemove: () => void; children: React.ReactNode;
}) {
  const hid = useId();
  return (
    <section aria-labelledby={hid} className="flex flex-col gap-4 rounded-[14px] border-[1.5px] border-line bg-surface p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 id={hid} className="font-display text-[17px] font-bold uppercase tracking-[0.01em]">{title}</h3>
        <button type="button" onClick={onRemove} aria-label={removeLabel}
          className="hit grid size-9 place-items-center rounded-[8px] text-fg-secondary hover:bg-subtle hover:text-fg">
          <X aria-hidden className="size-4" />
        </button>
      </div>
      {children}
    </section>
  );
}

export function AddButton({ onClick, children, disabled }: { onClick: () => void; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className="inline-flex h-11 w-fit items-center gap-2 rounded-[10px] border-[1.5px] border-dashed border-fg-secondary px-4 text-[15px] font-semibold hover:border-fg hover:bg-subtle disabled:opacity-50">
      <Plus aria-hidden className="size-4" />
      {children}
    </button>
  );
}
