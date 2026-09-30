import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectContext } from "@/domains/projects";
import { FLOW_STATUSES, listFlows } from "@/domains/flows";
import { createFlow } from "@/domains/flows/actions";
import { listReminders } from "@/domains/competitors";
import { RemindersPanel } from "@/domains/competitors/reminders";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/field";
import { PageHeader } from "@/shared/ui/page-header";
import { cn } from "@/shared/lib/cn";
import { t } from "@/shared/i18n/ru";

export const metadata: Metadata = { title: t.flows.title };
const f = t.flows;

export default async function FlowsPage({ params }: { params: Promise<{ ws: string; project: string }> }) {
  const { ws, project: slug } = await params;
  const ctx = await getProjectContext(ws, slug);
  if (!ctx) notFound();
  const [flows, reminders] = await Promise.all([listFlows(ctx.project.id), listReminders(ctx.project.id)]);

  return (
    <div className="flex max-w-5xl flex-col gap-8">
      <div>
        <PageHeader title={f.title} lede={f.lede} />
        {ctx.canEdit && (
          <form action={createFlow} className="flex max-w-xl flex-wrap gap-2">
            <input type="hidden" name="projectId" value={ctx.project.id} />
            <Input name="name" aria-label={f.fields.name} required maxLength={200} placeholder={f.namePlaceholder} className="min-w-0 flex-1" />
            <Button type="submit">{f.add}</Button>
          </form>
        )}
      </div>

      <RemindersPanel base={ctx.base} initial={reminders} canEdit={ctx.canEdit} compact />

      {flows.length === 0 ? (
        <p className="rounded-[14px] border-[1.5px] border-dashed border-line p-7 text-center text-fg-secondary">{f.empty}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {flows.map((fl) => (
            <li key={fl.id}>
              <Link href={`${ctx.base}/flows/${fl.code}`} className="flex flex-col gap-1.5 rounded-[14px] border border-line bg-surface p-4 hover:border-fg">
                <span className="flex flex-wrap items-baseline justify-between gap-3">
                  <span className="font-bold"><span className="mr-2 text-caption text-fg-secondary tabular-nums">{fl.code}</span>{fl.name}</span>
                  <span className="text-caption font-semibold text-fg-secondary">{FLOW_STATUSES.find((s) => s.value === fl.status)?.label}</span>
                </span>
                {fl.description && <span className="line-clamp-2 text-[14px] text-fg-secondary">{fl.description}</span>}
                <span className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] tabular-nums">
                  <span>{f.steps(fl.steps)}</span>
                  <span>{f.screens(fl.screens)}</span>
                  <span className={cn("font-semibold", fl.missing ? "text-warning" : "text-success")}>
                    {fl.missing ? `⚠ ${f.missing(fl.missing)}` : `✓ ${f.allCovered}`}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
