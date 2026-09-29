import { notFound } from "next/navigation";
import { getMyRole, getProjectBySlug, getWorkspaceBySlug, listProjects } from "@/domains/projects";
import { setProjectArchived } from "@/domains/projects/actions";
import { TracePanel } from "@/domains/trace";
import { CURRENT_PHASE, visibleNav } from "@/shared/navigation";
import type { CommandItem } from "@/shared/ui/command-palette";
import { t } from "@/shared/i18n/ru";
import { Sidebar } from "./sidebar";

/** Three-column project shell: sidebar · main · trace panel (docs/IA.md §1). */
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
    { id: "action:settings", label: t.palette.settings, href: `${base}/settings`, group: t.palette.actions, keywords: "settings archive архив удалить" },
    { id: "action:new", label: t.palette.newProject, href: `/w/${workspace.slug}#new-h`, group: t.palette.actions, keywords: "new project создать" },
    { id: "action:all", label: t.palette.allProjects, href: `/w/${workspace.slug}`, group: t.palette.actions, keywords: "projects" },
  ];

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[232px_minmax(0,1fr)] xl:grid-cols-[232px_minmax(0,1fr)_300px]">
      <Sidebar wsSlug={workspace.slug} wsName={workspace.name} projectSlug={project.slug} projectName={project.name} commands={commands} />
      <main className="min-w-0 px-6 py-6 lg:px-10">
        {project.archived_at && (
          <form action={setProjectArchived} role="status"
            className="mb-6 flex max-w-3xl flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-subtle px-4 py-2 text-[13px]">
            <span>{t.project.archivedBanner}</span>
            <input type="hidden" name="projectId" value={project.id} />
            <input type="hidden" name="archived" value="0" />
            {(role === "owner" || role === "editor") && (
              <button className="font-medium text-accent hover:underline">{t.project.restore}</button>
            )}
          </form>
        )}
        {children}
      </main>
      <div className="hidden border-l border-line bg-surface xl:block">
        {/* Entity pages pass their entity here from Phase 5 on. */}
        <TracePanel />
      </div>
    </div>
  );
}
