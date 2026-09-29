import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMyRole, getProjectBySlug, getWorkspaceBySlug, PLATFORMS } from "@/domains/projects";
import { BriefEditor, getBrief } from "@/domains/briefs";
import { t } from "@/shared/i18n/ru";

export const metadata: Metadata = { title: t.brief.title };

export default async function BriefPage({ params }: { params: Promise<{ ws: string; project: string }> }) {
  const { ws, project: slug } = await params;
  const workspace = await getWorkspaceBySlug(ws);
  const project = workspace && (await getProjectBySlug(workspace.id, slug));
  if (!workspace || !project) notFound();

  const [brief, role] = await Promise.all([getBrief(project.id), getMyRole(workspace.id)]);
  const { updatedAt: _updatedAt, ...initial } = brief;

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-title font-semibold">{t.brief.title}</h1>
        <p className="max-w-prose text-fg-secondary">{t.brief.lede}</p>
      </header>
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
