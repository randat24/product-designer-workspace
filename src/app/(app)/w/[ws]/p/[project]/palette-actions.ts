"use server";

import { getProjectContext, listProjects } from "@/domains/projects";
import { listCompetitors } from "@/domains/competitors";
import { listParticipants, participantTitle } from "@/domains/research";
import { getBoard, listInsights, listOpportunities, listPainPoints } from "@/domains/synthesis";
import { listFlows } from "@/domains/flows";
import { listDecisions, listScreens } from "@/domains/design";
import type { CommandItem } from "@/shared/ui/command-palette";
import { t } from "@/shared/i18n/ru";

/**
 * Entities and other projects for ⌘K, loaded when the palette first opens instead of on every
 * render of the project shell (docs/QUALITY_REVIEW.md, A4). RLS decides what the caller sees.
 */
export async function loadPaletteEntities(wsSlug: string, projectSlug: string): Promise<CommandItem[]> {
  const ctx = await getProjectContext(wsSlug, projectSlug);
  if (!ctx) return [];
  const { workspace, project, base } = ctx;
  const [projects, competitors, participants, board, insights, painPoints, opportunities, flows, screens, decisions] = await Promise.all([
    listProjects(workspace.id), listCompetitors(project.id), listParticipants(project.id), getBoard(project.id),
    listInsights(project.id), listPainPoints(project.id), listOpportunities(project.id),
    listFlows(project.id), listScreens(project.id), listDecisions(project.id),
  ]);
  const entity = t.palette.entities;
  return [
    ...projects
      .filter((p) => !p.archived_at && p.id !== project.id)
      .map((p) => ({ id: `project:${p.id}`, label: p.name, href: `/w/${workspace.slug}/p/${p.slug}`, group: t.palette.projects })),
    ...competitors.map((c) => ({ id: `competitor:${c.id}`, label: `${c.code} ${c.name}`, href: `${base}/competitors/${c.code}`, group: entity })),
    ...participants.map((p) => ({
      id: `participant:${p.id}`, label: `${p.code} ${participantTitle(p)}`, href: `${base}/research/participants/${p.code}`, group: entity,
    })),
    ...participants.flatMap((p) => (p.interview ? [{
      id: `interview:${p.interview.id}`,
      label: `${p.interview.code} ${p.code} ${participantTitle(p)}`,
      href: `${base}/research/interviews/${p.interview.code}`,
      group: entity,
    }] : [])),
    ...[
      ...insights.map((i) => ({ type: "insights", ...i })),
      ...painPoints.map((p) => ({ type: "pain-points", ...p })),
      ...opportunities.map((o) => ({ type: "opportunities", ...o })),
    ].map((e) => ({ id: `${e.type}:${e.id}`, label: `${e.code} ${e.title}`, href: `${base}/${e.type}/${e.code}`, group: entity })),
    ...flows.map((f) => ({ id: `flow:${f.id}`, label: `${f.code} ${f.name}`, href: `${base}/flows/${f.code}`, group: entity })),
    ...screens.map((s) => ({ id: `screen:${s.id}`, label: `${s.code} ${s.name}`, href: `${base}/screens/${s.code}`, group: entity })),
    ...decisions.map((d) => ({ id: `decision:${d.id}`, label: `${d.code} ${d.title}`, href: `${base}/decisions/${d.code}`, group: entity })),
    ...board.cards.map((c) => ({
      id: `${c.kind}:${c.id}`,
      label: `${c.code} ${c.text.slice(0, 80)}`,
      href: `${base}/synthesis/${c.kind === "quote" ? "quotes" : "observations"}/${c.code}`,
      group: entity,
    })),
  ];
}
