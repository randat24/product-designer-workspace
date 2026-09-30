import { notFound } from "next/navigation";
import { getMyRole, getProjectBySlug, getWorkspaceBySlug, listProjects } from "@/domains/projects";
import { setProjectArchived } from "@/domains/projects/actions";
import { briefCompleteness, getBrief } from "@/domains/briefs";
import { COMPETITORS_TARGET, isAssessed, listCompetitors } from "@/domains/competitors";
import { getResearchStats, listParticipants, participantTitle, RESEARCH_TARGET_DEFAULT } from "@/domains/research";
import { getBoard, getSynthesisStats, listInsights, listOpportunities, listPainPoints } from "@/domains/synthesis";
import { listFlows } from "@/domains/flows";
import { listDecisions, listScreens } from "@/domains/design";
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

  const [brief, competitors, research, participants, board, insights, painPoints, opportunities, synthStats, flows, screens, decisions] = await Promise.all([
    getBrief(project.id), listCompetitors(project.id), getResearchStats(project.id), listParticipants(project.id),
    getBoard(project.id), listInsights(project.id), listPainPoints(project.id), listOpportunities(project.id),
    getSynthesisStats(project.id), listFlows(project.id), listScreens(project.id), listDecisions(project.id),
  ]);
  const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
  const researchPercent = Math.round(Math.min(research.conducted / (research.target ?? RESEARCH_TARGET_DEFAULT), 1) * 100);
  const briefProgress = briefCompleteness(brief);
  const progress: Record<string, number> = {
    brief: Math.round((briefProgress.filled / briefProgress.total) * 100),
    competitors: Math.round(Math.min(competitors.filter(isAssessed).length / COMPETITORS_TARGET, 1) * 100),
    research: researchPercent,
    synthesis: pct(board.cards.filter((c) => c.patternId).length, board.cards.length),
    insights: pct(insights.filter((i) => (synthStats.get(i.id)?.sources ?? 0) > 0).length, insights.length),
    "pain-points": pct(painPoints.filter((p) => (synthStats.get(p.id)?.sources ?? 0) > 0).length, painPoints.length),
    opportunities: opportunities.length ? 100 : 0,
    flows: pct(flows.filter((f) => f.missing === 0).length, flows.length),
    screens: pct(screens.filter((s) => s.missingStates === 0).length, screens.length),
    decisions: pct(decisions.filter((d) => d.evidence > 0).length, decisions.length),
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
    { id: "ux-laws", label: t.uxLaws.title, href: "/app/ux-laws", group: t.palette.sections, hint: t.uxLaws.nav },
    ...projects
      .filter((p) => !p.archived_at && p.id !== project.id)
      .map((p) => ({ id: `project:${p.id}`, label: p.name, href: `/w/${workspace.slug}/p/${p.slug}`, group: t.palette.projects })),
    ...competitors.map((c) => ({
      id: `competitor:${c.id}`,
      label: `${c.code} ${c.name}`,
      href: `${base}/competitors/${c.code}`,
      group: t.palette.entities,
    })),
    ...participants.map((p) => ({
      id: `participant:${p.id}`,
      label: `${p.code} ${participantTitle(p)}`,
      href: `${base}/research/participants/${p.code}`,
      group: t.palette.entities,
    })),
    ...participants.flatMap((p) => (p.interview ? [{
      id: `interview:${p.interview.id}`,
      label: `${p.interview.code} ${p.code} ${participantTitle(p)}`,
      href: `${base}/research/interviews/${p.interview.code}`,
      group: t.palette.entities,
    }] : [])),
    ...[
      ...insights.map((i) => ({ type: "insights", ...i })),
      ...painPoints.map((p) => ({ type: "pain-points", ...p })),
      ...opportunities.map((o) => ({ type: "opportunities", ...o })),
    ].map((e) => ({ id: `${e.type}:${e.id}`, label: `${e.code} ${e.title}`, href: `${base}/${e.type}/${e.code}`, group: t.palette.entities })),
    ...flows.map((f) => ({ id: `flow:${f.id}`, label: `${f.code} ${f.name}`, href: `${base}/flows/${f.code}`, group: t.palette.entities })),
    ...screens.map((s) => ({ id: `screen:${s.id}`, label: `${s.code} ${s.name}`, href: `${base}/screens/${s.code}`, group: t.palette.entities })),
    ...decisions.map((d) => ({ id: `decision:${d.id}`, label: `${d.code} ${d.title}`, href: `${base}/decisions/${d.code}`, group: t.palette.entities })),
    ...board.cards.map((c) => ({
      id: `${c.kind}:${c.id}`,
      label: `${c.code} ${c.text.slice(0, 80)}`,
      href: `${base}/synthesis/${c.kind === "quote" ? "quotes" : "observations"}/${c.code}`,
      group: t.palette.entities,
    })),
    { id: "action:research-matrix", label: t.research.matrix.title, href: `${base}/research/matrix`, group: t.palette.actions, keywords: "матрица ответов research" },
    { id: "action:matrix", label: t.palette.matrix, href: `${base}/competitors/matrix`, group: t.palette.actions, keywords: "matrix сравнение" },
    { id: "action:ux-review", label: t.competitors.ux.title, href: `${base}/competitors/ux`, group: t.palette.actions, keywords: "ux review юзабилити нильсен эвристики законы" },
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
