import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectContext } from "@/domains/projects";
import { getObservationByCode, type ObservationKind } from "@/domains/synthesis";
import { ObservationEditor } from "@/domains/synthesis/card-tools";
import { DeleteEntityButton } from "@/domains/synthesis/editors";
import { TracePanel } from "@/domains/trace";
import { EntityLayout } from "@/shared/ui/entity-layout";
import { EntityChip } from "@/shared/ui/entity-chip";
import { PageHeader } from "@/shared/ui/page-header";
import { t } from "@/shared/i18n/uk";
import { BackLink } from "@/shared/ui/back-link";

type Params = { ws: string; project: string; code: string };
export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  return { title: decodeURIComponent((await params).code).toUpperCase() };
}

export default async function ObservationPage({ params }: { params: Promise<Params> }) {
  const { ws, project: slug, code } = await params;
  const ctx = await getProjectContext(ws, slug);
  if (!ctx) notFound();
  const o = await getObservationByCode(ctx.project.id, decodeURIComponent(code));
  if (!o) notFound();

  return (
    <EntityLayout aside={<TracePanel projectId={ctx.project.id} base={ctx.base} entity={{ type: "observation", id: o.id, code: o.code }} canEdit={ctx.canEdit} />}>
      <BackLink href={`${ctx.base}/synthesis`}>{t.synthesis.back(t.synthesis.title)}</BackLink>
      <PageHeader title={t.synthesis.observation.text} eyebrow={<EntityChip type="observation" code={o.code} />} />
      <div className="flex flex-col gap-6">
        <ObservationEditor id={o.id} canEdit={ctx.canEdit} initial={{ kind: o.kind as ObservationKind, body_text: o.body_text }} />
        {o.participants && (
          <p className="text-sm text-fg-secondary">
            {o.participants.code} · {o.participants.role}
            {o.interviews && <> · <Link href={`${ctx.base}/research/interviews/${o.interviews.code}`} className="font-semibold text-fg underline underline-offset-2">{t.synthesis.observation.from} {o.interviews.code}</Link></>}
          </p>
        )}
        {ctx.canEdit && <DeleteEntityButton type="observation" id={o.id} label={t.synthesis.observation.delete} />}
      </div>
    </EntityLayout>
  );
}
