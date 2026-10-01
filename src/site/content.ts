// Public site content (portfolio + CV) in Ukrainian and English.
// Cases are placeholders for now; the CV part follows the resume in public/cv/.

import type { AwardIcon } from "./award-icons";
import type { CaseStory, StoryLabels } from "./case-story";
import { neuralEn, neuralUk } from "./cases/neural-webcam";
import { restaurantEn, restaurantUk } from "./cases/restaurant-booking";
import { workspaceEn, workspaceGalleryEn, workspaceGalleryUk, workspaceUk } from "./cases/designer-workspace";

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
  /** Built by `npm run cv` from this file (scripts/build-cv.ts). */
  cv: { uk: "/cv/hennadii-fedorov-cv-uk.pdf", en: "/cv/hennadii-fedorov-cv-en.pdf" } satisfies Record<Locale, string>,
};

/** A text section of a case without a full story; `image` shows its picture (a slide, a screen) under the text. */
export type CaseSection = { title: string; body: string; image?: GalleryItem };

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
  /** Full case study, as published from the tool; without it the page shows `sections`. */
  story?: CaseStory;
  /** Real (shipped / client) work or a design concept. */
  kind?: "real" | "concept";
  /** Live product, if it is public; without it visitors browse the pages below. */
  liveUrl?: string;
  /** Pages of the project to browse when there is no live site (or it is a concept). */
  gallery?: GalleryItem[];
  /** Placeholder content: shown on the site but kept out of search results and the sitemap. */
  sample?: boolean;
  /** Last change of the published snapshot (ISO), from the database. */
  updatedAt?: string;
  /** Figma file of the project (design, prototype or board), shown in a window on the case page. */
  figma?: string;
  /** Real screen for the cover; without it the cover is an abstract placeholder. */
  cover?: GalleryItem;
  /** Made for an 18+ audience: marked on the card, the mockups open only after the visitor confirms their age. */
  adult?: boolean;
  /** 18+ case whose cover is safe for everyone (a logo, not a screen): shown unblurred on the card and the page. */
  coverSafe?: boolean;
};

export type GalleryItem = {
  src: string;
  alt: string;
  caption?: string;
  device?: "desktop" | "mobile";
  width: number;
  height: number;
};

export type Award = {
  icon: AwardIcon;
  title: string;
  issuer: string;
  /** Who awards it: shown as a small mark in the card corner (a generic icon, not the real emblem). */
  issuerKind: "state" | "city" | "brigade";
  description: string;
};

