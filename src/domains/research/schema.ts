import { z } from "zod";

const text = (max = 5000) => z.string().trim().max(max).nullish().transform((v) => v || null);

export const GUIDE_SECTIONS = [
  { value: "intro", label: "Вступ", hint: "Знайомство, мета розмови, згода на запис" },
  { value: "context", label: "Контекст", hint: "Хто людина, чим займається, як влаштований її день" },
  { value: "current_behavior", label: "Поточна поведінка", hint: "Як зараз розв'язує задачу — на прикладі останнього разу" },
  { value: "problems", label: "Проблеми", hint: "Що дратує, де втрачає час і гроші" },
  { value: "motivation", label: "Мотивація", hint: "Навіщо це робить, що вважає добрим результатом" },
  { value: "experience", label: "Досвід із продуктами", hint: "Чим користувався, що сподобалося і чому пішов" },
  { value: "expectations", label: "Очікування", hint: "Яким бачить ідеальний варіант — без прямих питань «купили б?»" },
  { value: "closing", label: "Завершення", hint: "Що не запитали, чи можна зв'язатися ще раз" },
] as const;
export type GuideSection = (typeof GUIDE_SECTIONS)[number]["value"];
export const sectionLabel = (s: string) => GUIDE_SECTIONS.find((x) => x.value === s)?.label ?? s;

/** Starter questions per section (Knowledge template "Глибинне інтерв'ю"). */
export const GUIDE_TEMPLATE: { section: GuideSection; text: string; probes: string[]; is_key?: boolean }[] = [
  { section: "intro", text: "Розкажіть трохи про себе: чим займаєтеся?", probes: [] },
  { section: "context", text: "Який вигляд має ваш звичайний день?", probes: ["Де в ньому [задача]?"] },
  { section: "current_behavior", text: "Розкажіть, як ви останнього разу [розв'язували задачу]?", probes: ["З чого почали?", "Скільки часу забрало?"], is_key: true },
  { section: "current_behavior", text: "Якими сервісами чи способами користуєтеся?", probes: ["Чому саме ними?"] },
  { section: "problems", text: "Що в цьому процесі дратує або забирає найбільше часу?", probes: ["Можете згадати конкретний випадок?"], is_key: true },
  { section: "motivation", text: "Навіщо ви це робите? Що для вас добрий результат?", probes: [] },
  { section: "experience", text: "Чи пробували інші рішення? Чому перестали ними користуватися?", probes: [] },
  { section: "expectations", text: "Якби можна було махнути чарівною паличкою, що б змінилося?", probes: ["Чому це важливо?"] },
  { section: "closing", text: "Що важливе я не запитав(-ла)?", probes: [] },
];

export const RESEARCH_METHODS = [
  { value: "interview", label: "Інтерв'ю" },
  { value: "usability", label: "Юзабіліті-тест" },
  { value: "survey", label: "Опитування" },
  { value: "diary", label: "Щоденникове" },
  { value: "other", label: "Інше" },
] as const;

export const RESEARCH_STATUSES = [
  { value: "draft", label: "Чернетка" },
  { value: "active", label: "Триває" },
  { value: "done", label: "Завершено" },
] as const;

export const INTERVIEW_STATUSES = [
  { value: "planned", label: "Заплановано" },
  { value: "in_progress", label: "Триває" },
  { value: "done", label: "Проведено" },
  { value: "synthesized", label: "Розібрано" },
] as const;
export type InterviewStatus = (typeof INTERVIEW_STATUSES)[number]["value"];
export const interviewStatusLabel = (s: string) => INTERVIEW_STATUSES.find((x) => x.value === s)?.label ?? s;

export const INTERVIEW_MODES = [
  { value: "remote", label: "Онлайн" },
  { value: "in_person", label: "Особисто" },
  { value: "phone", label: "Телефон" },
] as const;

export const planSchema = z.object({
  title: z.string().trim().min(1, { error: "Введіть назву" }).max(200),
  goal: text(),
  questions: z.array(z.string().trim().max(500).catch("")).max(30).catch([]).transform((a) => a.filter(Boolean)),
  hypotheses_text: text(),
  audience: text(),
  method: z.enum(["interview", "usability", "survey", "diary", "other"]),
  participants_target: z.number().int().min(1).max(500).nullish().catch(null).transform((v) => v ?? null),
  success_criteria: text(),
  status: z.enum(["draft", "active", "done"]),
});
export type PlanFields = z.output<typeof planSchema>;

export const guideMetaSchema = z.object({
  title: z.string().trim().min(1, { error: "Введіть назву" }).max(200),
  intro: text(),
  outro: text(),
});
export type GuideMeta = z.output<typeof guideMetaSchema>;

export const questionSchema = z.object({
  section: z.enum(["intro", "context", "current_behavior", "problems", "motivation", "experience", "expectations", "closing"]),
  text: z.string().trim().min(1).max(1000),
  probes: z.array(z.string().trim().max(300)).max(10).transform((a) => a.filter(Boolean)),
  is_key: z.boolean(),
});

export const participantSchema = z.object({
  display_name: text(120),
  role: text(200),
  segment_label: text(80),
  age_range: text(40),
  context: text(),
  contact: text(300),
  consent: z.boolean(),
  tags: z.array(z.string().trim().toLowerCase().max(40)).max(20).catch([]).transform((a) => [...new Set(a.filter(Boolean))]),
  notes: text(),
});
export type ParticipantFields = z.output<typeof participantSchema>;

export const interviewMetaSchema = z.object({
  conducted_at: z.string().regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/).nullish().catch(null).transform((v) => v || null),
  duration_min: z.number().int().min(1).max(600).nullish().catch(null).transform((v) => v ?? null),
  mode: z.enum(["remote", "in_person", "phone"]),
  status: z.enum(["planned", "in_progress", "done", "synthesized"]),
  notes: text(20000),
});
export type InterviewMeta = z.output<typeof interviewMetaSchema>;

/** Participant label without PII in lists: role is the primary name, code always shown next to it. */
export const participantTitle = (p: { display_name: string | null; role: string | null; code: string }) =>
  p.display_name || p.role || p.code;

/** Interviews done (or synthesized) count towards research progress. */
export const RESEARCH_TARGET_DEFAULT = 5;
export const isConducted = (status: string) => status === "done" || status === "synthesized";
