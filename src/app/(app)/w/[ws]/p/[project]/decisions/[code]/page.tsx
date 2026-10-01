import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectContext } from "@/domains/projects";
import { asAlternatives, getDecisionByCode, getEvidenceSuggestions, listDecisions } from "@/domains/design";
import { addEvidence } from "@/domains/design/actions";
import { DecisionEditor, DeleteDecisionButton } from "@/domains/design/editors";
import { EvidenceList } from "@/domains/synthesis/evidence-list";
import { TracePanel } from "@/domains/trace";
import { getTraceGraph, resolveEntities } from "@/domains/trace/queries";
import { Button } from "@/shared/ui/button";
import { EntityChip } from "@/shared/ui/entity-chip";
import { EntityLayout } from "@/shared/ui/entity-layout";
import { PageHeader } from "@/shared/ui/page-header";
import { t } from "@/shared/i18n/uk";
import { BackLink } from "@/shared/ui/back-link";

type Params = { ws: string; project: string; code: string };
export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  return { title: `${decodeURIComponent((await params).code).toUpperCase()} · ${t.decisions.title}` };
}
const dc = t.decisions;

export default async function DecisionPage({ params }: { params: Promise<Params> }) {
  const { ws, project: slug, code } = await params;
  const ctx = await getProjectContext(ws, slug);
  if (!ctx) notFound();
  const d = await getDecisionByCode(ctx.project.id, decodeURIComponent(code));
  if (!d) notFound();
  const [all, suggestions, { upstream, downstream }] = await Promise.all([
    listDecisions(ctx.project.id), getEvidenceSuggestions(ctx.base, d.id), getTraceGraph("design_decision", d.id, 1),
  ]);
  const [targets, direct] = await Promise.all([
    resolveEntities(ctx.base, downstream.filter((e) => e.relation === "implements").map((e) => e.target)),
    resolveEntities(ctx.base, upstream.filter((e) => e.relation === "justifies").map((e) => e.source)),
  ]);
  const replacement = all.find((x) => x.id === d.superseded_by_id);
  const evidenceCount = all.find((x) => x.id === d.id)?.evidence ?? 0;

  return (
    <EntityLayout aside={<TracePanel projectId={ctx.project.id} base={ctx.base} entity={{ type: "design_decision", id: d.id, code: d.code }} canEdit={ctx.canEdit} needsSources />}>
      <BackLink href={`${ctx.base}/decisions`}>{dc.back}</BackLink>
      <PageHeader title={d.title} eyebrow={<EntityChip type="design_decision" code={d.code} />}
        stat={{ value: evidenceCount, caption: dc.evidence.toLowerCase() }} />
      {replacement && (
        <p role="status" className="mb-6 rounded-panel border-[1.5px] border-dashed border-line px-4 py-2.5 text-meta">
          <Link href={`${ctx.base}/decisions/${replacement.code}`} className="font-semibold underline underline-offset-2">
            {dc.supersededBanner(replacement.code)}
          </Link>
        </p>
      )}
      <div className="flex flex-col gap-10">
        <section aria-labelledby="implements-h" className="flex flex-col gap-3">
          <h2 id="implements-h" className="text-heading font-semibold">{dc.implements}</h2>
          {targets.size === 0 ? <p className="text-fg-secondary">{dc.implementsEmpty}</p> : (
            <ul className="flex flex-wrap gap-2">
              {[...targets.values()].map((e) => (
                <li key={e.id}>
                  <Link href={e.href} className="flex items-center gap-2 rounded-control border border-line bg-surface px-3 py-1.5 hover:border-fg">
                    <EntityChip type={e.type} code={e.code} /><span className="font-semibold">{e.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <DecisionEditor key={d.id} id={d.id} canEdit={ctx.canEdit}
          others={all.filter((x) => x.id !== d.id).map((x) => ({ id: x.id, code: x.code, title: x.title }))}
          initial={{
            title: d.title, context: d.context, decision: d.decision, reason: d.reason,
            alternatives: asAlternatives(d.alternatives), status: d.status, decided_at: d.decided_at, superseded_by_id: d.superseded_by_id,
          }} />

        <section aria-labelledby="evidence-h" className="flex flex-col gap-3">
          <h2 id="evidence-h" className="text-heading font-semibold">{dc.evidence}</h2>
          <p className="text-meta text-fg-secondary">{dc.evidenceHint}</p>
          {direct.size > 0 && (
            <ul className="flex flex-col gap-1.5">
              {[...direct.values()].map((e) => (
                <li key={`${e.type}:${e.id}`}>
                  <Link href={e.href} className="flex items-start gap-2 rounded-control border border-line bg-surface px-3 py-2 hover:border-fg">
                    <EntityChip type={e.type} code={e.code} />
                    <span className="min-w-0 text-sm leading-snug">{e.participant ? <b className="mr-1">{e.participant}</b> : null}{e.type === "quote" ? `«${e.title}»` : e.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <h3 className="mt-2 text-caption font-bold tracking-wide text-fg-secondary uppercase">{dc.voices}</h3>
          <EvidenceList type="design_decision" id={d.id} base={ctx.base} empty={direct.size ? dc.voicesEmpty : dc.evidenceEmpty} />
          {ctx.canEdit && suggestions.length > 0 && (
            <div className="flex flex-col gap-2 rounded-panel border-[1.5px] border-dashed border-line p-4">
              <h3 className="font-bold">{dc.suggestions}</h3>
              <p className="text-caption text-fg-secondary">{dc.suggestionsHint}</p>
              <ul className="flex flex-col gap-1.5">
                {suggestions.map((e) => (
                  <li key={`${e.type}:${e.id}`}>
                    <form action={addEvidence} className="flex items-center gap-2">
                      <input type="hidden" name="decisionId" value={d.id} />
                      <input type="hidden" name="sourceType" value={e.type} />
                      <input type="hidden" name="sourceId" value={e.id} />
                      <EntityChip type={e.type} code={e.code} />
                      <Link href={e.href} className="min-w-0 flex-1 truncate text-meta hover:underline">
                        {e.participant ? `${e.participant} · ` : ""}{e.title}
                      </Link>
                      <Button type="submit" variant="secondary" className="h-8 shrink-0" aria-label={`${dc.addEvidence}: ${e.code}`}><Plus aria-hidden className="size-4" />{dc.addEvidence}</Button>
                    </form>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {ctx.canEdit && <DeleteDecisionButton id={d.id} />}
      </div>
    </EntityLayout>
  );
}
