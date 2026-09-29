import { notFound } from "next/navigation";
import { getMyRole, getProjectBySlug, getWorkspaceBySlug, listProjects } from "@/domains/projects";
import { setProjectArchived } from "@/domains/projects/actions";
import { briefCompleteness, getBrief } from "@/domains/briefs";
import { COMPETITORS_TARGET, isAssessed, listCompetitors } from "@/domains/competitors";
import { CURRENT_PHASE, visibleNav } from "@/shared/navigation";
import type { CommandItem } from "@/shared/ui/command-palette";
import { t } from "@/shared/i18n/ru";
import { Sidebar } from "./sidebar";

/** Project shell: navigation rail · main. The trace panel joins entity pages in Phase 5 (docs/IA.md §1). */
export default async function ProjectLayout({ children, params }: {
  children: React.ReactNode;
  params: Promise<{ ws: string; project: string }>;
}) {
  const { ws, project: slug } = await params;
  const workspace = await getWorkspaceBySlug(ws);
  if (!workspace) notFound();
  const [project, projects, role] = await Promise.all([
    getProjectBySlug(workspace.id, slug),
    listProjects(workspace.id),
    getMyRole(workspace.id),
  ]);
  if (!project) notFound();

  const [brief, competitors] = await Promise.all([getBrief(project.id), listCompetitors(project.id)]);
  const briefProgress = briefCompleteness(brief);
  const progress: Record<string, number> = {
    brief: Math.round((briefProgress.filled / briefProgress.total) * 100),
    competitors: Math.round(Math.min(competitors.filter(isAssessed).length / COMPETITORS_TARGET, 1) * 100),
  };

  const base = `/w/${workspace.slug}/p/${project.slug}`;
  const commands: CommandItem[] = [
    ...visibleNav().flatMap((g) =>
      g.items.map((i) => ({
        id: `nav:${i.segment || "overview"}`,
        label: i.label,
        href: i.segment ? `${base}/${i.segment}` : base,
        group: t.palette.sections,
        hint: i.phase > CURRENT_PHASE ? t.palette.soon(i.phase) : g.title,
      })),
    ),
    ...projects
      .filter((p) => !p.archived_at && p.id !== project.id)
      .map((p) => ({ id: `project:${p.id}`, label: p.name, href: `/w/${workspace.slug}/p/${p.slug}`, group: t.palette.projects })),
    ...competitors.map((c) => ({
      id: `competitor:${c.id}`,
      label: `${c.code} ${c.name}`,
      href: `${base}/competitors/${c.code}`,
      group: t.palette.entities,
    })),
    { id: "action:matrix", label: t.palette.matrix, href: `${base}/competitors/matrix`, group: t.palette.actions, keywords: "matrix сравнение" },
    { id: "action:settings", label: t.palette.settings, href: `${base}/settings`, group: t.palette.actions, keywords: "settings archive архив удалить" },
    { id: "action:new", label: t.palette.newProject, href: `/w/${workspace.slug}#new-h`, group: t.palette.actions, keywords: "new project создать" },
    { id: "action:all", label: t.palette.allProjects, href: `/w/${workspace.slug}`, group: t.palette.actions, keywords: "projects" },
  ];

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[264px_minmax(0,1fr)]">
      <Sidebar wsSlug={workspace.slug} wsName={workspace.name} projectSlug={project.slug} projectName={project.name} commands={commands} progress={progress} />
      <main className="min-w-0 px-[clamp(18px,4vw,56px)] pt-8 pb-20 md:pt-10">
        {project.archived_at && (
          <form action={setProjectArchived} role="status"
            className="mb-6 flex max-w-3xl flex-wrap items-center justify-between gap-3 rounded-[12px] border-[1.5px] border-dashed border-line px-4 py-2.5 text-[13px]">
            <span>{t.project.archivedBanner}</span>
            <input type="hidden" name="projectId" value={project.id} />
            <input type="hidden" name="archived" value="0" />
            {(role === "owner" || role === "editor") && (
              <button className="font-semibold underline underline-offset-2">{t.project.restore}</button>
            )}
          </form>
        )}
        {children}
      </main>
    </div>
  );
}
