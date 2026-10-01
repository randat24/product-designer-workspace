// Copy of the project request form («Обговорити проєкт»), uk and en.
// Option labels (types, goals, scope…) are shared with the workspace: src/domains/requests/labels.ts.

import type { Locale } from "../content";

type Field = { label: string; hint?: string; placeholder?: string };
type RowKey =
  | "name" | "email" | "company" | "role" | "phone" | "telegram" | "website" | "channel" | "projectName" | "types"
  | "summary" | "whatItDoes" | "problem" | "whyNow" | "goals" | "url" | "description" | "worksWell" | "dislikes"
  | "mustChange" | "links" | "audience" | "primaryUsers" | "geography" | "market" | "demographics" | "painPoints"
  | "items" | "range" | "note" | "start" | "deadline" | "reason";

export type IntakeCopy = {
  seo: { title: string; description: string };
  cta: string;
  intro: { eyebrow: string; title: string; lead: string; points: string[]; time: string; start: string };
  draft: { title: string; text: string; resume: string; restart: string; saved: string };
  progress: (n: number, total: number) => string;
  nav: { back: string; next: string; review: string; toReview: string };
  optional: string;
  required: string;
  errors: Record<string, string> & { summary: string; generic: string };
  steps: {
    project: { title: string; lead: string; types: Field; typeOther: Field; name: Field; nameUnknown: string };
    existing: {
      title: string; lead: string; has: Field; yes: string; no: string; url: Field; description: Field; worksWell: Field;
      dislikes: Field; mustChange: Field; links: Field; addLink: string; noPasswords: string;
    };
    about: { title: string; lead: string; summary: Field; whatItDoes: Field; problem: Field; whyNow: Field; goals: Field; goalOther: Field };
    audience: { title: string; lead: string; audience: Field; primaryUsers: Field; geography: Field; market: Field; demographics: Field; painPoints: Field };
    competitors: {
      title: string; lead: string; knows: Field; yes: string; no: string; competitor: string; name: Field; url: Field; likes: Field;
      dislikes: Field; why: Field; add: string; remove: string; references: Field; referenceUrl: Field; referenceNote: Field; addReference: string;
    };
    scope: { title: string; lead: string; items: Field; advice: string; adviceHint: string };
    materials: { title: string; lead: string; items: Field; links: Field; addLink: string; filesNote: string };
    budget: {
      title: string; lead: string; range: Field; currency: Field; min: Field; max: Field; note: Field; start: Field;
      deadline: Field; yes: string; no: string; deadlineDate: Field; deadlineReason: Field;
    };
    contact: {
      title: string; lead: string; name: Field; email: Field; company: Field; role: Field; phone: Field; telegram: Field;
      website: Field; channel: Field; channelNote: Field; additional: Field;
    };
  };
  review: {
    title: string; lead: string; edit: string; empty: string;
    sections: Record<"client" | "project" | "existing" | "goals" | "audience" | "competitors" | "references" | "scope" | "materials" | "budget" | "timeline" | "additional", string>;
    rows: Record<RowKey, string>;
    consent: string; consentLink: string; submit: string; submitting: string; noExisting: string; noCompetitors: string;
    advice: string; deadlineNone: string;
  };
  done: {
    title: string; lead: string; code: string; date: string; project: string; noName: string; download: string; share: string;
    shareText: string; nextTitle: string; next: string[]; home: string; tokenNote: string; duplicate: string;
  };
  failed: Record<"spam" | "captcha" | "rate_limit" | "unavailable" | "server" | "validation", string>;
  remove: string;
  removeItem: (n: number) => string;
  linkKind: string;
  linkUrl: string;
};

