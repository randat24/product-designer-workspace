"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "./content";

export type NotFoundLabels = { title: string; heading: string; body: string; home: string; work: string; about: string; nav: string };

export function NotFoundView({ labels }: { labels: Record<Locale, NotFoundLabels> }) {
  const locale: Locale = usePathname()?.startsWith("/en") ? "en" : "uk";
  const t = labels[locale];
  return (
    <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-6 px-4 py-24 sm:px-8">
      <title>{t.title}</title>
      <p className="display-num text-[clamp(64px,12vw,140px)] leading-none text-fg-secondary">404</p>
      <h1 className="page-title">{t.heading}</h1>
      <p className="max-w-[560px] text-[18px] text-fg-secondary">{t.body}</p>
      <nav className="flex flex-wrap gap-3" aria-label={t.nav}>
        <Link
          href={`/${locale}`}
          className="inline-flex h-11 items-center rounded-[10px] border-[1.5px] border-accent bg-accent px-5 text-[15px] font-semibold text-on-accent hover:bg-accent-hover"
        >
          {t.home}
        </Link>
        <Link
          href={`/${locale}/cases`}
          className="inline-flex h-11 items-center rounded-[10px] border-[1.5px] border-fg px-5 text-[15px] font-semibold text-fg hover:bg-subtle"
        >
          {t.work}
        </Link>
        <Link href={`/${locale}/about`} className="inline-flex h-11 items-center px-2 text-[15px] font-semibold underline underline-offset-4">
          {t.about}
        </Link>
      </nav>
    </div>
  );
}
