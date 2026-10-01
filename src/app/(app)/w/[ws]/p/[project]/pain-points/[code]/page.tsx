import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProjectContext } from "@/domains/projects";
import { getPainPointByCode, getSynthesisStats } from "@/domains/synthesis";
import { createSynthesisEntity } from "@/domains/synthesis/actions";
import { DeleteEntityButton, PainPointEditor } from "@/domains/synthesis/editors";
import { EvidenceList } from "@/domains/synthesis/evidence-list";
import { TracePanel } from "@/domains/trace";
import { Button } from "@/shared/ui/button";
import { EntityLayout } from "@/shared/ui/entity-layout";
import { EntityChip } from "@/shared/ui/entity-chip";
import { PageHeader } from "@/shared/ui/page-header";
import { t } from "@/shared/i18n/uk";
import { BackLink } from "@/shared/ui/back-link";

type Params = { ws: string; project: string; code: string };
export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  return { title: `${decodeURIComponent((await params).code).toUpperCase()} · ${t.synthesis.painPoints.title}` };
}
const s = t.synthesis.painPoints;

export default async function PainPointPage({ params }: { params: Promise<Params> }) {
  const { ws, project: slug, code } = await params;
  const ctx = await getProjectContext(ws, slug);
  if (!ctx) notFound();
  const p = await getPainPointByCode(ctx.project.id, decodeURIComponent(code));
  if (!p) notFound();
  const freq = (await getSynthesisStats(ctx.project.id)).get(p.id)?.participants ?? 0;

  return (
    <EntityLayout aside={<TracePanel projectId={ctx.project.id} base={ctx.base} entity={{ type: "pain_point", id: p.id, code: p.code }} canEdit={ctx.canEdit} needsSources />}>
      <BackLink href={`${ctx.base}/pain-points`}>{t.synthesis.back(s.title)}</BackLink>
      <PageHeader title={p.title} eyebrow={<EntityChip type="pain_point" code={p.code} />}
        stat={{ value: freq, caption: s.frequencyLong() }} />
      <div className="flex flex-col gap-8">
        <PainPointEditor key={p.id} id={p.id} canEdit={ctx.canEdit}
          initial={{ title: p.title, description: p.description, severity: p.severity, segment_label: p.segment_label }} />
        <section aria-labelledby="evidence-h" className="flex flex-col gap-3">
          <h2 id="evidence-h" className="text-heading font-semibold">{t.synthesis.insights.evidence}</h2>
          <EvidenceList type="pain_point" id={p.id} base={ctx.base} empty={t.synthesis.insights.evidenceEmpty} />
        </section>
        {ctx.canEdit && (
          <form action={createSynthesisEntity}>
            <input type="hidden" name="type" value="opportunity" />
            <input type="hidden" name="projectId" value={ctx.project.id} />
            <input type="hidden" name="fromType" value="pain_point" />
            <input type="hidden" name="fromId" value={p.id} />
            <Button type="submit">{s.toOpportunity}</Button>
          </form>
        )}
        {ctx.canEdit && <DeleteEntityButton type="pain_point" id={p.id} label={s.delete} />}
      </div>
    </EntityLayout>
  );
}
