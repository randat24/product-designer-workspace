// Real case: the product designer workspace itself — the tool behind /app and the source of the cases on this site.
// Numbers come from the project (stages in the tool, flow step types, tables and database checks in supabase/).
// The published snapshot in case_studies (production) mirrors this file; update both together.

import type { CaseStory } from "../case-story";
import type { GalleryItem } from "../content";

const shot = (file: string, alt: string, caption: string): GalleryItem => ({
  src: `/cases/designer-workspace/${file}.webp`,
  alt,
  caption,
  device: "desktop",
  width: 1440,
  height: 900,
});

export const workspaceGalleryUk: GalleryItem[] = [
  shot("01-overview", "Огляд проєкту: дев'ять етапів з прогресом і список «Що зробити далі»", "Огляд проєкту"),
  shot("02-brief", "Бриф: продукт, бізнес-модель і вимоги, зберігається автоматично", "Бриф"),
  shot("03-research", "Дослідження: план, сценарії інтерв'ю й список проведених інтерв'ю", "Дослідження"),
  shot("04-synthesis", "Синтез: дошка з цитатами й спостереженнями, розкладеними в колонки-патерни", "Синтез"),
  shot("05-insight-trace", "Інсайт з джерелами й панеллю «Зв'язки»: цитати, патерни й рішення, які з нього виросли", "Інсайт і зв'язки"),
  shot("06-competitors", "Матриця функцій конкурентів: є, частково, немає, з нагадуваннями в червоних клітинках", "Матриця конкурентів"),
  shot("07-flow", "Редактор сценарію: кроки «Екран», «Дія», «Розвилка», «Помилка» на схемі", "Редактор сценарію"),
  shot("08-screen", "Специфікація екрана: «Де ми можемо бути кращими», превʼю й зв'язки", "Специфікація екрана"),
  shot("09-decision", "Рішення з журналу: контекст, що вирішили, чому, і докази в панелі «Зв'язки»", "Журнал рішень"),
];

export const workspaceGalleryEn: GalleryItem[] = [
  shot("01-overview", "Project overview: nine stages with progress and a “What to do next” list", "Project overview"),
  shot("02-brief", "Brief: product, business model and requirements, saved automatically", "Brief"),
  shot("03-research", "Research: plan, interview scripts and the list of interviews held", "Research"),
  shot("04-synthesis", "Synthesis: a board of quotes and observations sorted into pattern columns", "Synthesis"),
  shot("05-insight-trace", "An insight with its sources and the Links panel: quotes, patterns and the decisions it led to", "Insight and links"),
  shot("06-competitors", "Competitor feature matrix: yes, partly, no, with reminders in the red cells", "Competitor matrix"),
  shot("07-flow", "Flow editor: Screen, Action, Branch and Error steps on the canvas", "Flow editor"),
  shot("08-screen", "Screen spec: “Where we can do better”, preview and links", "Screen spec"),
  shot("09-decision", "A decision from the log: context, what was decided, why, and the evidence in the Links panel", "Decision log"),
];

