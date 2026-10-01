import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProjectContext } from "@/domains/projects";
import { COMPETITOR_KINDS, getCompetitorByCode, listScreenshots } from "@/domains/competitors";
import { CompetitorEditor } from "@/domains/competitors/competitor-editor";
import { Screenshots } from "@/domains/competitors/screenshots";
import { PageHeader } from "@/shared/ui/page-header";
import { EntityChip } from "@/shared/ui/entity-chip";
import { t } from "@/shared/i18n/uk";
import { BackLink } from "@/shared/ui/back-link";

type Params = { ws: string; project: string; code: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { code } = await params;
  return { title: `${decodeURIComponent(code).toUpperCase()} · ${t.competitors.title}` };
}

export default async function CompetitorPage({ params }: { params: Promise<Params> }) {
  const { ws, project: slug, code } = await params;
  const ctx = await getProjectContext(ws, slug);
  if (!ctx) notFound();
  const c = await getCompetitorByCode(ctx.project.id, decodeURIComponent(code));
  if (!c) notFound();
  const screenshots = await listScreenshots("competitor", c.id);

  const kind = c.is_own_product ? t.competitors.ownBadge : COMPETITOR_KINDS.find((k) => k.value === c.kind)?.label;

  return (
    <div className="max-w-4xl">
      <BackLink href={`${ctx.base}/competitors`}>{t.competitors.back}</BackLink>
      <PageHeader title={c.name}
        eyebrow={<span className="flex items-center gap-2"><EntityChip type="competitor" code={c.code} title={c.name} />{kind}</span>} />
      <CompetitorEditor
        key={c.id}
        id={c.id}
        isOwn={c.is_own_product}
        canEdit={ctx.canEdit}
        initial={{
          name: c.name, url: c.url, kind: c.kind,
          positioning: c.positioning, target_audience: c.target_audience, pricing: c.pricing,
          onboarding_notes: c.onboarding_notes, navigation_notes: c.navigation_notes,
          ux_patterns: c.ux_patterns, ui_patterns: c.ui_patterns,
          strengths: c.strengths, weaknesses: c.weaknesses, reviews_summary: c.reviews_summary,
          opportunities: c.opportunities, borrow: c.borrow,
        }}
        screenshots={<Screenshots projectId={ctx.project.id} entityId={c.id} items={screenshots} canEdit={ctx.canEdit} />}
      />
    </div>
  );
}
