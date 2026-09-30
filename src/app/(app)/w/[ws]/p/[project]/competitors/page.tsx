import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectContext } from "@/domains/projects";
import { COMPETITOR_KINDS, COMPETITORS_TARGET, isAssessed, listCompetitorCovers, listCompetitors } from "@/domains/competitors";
import { createCompetitor } from "@/domains/competitors/actions";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";
import { t } from "@/shared/i18n/ru";
import { CompetitorTabs } from "./tabs";

export const metadata: Metadata = { title: t.competitors.title };

export default async function CompetitorsPage({ params, searchParams }: {
  params: Promise<{ ws: string; project: string }>;
  searchParams: Promise<{ kind?: string }>;
}) {
  const [{ ws, project: slug }, { kind }] = await Promise.all([params, searchParams]);
  const ctx = await getProjectContext(ws, slug);
  if (!ctx) notFound();
  const { project, base, canEdit } = ctx;

  const [competitors, covers] = await Promise.all([listCompetitors(project.id), listCompetitorCovers(project.id)]);
  const own = competitors.find((c) => c.is_own_product);
  const others = competitors.filter((c) => !c.is_own_product);
  const shown = kind ? others.filter((c) => c.kind === kind) : others;
  const assessed = others.filter(isAssessed).length;

  return (
    <div className="max-w-6xl">
      <PageHeader title={t.competitors.title} lede={t.competitors.lede}
        progress={{ value: Math.min(assessed / COMPETITORS_TARGET, 1) * 100, caption: t.competitors.progress(assessed, COMPETITORS_TARGET) }} />
      <CompetitorTabs base={base} current="cards" />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Тип конкурента" className="flex flex-wrap gap-1.5">
          {[{ value: undefined, label: t.competitors.all }, ...COMPETITOR_KINDS].map((k) => (
            <Link key={k.label} href={k.value ? `?kind=${k.value}` : "?"} aria-current={kind === k.value ? "true" : undefined}
              className={cn(
                "rounded-full border-[1.5px] px-3 py-0.5 text-meta font-semibold",
                kind === k.value ? "border-fg bg-fg text-canvas" : "border-line text-fg-secondary hover:border-fg",
              )}>
              {k.label}
            </Link>
          ))}
        </nav>
        {canEdit && (
          <div className="flex gap-2">
            {!own && (
              <form action={createCompetitor}>
                <input type="hidden" name="projectId" value={project.id} />
                <input type="hidden" name="own" value="1" />
                <Button type="submit" variant="secondary">{t.competitors.addOwn}</Button>
              </form>
            )}
            <form action={createCompetitor}>
              <input type="hidden" name="projectId" value={project.id} />
              <Button type="submit">{t.competitors.add}</Button>
            </form>
          </div>
        )}
      </div>

      {shown.length === 0 ? (
        <p className="rounded-panel border-[1.5px] border-dashed border-line p-7 text-center text-fg-secondary">
          {others.length === 0 ? t.competitors.empty : t.competitors.emptyFiltered}
        </p>
      ) : (
        <ul className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
          {(own && !kind ? [own, ...shown] : shown).map((c) => (
            <li key={c.id}>
              <Link href={`${base}/competitors/${c.code}`}
                className={cn(
                  "flex h-full flex-col gap-3 overflow-hidden rounded-panel border border-line bg-surface transition-colors duration-[120ms] hover:border-fg",
                  c.is_own_product && "border-[1.5px] border-fg",
                )}>
                {covers.get(c.id) && (
                  // eslint-disable-next-line @next/next/no-img-element -- signed Storage URL
                  <img src={covers.get(c.id)} alt="" className="aspect-[16/9] w-full border-b border-line object-cover object-top" />
                )}
                <div className={cn("flex flex-col gap-3 px-5 pb-5", !covers.get(c.id) && "pt-5")}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-base font-bold">{c.name}</span>
                    <span className="text-caption font-semibold text-fg-secondary tabular-nums">{c.code}</span>
                  </div>
                  <span className="flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-fg px-2.5 py-0.5 text-caption font-semibold text-canvas">
                      {c.is_own_product ? t.competitors.ownBadge : COMPETITOR_KINDS.find((k) => k.value === c.kind)?.label}
                    </span>
                    {c.url && <span className="truncate text-caption text-fg-secondary">{c.url.replace(/^https?:\/\/(www\.)?/, "")}</span>}
                  </span>
                  {c.is_own_product ? (
                    c.positioning && <p className="line-clamp-3 text-meta text-fg-secondary">{c.positioning}</p>
                  ) : isAssessed(c) ? (
                    <dl className="flex flex-col gap-2 text-meta">
                      {([["strengths", t.competitors.strengths], ["weaknesses", t.competitors.weaknesses], ["borrow", t.competitors.borrow]] as const)
                        .filter(([key]) => c[key])
                        .map(([key, label]) => (
                          <div key={key}>
                            <dt className="font-semibold text-fg-secondary">{label}</dt>
                            <dd className="line-clamp-2">{c[key]}</dd>
                          </div>
                        ))}
                    </dl>
                  ) : (
                    <p className="text-meta text-fg-secondary">{t.competitors.noAssessment}</p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
