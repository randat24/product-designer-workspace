"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { CURRENT_PHASE, visibleNav } from "@/shared/navigation";
import { cn } from "@/shared/lib/cn";
import { CommandPalette, type CommandItem } from "@/shared/ui/command-palette";
import { t } from "@/shared/i18n/ru";
import { NAV_ICONS } from "@/shared/nav-icons";
import { BookOpen, Check, ChevronLeft, Globe, Settings } from "lucide-react";

/** Dark navigation rail from the notebook prototype: groups, items, a progress ring for shipped stages. */
export function Sidebar({ wsSlug, wsName, projectSlug, projectName, commands, loadEntities, progress }: {
  wsSlug: string;
  wsName: string;
  projectSlug: string;
  projectName: string;
  commands: CommandItem[];
  loadEntities?: () => Promise<CommandItem[]>;
  /** Stage progress 0–100 by nav segment. */
  progress: Record<string, number>;
}) {
  const pathname = usePathname();
  const base = `/w/${wsSlug}/p/${projectSlug}`;

  const nav = visibleNav();
  // One highlighted item: the longest section path the URL starts with (Research vs. Research › Participants).
  const activeHref = nav.flatMap((g) => g.items.map((i) => (i.segment ? `${base}/${i.segment}` : base)))
    .filter((h) => pathname === h || (h !== base && pathname.startsWith(h + "/")))
    .sort((a, b) => b.length - a.length)[0];

  // Phone and tablet: the sections are one horizontal row; keep the current one in view.
  const row = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = row.current;
    const link = el?.querySelector<HTMLElement>('a[aria-current="page"]');
    if (!el || !link || el.scrollWidth <= el.clientWidth) return;
    el.scrollLeft = link.offsetLeft - el.clientWidth / 2 + link.offsetWidth / 2;
  }, [activeHref]);
  return (
    <nav aria-label="Разделы проекта"
      className="z-20 bg-rail text-rail-fg lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
      <div className="flex flex-col gap-1 px-5 pt-5 pb-3 lg:pt-7">
        <Link href={`/w/${wsSlug}`}
          className="hit -ml-1 inline-flex w-fit max-w-full items-center gap-1 text-meta opacity-70 hover:opacity-100">
          <ChevronLeft aria-hidden className="size-4 shrink-0" />
          <span className="truncate">{wsName}</span>
        </Link>
        {/* The title wraps; the settings button keeps its size, so a long name can no longer push it out. */}
        <div className="flex items-start justify-between gap-2">
          <span className="min-w-0 font-display text-display-xs leading-[1.1] font-bold tracking-[0.01em] break-words uppercase lg:text-display-sm"
            title={projectName}>
            {projectName}
          </span>
          <Link href={`${base}/settings`} aria-current={pathname === `${base}/settings` ? "page" : undefined}
            aria-label={t.project.settings} title={t.project.settings}
            className="hit grid size-8 shrink-0 place-items-center rounded-control border border-rail-fg/30 transition-colors duration-[120ms] hover:border-rail-fg/70 hover:bg-rail-fg/10 aria-[current=page]:border-rail-fg aria-[current=page]:bg-rail-fg aria-[current=page]:text-rail">
            <Settings aria-hidden className="size-4" />
          </Link>
        </div>
        {/* Search on every screen size: on a phone it is the fastest way to any entity. */}
        <div className="mt-2 lg:mt-3">
          <CommandPalette items={commands} load={loadEntities}
            triggerClassName="border-rail-fg/30 bg-transparent text-rail-fg/80 hover:bg-rail-fg/10 hover:text-rail-fg" />
        </div>
      </div>

      <div ref={row} className="relative flex gap-4 overflow-x-auto px-3 pb-3 [scrollbar-width:none] lg:flex-col lg:gap-5 lg:overflow-visible lg:pb-8">
        {nav.map((group) => (
          <div key={group.title} className="min-w-max lg:min-w-0">
            <p className="px-2.5 pb-1 text-caption font-semibold tracking-wide uppercase opacity-60">{group.title}</p>
            <ul className="flex gap-1 lg:flex-col">
              {group.items.map((item) => {
                const href = item.segment ? `${base}/${item.segment}` : base;
                const active = href === activeHref;
                const pending = item.phase > CURRENT_PHASE;
                const value = progress[item.segment];
                return (
                  <li key={item.segment || "overview"}>
                    <Link href={href} aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative flex min-h-9 items-center gap-2 rounded-control px-2.5 py-1.5 text-sm font-semibold whitespace-nowrap transition-colors duration-[120ms]",
                        // Current section: filled pill plus a bar on the rail edge, so it reads even at a glance.
                        active ? "bg-canvas text-fg lg:before:absolute lg:before:inset-y-1.5 lg:before:-left-3 lg:before:w-[3px] lg:before:rounded-r-full lg:before:bg-rail-fg"
                          : "hover:bg-rail-fg/10",
                        pending && !active && "font-medium opacity-55",
                      )}>
                      {(() => { const Icon = NAV_ICONS[item.segment]; return Icon ? <Icon aria-hidden className="size-4 shrink-0 opacity-80" /> : null; })()}
                      <span className="flex-1">{item.label}</span>
                      {pending && <span className="text-caption font-medium tabular-nums">{t.project.phaseSoon(item.phase)}</span>}
                      {value !== undefined && <StageRing value={value} active={active} />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        {/* Reference and the way back to the site at the end of the list (serial position, docs/UX_LAWS.md UX-14). */}
        <div className="hidden flex-col gap-0.5 border-t border-rail-fg/15 pt-3 lg:flex">
          <Link href="/app/ux-laws" className={FOOT_LINK}>
            <BookOpen aria-hidden className="size-4 shrink-0" />{t.uxLaws.nav}
          </Link>
          <Link href="/uk" className={FOOT_LINK}>
            <Globe aria-hidden className="size-4 shrink-0" />{t.auth.toSite}
          </Link>
        </div>
      </div>
    </nav>
  );
}

const FOOT_LINK = "flex items-center gap-2 rounded-control px-2.5 py-1.5 text-meta font-semibold opacity-70 transition-opacity hover:bg-rail-fg/10 hover:opacity-100";

/**
 * Stage completeness as a small ring next to the item (replaces the thin bars under every label): it keeps
 * the list one line per item and reads as a status, not as a second row of content. A full stage shows a check.
 */
function StageRing({ value, active }: { value: number; active: boolean }) {
  const label = t.project.stageProgress(value);
  if (value >= 100)
    return (
      <span role="img" aria-label={label} title={label}
        className="grid size-4 shrink-0 place-items-center rounded-full bg-current">
        <Check aria-hidden strokeWidth={3} className={cn("size-2.5", active ? "text-canvas" : "text-rail")} />
      </span>
    );
  const r = 6.5;
  const c = 2 * Math.PI * r;
  return (
    <svg role="img" aria-label={label} viewBox="0 0 16 16" className="size-4 shrink-0 -rotate-90">
      <title>{label}</title>
      <circle cx="8" cy="8" r={r} fill="none" stroke="currentColor" strokeOpacity={0.25} strokeWidth="2" />
      {value > 0 && (
        <circle cx="8" cy="8" r={r} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} />
      )}
    </svg>
  );
}
