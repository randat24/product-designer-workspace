// Project navigation (docs/IA.md §1). Items outside the MVP are hidden until their phase ships.

export const CURRENT_PHASE = 4;

export type NavItem = { segment: string; label: string; phase: number; mvp: boolean };
export type NavGroup = { title: string; items: NavItem[] };

export const PROJECT_NAV: NavGroup[] = [
  { title: "Проект", items: [{ segment: "", label: "Обзор", phase: 1, mvp: true }] },
  {
    title: "Исследование",
    items: [
      { segment: "brief", label: "Бриф", phase: 2, mvp: true },
      { segment: "competitors", label: "Конкуренты", phase: 3, mvp: true },
      { segment: "research", label: "Исследования", phase: 4, mvp: true },
      { segment: "research/participants", label: "Участники", phase: 4, mvp: true },
      { segment: "research/matrix", label: "Матрица ответов", phase: 4, mvp: true },
    ],
  },
  {
    title: "Определение",
    items: [
      { segment: "synthesis", label: "Синтез", phase: 5, mvp: true },
      { segment: "insights", label: "Инсайты", phase: 5, mvp: true },
      { segment: "pain-points", label: "Боли", phase: 5, mvp: true },
      { segment: "opportunities", label: "Возможности", phase: 5, mvp: true },
      { segment: "users", label: "Сегменты", phase: 6, mvp: false },
      { segment: "jtbd", label: "JTBD", phase: 6, mvp: false },
      { segment: "hypotheses", label: "Гипотезы", phase: 6, mvp: false },
    ],
  },
  {
    title: "Структура",
    items: [
      { segment: "requirements", label: "Требования", phase: 6, mvp: false },
      { segment: "features", label: "Функции", phase: 6, mvp: false },
      { segment: "ia", label: "Информационная архитектура", phase: 7, mvp: false },
      { segment: "flows", label: "Сценарии", phase: 7, mvp: true },
    ],
  },
  {
    title: "Дизайн",
    items: [
      { segment: "screens", label: "Экраны", phase: 8, mvp: true },
      { segment: "ui", label: "UI-основы", phase: 8, mvp: false },
    ],
  },
  {
    title: "Система",
    items: [
      { segment: "system/tokens", label: "Токены", phase: 9, mvp: false },
      { segment: "system/components", label: "Компоненты", phase: 9, mvp: false },
      { segment: "system/motion", label: "Анимации", phase: 9, mvp: false },
      { segment: "system/responsive", label: "Адаптивность", phase: 9, mvp: false },
    ],
  },
  {
    title: "Проверка",
    items: [
      { segment: "tests", label: "Юзабилити-тесты", phase: 10, mvp: false },
      { segment: "findings", label: "Находки", phase: 10, mvp: false },
    ],
  },
  {
    title: "Передача",
    items: [
      { segment: "decisions", label: "Журнал решений", phase: 8, mvp: true },
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
