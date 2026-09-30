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
