"use client";

import { X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { sg } from "./ui";

type Filter = "all" | "real" | "concept";

/**
 * Real / concept chips over the server-rendered work grid (SIGNAL «work-filters»). The cards stay in the HTML; the
 * filter only hides the other kind (globals.css, .case-filter). The chips show only when there are both kinds.
 * On the work page (`tagged`) a second row picks one tag, by how many cases carry it: the other cards get
 * data-tag-out, and the tag goes into the address (?tag=…) so a case page can link to it. The page stays static:
 * the tag is read in the browser, so the whole list shows for a moment before it narrows.
 */
export function WorkFilter({ heading, counts, labels, tagged, children }: {
  heading: React.ReactNode;
  counts: Record<Filter, number>;
  labels: { group: string; all: string; real: string; concept: string; tags: string; empty: string };
  /** Each case's kind and tags, by slug; the tag row shows only when given. */
  tagged?: { slug: string; kind: "real" | "concept"; tags: string[] }[];
  children: React.ReactNode;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [tag, setTag] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const both = counts.real > 0 && counts.concept > 0;

  // Tags by how many cases carry them, then by name. Compared by code point, not localeCompare: the server's and
  // the browser's collation differ, and the chips must come out in the same order on both (hydration).
  const tags = useMemo(() => {
    const n = new Map<string, number>();
    for (const c of tagged ?? []) for (const t of new Set(c.tags)) n.set(t, (n.get(t) ?? 0) + 1);
    return [...n].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)).map(([t]) => t);
  }, [tagged]);
  // Each row counts within the other one's choice, so a chip says how many cards picking it would leave.
  const kindCounts: Record<Filter, number> = tag && tagged
    ? (() => { const t = tagged.filter((c) => c.tags.includes(tag)); return { all: t.length, real: t.filter((c) => c.kind === "real").length, concept: t.filter((c) => c.kind === "concept").length }; })()
    : counts;
  const tagCount = (t: string) => (tagged ?? []).filter((c) => c.tags.includes(t) && (filter === "all" || c.kind === filter)).length;

  // A tag in the address (from a case page's tag link) picks itself, if a case still carries it.
  useEffect(() => {
    const asked = new URLSearchParams(window.location.search).get("tag");
    if (asked && tags.includes(asked)) setTag(asked);
  }, [tags]);

  useEffect(() => {
    const allowed = tag ? new Set((tagged ?? []).filter((c) => c.tags.includes(tag)).map((c) => c.slug)) : null;
    root.current?.querySelectorAll<HTMLElement>("[data-slug]").forEach((card) => {
      if (allowed && !allowed.has(card.dataset.slug!)) card.setAttribute("data-tag-out", "");
      else card.removeAttribute("data-tag-out");
    });
    // In the phone's scrolling row, bring the picked tag into view (it may come from a case page's link).
    const chip = root.current?.querySelector<HTMLElement>(".sg-work-tags [aria-pressed='true']");
    const row = chip?.parentElement;
    if (chip && row && row.scrollWidth > row.clientWidth) row.scrollTo({ left: chip.offsetLeft - row.clientWidth / 2 + chip.offsetWidth / 2 });
  }, [tag, tagged]);

  const pick = (next: string | null) => {
    setTag(next);
    const url = new URL(window.location.href);
    if (next) url.searchParams.set("tag", next); else url.searchParams.delete("tag");
    window.history.replaceState(window.history.state, "", url);
  };

  // A tag and a kind can leave nothing: say so instead of an empty grid.
  const none = !!tag && !(tagged ?? []).some((c) => c.tags.includes(tag) && (filter === "all" || c.kind === filter));
  const status = [filter === "all" ? "" : `${labels[filter]}: ${kindCounts[filter]}`, tag ? `${labels.tags}: ${tag}` : ""].filter(Boolean).join(" · ");
  return (
    // Narrowed, the cards keep the sizes of their places in the whole list (lead, full, pairs), which leaves holes:
    // the grid then goes to one column (signal.css, .case-filter[data-narrowed]).
    <div ref={root} data-filter={filter} data-narrowed={filter !== "all" || tag ? "" : undefined} className="case-filter">
      <div className="sg-section-header">
        {heading}
        {(both || tags.length > 0) && (
          <div className="sg-work-filter-rows">
            {both && (
              <div role="group" aria-label={labels.group} className="sg-work-filters">
                {(["all", "real", "concept"] as const).map((f) => (
                  <button key={f} type="button" aria-pressed={filter === f} disabled={kindCounts[f] === 0 && filter !== f}
                    onClick={() => setFilter(f)} className={sg.chip}>
                    {labels[f]} <span className={sg.chipCount}>{kindCounts[f]}</span>
                  </button>
                ))}
              </div>
            )}
            {tags.length > 0 && (
              <div role="group" aria-label={labels.tags} className="sg-work-filters sg-work-tags">
                {tags.map((t) => {
                  const n = tagCount(t);
                  return (
                    // The picked tag shows a cross: pressing it again shows every case. A tag no case of the picked
                    // kind carries cannot be picked.
                    <button key={t} type="button" aria-pressed={tag === t} disabled={n === 0 && tag !== t}
                      onClick={() => pick(tag === t ? null : t)} className={sg.chip}>
                      {t} <span className={sg.chipCount}>{n}</span>{tag === t && <X aria-hidden className="size-3.5" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      <p className="sr-only" role="status">{none ? labels.empty : status}</p>
      {none && <p aria-hidden className="sg-lead mb-10 text-fg-secondary">{labels.empty}</p>}
      {children}
    </div>
  );
}
