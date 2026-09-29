import { t } from "@/shared/i18n/ru";
import { EntityChip } from "@/shared/ui/entity-chip";
import type { EntityType } from "@/shared/entities";
import { getTraceGraph, type TraceEdge } from "./queries";

type Props = { entity?: { type: EntityType; id: string; code: string } };

/** Right-hand panel on every traceable entity page (docs/IA.md §1). */
export async function TracePanel({ entity }: Props) {
  return (
    <aside aria-label={t.trace.title} className="flex flex-col gap-5 px-5 py-6 text-sm">
      <h2 className="text-[13px] font-semibold text-fg-secondary">{t.trace.title}</h2>
      {entity ? <TraceContent entity={entity} /> : <Empty />}
    </aside>
  );
}

function Empty() {
  return (
    <div className="flex flex-col gap-2">
      <p className="font-medium">{t.trace.emptyTitle}</p>
      <p className="text-fg-secondary">{t.trace.emptyBody}</p>
    </div>
  );
}

async function TraceContent({ entity }: Required<Props>) {
  const { upstream, downstream } = await getTraceGraph(entity.type, entity.id);
  return (
    <>
      <Section title={t.trace.upstream} edges={upstream} pick="source" warnIfEmpty />
      <div className="flex items-center gap-2">
        <EntityChip type={entity.type} code={entity.code} />
      </div>
      <Section title={t.trace.downstream} edges={downstream} pick="target" />
    </>
  );
}

function Section({ title, edges, pick, warnIfEmpty }: { title: string; edges: TraceEdge[]; pick: "source" | "target"; warnIfEmpty?: boolean }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-caption font-medium text-fg-secondary">{title}</h3>
      {edges.length === 0 ? (
        <p className={warnIfEmpty ? "text-warning" : "text-fg-secondary"}>{warnIfEmpty ? t.trace.unsupported : t.trace.none}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {edges.map((e) => (
            <li key={e.linkId} style={{ paddingLeft: (e.depth - 1) * 12 }}>
              {/* Codes are resolved per entity type as domains ship; the id is shown until then. */}
              <EntityChip type={e[pick].type} code={e[pick].id.slice(0, 8)} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
