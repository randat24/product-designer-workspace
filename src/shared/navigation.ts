// Project navigation (docs/IA.md §1). Items outside the MVP are hidden until their phase ships.

export const CURRENT_PHASE = 8;

export type NavItem = { segment: string; label: string; phase: number; mvp: boolean };
export type NavGroup = { title: string; items: NavItem[] };

export const PROJECT_NAV: NavGroup[] = [
  { title: "Проєкт", items: [{ segment: "", label: "Огляд", phase: 1, mvp: true }] },
  {
    title: "Дослідження",
    items: [
      { segment: "brief", label: "Бриф", phase: 2, mvp: true },
      { segment: "competitors", label: "Конкуренти", phase: 3, mvp: true },
      { segment: "research", label: "Дослідження", phase: 4, mvp: true },
      { segment: "research/participants", label: "Учасники", phase: 4, mvp: true },
      { segment: "research/matrix", label: "Матриця відповідей", phase: 4, mvp: true },
    ],
  },
  {
    title: "Визначення",
    items: [
      { segment: "synthesis", label: "Синтез", phase: 5, mvp: true },
      { segment: "insights", label: "Інсайти", phase: 5, mvp: true },
      { segment: "pain-points", label: "Болі", phase: 5, mvp: true },
      { segment: "opportunities", label: "Можливості", phase: 5, mvp: true },
      { segment: "users", label: "Сегменти", phase: 6, mvp: false },
      { segment: "jtbd", label: "JTBD", phase: 6, mvp: false },
      { segment: "hypotheses", label: "Гіпотези", phase: 6, mvp: false },
    ],
  },
  {
    title: "Структура",
    items: [
      { segment: "requirements", label: "Вимоги", phase: 6, mvp: false },
      { segment: "features", label: "Функції", phase: 6, mvp: false },
      { segment: "ia", label: "Інформаційна архітектура", phase: 7, mvp: false },
      { segment: "flows", label: "Сценарії", phase: 7, mvp: true },
    ],
  },
  {
    title: "Дизайн",
    items: [
      { segment: "screens", label: "Екрани", phase: 8, mvp: true },
      { segment: "ui", label: "UI-основи", phase: 8, mvp: false },
    ],
  },
  {
    title: "Система",
    items: [
      { segment: "system/tokens", label: "Токени", phase: 9, mvp: false },
      { segment: "system/components", label: "Компоненти", phase: 9, mvp: false },
      { segment: "system/motion", label: "Анімації", phase: 9, mvp: false },
      { segment: "system/responsive", label: "Адаптивність", phase: 9, mvp: false },
    ],
  },
  {
    title: "Перевірка",
    items: [
      { segment: "tests", label: "Юзабіліті-тести", phase: 10, mvp: false },
      { segment: "findings", label: "Знахідки", phase: 10, mvp: false },
    ],
  },
  {
    title: "Передача",
    items: [
      { segment: "decisions", label: "Журнал рішень", phase: 8, mvp: true },
      { segment: "handoff", label: "Handoff", phase: 11, mvp: false },
    ],
  },
];

export const SHOW_POST_MVP = process.env.NEXT_PUBLIC_SHOW_POST_MVP === "1";

export function visibleNav(): NavGroup[] {
  return PROJECT_NAV.map((g) => ({ ...g, items: g.items.filter((i) => i.mvp || SHOW_POST_MVP) })).filter(
    (g) => g.items.length > 0,
  );
}

export function findNavItem(segment: string): NavItem | undefined {
  return PROJECT_NAV.flatMap((g) => g.items).find((i) => i.segment === segment);
}
