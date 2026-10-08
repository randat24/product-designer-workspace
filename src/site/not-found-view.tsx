"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FedoOutline } from "@/shared/ui/fedo-mark";
import type { Locale } from "./content";

export type NotFoundLabels = { title: string; heading: string; body: string; home: string; work: string; about: string; nav: string };

export function NotFoundView({ labels }: { labels: Record<Locale, NotFoundLabels> }) {
  const locale: Locale = usePathname()?.startsWith("/en") ? "en" : "uk";
  const t = labels[locale];
  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-5 py-24 sm:px-8 lg:px-12">
      <title>{t.title}</title>
      {/* The cursor of the mark missed the notch: there is nothing at this address. */}
      <div className="flex items-end gap-6">
        <FedoOutline miss className="size-[clamp(64px,8vw,96px)]" />
        <p className="display-num text-[clamp(56px,9vw,104px)] leading-none text-fg-secondary">404</p>
      </div>
      <h1 className="page-title">{t.heading}</h1>
      <p className="max-w-[560px] text-[18px] text-fg-secondary">{t.body}</p>
      <nav className="flex flex-wrap gap-3" aria-label={t.nav}>
        <Link
          href={`/${locale}`}
          className="inline-flex h-11 items-center rounded-[4px] border border-accent bg-accent px-5 text-[15px] font-semibold text-on-accent hover:bg-accent-hover"
        >
          {t.home}
        </Link>
        <Link
          href={`/${locale}/cases`}
          className="inline-flex h-11 items-center rounded-[4px] border border-control px-5 text-[15px] font-semibold text-fg hover:bg-subtle"
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
