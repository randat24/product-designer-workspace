// Public site content (portfolio + CV) in Ukrainian and English.
// Cases are placeholders for now; the CV part follows the resume in public/cv/.

import type { AwardIcon } from "./award-icons";

export const LOCALES = ["uk", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export const CONTACTS = {
  email: "web_dizz@icloud.com",
  telegram: "https://t.me/Web_Dizz",
  linkedin: "https://linkedin.com/in/hennadii-f",
  dribbble: "https://dribbble.com/randat24",
  cv: "/cv/hennadii-fedorov-cv-uk.pdf",
};

export type CaseSection = { title: string; body: string };

export type Case = {
  slug: string;
  sticker: string; // CSS var of the sticky-note palette
  year: string;
  title: string;
  client: string;
  role: string;
  summary: string;
  tags: string[];
  metrics: { value: string; label: string }[];
  sections: CaseSection[];
};

export type Award = {
  icon: AwardIcon;
  title: string;
  issuer: string;
};

type Job = {
  period: string;
  title: string;
  place: string;
  points: string[];
  military?: boolean;
};

type Dictionary = {
  name: string;
  role: string;
  location: string;
  nav: { work: string; about: string; contact: string };
  home: {
    hello: string;
    lead: string;
    available: string;
    cta: string;
    ctaCv: string;
    selected: string;
    all: string;
  };
  cases: {
    title: string;
    lead: string;
    placeholder: string;
    back: string;
    next: string;
    role: string;
    client: string;
    year: string;
  };
  about: {
    title: string;
    summary: string;
    experience: string;
    serviceTitle: string;
    serviceText: string;
    awards: string;
    skills: string;
    education: string;
    languages: string;
    availability: string;
    download: string;
  };
  jobs: Job[];
  skills: { group: string; items: string }[];
  education: { title: string; place: string; year: string }[];
  languages: { name: string; level: string }[];
  availability: string[];
  awards: Award[];
  awardsPhoto: { image: string; caption: string };
  contact: { title: string; lead: string; write: string };
  footer: { rights: string; login: string };
  cases_list: Case[];
};

const uk: Dictionary = {
  name: "Геннадій Федоров",
  role: "Product / UI-UX дизайнер",
  location: "Миколаїв · дистанційно",
  nav: { work: "Роботи", about: "Про мене", contact: "Контакт" },
  home: {
    hello: "Привіт, я Геннадій —",
    lead: "продуктовий дизайнер. 7 років у вебі та продуктових командах. Дослідження → дизайн-система → чистий handoff. Роблю передбачуваний інтерфейс, який команда може розвивати без мене.",
    available: "Відкритий до проєктів · part-time, 20 год/тиждень",
    cta: "Написати мені",
    ctaCv: "Резюме (PDF)",
    selected: "Вибрані роботи",
    all: "Усі роботи",
  },
  cases: {
    title: "Роботи",
    lead: "Кейси — від дослідження до передачі в розробку. Тексти поки що приклади, справжні кейси зʼявляться незабаром.",
    placeholder: "Зображення зʼявиться згодом",
    back: "Усі роботи",
    next: "Наступний кейс",
    role: "Роль",
    client: "Клієнт",
    year: "Рік",
  },
  about: {
    title: "Про мене",
    summary:
      "7 років у вебі та продуктових командах. Працюю системно: дослідження → дизайн-система → чистий handoff. Найкраще даюся там, де замість набору макетів потрібен передбачуваний інтерфейс, який команда може розвивати без мене.",
    experience: "Досвід",
    serviceTitle: "Служба",
    serviceText:
      "З березня 2022 року я у Збройних Силах України — одним із перших став на оборону своєї країни та рідного Миколаєва. Служба навчила того ж, що й добрий дизайн: чіткої комунікації, регламентів, які працюють під тиском, і відповідальності за результат. Я продовжую боротися — і в дизайні теж.",
    awards: "Нагороди",
    skills: "Навички",
    education: "Освіта",
    languages: "Мови",
    availability: "Формат роботи",
    download: "Завантажити резюме (PDF)",
  },
  jobs: [
    {
      period: "03.2022 — зараз",
      title: "Фахівець зі звʼязку",
      place: "Збройні Сили України",
      military: true,
      points: [
        "Забезпечую звʼязок підрозділу",
        "Розробляв регламенти управління ротою",
        "Навчаю особовий склад",
        "Відзначений нагородами (2022, 2024)",
      ],
    },
    {
      period: "03.2020 — 01.2022",
      title: "UI/UX Designer & Mentor",
      place: "Wgroup · Миколаїв",
      points: [
        "End-to-end дизайн продуктів",
        "Керував двома дизайнерами",
        "Побудував дизайн-систему",
      ],
    },
    {
      period: "03.2020 — 01.2022",
      title: "UX Designer → Product Designer",
      place: "Subscription Media Platform (NDA) · дистанційно",
      points: [
        "Онбординг, пейвол і підписки, каталог, профілі",
        "Дизайн-система з нуля",
        "Кабінет автора",
        "Дослідження користувачів",
      ],
    },
    {
      period: "05.2019 — 08.2021",
      title: "UI/UX & Web Designer",
      place: "Veronikalove · Миколаїв (паралельно)",
      points: ["Сайти й застосунки", "Email-розсилки", "Анімація"],
    },
    {
      period: "2016 — 2019",
      title: "Веб-дизайнер",
      place: "Dizz agency (Київ), SugarTheme (Миколаїв)",
      points: ["Шаблони для ThemeForest", "Лендінги", "Фірмовий стиль"],
    },
  ],
  skills: [
    {
      group: "Дизайн",
      items:
        "UX-дослідження, інформаційна архітектура, прототипування, UI, дизайн-системи й токени, адаптивний і мобільний дизайн",
    },
    {
      group: "Процес",
      items: "Handoff і специфікації, UI QA, дизайн-рев'ю, менторство",
    },
    {
      group: "Інструменти",
      items: "Figma, Sketch, Photoshop, Illustrator, After Effects, Blender",
    },
    { group: "Технічне", items: "HTML, CSS, базовий JS, адаптивна верстка" },
  ],
  education: [
    { title: "UX|UI designer", place: "Skvot · сертифікат", year: "2025" },
    {
      title: "Python для Data Science",
      place: "intellectum.university · сертифікат",
      year: "2026",
    },
    {
      title: "Дизайн",
      place: "Компʼютерна академія «ШАГ», Миколаїв",
      year: "2015 — 2016",
    },
  ],
  languages: [
    { name: "Українська", level: "вільно" },
    { name: "Англійська", level: "початковий" },
  ],
  availability: [
    "Проєктна робота або part-time, 20 год/тиждень, дистанційно",
    "Асинхронна комунікація, відповідь у межах доби",
    "На військовій службі: можливі паузи до 5 днів, попереджаю заздалегідь",
    "Готовий до тестового завдання й пробного спринту",
    "Статус учасника бойових дій: роботодавець може отримати компенсацію від Державної служби зайнятості",
  ],
  awards: [
    {
      icon: "defence-of-ukraine",
      title: "Відзнака Президента України «За оборону України»",
      issuer: "Президент України",
    },
    {
      icon: "defence-of-mykolaiv",
      title: "Хрест «За оборону Миколаєва», 2022",
      issuer: "Місто Миколаїв",
    },
    {
      icon: "marine-brigade-36",
      title: "Памʼятна медаль 36-ї окремої бригади морської піхоти «Курська операція»",
      issuer: "36 ОБрМП",
    },
    {
      icon: "veteran-of-war",
      title: "Нагрудний знак «Ветеран війни»",
      issuer: "Україна",
    },
    {
      icon: "military-service-veteran",
      title: "Нагрудний знак «Ветеран військової служби»",
      issuer: "Україна",
    },
  ],
  awardsPhoto: {
    image: "/awards/defence-of-mykolaiv-case.webp",
    caption: "Хрест «За оборону Миколаєва» з посвідченням",
  },
  contact: {
    title: "Є задача?",
    lead: "Розкажіть коротко про продукт і терміни — відповім протягом доби.",
    write: "Написати на пошту",
  },
  footer: { rights: "Усі права захищено", login: "Вхід" },
  cases_list: [],
};

const en: Dictionary = {
  name: "Hennadii Fedorov",
  role: "Product / UI-UX designer",
  location: "Mykolaiv, Ukraine · remote",
  nav: { work: "Work", about: "About", contact: "Contact" },
  home: {
    hello: "Hi, I'm Hennadii —",
    lead: "a product designer with 7 years in web and product teams. Research → design system → clean handoff. I build predictable interfaces a team can keep growing without me.",
    available: "Open to projects · part-time, 20 h/week",
    cta: "Get in touch",
    ctaCv: "CV (PDF, Ukrainian)",
    selected: "Selected work",
    all: "All work",
  },
  cases: {
    title: "Work",
    lead: "Case studies — from research to handoff. The copy is a sample for now; real case studies are coming soon.",
    placeholder: "Image coming soon",
    back: "All work",
    next: "Next case",
    role: "Role",
    client: "Client",
    year: "Year",
  },
  about: {
    title: "About",
    summary:
      "7 years in web and product teams. I work systematically: research → design system → clean handoff. I'm at my best where a team needs a predictable interface it can evolve without me, not just a set of mockups.",
    experience: "Experience",
    serviceTitle: "Service",
    serviceText:
      "Since March 2022 I have served in the Armed Forces of Ukraine — among the first to stand up for my country and my home city of Mykolaiv. Service taught me what good design does too: clear communication, processes that hold under pressure, and ownership of the outcome. I keep fighting — in design as well.",
    awards: "Awards",
    skills: "Skills",
    education: "Education",
    languages: "Languages",
    availability: "How I work",
    download: "Download CV (PDF, Ukrainian)",
  },
  jobs: [
    {
      period: "03.2022 — now",
      title: "Signals specialist",
      place: "Armed Forces of Ukraine",
      military: true,
      points: [
        "Run communications for my unit",
        "Wrote company command procedures",
        "Train personnel",
        "Decorated (2022, 2024)",
      ],
    },
    {
      period: "03.2020 — 01.2022",
      title: "UI/UX Designer & Mentor",
      place: "Wgroup · Mykolaiv",
      points: [
        "End-to-end product design",
        "Led two designers",
        "Built the design system",
      ],
    },
    {
      period: "03.2020 — 01.2022",
      title: "UX Designer → Product Designer",
      place: "Subscription Media Platform (NDA) · remote",
      points: [
        "Onboarding, paywall and subscriptions, catalog, profiles",
        "Design system from scratch",
        "Creator dashboard",
        "User research",
      ],
    },
    {
      period: "05.2019 — 08.2021",
      title: "UI/UX & Web Designer",
      place: "Veronikalove · Mykolaiv (part-time)",
      points: ["Websites and apps", "Email campaigns", "Motion"],
    },
    {
      period: "2016 — 2019",
      title: "Web designer",
      place: "Dizz agency (Kyiv), SugarTheme (Mykolaiv)",
      points: ["ThemeForest templates", "Landing pages", "Brand identity"],
    },
  ],
  skills: [
    {
      group: "Design",
      items:
        "UX research, information architecture, prototyping, UI, design systems and tokens, responsive and mobile design",
    },
    {
      group: "Process",
      items: "Handoff and specs, UI QA, design reviews, mentoring",
    },
    {
      group: "Tools",
      items: "Figma, Sketch, Photoshop, Illustrator, After Effects, Blender",
    },
    { group: "Technical", items: "HTML, CSS, basic JS, responsive markup" },
  ],
  education: [
    { title: "UX|UI designer", place: "Skvot · certificate", year: "2025" },
    {
      title: "Python for Data Science",
      place: "intellectum.university · certificate",
      year: "2026",
    },
    {
      title: "Design",
      place: "STEP Computer Academy, Mykolaiv",
      year: "2015 — 2016",
    },
  ],
  languages: [
    { name: "Ukrainian", level: "fluent" },
    { name: "English", level: "basic" },
  ],
  availability: [
    "Project work or part-time, 20 h/week, remote",
    "Async communication, reply within a day",
    "On military service: possible breaks of up to 5 days, announced in advance",
    "Happy to do a test task or a trial sprint",
  ],
  awards: [
    {
      icon: "defence-of-ukraine",
      title: "Presidential Award “For the Defence of Ukraine”",
      issuer: "President of Ukraine",
    },
    {
      icon: "defence-of-mykolaiv",
      title: "Cross “For the Defence of Mykolaiv”, 2022",
      issuer: "City of Mykolaiv",
    },
    {
      icon: "marine-brigade-36",
      title: "Commemorative medal of the 36th Separate Marine Brigade, “Kursk operation”",
      issuer: "36th Separate Marine Brigade",
    },
    {
      icon: "veteran-of-war",
      title: "“War Veteran” badge",
      issuer: "Ukraine",
    },
    {
      icon: "military-service-veteran",
      title: "“Veteran of Military Service” badge",
      issuer: "Ukraine",
    },
  ],
  awardsPhoto: {
    image: "/awards/defence-of-mykolaiv-case.webp",
    caption: "The Cross “For the Defence of Mykolaiv” with its certificate",
  },
  contact: {
    title: "Have a project?",
    lead: "Tell me briefly about the product and the timeline — I'll reply within a day.",
    write: "Email me",
  },
  footer: { rights: "All rights reserved", login: "Sign in" },
  cases_list: [],
};

// ---------------------------------------------------------------------
// Placeholder cases (same structure in both languages).
// ---------------------------------------------------------------------
uk.cases_list = [
  {
    slug: "subscription-platform",
    sticker: "var(--s6)",
    year: "2020 — 2022",
    title: "Медіаплатформа з підпискою",
    client: "Subscription Media Platform (NDA)",
    role: "UX → Product Designer",
    summary:
      "Онбординг, пейвол і кабінет автора для платформи платного контенту. Дизайн-система з нуля.",
    tags: ["Онбординг", "Пейвол", "Дизайн-система"],
    metrics: [
      { value: "+00%", label: "конверсія в підписку (приклад)" },
      { value: "0 тиж.", label: "до першого релізу (приклад)" },
      { value: "000", label: "компонентів у системі (приклад)" },
    ],
    sections: [
      {
        title: "Задача",
        body: "Приклад тексту: користувачі йшли з онбордингу, не дійшовши до пейволу. Бізнесу потрібна була зрозуміла дорога від першого візиту до підписки.",
      },
      {
        title: "Дослідження",
        body: "Приклад тексту: інтервʼю з авторами й читачами, аналіз воронки, розбір конкурентів. Головний інсайт — людям треба побачити цінність до оплати.",
      },
      {
        title: "Рішення",
        body: "Приклад тексту: короткий онбординг з вибором тем, пейвол після першої цінності, кабінет автора зі статистикою. Все — на токенах дизайн-системи.",
      },
      {
        title: "Результат",
        body: "Приклад тексту: зростання конверсії, скорочення часу на новий екран, команда розвиває продукт без дизайнера на кожен чих.",
      },
    ],
  },
  {
    slug: "wgroup-design-system",
    sticker: "var(--s4)",
    year: "2020 — 2022",
    title: "Дизайн-система для студії",
    client: "Wgroup",
    role: "UI/UX Designer & Mentor",
    summary:
      "Єдина бібліотека компонентів і токенів для клієнтських проєктів студії та процес передачі в розробку.",
    tags: ["Дизайн-система", "Токени", "Менторство"],
    metrics: [
      { value: "×0", label: "швидше новий проєкт (приклад)" },
      { value: "2", label: "дизайнери в команді" },
      { value: "00", label: "проєктів на системі (приклад)" },
    ],
    sections: [
      {
        title: "Задача",
        body: "Приклад тексту: кожен проєкт стартував з нуля, макети розходились з версткою.",
      },
      {
        title: "Процес",
        body: "Приклад тексту: аудит інтерфейсів, токени кольору й типографіки, базові компоненти, правила handoff.",
      },
      {
        title: "Результат",
        body: "Приклад тексту: старт проєкту за дні замість тижнів, менше правок на UI QA.",
      },
    ],
  },
  {
    slug: "restaurant-booking",
    sticker: "var(--s2)",
    year: "2026",
    title: "Застосунок бронювання ресторанів",
    client: "Концепт",
    role: "Product Designer",
    summary:
      "Від аналізу конкурентів і UX-рев'ю до флоу бронювання за три кроки.",
    tags: ["Аналіз конкурентів", "Флоу", "Мобільний"],
    metrics: [
      { value: "3", label: "кроки до броні" },
      { value: "10", label: "евристик Нільсена в рев'ю" },
      { value: "7", label: "можливостей з червоних клітинок" },
    ],
    sections: [
      {
        title: "Задача",
        body: "Приклад тексту: знайти столик на конкретний привід швидше, ніж у Google Maps чи TheFork.",
      },
      {
        title: "Аналіз",
        body: "Приклад тексту: матриця функцій конкурентів і UX-рев'ю за евристиками Нільсена; червоні клітинки стали списком можливостей.",
      },
      {
        title: "Рішення",
        body: "Приклад тексту: привід як перший фільтр, вільні слоти прямо у видачі, «Забронювати знову» в один дотик.",
      },
    ],
  },
  {
    slug: "designer-workspace",
    sticker: "var(--s3)",
    year: "2026",
    title: "Робочий простір продуктового дизайнера",
    client: "Власний продукт",
    role: "Дизайн і розробка",
    summary:
      "Інструмент, де дослідження, флоу, екрани й рішення повʼязані в один ланцюжок — і кожне рішення має «чому».",
    tags: ["SaaS", "Трасування рішень", "Next.js"],
    metrics: [
      { value: "1", label: "поле, щоб створити проєкт" },
      { value: "8", label: "етапів процесу" },
      { value: "∞", label: "звʼязків між артефактами" },
    ],
    sections: [
      {
        title: "Задача",
        body: "Приклад тексту: артефакти дизайну живуть у різних інструментах, і через місяць ніхто не памʼятає, чому екран саме такий.",
      },
      {
        title: "Рішення",
        body: "Приклад тексту: єдиний ланцюжок дослідження → інсайти → проблеми → флоу → екрани → рішення, з автоматичними звʼязками.",
      },
      {
        title: "Стан",
        body: "Приклад тексту: MVP у роботі, ним я веду власні проєкти.",
      },
    ],
  },
];

en.cases_list = [
  {
    ...uk.cases_list[0]!,
    title: "Subscription media platform",
    role: "UX → Product Designer",
    summary:
      "Onboarding, paywall and a creator dashboard for a paid content platform. Design system from scratch.",
    tags: ["Onboarding", "Paywall", "Design system"],
    metrics: [
      { value: "+00%", label: "subscription conversion (sample)" },
      { value: "0 wks", label: "to first release (sample)" },
      { value: "000", label: "components in the system (sample)" },
    ],
    sections: [
      {
        title: "Problem",
        body: "Sample copy: users dropped out of onboarding before reaching the paywall. The business needed a clear path from first visit to subscription.",
      },
      {
        title: "Research",
        body: "Sample copy: interviews with creators and readers, funnel analysis, competitor review. Key insight — people need to see value before paying.",
      },
      {
        title: "Solution",
        body: "Sample copy: short onboarding with topic picking, the paywall after the first moment of value, a creator dashboard with stats. All built on design-system tokens.",
      },
      {
        title: "Outcome",
        body: "Sample copy: higher conversion, faster new screens, the team grows the product without a designer for every tweak.",
      },
    ],
  },
  {
    ...uk.cases_list[1]!,
    title: "A design system for a studio",
    summary:
      "One library of components and tokens for the studio's client projects, plus a handoff process.",
    tags: ["Design system", "Tokens", "Mentoring"],
    metrics: [
      { value: "×0", label: "faster project start (sample)" },
      { value: "2", label: "designers on the team" },
      { value: "00", label: "projects on the system (sample)" },
    ],
    sections: [
      {
        title: "Problem",
        body: "Sample copy: every project started from scratch and mockups drifted from the build.",
      },
      {
        title: "Process",
        body: "Sample copy: interface audit, colour and type tokens, core components, handoff rules.",
      },
      {
        title: "Outcome",
        body: "Sample copy: projects start in days instead of weeks, fewer fixes at UI QA.",
      },
    ],
  },
  {
    ...uk.cases_list[2]!,
    title: "Restaurant booking app",
    client: "Concept",
    summary:
      "From competitor analysis and a UX review to a three-step booking flow.",
    tags: ["Competitor analysis", "Flows", "Mobile"],
    metrics: [
      { value: "3", label: "steps to a booking" },
      { value: "10", label: "Nielsen heuristics reviewed" },
      { value: "7", label: "opportunities from red cells" },
    ],
    sections: [
      {
        title: "Problem",
        body: "Sample copy: find a table for a specific occasion faster than on Google Maps or TheFork.",
      },
      {
        title: "Analysis",
        body: "Sample copy: a competitor feature matrix and a UX review against Nielsen's heuristics; the red cells became a list of opportunities.",
      },
      {
        title: "Solution",
        body: "Sample copy: occasion as the first filter, free slots right in the results, one-tap “Book again”.",
      },
    ],
  },
  {
    ...uk.cases_list[3]!,
    title: "Product designer workspace",
    client: "Own product",
    role: "Design & development",
    summary:
      "A tool where research, flows, screens and decisions form one chain — and every decision has a “why”.",
    tags: ["SaaS", "Decision tracing", "Next.js"],
    metrics: [
      { value: "1", label: "field to create a project" },
      { value: "8", label: "process stages" },
      { value: "∞", label: "links between artifacts" },
    ],
    sections: [
      {
        title: "Problem",
        body: "Sample copy: design artifacts live in different tools, and a month later nobody remembers why a screen looks the way it does.",
      },
      {
        title: "Solution",
        body: "Sample copy: one chain of research → insights → problems → flows → screens → decisions, linked automatically.",
      },
      {
        title: "Status",
        body: "Sample copy: MVP in progress; I run my own projects in it.",
      },
    ],
  },
];

export const DICTIONARIES: Record<Locale, Dictionary> = { uk, en };

export function dict(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}
