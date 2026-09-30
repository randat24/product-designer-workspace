"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { CURRENT_PHASE, visibleNav } from "@/shared/navigation";
import { cn } from "@/shared/lib/cn";
import { CommandPalette, type CommandItem } from "@/shared/ui/command-palette";
import { t } from "@/shared/i18n/ru";
import { NAV_ICONS } from "@/shared/nav-icons";

/** Dark navigation rail from the notebook prototype: groups, items, progress bars for shipped stages. */
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
        <Link href={`/w/${wsSlug}`} className="text-meta opacity-70 hover:opacity-100">{wsName}</Link>
        <div className="flex items-start justify-between gap-2">
          <span className="font-display text-[22px] leading-[1.05] font-bold uppercase lg:text-[26px]" title={projectName}>
            {projectName}
          </span>
          <Link href={`${base}/settings`} aria-current={pathname === `${base}/settings` ? "page" : undefined}
            className="hit mt-1 shrink-0 rounded-chip border border-rail-fg/30 px-2 py-0.5 text-caption hover:border-rail-fg/70 aria-[current=page]:bg-rail-fg aria-[current=page]:text-rail">
            {t.project.settings}
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
                        "flex flex-col rounded-control px-2.5 py-1.5 text-sm font-semibold whitespace-nowrap transition-colors duration-[120ms]",
                        active ? "bg-canvas text-fg" : "hover:bg-rail-fg/10",
                        pending && !active && "font-medium opacity-55",
                      )}>
                      <span className="flex items-center gap-2">
                        {(() => { const Icon = NAV_ICONS[item.segment]; return Icon ? <Icon aria-hidden className="size-4 shrink-0 opacity-80" /> : null; })()}
                        <span className="flex-1">{item.label}</span>
                        {pending && <span className="text-caption font-medium tabular-nums">{t.project.phaseSoon(item.phase)}</span>}
                      </span>
                      {value !== undefined && (
                        <span className="mt-1.5 block h-[3px] overflow-hidden rounded-chip shadow-[inset_0_0_0_1px_rgba(127,127,127,.35)]"
                          role="img" aria-label={`Готово ${value}%`}>
                          <i className="block h-full bg-current" style={{ width: `${value}%` }} />
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        {/* Reference at the end of the list (serial position, docs/UX_LAWS.md UX-14). */}
        <Link href="/app/ux-laws" className="hidden rounded-control px-2.5 py-1.5 text-meta font-semibold opacity-70 hover:bg-rail-fg/10 hover:opacity-100 lg:block">
          {t.uxLaws.nav}
        </Link>
      </div>
    </nav>
  );
}
