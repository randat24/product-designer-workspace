import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectContext } from "@/domains/projects";
import { interviewStatusLabel, isConducted, listParticipants, participantTitle } from "@/domains/research";
import { createParticipant } from "@/domains/research/actions";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/field";
import { PageHeader } from "@/shared/ui/page-header";
import { cn } from "@/shared/lib/cn";
import { t } from "@/shared/i18n/ru";
import { ResearchTabs } from "../tabs";

export const metadata: Metadata = { title: t.research.participants.title };
const pt = t.research.participants;

export default async function ParticipantsPage({ params }: { params: Promise<{ ws: string; project: string }> }) {
  const { ws, project: slug } = await params;
  const ctx = await getProjectContext(ws, slug);
  if (!ctx) notFound();
  const participants = await listParticipants(ctx.project.id);

  return (
    <div className="max-w-6xl">
      <PageHeader title={pt.title} lede={pt.lede} />
      <ResearchTabs base={ctx.base} current="participants" />

      {ctx.canEdit && (
        <form action={createParticipant} className="mb-5 flex flex-wrap gap-2">
          <input type="hidden" name="projectId" value={ctx.project.id} />
          <Input name="role" aria-label={pt.fields.role} placeholder={pt.rolePlaceholder} maxLength={200} className="w-80 max-w-full bg-surface" />
          <Button type="submit">{pt.add}</Button>
        </form>
      )}

      {participants.length === 0 ? (
        <p className="rounded-panel border-[1.5px] border-dashed border-line p-7 text-center text-fg-secondary">{pt.empty}</p>
      ) : (
        <div className="overflow-x-auto rounded-panel border border-line bg-surface">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left text-meta text-fg-secondary">
                {Object.values(pt.columns).map((c) => <th key={c} scope="col" className="px-4 py-2.5 font-semibold">{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {participants.map((p) => (
                <tr key={p.id} className="border-b border-line last:border-0 hover:bg-subtle">
                  <td className="px-4 py-2.5 font-semibold tabular-nums">
                    <Link href={`${ctx.base}/research/participants/${p.code}`} className="underline-offset-2 hover:underline">{p.code}</Link>
                  </td>
                  <td className="px-4 py-2.5">
                    <Link href={`${ctx.base}/research/participants/${p.code}`} className="font-semibold">{participantTitle(p)}</Link>
                    {p.display_name && p.role && <span className="block text-meta text-fg-secondary">{p.role}</span>}
                  </td>
                  <td className="px-4 py-2.5 text-fg-secondary">{p.segment_label ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    {p.interview ? (
                      <Link href={`${ctx.base}/research/interviews/${p.interview.code}`}
                        className={cn("font-semibold", isConducted(p.interview.status) ? "text-success" : "text-fg-secondary")}>
                        {p.interview.code} · {interviewStatusLabel(p.interview.status)}
                      </Link>
                    ) : <span className="text-fg-secondary">{pt.noInterview}</span>}
                  </td>
                  <td className="px-4 py-2.5">{p.consent_at ? <span className="text-success">✓ {pt.consentYes}</span> : <span className="text-fg-secondary">{pt.consentNo}</span>}</td>
                  <td className="px-4 py-2.5">
                    <span className="flex flex-wrap gap-1">
                      {p.tags.map((tag) => <span key={tag} className="rounded-full border border-line px-2 py-0.5 text-caption font-semibold">{tag}</span>)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
