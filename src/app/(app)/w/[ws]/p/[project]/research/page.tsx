import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectContext } from "@/domains/projects";
import {
  getResearchStats, interviewStatusLabel, isConducted, listGuides, listInterviews, listPlans, participantTitle,
  RESEARCH_METHODS, RESEARCH_STATUSES, RESEARCH_TARGET_DEFAULT,
} from "@/domains/research";
import { createGuide, createPlan } from "@/domains/research/actions";
import { ImportNotebook } from "@/domains/importer/import-notebook";
import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";
import { cn } from "@/shared/lib/cn";
import { t } from "@/shared/i18n/ru";
import { ResearchTabs } from "./tabs";

export const metadata: Metadata = { title: t.research.title };

const dateFmt = new Intl.DateTimeFormat("ru", { day: "numeric", month: "short" });
const card = "flex h-full flex-col gap-2 rounded-[14px] border border-line bg-surface p-5 transition-colors duration-[120ms] hover:border-fg";
const empty = "rounded-[14px] border-[1.5px] border-dashed border-line p-6 text-center text-fg-secondary";

export default async function ResearchPage({ params }: { params: Promise<{ ws: string; project: string }> }) {
  const { ws, project: slug } = await params;
  const ctx = await getProjectContext(ws, slug);
  if (!ctx) notFound();
  const { project, base, canEdit } = ctx;
  const [stats, plans, guides, interviews] = await Promise.all([
    getResearchStats(project.id), listPlans(project.id), listGuides(project.id), listInterviews(project.id),
  ]);
  const target = stats.target ?? RESEARCH_TARGET_DEFAULT;

  return (
    <div className="flex max-w-6xl flex-col gap-10">
      <div>
        <PageHeader title={t.research.title} lede={t.research.lede}
          progress={{ value: Math.min(stats.conducted / target, 1) * 100, caption: t.research.progress(stats.conducted, target) }} />
        <ResearchTabs base={base} current="overview" />
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {([["participants", stats.participants], ["interviews", stats.interviews], ["conducted", stats.conducted], ["questions", stats.questions]] as const).map(([k, v]) => (
            <div key={k} className="flex flex-col-reverse rounded-[14px] border border-line bg-surface p-4">
              <dt className="text-[13px] font-semibold text-fg-secondary">{t.research.stats[k]}</dt>
              <dd className="display-num text-[34px] leading-none tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <section aria-labelledby="plans-h" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="plans-h" className="text-heading font-semibold">{t.research.plans}</h2>
          {canEdit && (
            <form action={createPlan}>
              <input type="hidden" name="projectId" value={project.id} />
              <Button type="submit" variant={plans.length ? "secondary" : "primary"}>{t.research.newPlan}</Button>
            </form>
          )}
        </div>
        {plans.length === 0 ? <p className={empty}>{t.research.plansEmpty}</p> : (
          <ul className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
            {plans.map((p) => (
              <li key={p.id}>
                <Link href={`${base}/research/plans/${p.code}`} className={card}>
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-bold">{p.title}</span>
                    <span className="text-caption font-semibold text-fg-secondary">{p.code}</span>
                  </span>
                  <span className="flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-fg px-2.5 py-0.5 text-caption font-semibold text-canvas">
                      {RESEARCH_STATUSES.find((s) => s.value === p.status)?.label}
                    </span>
                    <span className="rounded-full border border-line px-2.5 py-0.5 text-caption font-semibold text-fg-secondary">
                      {RESEARCH_METHODS.find((m) => m.value === p.method)?.label}
                    </span>
                  </span>
                  {p.goal && <span className="line-clamp-2 text-[13px] text-fg-secondary">{p.goal}</span>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="guides-h" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="guides-h" className="text-heading font-semibold">{t.research.guides}</h2>
          {canEdit && (
            <div className="flex flex-wrap gap-2">
              <form action={createGuide}>
                <input type="hidden" name="projectId" value={project.id} />
                <input type="hidden" name="planId" value={plans[0]?.id ?? ""} />
                <Button type="submit" variant="secondary">{t.research.newGuide}</Button>
              </form>
              <form action={createGuide}>
                <input type="hidden" name="projectId" value={project.id} />
                <input type="hidden" name="planId" value={plans[0]?.id ?? ""} />
                <input type="hidden" name="template" value="1" />
                <Button type="submit" variant={guides.length ? "secondary" : "primary"}>{t.research.newGuideTemplate}</Button>
              </form>
            </div>
          )}
        </div>
        {guides.length === 0 ? <p className={empty}>{t.research.guidesEmpty}</p> : (
          <ul className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
            {guides.map((g) => (
              <li key={g.id}>
                <Link href={`${base}/research/guides/${g.id}`} className={card}>
                  <span className="font-bold">{g.title}</span>
                  <span className="text-[13px] text-fg-secondary">{t.research.questionsCount(g.questionCount)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="interviews-h" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="interviews-h" className="text-heading font-semibold">{t.research.interviews}</h2>
          <span className="flex gap-3 text-sm font-semibold">
            <Link href={`${base}/research/participants`} className="underline underline-offset-2">{t.research.toParticipants}</Link>
            <Link href={`${base}/research/matrix`} className="underline underline-offset-2">{t.research.toMatrix}</Link>
          </span>
        </div>
        {interviews.length === 0 ? <p className={empty}>{t.research.interviewsEmpty}</p> : (
          <ul className="divide-y divide-line rounded-[14px] border border-line bg-surface">
            {interviews.map((i) => (
              <li key={i.id}>
                <Link href={`${base}/research/interviews/${i.code}`}
                  className="grid grid-cols-[64px_1fr_auto] items-center gap-3 px-4 py-2.5 hover:bg-subtle sm:grid-cols-[64px_1fr_140px_80px]">
                  <span className="text-caption font-semibold text-fg-secondary tabular-nums">{i.code}</span>
                  <span className="truncate font-semibold">
                    {i.participants ? `${i.participants.code} · ${participantTitle(i.participants)}` : "—"}
                  </span>
                  <span className={cn("text-[13px] font-semibold", isConducted(i.status) ? "text-success" : "text-fg-secondary")}>
                    {interviewStatusLabel(i.status)}
                  </span>
                  <span className="hidden text-right text-[13px] text-fg-secondary tabular-nums sm:block">
                    {i.conducted_at ? dateFmt.format(new Date(i.conducted_at)) : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {canEdit && <ImportNotebook projectId={project.id} />}
    </div>
  );
}
