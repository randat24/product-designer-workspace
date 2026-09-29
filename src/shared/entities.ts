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
  competitor:        { type: "competitor",        prefix: "CP",   label: "Конкурент",        labelPlural: "Конкуренты",        group: "structure",   segment: "competitors",           phase: 3 },
  research_plan:     { type: "research_plan",     prefix: "RP",   label: "План исследования", labelPlural: "Планы исследований", group: "research",   segment: "research/plans",        phase: 4 },
  participant:       { type: "participant",       prefix: "P",    label: "Участник",         labelPlural: "Участники",         group: "research",    segment: "research/participants", phase: 4 },
  interview:         { type: "interview",         prefix: "INT",  label: "Интервью",         labelPlural: "Интервью",          group: "research",    segment: "research/interviews",   phase: 4 },
  answer:            { type: "answer",            prefix: "ANS",  label: "Ответ",            labelPlural: "Ответы",            group: "research",    segment: "research/matrix",       phase: 4 },
  quote:             { type: "quote",             prefix: "Q",    label: "Цитата",           labelPlural: "Цитаты",            group: "research",    segment: "synthesis/quotes",      phase: 5 },
  observation:       { type: "observation",       prefix: "OBS",  label: "Наблюдение",       labelPlural: "Наблюдения",        group: "research",    segment: "synthesis/observations", phase: 5 },
  pattern:           { type: "pattern",           prefix: "PAT",  label: "Паттерн",          labelPlural: "Паттерны",          group: "synthesis",   segment: "synthesis",             phase: 5 },
  insight:           { type: "insight",           prefix: "INS",  label: "Инсайт",           labelPlural: "Инсайты",           group: "synthesis",   segment: "insights",              phase: 5 },
  pain_point:        { type: "pain_point",        prefix: "PP",   label: "Боль",             labelPlural: "Боли",              group: "problem",     segment: "pain-points",           phase: 5 },
  opportunity:       { type: "opportunity",       prefix: "OPP",  label: "Возможность",      labelPlural: "Возможности",       group: "opportunity", segment: "opportunities",         phase: 5 },
  user_need:         { type: "user_need",         prefix: "UN",   label: "Потребность",      labelPlural: "Потребности",       group: "problem",     segment: "problems",              phase: 6 },
  segment:           { type: "segment",           prefix: "SEG",  label: "Сегмент",          labelPlural: "Сегменты",          group: "research",    segment: "users",                 phase: 6 },
  jtbd:              { type: "jtbd",              prefix: "JTBD", label: "JTBD",             labelPlural: "JTBD",              group: "opportunity", segment: "jtbd",                  phase: 6 },
  problem_statement: { type: "problem_statement", prefix: "PS",   label: "Проблема",         labelPlural: "Проблемы",          group: "problem",     segment: "problems",              phase: 6 },
  hypothesis:        { type: "hypothesis",        prefix: "HYP",  label: "Гипотеза",         labelPlural: "Гипотезы",          group: "opportunity", segment: "hypotheses",            phase: 6 },
  requirement:       { type: "requirement",       prefix: "REQ",  label: "Требование",       labelPlural: "Требования",        group: "structure",   segment: "requirements",          phase: 6 },
  feature:           { type: "feature",           prefix: "FT",   label: "Функция",          labelPlural: "Функции",           group: "structure",   segment: "features",              phase: 6 },
  user_story:        { type: "user_story",        prefix: "US",   label: "User story",       labelPlural: "User stories",      group: "structure",   segment: "features",              phase: 6 },
  user_flow:         { type: "user_flow",         prefix: "FL",   label: "Сценарий",         labelPlural: "Сценарии",          group: "structure",   segment: "flows",                 phase: 7 },
  flow_node:         { type: "flow_node",         prefix: "N",    label: "Шаг сценария",     labelPlural: "Шаги",              group: "structure",   segment: "flows",                 phase: 7 },
  screen:            { type: "screen",            prefix: "SCR",  label: "Экран",            labelPlural: "Экраны",            group: "design",      segment: "screens",               phase: 8 },
  screen_state:      { type: "screen_state",      prefix: "ST",   label: "Состояние",        labelPlural: "Состояния",         group: "design",      segment: "screens",               phase: 8 },
  design_decision:   { type: "design_decision",   prefix: "DEC",  label: "Решение",          labelPlural: "Решения",           group: "decision",    segment: "decisions",             phase: 8 },
  component:         { type: "component",         prefix: "CMP",  label: "Компонент",        labelPlural: "Компоненты",        group: "design",      segment: "system/components",     phase: 9 },
  usability_test:    { type: "usability_test",    prefix: "UT",   label: "Юзабилити-тест",   labelPlural: "Юзабилити-тесты",   group: "decision",    segment: "tests",                 phase: 10 },
  test_finding:      { type: "test_finding",      prefix: "F",    label: "Находка теста",    labelPlural: "Находки",           group: "decision",    segment: "findings",              phase: 10 },
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
