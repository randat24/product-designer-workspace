import { t } from "@/shared/i18n/ru";
import { branchColor, nodeKind, type Branch, type NodeKind } from "./schema";
import type { FlowEdge, FlowNode } from "./queries";

const f = t.flows;

/** Walk from the start steps along the links (breadth-first), so the list reads like the flow. */
export function orderSteps(nodes: FlowNode[], edges: FlowEdge[]) {
  const out = new Map(nodes.map((n) => [n.id, edges.filter((e) => e.source === n.id)]));
  const hasIncoming = new Set(edges.map((e) => e.target));
  const starts = nodes.filter((n) => n.kind === "start" || !hasIncoming.has(n.id))
    .sort((a, b) => (a.kind === "start" ? -1 : 0) - (b.kind === "start" ? -1 : 0) || a.x - b.x);
  const seen = new Set<string>();
  const order: FlowNode[] = [];
  const queue = [...starts];
  while (queue.length) {
    const n = queue.shift()!;
    if (seen.has(n.id)) continue;
    seen.add(n.id);
    order.push(n);
    for (const e of out.get(n.id) ?? []) {
      const next = nodes.find((x) => x.id === e.target);
      if (next && !seen.has(next.id)) queue.push(next);
    }
  }
  const rest = nodes.filter((n) => !seen.has(n.id));
  return { order, rest, out };
}

/** Read-only list of steps for phones (docs/DESIGN-SYSTEM.md, «Телефон»). */
export function StepList({ nodes, edges }: { nodes: FlowNode[]; edges: FlowEdge[] }) {
  const { order, rest, out } = orderSteps(nodes, edges);
  const label = (id: string) => nodes.find((n) => n.id === id)?.label ?? "";
  const item = (n: FlowNode, i: number | null) => {
    const k = nodeKind(n.kind);
    return (
      <li key={n.id} className="flex gap-3 rounded-panel border border-line bg-surface p-3" style={{ borderLeft: `4px solid ${k.color}` }}>
        {i !== null && <span className="w-6 shrink-0 text-caption font-bold text-fg-secondary tabular-nums">{i}</span>}
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-caption font-semibold text-fg-secondary">
            {f.kinds[n.kind as NodeKind]}{n.screen ? ` · ${n.screen.code}` : ""}
          </span>
          <span className="font-bold">{n.label}</span>
          {(out.get(n.id) ?? []).length > 0 && (
            <ul className="flex flex-col gap-0.5 text-meta">
              {(out.get(n.id) ?? []).map((e) => (
                <li key={e.id} className="text-fg-secondary">
                  <span style={{ color: branchColor(e.branch) }}>→</span>{" "}
                  {e.label ?? (e.branch !== "default" ? f.branches[e.branch as Branch] : "")}{e.label || e.branch !== "default" ? ": " : ""}
                  <span className="text-fg">{label(e.target)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </li>
    );
  };
  return (
    <section aria-labelledby="steps-h" className="flex flex-col gap-3">
      <h2 id="steps-h" className="text-heading font-semibold">{f.stepList}</h2>
      <p className="text-meta text-fg-secondary">{f.stepListHint}</p>
      <ol className="flex flex-col gap-2">{order.map((n, i) => item(n, i + 1))}</ol>
      {rest.length > 0 && (
        <>
          <h3 className="text-caption font-bold tracking-wide text-fg-secondary uppercase">{f.unreachable}</h3>
          <ul className="flex flex-col gap-2">{rest.map((n) => item(n, null))}</ul>
        </>
      )}
    </section>
  );
}
