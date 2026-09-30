import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectContext } from "@/domains/projects";
import { getQuoteByCode } from "@/domains/synthesis";
import { QuoteText, QuoteToObservation } from "@/domains/synthesis/card-tools";
import { DeleteEntityButton } from "@/domains/synthesis/editors";
import { TracePanel } from "@/domains/trace";
import { EntityLayout } from "@/shared/ui/entity-layout";
import { EntityChip } from "@/shared/ui/entity-chip";
import { PageHeader } from "@/shared/ui/page-header";
import { t } from "@/shared/i18n/ru";
import { BackLink } from "@/shared/ui/back-link";

type Params = { ws: string; project: string; code: string };
export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  return { title: decodeURIComponent((await params).code).toUpperCase() };
}

export default async function QuotePage({ params }: { params: Promise<Params> }) {
  const { ws, project: slug, code } = await params;
  const ctx = await getProjectContext(ws, slug);
  if (!ctx) notFound();
  const q = await getQuoteByCode(ctx.project.id, decodeURIComponent(code));
  if (!q) notFound();
  const who = q.participants ? `${q.participants.code} · ${q.participants.role ?? ""}` : "";

  return (
    <EntityLayout aside={<TracePanel projectId={ctx.project.id} base={ctx.base} entity={{ type: "quote", id: q.id, code: q.code }} canEdit={ctx.canEdit} />}>
      <BackLink href={`${ctx.base}/synthesis`}>{t.synthesis.back(t.synthesis.title)}</BackLink>
      <PageHeader title={t.synthesis.quotes.quoteOf(q.participants?.code ?? "")} eyebrow={<EntityChip type="quote" code={q.code} />} />
      <div className="flex flex-col gap-6">
        <QuoteText id={q.id} initial={q.text} canEdit={ctx.canEdit} />
        <p className="text-sm text-fg-secondary">
          {who}
          {q.interviews && <> · <Link href={`${ctx.base}/research/interviews/${q.interviews.code}`} className="font-semibold text-fg underline underline-offset-2">{t.synthesis.quotes.interview} {q.interviews.code}</Link></>}
        </p>
        {ctx.canEdit && <QuoteToObservation projectId={ctx.project.id} quoteId={q.id} text={q.text} />}
        {ctx.canEdit && <DeleteEntityButton type="quote" id={q.id} label={t.synthesis.quotes.delete} />}
      </div>
    </EntityLayout>
  );
}
