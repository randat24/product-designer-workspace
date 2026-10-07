"use client";

import { useState } from "react";
import { cn } from "@/shared/lib/cn";

type Filter = "all" | "real" | "concept";

/**
 * Real / concept filter over server-rendered case cards. The cards stay in the HTML; the filter only hides the
 * ones of the other kind (each card carries data-kind). The chips show only when there are cases of both kinds.
 */
export function CaseFilter({
  heading,
  lead,
  counts,
  labels,
  extra,
  children,
}: {
  /** The section title, on the left of the chip row. */
  heading: React.ReactNode;
  /** Shown above the title row and filtered with the rest (the home page opens with a case). */
  lead?: React.ReactNode;
  counts: Record<Filter, number>;
  labels: { group: string; all: string; real: string; concept: string };
  /** Shown at the end of the chip row, e.g. the link to all work. */
  extra?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const both = counts.real > 0 && counts.concept > 0;
  return (
    <div data-filter={filter} className="case-filter flex flex-col gap-8">
      {lead}
      <div className="flex flex-wrap items-end justify-between gap-4">
        {heading}
        {(both || extra) && (
          <div role="group" aria-label={labels.group} className="flex flex-wrap items-center gap-2">
            {both && (["all", "real", "concept"] as const).map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
                className={cn(
                  "hit inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold transition-colors duration-[120ms]",
                  filter === f ? "border-fg bg-fg text-canvas" : "border-line bg-surface text-fg hover:border-fg",
                )}
              >
                {labels[f]}
                <span className={cn("font-label text-[11px]", filter === f ? "opacity-70" : "text-fg-secondary")}>{counts[f]}</span>
              </button>
            ))}
            {extra}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-12">{children}</div>
    </div>
  );
}
