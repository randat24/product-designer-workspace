"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/lib/cn";

/**
 * Header navigation with the current section marked (aria-current + a filled pill with an underline),
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
      className={mobile ? "flex gap-2 pb-2.5 text-[14px] font-semibold lg:hidden" : "ml-auto hidden items-center gap-1 text-[14px] font-semibold lg:flex"}>
      {items.map((it) => {
        const cls = cn(
          "hit relative whitespace-nowrap rounded-[8px] px-2.5 py-1.5 transition-colors duration-[120ms]",
          it.current ? "bg-subtle text-fg before:absolute before:inset-x-2.5 before:-bottom-[3px] before:h-[2px] before:rounded-full before:bg-fg" : "text-fg-secondary hover:bg-subtle hover:text-fg",
        );
        return it.anchor
          ? <a key={it.href} href={it.href} className={cls}>{it.label}</a>
          : <Link key={it.href} href={it.href} aria-current={it.current ? "page" : undefined} className={cls}>{it.label}</Link>;
      })}
    </nav>
  );
}
