import Link from "next/link";
import type { CSSProperties } from "react";
import { PROCESS_STAGES, type ProcessStage } from "@/site/case-process";
import type { Case, Locale } from "@/site/content";

/** The case the chain is taken from, and the records that make it: DEC-001 rests on INS-002 and OPP-02. */
export const HERO_TRACE_CASE = "designer-workspace";
const PICK = { insight: "INS-002", opportunity: "OPP-02", screen: 2, decision: "DEC-001" } as const;

const COPY = {
  uk: {
    label: "[ слід рішень ]",
    stages: { insights: "Інсайт", opportunities: "Можливість", screens: "Екран", decisions: "Рішення" },
    lead: "Кожна лінія має причину.",
    source: (title: string) => `Ланцюжок з кейсу «${title}»`,
    open: "Відкрити кейс",
  },
  en: {
    label: "[ decision trail ]",
    stages: { insights: "Insight", opportunities: "Opportunity", screens: "Screen", decisions: "Decision" },
    lead: "Every line has a reason.",
    source: (title: string) => `A chain from the “${title}” case`,
    open: "Open the case",
  },
} as const;

const COLOR = Object.fromEntries(PROCESS_STAGES.map((s) => [s.key, s.color])) as Record<ProcessStage, string>;

type Node = { stage: "insights" | "opportunities" | "screens" | "decisions"; code?: string; title: string };

/**
 * The chain from the published case (the database in production, the built-in list offline). When the case is not
 * published or a record is gone, there is no chain: the hero shows its copy alone rather than records the live case
 * does not have, or a link to a missing page.
 */
function chain(item: Case | undefined): Node[] | null {
  const s = item?.story;
  const insight = s?.insights?.find((r) => r.code === PICK.insight);
  const opportunity = s?.opportunities?.find((r) => r.code === PICK.opportunity);
  const screen = s?.screens?.items[PICK.screen];
  const decision = s?.decisions?.find((r) => r.code === PICK.decision);
  if (!insight || !opportunity || !screen || !decision) return null;
  return [
    { stage: "insights", code: insight.code, title: insight.title },
    { stage: "opportunities", code: opportunity.code, title: opportunity.text },
    { stage: "screens", title: screen.title },
    { stage: "decisions", code: decision.code, title: decision.title },
  ];
}

/**
 * The first screen's drawing: one real chain from a case, insight → opportunity → screen → decision, so the visitor
 * sees how the work is done before reading about it. CSS draws the line and the signal running down it
 * (src/site/signal/signal.css, «hero trace»); a short stage folds it into a row of codes.
 */
export function HeroTrace({ locale, item }: { locale: Locale; item: Case | undefined }) {
  const c = COPY[locale];
  const nodes = chain(item);
  if (!nodes || !item) return null;
  return (
    <figure className="sg-trace" aria-labelledby="hero-trace-caption">
      <span className="sg-trace-label" aria-hidden="true">{c.label.toUpperCase()}</span>
      <ol className="sg-trace-list">
        {nodes.map((n) => (
          <li key={n.stage} className="sg-trace-node" data-stage={n.stage} style={{ "--stage": COLOR[n.stage] } as CSSProperties}>
            <span className="sg-trace-meta">
              <span className="sg-trace-stage">{c.stages[n.stage]}</span>
              {n.code && <span className="sg-trace-code">{n.code}</span>}
            </span>
            <span className="sg-trace-title">{n.title}</span>
          </li>
        ))}
      </ol>
      <figcaption className="sg-trace-caption" id="hero-trace-caption">
        <strong>{c.lead}</strong>
        <span className="sg-trace-source">{c.source(item.title)}</span>
        <Link href={`/${locale}/cases/${HERO_TRACE_CASE}`} className="sg-link">{c.open} →</Link>
      </figcaption>
    </figure>
  );
}
