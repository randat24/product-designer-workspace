import { z } from "zod";
import { withScheme } from "@/shared/lib/url";

const text = (max = 5000) => z.string().trim().max(max).nullish().transform((v) => v || null);

export const COMPETITOR_KINDS = [
  { value: "direct", label: "Прямой" },
  { value: "indirect", label: "Косвенный" },
  { value: "substitute", label: "Заменитель" },
] as const;
export type CompetitorKind = (typeof COMPETITOR_KINDS)[number]["value"];

/** Accepts "example.com" as well as full URLs. */
const url = z
  .string()
  .trim()
  .max(2000)
  .nullish()
  .transform((v) => (v ? withScheme(v) : null));

export const competitorSchema = z.object({
  name: z.string().trim().min(1, { error: "Введите название" }).max(120),
  url,
  kind: z.enum(["direct", "indirect", "substitute"]),
  positioning: text(),
  target_audience: text(),
  pricing: text(1000),
  onboarding_notes: text(),
  navigation_notes: text(),
  ux_patterns: text(),
  ui_patterns: text(),
  strengths: text(),
  weaknesses: text(),
  reviews_summary: text(),
  opportunities: text(),
  borrow: text(),
});
export type CompetitorFields = z.output<typeof competitorSchema>;
export type CompetitorInput = z.input<typeof competitorSchema>;

export const FEATURE_VALUES = ["unknown", "yes", "partial", "no"] as const;
export type FeatureValue = (typeof FEATURE_VALUES)[number];
/** Click order in the matrix: ? → yes → partial → no → ? */
export const nextFeatureValue = (v: FeatureValue): FeatureValue =>
  FEATURE_VALUES[(FEATURE_VALUES.indexOf(v) + 1) % FEATURE_VALUES.length] ?? "unknown";

export const featureSchema = z.object({
  name: z.string().trim().min(1).max(200),
  group_name: z.string().trim().max(80).nullish().transform((v) => v || null),
});

/**
 * Ready-made UX review rows: Nielsen's 10 heuristics and the laws of UX (docs/UX_LAWS.md), split
 * into sets of up to 10 so no single set overwhelms the matrix (choice overload, UX-05).
 * A row already in the matrix (same text) is skipped, so sets can overlap.
 */
export const UX_TEMPLATES = {
  nielsen: {
    group: "Эвристики Нильсена",
    rows: [
      "#1 Видимость состояния системы", "#2 Соответствие реальному миру", "#3 Свобода и контроль пользователя",
      "#4 Единообразие и стандарты", "#5 Предотвращение ошибок", "#6 Узнавание, а не вспоминание",
      "#7 Гибкость и эффективность", "#8 Эстетичный минималистичный дизайн",
      "#9 Помощь в распознавании и исправлении ошибок", "#10 Справка и документация",
    ],
  },
  laws: {
    group: "Законы UX",
    rows: [
      "Закон Якоба — привычные паттерны", "Закон Фиттса — крупные и близкие цели", "Закон Хика — мало вариантов выбора",
      "Закон Миллера — порции по 5–9 элементов", "Закон Теслера — сложность берёт система",
      "Порог Доэрти — ответ быстрее 400 мс", "Эффект эстетики-удобства", "Правило пика и конца",
      "Эффект фон Ресторфф — главное выделено", "Закон близости — связанное рядом",
    ],
  },
  gestalt: {
    group: "Гештальт",
    rows: [
      "Закон близости — связанное рядом", "Закон общей области — группа в общей рамке",
      "Закон сходства — однотипное выглядит одинаково", "Закон единой связанности — связи показаны линией",
      "Закон Прегнанца — простые формы и иконки", "Эффект эстетики-удобства",
    ],
  },
  memory: {
    group: "Память и внимание",
    rows: [
      "Когнитивная нагрузка — один главный акцент", "Разбиение на части — блоки с заголовками",
      "Рабочая память — не нужно помнить с другого экрана", "Избирательное внимание — важное у места действия",
      "Эффект последовательной позиции — главное в начале и конце", "Перегрузка выбором — есть вариант по умолчанию",
      "Эффект Зейгарник — незавершённое видно", "Эффект градиента цели — виден прогресс",
      "Поток — основной цикл без прерываний", "Закон Постела — терпимость к вводу",
    ],
  },
} as const;
export type UxTemplate = keyof typeof UX_TEMPLATES;

export const ATTACHMENT_MIME = ["image/png", "image/jpeg", "image/webp", "image/gif"] as const;
export const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;

/** A competitor counts towards progress once it has a name and at least one assessment. */
export const COMPETITORS_TARGET = 3;
export const isAssessed = (c: { is_own_product: boolean; strengths: string | null; weaknesses: string | null }) =>
  !c.is_own_product && !!(c.strengths || c.weaknesses);
