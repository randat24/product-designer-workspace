import { TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectContext } from "@/domains/projects";
import { DECISION_STATUSES, listDecisions } from "@/domains/design";
import { createDecision } from "@/domains/design/actions";
import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";
import { cn } from "@/shared/lib/cn";
import { t } from "@/shared/i18n/uk";
import { ActionForm } from "@/shared/ui/action-form";

export const metadata: Metadata = { title: t.decisions.title };
const dc = t.decisions;
const dateFmt = new Intl.DateTimeFormat("uk", { day: "numeric", month: "short", year: "numeric" });

export default async function DecisionsPage({ params }: { params: Promise<{ ws: string; project: string }> }) {
  const { ws, project: slug } = await params;
  const ctx = await getProjectContext(ws, slug);
  if (!ctx) notFound();
  const decisions = await listDecisions(ctx.project.id);

  return (
    <div className="flex max-w-6xl flex-col gap-8">
      <div>
        <PageHeader title={dc.title} lede={dc.lede} />
        {ctx.canEdit && (
          <ActionForm action={createDecision} idempotent>
            <input type="hidden" name="projectId" value={ctx.project.id} />
            <Button type="submit" variant="secondary">{dc.add}</Button>
          </ActionForm>
        )}
      </div>

      {decisions.length === 0 ? (
        <p className="rounded-panel border-[1.5px] border-dashed border-line p-7 text-center text-fg-secondary">{dc.empty}</p>
      ) : (
        <div className="relative overflow-x-auto rounded-panel border border-line bg-surface">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b border-line text-caption font-semibold text-fg-secondary">
              <tr>
                <th scope="col" className="px-4 py-2.5">{dc.columns.decision}</th>
                <th scope="col" className="px-4 py-2.5">{dc.columns.status}</th>
                <th scope="col" className="px-4 py-2.5">{dc.columns.date}</th>
                <th scope="col" className="px-4 py-2.5">{dc.columns.author}</th>
                <th scope="col" className="px-4 py-2.5">{dc.columns.evidence}</th>
              </tr>
            </thead>
            <tbody>
              {decisions.map((d) => (
                <tr key={d.id} className={cn("border-b border-line last:border-0 hover:bg-subtle", d.status === "superseded" && "text-fg-secondary")}>
                  <td className="px-4 py-3">
                    <Link href={`${ctx.base}/decisions/${d.code}`} className={cn("font-bold hover:underline", d.status === "superseded" && "line-through")}>
                      <span className="mr-2 text-caption text-fg-secondary tabular-nums">{d.code}</span>{d.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-meta font-semibold">{DECISION_STATUSES.find((x) => x.value === d.status)?.label}</td>
                  <td className="px-4 py-3 text-meta tabular-nums whitespace-nowrap">{dateFmt.format(new Date(d.decidedAt))}</td>
                  <td className="px-4 py-3 text-meta">{d.author ?? "—"}</td>
                  <td className="px-4 py-3 text-meta tabular-nums">
                    {d.evidence > 0 ? d.evidence : <span className="inline-flex items-center gap-1 font-semibold text-warning"><TriangleAlert aria-hidden className="size-4 shrink-0" />{dc.noEvidence}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
