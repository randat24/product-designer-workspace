import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectContext } from "@/domains/projects";
import { getResearchMatrix, listGuides } from "@/domains/research";
import { ResearchMatrix } from "@/domains/research/research-matrix";
import { PageHeader } from "@/shared/ui/page-header";
import { cn } from "@/shared/lib/cn";
import { t } from "@/shared/i18n/uk";
import { ResearchTabs } from "../tabs";

export const metadata: Metadata = { title: t.research.matrix.title };

export default async function ResearchMatrixPage({ params, searchParams }: {
  params: Promise<{ ws: string; project: string }>;
  searchParams: Promise<{ guide?: string }>;
}) {
  const [{ ws, project: slug }, { guide: guideParam }] = await Promise.all([params, searchParams]);
  const ctx = await getProjectContext(ws, slug);
  if (!ctx) notFound();
  const guides = await listGuides(ctx.project.id);
  // Default to the guide with the most questions (usually the one in use).
  const guide = guides.find((g) => g.id === guideParam) ?? [...guides].sort((a, b) => b.questionCount - a.questionCount)[0];
  const matrix = guide ? await getResearchMatrix(ctx.project.id, guide.id) : null;

  return (
    <div className="max-w-[1400px]">
      <PageHeader title={t.research.matrix.title} lede={t.research.matrix.lede} />
      <ResearchTabs base={ctx.base} current="matrix" />
      {guides.length > 1 && (
        <nav aria-label={t.research.matrix.guide} className="mb-4 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-meta font-semibold text-fg-secondary">{t.research.matrix.guide}:</span>
          {guides.map((g) => (
            <Link key={g.id} href={`?guide=${g.id}`} aria-current={g.id === guide?.id ? "true" : undefined}
              className={cn("rounded-[4px] border px-3 py-0.5 text-meta font-semibold",
                g.id === guide?.id ? "border-fg bg-fg text-canvas" : "border-line text-fg-secondary hover:border-fg")}>
              {g.title}
            </Link>
          ))}
        </nav>
      )}
      {!matrix ? (
        <p className="rounded-panel border border-dashed border-line p-7 text-center text-fg-secondary">{t.research.matrix.noGuides}</p>
      ) : (
        <ResearchMatrix key={matrix.guide.id + matrix.interviews.length} projectId={ctx.project.id} guideId={matrix.guide.id} base={ctx.base}
          canEdit={ctx.canEdit} questions={matrix.guide.questions} cells={matrix.cells}
          interviews={matrix.interviews.map((i) => ({ id: i.id, code: i.code, participant: i.participants }))} />
      )}
    </div>
  );
}
