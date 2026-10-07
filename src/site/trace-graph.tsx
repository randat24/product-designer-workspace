"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { PROCESS_STAGES } from "./case-process";
import { TRACE_STAGES, traceChain, type CaseTrace, type TraceStage } from "./case-trace";
import type { Locale } from "./content";
import { count, type Forms } from "./plural";

type Labels = {
  title: string; lead: string; idle: string; basedOn: string; leadsTo: string; none: string; titlesNote: string;
  stages: Record<TraceStage, string>;
  forms: { records: Forms; links: Forms };
};

const COLOR = Object.fromEntries(PROCESS_STAGES.map((s) => [s.key, s.color])) as Record<TraceStage, string>;

/**
 * «Слід рішень»: the case's records in stage columns, joined by the links from the workbook. Hovering or focusing a
 * record lights its chain: what it rests on (towards observations) and what it led to (screens, decisions); a click
 * pins it. The lines are measured from the rendered records, so they follow any width and font.
 */
export function TraceGraph({ trace, locale, labels }: { trace: CaseTrace; locale: Locale; labels: Labels }) {
  const box = useRef<HTMLDivElement>(null);
  const [paths, setPaths] = useState<{ a: string; b: string; d: string }[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hover, setHover] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const active = pinned ?? hover;

  const columns = useMemo(
    () => TRACE_STAGES.map((stage) => ({ stage, nodes: trace.nodes.filter((n) => n.stage === stage) })).filter((c) => c.nodes.length),
    [trace],
  );
  const rank = useMemo(() => new Map(trace.nodes.map((n) => [n.code, TRACE_STAGES.indexOf(n.stage)])), [trace]);
  const titles = useMemo(() => new Map(trace.nodes.map((n) => [n.code, n.title])), [trace]);
  const stageOf = useMemo(() => new Map(trace.nodes.map((n) => [n.code, n.stage])), [trace]);

  const measure = useCallback(() => {
    const el = box.current;
    if (!el) return;
    const b = el.getBoundingClientRect();
    const rect = (code: string) => el.querySelector<HTMLElement>(`[data-code="${CSS.escape(code)}"]`)?.getBoundingClientRect();
    setSize({ w: b.width, h: b.height });
    setPaths(trace.links.flatMap(([x, y]) => {
      const [a, c] = rank.get(x)! <= rank.get(y)! ? [x, y] : [y, x];
      const A = rect(a), C = rect(c);
      if (!A || !C) return [];
      const x1 = A.right - b.left, y1 = A.top + A.height / 2 - b.top, x2 = C.left - b.left, y2 = C.top + C.height / 2 - b.top;
      const dx = Math.max(24, (x2 - x1) / 2);
      return [{ a, b: c, d: `M${x1.toFixed(1)} ${y1.toFixed(1)} C${(x1 + dx).toFixed(1)} ${y1.toFixed(1)} ${(x2 - dx).toFixed(1)} ${y2.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}` }];
    }));
  }, [trace, rank]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => ro.disconnect();
  }, [measure]);

  const chain = useMemo(() => (active ? traceChain(trace, active) : null), [trace, active]);
  const lit = useMemo(() => (chain && active ? new Set([active, ...chain.up, ...chain.down]) : null), [chain, active]);
  const onChain = (a: string, b: string) => {
    if (!chain || !active) return false;
    const up = (x: string) => x === active || chain.up.has(x);
    const down = (x: string) => x === active || chain.down.has(x);
    return (up(a) && up(b)) || (down(a) && down(b));
  };
  const groups = (set: Set<string>) => {
    const by = new Map<TraceStage, number>();
    set.forEach((c) => { const s = stageOf.get(c)!; by.set(s, (by.get(s) ?? 0) + 1); });
    return TRACE_STAGES.filter((s) => by.get(s)).map((s) => `${labels.stages[s]} ${by.get(s)}`).join(" · ") || labels.none;
  };

  return (
    <div className="flex flex-col gap-4">
      <p aria-live="polite" className="min-h-[4.5em] rounded-[12px] bg-subtle px-4 py-3 text-[14px] leading-[1.5]">
        {active && chain ? (
          <>
            <b className="font-label font-medium">{active}</b>{titles.get(active) ? ` · ${titles.get(active)}` : ""}<br />
            {labels.basedOn}: {groups(chain.up)}<br />
            {labels.leadsTo}: {groups(chain.down)}
          </>
        ) : (
          labels.idle
            .replace("{records}", count(locale, trace.nodes.length, labels.forms.records))
            .replace("{links}", count(locale, trace.links.length, labels.forms.links))
        )}
      </p>
      <div className="overflow-x-auto rounded-[18px] border border-line bg-surface" data-spec="Слід рішень">
        <div
          ref={box}
          className="relative grid min-w-[max(100%,1080px)] gap-[26px] p-[18px]"
          style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(130px, 1fr))` }}
          onMouseLeave={() => setHover(null)}
        >
          <svg aria-hidden className="pointer-events-none absolute inset-0" width={size.w} height={size.h} viewBox={`0 0 ${size.w || 1} ${size.h || 1}`}>
            {paths.map((p) => {
              const hit = onChain(p.a, p.b);
              return (
                <path key={`${p.a}-${p.b}`} d={p.d} fill="none"
                  className={cn("transition-opacity duration-150 motion-reduce:transition-none", hit ? "stroke-fg" : "stroke-fg-secondary")}
                  strokeWidth={hit ? 1.6 : 1.2} opacity={active ? (hit ? 1 : 0.06) : 0.32} />
              );
            })}
          </svg>
          {columns.map(({ stage, nodes }) => (
            <div key={stage} className="relative flex min-w-0 flex-col gap-2" style={{ "--c": COLOR[stage] } as React.CSSProperties}>
              <h3 className="mb-1 flex items-center gap-2 font-label text-[11px] uppercase tracking-[0.04em] text-fg-secondary">
                <i aria-hidden className="size-[9px] rounded-[2px] bg-(--c)" />{labels.stages[stage]} · {nodes.length}
              </h3>
              {nodes.map((n) => (
                <button
                  key={n.code}
                  type="button"
                  data-code={n.code}
                  data-cursor={labels.title}
                  aria-pressed={pinned === n.code}
                  onMouseEnter={() => setHover(n.code)}
                  onFocus={() => setHover(n.code)}
                  onBlur={() => setHover(null)}
                  onClick={() => setPinned((p) => (p === n.code ? null : n.code))}
                  className={cn(
                    "relative grid gap-0.5 rounded-[8px] border border-l-[3px] border-line border-l-(--c) bg-surface px-2.5 py-2 text-left text-[12.5px] leading-[1.3] transition-opacity duration-150 hover:border-fg hover:border-l-(--c) motion-reduce:transition-none",
                    lit && !lit.has(n.code) && "opacity-30",
                    active === n.code && "ring-2 ring-fg",
                  )}
                >
                  <b className="font-label text-[11px] font-medium">{n.code}</b>
                  {n.title && <span className="line-clamp-2" lang="uk">{n.title}</span>}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
      {labels.titlesNote && <p className="text-[13px] text-fg-secondary">{labels.titlesNote}</p>}
    </div>
  );
}
