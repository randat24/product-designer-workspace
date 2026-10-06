"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// A site page that could not be built right now, most often because the cases could not be read from the
// database (src/site/cases-source.ts, docs/HANDOFF_TRIAGE.md F04). Already built pages keep their last good
// version; this shows only where there is none. Strings are inline so the content dictionary stays off the client.
const TEXT = {
  uk: {
    title: "Сторінка тимчасово недоступна",
    body: "Не вдалося завантажити кейси. Спробуйте ще раз за хвилину.",
    retry: "Спробувати ще раз",
    about: "Про мене",
  },
  en: {
    title: "This page is temporarily unavailable",
    body: "The cases could not be loaded. Please try again in a minute.",
    retry: "Try again",
    about: "About me",
  },
};

export default function SiteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const locale = usePathname()?.startsWith("/en") ? "en" : "uk";
  const t = TEXT[locale];
  return (
    <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-6 px-4 py-24 sm:px-8">
      <title>{t.title}</title>
      <meta name="robots" content="noindex" />
      <h1 className="page-title">{t.title}</h1>
      <p role="alert" className="max-w-[560px] text-[18px] text-fg-secondary">{t.body}</p>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={reset}
          className="inline-flex h-11 items-center rounded-[10px] border-[1.5px] border-accent bg-accent px-5 text-[15px] font-semibold text-on-accent hover:bg-accent-hover">
          {t.retry}
        </button>
        <Link href={`/${locale}/about`} className="inline-flex h-11 items-center px-2 text-[15px] font-semibold underline underline-offset-4">
          {t.about}
        </Link>
      </div>
    </div>
  );
}
