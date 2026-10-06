import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMyRole, getProjectBySlug, getWorkspaceBySlug } from "@/domains/projects";
import { getCaseForProject } from "@/domains/cases";
import { createCaseStudy } from "@/domains/cases/actions";
import { CaseEditor } from "@/domains/cases/case-editor";
import { draftFromSnapshot } from "@/domains/cases/schema";
import { Button } from "@/shared/ui/button";
import { Panel } from "@/shared/ui/field";
import { PageHeader } from "@/shared/ui/page-header";
import { t } from "@/shared/i18n/uk";

export const metadata: Metadata = { title: t.caseEditor.title };

export default async function CasePage({ params }: { params: Promise<{ ws: string; project: string }> }) {
  const { ws, project: slug } = await params;
  const workspace = await getWorkspaceBySlug(ws);
  const project = workspace && (await getProjectBySlug(workspace.id, slug));
  if (!workspace || !project) notFound();

  const [role, caseStudy] = await Promise.all([getMyRole(workspace.id), getCaseForProject(project.id)]);
  const canEdit = role === "owner" || role === "editor";
  const settingsHref = `/w/${ws}/p/${slug}/settings`;
  const content = caseStudy?.content as { uk?: { story?: unknown } } | null;

  return (
    <div className="max-w-4xl">
      <PageHeader title={t.caseEditor.title} lede={t.caseEditor.lede} />
      {caseStudy ? (
        <>
          <p className="mb-6 flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-control border border-line bg-surface px-4 py-3 text-sm">
            <span>{caseStudy.status === "published" ? t.caseEditor.published : t.caseEditor.notPublished}</span>
            <Link href={settingsHref} className="font-semibold underline underline-offset-2">{t.caseEditor.settingsLink}</Link>
            {caseStudy.status === "published" && caseStudy.hasContent && (
              <a href={`/uk/cases/${caseStudy.slug}`} target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-2">
                {t.caseEditor.open}
              </a>
            )}
          </p>
          <CaseEditor caseId={caseStudy.id} projectId={project.id} canEdit={canEdit} hasStory={Boolean(content?.uk?.story)}
            drafts={{ uk: draftFromSnapshot(caseStudy.content, "uk"), en: draftFromSnapshot(caseStudy.content, "en") }} />
        </>
      ) : (
        <Panel className="flex flex-col items-start gap-3">
          <p className="text-fg-secondary">{t.caseEditor.none}</p>
          {canEdit && (
            <form action={createCaseStudy}>
              <input type="hidden" name="projectId" value={project.id} />
              <Button type="submit" variant="secondary">{t.caseEditor.create}</Button>
            </form>
          )}
        </Panel>
      )}
    </div>
  );
}
