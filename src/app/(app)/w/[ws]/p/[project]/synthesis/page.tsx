import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProjectContext } from "@/domains/projects";
import { getBoard, getSynthesisOverview } from "@/domains/synthesis";
import { SynthesisBoard } from "@/domains/synthesis/board";
import { listParticipants } from "@/domains/research";
import { PageHeader } from "@/shared/ui/page-header";
import { t } from "@/shared/i18n/ru";

export const metadata: Metadata = { title: t.synthesis.title };

export default async function SynthesisPage({ params }: { params: Promise<{ ws: string; project: string }> }) {
  const { ws, project: slug } = await params;
  const ctx = await getProjectContext(ws, slug);
  if (!ctx) notFound();
  const [board, overview, participants] = await Promise.all([
    getBoard(ctx.project.id), getSynthesisOverview(ctx.project.id), listParticipants(ctx.project.id),
  ]);
  const clustered = board.cards.filter((c) => c.patternId).length;

  return (
    <div className="max-w-[1600px]">
      <PageHeader title={t.synthesis.title} lede={t.synthesis.board.lede}
        progress={{ value: board.cards.length ? (clustered / board.cards.length) * 100 : 0, caption: `${clustered} / ${board.cards.length}` }} />
      <dl className="mb-6 flex flex-wrap gap-x-8 gap-y-2">
        {([["quotes", overview.quotes], ["observations", overview.observations], ["patterns", overview.patterns], ["insights", overview.insights]] as const).map(([k, v]) => (
          <div key={k} className="flex items-baseline gap-2">
            <dd className="display-num text-display-sm leading-none tabular-nums">{v}</dd>
            <dt className="text-meta font-semibold text-fg-secondary">{t.synthesis.stats[k]}</dt>
          </div>
        ))}
      </dl>
      <SynthesisBoard key={board.cards.map((c) => c.id + c.patternId).join() + board.patterns.map((p) => p.id).join()}
        projectId={ctx.project.id} base={ctx.base} canEdit={ctx.canEdit}
        patterns={board.patterns} cards={board.cards}
        participants={participants.map((p) => ({ id: p.id, code: p.code, role: p.role }))} />
    </div>
  );
}
