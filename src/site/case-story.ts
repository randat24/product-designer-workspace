// Case study story: the published shape of a project from the tool.
// Every block mirrors a stage of the tool's chain (research → insights → competitors →
// opportunities → flow → screens → decisions → results), so publishing a project later is
// a snapshot of its data into this shape. All blocks except the overview are optional.

export type Stage = "research" | "synthesis" | "competitors" | "opportunities" | "flows" | "screens" | "decisions";

/** Entity colours of the tool, so the site speaks the same visual language. */
export const STAGE_COLOR: Record<Stage, string> = {
  research: "var(--entity-research)",
  synthesis: "var(--entity-synthesis)",
  competitors: "var(--entity-problem)",
  opportunities: "var(--entity-opportunity)",
  flows: "var(--entity-structure)",
  screens: "var(--entity-design)",
  decisions: "var(--entity-decision)",
};

export type Fact = { value: string; label: string };
export type Quote = { text: string; who: string };
export type Mark = "yes" | "partial" | "no";

export type CaseStory = {
  meta: { label: string; value: string }[];
  overview: { challenge: string; solution: string; outcome: string };
  process: { stage: Stage; value: string; label: string }[];
  research?: { intro: string; facts: Fact[]; quotes: Quote[] };
  insights?: { code: string; title: string; body: string; evidence: string }[];
  competitors?: {
    intro: string;
    /** First product is ours. */
    products: string[];
    rows: { feature: string; marks: Mark[] }[];
  };
  opportunities?: { code: string; text: string }[];
  flow?: {
    intro: string;
    steps: { kind: "start" | "screen" | "action" | "end"; label: string }[];
    edgeCases: string[];
  };
  screens?: { intro: string; items: { title: string; caption: string; states: string[] }[] };
  decisions?: { code: string; title: string; why: string; rejected: string[]; evidence: string[] }[];
  results?: { intro: string; metrics: Fact[]; quote?: Quote };
};

/** Section headings and small labels of the story page. */
export type StoryLabels = {
  sample: string;
  contents: string;
  overview: string;
  challenge: string;
  solution: string;
  outcome: string;
  process: string;
  research: string;
  insights: string;
  competitors: string;
  opportunities: string;
  flow: string;
  edgeCases: string;
  screens: string;
  decisions: string;
  why: string;
  rejected: string;
  evidence: string;
  results: string;
  marks: Record<Mark, string>;
  redHint: string;
};
