import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectContext } from "@/domains/projects";
import { getSynthesisStats, INSIGHT_STATUSES, labelOf, LEVELS, listInsights } from "@/domains/synthesis";
import { createSynthesisEntity } from "@/domains/synthesis/actions";
import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";
import { cn } from "@/shared/lib/cn";
import { t } from "@/shared/i18n/ru";

export const metadata: Metadata = { title: t.synthesis.insights.title };
const s = t.synthesis.insights;

export default async function InsightsPage({ params }: { params: Promise<{ ws: string; project: string }> }) {
  const { ws, project: slug } = await params;
  const ctx = await getProjectContext(ws, slug);
  if (!ctx) notFound();
  const [insights, stats] = await Promise.all([listInsights(ctx.project.id), getSynthesisStats(ctx.project.id)]);
  const supported = insights.filter((i) => (stats.get(i.id)?.sources ?? 0) > 0).length;

  return (
    <div className="max-w-6xl">
      <PageHeader title={s.title} lede={s.lede}
        progress={{ value: insights.length ? (supported / insights.length) * 100 : 0, caption: `${supported} / ${insights.length} с источниками` }} />
      {ctx.canEdit && (
        <form action={createSynthesisEntity} className="mb-5">
          <input type="hidden" name="type" value="insight" />
          <input type="hidden" name="projectId" value={ctx.project.id} />
          <Button type="submit">{s.add}</Button>
        </form>
      )}
      {insights.length === 0 ? (
        <p className="rounded-[14px] border-[1.5px] border-dashed border-line p-7 text-center text-fg-secondary">{s.empty}</p>
      ) : (
        <ul className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(320px,1fr))]">
          {insights.map((i) => {
            const st = stats.get(i.id);
            const unsupported = (st?.sources ?? 0) === 0;
            return (
              <li key={i.id}>
                <Link href={`${ctx.base}/insights/${i.code}`}
                  className={cn("flex h-full flex-col gap-2.5 rounded-[14px] border bg-surface p-5 hover:border-fg",
                    unsupported ? "border-[1.5px] border-dashed border-warning" : "border-line")}>
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="text-caption font-bold text-fg-secondary tabular-nums">{i.code}</span>
                    <span className="text-caption font-semibold text-fg-secondary">{labelOf(INSIGHT_STATUSES, i.status)}</span>
                  </span>
                  <span className="text-base leading-snug font-bold">{i.title}</span>
                  {i.statement && <span className="line-clamp-3 text-[13px] text-fg-secondary">{i.statement}</span>}
                  <span className="mt-auto flex flex-wrap items-center gap-1.5 text-caption font-semibold">
                    <span className="rounded-full bg-fg px-2.5 py-0.5 text-canvas">{s.fields.confidence}: {labelOf(LEVELS, i.confidence).toLowerCase()}</span>
                    {unsupported ? (
                      <span className="rounded-full bg-warning/15 px-2.5 py-0.5 text-warning">⚠ {t.trace.unsupported}</span>
                    ) : (
                      <span className="rounded-full border border-line px-2.5 py-0.5 text-fg-secondary">
                        {s.columns.sources}: {st?.sources} · {s.participants(st?.participants ?? 0)}
                      </span>
                    )}
                    {!unsupported && st?.participants === 1 && (
                      <span className="rounded-full bg-warning/15 px-2.5 py-0.5 text-warning" title={s.singleSourceHint}>⚠ {s.singleSource}</span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
