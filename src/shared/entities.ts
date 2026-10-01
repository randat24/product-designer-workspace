// Entity registry — mirrors public.entity_types. One place that knows, for every
// traceable type: code prefix, label, colour group, route and the phase it ships in.
// Used by the Trace panel, command palette, mentions, search and (later) AI context.

export type EntityGroup = "research" | "synthesis" | "problem" | "opportunity" | "structure" | "design" | "decision";

export type EntityDef = {
  type: string;
  prefix: string;
  label: string;
  labelPlural: string;
  group: EntityGroup;
  /** Route segment under /w/[ws]/p/[project]/ */
  segment: string;
  phase: number;
};

export const ENTITIES = {
  competitor:        { type: "competitor",        prefix: "CP",   label: "Конкурент",        labelPlural: "Конкуренти",        group: "structure",   segment: "competitors",           phase: 3 },
  research_plan:     { type: "research_plan",     prefix: "RP",   label: "План дослідження", labelPlural: "Плани досліджень", group: "research",   segment: "research/plans",        phase: 4 },
  participant:       { type: "participant",       prefix: "P",    label: "Учасник",         labelPlural: "Учасники",         group: "research",    segment: "research/participants", phase: 4 },
  interview:         { type: "interview",         prefix: "INT",  label: "Інтерв'ю",         labelPlural: "Інтерв'ю",          group: "research",    segment: "research/interviews",   phase: 4 },
  answer:            { type: "answer",            prefix: "ANS",  label: "Відповідь",            labelPlural: "Відповіді",            group: "research",    segment: "research/matrix",       phase: 4 },
  quote:             { type: "quote",             prefix: "Q",    label: "Цитата",           labelPlural: "Цитати",            group: "research",    segment: "synthesis/quotes",      phase: 5 },
  observation:       { type: "observation",       prefix: "OBS",  label: "Спостереження",       labelPlural: "Спостереження",        group: "research",    segment: "synthesis/observations", phase: 5 },
  pattern:           { type: "pattern",           prefix: "PAT",  label: "Патерн",          labelPlural: "Патерни",          group: "synthesis",   segment: "synthesis",             phase: 5 },
  insight:           { type: "insight",           prefix: "INS",  label: "Інсайт",           labelPlural: "Інсайти",           group: "synthesis",   segment: "insights",              phase: 5 },
  pain_point:        { type: "pain_point",        prefix: "PP",   label: "Біль",             labelPlural: "Болі",              group: "problem",     segment: "pain-points",           phase: 5 },
  opportunity:       { type: "opportunity",       prefix: "OPP",  label: "Можливість",      labelPlural: "Можливості",       group: "opportunity", segment: "opportunities",         phase: 5 },
  user_need:         { type: "user_need",         prefix: "UN",   label: "Потреба",      labelPlural: "Потреби",       group: "problem",     segment: "problems",              phase: 6 },
  segment:           { type: "segment",           prefix: "SEG",  label: "Сегмент",          labelPlural: "Сегменти",          group: "research",    segment: "users",                 phase: 6 },
  jtbd:              { type: "jtbd",              prefix: "JTBD", label: "JTBD",             labelPlural: "JTBD",              group: "opportunity", segment: "jtbd",                  phase: 6 },
  problem_statement: { type: "problem_statement", prefix: "PS",   label: "Проблема",         labelPlural: "Проблеми",          group: "problem",     segment: "problems",              phase: 6 },
  hypothesis:        { type: "hypothesis",        prefix: "HYP",  label: "Гіпотеза",         labelPlural: "Гіпотези",          group: "opportunity", segment: "hypotheses",            phase: 6 },
  requirement:       { type: "requirement",       prefix: "REQ",  label: "Вимога",       labelPlural: "Вимоги",        group: "structure",   segment: "requirements",          phase: 6 },
  feature:           { type: "feature",           prefix: "FT",   label: "Функція",          labelPlural: "Функції",           group: "structure",   segment: "features",              phase: 6 },
  user_story:        { type: "user_story",        prefix: "US",   label: "User story",       labelPlural: "User stories",      group: "structure",   segment: "features",              phase: 6 },
  user_flow:         { type: "user_flow",         prefix: "FL",   label: "Сценарій",         labelPlural: "Сценарії",          group: "structure",   segment: "flows",                 phase: 7 },
  flow_node:         { type: "flow_node",         prefix: "N",    label: "Крок сценарію",     labelPlural: "Кроки",              group: "structure",   segment: "flows",                 phase: 7 },
  screen:            { type: "screen",            prefix: "SCR",  label: "Екран",            labelPlural: "Екрани",            group: "design",      segment: "screens",               phase: 8 },
  screen_state:      { type: "screen_state",      prefix: "ST",   label: "Стан",        labelPlural: "Стани",         group: "design",      segment: "screens",               phase: 8 },
  design_decision:   { type: "design_decision",   prefix: "DEC",  label: "Рішення",          labelPlural: "Рішення",           group: "decision",    segment: "decisions",             phase: 8 },
  component:         { type: "component",         prefix: "CMP",  label: "Компонент",        labelPlural: "Компоненти",        group: "design",      segment: "system/components",     phase: 9 },
  usability_test:    { type: "usability_test",    prefix: "UT",   label: "Юзабіліті-тест",   labelPlural: "Юзабіліті-тести",   group: "decision",    segment: "tests",                 phase: 10 },
  test_finding:      { type: "test_finding",      prefix: "F",    label: "Знахідка тесту",    labelPlural: "Знахідки",           group: "decision",    segment: "findings",              phase: 10 },
} as const satisfies Record<string, EntityDef>;

export type EntityType = keyof typeof ENTITIES;

export const isEntityType = (t: string): t is EntityType => t in ENTITIES;

export const GROUP_COLOR: Record<EntityGroup, string> = {
  research: "var(--entity-research)",
  synthesis: "var(--entity-synthesis)",
  problem: "var(--entity-problem)",
  opportunity: "var(--entity-opportunity)",
  structure: "var(--entity-structure)",
  design: "var(--entity-design)",
  decision: "var(--entity-decision)",
};
