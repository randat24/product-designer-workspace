"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { button } from "./signal/ui";
import type { Locale } from "./content";

export type NotFoundLabels = { title: string; heading: string; body: string; home: string; work: string; about: string; nav: string };

export function NotFoundView({ labels }: { labels: Record<Locale, NotFoundLabels> }) {
  const locale: Locale = usePathname()?.startsWith("/en") ? "en" : "uk";
  const t = labels[locale];
  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-5 py-24 sm:px-8 lg:px-12">
      <title>{t.title}</title>
      <p className="sg-eyebrow text-fg-secondary"><span className="sg-section-index">404 /</span>{t.title}</p>
      <h1 className="t-page">{t.heading}</h1>
      <p className="max-w-[560px] text-[18px] text-fg-secondary">{t.body}</p>
      <nav className="flex flex-wrap gap-3" aria-label={t.nav}>
        <Link
          href={`/${locale}`}
          className={button({ variant: "primary" })}
        >
          {t.home}
        </Link>
        <Link
          href={`/${locale}/cases`}
          className={button({ variant: "secondary" })}
        >
          {t.work}
        </Link>
        <Link href={`/${locale}/about`} className={button({ variant: "ghost" })}>
          {t.about}
        </Link>
      </nav>
    </div>
  );
}
