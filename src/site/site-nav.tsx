"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/lib/cn";

/**
 * Header navigation (SIGNAL): plain text links; the current section is marked with aria-current and an orange rule,
 * so the visitor always sees where they are. «Контакт» is an anchor on the home page, never "current".
 */
export function SiteNav({ locale, labels, ariaLabel, mobile }: {
  locale: string;
  labels: { work: string; about: string; contact: string };
  ariaLabel: string;
  mobile?: boolean;
}) {
  const path = usePathname();
  const items = [
    { href: `/${locale}/cases`, label: labels.work, current: path.startsWith(`/${locale}/cases`) },
    { href: `/${locale}/about`, label: labels.about, current: path.startsWith(`/${locale}/about`) },
    { href: `/${locale}#contact`, label: labels.contact, current: false, anchor: true },
  ];
  return (
    <nav aria-label={ariaLabel}
      className={mobile ? "flex gap-5 pb-2.5 text-[15px] font-medium lg:hidden" : "ml-auto hidden items-center gap-7 text-[15px] font-medium lg:flex"}>
      {items.map((it) => {
        const cls = cn(
          "hit relative whitespace-nowrap py-1.5 transition-colors duration-[120ms]",
          it.current ? "text-fg before:absolute before:inset-x-0 before:-bottom-px before:h-[2px] before:bg-accent-text" : "text-fg-secondary hover:text-fg",
        );
        return it.anchor
          ? <a key={it.href} href={it.href} className={cls}>{it.label}</a>
          : <Link key={it.href} href={it.href} aria-current={it.current ? "page" : undefined} className={cls}>{it.label}</Link>;
      })}
    </nav>
  );
}
