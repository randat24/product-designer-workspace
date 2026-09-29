import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMyRole, getProjectBySlug, getWorkspaceBySlug, PLATFORMS } from "@/domains/projects";
import { BriefEditor, briefCompleteness, getBrief } from "@/domains/briefs";
import { PageHeader } from "@/shared/ui/page-header";
import { t } from "@/shared/i18n/ru";

export const metadata: Metadata = { title: t.brief.title };

export default async function BriefPage({ params }: { params: Promise<{ ws: string; project: string }> }) {
  const { ws, project: slug } = await params;
  const workspace = await getWorkspaceBySlug(ws);
  const project = workspace && (await getProjectBySlug(workspace.id, slug));
  if (!workspace || !project) notFound();

  const [brief, role] = await Promise.all([getBrief(project.id), getMyRole(workspace.id)]);
  const { updatedAt: _updatedAt, ...initial } = brief;
  const progress = briefCompleteness(initial);

  return (
    <div className="max-w-4xl">
      <PageHeader title={t.brief.title} lede={t.brief.lede}
        progress={{ value: (progress.filled / progress.total) * 100, caption: t.project.briefProgress(progress.filled, progress.total) }} />
      <BriefEditor
        projectId={project.id}
        initial={initial}
        canEdit={role === "owner" || role === "editor"}
        platforms={project.platforms.map((p) => PLATFORMS.find((x) => x.value === p)?.label ?? p)}
        settingsHref={`/w/${ws}/p/${slug}/settings`}
      />
    </div>
  );
}
