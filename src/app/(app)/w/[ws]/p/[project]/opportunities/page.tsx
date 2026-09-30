import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectContext } from "@/domains/projects";
import { EFFORT_LEVELS, IMPACT_LEVELS, labelOf, listOpportunities, OPPORTUNITY_STATUSES } from "@/domains/synthesis";
import { createSynthesisEntity } from "@/domains/synthesis/actions";
import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";
import { cn } from "@/shared/lib/cn";
import { t } from "@/shared/i18n/ru";

export const metadata: Metadata = { title: t.synthesis.opportunities.title };
const s = t.synthesis.opportunities;
const IMPACT_ROWS = ["high", "medium", "low"] as const;
const EFFORT_COLS = ["low", "medium", "high"] as const;

export default async function OpportunitiesPage({ params }: { params: Promise<{ ws: string; project: string }> }) {
  const { ws, project: slug } = await params;
  const ctx = await getProjectContext(ws, slug);
  if (!ctx) notFound();
  const items = await listOpportunities(ctx.project.id);

  return (
    <div className="flex max-w-6xl flex-col gap-8">
      <div>
        <PageHeader title={s.title} lede={s.lede} />
        {ctx.canEdit && (
          <form action={createSynthesisEntity}>
            <input type="hidden" name="type" value="opportunity" />
            <input type="hidden" name="projectId" value={ctx.project.id} />
            <Button type="submit" variant="secondary">{s.add}</Button>
          </form>
        )}
      </div>

      {items.length === 0 ? (
        <p className="rounded-panel border-[1.5px] border-dashed border-line p-7 text-center text-fg-secondary">{s.empty}</p>
      ) : (
        <>
          <section aria-labelledby="opp-matrix-h" className="flex flex-col gap-3">
            <h2 id="opp-matrix-h" className="text-heading font-semibold">{s.matrix}</h2>
            <p className="text-meta text-fg-secondary">{s.matrixHint}</p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] table-fixed border-separate border-spacing-2">
                <thead>
                  <tr>
                    <th className="w-24" />
                    {EFFORT_COLS.map((e) => (
                      <th key={e} scope="col" className="text-meta font-semibold text-fg-secondary">{s.effort}: {labelOf(EFFORT_LEVELS, e).toLowerCase()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {IMPACT_ROWS.map((imp) => (
                    <tr key={imp}>
                      <th scope="row" className="text-left text-meta font-semibold text-fg-secondary">{s.impact}: {labelOf(IMPACT_LEVELS, imp).toLowerCase()}</th>
                      {EFFORT_COLS.map((eff) => {
                        const cell = items.filter((o) => o.impact === imp && o.effort === eff);
                        const quickWin = imp === "high" && eff === "low";
                        return (
                          <td key={eff} className={cn("h-28 rounded-panel border p-2 align-top",
                            quickWin ? "border-[1.5px] border-success bg-success/5" : "border-line bg-surface")}>
                            <ul className="flex flex-col gap-1.5">
                              {cell.map((o) => (
                                <li key={o.id}>
                                  <Link href={`${ctx.base}/opportunities/${o.code}`}
                                    className="block rounded-control bg-[var(--s2)] px-2.5 py-1.5 text-meta leading-snug font-semibold text-on-sticky hover:brightness-95">
                                    <span className="opacity-60">{o.code}</span> {o.title}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <ul className="flex flex-col gap-2">
            {items.map((o) => (
              <li key={o.id}>
                <Link href={`${ctx.base}/opportunities/${o.code}`} className="flex flex-col gap-1 rounded-panel border border-line bg-surface p-4 hover:border-fg">
                  <span className="flex flex-wrap items-baseline justify-between gap-3">
                    <span className="font-bold"><span className="mr-2 text-caption text-fg-secondary tabular-nums">{o.code}</span>{o.title}</span>
                    <span className="text-caption font-semibold text-fg-secondary">{labelOf(OPPORTUNITY_STATUSES, o.status)}</span>
                  </span>
                  {o.hmw && <span className="text-sm italic">{o.hmw}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
