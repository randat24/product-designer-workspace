import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMyRole, getProjectBySlug, getWorkspaceBySlug } from "@/domains/projects";
import { getCaseForProject } from "@/domains/cases";
import { createCaseStudy } from "@/domains/cases/actions";
import { CaseEditor } from "@/domains/cases/case-editor";
import { PublishBar } from "@/domains/cases/publish-bar";
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
  const draft = caseStudy?.draft as { uk?: { story?: unknown; product?: unknown } } | null;

  return (
    <div className="max-w-4xl">
      <PageHeader title={t.caseEditor.title} lede={t.caseEditor.lede} />
      {caseStudy ? (
        <>
          <PublishBar caseId={caseStudy.id} slug={caseStudy.slug} published={caseStudy.status === "published" && caseStudy.hasContent}
            hasUnpublished={caseStudy.hasUnpublished} canEdit={canEdit} />
          <p className="mb-6 text-sm">
            <Link href={settingsHref} className="font-semibold underline underline-offset-2">{t.caseEditor.settingsLink}</Link>
          </p>
          <CaseEditor caseId={caseStudy.id} projectId={project.id} canEdit={canEdit} hasStory={Boolean(draft?.uk?.story || draft?.uk?.product)}
            drafts={{ uk: draftFromSnapshot(caseStudy.draft, "uk"), en: draftFromSnapshot(caseStudy.draft, "en") }} />
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
