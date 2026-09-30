import { ArrowRight, Circle, CircleCheck, CircleDot } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectContext } from "@/domains/projects/queries";
import { getProjectBySlug, getWorkspaceBySlug, listRecentActivity, PLATFORMS, PROJECT_STATUSES, type ActivityItem } from "@/domains/projects";
import { briefCompleteness, getBrief, type BriefKeyField } from "@/domains/briefs";
import { COMPETITORS_TARGET, getMatrix, isAssessed, listCompetitors } from "@/domains/competitors";
import { getResearchStats, listInterviews, RESEARCH_TARGET_DEFAULT } from "@/domains/research";
import { getSynthesisOverview, listOpportunities } from "@/domains/synthesis";
import { listFlows } from "@/domains/flows";
import { listDecisions, listScreens } from "@/domains/design";
import { createClient } from "@/shared/lib/supabase/server";
import { CURRENT_PHASE, findNavItem } from "@/shared/navigation";
import { cn } from "@/shared/lib/cn";
import { PageHeader } from "@/shared/ui/page-header";
import { t } from "@/shared/i18n/ru";

export async function generateMetadata({ params }: { params: Promise<{ ws: string; project: string }> }): Promise<Metadata> {
  const { ws, project } = await params;
  const ctx = await getProjectContext(ws, project);
  return { title: ctx ? `${ctx.project.name} · ${t.project.overview}` : t.project.overview };
}

type StageState = "done" | "active" | "todo" | "soon";
type Stage = { segment: string; label: string; phase: number; state: StageState; detail?: string; percent?: number };

// MVP chain in working order (docs/MVP.md §2). Each phase adds its own progress rule.
const STAGE_SEGMENTS = ["brief", "competitors", "research", "synthesis", "insights", "opportunities", "flows", "screens", "decisions"];

// Where each missing brief field lives on the brief page.
const BRIEF_ANCHOR: Record<BriefKeyField, string> = {
  product_description: "product_description",
  target_audience: "target_audience",
  problem: "problem",
  goals: "goals-list",
  kpis: "kpis-list",
  constraints: "constraints",
  timeline: "timeline_start",
};

// Date only: the server renders in UTC and does not know the viewer's time zone.
const dateFmt = new Intl.DateTimeFormat("ru", { day: "numeric", month: "short" });