const uk: IntakeCopy = {
  seo: {
    title: "Обговорити проєкт — дизайн продукту, сайту чи застосунку",
    description: "Розкажіть про продукт, сайт чи застосунок у кількох кроках. Я отримаю структурований бриф і повернуся з питаннями та наступними кроками.",
  },
  cta: "Обговорити проєкт",
  intro: {
    eyebrow: "Заявка на проєкт",
    title: "Обговорімо ваш проєкт",
    lead: "Кілька коротких кроків замість довгого листа. Відповідайте своїми словами: точні терміни не потрібні, а все необов'язкове можна пропустити.",
    points: [
      "Відповіді збираються в бриф проєкту — ви отримаєте його копію в PDF.",
      "Чернетка зберігається в цьому браузері: можна повернутися пізніше.",
      "Не надсилайте паролі та доступи — вони не потрібні на цьому етапі.",
    ],
    time: "Приблизно 10–15 хвилин",
    start: "Почати",
  },
  draft: {
    title: "У вас є незавершена заявка",
    text: "Відповіді з цього браузера збережено. Контакти з міркувань приватності не зберігаються — їх треба буде ввести знову.",
    resume: "Продовжити з місця, де зупинились",
    restart: "Почати заново",
    saved: "Чернетку збережено в цьому браузері",
  },
  progress: (n, total) => `Крок ${n} з ${total}`,
  nav: { back: "Назад", next: "Далі", review: "Перевірити заявку", toReview: "Повернутися до перевірки" },
  optional: "необов'язково",
  required: "обов'язково",
  errors: {
    summary: "Перевірте поля з помилками:",
    generic: "Перевірте це поле",
    required: "Заповніть це поле",
    too_long: "Задовгий текст — скоротіть, будь ласка",
    invalid_url: "Посилання має виглядати як example.com або https://example.com",
    invalid_email: "Перевірте адресу пошти, наприклад name@example.com",
    invalid_phone: "Номер може містити цифри, пробіли, «+», «-» і дужки",
    too_many: "Забагато пунктів — залиште найважливіші",
    pick_one: "Оберіть хоча б один варіант",
    invalid_date: "Вкажіть дату",
    invalid_budget: "Перевірте суму: «до» не може бути меншою за «від»",
    consent: "Потрібна ваша згода, щоб я міг розглянути заявку",
  },
  steps: {
    project: {
      title: "Що потрібно зробити?",
      lead: "Оберіть усе, що підходить.",
      types: { label: "Тип роботи" },
      typeOther: { label: "Що саме?", placeholder: "Наприклад: чат-бот для підтримки" },
      name: { label: "Назва проєкту", placeholder: "Наприклад: Stefa Books" },
      nameUnknown: "У проєкту ще немає назви",
    },
    existing: {
      title: "Чи існує продукт уже зараз?",
      lead: "Якщо є чинний сайт чи застосунок, розкажіть, що в ньому працює, а що — ні.",
      has: { label: "Продукт уже існує" },
      yes: "Так, існує", no: "Ні, починаємо з нуля",
      url: { label: "Адреса продукту", placeholder: "example.com" },
      description: { label: "Що це за продукт зараз?", hint: "Кількома реченнями: для кого він і що вміє." },
      worksWell: { label: "Що працює добре?" },
      dislikes: { label: "Що не подобається в чинному рішенні?" },
      mustChange: { label: "Що обов'язково треба змінити?" },
      links: { label: "Інші посилання", hint: "App Store, Google Play, Figma, Behance — що є." },
      addLink: "Додати посилання",
      noPasswords: "Не надсилайте паролі чи доступи — посилань достатньо.",
    },
    about: {
      title: "Розкажіть про проєкт",
      lead: "Своїми словами — так, як пояснили б знайомому.",
      summary: { label: "Коротко про проєкт", hint: "Що це і для чого — 2–3 речення." },
      whatItDoes: { label: "Що робить продукт чи сервіс?" },
      problem: { label: "Яку проблему він розв'язує?", hint: "Для людей, які ним користуються, або для бізнесу." },
      whyNow: { label: "Чому дизайн потрібен саме зараз?", hint: "Запуск, скарги користувачів, падіння продажів, новий етап компанії…" },
      goals: { label: "Головні цілі" },
      goalOther: { label: "Інша ціль" },
    },
    audience: {
      title: "Хто користуватиметься продуктом?",
      lead: "Ніякої спеціальної термінології — опишіть людей так, як ви їх бачите.",
      audience: { label: "Цільова аудиторія", hint: "Наприклад: батьки дітей 3–10 років, які купують книжки онлайн." },
      primaryUsers: { label: "Хто користується найчастіше?", hint: "Якщо ролей кілька: покупці, менеджери, адміністратори…" },
      geography: { label: "Географія / ринок", placeholder: "Україна, ЄС, США…" },
      market: { label: "Для кого продукт" },
      demographics: { label: "Вік, професія чи інші ознаки", hint: "Лише якщо це важливо для продукту." },
      painPoints: { label: "Що заважає цим людям сьогодні?", hint: "Їхні труднощі, скарги, на що витрачають забагато часу." },
    },
    competitors: {
      title: "Конкуренти й приклади",
      lead: "Це допоможе зрозуміти ринок. Не знаєте конкурентів — нічого страшного, я їх знайду.",
      knows: { label: "Чи знаєте ви своїх конкурентів?" },
      yes: "Так, знаю", no: "Ні або не впевнений",
      competitor: "Конкурент",
      name: { label: "Назва" },
      url: { label: "Сайт", placeholder: "example.com" },
      likes: { label: "Що у них подобається?" },
      dislikes: { label: "Що не подобається?" },
      why: { label: "Чому це конкурент?" },
      add: "Додати конкурента",
      remove: "Прибрати",
      references: { label: "Продукти чи сайти, дизайн яких вам подобається", hint: "Не обов'язково з вашої галузі." },
      referenceUrl: { label: "Посилання", placeholder: "example.com" },
      referenceNote: { label: "Що саме подобається?" },
      addReference: "Додати приклад",
    },
    scope: {
      title: "Що ви очікуєте від роботи?",
      lead: "Оберіть, що вже знаєте. Якщо не впевнені — це нормально.",
      items: { label: "Послуги" },
      advice: "Не знаю — потрібна ваша порада",
      adviceHint: "Я запропоную обсяг робіт після знайомства з проєктом.",
    },
    materials: {
      title: "Що вже є?",
      lead: "Все, що може допомогти на старті.",
      items: { label: "Матеріали" },
      links: { label: "Посилання на матеріали", hint: "Figma, Google Drive, Dropbox, Notion — з доступом на перегляд." },
      addLink: "Додати посилання",
      filesNote: "Файли надішлете пізніше, коли домовимося, — тут досить посилань.",
    },
    budget: {
      title: "Бюджет і терміни",
      lead: "Орієнтир допоможе запропонувати реалістичний обсяг робіт. Ці дані бачу лише я.",
      range: { label: "Який бюджет ви запланували на проєкт?" },
      currency: { label: "Валюта" },
      min: { label: "Від" },
      max: { label: "До" },
      note: { label: "Коментар до бюджету" },
      start: { label: "Коли хотіли б почати?" },
      deadline: { label: "Чи є дедлайн?" },
      yes: "Так", no: "Ні",
      deadlineDate: { label: "Дата дедлайну" },
      deadlineReason: { label: "З чим пов'язаний дедлайн?", placeholder: "Запуск продукту, презентація інвесторам…" },
    },
    contact: {
      title: "Як з вами зв'язатися?",
      lead: "Останній крок перед перевіркою.",
      name: { label: "Ім'я" },
      email: { label: "Email", placeholder: "name@example.com" },
      company: { label: "Компанія" },
      role: { label: "Посада / роль" },
      phone: { label: "Телефон", placeholder: "+380…" },
      telegram: { label: "Telegram", placeholder: "@username" },
      website: { label: "Сайт компанії", placeholder: "example.com" },
      channel: { label: "Як зручніше спілкуватися?" },
      channelNote: { label: "Як саме?" },
      additional: {
        label: "Що ще варто знати?",
        hint: "Обмеження бізнесу чи технологій, важливі функції, побажання щодо дизайну, попередній досвід, вимоги інших учасників.",
      },
    },
  },
  review: {
    title: "Перевірте заявку",
    lead: "Так виглядатиме бриф проєкту. Будь-який розділ можна змінити.",
    edit: "Змінити",
    empty: "—",
    sections: {
      client: "Клієнт", project: "Проєкт", existing: "Чинний продукт", goals: "Цілі", audience: "Аудиторія",
      competitors: "Конкуренти", references: "Приклади", scope: "Обсяг робіт", materials: "Матеріали", budget: "Бюджет",
      timeline: "Терміни", additional: "Додатково",
    },
    rows: {
      name: "Ім'я", email: "Email", company: "Компанія", role: "Роль", phone: "Телефон", telegram: "Telegram", website: "Сайт",
      channel: "Зв'язок", projectName: "Назва", types: "Тип роботи", summary: "Коротко", whatItDoes: "Що робить",
      problem: "Проблема", whyNow: "Чому зараз", goals: "Цілі", url: "Адреса", description: "Опис", worksWell: "Працює добре",
      dislikes: "Не подобається", mustChange: "Треба змінити", links: "Посилання", audience: "Аудиторія", primaryUsers: "Основні користувачі",
      geography: "Географія", market: "Ринок", demographics: "Демографія", painPoints: "Труднощі користувачів", items: "Обрано",
      range: "Бюджет", note: "Коментар", start: "Старт", deadline: "Дедлайн", reason: "Причина",
    },
    consent: "Я погоджуюся, що надана інформація буде використана для розгляду заявки та зв'язку зі мною щодо цього проєкту.",
    consentLink: "Політика конфіденційності",
    submit: "Надіслати заявку",
    submitting: "Надсилаю…",
    noExisting: "Ні, починаємо з нуля",
    noCompetitors: "Не вказано",
    advice: "Потрібна порада щодо обсягу робіт",
    deadlineNone: "Немає",
  },
  done: {
    title: "Дякую! Заявку отримано",
    lead: "Бриф проєкту підготовлено й надіслано мені — нічого пересилати не потрібно.",
    code: "Номер заявки",
    date: "Дата",
    project: "Проєкт",
    noName: "Без назви",
    download: "Завантажити бриф (PDF)",
    share: "Поділитися брифом",
    shareText: "Бриф проєкту",
    nextTitle: "Що далі",
    next: [
      "Я перегляну інформацію про проєкт.",
      "Можу написати з уточнювальними питаннями.",
      "Ми домовимося про обсяг робіт, терміни й бюджет.",
      "Після цього проєкт переходить у роботу.",
    ],
    home: "На головну",
    tokenNote: "Посилання на бриф діє 30 днів — збережіть PDF собі.",
    duplicate: "Цю заявку вже було надіслано — показую її ще раз.",
  },
  failed: {
    spam: "Не вдалося надіслати заявку. Спробуйте ще раз за хвилину.",
    captcha: "Не вдалося підтвердити, що ви не робот. Оновіть сторінку й спробуйте ще раз — відповіді збережено.",
    rate_limit: "Забагато заявок з цієї мережі. Спробуйте пізніше або напишіть мені напряму.",
    unavailable: "Форма тимчасово недоступна. Напишіть мені напряму — відповіді збережено в чернетці.",
    server: "Щось пішло не так. Спробуйте ще раз — відповіді збережено.",
    validation: "Деякі відповіді треба виправити.",
  },
  remove: "Прибрати",
  removeItem: (n) => `Прибрати пункт ${n}`,
  linkKind: "Тип",
  linkUrl: "Посилання",
};

