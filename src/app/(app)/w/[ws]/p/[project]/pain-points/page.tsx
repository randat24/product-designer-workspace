import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectContext } from "@/domains/projects";
import { getSynthesisStats, labelOf, listPainPoints, SEVERITIES, SEVERITY_WEIGHT } from "@/domains/synthesis";
import { createSynthesisEntity } from "@/domains/synthesis/actions";
import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";
import { cn } from "@/shared/lib/cn";
import { t } from "@/shared/i18n/uk";

export const metadata: Metadata = { title: t.synthesis.painPoints.title };
const s = t.synthesis.painPoints;
const SEV_CLASS: Record<string, string> = {
  critical: "bg-danger text-on-status", high: "bg-danger/10 text-danger", medium: "bg-warning/10 text-warning", low: "bg-subtle text-fg-secondary",
};

export default async function PainPointsPage({ params }: { params: Promise<{ ws: string; project: string }> }) {
  const { ws, project: slug } = await params;
  const ctx = await getProjectContext(ws, slug);
  if (!ctx) notFound();
  const [items, stats] = await Promise.all([listPainPoints(ctx.project.id), getSynthesisStats(ctx.project.id)]);
  const freq = (id: string) => stats.get(id)?.participants ?? 0;
  // Priority = severity × frequency (docs/IA.md: /pain-points).
  const sorted = [...items].sort((a, b) => SEVERITY_WEIGHT[b.severity]! * Math.max(freq(b.id), 1) - SEVERITY_WEIGHT[a.severity]! * Math.max(freq(a.id), 1));
  const max = Math.max(1, ...items.map((i) => freq(i.id)));

  return (
    <div className="max-w-6xl">
      <PageHeader title={s.title} lede={s.lede} />
      {ctx.canEdit && (
        <form action={createSynthesisEntity} className="mb-5">
          <input type="hidden" name="type" value="pain_point" />
          <input type="hidden" name="projectId" value={ctx.project.id} />
          <Button type="submit" variant="secondary">{s.add}</Button>
        </form>
      )}
      {sorted.length === 0 ? (
        <p className="rounded-panel border-[1.5px] border-dashed border-line p-7 text-center text-fg-secondary">{s.empty}</p>
      ) : (
        <div className="relative overflow-x-auto rounded-panel border border-line bg-surface">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left text-meta text-fg-secondary">
                {Object.values(s.columns).map((c) => <th key={c} scope="col" className="px-4 py-2.5 font-semibold">{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => (
                <tr key={p.id} className="border-b border-line last:border-0 hover:bg-subtle">
                  <td className="px-4 py-3 font-semibold tabular-nums"><Link href={`${ctx.base}/pain-points/${p.code}`} className="hover:underline">{p.code}</Link></td>
                  <td className="px-4 py-3"><Link href={`${ctx.base}/pain-points/${p.code}`} className="font-bold">{p.title}</Link></td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-full px-2.5 py-0.5 text-caption font-bold", SEV_CLASS[p.severity])}>{labelOf(SEVERITIES, p.severity)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-24 overflow-hidden rounded-full bg-subtle" aria-hidden>
                        <span className="block h-full bg-entity-problem" style={{ width: `${(freq(p.id) / max) * 100}%` }} />
                      </span>
                      <span className="font-semibold tabular-nums">{s.frequency(freq(p.id))}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-fg-secondary">{p.segment_label ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
