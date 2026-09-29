import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectBySlug, getWorkspaceBySlug, listRecentActivity, PLATFORMS, PROJECT_STATUSES, type ActivityItem } from "@/domains/projects";
import { briefCompleteness, getBrief, type BriefKeyField } from "@/domains/briefs";
import { CURRENT_PHASE, findNavItem } from "@/shared/navigation";
import { cn } from "@/shared/lib/cn";
import { PageHeader } from "@/shared/ui/page-header";
import { t } from "@/shared/i18n/ru";

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

  const [brief, activity] = await Promise.all([getBrief(project.id), listRecentActivity(project.id)]);
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
    return [{ segment, label: item.label, phase: item.phase, state: item.phase > CURRENT_PHASE ? "soon" : "todo" }];
  });

  const nextActions = briefProgress.missing.map((key) => ({
    key,
    label: t.nextAction[key],
    href: `${base}/brief#${BRIEF_ANCHOR[key]}`,
  }));

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
                  "flex h-full flex-col gap-2 rounded-[14px] border border-line bg-surface p-4 transition-colors duration-[120ms] hover:border-fg",
                  s.state === "done" && "border-success",
                  s.state === "soon" && "bg-transparent text-fg-secondary",
                )}>
                <span className="flex items-baseline gap-3">
                  <span className="display-num text-[22px] leading-none tabular-nums">{i + 1}</span>
                  <span className="font-bold">{s.label}</span>
                  <StageIcon state={s.state} />
                </span>
                <span className="text-[13px] text-fg-secondary tabular-nums">
                  {s.detail ?? (s.state === "soon" ? t.project.stageSoon(s.phase) : t.project.stageTodo)}
                </span>
                {s.percent !== undefined && (
                  <span className="mt-auto block h-[3px] overflow-hidden rounded-sm bg-line" aria-hidden>
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
                <Link href={a.href} className="flex items-center justify-between gap-3 rounded-[12px] border border-line bg-surface px-4 py-2.5 font-medium hover:border-fg">
                  <span>{a.label}</span>
                  <span aria-hidden className="text-fg-secondary">→</span>
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
          <ul className="flex flex-col gap-2 rounded-[14px] border border-line bg-surface p-4">
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
      {state === "done" ? "✓" : state === "active" ? "●" : "○"}
    </span>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const entity = t.activity.entity[item.entityType] ?? item.entityType;
  const action = t.activity.action[item.action] ?? item.action;
  const fields = item.action === "update" ? item.changedKeys.map((k) => t.activity.field[k] ?? k).join(", ") : "";
  return (
    <li className="grid grid-cols-[1fr_auto] gap-x-4 text-[13px]">
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
