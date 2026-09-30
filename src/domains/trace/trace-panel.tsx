import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { t } from "@/shared/i18n/ru";
import { ENTITIES, isEntityType, type EntityType } from "@/shared/entities";
import { EntityChip } from "@/shared/ui/entity-chip";
import { getTraceGraph, listLinkCandidates, listRules, resolveEntities, type ResolvedEntity, type TraceEdge } from "./queries";
import { LinkPicker, UnlinkButton } from "./link-picker";

type Props = {
  projectId: string;
  base: string;
  entity: { type: EntityType; id: string; code: string };
  canEdit: boolean;
  /** Types that should show "no sources" when nothing is upstream. */
  needsSources?: boolean;
};

/** Right-hand panel on traceable entity pages (docs/IA.md §1): upstream → this → downstream. */
export async function TracePanel({ projectId, base, entity, canEdit, needsSources }: Props) {
  const [{ upstream, downstream }, rules] = await Promise.all([getTraceGraph(entity.type, entity.id), listRules()]);
  const resolved = await resolveEntities(base, [
    ...upstream.map((e) => e.source),
    ...downstream.map((e) => e.target),
  ]);

  const upRules = rules.filter((r) => r.target_type === entity.type && isEntityType(r.source_type) && r.relation !== "member_of");
  const downRules = rules.filter((r) => r.source_type === entity.type && isEntityType(r.target_type) && r.relation !== "member_of");
  const candidateTypes = [...new Set([...upRules.map((r) => r.source_type), ...downRules.map((r) => r.target_type)])] as EntityType[];
  const candidates = canEdit ? await listLinkCandidates(base, projectId, candidateTypes) : [];

  return (
    <aside aria-label={t.trace.title} className="flex flex-col gap-5 rounded-panel border border-line bg-surface p-5">
      <h2 className="text-heading font-semibold">{t.trace.title}</h2>
      <Section title={t.trace.upstream} edges={upstream} pick="source" resolved={resolved} canEdit={canEdit}
        empty={needsSources ? (
          <p className="flex items-center gap-2 rounded-control bg-warning/10 px-2.5 py-1.5 text-meta font-semibold text-warning">
            <TriangleAlert aria-hidden className="size-4 shrink-0" />{t.trace.unsupported}
          </p>
        ) : null} />
      <div className={cn(ROW, "border-y border-line py-3")}>
        <EntityChip type={entity.type} code={entity.code} className="justify-self-start border-fg" />
        <span className="text-meta text-fg-secondary">{ENTITIES[entity.type].label}</span>
      </div>
      <Section title={t.trace.downstream} edges={downstream} pick="target" resolved={resolved} canEdit={canEdit} empty={null} />
      {canEdit && (
        <LinkPicker projectId={projectId} entity={entity} candidates={candidates.filter((c) => c.id !== entity.id)}
          upRules={upRules} downRules={downRules} />
      )}
    </aside>
  );
}

/** Code column of a fixed width, then the title: every title starts on one vertical line. */
const ROW = "grid grid-cols-[5.75rem_minmax(0,1fr)_auto] items-start gap-x-2";

function Section({ title, edges, pick, resolved, canEdit, empty }: {
  title: string;
  edges: TraceEdge[];
  pick: "source" | "target";
  resolved: Map<string, ResolvedEntity>;
  canEdit: boolean;
  empty: React.ReactNode;
}) {
  // One row per entity at its shallowest depth.
  const seen = new Set<string>();
  const rows = [...edges].sort((a, b) => a.depth - b.depth).filter((e) => {
    const key = `${e[pick].type}:${e[pick].id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const direct = rows.filter((e) => e.depth === 1);
  const indirect = rows.filter((e) => e.depth > 1);
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-meta font-semibold text-fg-secondary">{title}</h3>
      {rows.length === 0 ? (empty ?? <p className="text-meta text-fg-secondary">{t.trace.none}</p>) : (
        <>
          {direct.length > 0 && <Rows edges={direct} pick={pick} resolved={resolved} canEdit={canEdit} />}
          {indirect.length > 0 && (
            <>
              <p className="mt-1 text-caption font-medium text-fg-secondary">{t.trace.indirect(indirect.length)}</p>
              <Rows edges={indirect} pick={pick} resolved={resolved} canEdit={false} />
            </>
          )}
        </>
      )}
    </section>
  );
}

function Rows({ edges, pick, resolved, canEdit }: {
  edges: TraceEdge[];
  pick: "source" | "target";
  resolved: Map<string, ResolvedEntity>;
  canEdit: boolean;
}) {
  return (
    <ul className="flex flex-col">
      {edges.map((e) => {
        const r = resolved.get(`${e[pick].type}:${e[pick].id}`);
        return (
          <li key={e.linkId} className={cn(ROW, "group relative -mx-1.5 rounded-control px-1.5 py-1 hover:bg-subtle")}>
            <EntityChip type={e[pick].type} code={r?.code ?? "…"} title={r?.title} className="justify-self-start" />
            <Link href={r?.href ?? "#"} className="line-clamp-2 min-w-0 pt-0.5 text-meta leading-snug after:absolute after:inset-0 after:rounded-control">
              {r?.participant && e[pick].type !== "interview" && <span className="font-semibold">{r.participant} · </span>}
              {r?.title}
            </Link>
            {canEdit && e.origin !== "system" ? <UnlinkButton linkId={e.linkId} label={r?.code ?? ""} /> : <span aria-hidden />}
          </li>
        );
      })}
    </ul>
  );
}