type Job = {
  period: string;
  title: string;
  place: string;
  points: string[];
  /** Fuller sentences for the PDF CV; the site shows the short `points`. */
  details?: string[];
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
    /** Designer-first intro: role line above the title, facts, process and a closing call to action. */
    eyebrow: string;
    facts: { value: string; label: string }[];
    approach: string;
    approachLead: string;
    steps: { title: string; text: string }[];
    ctaTitle: string;
    ctaText: string;
  };
  jobs: Job[];
  skills: { group: string; items: string }[];
  education: { title: string; place: string; year: string; certificate?: string }[];
  languages: { name: string; level: string }[];
  availability: string[];
  awards: Award[];
  story: StoryLabels;
  contact: { title: string; lead: string; write: string };
  footer: { rights: string; login: string; top: string; certificate: string; privacy: string };
  /** Analytics consent banner and the privacy page. */
  privacy: {
    title: string;
    lede: string;
    sections: { title: string; body: string; id?: string }[];
    bannerText: string;
    accept: string;
    decline: string;
    more: string;
    manage: string;
    stateGranted: string;
    stateDenied: string;
    stateUnset: string;
    updated: string;
  };
  seo: {
    home: { title: string; description: string };
    cases: { title: string; description: string };
    about: { title: string; description: string };
    notFound: { title: string; description: string };
    ogRole: string;
    ogTopics: string;
  };
  ui: {
    skip: string;
    mainNav: string;
    footerNav: string;
    home: string;
    breadcrumbs: string;
    themeLight: string;
    themeDark: string;
    notFoundTitle: string;
    notFoundBody: string;
    notFoundHome: string;
    notFoundWork: string;
    seeWork: string;
    /** «Написати мені» menu: where to write. */
    writeVia: string;
    copyEmail: string;
    copied: string;
    /** Floating back-to-top button: "{n}" is the share of the page read. */
    toTop: string;
  };
  /** Cases made for an 18+ audience. */
  adult: {
    badge: string;
    title: string;
    body: string;
    confirm: string;
    back: string;
  };
  project: {
    real: string;
    concept: string;
    sample: string;
    live: string;
    noLive: string;
    conceptNote: string;
    pages: string;
    pagesLead: string;
    figma: string;
    figmaLead: string;
    figmaLoad: string;
    figmaOpen: string;
    figmaFrame: string;
    /** "{n}" and "{total}" are filled in by the gallery. */
    open: string;
    close: string;
    prev: string;
    next: string;
  };
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
      "З 22 лютого 2022 року я у Збройних Силах України — одним із перших став на оборону своєї країни та рідного Миколаєва. Служба навчила того ж, що й добрий дизайн: чіткої комунікації, регламентів, які працюють під тиском, і відповідальності за результат. Я продовжую боротися — і в дизайні теж.",
    awards: "Нагороди",
    skills: "Навички",
    education: "Освіта",
    languages: "Мови",
    availability: "Формат роботи",
    download: "Завантажити резюме (PDF)",
    eyebrow: "Product / UI-UX дизайнер · Миколаїв, дистанційно",
    facts: [
      { value: "7", label: "років у вебі та продуктових командах" },
      { value: "2", label: "дизайн-системи, зібрані з нуля" },
      { value: "2", label: "дизайнери під моїм менторством" },
    ],
    approach: "Як я працюю",
    approachLead: "Від питань до продукту, який команда розвиває без мене. Кожен крок лишає артефакт, на який можна спертися.",
    steps: [
      {
        title: "Дослідження",
        text: "Інтервʼю з користувачами, аналіз конкурентів, клікабельні прототипи. Рішення спираються на те, що люди роблять, а не на здогадки.",
      },
      {
        title: "Структура і сценарії",
        text: "Інформаційна архітектура й користувацькі шляхи від онбордингу до оплати, з усіма станами: завантаження, порожньо, помилка.",
      },
      {
        title: "Дизайн-система",
        text: "Токени, компоненти, адаптивні сітки й правила підтримки. Нові екрани збираються швидше, а інтерфейс лишається передбачуваним.",
      },
      {
        title: "Handoff і UI QA",
        text: "Специфікації, які розробка читає без питань, і перевірка реалізації перед релізом: що задумано, те й вийшло.",
      },
    ],
    ctaTitle: "Працюймо разом",
    ctaText: "Відкритий до проєктної роботи або part-time, 20 годин на тиждень. Розкажіть про продукт — відповім протягом доби.",
  },
  jobs: [
    {
      period: "22.02.2022 — зараз",
      title: "Фахівець зі звʼязку",
      place: "Збройні Сили України",
      military: true,
      points: [
        "Забезпечую звʼязок підрозділу",
        "Розробляв регламенти управління ротою",
        "Навчаю особовий склад",
        "Відзначений нагородами (2022, 2024)",
      ],
      details: [
        "Організовую звʼязок підрозділу: розгортання точок звʼязку, налаштування, діагностика й ремонт обладнання.",
        "Вибудував і задокументував процеси управління ротою — регламенти, звітність, порядок передачі інформації між підрозділами.",
        "Навчаю особовий склад роботі із засобами звʼязку. Відзначений нагородами (2022, 2024).",
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
      details: [
        "End-to-end продуктовий дизайн: дослідження, інформаційна архітектура, прототипи у Figma, handoff, UI QA.",
        "Керував двома дизайнерами: цілі, регулярні 1:1, рев'ю робіт, плани розвитку.",
        "Зібрав дизайн-систему: токени, бібліотеки компонентів, правила оновлення й підтримки.",
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
      details: [
        "Спроєктував наскрізний шлях користувача: онбординг, пейвол і підписки, каталог, перегляд, профілі.",
        "Побудував дизайн-систему з нуля — токени, компоненти, стани, адаптивні сітки — і скоротив час на нові екрани.",
        "Спроєктував кабінет автора: аналітика контенту, керування підписками, виплати.",
        "Дослідження: інтервʼю з користувачами, клікабельні прототипи, швидкі ітерації до фінального UI.",
      ],
    },
    {
      period: "05.2019 — 08.2021",
      title: "UI/UX & Web Designer",
      place: "Veronikalove · Миколаїв (паралельно)",
      points: ["Сайти й застосунки", "Email-розсилки", "Анімація"],
      details: ["Дизайн сайтів і мобільних застосунків, email-розсилки, легка анімація інтерфейсів."],
    },
    {
      period: "2016 — 2019",
      title: "Веб-дизайнер",
      place: "Dizz agency (Київ), SugarTheme (Миколаїв)",
      points: ["Шаблони для ThemeForest", "Лендінги", "Фірмовий стиль"],
      details: ["Багатосторінкові шаблони для ThemeForest, адаптивний дизайн, лендінги, фірмовий стиль."],
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
    {
      title: "UX|UI designer",
      place: "Skvot · сертифікат",
      year: "2025",
      certificate: "https://lms.skvot.io/certificate/973ec20a3270e9c547625ad0c1c4400f",
    },
    {
      title: "Python для Data Science",
      place: "intellectum.university · сертифікат",
      year: "2026",
      certificate: "https://lms.intellectum.university/courses/python-data-science/certificate",
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
      issuerKind: "state",
      description: "Державна відзнака Президента України, яка вручається військовослужбовцям та працівникам правоохоронних органів за участь в обороні України.",
    },
    {
      icon: "defence-of-mykolaiv",
      title: "За оборону Миколаєва 2022",
      issuer: "Місто Миколаїв",
      issuerKind: "city",
      description: "Нагорода вручається за участь у захисті міста Миколаєва у 2022 році.",
    },
    {
      icon: "veteran-of-war",
      title: "Ветеран війни",
      issuer: "Україна",
      issuerKind: "state",
      description: "Державний знак, який вручається ветеранам разом з посвідченням учасника бойових дій, учасника війни або особи з інвалідністю внаслідок війни.",
    },
    {
      icon: "marine-brigade-36",
      title: "36 окрема бригада морської піхоти",
      issuer: "36 ОБрМП",
      issuerKind: "brigade",
      description: "Памʼятна медаль 36-ї окремої бригади морської піхоти ВМС ЗСУ за участь у Курській операції. На аверсі — емблема бригади з девізом «Борітеся — поборете» та написи «36 окрема бригада морської піхоти» і «Курська операція». На реверсі — емблема морської піхоти України (якір із мечем і тризубом), напис «За честь і вірність обовʼязку» та номер нагороди — № 298. Колодка обтягнута стрічкою темно-зеленого, синього, сірого й білого кольорів.",
    },
    {
      icon: "honour-and-loyalty",
      title: "За честь і вірність обовʼязку",
      issuer: "36 ОБрМП",
      issuerKind: "brigade",
      description: "Медаль морської піхоти за сумлінне виконання військового обовʼязку. У центрі — якір із крилами, символ морської піхоти.",
    },
    {
      icon: "military-service-veteran",
      title: "Ветеран військової служби",
      issuer: "Україна",
      issuerKind: "state",
      description: "Нагрудний знак у вигляді сріблястого дубового вінка; всередині — якір, крила, схрещені меч і ствол артилерійського знаряддя: символи різних родів військ.",
    },
  ],
  story: {
    sample: "Кейс-приклад: так виглядатиме проєкт, опублікований з робочого простору. Цифри й цитати поки ілюстративні.",
    contents: "Зміст",
    overview: "Коротко",
    challenge: "Задача",
    solution: "Рішення",
    outcome: "Результат",
    process: "Як я працював",
    research: "Дослідження",
    insights: "Інсайти",
    competitors: "Конкуренти",
    opportunities: "Можливості",
    flow: "Флоу",
    edgeCases: "Крайні випадки",
    screens: "Екрани",
    decisions: "Рішення і чому",
    why: "Чому",
    rejected: "Відкинуті варіанти",
    evidence: "Докази",
    results: "Результат",
    marks: { yes: "Є", partial: "Частково", no: "Немає" },
    redHint: "Червоне — можливість бути кращими",
  },
  contact: {
    title: "Є задача?",
    lead: "Розкажіть коротко про продукт і терміни — відповім протягом доби.",
    write: "Написати на пошту",
  },
  footer: { rights: "Усі права захищено", login: "Вхід", top: "Вгору", certificate: "Відкрити сертифікат", privacy: "Конфіденційність" },
  privacy: {
    title: "Конфіденційність",
    lede: "Що цей сайт дізнається про відвідувачів і навіщо. Коротко: лише знеособлену статистику, без імен, пошти й реклами.",
    sections: [
      {
        title: "Vercel Web Analytics",
        body: "Рахує перегляди сторінок, країну, тип пристрою й джерело переходу. Не використовує cookie й не впізнає вас між візитами. Працює завжди — дозвіл не потрібен.",
      },
      {
        title: "Google Analytics 4",
        body: "Показує, які кейси читають і як зі мною звʼязуються (натискання «Написати мені», завантаження резюме). Cookie Google Analytics записуються лише після вашої згоди. Без згоди Google отримує тільки знеособлені сигнали без cookie. Рекламні функції й Google Signals вимкнені.",
      },
      {
        title: "Що не збирається",
        body: "Імена, адреси пошти, номери телефонів, вміст форм і параметри посилань на сайт не передаються жодному сервісу.",
      },
      {
        // Requires the owner's (or a lawyer's) review before relying on it: docs/CLIENT_INTAKE.md §12.
        id: "requests",
        title: "Заявки на проєкт",
        body: `Коли ви надсилаєте заявку через форму «Обговорити проєкт», я отримую ваші контакти (ім'я, email і, якщо вкажете, компанію, посаду, телефон, Telegram, сайт) та відповіді про проєкт, зокрема бюджет і терміни. Вони потрібні лише для того, щоб розглянути заявку та зв'язатися з вами щодо цього проєкту. Дані зберігаються в базі даних Supabase; доступ до них маю тільки я. Вони не продаються й не передаються іншим компаніям для реклами. IP-адреса не зберігається — лише її знеособлений відбиток, щоб обмежити кількість заявок. Від спаму форму може захищати Cloudflare Turnstile. Чернетка форми зберігається лише у вашому браузері (без контактів) і видаляється після надсилання або через 7 днів. Щоб отримати копію своїх даних або видалити їх, напишіть на ${CONTACTS.email}.`,
      },
      {
        title: "Файли Figma",
        body: "Вікно з файлом Figma на сторінці кейсу завантажується лише після натискання «Завантажити файл тут». Тоді Figma може записати свої cookie за власними правилами.",
      },
      {
        title: "Ваш вибір",
        body: "Згоду можна змінити будь-коли кнопкою нижче. Вибір зберігається лише у вашому браузері.",
      },
    ],
    bannerText: "Сайт рахує відвідування без cookie. Дозволите Google Analytics — я краще бачитиму, які кейси вам цікаві.",
    accept: "Дозволити",
    decline: "Відмовитися",
    more: "Докладніше",
    manage: "Змінити вибір",
    stateGranted: "Зараз: Google Analytics дозволено.",
    stateDenied: "Зараз: Google Analytics вимкнено.",
    stateUnset: "Зараз: ви ще не обрали.",
    updated: "Оновлено 1 жовтня 2026",
  },
  seo: {
    home: {
      title: "Геннадій Федоров — продуктовий дизайнер, UI/UX",
      description:
        "Портфоліо продуктового дизайнера Геннадія Федорова: UX-дослідження, дизайн інтерфейсів, дизайн-системи, вебдизайн і мобільні застосунки. 7 років у вебі та продуктових командах.",
    },
    cases: {
      title: "Кейси з продуктового та UX-дизайну",
      description:
        "Кейси продуктового дизайну: від дослідження користувачів і аналізу конкурентів до флоу, екранів і рішень, переданих у розробку.",
    },
    about: {
      title: "Про мене — продуктовий дизайнер: підхід, досвід, навички",
      description:
        "Геннадій Федоров — продуктовий і UI/UX дизайнер. 7 років у продуктових командах: UX-дослідження, дизайн-системи з нуля, handoff і UI QA.",
    },
    notFound: { title: "Сторінку не знайдено", description: "Такої сторінки немає або її перенесли." },
    ogRole: "Продуктовий дизайнер",
    ogTopics: "UI/UX · дизайн-системи · UX-дослідження",
  },
  ui: {
    skip: "Перейти до вмісту",
    mainNav: "Основна навігація",
    footerNav: "Навігація в підвалі",
    home: "Головна",
    breadcrumbs: "Навігаційний ланцюжок",
    themeLight: "Увімкнути світлу тему",
    themeDark: "Увімкнути темну тему",
    notFoundTitle: "Сторінку не знайдено",
    notFoundBody: "Такої сторінки немає або її перенесли. Почніть з головної або перегляньте роботи.",
    notFoundHome: "На головну",
    notFoundWork: "Дивитися роботи",
    seeWork: "Дивитися роботи",
    writeVia: "Куди написати",
    copyEmail: "Скопіювати адресу",
    copied: "Скопійовано",
    toTop: "Вгору · прочитано {n}%",
  },
  adult: {
    badge: "18+",
    title: "Проєкт для аудиторії 18+",
    body: "Продукт розроблявся для дорослої аудиторії: у макетах можуть бути відверті зображення або теми. Підтвердіть, що вам уже є 18, щоб переглянути кейс.",
    confirm: "Мені є 18 — показати",
    back: "До всіх робіт",
  },
  project: {
    real: "Реальний проєкт",
    concept: "Концепт",
    sample: "Приклад",
    live: "Відкрити сайт проєкту",
    noLive: "Живого сайту немає — сторінки проєкту можна переглянути нижче.",
    conceptNote: "Це дизайн-концепт: продукт не запускався, сторінки проєкту можна переглянути нижче.",
    pages: "Сторінки проєкту",
    pagesLead: "Натисніть на сторінку, щоб переглянути її на весь екран. Гортати — стрілками.",
    figma: "Дизайн у Figma",
    figmaLead: "Робочий файл проєкту: макети, компоненти й прототип у тому вигляді, в якому я з ними працюю.",
    figmaLoad: "Завантажити файл тут",
    figmaOpen: "Відкрити у Figma",
    figmaFrame: "Файл проєкту у Figma",
    open: "Сторінка {n} з {total}",
    close: "Закрити",
    prev: "Попередня сторінка",
    next: "Наступна сторінка",
  },
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
      "Since 22 February 2022 I have served in the Armed Forces of Ukraine — among the first to stand up for my country and my home city of Mykolaiv. Service taught me what good design does too: clear communication, processes that hold under pressure, and ownership of the outcome. I keep fighting — in design as well.",
    awards: "Awards",
    skills: "Skills",
    education: "Education",
    languages: "Languages",
    availability: "Working terms",
    download: "Download CV (PDF)",
    eyebrow: "Product / UI-UX designer · Mykolaiv, remote",
    facts: [
      { value: "7", label: "years in web and product teams" },
      { value: "2", label: "design systems built from scratch" },
      { value: "2", label: "designers mentored" },
    ],
    approach: "How I work",
    approachLead: "From questions to a product the team can evolve without me. Every step leaves an artefact the next one can rely on.",
    steps: [
      {
        title: "Research",
        text: "User interviews, competitor analysis, clickable prototypes. Decisions rest on what people do, not on guesses.",
      },
      {
        title: "Structure and flows",
        text: "Information architecture and user journeys from onboarding to payment, with every state: loading, empty, error.",
      },
      {
        title: "Design system",
        text: "Tokens, components, responsive grids and upkeep rules. New screens come together faster and the interface stays predictable.",
      },
      {
        title: "Handoff and UI QA",
        text: "Specs developers read without questions, and a check of the build before release: what was designed is what ships.",
      },
    ],
    ctaTitle: "Let's work together",
    ctaText: "Open to project work or part-time, 20 hours a week. Tell me about your product and I'll reply within a day.",
  },
  jobs: [
    {
      period: "22.02.2022 — now",
      title: "Signals specialist",
      place: "Armed Forces of Ukraine",
      military: true,
      points: [
        "Run communications for my unit",
        "Wrote company command procedures",
        "Train personnel",
        "Decorated (2022, 2024)",
      ],
      details: [
        "Run my unit's communications: deploying signal points, setting up, diagnosing and repairing equipment.",
        "Built and documented company command procedures — regulations, reporting, how information passes between units.",
        "Train personnel on communications equipment. Decorated (2022, 2024).",
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
      details: [
        "End-to-end product design: research, information architecture, Figma prototypes, handoff, UI QA.",
        "Led two designers: goals, regular 1:1s, work reviews, growth plans.",
        "Built the design system: tokens, component libraries, rules for updates and upkeep.",
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
      details: [
        "Designed the end-to-end user journey: onboarding, paywall and subscriptions, catalog, viewing, profiles.",
        "Built a design system from scratch — tokens, components, states, responsive grids — and cut the time to new screens.",
        "Designed the creator dashboard: content analytics, subscription management, payouts.",
        "Research: user interviews, clickable prototypes, quick iterations to the final UI.",
      ],
    },
    {
      period: "05.2019 — 08.2021",
      title: "UI/UX & Web Designer",
      place: "Veronikalove · Mykolaiv (part-time)",
      points: ["Websites and apps", "Email campaigns", "Motion"],
      details: ["Websites and mobile apps, email campaigns, light interface motion."],
    },
    {
      period: "2016 — 2019",
      title: "Web designer",
      place: "Dizz agency (Kyiv), SugarTheme (Mykolaiv)",
      points: ["ThemeForest templates", "Landing pages", "Brand identity"],
      details: ["Multi-page ThemeForest templates, responsive design, landing pages, brand identity."],
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
    {
      title: "UX|UI designer",
      place: "Skvot · certificate",
      year: "2025",
      certificate: "https://lms.skvot.io/certificate/973ec20a3270e9c547625ad0c1c4400f",
    },
    {
      title: "Python for Data Science",
      place: "intellectum.university · certificate",
      year: "2026",
      certificate: "https://lms.intellectum.university/courses/python-data-science/certificate",
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
      issuerKind: "state",
      description: "A state award of the President of Ukraine, given to service members and law-enforcement officers for taking part in the defence of Ukraine.",
    },
    {
      icon: "defence-of-mykolaiv",
      title: "For the Defence of Mykolaiv 2022",
      issuer: "City of Mykolaiv",
      issuerKind: "city",
      description: "Awarded for taking part in the defence of the city of Mykolaiv in 2022.",
    },
    {
      icon: "veteran-of-war",
      title: "War Veteran",
      issuer: "Ukraine",
      issuerKind: "state",
      description: "A state badge given to veterans together with the certificate of a combatant, a war participant or a person disabled as a result of the war.",
    },
    {
      icon: "marine-brigade-36",
      title: "36th Separate Marine Brigade",
      issuer: "36th Separate Marine Brigade",
      issuerKind: "brigade",
      description: "Commemorative medal of the 36th Separate Marine Brigade of the Ukrainian Navy for taking part in the Kursk operation. The obverse carries the brigade emblem with the motto “Fight and you will prevail” and the inscriptions “36th Separate Marine Brigade” and “Kursk operation”. The reverse shows the emblem of the Ukrainian Marine Corps (an anchor with a sword and the trident), the words “For honour and loyalty to duty” and the award number, No. 298. The ribbon is dark green, blue, grey and white.",
    },
    {
      icon: "honour-and-loyalty",
      title: "For Honour and Loyalty to Duty",
      issuer: "36th Separate Marine Brigade",
      issuerKind: "brigade",
      description: "Marine Corps medal for conscientious military service. In the centre, a winged anchor, the symbol of the marines.",
    },
    {
      icon: "military-service-veteran",
      title: "Veteran of Military Service",
      issuer: "Ukraine",
      issuerKind: "state",
      description: "A breast badge shaped as a silver oak wreath with an anchor, wings, a crossed sword and gun barrel inside: symbols of the different branches of the armed forces.",
    },
  ],
  story: {
    sample: "Sample case: this is how a project published from the workspace will look. Numbers and quotes are illustrative for now.",
    contents: "Contents",
    overview: "In short",
    challenge: "Challenge",
    solution: "Solution",
    outcome: "Outcome",
    process: "How I worked",
    research: "Research",
    insights: "Insights",
    competitors: "Competitors",
    opportunities: "Opportunities",
    flow: "Flow",
    edgeCases: "Edge cases",
    screens: "Screens",
    decisions: "Decisions and why",
    why: "Why",
    rejected: "Rejected options",
    evidence: "Evidence",
    results: "Results",
    marks: { yes: "Yes", partial: "Partly", no: "No" },
    redHint: "Red — a chance to do better",
  },
  contact: {
    title: "Have a project?",
    lead: "Tell me briefly about the product and the timeline — I'll reply within a day.",
    write: "Email me",
  },
  footer: { rights: "All rights reserved", login: "Sign in", top: "Back to top", certificate: "Open certificate", privacy: "Privacy" },
  privacy: {
    title: "Privacy",
    lede: "What this site learns about visitors and why. In short: anonymous statistics only — no names, no email, no ads.",
    sections: [
      {
        title: "Vercel Web Analytics",
        body: "Counts page views, country, device type and referrer. It uses no cookies and does not recognise you between visits. Always on — no consent needed.",
      },
      {
        title: "Google Analytics 4",
        body: "Shows which cases people read and how they get in touch (clicking «Write to me», downloading the CV). Google Analytics cookies are set only after you agree. Without consent Google receives only anonymous, cookieless signals. Advertising features and Google Signals are off.",
      },
      {
        title: "What is not collected",
        body: "Names, email addresses, phone numbers, form contents and link parameters are not sent to any service.",
      },
      {
        // Requires the owner's (or a lawyer's) review before relying on it: docs/CLIENT_INTAKE.md §12.
        id: "requests",
        title: "Project requests",
        body: `When you send a request through the “Discuss a project” form, I receive your contact details (name, email and, if you add them, company, role, phone, Telegram, website) and your answers about the project, including budget and timeline. They are used only to review the request and to contact you about this project. The data is stored in a Supabase database that only I can access. It is not sold or shared with other companies for advertising. Your IP address is not stored — only an anonymised fingerprint used to limit the number of requests. The form may be protected from spam by Cloudflare Turnstile. The form draft is kept only in your browser (without contact details) and is removed after you send it or after 7 days. To get a copy of your data or have it deleted, write to ${CONTACTS.email}.`,
      },
      {
        title: "Figma files",
        body: "The Figma window on a case page loads only after you click “Load the file here”. Figma may then set its own cookies under its own rules.",
      },
      {
        title: "Your choice",
        body: "You can change your consent at any time with the button below. The choice is stored only in your browser.",
      },
    ],
    bannerText: "This site counts visits without cookies. Allow Google Analytics and I'll see better which cases interest you.",
    accept: "Allow",
    decline: "Decline",
    more: "Details",
    manage: "Change my choice",
    stateGranted: "Now: Google Analytics is allowed.",
    stateDenied: "Now: Google Analytics is off.",
    stateUnset: "Now: you have not chosen yet.",
    updated: "Updated 1 October 2026",
  },
  seo: {
    home: {
      title: "Hennadii Fedorov — Product Designer, UI/UX",
      description:
        "Portfolio of product designer Hennadii Fedorov: UX research, interface design, design systems, web and mobile app design. 7 years in web and product teams.",
    },
    cases: {
      title: "Product and UX design case studies",
      description:
        "Product design case studies: from user research and competitor analysis to flows, screens and decisions handed off to development.",
    },
    about: {
      title: "About — product designer: approach, experience, skills",
      description:
        "Hennadii Fedorov, product and UI/UX designer. 7 years in product teams: UX research, design systems from scratch, handoff and UI QA.",
    },
    notFound: { title: "Page not found", description: "This page does not exist or has moved." },
    ogRole: "Product Designer",
    ogTopics: "UI/UX · design systems · UX research",
  },
  ui: {
    skip: "Skip to content",
    mainNav: "Main navigation",
    footerNav: "Footer navigation",
    home: "Home",
    breadcrumbs: "Breadcrumbs",
    themeLight: "Switch to light theme",
    themeDark: "Switch to dark theme",
    notFoundTitle: "Page not found",
    notFoundBody: "This page does not exist or has moved. Start from the home page or browse the work.",
    notFoundHome: "Home page",
    notFoundWork: "See the work",
    seeWork: "See the work",
    writeVia: "Where to write",
    copyEmail: "Copy address",
    copied: "Copied",
    toTop: "Back to top · {n}% read",
  },
  adult: {
    badge: "18+",
    title: "Made for an 18+ audience",
    body: "This product was designed for adults: the mockups may contain explicit images or themes. Confirm you are 18 or older to view the case.",
    confirm: "I am 18+, show it",
    back: "All work",
  },
  project: {
    real: "Real project",
    concept: "Concept",
    sample: "Sample",
    live: "Open the live site",
    noLive: "There is no live site — browse the project pages below.",
    conceptNote: "This is a design concept: the product was not launched, browse the project pages below.",
    pages: "Project pages",
    pagesLead: "Click a page to view it full screen. Use the arrow keys to flip through.",
    figma: "Design in Figma",
    figmaLead: "The working file of the project: mockups, components and the prototype as I work with them.",
    figmaLoad: "Load the file here",
    figmaOpen: "Open in Figma",
    figmaFrame: "Project file in Figma",
    open: "Page {n} of {total}",
    close: "Close",
    prev: "Previous page",
    next: "Next page",
  },
  cases_list: [],
};

// ---------------------------------------------------------------------
// Placeholder cases (same structure in both languages).
// ---------------------------------------------------------------------
uk.cases_list = [
  neuralUk,
  {
    slug: "wgroup-design-system",
    kind: "real",
    sample: true,
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
    kind: "concept",
    sample: true,
    story: restaurantUk,
    gallery: [
      { src: "/cases/restaurant-booking/01-occasion.svg", alt: "Екран вибору приводу: шість сценаріїв плиткою", caption: "Вибір приводу", device: "mobile", width: 390, height: 844 },
      { src: "/cases/restaurant-booking/02-picks.svg", alt: "Підбірка ресторанів з вільними слотами в картках", caption: "Підбірка з вільними слотами", device: "mobile", width: 390, height: 844 },
      { src: "/cases/restaurant-booking/03-booking.svg", alt: "Екран броні з деталями й кнопкою «Забронювати»", caption: "Бронь", device: "mobile", width: 390, height: 844 },
      { src: "/cases/restaurant-booking/04-confirmed.svg", alt: "Підтвердження броні з додаванням у календар", caption: "Підтвердження", device: "mobile", width: 390, height: 844 },
    ],
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
    kind: "real",
    story: workspaceUk,
    gallery: workspaceGalleryUk,
    cover: workspaceGalleryUk[0],
    sticker: "var(--s3)",
    year: "2026",
    title: "Робочий простір продуктового дизайнера",
    client: "Власний продукт",
    role: "Продукт, дизайн і розробка",
    summary:
      "Інструмент, де дослідження, сценарії, екрани й рішення пов'язані в один ланцюжок — і кожне рішення має «чому». З нього публікуються кейси на цей сайт.",
    tags: ["Власний продукт", "Трасування рішень", "Next.js · Supabase"],
    metrics: [
      { value: "9", label: "етапів у ланцюжку проєкту" },
      { value: "8", label: "типів кроків у редакторі сценаріїв" },
      { value: "196", label: "автоматичних перевірок бази" },
    ],
    sections: [
      { title: "Задача", body: workspaceUk.overview.challenge },
      { title: "Рішення", body: workspaceUk.overview.solution },
      { title: "Результат", body: workspaceUk.overview.outcome },
    ],
  },
];

en.cases_list = [
  neuralEn,
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
    story: restaurantEn,
    gallery: [
      { src: "/cases/restaurant-booking/01-occasion-en.svg", alt: "Occasion screen: six scenarios as tiles", caption: "Pick an occasion", device: "mobile", width: 390, height: 844 },
      { src: "/cases/restaurant-booking/02-picks-en.svg", alt: "Restaurant picks with free slots in the cards", caption: "Picks with free slots", device: "mobile", width: 390, height: 844 },
      { src: "/cases/restaurant-booking/03-booking-en.svg", alt: "Booking screen with details and a Book button", caption: "Booking", device: "mobile", width: 390, height: 844 },
      { src: "/cases/restaurant-booking/04-confirmed-en.svg", alt: "Booking confirmation with Add to calendar", caption: "Confirmation", device: "mobile", width: 390, height: 844 },
    ],
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
    story: workspaceEn,
    gallery: workspaceGalleryEn,
    cover: workspaceGalleryEn[0],
    title: "Product designer workspace",
    client: "Own product",
    role: "Product, design & development",
    summary:
      "A tool where research, flows, screens and decisions form one chain — and every decision has a “why”. The case studies on this site are published from it.",
    tags: ["Own product", "Decision tracing", "Next.js · Supabase"],
    metrics: [
      { value: "9", label: "stages in the project chain" },
      { value: "8", label: "step types in the flow editor" },
      { value: "196", label: "automated database checks" },
    ],
    sections: [
      { title: "Problem", body: workspaceEn.overview.challenge },
      { title: "Solution", body: workspaceEn.overview.solution },
      { title: "Outcome", body: workspaceEn.overview.outcome },
    ],
  },
];

export const DICTIONARIES: Record<Locale, Dictionary> = { uk, en };

export function dict(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}
