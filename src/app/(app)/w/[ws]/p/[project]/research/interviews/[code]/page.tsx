import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectContext } from "@/domains/projects";
import { getInterviewByCode, participantTitle } from "@/domains/research";
import { InterviewEditor } from "@/domains/research/interview-editor";
import { listInterviewSynthesis } from "@/domains/synthesis";
import { PageHeader } from "@/shared/ui/page-header";
import { EntityChip } from "@/shared/ui/entity-chip";
import { t } from "@/shared/i18n/ru";

type Params = { ws: string; project: string; code: string };
export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  return { title: `${decodeURIComponent((await params).code).toUpperCase()} · ${t.research.interviews}` };
}

export default async function InterviewPage({ params }: { params: Promise<Params> }) {
  const { ws, project: slug, code } = await params;
  const ctx = await getProjectContext(ws, slug);
  if (!ctx) notFound();
  const iv = await getInterviewByCode(ctx.project.id, decodeURIComponent(code));
  if (!iv || !iv.participants) notFound();
  const p = iv.participants;
  const synthesis = await listInterviewSynthesis(iv.id);

  return (
    <div className="max-w-4xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href={`${ctx.base}/research/participants/${p.code}`} className="text-meta font-semibold text-fg-secondary hover:text-fg">
          ← {t.research.interview.back(p.code)}
        </Link>
        <Link href={`${ctx.base}/research/interviews/${iv.code}/live`} className="rounded-control bg-fg px-3.5 py-1.5 text-sm font-semibold text-canvas">
          {t.research.interview.live}
        </Link>
      </div>
      <PageHeader title={`${p.code} · ${participantTitle(p)}`}
        eyebrow={<span className="flex items-center gap-2"><EntityChip type="interview" code={iv.code} />{iv.guide?.title}</span>} />
      <p className="-mt-4 mb-6 text-meta text-fg-secondary">{t.synthesis.quotes.selectHint} · ⌥Q / ⌥O</p>
      <InterviewEditor key={iv.id} interviewId={iv.id} canEdit={ctx.canEdit} projectId={ctx.project.id} base={ctx.base} synthesis={synthesis}
        meta={{ conducted_at: iv.conducted_at, duration_min: iv.duration_min, mode: iv.mode, status: iv.status, notes: iv.notes }}
        questions={iv.guide?.questions ?? null} answers={iv.answers} />
    </div>
  );
}
