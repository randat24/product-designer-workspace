import { COMPETITORS_TARGET } from "@/domains/competitors/schema";
import { RESEARCH_TARGET_DEFAULT } from "@/domains/research/schema";

/** Done / total of one stage. */
export type Ratio = { done: number; total: number };

/**
 * What the stage progress in the navigation rail is computed from — counts only, so they can come
 * from lists today and from one database query later (docs/QUALITY_REVIEW.md, A4).
 */
export type ProgressCounts = {
  brief: Ratio;
  competitorsAssessed: number;
  research: { conducted: number; target: number | null };
  /** Board cards sorted into a pattern. */
  synthesis: Ratio;
  /** Insights and pain points with at least one source. */
  insights: Ratio;
  painPoints: Ratio;
  opportunities: number;
  /** Flows without unconsidered edge cases. */
  flows: Ratio;
  /** Screens with all key states designed. */
  screens: Ratio;
  /** Decisions with evidence. */
  decisions: Ratio;
};

const pct = ({ done, total }: Ratio) => (total ? Math.round((done / total) * 100) : 0);
const capped = (done: number, target: number) => Math.round(Math.min(done / target, 1) * 100);

/** Percent per navigation segment (goal-gradient, docs/UX_LAWS.md UX-22). */
export function stageProgress(c: ProgressCounts): Record<string, number> {
  return {
    brief: pct(c.brief),
    competitors: capped(c.competitorsAssessed, COMPETITORS_TARGET),
    research: capped(c.research.conducted, c.research.target || RESEARCH_TARGET_DEFAULT),
    synthesis: pct(c.synthesis),
    insights: pct(c.insights),
    "pain-points": pct(c.painPoints),
    opportunities: c.opportunities ? 100 : 0,
    flows: pct(c.flows),
    screens: pct(c.screens),
    decisions: pct(c.decisions),
  };
}

/** The row of the database function project_stage_counts (migration 015). */
export type StageCountsRow = Partial<Record<
  | "competitors_assessed" | "interviews_conducted" | "research_target" | "cards_total" | "cards_sorted"
  | "insights_total" | "insights_sourced" | "pain_points_total" | "pain_points_sourced" | "opportunities"
  | "flows_total" | "flows_complete" | "screens_total" | "screens_complete" | "decisions_total" | "decisions_evidenced",
  number | null
>>;

/** Maps the database counts (plus the brief, computed in TypeScript) to ProgressCounts. */
export function countsFromRow(row: StageCountsRow, brief: Ratio): ProgressCounts {
  const n = (k: keyof StageCountsRow) => Number(row[k] ?? 0);
  return {
    brief,
    competitorsAssessed: n("competitors_assessed"),
    research: { conducted: n("interviews_conducted"), target: row.research_target ?? null },
    synthesis: { done: n("cards_sorted"), total: n("cards_total") },
    insights: { done: n("insights_sourced"), total: n("insights_total") },
    painPoints: { done: n("pain_points_sourced"), total: n("pain_points_total") },
    opportunities: n("opportunities"),
    flows: { done: n("flows_complete"), total: n("flows_total") },
    screens: { done: n("screens_complete"), total: n("screens_total") },
    decisions: { done: n("decisions_evidenced"), total: n("decisions_total") },
  };
}
