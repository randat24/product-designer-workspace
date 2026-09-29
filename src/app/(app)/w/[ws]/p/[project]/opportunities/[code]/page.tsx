import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectContext } from "@/domains/projects";
import { getOpportunityByCode, getSynthesisStats } from "@/domains/synthesis";
import { DeleteEntityButton, OpportunityEditor } from "@/domains/synthesis/editors";
import { EvidenceList } from "@/domains/synthesis/evidence-list";
import { TracePanel } from "@/domains/trace";
import { EntityLayout } from "@/shared/ui/entity-layout";
import { EntityChip } from "@/shared/ui/entity-chip";
import { PageHeader } from "@/shared/ui/page-header";
import { t } from "@/shared/i18n/ru";

type Params = { ws: string; project: string; code: string };
export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  return { title: `${decodeURIComponent((await params).code).toUpperCase()} · ${t.synthesis.opportunities.title}` };
}
const s = t.synthesis.opportunities;

export default async function OpportunityPage({ params }: { params: Promise<Params> }) {
  const { ws, project: slug, code } = await params;
  const ctx = await getProjectContext(ws, slug);
  if (!ctx) notFound();
  const o = await getOpportunityByCode(ctx.project.id, decodeURIComponent(code));
  if (!o) notFound();
  const st = (await getSynthesisStats(ctx.project.id)).get(o.id);

  return (
    <EntityLayout aside={<TracePanel projectId={ctx.project.id} base={ctx.base} entity={{ type: "opportunity", id: o.id, code: o.code }} canEdit={ctx.canEdit} needsSources />}>
      <Link href={`${ctx.base}/opportunities`} className="mb-4 inline-block text-[13px] font-semibold text-fg-secondary hover:text-fg">{t.synthesis.back(s.title)}</Link>
      <PageHeader title={o.title} eyebrow={<EntityChip type="opportunity" code={o.code} />}
        stat={{ value: st?.participants ?? 0, caption: s.participants }} />
      <div className="flex flex-col gap-8">
        <OpportunityEditor key={o.id} id={o.id} canEdit={ctx.canEdit}
          initial={{ title: o.title, description: o.description, hmw: o.hmw, impact: o.impact, effort: o.effort, status: o.status }} />
        <section aria-labelledby="evidence-h" className="flex flex-col gap-3">
          <h2 id="evidence-h" className="text-heading font-semibold">{t.synthesis.insights.evidence}</h2>
          <EvidenceList type="opportunity" id={o.id} base={ctx.base} empty={t.synthesis.insights.evidenceEmpty} />
        </section>
        {ctx.canEdit && <DeleteEntityButton type="opportunity" id={o.id} label={s.delete} />}
      </div>
    </EntityLayout>
  );
}
