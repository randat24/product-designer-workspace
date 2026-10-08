"use client";

import { Anchor, Building2, Landmark } from "lucide-react";
import { useId, useRef, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { AwardSvg } from "./award-icons";
import type { Award } from "./content";

const ISSUER_ICON = { state: Landmark, city: Building2, brigade: Anchor } as const;
const num = (i: number) => String(i + 1).padStart(2, "0");

/**
 * The awards as one large panel and a row of medals to switch it (tabs): a long description no longer
 * stretches a whole grid row, and every medal stays one tap away. The medal row comes first, so on a phone the switched text appears right under the tap. All panels are in the markup, so the
 * texts are there for search and for reading without JavaScript (the first one is shown).
 */
export function AwardsShowcase({ awards, label }: { awards: Award[]; label: string }) {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const id = useId();

  const select = (i: number) => {
    const next = (i + awards.length) % awards.length;
    setActive(next);
    tabs.current[next]?.focus();
  };

  const onKey = (e: React.KeyboardEvent) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (step) { e.preventDefault(); select(active + step); }
    if (e.key === "Home") { e.preventDefault(); select(0); }
    if (e.key === "End") { e.preventDefault(); select(awards.length - 1); }
  };

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label={label}
        className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1 sm:grid sm:grid-cols-6 sm:overflow-visible">
        {awards.map((a, i) => (
          <button key={a.icon} ref={(el) => { tabs.current[i] = el; }} type="button" role="tab"
            id={`${id}-tab-${i}`} aria-controls={`${id}-panel-${i}`} aria-selected={i === active} tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)} onKeyDown={onKey}
            className={cn(
              "relative flex w-24 shrink-0 snap-start flex-col items-center gap-2 rounded-[8px] border bg-surface p-3 text-fg transition-colors duration-[120ms] sm:w-auto",
              i === active ? "border-accent-text shadow-[inset_0_0_0_1px_var(--accent-text)]" : "border-line hover:border-control",
            )}>
            <span className={cn("self-start font-label text-[11px] tabular-nums", i === active ? "text-accent-text" : "text-fg-secondary")}>{num(i)}</span>
            <AwardSvg icon={a.icon} className="h-20 sm:h-24" />
            <span className="sr-only">{a.title}</span>
          </button>
        ))}
      </div>
      {awards.map((a, i) => {
        const Issuer = ISSUER_ICON[a.issuerKind];
        return (
          <section key={a.icon} id={`${id}-panel-${i}`} role="tabpanel" aria-labelledby={`${id}-tab-${i}`} hidden={i !== active}
            className="grid gap-6 rounded-[8px] border border-line bg-surface p-6 text-fg sm:p-8 md:grid-cols-[minmax(220px,300px)_1fr] md:items-center md:gap-10">
            <div className="relative mx-auto flex h-64 w-52 items-center justify-center sm:h-80 sm:w-64">
              <span aria-hidden className="absolute aspect-square h-52 rounded-full border border-line bg-[radial-gradient(var(--line)_0.7px,transparent_0.7px)] [background-size:16px_16px] sm:h-64" />
              <AwardSvg icon={a.icon} className="relative h-[88%]" />
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-3 text-[14px]">
                <span className="font-label text-[12px] tabular-nums text-fg-secondary"><span className="text-accent-text">{num(i)}</span> / {String(awards.length).padStart(2, "0")}</span>
                <span className="inline-flex items-center gap-2 rounded-[4px] border border-line px-3 py-1 text-fg-secondary">
                  <Issuer aria-hidden className="size-4" strokeWidth={1.5} />
                  {a.issuer}
                </span>
              </div>
              <h4 className="text-[24px] font-medium leading-snug tracking-[-0.03em] sm:text-[28px]">{a.title}</h4>
              <span aria-hidden className="h-[2px] w-12 bg-accent-text" />
              <p className="max-w-[62ch] text-[15px] leading-[1.65] text-fg-secondary sm:text-[16px]">{a.description}</p>
            </div>
          </section>
        );
      })}

    </div>
  );
}
