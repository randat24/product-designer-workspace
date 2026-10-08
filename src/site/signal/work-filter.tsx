"use client";

import { useState } from "react";

type Filter = "all" | "real" | "concept";

/**
 * Real / concept chips over the server-rendered work grid (SIGNAL «work-filters»). The cards stay in the HTML; the
 * filter only hides the other kind (globals.css, .case-filter). The chips show only when there are both kinds.
 */
export function WorkFilter({ heading, counts, labels, children }: {
  heading: React.ReactNode;
  counts: Record<Filter, number>;
  labels: { group: string; all: string; real: string; concept: string };
  children: React.ReactNode;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const both = counts.real > 0 && counts.concept > 0;
  return (
    <div data-filter={filter} className="case-filter">
      <div className="sg-section-header">
        {heading}
        {both && (
          <div role="group" aria-label={labels.group} className="sg-work-filters">
            {(["all", "real", "concept"] as const).map((f) => (
              <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}>
                {labels[f]} <span className="font-label text-[11px] opacity-70">{counts[f]}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="sr-only" role="status">{filter === "all" ? "" : `${labels[filter]}: ${counts[filter]}`}</p>
      {children}
    </div>
  );
}
