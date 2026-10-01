import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProjectContext } from "@/domains/projects";
import { getFlowByCode, listScreenOptions } from "@/domains/flows";
import { DeleteFlowButton, FlowMetaEditor } from "@/domains/flows/editors";
import { FlowEditor } from "@/domains/flows/flow-editor";
import { StepList } from "@/domains/flows/step-list";
import { listReminders } from "@/domains/competitors";
import { RemindersPanel } from "@/domains/competitors/reminders";
import { TracePanel } from "@/domains/trace";
import { EntityChip } from "@/shared/ui/entity-chip";
import { PageHeader } from "@/shared/ui/page-header";
import { t } from "@/shared/i18n/uk";
import { BackLink } from "@/shared/ui/back-link";

type Params = { ws: string; project: string; code: string };
export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  return { title: `${decodeURIComponent((await params).code).toUpperCase()} · ${t.flows.title}` };
}
const f = t.flows;

type Viewport = { x: number; y: number; zoom: number };
const isViewport = (v: unknown): v is Viewport =>
  !!v && typeof v === "object" && ["x", "y", "zoom"].every((k) => typeof (v as Record<string, unknown>)[k] === "number");

export default async function FlowPage({ params }: { params: Promise<Params> }) {
  const { ws, project: slug, code } = await params;
  const ctx = await getProjectContext(ws, slug);
  if (!ctx) notFound();
  const [flow, screens, reminders] = await Promise.all([
    getFlowByCode(ctx.project.id, decodeURIComponent(code)), listScreenOptions(ctx.project.id), listReminders(ctx.project.id),
  ]);
  if (!flow) notFound();
  const missing = flow.edgeCases.filter((c) => c.status === "missing").length;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <BackLink href={`${ctx.base}/flows`}>{f.back}</BackLink>
        <PageHeader title={flow.name} eyebrow={<EntityChip type="user_flow" code={flow.code} />}
          stat={{ value: missing, caption: f.edgeCases.statuses.missing.toLowerCase() }} />
      </div>

      <RemindersPanel base={ctx.base} initial={reminders} canEdit={ctx.canEdit} compact />

      {/* On a phone the step list comes first as the readable overview; the editor works below it. */}
      <div className="md:hidden"><StepList nodes={flow.nodes} edges={flow.edges} /></div>
      <div>
        <FlowEditor flowId={flow.id} nodes={flow.nodes} edges={flow.edges} edgeCases={flow.edgeCases} screens={screens}
          viewport={isViewport(flow.viewport) ? flow.viewport : null} canEdit={ctx.canEdit} base={ctx.base} />
      </div>

      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        <FlowMetaEditor key={flow.id} id={flow.id} canEdit={ctx.canEdit}
          initial={{ name: flow.name, description: flow.description, status: flow.status }} />
        <TracePanel projectId={ctx.project.id} base={ctx.base} entity={{ type: "user_flow", id: flow.id, code: flow.code }}
          canEdit={ctx.canEdit} needsSources />
      </div>

      {ctx.canEdit && <DeleteFlowButton id={flow.id} />}
    </div>
  );
}
