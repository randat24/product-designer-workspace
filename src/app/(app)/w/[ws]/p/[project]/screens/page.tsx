import { TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectContext } from "@/domains/projects";
import { KEY_STATES, listKeyStates, listScreens, SCREEN_STATUSES } from "@/domains/design";
import { createScreen } from "@/domains/design/actions";
import { listReminders } from "@/domains/competitors";
import { RemindersPanel } from "@/domains/competitors/reminders";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/field";
import { PageHeader } from "@/shared/ui/page-header";
import { cn } from "@/shared/lib/cn";
import { t } from "@/shared/i18n/uk";
import { ActionForm } from "@/shared/ui/action-form";

export const metadata: Metadata = { title: t.screens.title };
const sc = t.screens;
const STATE_DOT: Record<string, string> = { designed: "bg-success", n_a: "bg-fg-secondary/40", missing: "border-[1.5px] border-warning bg-transparent" };

export default async function ScreensPage({ params }: { params: Promise<{ ws: string; project: string }> }) {
  const { ws, project: slug } = await params;
  const ctx = await getProjectContext(ws, slug);
  if (!ctx) notFound();
  const [screens, keyStates, reminders] = await Promise.all([listScreens(ctx.project.id), listKeyStates(ctx.project.id), listReminders(ctx.project.id)]);

  return (
    <div className="flex max-w-6xl flex-col gap-8">
      <div>
        <PageHeader title={sc.title} lede={sc.lede} />
        {ctx.canEdit && (
          <ActionForm action={createScreen} idempotent className="flex max-w-xl flex-wrap gap-2">
            <input type="hidden" name="projectId" value={ctx.project.id} />
            <Input name="name" aria-label={sc.fields.name} required maxLength={200} placeholder={sc.namePlaceholder} className="min-w-0 flex-1" />
            <Button type="submit">{sc.add}</Button>
          </ActionForm>
        )}
      </div>

      <RemindersPanel base={ctx.base} initial={reminders} canEdit={ctx.canEdit} compact />

      {screens.length === 0 ? (
        <p className="rounded-panel border-[1.5px] border-dashed border-line p-7 text-center text-fg-secondary">{sc.empty}</p>
      ) : (
        <div className="relative overflow-x-auto rounded-panel border border-line bg-surface">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line text-caption font-semibold text-fg-secondary">
              <tr>
                <th scope="col" className="px-4 py-2.5">{sc.columns.screen}</th>
                <th scope="col" className="px-4 py-2.5">{sc.columns.status}</th>
                <th scope="col" className="px-4 py-2.5">{sc.columns.states}</th>
                <th scope="col" className="px-4 py-2.5">{sc.columns.flows}</th>
                <th scope="col" className="px-4 py-2.5">{sc.columns.upstream}</th>
              </tr>
            </thead>
            <tbody>
              {screens.map((s) => {
                const ks = keyStates.get(s.id) ?? {};
                return (
                  <tr key={s.id} className="border-b border-line last:border-0 hover:bg-subtle">
                    <td className="px-4 py-3">
                      <Link href={`${ctx.base}/screens/${s.code}`} className="font-bold hover:underline">
                        <span className="mr-2 text-caption text-fg-secondary tabular-nums">{s.code}</span>{s.name}
                      </Link>
                      {s.purpose && <p className="line-clamp-1 text-meta text-fg-secondary">{s.purpose}</p>}
                    </td>
                    <td className="px-4 py-3 text-meta font-semibold">{SCREEN_STATUSES.find((x) => x.value === s.status)?.label}</td>
                    <td className="px-4 py-3">
                      <ul className="flex gap-2.5 text-caption" aria-label={sc.columns.states}>
                        {KEY_STATES.map((k) => (
                          <li key={k} className="flex items-center gap-1"
                            title={`${sc.states.kinds[k]}: ${sc.states.statuses[(ks[k] ?? "missing") as keyof typeof sc.states.statuses]}`}>
                            <span aria-hidden className={cn("size-2.5 rounded-full", STATE_DOT[ks[k] ?? "missing"])} />
                            <span className={cn(ks[k] === "missing" || !ks[k] ? "text-warning" : "text-fg-secondary")}>{sc.states.kinds[k]}</span>
                            <span className="sr-only">: {sc.states.statuses[(ks[k] ?? "missing") as keyof typeof sc.states.statuses]}</span>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-4 py-3 text-meta tabular-nums">
                      {s.flows.map((code) => (
                        <Link key={code} href={`${ctx.base}/flows/${code}`} className="mr-1.5 hover:underline">{code}</Link>
                      ))}
                    </td>
                    <td className="px-4 py-3 text-meta">
                      {s.upstream > 0
                        ? <span>{sc.upstream(s.upstream)}</span>
                        : <span className="inline-flex items-center gap-1 font-semibold text-warning"><TriangleAlert aria-hidden className="size-4 shrink-0" />{sc.noUpstream}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
