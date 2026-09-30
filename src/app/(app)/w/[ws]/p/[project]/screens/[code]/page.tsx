import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectContext } from "@/domains/projects";
import { asEvents, asStrings, getScreenByCode, listScreenDecisions, DECISION_STATUSES } from "@/domains/design";
import { createDecision } from "@/domains/design/actions";
import { DeleteScreenButton, ScreenEditor } from "@/domains/design/editors";
import { StatesPanel } from "@/domains/design/states-panel";
import { listReminders } from "@/domains/competitors";
import { RemindersPanel } from "@/domains/competitors/reminders";
import { Screenshots } from "@/domains/competitors/screenshots";
import { TracePanel } from "@/domains/trace";
import { Button } from "@/shared/ui/button";
import { EntityChip } from "@/shared/ui/entity-chip";
import { EntityLayout } from "@/shared/ui/entity-layout";
import { PageHeader } from "@/shared/ui/page-header";
import { t } from "@/shared/i18n/ru";

type Params = { ws: string; project: string; code: string };
export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  return { title: `${decodeURIComponent((await params).code).toUpperCase()} · ${t.screens.title}` };
}
const sc = t.screens;

export default async function ScreenPage({ params }: { params: Promise<Params> }) {
  const { ws, project: slug, code } = await params;
  const ctx = await getProjectContext(ws, slug);
  if (!ctx) notFound();
  const s = await getScreenByCode(ctx.project.id, decodeURIComponent(code));
  if (!s) notFound();
  const [decisions, reminders] = await Promise.all([listScreenDecisions(s.id), listReminders(ctx.project.id)]);
  const missing = s.states.filter((x) => ["loading", "empty", "error"].includes(x.kind) && x.status === "missing").length;

  return (
    <EntityLayout aside={<TracePanel projectId={ctx.project.id} base={ctx.base} entity={{ type: "screen", id: s.id, code: s.code }} canEdit={ctx.canEdit} needsSources />}>
      <Link href={`${ctx.base}/screens`} className="mb-4 inline-block text-meta font-semibold text-fg-secondary hover:text-fg">{sc.back}</Link>
      <PageHeader title={s.name} eyebrow={<EntityChip type="screen" code={s.code} />}
        stat={{ value: missing, caption: sc.states.statuses.missing.toLowerCase() }} />
      <div className="flex flex-col gap-10">
        <RemindersPanel base={ctx.base} initial={reminders} canEdit={ctx.canEdit} compact />
        <Screenshots projectId={ctx.project.id} entityId={s.id} items={s.previews} canEdit={ctx.canEdit}
          entityType="screen" title={sc.preview} emptyText={sc.previewEmpty} />

        <ScreenEditor key={s.id} id={s.id} canEdit={ctx.canEdit} initial={{
          name: s.name, purpose: s.purpose, user_goal: s.user_goal, entry_points: s.entry_points,
          primary_action: s.primary_action, secondary_actions: s.secondary_actions,
          content_hierarchy: asStrings(s.content_hierarchy), permissions: s.permissions,
          analytics_events: asEvents(s.analytics_events), api_data_requirements: s.api_data_requirements,
          status: s.status, figma_url: s.figma_url,
        }} />

        <StatesPanel screenId={s.id} initial={s.states} canEdit={ctx.canEdit} />

        <section aria-labelledby="used-h" className="flex flex-col gap-3">
          <h2 id="used-h" className="text-heading font-semibold">{sc.usedIn}</h2>
          {s.flows.length === 0 ? <p className="text-fg-secondary">{sc.usedInEmpty}</p> : (
            <ul className="flex flex-col gap-1.5">
              {s.flows.map((f) => (
                <li key={f.code}>
                  <Link href={`${ctx.base}/flows/${f.code}`} className="flex flex-wrap items-baseline gap-2 rounded-control border border-line bg-surface px-3 py-2 hover:border-fg">
                    <EntityChip type="user_flow" code={f.code} />
                    <span className="font-semibold">{f.name}</span>
                    <span className="text-meta text-fg-secondary">— {f.steps.join(", ")}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="decisions-h" className="flex flex-col gap-3">
          <h2 id="decisions-h" className="text-heading font-semibold">{sc.decisions}</h2>
          {decisions.length === 0 ? <p className="text-fg-secondary">{sc.decisionsEmpty}</p> : (
            <ul className="flex flex-col gap-1.5">
              {decisions.map((d) => (
                <li key={d.id}>
                  <Link href={`${ctx.base}/decisions/${d.code}`} className="flex flex-wrap items-baseline gap-2 rounded-control border border-line bg-surface px-3 py-2 hover:border-fg">
                    <EntityChip type="design_decision" code={d.code} />
                    <span className="font-semibold">{d.title}</span>
                    <span className="text-caption font-semibold text-fg-secondary">{DECISION_STATUSES.find((x) => x.value === d.status)?.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {ctx.canEdit && (
            <form action={createDecision}>
              <input type="hidden" name="projectId" value={ctx.project.id} />
              <input type="hidden" name="targetType" value="screen" />
              <input type="hidden" name="targetId" value={s.id} />
              <Button type="submit" variant="secondary">{sc.recordDecision} →</Button>
            </form>
          )}
        </section>

        {ctx.canEdit && <DeleteScreenButton id={s.id} />}
      </div>
    </EntityLayout>
  );
}