export default async function ProjectOverview({ params }: { params: Promise<{ ws: string; project: string }> }) {
  const { ws, project: slug } = await params;
  const workspace = await getWorkspaceBySlug(ws);
  const project = workspace && (await getProjectBySlug(workspace.id, slug));
  if (!workspace || !project) notFound();

  const [brief, activity, competitors, matrix, research, interviews] = await Promise.all([
    getBrief(project.id), listRecentActivity(project.id), listCompetitors(project.id), getMatrix(project.id),
    getResearchStats(project.id), listInterviews(project.id),
  ]);
  const researchTarget = research.target ?? RESEARCH_TARGET_DEFAULT;
  const [synth, flows, opportunities, screens, decisions] = await Promise.all([
    getSynthesisOverview(project.id), listFlows(project.id), listOpportunities(project.id),
    listScreens(project.id), listDecisions(project.id),
  ]);
  const unlinkedScreens = await countScreenNodesWithoutScreen(flows.map((f) => f.id));
  const cards = synth.quotes + synth.observations;
  const emptyInterviews = await countDoneWithoutAnswers(interviews.filter((i) => i.status === "done").map((i) => i.id));
  const assessed = competitors.filter(isAssessed).length;
  const hasOwn = competitors.some((c) => c.is_own_product);
  const matrixFilled = matrix.features.length > 0 && Object.values(matrix.cells).some((v) => v !== "unknown");
  const briefProgress = briefCompleteness(brief);
  const base = `/w/${ws}/p/${slug}`;

  const stages = STAGE_SEGMENTS.flatMap((segment): Stage[] => {
    const item = findNavItem(segment);
    if (!item) return [];
    if (segment === "brief") {
      const state: StageState =
        briefProgress.filled === briefProgress.total ? "done" : briefProgress.filled > 0 ? "active" : "todo";
      return [{ segment, label: item.label, phase: item.phase, state, detail: t.project.briefProgress(briefProgress.filled, briefProgress.total),
        percent: (briefProgress.filled / briefProgress.total) * 100 }];
    }
    if (segment === "competitors") {
      const percent = Math.min(assessed / COMPETITORS_TARGET, 1) * 100;
      const state: StageState = assessed >= COMPETITORS_TARGET && matrixFilled ? "done" : competitors.length > 0 ? "active" : "todo";
      return [{ segment, label: item.label, phase: item.phase, state, percent, detail: t.competitors.progress(assessed, COMPETITORS_TARGET) }];
    }
    if (segment === "research") {
      const percent = Math.min(research.conducted / researchTarget, 1) * 100;
      const state: StageState = research.conducted >= researchTarget ? "done" : research.plans + research.guides + research.participants > 0 ? "active" : "todo";
      return [{ segment, label: item.label, phase: item.phase, state, percent, detail: t.research.progress(research.conducted, researchTarget) }];
    }
    if (segment === "synthesis") {
      const detail = `${synth.quotes} ${t.synthesis.stats.quotes} · ${synth.observations} ${t.synthesis.stats.observations} · ${synth.patterns} ${t.synthesis.stats.patterns}`;
      const state: StageState = synth.patterns > 0 && synth.interviewsWithoutSynthesis.length === 0 ? "done" : cards > 0 ? "active" : "todo";
      return [{ segment, label: item.label, phase: item.phase, state, detail }];
    }
    if (segment === "insights") {
      const supported = synth.insights - synth.unsupported.length;
      const state: StageState = synth.insights > 0 && synth.unsupported.length === 0 ? "done" : synth.insights > 0 ? "active" : "todo";
      return [{ segment, label: item.label, phase: item.phase, state, percent: synth.insights ? (supported / synth.insights) * 100 : 0,
        detail: `${supported} / ${synth.insights} с источниками` }];
    }
    if (segment === "opportunities") {
      const state: StageState = synth.opportunities > 0 ? "done" : synth.painPoints > 0 ? "active" : "todo";
      return [{ segment, label: item.label, phase: item.phase, state, detail: `${synth.painPoints} болей · ${synth.opportunities} возможностей` }];
    }
    if (segment === "flows") {
      const covered = flows.filter((f) => f.missing === 0).length;
      const state: StageState = flows.length > 0 && covered === flows.length ? "done" : flows.length > 0 ? "active" : "todo";
      return [{ segment, label: item.label, phase: item.phase, state, percent: flows.length ? (covered / flows.length) * 100 : 0,
        detail: t.flows.stageDetail(flows.length, covered) }];
    }
    if (segment === "screens") {
      const ready = screens.filter((x) => x.missingStates === 0).length;
      const state: StageState = screens.length > 0 && ready === screens.length ? "done" : screens.length > 0 ? "active" : "todo";
      return [{ segment, label: item.label, phase: item.phase, state, percent: screens.length ? (ready / screens.length) * 100 : 0,
        detail: t.project.screensDetail(screens.length, ready) }];
    }
    if (segment === "decisions") {
      const backed = decisions.filter((x) => x.evidence > 0).length;
      const state: StageState = decisions.length > 0 && backed === decisions.length ? "done" : decisions.length > 0 ? "active" : "todo";
      return [{ segment, label: item.label, phase: item.phase, state, percent: decisions.length ? (backed / decisions.length) * 100 : 0,
        detail: t.project.decisionsDetail(decisions.length, backed) }];
    }
    return [{ segment, label: item.label, phase: item.phase, state: item.phase > CURRENT_PHASE ? "soon" : "todo" }];
  });

  const nextActions: { key: string; label: string; href: string }[] = briefProgress.missing.map((key) => ({
    key,
    label: t.nextAction[key],
    href: `${base}/brief#${BRIEF_ANCHOR[key]}`,
  }));
  if (assessed < COMPETITORS_TARGET) {
    nextActions.push({ key: "competitors", label: t.nextAction.competitors(assessed, COMPETITORS_TARGET), href: `${base}/competitors` });
  }
  if (competitors.length > 0 && !hasOwn) {
    nextActions.push({ key: "own", label: t.nextAction.ownProduct, href: `${base}/competitors/matrix` });
  }
  if (competitors.length > 0 && !matrixFilled) {
    nextActions.push({ key: "matrix", label: t.nextAction.matrix, href: `${base}/competitors/matrix` });
  }
  if (research.plans === 0) nextActions.push({ key: "plan", label: t.nextAction.plan, href: `${base}/research` });
  if (research.questions === 0) nextActions.push({ key: "guide", label: t.nextAction.guide, href: `${base}/research` });
  if (research.participants === 0) nextActions.push({ key: "participants", label: t.nextAction.participants, href: `${base}/research/participants` });
  else if (research.conducted < researchTarget) {
    nextActions.push({ key: "interviews", label: t.nextAction.interviews(research.conducted, researchTarget), href: `${base}/research/participants` });
  }
  if (emptyInterviews > 0) nextActions.push({ key: "empty", label: t.nextAction.emptyInterviews(emptyInterviews), href: `${base}/research` });
  if (synth.interviewsWithoutSynthesis.length > 0) {
    const [first] = synth.interviewsWithoutSynthesis;
    nextActions.push({ key: "nosynth", label: t.nextAction.noSynthesis(synth.interviewsWithoutSynthesis.slice(0, 3).join(", ")), href: `${base}/research/interviews/${first}` });
  }
  if (cards > 0 && synth.patterns === 0) nextActions.push({ key: "board", label: t.nextAction.board, href: `${base}/synthesis` });
  if (synth.patterns > 0 && synth.insights === 0) nextActions.push({ key: "insight", label: t.nextAction.insight, href: `${base}/synthesis` });
  for (const code of synth.unsupported.slice(0, 3)) {
    nextActions.push({ key: `uns-${code}`, label: t.nextAction.unsupported(code), href: `${base}/insights/${code}` });
  }
  if (synth.insights > 0 && synth.painPoints === 0) nextActions.push({ key: "pp", label: t.nextAction.painPoint, href: `${base}/insights` });
  if (synth.painPoints > 0 && synth.opportunities === 0) nextActions.push({ key: "opp", label: t.nextAction.opportunity, href: `${base}/pain-points` });

  if (synth.opportunities > 0 && flows.length === 0) {
    const [first] = opportunities;
    nextActions.push({ key: "flow", label: t.nextAction.flow, href: first ? `${base}/opportunities/${first.code}` : `${base}/flows` });
  }
  for (const fl of flows.filter((f) => f.missing > 0).slice(0, 3)) {
    nextActions.push({ key: `fl-${fl.code}`, label: t.nextAction.flowEdgeCases(fl.code, fl.missing), href: `${base}/flows/${fl.code}#edge-cases-h` });
  }
  for (const fl of flows.filter((f) => (unlinkedScreens.get(f.id) ?? 0) > 0).slice(0, 3)) {
    nextActions.push({ key: `fls-${fl.code}`, label: t.nextAction.flowScreens(fl.code, unlinkedScreens.get(fl.id) ?? 0), href: `${base}/flows/${fl.code}` });
  }

  for (const sc of screens.filter((x) => x.missingStates > 0).slice(0, 3)) {
    nextActions.push({ key: `scs-${sc.code}`, label: t.nextAction.screenStates(sc.code, sc.missingStates), href: `${base}/screens/${sc.code}#states-h` });
  }
  for (const sc of screens.filter((x) => x.upstream === 0).slice(0, 2)) {
    nextActions.push({ key: `scu-${sc.code}`, label: t.nextAction.screenUpstream(sc.code), href: `${base}/screens/${sc.code}` });
  }
  if (screens.length > 0 && decisions.length === 0) {
    nextActions.push({ key: "dec", label: t.nextAction.firstDecision, href: `${base}/screens/${screens[0]!.code}#decisions-h` });
  }
  for (const d of decisions.filter((x) => x.evidence === 0 && x.status !== "superseded" && x.status !== "rejected").slice(0, 3)) {
    nextActions.push({ key: `dece-${d.code}`, label: t.nextAction.decisionEvidence(d.code), href: `${base}/decisions/${d.code}#evidence-h` });
  }

  // Average over stages that have shipped; later phases join as they land.
  const shipped = stages.filter((s) => s.state !== "soon");
  const overall = shipped.length
    ? shipped.reduce((sum, s) => sum + (s.state === "done" ? 100 : s.percent ?? 0), 0) / shipped.length
    : 0;

  const status = PROJECT_STATUSES.find((s) => s.value === project.status)?.label;
  const meta = [status, project.platforms.map((p) => PLATFORMS.find((x) => x.value === p)?.label ?? p).join(", ")].filter(Boolean);

  return (
    <div className="flex max-w-4xl flex-col gap-10">
      <PageHeader eyebrow={[t.project.overview, ...meta].join(" · ")} title={project.name}
        lede={project.description}
        progress={{ value: overall, caption: t.project.overallProgress }} />

      <section aria-labelledby="stages-h" className="flex flex-col gap-3">
        <h2 id="stages-h" className="text-heading font-semibold">{t.project.stages}</h2>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {stages.map((s, i) => (
            <li key={s.segment}>
              <Link href={`${base}/${s.segment}`}
                className={cn(
                  "flex h-full flex-col gap-2 rounded-panel border border-line bg-surface p-4 transition-colors duration-[120ms] hover:border-fg",
                  s.state === "done" && "border-success",
                  s.state === "soon" && "bg-transparent text-fg-secondary",
                )}>
                <span className="flex items-baseline gap-3">
                  <span className="display-num text-display-xs leading-none tabular-nums">{i + 1}</span>
                  <span className="font-bold">{s.label}</span>
                  <StageIcon state={s.state} />
                </span>
                <span className="text-meta text-fg-secondary tabular-nums">
                  {s.detail ?? (s.state === "soon" ? t.project.stageSoon(s.phase) : t.project.stageTodo)}
                </span>
                {s.percent !== undefined && (
                  <span className="mt-auto block h-[3px] overflow-hidden rounded-chip bg-line" aria-hidden>
                    <i className={cn("block h-full", s.state === "done" ? "bg-success" : "bg-fg")} style={{ width: `${s.percent}%` }} />
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="next-h" className="flex flex-col gap-3">
        <h2 id="next-h" className="text-heading font-semibold">{t.project.nextActions}</h2>
        {nextActions.length === 0 ? (
          <p className="text-fg-secondary">{t.project.nextActionsEmpty}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {nextActions.map((a) => (
              <li key={a.key}>
                <Link href={a.href} className="flex items-center justify-between gap-3 rounded-panel border border-line bg-surface px-4 py-2.5 font-medium hover:border-fg">
                  <span>{a.label}</span>
                  <ArrowRight aria-hidden className="size-4 shrink-0 text-fg-secondary" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="activity-h" className="flex flex-col gap-3">
        <h2 id="activity-h" className="text-heading font-semibold">{t.project.activity}</h2>
        {activity.length === 0 ? (
          <p className="text-fg-secondary">{t.project.activityEmpty}</p>
        ) : (
          <ul className="flex flex-col gap-2 rounded-panel border border-line bg-surface p-4">
            {activity.map((a) => <ActivityRow key={a.id} item={a} />)}
          </ul>
        )}
      </section>
    </div>
  );
}

function StageIcon({ state }: { state: StageState }) {
  const label = { done: t.project.stageDone, active: t.project.stageActive, todo: t.project.stageTodo, soon: t.project.stageTodo }[state];
  return (
    <span role="img" aria-label={label}
      className={cn("ml-auto", state === "done" ? "text-success" : state === "active" ? "text-accent" : "text-fg-secondary")}>
      {state === "done" ? <CircleCheck className="size-4" /> : state === "active" ? <CircleDot className="size-4" /> : <Circle className="size-4" />}
    </span>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const entity = t.activity.entity[item.entityType] ?? item.entityType;
  const action = t.activity.action[item.action] ?? item.action;
  const fields = item.action === "update" ? item.changedKeys.map((k) => t.activity.field[k] ?? k).join(", ") : "";
  return (
    <li className="grid grid-cols-[1fr_auto] gap-x-4 text-meta">
      <span className="min-w-0 truncate">
        <span className="font-medium">{action}</span> · {entity}
        {fields && <span className="text-fg-secondary">: {fields}</span>}
      </span>
      <span className="text-fg-secondary tabular-nums">
        {[item.actorName, dateFmt.format(new Date(item.createdAt))].filter(Boolean).join(" · ")}
      </span>
    </li>
  );
}

/** Interviews marked done that have no answer text at all (a gap in the research record). */
async function countDoneWithoutAnswers(ids: string[]) {
  if (!ids.length) return 0;
  const supabase = await createClient();
  const { data } = await supabase.from("interview_answers").select("interview_id").in("interview_id", ids).neq("body_text", "");
  const withAnswers = new Set((data ?? []).map((a) => a.interview_id));
  return ids.filter((id) => !withAnswers.has(id)).length;
}

async function countScreenNodesWithoutScreen(flowIds: string[]) {
  const out = new Map<string, number>();
  if (!flowIds.length) return out;
  const supabase = await createClient();
  const { data } = await supabase.from("flow_nodes").select("flow_id").in("flow_id", flowIds).eq("kind", "screen").is("screen_id", null);
  for (const n of data ?? []) out.set(n.flow_id, (out.get(n.flow_id) ?? 0) + 1);
  return out;
}
