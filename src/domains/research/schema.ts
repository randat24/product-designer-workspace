import { z } from "zod";

const text = (max = 5000) => z.string().trim().max(max).nullish().transform((v) => v || null);

export const GUIDE_SECTIONS = [
  { value: "intro", label: "Вступление", hint: "Знакомство, цель разговора, согласие на запись" },
  { value: "context", label: "Контекст", hint: "Кто человек, чем занимается, как устроен его день" },
  { value: "current_behavior", label: "Текущее поведение", hint: "Как сейчас решает задачу — на примере последнего раза" },
  { value: "problems", label: "Проблемы", hint: "Что раздражает, где теряет время и деньги" },
  { value: "motivation", label: "Мотивация", hint: "Зачем это делает, что считает хорошим результатом" },
  { value: "experience", label: "Опыт с продуктами", hint: "Чем пользовался, что понравилось и почему ушёл" },
  { value: "expectations", label: "Ожидания", hint: "Каким видит идеальный вариант — без прямых вопросов «купили бы?»" },
  { value: "closing", label: "Завершение", hint: "Что не спросили, можно ли связаться ещё раз" },
] as const;
export type GuideSection = (typeof GUIDE_SECTIONS)[number]["value"];
export const sectionLabel = (s: string) => GUIDE_SECTIONS.find((x) => x.value === s)?.label ?? s;

/** Starter questions per section (Knowledge template "Глубинное интервью"). */
export const GUIDE_TEMPLATE: { section: GuideSection; text: string; probes: string[]; is_key?: boolean }[] = [
  { section: "intro", text: "Расскажите немного о себе: чем занимаетесь?", probes: [] },
  { section: "context", text: "Как выглядит ваш обычный день?", probes: ["Где в нём находится [задача]?"] },
  { section: "current_behavior", text: "Расскажите, как вы в последний раз [решали задачу]?", probes: ["С чего начали?", "Сколько времени заняло?"], is_key: true },
  { section: "current_behavior", text: "Какими сервисами или способами пользуетесь?", probes: ["Почему именно ими?"] },
  { section: "problems", text: "Что в этом процессе раздражает или отнимает больше всего времени?", probes: ["Можете вспомнить конкретный случай?"], is_key: true },
  { section: "motivation", text: "Зачем вы это делаете? Что для вас хороший результат?", probes: [] },
  { section: "experience", text: "Пробовали ли другие решения? Почему перестали ими пользоваться?", probes: [] },
  { section: "expectations", text: "Если бы можно было взмахнуть волшебной палочкой, что бы изменилось?", probes: ["Почему это важно?"] },
  { section: "closing", text: "Что важное я не спросил(а)?", probes: [] },
];

export const RESEARCH_METHODS = [
  { value: "interview", label: "Интервью" },
  { value: "usability", label: "Юзабилити-тест" },
  { value: "survey", label: "Опрос" },
  { value: "diary", label: "Дневниковое" },
  { value: "other", label: "Другое" },
] as const;

export const RESEARCH_STATUSES = [
  { value: "draft", label: "Черновик" },
  { value: "active", label: "Идёт" },
  { value: "done", label: "Завершено" },
] as const;

export const INTERVIEW_STATUSES = [
  { value: "planned", label: "Запланировано" },
  { value: "in_progress", label: "Идёт" },
  { value: "done", label: "Проведено" },
  { value: "synthesized", label: "Разобрано" },
] as const;
export type InterviewStatus = (typeof INTERVIEW_STATUSES)[number]["value"];
export const interviewStatusLabel = (s: string) => INTERVIEW_STATUSES.find((x) => x.value === s)?.label ?? s;

export const INTERVIEW_MODES = [
  { value: "remote", label: "Онлайн" },
  { value: "in_person", label: "Лично" },
  { value: "phone", label: "Телефон" },
] as const;

export const planSchema = z.object({
  title: z.string().trim().min(1, { error: "Введите название" }).max(200),
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
  title: z.string().trim().min(1, { error: "Введите название" }).max(200),
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
