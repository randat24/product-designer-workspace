"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/lib/cn";
import { trackAttrs } from "./analytics/track";

/**
 * Header navigation (SIGNAL): plain text links; the current section is marked with aria-current and an orange rule,
 * so the visitor always sees where they are. «Обговорити проєкт ↗» closes the row, underlined as in the package.
 */
export function SiteNav({ locale, labels, ariaLabel, mobile }: {
  locale: string;
  labels: { work: string; notes: string; about: string; discuss: string };
  ariaLabel: string;
  mobile?: boolean;
}) {
  const path = usePathname();
  const items = [
    { href: `/${locale}/cases`, label: labels.work, current: path.startsWith(`/${locale}/cases`) },
    { href: `/${locale}/notes`, label: labels.notes, current: path.startsWith(`/${locale}/notes`) },
    { href: `/${locale}/about`, label: labels.about, current: path.startsWith(`/${locale}/about`) },
  ];
  const discussCurrent = path.startsWith(`/${locale}/start-project`);
  return (
    <nav aria-label={ariaLabel}
      className={mobile ? "flex flex-wrap gap-x-5 gap-y-1 pb-2.5 text-[0.875rem] font-medium lg:hidden" : "ml-auto hidden items-center gap-8 text-[0.875rem] font-medium lg:flex"}>
      {items.map((it) => (
        <Link key={it.href} href={it.href} aria-current={it.current ? "page" : undefined}
          className={cn(
            "hit relative whitespace-nowrap py-1.5 text-fg transition-colors duration-(--duration-fast)",
            it.current ? "before:absolute before:inset-x-0 before:-bottom-px before:h-[0.125rem] before:bg-accent-text" : "hover:text-accent-text",
          )}>
          {it.label}
        </Link>
      ))}
      <Link href={`/${locale}/start-project`} aria-current={discussCurrent ? "page" : undefined}
        {...trackAttrs("project_request_cta", { location: "header" })}
        className="hit whitespace-nowrap border-b border-fg py-0.5 text-fg transition-colors duration-(--duration-fast) hover:border-accent-text hover:text-accent-text">
        {labels.discuss} <span aria-hidden>↗</span>
      </Link>
    </nav>
  );
}
