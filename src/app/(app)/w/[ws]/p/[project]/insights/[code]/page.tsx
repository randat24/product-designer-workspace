import { TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProjectContext } from "@/domains/projects";
import { getInsightByCode, getSynthesisStats } from "@/domains/synthesis";
import { createSynthesisEntity } from "@/domains/synthesis/actions";
import { DeleteEntityButton, InsightEditor } from "@/domains/synthesis/editors";
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
  return { title: `${decodeURIComponent((await params).code).toUpperCase()} · ${t.synthesis.insights.title}` };
}
const s = t.synthesis.insights;

export default async function InsightPage({ params }: { params: Promise<Params> }) {
  const { ws, project: slug, code } = await params;
  const ctx = await getProjectContext(ws, slug);
  if (!ctx) notFound();
  const i = await getInsightByCode(ctx.project.id, decodeURIComponent(code));
  if (!i) notFound();
  const st = (await getSynthesisStats(ctx.project.id)).get(i.id);

  return (
    <EntityLayout aside={<TracePanel projectId={ctx.project.id} base={ctx.base} entity={{ type: "insight", id: i.id, code: i.code }} canEdit={ctx.canEdit} needsSources />}>
      <BackLink href={`${ctx.base}/insights`}>{t.synthesis.back(s.title)}</BackLink>
      <PageHeader title={i.title} eyebrow={<span className="flex items-center gap-2"><EntityChip type="insight" code={i.code} />{s.participants(st?.participants ?? 0)}</span>} />
      <div className="flex flex-col gap-8">
        <InsightEditor key={i.id} id={i.id} canEdit={ctx.canEdit} version={i.updated_at}
          initial={{ title: i.title, statement: i.statement, confidence: i.confidence, status: i.status }} />
        {/* Cognitive bias (docs/UX_LAWS.md, UX-08): one voice is not a pattern yet. */}
        {st && st.sources > 0 && st.participants === 1 && (
          <p role="note" className="max-w-[62ch] rounded-panel border border-dashed border-warning px-4 py-3 text-sm">
            <span className="inline-flex items-center gap-1 font-semibold text-warning"><TriangleAlert aria-hidden className="size-4 shrink-0" />{s.singleSource}.</span> {s.singleSourceHint}
          </p>
        )}
        <section aria-labelledby="evidence-h" className="flex flex-col gap-3">
          <h2 id="evidence-h" className="text-heading font-semibold">{s.evidence}</h2>
          <EvidenceList type="insight" id={i.id} base={ctx.base} empty={s.evidenceEmpty} />
        </section>
        {ctx.canEdit && (
          <div className="flex flex-wrap gap-2">
            {(["pain_point", "opportunity"] as const).map((type) => (
              <form key={type} action={createSynthesisEntity}>
                <input type="hidden" name="type" value={type} />
                <input type="hidden" name="projectId" value={ctx.project.id} />
                <input type="hidden" name="fromType" value="insight" />
                <input type="hidden" name="fromId" value={i.id} />
                <Button type="submit" variant={type === "pain_point" ? "primary" : "secondary"}>
                  {type === "pain_point" ? s.toPainPoint : s.toOpportunity}
                </Button>
              </form>
            ))}
          </div>
        )}
        {ctx.canEdit && <DeleteEntityButton type="insight" id={i.id} label={s.delete} />}
      </div>
    </EntityLayout>
  );
}