export const workspaceUk: CaseStory = {
  meta: [
    { label: "Статус", value: "У роботі, 2026" },
    { label: "Стек", value: "Next.js · Supabase" },
    { label: "Команда", value: "Соло, код з AI-асистентом" },
  ],
  overview: {
    challenge:
      "Артефакти дизайну живуть у різних місцях: інтерв'ю — в документах, дошки — в Miro, макети — у Figma, рішення — в чатах. Через місяць ніхто не пам'ятає, чому екран саме такий, і портфоліо доводиться збирати заново з уламків.",
    solution:
      "Один інструмент на весь ланцюжок: бриф → конкуренти → дослідження → синтез → інсайти → можливості → сценарії → екрани → рішення. Зв'язки між артефактами створюються самі, коли одне виростає з іншого, а готовий проєкт публікується на цей сайт як кейс.",
    outcome:
      "Інструмент працює: ним я веду проєкти, а кейси на цьому сайті публікуються з нього. Від будь-якого рішення можна пройти назад до цитат, на яких воно стоїть.",
  },
  process: [
    { stage: "research", value: "7", label: "екранів дослідження: план, гайд, інтерв'ю, матриця" },
    { stage: "synthesis", value: "3", label: "рівні: цитата → патерн → інсайт" },
    { stage: "competitors", value: "3", label: "режими: картки, матриця, UX-рев'ю" },
    { stage: "opportunities", value: "3×3", label: "матриця впливу й зусиль" },
    { stage: "flows", value: "8", label: "типів кроків у редакторі сценаріїв" },
    { stage: "screens", value: "3", label: "обов'язкові стани: завантаження, порожньо, помилка" },
    { stage: "decisions", value: "ADR", label: "формат журналу: чому і що відкинули" },
  ],
  insights: [
    {
      code: "INS-001",
      title: "«Чому» губиться першим",
      body: "Макет переживає проєкт, а аргументи — ні. Коли через місяць питають, чому так, відповідь шукають по чатах або вигадують заново.",
      evidence: "Власна практика, ретроспектива проєктів",
    },
    {
      code: "INS-002",
      title: "Зв'язки вручну ніхто не підтримує",
      body: "Посилання між документами живуть до першого перейменування. Трасування працює, тільки якщо з'являється само, як побічний продукт роботи.",
      evidence: "Спроби вести трасування в документах і таблицях",
    },
    {
      code: "INS-003",
      title: "Портфоліо збирається з уламків",
      body: "Кейс пишеться після проєкту, по пам'яті. Якби процес уже лежав структуровано, кейс був би знімком, а не окремою роботою.",
      evidence: "Підготовка кейсів для цього сайту",
    },
  ],
  competitors: {
    intro:
      "Порівнював не продукти загалом, а те, як вони закривають ланцюжок від дослідження до рішення. Кожен сильний у своїй ланці, але ланцюжок рветься на переходах.",
    products: ["Робочий простір", "Документи (Notion)", "Дошки (Miro, FigJam)", "Репозиторій досліджень (Dovetail)"],
    rows: [
      { feature: "Цитати → інсайти з джерелами", marks: ["yes", "partial", "partial", "yes"] },
      { feature: "Рішення пов'язане з доказами", marks: ["yes", "partial", "no", "partial"] },
      { feature: "Редактор сценаріїв", marks: ["yes", "no", "yes", "no"] },
      { feature: "Специфікація екрана зі станами", marks: ["yes", "partial", "partial", "no"] },
      { feature: "Журнал рішень з відкинутими варіантами", marks: ["yes", "partial", "no", "no"] },
      { feature: "Готовність проєкту по етапах", marks: ["yes", "no", "no", "no"] },
    ],
  },
  opportunities: [
    { code: "OPP-01", text: "Як ми можемо зробити так, щоб «чому» зберігалося разом із рішенням, а не в чаті?" },
    { code: "OPP-02", text: "Як ми можемо створювати зв'язки між артефактами без ручної роботи?" },
    { code: "OPP-03", text: "Як ми можемо перетворювати проєкт на кейс для портфоліо одним кроком?" },
  ],
  flow: {
    intro: "Основний шлях: від порожнього проєкту до кейсу на сайті. Кожен крок лишає артефакт, з якого виростає наступний.",
    steps: [
      { kind: "start", label: "Новий проєкт — одне поле" },
      { kind: "screen", label: "Бриф і конкуренти" },
      { kind: "action", label: "Інтерв'ю → цитати" },
      { kind: "screen", label: "Дошка синтезу" },
      { kind: "action", label: "Інсайт → можливість" },
      { kind: "screen", label: "Сценарій і екрани" },
      { kind: "action", label: "Рішення з доказами" },
      { kind: "end", label: "Кейс на сайті" },
    ],
    edgeCases: [
      "Порожній робочий простір — кнопка «Відкрити демо-проєкт» з готовими даними",
      "Подвійне натискання на демо — один проєкт, а не два",
      "Видалений артефакт — зв'язки не ламаються, панель показує, що зникло",
      "Забутий пароль — відновлення листом",
      "Втрата даних — резервна копія проєкту в JSON",
    ],
  },
  screens: {
    intro: "Ключові екрани інструмента. У кожного є стани, які легко забути: порожньо, завантаження, помилка.",
    items: [
      { title: "Огляд проєкту", caption: "Прогрес по етапах і наступні кроки — що саме не дороблено", states: ["Новий проєкт", "У роботі", "Усе готово"] },
      { title: "Дошка синтезу", caption: "Цитати й спостереження перетягуються в колонки-патерни; з колонки — інсайт", states: ["Порожня", "Без патерну", "Готовий до інсайту"] },
      { title: "Панель «Зв'язки»", caption: "Джерела, ланцюжок і у що перетворився артефакт", states: ["Немає зв'язків", "Прямі", "Через ланцюжок"] },
      { title: "Редактор сценарію", caption: "8 типів кроків, розвилки й edge cases, прив'язані до кроків", states: ["Порожня схема", "Крок вибрано", "Не продумано"] },
      { title: "Журнал рішень", caption: "Контекст, рішення, чому, відкинуті варіанти й докази", states: ["Чернетка", "Прийнято", "Замінено новим"] },
    ],
  },
  decisions: [
    {
      code: "DEC-001",
      title: "Зв'язки створюються автоматично",
      why: "Коли інсайт формулюється з колонки дошки, його джерелами стають цитати з цієї колонки. Ручне трасування ніхто не веде (INS-002), тож воно має бути побічним продуктом роботи.",
      rejected: ["Теги й ручні посилання", "Окрема діаграма трасування"],
      evidence: ["INS-002", "OPP-02"],
    },
    {
      code: "DEC-002",
      title: "Кейс — знімок проєкту, а не окремий документ",
      why: "Публікація фіксує дані проєкту на момент публікації. Подальша робота не потрапляє на сайт, поки кейс не опубліковано знову, а портфоліо не треба писати з нуля.",
      rejected: ["Окрема CMS для сайту", "Живе відображення проєкту без знімка"],
      evidence: ["INS-003", "OPP-03"],
    },
    {
      code: "DEC-003",
      title: "Демо-проєкт замість порожнього екрана",
      why: "Порожній інструмент нічого не пояснює. Демо показує весь ланцюжок на прикладі, і його можна сміливо ламати.",
      rejected: ["Онбординг-тур підказками", "Порожній екран з інструкцією"],
      evidence: ["Перші сесії в інструменті"],
    },
    {
      code: "DEC-004",
      title: "Доступ за запрошенням",
      why: "Це робочий інструмент з даними клієнтів. Реєстрація відкрита лише для адрес зі списку, а кожен рядок у базі захищено правилами доступу.",
      rejected: ["Відкрита реєстрація"],
      evidence: ["Аудит безпеки перед запуском"],
    },
  ],
  results: {
    intro:
      "Інструмент запущено, ним я веду власні проєкти. Цей сайт — його продовження: кейси публікуються з інструмента, а сторінки сайту перевіряються автоматично на доступність і мобільну верстку.",
    metrics: [
      { value: "9", label: "етапів у ланцюжку проєкту" },
      { value: "36", label: "таблиць з правилами доступу до рядків" },
      { value: "196", label: "автоматичних перевірок бази даних" },
      { value: "2", label: "мови сайту: українська й англійська" },
    ],
  },
};

