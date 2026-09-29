"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CURRENT_PHASE, visibleNav } from "@/shared/navigation";
import { cn } from "@/shared/lib/cn";
import { t } from "@/shared/i18n/ru";

export function Sidebar({ wsSlug, wsName, projectSlug, projectName }: {
  wsSlug: string; wsName: string; projectSlug: string; projectName: string;
}) {
  const pathname = usePathname();
  const base = `/w/${wsSlug}/p/${projectSlug}`;

  return (
    <nav aria-label="Разделы проекта" className="border-b border-line bg-surface md:sticky md:top-0 md:h-screen md:overflow-y-auto md:border-r md:border-b-0">
      <div className="flex flex-col gap-0.5 px-4 pt-4 pb-3">
        <Link href={`/w/${wsSlug}`} className="text-caption text-fg-secondary hover:text-fg">{wsName}</Link>
        <span className="truncate font-semibold" title={projectName}>{projectName}</span>
      </div>
      <div className="flex gap-4 overflow-x-auto px-2 pb-3 md:flex-col md:gap-4 md:overflow-visible">
        {visibleNav().map((group) => (
          <div key={group.title} className="min-w-max md:min-w-0">
            <p className="px-2 pb-1 text-caption font-medium text-fg-secondary">{group.title}</p>
            <ul className="flex gap-0.5 md:flex-col">
              {group.items.map((item) => {
                const href = item.segment ? `${base}/${item.segment}` : base;
                const active = item.segment ? pathname === href || pathname.startsWith(href + "/") : pathname === base;
                const pending = item.phase > CURRENT_PHASE;
                return (
                  <li key={item.segment || "overview"}>
                    <Link href={href} aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex h-7 items-center justify-between gap-3 rounded-md px-2 text-sm whitespace-nowrap",
                        active ? "bg-subtle font-medium text-fg" : "hover:bg-subtle",
                        pending && !active && "text-fg-secondary",
                      )}>
                      {item.label}
                      {pending && <span className="text-caption tabular-nums text-fg-secondary/80">{t.project.phaseSoon(item.phase)}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
