"use client";

import { cn } from "@/shared/lib/cn";

/** Pill toggle group (notebook "chip"): single choice from a short list. */
export function ChipGroup<T extends string>({ label, options, value, onChange, disabled, size = "md" }: {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-meta font-semibold text-fg-secondary">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button key={o.value} type="button" aria-pressed={value === o.value} disabled={disabled} onClick={() => onChange(o.value)}
            className={cn(
              "rounded-[4px] border font-semibold disabled:cursor-default",
              size === "sm" ? "px-2.5 py-0.5 text-caption" : "px-3 py-1 text-meta",
              value === o.value ? "border-fg bg-fg text-canvas" : "border-line text-fg-secondary hover:border-fg",
            )}>
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
