import { z } from "zod";

/**
 * How much of the work behind a case is written down in the designer's workbook: the number of records of each
 * stage, counted when the case is published (src/domains/cases/process.ts) and kept in the snapshot as
 * `process`. It is the size of the documented work, not a score.
 */
export const PROCESS_STAGES = [
  { key: "competitors", color: "var(--entity-research)", card: true },
  { key: "research", color: "var(--entity-research)", card: false },
  { key: "observations", color: "var(--entity-research)", card: false },
  { key: "insights", color: "var(--entity-synthesis)", card: true },
  { key: "pains", color: "var(--entity-problem)", card: false },
  { key: "opportunities", color: "var(--entity-opportunity)", card: false },
  { key: "flows", color: "var(--entity-structure)", card: true },
  { key: "screens", color: "var(--entity-design)", card: true },
  { key: "decisions", color: "var(--entity-decision)", card: true },
] as const;

export type ProcessStage = (typeof PROCESS_STAGES)[number]["key"];
export type CaseProcess = Record<ProcessStage, number>;

const count = z.number().int().min(0).max(100_000);
export const caseProcessSchema = z.object(
  Object.fromEntries(PROCESS_STAGES.map((s) => [s.key, count])) as Record<ProcessStage, typeof count>,
);

/** The process of a snapshot, or undefined when it has none (published before counting existed) or it is all zeros. */
export function readProcess(value: unknown): CaseProcess | undefined {
  const parsed = caseProcessSchema.safeParse(value);
  if (!parsed.success) return undefined;
  return Object.values(parsed.data).some((n) => n > 0) ? parsed.data : undefined;
}