const en: IntakeCopy = {
  seo: {
    title: "Discuss a project — product, website and app design",
    description: "Describe your product, website or app in a few short steps. I get a structured brief and come back with questions and next steps.",
  },
  cta: "Discuss a project",
  intro: {
    eyebrow: "Project request",
    title: "Let's discuss your project",
    lead: "A few short steps instead of a long email. Answer in your own words: no jargon needed, and anything optional can be skipped.",
    points: [
      "Your answers become a project brief — you get a PDF copy.",
      "A draft is kept in this browser, so you can come back later.",
      "Do not send passwords or access details — they are not needed at this stage.",
    ],
    time: "About 10–15 minutes",
    start: "Start",
  },
  draft: {
    title: "You have an unfinished request",
    text: "Answers from this browser are saved. For privacy, contact details are not kept — you'll enter them again.",
    resume: "Continue where you left off",
    restart: "Start over",
    saved: "Draft saved in this browser",
  },
  progress: (n, total) => `Step ${n} of ${total}`,
  nav: { back: "Back", next: "Continue", review: "Review request", toReview: "Back to review" },
  optional: "optional",
  required: "required",
  errors: {
    summary: "Please check these fields:",
    generic: "Please check this field",
    required: "Please fill this in",
    too_long: "This is too long — please shorten it",
    invalid_url: "A link should look like example.com or https://example.com",
    invalid_email: "Please check the email, e.g. name@example.com",
    invalid_phone: "A phone number can contain digits, spaces, “+”, “-” and brackets",
    too_many: "Too many items — keep the most important ones",
    pick_one: "Choose at least one option",
    invalid_date: "Please pick a date",
    invalid_budget: "Please check the amount: “to” cannot be less than “from”",
    consent: "I need your consent to review the request",
  },
  steps: {
    project: {
      title: "What do you need?",
      lead: "Choose everything that applies.",
      types: { label: "Type of work" },
      typeOther: { label: "What exactly?", placeholder: "E.g. a support chatbot" },
      name: { label: "Project name", placeholder: "E.g. Stefa Books" },
      nameUnknown: "I don't have a project name yet",
    },
    existing: {
      title: "Does the product already exist?",
      lead: "If there is a current website or app, tell me what works and what doesn't.",
      has: { label: "The product exists" },
      yes: "Yes, it exists", no: "No, starting from scratch",
      url: { label: "Product URL", placeholder: "example.com" },
      description: { label: "What is the product today?", hint: "A few sentences: who it is for and what it does." },
      worksWell: { label: "What works well?" },
      dislikes: { label: "What do you dislike about the current solution?" },
      mustChange: { label: "What must change?" },
      links: { label: "Other links", hint: "App Store, Google Play, Figma, Behance — whatever you have." },
      addLink: "Add link",
      noPasswords: "Do not send passwords or access details — links are enough.",
    },
    about: {
      title: "Tell me about the project",
      lead: "In your own words — the way you would explain it to a friend.",
      summary: { label: "Short project description", hint: "What it is and what it is for — 2–3 sentences." },
      whatItDoes: { label: "What does the product or service do?" },
      problem: { label: "What problem does it solve?", hint: "For the people who use it, or for the business." },
      whyNow: { label: "Why do you need design right now?", hint: "A launch, user complaints, falling sales, a new stage for the company…" },
      goals: { label: "Main goals" },
      goalOther: { label: "Other goal" },
    },
    audience: {
      title: "Who will use the product?",
      lead: "No special terms needed — describe the people the way you see them.",
      audience: { label: "Target audience", hint: "E.g. parents of children aged 3–10 who buy books online." },
      primaryUsers: { label: "Who uses it most?", hint: "If there are several roles: buyers, managers, admins…" },
      geography: { label: "Geography / market", placeholder: "Ukraine, EU, US…" },
      market: { label: "Who is the product for" },
      demographics: { label: "Age, profession or other traits", hint: "Only if it matters for the product." },
      painPoints: { label: "What gets in these people's way today?", hint: "Their difficulties, complaints, what takes them too long." },
    },
    competitors: {
      title: "Competitors and examples",
      lead: "This helps me understand the market. Don't know your competitors? That's fine — I'll find them.",
      knows: { label: "Do you know your competitors?" },
      yes: "Yes", no: "No or not sure",
      competitor: "Competitor",
      name: { label: "Name" },
      url: { label: "Website", placeholder: "example.com" },
      likes: { label: "What do you like about them?" },
      dislikes: { label: "What do you dislike?" },
      why: { label: "Why is it a competitor?" },
      add: "Add competitor",
      remove: "Remove",
      references: { label: "Products or websites whose design you like", hint: "They don't have to be from your industry." },
      referenceUrl: { label: "Link", placeholder: "example.com" },
      referenceNote: { label: "What specifically do you like about it?" },
      addReference: "Add example",
    },
    scope: {
      title: "What do you expect from the work?",
      lead: "Choose what you already know. If you're not sure, that's normal.",
      items: { label: "Services" },
      advice: "I don't know — I need your recommendation",
      adviceHint: "I'll suggest the scope after learning about the project.",
    },
    materials: {
      title: "What already exists?",
      lead: "Anything that can help at the start.",
      items: { label: "Materials" },
      links: { label: "Links to materials", hint: "Figma, Google Drive, Dropbox, Notion — with view access." },
      addLink: "Add link",
      filesNote: "Files can come later, once we agree — links are enough here.",
    },
    budget: {
      title: "Budget and timeline",
      lead: "A rough figure helps me suggest a realistic scope. Only I see it.",
      range: { label: "What budget range have you planned for the project?" },
      currency: { label: "Currency" },
      min: { label: "From" },
      max: { label: "To" },
      note: { label: "Comment on the budget" },
      start: { label: "When would you like to start?" },
      deadline: { label: "Is there a deadline?" },
      yes: "Yes", no: "No",
      deadlineDate: { label: "Deadline date" },
      deadlineReason: { label: "What is the deadline about?", placeholder: "Product launch, investor presentation…" },
    },
    contact: {
      title: "How can I reach you?",
      lead: "The last step before the review.",
      name: { label: "Name" },
      email: { label: "Email", placeholder: "name@example.com" },
      company: { label: "Company" },
      role: { label: "Role / position" },
      phone: { label: "Phone", placeholder: "+44…" },
      telegram: { label: "Telegram", placeholder: "@username" },
      website: { label: "Company website", placeholder: "example.com" },
      channel: { label: "Preferred way to talk" },
      channelNote: { label: "How exactly?" },
      additional: {
        label: "Anything else I should know?",
        hint: "Business or technical constraints, key features, design preferences, past problems, stakeholder requirements.",
      },
    },
  },
  review: {
    title: "Review your request",
    lead: "This is how the project brief will look. Any section can be changed.",
    edit: "Edit",
    empty: "—",
    sections: {
      client: "Client", project: "Project", existing: "Current product", goals: "Goals", audience: "Audience",
      competitors: "Competitors", references: "References", scope: "Scope", materials: "Materials", budget: "Budget",
      timeline: "Timeline", additional: "Additional information",
    },
    rows: {
      name: "Name", email: "Email", company: "Company", role: "Role", phone: "Phone", telegram: "Telegram", website: "Website",
      channel: "Contact via", projectName: "Name", types: "Type of work", summary: "Summary", whatItDoes: "What it does",
      problem: "Problem", whyNow: "Why now", goals: "Goals", url: "URL", description: "Description", worksWell: "Works well",
      dislikes: "Dislikes", mustChange: "Must change", links: "Links", audience: "Audience", primaryUsers: "Primary users",
      geography: "Geography", market: "Market", demographics: "Demographics", painPoints: "User pain points", items: "Selected",
      range: "Budget", note: "Comment", start: "Start", deadline: "Deadline", reason: "Reason",
    },
    consent: "I agree that the information provided may be used to review my project request and contact me regarding this project.",
    consentLink: "Privacy notice",
    submit: "Submit project request",
    submitting: "Sending…",
    noExisting: "No, starting from scratch",
    noCompetitors: "Not specified",
    advice: "Needs a recommendation on scope",
    deadlineNone: "None",
  },
  done: {
    title: "Thank you! Your request is in",
    lead: "Your project brief has been prepared and sent to me — there is nothing to forward.",
    code: "Request ID",
    date: "Date",
    project: "Project",
    noName: "Untitled",
    download: "Download brief (PDF)",
    share: "Share the brief",
    shareText: "Project brief",
    nextTitle: "What happens next",
    next: [
      "I review the project information.",
      "I may contact you with clarifying questions.",
      "We agree on scope, timing and budget.",
      "The project then moves into the working stage.",
    ],
    home: "Back to home",
    tokenNote: "The brief link works for 30 days — keep the PDF.",
    duplicate: "This request was already sent — showing it again.",
  },
  failed: {
    spam: "The request could not be sent. Please try again in a minute.",
    captcha: "We couldn't confirm you're not a robot. Reload the page and try again — your answers are saved.",
    rate_limit: "Too many requests from this network. Please try later or write to me directly.",
    unavailable: "The form is temporarily unavailable. Please write to me directly — your answers are saved in the draft.",
    server: "Something went wrong. Please try again — your answers are saved.",
    validation: "Some answers need fixing.",
  },
  remove: "Remove",
  removeItem: (n) => `Remove item ${n}`,
  linkKind: "Type",
  linkUrl: "Link",
};

export const INTAKE: Record<Locale, IntakeCopy> = { uk, en };
