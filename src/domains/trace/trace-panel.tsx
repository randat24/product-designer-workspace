import Link from "next/link";
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
    <aside aria-label={t.trace.title} className="flex flex-col gap-5 rounded-[14px] border border-line bg-surface p-5 text-sm">
      <h2 className="text-caption font-bold tracking-wide text-fg-secondary uppercase">{t.trace.title}</h2>
      <Section title={t.trace.upstream} edges={upstream} pick="source" resolved={resolved} canEdit={canEdit}
        empty={needsSources ? <p className="rounded-lg bg-warning/10 px-2.5 py-1.5 font-semibold text-warning">⚠ {t.trace.unsupported}</p> : null} />
      <div className="flex items-center gap-2 border-y border-line py-3">
        <EntityChip type={entity.type} code={entity.code} className="border-fg" />
        <span className="text-caption text-fg-secondary">{ENTITIES[entity.type].label}</span>
      </div>
      <Section title={t.trace.downstream} edges={downstream} pick="target" resolved={resolved} canEdit={canEdit} empty={null} />
      {canEdit && (
        <LinkPicker projectId={projectId} entity={entity} candidates={candidates.filter((c) => c.id !== entity.id)}
          upRules={upRules} downRules={downRules} />
      )}
    </aside>
  );
}

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
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-caption font-semibold text-fg-secondary">{title}</h3>
      {rows.length === 0 ? (empty ?? <p className="text-fg-secondary">{t.trace.none}</p>) : (
        <ul className="flex flex-col gap-1.5">
          {rows.map((e) => {
            const r = resolved.get(`${e[pick].type}:${e[pick].id}`);
            return (
              <li key={e.linkId} className="group flex items-start gap-1.5" style={{ paddingLeft: (e.depth - 1) * 12 }}>
                <Link href={r?.href ?? "#"} className="flex min-w-0 flex-1 items-start gap-2 rounded-md px-1 py-0.5 hover:bg-subtle">
                  <EntityChip type={e[pick].type} code={r?.code ?? "…"} title={r?.title} />
                  <span className="line-clamp-2 min-w-0 text-[13px] leading-snug">
                    {r?.participant && e[pick].type !== "interview" && <span className="font-semibold">{r.participant} · </span>}
                    {r?.title}
                  </span>
                </Link>
                {canEdit && e.depth === 1 && e.origin !== "system" && <UnlinkButton linkId={e.linkId} label={r?.code ?? ""} />}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
