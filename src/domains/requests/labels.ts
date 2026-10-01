// Labels of the answer options: uk/en for the public form and the PDF, ru for the workspace.
// A key missing here (removed from the config later) falls back to the key itself.

import type { Currency } from "./config";

export type LabelLocale = "uk" | "en" | "ru";
type Map = Record<string, string>;

const T: Record<string, Record<LabelLocale, Map>> = {
  types: {
    uk: {
      new_product: "Новий продукт", redesign: "Редизайн", website: "Вебсайт", landing_page: "Лендинг",
      web_app: "Вебзастосунок", mobile_app: "Мобільний застосунок", saas: "SaaS", ux_audit: "UX-аудит",
      ui_audit: "UI-аудит", design_system: "Дизайн-система", prototype_mvp: "Прототип / MVP", other: "Інше",
    },
    en: {
      new_product: "New product", redesign: "Redesign", website: "Website", landing_page: "Landing page",
      web_app: "Web application", mobile_app: "Mobile application", saas: "SaaS", ux_audit: "UX audit",
      ui_audit: "UI audit", design_system: "Design system", prototype_mvp: "Prototype / MVP", other: "Other",
    },
    ru: {
      new_product: "Новый продукт", redesign: "Редизайн", website: "Сайт", landing_page: "Лендинг",
      web_app: "Веб-приложение", mobile_app: "Мобильное приложение", saas: "SaaS", ux_audit: "UX-аудит",
      ui_audit: "UI-аудит", design_system: "Дизайн-система", prototype_mvp: "Прототип / MVP", other: "Другое",
    },
  },
  goals: {
    uk: {
      increase_conversion: "Підвищити конверсію", improve_usability: "Зробити зручнішим", modernize_visual: "Оновити візуальний стиль",
      launch_mvp: "Запустити MVP", from_scratch: "Створити продукт з нуля", improve_mobile: "Покращити мобільну версію",
      simplify_flows: "Спростити сценарії", build_design_system: "Створити дизайн-систему", prepare_for_dev: "Підготувати до розробки",
      improve_ux: "Покращити чинний UX", other: "Інше",
    },
    en: {
      increase_conversion: "Increase conversion", improve_usability: "Improve usability", modernize_visual: "Modernise the visual design",
      launch_mvp: "Launch an MVP", from_scratch: "Build a product from scratch", improve_mobile: "Improve the mobile experience",
      simplify_flows: "Simplify user flows", build_design_system: "Build a design system", prepare_for_dev: "Prepare for development",
      improve_ux: "Improve the existing UX", other: "Other",
    },
    ru: {
      increase_conversion: "Поднять конверсию", improve_usability: "Сделать удобнее", modernize_visual: "Обновить визуальный стиль",
      launch_mvp: "Запустить MVP", from_scratch: "Создать продукт с нуля", improve_mobile: "Улучшить мобильную версию",
      simplify_flows: "Упростить сценарии", build_design_system: "Создать дизайн-систему", prepare_for_dev: "Подготовить к разработке",
      improve_ux: "Улучшить текущий UX", other: "Другое",
    },
  },
  markets: {
    uk: { b2b: "B2B — для бізнесу", b2c: "B2C — для людей", b2b2c: "B2B2C — і те, і те", internal: "Внутрішній продукт", unknown: "Ще не знаю" },
    en: { b2b: "B2B — for businesses", b2c: "B2C — for consumers", b2b2c: "B2B2C — both", internal: "Internal product", unknown: "Not sure yet" },
    ru: { b2b: "B2B", b2c: "B2C", b2b2c: "B2B2C", internal: "Внутренний продукт", unknown: "Не знает" },
  },
  scope: {
    uk: {
      ux_research: "UX-дослідження", competitor_analysis: "Аналіз конкурентів", information_architecture: "Інформаційна архітектура",
      user_flow: "Сценарії користувача", wireframes: "Вайрфрейми", ux_design: "UX-дизайн", ui_design: "UI-дизайн",
      prototype: "Прототип", mobile_design: "Мобільний дизайн", responsive_web: "Адаптивний вебдизайн", design_system: "Дизайн-система",
      ui_kit: "UI Kit", dev_handoff: "Передача в розробку", usability_testing: "Юзабіліті-тестування", ux_audit: "UX-аудит",
      design_review: "Рев'ю чинного дизайну",
    },
    en: {
      ux_research: "UX research", competitor_analysis: "Competitor analysis", information_architecture: "Information architecture",
      user_flow: "User flows", wireframes: "Wireframes", ux_design: "UX design", ui_design: "UI design",
      prototype: "Prototype", mobile_design: "Mobile design", responsive_web: "Responsive web design", design_system: "Design system",
      ui_kit: "UI kit", dev_handoff: "Developer handoff", usability_testing: "Usability testing", ux_audit: "UX audit",
      design_review: "Existing design review",
    },
    ru: {
      ux_research: "UX-исследование", competitor_analysis: "Анализ конкурентов", information_architecture: "Информационная архитектура",
      user_flow: "Сценарии", wireframes: "Вайрфреймы", ux_design: "UX-дизайн", ui_design: "UI-дизайн",
      prototype: "Прототип", mobile_design: "Мобильный дизайн", responsive_web: "Адаптивный веб", design_system: "Дизайн-система",
      ui_kit: "UI Kit", dev_handoff: "Передача в разработку", usability_testing: "Юзабилити-тестирование", ux_audit: "UX-аудит",
      design_review: "Ревью текущего дизайна",
    },
  },
  materials: {
    uk: {
      idea_only: "Лише ідея", requirements: "Вимоги", tech_spec: "Технічне завдання", brand_identity: "Фірмовий стиль", logo: "Логотип",
      existing_website: "Чинний сайт", existing_app: "Чинний застосунок", wireframes: "Вайрфрейми", design: "Дизайн", figma: "Файли Figma",
      analytics: "Аналітика", user_research: "Дослідження користувачів", customer_feedback: "Відгуки клієнтів", existing_code: "Код",
      nothing: "Поки нічого",
    },
    en: {
      idea_only: "Just an idea", requirements: "Requirements", tech_spec: "Technical specification", brand_identity: "Brand identity", logo: "Logo",
      existing_website: "Existing website", existing_app: "Existing app", wireframes: "Wireframes", design: "Design", figma: "Figma files",
      analytics: "Analytics", user_research: "User research", customer_feedback: "Customer feedback", existing_code: "Code",
      nothing: "Nothing yet",
    },
    ru: {
      idea_only: "Только идея", requirements: "Требования", tech_spec: "ТЗ", brand_identity: "Фирменный стиль", logo: "Логотип",
      existing_website: "Текущий сайт", existing_app: "Текущее приложение", wireframes: "Вайрфреймы", design: "Дизайн", figma: "Figma",
      analytics: "Аналитика", user_research: "Исследования", customer_feedback: "Отзывы клиентов", existing_code: "Код",
      nothing: "Ничего",
    },
  },
  linkKinds: {
    uk: { website: "Сайт", app_store: "App Store", google_play: "Google Play", figma: "Figma", behance: "Behance", dribbble: "Dribbble", google_drive: "Google Drive", dropbox: "Dropbox", notion: "Notion", other: "Інше" },
    en: { website: "Website", app_store: "App Store", google_play: "Google Play", figma: "Figma", behance: "Behance", dribbble: "Dribbble", google_drive: "Google Drive", dropbox: "Dropbox", notion: "Notion", other: "Other" },
    ru: { website: "Сайт", app_store: "App Store", google_play: "Google Play", figma: "Figma", behance: "Behance", dribbble: "Dribbble", google_drive: "Google Drive", dropbox: "Dropbox", notion: "Notion", other: "Другое" },
  },
  channels: {
    uk: { email: "Email", telegram: "Telegram", phone: "Телефон", other: "Інше" },
    en: { email: "Email", telegram: "Telegram", phone: "Phone", other: "Other" },
    ru: { email: "Email", telegram: "Telegram", phone: "Телефон", other: "Другое" },
  },
  start: {
    uk: { asap: "Якнайшвидше", two_weeks: "Протягом 2 тижнів", month: "Протягом місяця", one_three_months: "За 1–3 місяці", later: "Пізніше", undecided: "Ще не вирішили" },
    en: { asap: "As soon as possible", two_weeks: "Within 2 weeks", month: "Within a month", one_three_months: "In 1–3 months", later: "Later", undecided: "Not decided" },
    ru: { asap: "Как можно скорее", two_weeks: "В течение 2 недель", month: "В течение месяца", one_three_months: "Через 1–3 месяца", later: "Позже", undecided: "Не решили" },
  },
  deadlineReasons: {
    uk: { launch: "Запуск продукту", investors: "Презентація інвесторам", dev_schedule: "Графік розробки", marketing: "Маркетингова кампанія", internal: "Внутрішній дедлайн" },
    en: { launch: "Product launch", investors: "Investor presentation", dev_schedule: "Development schedule", marketing: "Marketing campaign", internal: "Internal deadline" },
    ru: { launch: "Запуск продукта", investors: "Презентация инвесторам", dev_schedule: "График разработки", marketing: "Маркетинговая кампания", internal: "Внутренний дедлайн" },
  },
  budgetSpecial: {
    uk: { undecided: "Ще не визначився", estimate: "Потрібна оцінка", custom: "Своя сума" },
    en: { undecided: "Not decided yet", estimate: "I need an estimate", custom: "Custom amount" },
    ru: { undecided: "Не определился", estimate: "Нужна оценка", custom: "Своя сумма" },
  },
};

