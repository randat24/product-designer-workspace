import { z } from "zod";
import type { Enums } from "@/types/database";
import { t } from "@/shared/i18n/ru";

const f = t.flows;

export type NodeKind = Enums<"flow_node_kind">;
export type Branch = Enums<"flow_edge_branch">;
export type EdgeCaseKind = Enums<"edge_case_kind">;
export type EdgeCaseStatus = Enums<"edge_case_status">;
export type FlowStatus = Enums<"flow_status">;

/** Node kinds in palette order, with their shape and accent (docs/DESIGN-SYSTEM.md FlowCanvas). */
export const NODE_KINDS: { value: NodeKind; shape: "pill" | "card" | "diamond"; color: string }[] = [
  { value: "start", shape: "pill", color: "var(--fg)" },
  { value: "screen", shape: "card", color: "var(--entity-design)" },
  { value: "action", shape: "card", color: "var(--entity-research)" },
  { value: "decision", shape: "diamond", color: "var(--entity-opportunity)" },
  { value: "system", shape: "card", color: "var(--entity-decision)" },
  { value: "error", shape: "card", color: "var(--danger)" },
  { value: "success", shape: "pill", color: "var(--success)" },
  { value: "end", shape: "pill", color: "var(--fg-secondary)" },
];
export const nodeKind = (k: string) => NODE_KINDS.find((n) => n.value === k) ?? NODE_KINDS[2]!;

export const BRANCHES: { value: Branch; color: string }[] = [
  { value: "default", color: "var(--fg-secondary)" },
  { value: "yes", color: "var(--success)" },
  { value: "no", color: "var(--warning)" },
  { value: "error", color: "var(--danger)" },
  { value: "back", color: "var(--entity-structure)" },
];
export const branchColor = (b: string) => BRANCHES.find((x) => x.value === b)?.color ?? "var(--fg-secondary)";

export const FLOW_STATUSES = (Object.keys(f.statuses) as FlowStatus[]).map((value) => ({ value, label: f.statuses[value] }));
export const EDGE_CASE_STATUSES = (Object.keys(f.edgeCases.statuses) as EdgeCaseStatus[]).map((value) => ({ value, label: f.edgeCases.statuses[value] }));

const text = (max: number) => z.string().trim().max(max).nullish().transform((v) => v || null);

export const flowMetaSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: text(5000),
  status: z.enum(["draft", "review", "final"]),
});
export type FlowMeta = z.infer<typeof flowMetaSchema>;
