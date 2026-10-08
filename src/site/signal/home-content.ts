import type { Locale } from "@/site/content";

/**
 * Copy of the SIGNAL home page and site frame (uk, en), from the SIGNAL package (index.html). Kept beside the
 * redesign so the shared content.ts stays as it is.
 */
export const SIGNAL_COPY = {
  uk: {
    role: "Product & UI/UX designer",
    discuss: "Обговорити проєкт",
    work: { index: "01", eyebrow: "Від задачі до рішення", title: "Вибрані роботи" },
    about: {
      index: "02",
      eyebrow: "Дизайнер за роботами",
      title: ["Бачу систему.", "Дбаю про деталі."],
      text: "Я Геннадій, продуктовий дизайнер. Досліджую контекст, знаходжу зв’язки та створюю інтерфейси, які легко зрозуміти й розвивати. Мій досвід у вебі, продуктових командах і менторстві допомагає дивитися на задачу ширше за окремий екран.",
      facts: [
        { value: "7 років", label: "у вебі та продуктових командах" },
        { value: "Від «чому»", label: "до системи й передачі в розробку" },
        { value: "Україна", label: "Миколаїв · працюю дистанційно" },
      ],
      more: "Досвід і резюме",
    },
    process: {
      index: "03",
      eyebrow: "Мій підхід",
      title: ["Спочатку сенс.", "Потім форма."],
      lead: "Простий процес, у якому кожен наступний крок має підставу.",
      steps: [
        { code: "Discover", title: "Розібратися", text: "Почути людей, зрозуміти бізнес і знайти справжню задачу." },
        { code: "Define", title: "Знайти структуру", text: "Пов’язати спостереження зі сценаріями та пріоритетами." },
        { code: "Design", title: "Надати форму", text: "Зібрати ясний інтерфейс і систему, на яку можна спиратися." },
        { code: "Deliver", title: "Довести до роботи", text: "Передати логіку, перевірити реалізацію й продумати стани." },
      ],
    },
    contact: {
      index: "04",
      eyebrow: "Наступний сильний проєкт — ваш?",
      title: ["Створімо", "щось значиме."],
      text: ["Розкажіть, що хочете змінити.", "Почнемо зі знайомства та вашої задачі."],
    },
    top: "Нагору",
    back: "До всіх робіт",
    contents: "У цьому кейсі",
    enlarge: "Збільшити",
  },
  en: {
    role: "Product & UI/UX designer",
    discuss: "Discuss a project",
    work: { index: "01", eyebrow: "From problem to solution", title: "Selected work" },
    about: {
      index: "02",
      eyebrow: "The designer behind the work",
      title: ["I see the system.", "I care about details."],
      text: "I’m Hennadii, a product designer. I research the context, find the connections and build interfaces that are easy to understand and grow. Years in web, product teams and mentoring help me look at a problem wider than a single screen.",
      facts: [
        { value: "7 years", label: "in web and product teams" },
        { value: "From “why”", label: "to the system and the handoff" },
        { value: "Ukraine", label: "Mykolaiv · working remotely" },
      ],
      more: "Experience and CV",
    },
    process: {
      index: "03",
      eyebrow: "My approach",
      title: ["Meaning first.", "Then form."],
      lead: "A simple process where every next step has a reason.",
      steps: [
        { code: "Discover", title: "Understand", text: "Hear the people, understand the business and find the real problem." },
        { code: "Define", title: "Find the structure", text: "Connect what we learned to scenarios and priorities." },
        { code: "Design", title: "Give it form", text: "Build a clear interface and a system to rely on." },
        { code: "Deliver", title: "Get it working", text: "Hand over the logic, check the build and think through the states." },
      ],
    },
    contact: {
      index: "04",
      eyebrow: "Your next strong project?",
      title: ["Let’s make", "something meaningful."],
      text: ["Tell me what you want to change.", "We start with getting to know you and your problem."],
    },
    top: "Back to top",
    back: "All work",
    contents: "In this case",
    enlarge: "Enlarge",
  },
} as const;

export const signalCopy = (locale: Locale) => SIGNAL_COPY[locale];
