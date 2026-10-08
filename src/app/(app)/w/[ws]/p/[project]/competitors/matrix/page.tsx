import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProjectContext } from "@/domains/projects";
import { getMatrix, listCompetitors, listReminders } from "@/domains/competitors";
import { RemindersPanel } from "@/domains/competitors/reminders";
import { createCompetitor } from "@/domains/competitors/actions";
import { ComparisonMatrix } from "@/domains/competitors/matrix";
import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";
import { t } from "@/shared/i18n/uk";
import { CompetitorTabs } from "../tabs";

export const metadata: Metadata = { title: `${t.competitors.tabs.matrix} · ${t.competitors.title}` };

export default async function MatrixPage({ params }: { params: Promise<{ ws: string; project: string }> }) {
  const { ws, project: slug } = await params;
  const ctx = await getProjectContext(ws, slug);
  if (!ctx) notFound();
  const [competitors, matrix, reminders] = await Promise.all([
    listCompetitors(ctx.project.id), getMatrix(ctx.project.id, "feature"), listReminders(ctx.project.id),
  ]);
  const hasOwn = competitors.some((c) => c.is_own_product);

  return (
    <div className="max-w-7xl">
      <PageHeader title={t.competitors.title} lede={t.competitors.matrix.lede} />
      <CompetitorTabs base={ctx.base} current="matrix" />
      {!hasOwn && ctx.canEdit && competitors.length > 0 && (
        <form action={createCompetitor} className="mb-4 flex flex-wrap items-center gap-3 rounded-panel border border-dashed border-line px-4 py-2.5 text-meta">
          <input type="hidden" name="projectId" value={ctx.project.id} />
          <input type="hidden" name="own" value="1" />
          <span>{t.competitors.matrix.noOwn}</span>
          <Button type="submit" variant="secondary" className="h-8">{t.competitors.addOwn}</Button>
        </form>
      )}
      <ComparisonMatrix
        key={matrix.features.map((f) => f.id).join()}
        projectId={ctx.project.id}
        base={ctx.base}
        canEdit={ctx.canEdit}
        products={competitors.map((c) => ({ id: c.id, code: c.code, name: c.name, is_own_product: c.is_own_product, kind: c.kind }))}
        features={matrix.features}
        cells={matrix.cells}
        notes={matrix.notes}
      />
      <div className="mt-8"><RemindersPanel base={ctx.base} initial={reminders} canEdit={ctx.canEdit} /></div>
    </div>
  );
}