export type LabelGroup = keyof typeof T;

export function label(group: LabelGroup, key: string | null | undefined, locale: LabelLocale): string {
  if (!key) return "";
  return T[group]?.[locale]?.[key] ?? key;
}
export const labels = (group: LabelGroup, keys: readonly string[] | null | undefined, locale: LabelLocale) =>
  (keys ?? []).map((k) => label(group, k, locale));

const SYMBOL: Record<Currency, string> = { USD: "$", EUR: "€", UAH: "₴" };
const fmt = (n: number, locale: LabelLocale) =>
  new Intl.NumberFormat(locale === "en" ? "en-US" : locale === "ru" ? "ru-RU" : "uk-UA", { maximumFractionDigits: 0 }).format(n);

/** "$2,500–5,000", "До $500", "$10,000+", or the label of a special answer. */
export function budgetLabel(
  b: { range?: string | null; min?: number | null; max?: number | null; currency?: string | null },
  locale: LabelLocale,
): string {
  const special = T.budgetSpecial![locale]!;
  if (b.range && b.range !== "custom" && special[b.range]) return special[b.range]!;
  const cur = (b.currency ?? "USD") as Currency;
  const s = SYMBOL[cur] ?? "";
  const min = b.min ?? null;
  const max = b.max ?? null;
  const upTo = { uk: "До", en: "Up to", ru: "До" }[locale];
  if ((min === null || min === 0) && max !== null) return `${upTo} ${s}${fmt(max, locale)}`;
  if (min !== null && max === null) return `${s}${fmt(min, locale)}+`;
  if (min !== null && max !== null) return `${s}${fmt(min, locale)}–${fmt(max, locale)}`;
  return special.undecided!;
}
