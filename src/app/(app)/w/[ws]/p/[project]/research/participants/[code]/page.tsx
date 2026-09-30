import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectContext } from "@/domains/projects";
import { getParticipantByCode, interviewStatusLabel, isConducted, listGuides, participantTitle } from "@/domains/research";
import { createInterview } from "@/domains/research/actions";
import { ParticipantEditor } from "@/domains/research/participant-editor";
import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";
import { EntityChip } from "@/shared/ui/entity-chip";
import { cn } from "@/shared/lib/cn";
import { t } from "@/shared/i18n/ru";
import { Select } from "@/shared/ui/field";

type Params = { ws: string; project: string; code: string };
export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  return { title: `${decodeURIComponent((await params).code).toUpperCase()} · ${t.research.participants.title}` };
}
const pt = t.research.participants;
const dateFmt = new Intl.DateTimeFormat("ru", { day: "numeric", month: "long", year: "numeric" });

export default async function ParticipantPage({ params }: { params: Promise<Params> }) {
  const { ws, project: slug, code } = await params;
  const ctx = await getProjectContext(ws, slug);
  if (!ctx) notFound();
  const p = await getParticipantByCode(ctx.project.id, decodeURIComponent(code));
  if (!p) notFound();
  const guides = await listGuides(ctx.project.id);

  return (
    <div className="max-w-4xl">
      <Link href={`${ctx.base}/research/participants`} className="mb-4 inline-block text-meta font-semibold text-fg-secondary hover:text-fg">← {pt.back}</Link>
      <PageHeader title={participantTitle(p)} eyebrow={<span className="flex items-center gap-2"><EntityChip type="participant" code={p.code} />{p.segment_label}</span>} />

      <section aria-labelledby="p-interviews-h" className="mb-8 flex flex-col gap-3">
        <h2 id="p-interviews-h" className="text-heading font-semibold">{pt.sections.interviews}</h2>
        {p.interviews.length === 0 ? <p className="text-fg-secondary">{pt.interviewsEmpty}</p> : (
          <ul className="flex flex-col gap-2">
            {p.interviews.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 rounded-panel border border-line bg-surface px-4 py-2.5">
                <Link href={`${ctx.base}/research/interviews/${i.code}`} className="font-semibold hover:underline">
                  {i.code}
                  <span className={cn("ml-3 text-meta", isConducted(i.status) ? "text-success" : "text-fg-secondary")}>{interviewStatusLabel(i.status)}</span>
                  {i.conducted_at && <span className="ml-3 text-meta font-normal text-fg-secondary">{dateFmt.format(new Date(i.conducted_at))}</span>}
                </Link>
                {ctx.canEdit && !isConducted(i.status) && (
                  <Link href={`${ctx.base}/research/interviews/${i.code}/live`} className="rounded-control bg-fg px-3 py-1 text-sm font-semibold text-canvas">{pt.startLive}</Link>
                )}
              </li>
            ))}
          </ul>
        )}
        {ctx.canEdit && (
          <form action={createInterview} className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="participantId" value={p.id} />
            <label className="flex flex-col gap-1.5 text-meta font-semibold text-fg-secondary">
              {pt.guideLabel}
              <Select name="guideId" defaultValue={guides.at(-1)?.id ?? ""}
                className="w-auto min-w-56 bg-surface">
                {guides.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
                <option value="">{pt.noGuide}</option>
              </Select>
            </label>
            <Button type="submit" name="live" value="1">{pt.startLive}</Button>
            <Button type="submit" variant="secondary">{pt.newInterview}</Button>
          </form>
        )}
      </section>

      <ParticipantEditor key={p.id} id={p.id} consentAt={p.consent_at} canEdit={ctx.canEdit} initial={{
        display_name: p.display_name, role: p.role, segment_label: p.segment_label, age_range: p.age_range,
        context: p.context, contact: p.contact, consent: !!p.consent_at, tags: p.tags, notes: p.notes,
      }} />
    </div>
  );
}
