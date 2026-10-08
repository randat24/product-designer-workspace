import { notFound } from "next/navigation";
import { getMyRole, getProjectBySlug, getStageCounts, getWorkspaceBySlug } from "@/domains/projects";
import { setProjectArchived } from "@/domains/projects/actions";
import { briefCompleteness, getBrief } from "@/domains/briefs";
import { countsFromRow, stageProgress } from "@/domains/projects/progress";
import { CURRENT_PHASE, visibleNav } from "@/shared/navigation";
import type { CommandItem } from "@/shared/ui/command-palette";
import { t } from "@/shared/i18n/uk";
import { loadPaletteEntities } from "./palette-actions";
import { Sidebar } from "./sidebar";

/**
 * Project shell: navigation rail · main. Renders with four small queries — project, role, brief and the
 * stage counts in one database call; ⌘K loads entities when it opens (docs/QUALITY_REVIEW.md, A4).
 */
export default async function ProjectLayout({ children, params }: {
  children: React.ReactNode;
  params: Promise<{ ws: string; project: string }>;
}) {
  const { ws, project: slug } = await params;
  const workspace = await getWorkspaceBySlug(ws);
  if (!workspace) notFound();
  const [project, role] = await Promise.all([getProjectBySlug(workspace.id, slug), getMyRole(workspace.id)]);
  if (!project) notFound();

  const [brief, counts] = await Promise.all([getBrief(project.id), getStageCounts(project.id)]);
  const briefProgress = briefCompleteness(brief);
  const progress = stageProgress(countsFromRow(counts, { done: briefProgress.filled, total: briefProgress.total }));

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
    { id: "ux-laws", label: t.uxLaws.title, href: "/app/ux-laws", group: t.palette.sections, hint: t.uxLaws.nav },
    { id: "action:research-matrix", label: t.research.matrix.title, href: `${base}/research/matrix`, group: t.palette.actions, keywords: "матриця відповідей research матрица" },
    { id: "action:matrix", label: t.palette.matrix, href: `${base}/competitors/matrix`, group: t.palette.actions, keywords: "matrix порівняння" },
    { id: "action:ux-review", label: t.competitors.ux.title, href: `${base}/competitors/ux`, group: t.palette.actions, keywords: "ux review юзабіліті нільсен евристики закони" },
    { id: "action:settings", label: t.palette.settings, href: `${base}/settings`, group: t.palette.actions, keywords: "settings archive архів видалити" },
    { id: "action:new", label: t.palette.newProject, href: `/w/${workspace.slug}#new-h`, group: t.palette.actions, keywords: "new project створити" },
    { id: "action:all", label: t.palette.allProjects, href: `/w/${workspace.slug}`, group: t.palette.actions, keywords: "projects" },
  ];

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[264px_minmax(0,1fr)]">
      <Sidebar wsSlug={workspace.slug} wsName={workspace.name} projectSlug={project.slug} projectName={project.name} commands={commands} loadEntities={loadPaletteEntities.bind(null, workspace.slug, project.slug)} progress={progress} />
      <main className="min-w-0 px-[clamp(18px,4vw,56px)] pt-8 pb-20 lg:pt-10">
        {/* Wide screens: the work area is centred and capped, so forms and lists do not hug the rail. */}
        <div className="mx-auto w-full max-w-[1240px]">
        {project.archived_at && (
          <form action={setProjectArchived} role="status"
            className="mb-6 flex max-w-3xl flex-wrap items-center justify-between gap-3 rounded-panel border border-dashed border-line px-4 py-2.5 text-meta">
            <span>{t.project.archivedBanner}</span>
            <input type="hidden" name="projectId" value={project.id} />
            <input type="hidden" name="archived" value="0" />
            {(role === "owner" || role === "editor") && (
              <button className="font-semibold underline underline-offset-2">{t.project.restore}</button>
            )}
          </form>
        )}
        {children}
        </div>
      </main>
    </div>
  );
}
