import { z } from "zod";
import { withScheme } from "@/shared/lib/url";

const text = (max = 5000) => z.string().trim().max(max).nullish().transform((v) => v || null);

export const COMPETITOR_KINDS = [
  { value: "direct", label: "Прямий" },
  { value: "indirect", label: "Непрямий" },
  { value: "substitute", label: "Замінник" },
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
  name: z.string().trim().min(1, { error: "Введіть назву" }).max(120),
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
    group: "Евристики Нільсена",
    rows: [
      "#1 Видимість стану системи", "#2 Відповідність реальному світу", "#3 Свобода й контроль користувача",
      "#4 Узгодженість і стандарти", "#5 Запобігання помилкам", "#6 Упізнавання, а не пригадування",
      "#7 Гнучкість і ефективність", "#8 Естетичний мінімалістичний дизайн",
      "#9 Допомога в розпізнаванні й виправленні помилок", "#10 Довідка й документація",
    ],
  },
  laws: {
    group: "Закони UX",
    rows: [
      "Закон Якоба — звичні патерни", "Закон Фіттса — великі й близькі цілі", "Закон Хіка — мало варіантів вибору",
      "Закон Міллера — порції по 5–9 елементів", "Закон Теслера — складність бере система",
      "Поріг Доерті — відповідь швидше за 400 мс", "Ефект естетики-зручності", "Правило піку й кінця",
      "Ефект фон Ресторфф — головне виділено", "Закон близькості — пов'язане поруч",
    ],
  },
  gestalt: {
    group: "Гештальт",
    rows: [
      "Закон близькості — пов'язане поруч", "Закон спільної області — група в спільній рамці",
      "Закон подібності — однотипне виглядає однаково", "Закон єдиної пов'язаності — зв'язки показано лінією",
      "Закон Прегнанца — прості форми й іконки", "Ефект естетики-зручності",
    ],
  },
  memory: {
    group: "Пам'ять і увага",
    rows: [
      "Когнітивне навантаження — один головний акцент", "Поділ на частини — блоки із заголовками",
      "Робоча пам'ять — не треба пам'ятати з іншого екрана", "Вибіркова увага — важливе біля місця дії",
      "Ефект послідовної позиції — головне на початку й наприкінці", "Перевантаження вибором — є варіант за замовчуванням",
      "Ефект Зейгарнік — незавершене видно", "Ефект градієнта мети — видно прогрес",
      "Потік — основний цикл без переривань", "Закон Постела — терпимість до введення",
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
