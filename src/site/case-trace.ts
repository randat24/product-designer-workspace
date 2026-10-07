import { z } from "zod";

/**
 * «Слід рішень»: the records of a case's workbook and the links between them, kept in the published snapshot as
 * `trace` (collected on publish, src/domains/cases/trace.ts). Observations go by code only: their text quotes
 * research participants. The other records carry the title the designer gave them.
 */
export const TRACE_STAGES = ["observations", "insights", "pains", "opportunities", "flows", "screens", "decisions"] as const;
export type TraceStage = (typeof TRACE_STAGES)[number];

const node = z.object({ code: z.string().min(1).max(40), stage: z.enum(TRACE_STAGES), title: z.string().max(300).optional() });
export const caseTraceSchema = z.object({
  nodes: z.array(node).max(600),
  links: z.array(z.tuple([z.string(), z.string()])).max(3000),
});
export type TraceNode = z.infer<typeof node>;
export type CaseTrace = z.infer<typeof caseTraceSchema>;

/** The trace of a snapshot: links to unknown records are dropped; nothing to draw gives undefined. */
export function readTrace(value: unknown): CaseTrace | undefined {
  const parsed = caseTraceSchema.safeParse(value);
  if (!parsed.success) return undefined;
  const codes = new Set(parsed.data.nodes.map((n) => n.code));
  const links = parsed.data.links.filter(([a, b]) => a !== b && codes.has(a) && codes.has(b));
  return links.length ? { nodes: parsed.data.nodes, links } : undefined;
}

/**
 * What a record rests on and what it leads to: links are followed against the stage order (up: towards
 * observations) or along it (down: towards screens and decisions).
 */
export function traceChain(trace: CaseTrace, code: string): { up: Set<string>; down: Set<string> } {
  const rank = new Map(trace.nodes.map((n) => [n.code, TRACE_STAGES.indexOf(n.stage)]));
  const adj = new Map<string, string[]>();
  for (const [a, b] of trace.links) {
    adj.set(a, [...(adj.get(a) ?? []), b]);
    adj.set(b, [...(adj.get(b) ?? []), a]);
  }
  const walk = (up: boolean) => {
    const seen = new Set<string>();
    const stack = [code];
    while (stack.length) {
      const n = stack.pop()!;
      for (const m of adj.get(n) ?? []) {
        const next = up ? rank.get(m)! < rank.get(n)! : rank.get(m)! > rank.get(n)!;
        if (next && !seen.has(m)) { seen.add(m); stack.push(m); }
      }
    }
    return seen;
  };
  return { up: walk(true), down: walk(false) };
}
