import type { Metadata } from "next";
import Link from "next/link";
import { UX_LAW_GROUPS, UX_LAWS, uxLawUrl } from "@/domains/ux-laws";
import { PageHeader } from "@/shared/ui/page-header";
import { t } from "@/shared/i18n/uk";
import { ArrowLeft } from "lucide-react";
import { FedoMark } from "@/shared/ui/fedo-mark";

const l = t.uxLaws;

export const metadata: Metadata = { title: l.title };

/** Reference: the 30 laws of UX with a check question each (docs/UX_LAWS.md has project notes). */
export default function UxLawsPage() {
  return (
    <div className="min-h-screen">
      <header className="flex h-14 items-center justify-between gap-4 bg-rail px-[clamp(18px,4vw,56px)] text-rail-fg">
        <span className="flex min-w-0 items-center gap-2.5"><FedoMark className="size-7 [--fedo-box:var(--rail-fg)] [--fedo-sym:var(--rail)]" /><span className="min-w-0 truncate font-display text-lg leading-[1.1] font-bold whitespace-nowrap uppercase">{t.auth.brand}</span></span>
        <Link href="/app" className="inline-flex shrink-0 items-center gap-1 text-meta font-semibold opacity-80 hover:opacity-100 hover:underline"><ArrowLeft aria-hidden className="size-4" />{l.back}</Link>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-[clamp(18px,4vw,56px)] py-10">
        <PageHeader title={l.title} lede={l.lede} stat={{ value: UX_LAWS.length, caption: l.count }} />

        <nav aria-label={l.groups} className="-mt-4 flex flex-wrap gap-2">
          {UX_LAW_GROUPS.map((g) => (
            <a key={g.id} href={`#${g.id}`}
              className="rounded-full border-[1.5px] border-line px-3.5 py-1.5 text-meta font-semibold hover:border-fg">
              {g.title} <span className="text-fg-secondary tabular-nums">{UX_LAWS.filter((x) => x.group === g.id).length}</span>
            </a>
          ))}
        </nav>

        {UX_LAW_GROUPS.map((g) => (
          <section key={g.id} id={g.id} aria-labelledby={`${g.id}-h`} className="flex scroll-mt-6 flex-col gap-4">
            <div>
              <h2 id={`${g.id}-h`} className="font-display text-display-sm leading-[1.1] font-bold uppercase">{g.title}</h2>
              <p className="mt-2 max-w-[62ch] text-fg-secondary">{g.lede}</p>
            </div>
            <ul className="grid gap-3 md:grid-cols-2">
              {UX_LAWS.filter((x) => x.group === g.id).map((law) => (
                <li key={law.code} id={law.code.toLowerCase()} className="flex scroll-mt-6 flex-col gap-2 rounded-panel border border-line bg-surface p-5">
                  <p className="flex items-baseline justify-between gap-3">
                    <span className="text-caption font-bold text-fg-secondary tabular-nums">{law.code}</span>
                    <a href={uxLawUrl(law)} target="_blank" rel="noopener noreferrer"
                      className="text-caption font-semibold text-fg-secondary underline underline-offset-2 hover:text-fg">
                      lawsofux.com ↗
                    </a>
                  </p>
                  <h3 className="text-base leading-snug font-bold">
                    {law.name} <span lang="en" className="font-medium text-fg-secondary">· {law.original}</span>
                  </h3>
                  <p className="text-sm">{law.essence}</p>
                  <details className="group text-meta">
                    <summary className="cursor-pointer font-semibold text-fg-secondary hover:text-fg">{l.more}</summary>
                    <p className="mt-2 text-fg-secondary"><span className="font-semibold text-fg">{l.origin}:</span> {law.origin}</p>
                    <p className="mt-2 font-semibold">{l.takeaways}</p>
                    <ul className="mt-1 flex list-disc flex-col gap-1 pl-5">
                      {law.takeaways.map((x) => <li key={x}>{x}</li>)}
                    </ul>
                  </details>
                  <p className="mt-auto rounded-control bg-subtle px-3 py-2 text-meta">
                    <span className="font-semibold">{l.check}:</span> {law.check}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
    </div>
  );
}
