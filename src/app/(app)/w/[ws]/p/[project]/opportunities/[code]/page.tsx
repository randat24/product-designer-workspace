import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProjectContext } from "@/domains/projects";
import { getOpportunityByCode, getSynthesisStats } from "@/domains/synthesis";
import { DeleteEntityButton, OpportunityEditor } from "@/domains/synthesis/editors";
import { EvidenceList } from "@/domains/synthesis/evidence-list";
import { createFlow } from "@/domains/flows/actions";
import { Button } from "@/shared/ui/button";
import { TracePanel } from "@/domains/trace";
import { EntityLayout } from "@/shared/ui/entity-layout";
import { EntityChip } from "@/shared/ui/entity-chip";
import { PageHeader } from "@/shared/ui/page-header";
import { t } from "@/shared/i18n/uk";
import { BackLink } from "@/shared/ui/back-link";
import { ActionForm } from "@/shared/ui/action-form";

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
      <BackLink href={`${ctx.base}/opportunities`}>{t.synthesis.back(s.title)}</BackLink>
      <PageHeader title={o.title} eyebrow={<EntityChip type="opportunity" code={o.code} />}
        stat={{ value: st?.participants ?? 0, caption: s.participants }} />
      <div className="flex flex-col gap-8">
        <OpportunityEditor key={o.id} id={o.id} canEdit={ctx.canEdit} version={o.updated_at}
          initial={{ title: o.title, description: o.description, hmw: o.hmw, impact: o.impact, effort: o.effort, status: o.status }} />
        <section aria-labelledby="evidence-h" className="flex flex-col gap-3">
          <h2 id="evidence-h" className="text-heading font-semibold">{t.synthesis.insights.evidence}</h2>
          <EvidenceList type="opportunity" id={o.id} base={ctx.base} empty={t.synthesis.insights.evidenceEmpty} />
        </section>
        {ctx.canEdit && (
          <ActionForm action={createFlow} idempotent>
            <input type="hidden" name="projectId" value={ctx.project.id} />
            <input type="hidden" name="opportunityId" value={o.id} />
            <Button type="submit" variant="secondary">{t.flows.fromOpportunity}<ArrowRight aria-hidden className="size-4" /></Button>
          </ActionForm>
        )}
        {ctx.canEdit && <DeleteEntityButton type="opportunity" id={o.id} label={s.delete} />}
      </div>
    </EntityLayout>
  );
}
