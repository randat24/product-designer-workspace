import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectContext } from "@/domains/projects";
import { getPlanByCode, listGuides } from "@/domains/research";
import { PlanEditor } from "@/domains/research/plan-editor";
import { PageHeader } from "@/shared/ui/page-header";
import { EntityChip } from "@/shared/ui/entity-chip";
import { t } from "@/shared/i18n/ru";

type Params = { ws: string; project: string; code: string };
export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  return { title: `${decodeURIComponent((await params).code).toUpperCase()} · ${t.research.plans}` };
}

export default async function PlanPage({ params }: { params: Promise<Params> }) {
  const { ws, project: slug, code } = await params;
  const ctx = await getProjectContext(ws, slug);
  if (!ctx) notFound();
  const plan = await getPlanByCode(ctx.project.id, decodeURIComponent(code));
  if (!plan) notFound();
  const guides = (await listGuides(ctx.project.id)).filter((g) => g.research_plan_id === plan.id);
  const questions = Array.isArray(plan.questions) ? plan.questions.filter((q): q is string => typeof q === "string") : [];

  return (
    <div className="max-w-4xl">
      <Link href={`${ctx.base}/research`} className="mb-4 inline-block text-meta font-semibold text-fg-secondary hover:text-fg">← {t.research.plan.back}</Link>
      <PageHeader title={plan.title} eyebrow={<EntityChip type="research_plan" code={plan.code} title={plan.title} />} />
      <PlanEditor key={plan.id} id={plan.id} canEdit={ctx.canEdit} initial={{
        title: plan.title, goal: plan.goal, questions, hypotheses_text: plan.hypotheses_text, audience: plan.audience,
        method: plan.method, participants_target: plan.participants_target, success_criteria: plan.success_criteria, status: plan.status,
      }} />
      {guides.length > 0 && (
        <section aria-labelledby="plan-guides-h" className="mt-8 flex flex-col gap-3">
          <h2 id="plan-guides-h" className="text-heading font-semibold">{t.research.plan.guides}</h2>
          <ul className="flex flex-wrap gap-2">
            {guides.map((g) => (
              <li key={g.id}>
                <Link href={`${ctx.base}/research/guides/${g.id}`} className="inline-block rounded-panel border border-line bg-surface px-4 py-2 font-semibold hover:border-fg">
                  {g.title} <span className="text-meta font-normal text-fg-secondary">· {t.research.questionsCount(g.questionCount)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