export const workspaceEn: CaseStory = {
  meta: [
    { label: "Status", value: "In progress, 2026" },
    { label: "Stack", value: "Next.js · Supabase" },
    { label: "Team", value: "Solo, code with an AI assistant" },
  ],
  overview: {
    challenge:
      "Design artifacts live in different places: interviews in documents, boards in Miro, mockups in Figma, decisions in chats. A month later nobody remembers why a screen looks the way it does, and the portfolio has to be pieced together from fragments.",
    solution:
      "One tool for the whole chain: brief → competitors → research → synthesis → insights → opportunities → flows → screens → decisions. Links between artifacts appear on their own when one grows out of another, and a finished project is published to this site as a case study.",
    outcome:
      "The tool is in use: I run my projects in it, and the case studies on this site are published from it. From any decision you can walk back to the quotes it stands on.",
  },
  process: [
    { stage: "research", value: "7", label: "research screens: plan, guide, interviews, matrix" },
    { stage: "synthesis", value: "3", label: "levels: quote → pattern → insight" },
    { stage: "competitors", value: "3", label: "views: cards, matrix, UX review" },
    { stage: "opportunities", value: "3×3", label: "impact and effort matrix" },
    { stage: "flows", value: "8", label: "step types in the flow editor" },
    { stage: "screens", value: "3", label: "required states: loading, empty, error" },
    { stage: "decisions", value: "ADR", label: "log format: why and what was rejected" },
  ],
  insights: [
    {
      code: "INS-001",
      title: "The “why” is lost first",
      body: "The mockup outlives the project, the reasoning does not. When someone asks a month later why it is so, the answer is dug out of chats or made up again.",
      evidence: "My own practice, project retrospectives",
    },
    {
      code: "INS-002",
      title: "Nobody maintains links by hand",
      body: "Links between documents last until the first rename. Traceability works only if it appears by itself, as a by-product of the work.",
      evidence: "Attempts to keep traceability in documents and spreadsheets",
    },
    {
      code: "INS-003",
      title: "The portfolio is pieced together from fragments",
      body: "A case study is written after the project, from memory. If the process were already structured, the case would be a snapshot, not a separate job.",
      evidence: "Preparing the case studies for this site",
    },
  ],
  competitors: {
    intro:
      "I compared not the products as a whole but how they cover the chain from research to decision. Each is strong in its own link, but the chain breaks at the hand-offs.",
    products: ["Workspace", "Documents (Notion)", "Boards (Miro, FigJam)", "Research repository (Dovetail)"],
    rows: [
      { feature: "Quotes → insights with sources", marks: ["yes", "partial", "partial", "yes"] },
      { feature: "Decision linked to evidence", marks: ["yes", "partial", "no", "partial"] },
      { feature: "Flow editor", marks: ["yes", "no", "yes", "no"] },
      { feature: "Screen spec with states", marks: ["yes", "partial", "partial", "no"] },
      { feature: "Decision log with rejected options", marks: ["yes", "partial", "no", "no"] },
      { feature: "Project readiness by stage", marks: ["yes", "no", "no", "no"] },
    ],
  },
  opportunities: [
    { code: "OPP-01", text: "How might we keep the “why” together with the decision instead of in a chat?" },
    { code: "OPP-02", text: "How might we create links between artifacts without manual work?" },
    { code: "OPP-03", text: "How might we turn a project into a portfolio case study in one step?" },
  ],
  flow: {
    intro: "The main path: from an empty project to a case study on the site. Every step leaves an artifact the next one grows from.",
    steps: [
      { kind: "start", label: "New project — one field" },
      { kind: "screen", label: "Brief and competitors" },
      { kind: "action", label: "Interviews → quotes" },
      { kind: "screen", label: "Synthesis board" },
      { kind: "action", label: "Insight → opportunity" },
      { kind: "screen", label: "Flow and screens" },
      { kind: "action", label: "Decision with evidence" },
      { kind: "end", label: "Case study on the site" },
    ],
    edgeCases: [
      "Empty workspace — an “Open demo project” button with ready-made data",
      "Double click on the demo — one project, not two",
      "Deleted artifact — links do not break, the panel shows what is gone",
      "Forgotten password — recovery by email",
      "Data loss — a JSON backup of the project",
    ],
  },
  screens: {
    intro: "Key screens of the tool. Each has the states that are easy to forget: empty, loading, error.",
    items: [
      { title: "Project overview", caption: "Progress by stage and next steps — exactly what is unfinished", states: ["New project", "In progress", "All done"] },
      { title: "Synthesis board", caption: "Quotes and observations are dragged into pattern columns; a column becomes an insight", states: ["Empty", "No pattern", "Ready for an insight"] },
      { title: "Links panel", caption: "Sources, the chain and what the artifact turned into", states: ["No links", "Direct", "Through the chain"] },
      { title: "Flow editor", caption: "8 step types, branches and edge cases attached to steps", states: ["Empty canvas", "Step selected", "Not thought through"] },
      { title: "Decision log", caption: "Context, decision, why, rejected options and evidence", states: ["Draft", "Accepted", "Superseded"] },
    ],
  },
  decisions: [
    {
      code: "DEC-001",
      title: "Links are created automatically",
      why: "When an insight is written from a board column, the quotes in that column become its sources. Nobody keeps manual traceability (INS-002), so it has to be a by-product of the work.",
      rejected: ["Tags and manual links", "A separate traceability diagram"],
      evidence: ["INS-002", "OPP-02"],
    },
    {
      code: "DEC-002",
      title: "A case study is a snapshot of the project, not a separate document",
      why: "Publishing freezes the project data at that moment. Later work does not reach the site until the case is published again, and the portfolio does not have to be written from scratch.",
      rejected: ["A separate CMS for the site", "A live view of the project without a snapshot"],
      evidence: ["INS-003", "OPP-03"],
    },
    {
      code: "DEC-003",
      title: "A demo project instead of an empty screen",
      why: "An empty tool explains nothing. The demo shows the whole chain on an example, and it is safe to break.",
      rejected: ["An onboarding tour with tooltips", "An empty screen with instructions"],
      evidence: ["First sessions in the tool"],
    },
    {
      code: "DEC-004",
      title: "Access by invitation",
      why: "This is a working tool with client data. Sign-up is open only to addresses on a list, and every row in the database is protected by access rules.",
      rejected: ["Open sign-up"],
      evidence: ["Security audit before launch"],
    },
  ],
  results: {
    intro:
      "The tool is launched and I run my own projects in it. This site is its continuation: case studies are published from the tool, and the site pages are checked automatically for accessibility and mobile layout.",
    metrics: [
      { value: "9", label: "stages in the project chain" },
      { value: "36", label: "tables with row-level access rules" },
      { value: "196", label: "automated database checks" },
      { value: "2", label: "site languages: Ukrainian and English" },
    ],
  },
};
