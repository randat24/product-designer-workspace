"use client";

// Form controls of the project request, in the site's language: 1.5px ink borders, 10–14px radii,
// 16px text in inputs (no zoom on iOS). Every control has a visible label, an optional hint and an error
// tied with aria-describedby; checkbox and radio groups are native inputs styled as chips.

import { Plus, X } from "lucide-react";
import { useId } from "react";
import { cn } from "@/shared/lib/cn";
import { DateField } from "@/shared/ui/date-field";
import { button, sg } from "../signal/ui";


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
    <div className={cn(sg.field, className)}>
      <label htmlFor={id} className={sg.label}>
        {label}
        {optional && <span className="ml-1.5 font-normal text-fg-secondary">({optional})</span>}
      </label>
      {hint && <p id={`${id}-hint`} className={sg.hint}>{hint}</p>}
      {children}
      {error && <p id={`${id}-error`} className={cn(sg.error, "font-semibold")}>{error}</p>}
    </div>
  );
}

const describedBy = (id: string, hint?: string, error?: string) =>
  [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;

export function TextField({ id, label, hint, error, optional, value, onChange, type = "text", placeholder, inputMode, autoComplete, maxLength, className }: {
  id: string; label: string; hint?: string; error?: string; optional?: string;
  value: string; onChange: (v: string) => void;
  type?: "text" | "email" | "tel" | "url" | "number";
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
        className={sg.input}
      />
    </FieldShell>
  );
}

/** A date in the site's language: typed (дд.мм.рррр / dd/mm/yyyy) or picked in our calendar; the value is ISO or "". */
export function DateInput({ id, label, hint, error, optional, value, onChange, locale, className }: {
  id: string; label: string; hint?: string; error?: string; optional?: string;
  value: string; onChange: (v: string) => void; locale: "uk" | "en"; className?: string;
}) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} optional={optional} className={className}>
      <DateField id={id} size="lg" locale={locale} value={value} onChange={onChange}
        invalid={!!error} describedBy={describedBy(id, hint, error)} />
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
        className={cn(sg.input, "min-h-[96px] resize-y leading-[1.5]")}
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
      <legend className={cn(sg.label, "mb-1.5")}>
        {legend}
        {optional && <span className="ml-1.5 font-normal text-fg-secondary">({optional})</span>}
      </legend>
      {hint && <p id={`${id}-hint`} className={cn(sg.hint, "-mt-1 mb-1")}>{hint}</p>}
      <div className={cn(columns ? "grid gap-2 sm:grid-cols-2" : "flex flex-wrap gap-2")}>
        {options.map((o) => {
          const on = selected.includes(o.value);
          return (
            <label key={o.value} className={cn(sg.chip, "relative text-[14px]", error && !on && "border-danger")}>
              <input
                type={multiple ? "checkbox" : "radio"}
                name={id}
                value={o.value}
                checked={on}
                onChange={() => {
                  if (!multiple) return onChange(o.value);
                  onChange(on ? selected.filter((v) => v !== o.value) : [...selected, o.value]);
                }}
                className="absolute inset-0 size-full cursor-pointer opacity-0"
              />
              <span aria-hidden className={cn("grid size-4 shrink-0 place-items-center border border-current", multiple ? "rounded-[2px]" : "rounded-full")}>
                {on && <span className={cn("size-2 bg-current", multiple ? "rounded-[1px]" : "rounded-full")} />}
              </span>
              {o.label}
            </label>
          );
        })}
      </div>
      {error && <p id={`${id}-error`} className={cn(sg.error, "font-semibold")}>{error}</p>}
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
          className="mt-0.5 size-5 shrink-0 cursor-pointer accent-[var(--accent-text)]"
        />
        <span>{label}</span>
      </label>
      {hint && <p id={`${id}-hint`} className={cn(sg.hint, "pl-8")}>{hint}</p>}
      {error && <p id={`${id}-error`} className={cn(sg.error, "pl-8 font-semibold")}>{error}</p>}
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
        className={cn(sg.input, "cursor-pointer")}
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
    <section aria-labelledby={hid} className={cn(sg.panel, "flex flex-col gap-4 p-4 sm:p-5")}>
      <div className="flex items-center justify-between gap-3">
        <h3 id={hid} className="text-[17px] font-semibold tracking-[-0.02em]">{title}</h3>
        <button type="button" onClick={onRemove} aria-label={removeLabel}
          className={button({ variant: "ghost", size: "sm", icon: true }, "text-fg-secondary hover:text-fg")}>
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
      className={button({ variant: "dashed" }, "w-fit")}>
      {children}
      <Plus aria-hidden className="size-4" />
    </button>
  );
}
