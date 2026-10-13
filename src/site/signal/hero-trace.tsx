import Link from "next/link";
import type { CSSProperties } from "react";
import { PROCESS_STAGES, type ProcessStage } from "@/site/case-process";
import type { CaseStory } from "@/site/case-story";
import { workspaceEn, workspaceUk } from "@/site/cases/designer-workspace";
import type { Locale } from "@/site/content";

/** The case the chain is taken from, and the records that make it: DEC-001 rests on INS-002 and OPP-02. */
const CASE_SLUG = "designer-workspace";
const PICK = { insight: "INS-002", opportunity: "OPP-02", screen: 2, decision: "DEC-001" } as const;

const COPY = {
  uk: {
    label: "[ слід рішень ]",
    stages: { insights: "Інсайт", opportunities: "Можливість", screens: "Екран", decisions: "Рішення" },
    lead: "Кожна лінія має причину.",
    source: "Ланцюжок з кейсу «Робочий простір дизайнера»",
    open: "Відкрити кейс",
  },
  en: {
    label: "[ decision trail ]",
    stages: { insights: "Insight", opportunities: "Opportunity", screens: "Screen", decisions: "Decision" },
    lead: "Every line has a reason.",
    source: "A chain from the “Product designer workspace” case",
    open: "Open the case",
  },
} as const;

const STORY: Record<Locale, CaseStory> = { uk: workspaceUk, en: workspaceEn };
const COLOR = Object.fromEntries(PROCESS_STAGES.map((s) => [s.key, s.color])) as Record<ProcessStage, string>;

type Node = { stage: "insights" | "opportunities" | "screens" | "decisions"; code?: string; title: string };

/** The chain from the case story; a record that went missing fails the build instead of shipping a gap. */
function chain(locale: Locale): Node[] {
  const s = STORY[locale];
  const found = <T,>(value: T | undefined, what: string): T => {
    if (value === undefined) throw new Error(`hero trace: ${what} is not in the ${CASE_SLUG} case (${locale})`);
    return value;
  };
  const insight = found(s.insights?.find((r) => r.code === PICK.insight), PICK.insight);
  const opportunity = found(s.opportunities?.find((r) => r.code === PICK.opportunity), PICK.opportunity);
  const screen = found(s.screens?.items[PICK.screen], `screen #${PICK.screen}`);
  const decision = found(s.decisions?.find((r) => r.code === PICK.decision), PICK.decision);
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
export function HeroTrace({ locale }: { locale: Locale }) {
  const c = COPY[locale];
  const nodes = chain(locale);
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
        <span className="sg-trace-source">{c.source}</span>
        <Link href={`/${locale}/cases/${CASE_SLUG}`} className="sg-link">{c.open} →</Link>
      </figcaption>
    </figure>
  );
}
