import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProjectContext } from "@/domains/projects";
import { getInterviewByCode, participantTitle } from "@/domains/research";
import { LiveInterview } from "@/domains/research/live-interview";
import { t } from "@/shared/i18n/uk";

export const metadata: Metadata = { title: t.research.live.title };

export default async function LivePage({ params }: { params: Promise<{ ws: string; project: string; code: string }> }) {
  const { ws, project: slug, code } = await params;
  const ctx = await getProjectContext(ws, slug);
  if (!ctx) notFound();
  const iv = await getInterviewByCode(ctx.project.id, decodeURIComponent(code));
  if (!iv || !iv.participants) notFound();

  return (
    <LiveInterview interviewId={iv.id} code={iv.code} status={iv.status} startedAt={iv.conducted_at} canEdit={ctx.canEdit}
      participant={`${iv.participants.code} · ${participantTitle(iv.participants)}`}
      intro={iv.guide?.intro ?? null} outro={iv.guide?.outro ?? null} questions={iv.guide?.questions ?? []} answers={iv.answers}
      detailHref={`${ctx.base}/research/interviews/${iv.code}`} />
  );
}
