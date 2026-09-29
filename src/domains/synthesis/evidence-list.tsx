import Link from "next/link";
import { getTraceGraph, resolveEntities } from "@/domains/trace";
import { EntityChip } from "@/shared/ui/entity-chip";
import { participantColor } from "./schema";
import type { EntityType } from "@/shared/entities";

const EVIDENCE: EntityType[] = ["quote", "observation", "answer", "interview", "competitor"];

/**
 * Evidence behind an entity: research sources anywhere upstream, with the participant
 * and their words (docs/DESIGN-SYSTEM.md EvidenceList). Shows how a screen/decision
 * reaches the interview in one glance.
 */
export async function EvidenceList({ type, id, base, empty }: { type: EntityType; id: string; base: string; empty: string }) {
  const { upstream } = await getTraceGraph(type, id);
  const refs = upstream.map((e) => e.source).filter((s) => EVIDENCE.includes(s.type));
  const unique = [...new Map(refs.map((r) => [`${r.type}:${r.id}`, r])).values()];
  const resolved = await resolveEntities(base, unique);
  const items = unique.map((r) => resolved.get(`${r.type}:${r.id}`)).filter((x) => !!x);

  if (items.length === 0) {
    return <p className="rounded-[12px] bg-warning/10 px-4 py-3 font-semibold text-warning">⚠ {empty}</p>;
  }
  return (
    <ul className="flex flex-col gap-2">
      {items.map((e) => (
        <li key={`${e.type}:${e.id}`}>
          <Link href={e.href} className="flex items-start gap-3 rounded-[12px] border border-line bg-surface p-3 hover:border-fg"
            style={{ borderLeft: `5px solid ${participantColor(e.participant)}` }}>
            <EntityChip type={e.type} code={e.code} />
            <span className="min-w-0 text-[14px] leading-snug">
              {e.participant && <span className="mr-1.5 font-bold">{e.participant}</span>}
              <span className={e.type === "quote" ? "italic" : undefined}>{e.type === "quote" ? `«${e.title}»` : e.title}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
