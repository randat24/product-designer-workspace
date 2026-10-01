import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { getProjectContext } from "@/domains/projects";
import { getGuide } from "@/domains/research";
import { GuideBuilder } from "@/domains/research/guide-builder";
import { PageHeader } from "@/shared/ui/page-header";
import { t } from "@/shared/i18n/uk";
import { BackLink } from "@/shared/ui/back-link";

export const metadata: Metadata = { title: t.research.guides };

export default async function GuidePage({ params }: { params: Promise<{ ws: string; project: string; id: string }> }) {
  const { ws, project: slug, id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const ctx = await getProjectContext(ws, slug);
  if (!ctx) notFound();
  const guide = await getGuide(ctx.project.id, id);
  if (!guide) notFound();

  return (
    <div className="max-w-4xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <BackLink href={`${ctx.base}/research`} className="mb-0">{t.research.guide.back}</BackLink>
        <Link href={`${ctx.base}/research/participants`} className="text-meta font-semibold underline underline-offset-2">{t.research.guide.startInterview}</Link>
      </div>
      <PageHeader title={guide.title} lede={t.research.guide.lede} />
      <GuideBuilder key={guide.id} projectId={ctx.project.id} guideId={guide.id} canEdit={ctx.canEdit}
        meta={{ title: guide.title, intro: guide.intro, outro: guide.outro }} questions={guide.questions} />
    </div>
  );
}
