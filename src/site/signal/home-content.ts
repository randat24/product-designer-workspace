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
    services: {
      index: "02",
      eyebrow: "Послуги",
      title: ["Чим можу", "допомогти"],
      lead: "Не знаєте, який формат вам потрібен? Опишіть задачу у формі, і я підкажу.",
      resultLabel: "Що отримаєте",
      items: [
        {
          title: "Дизайн нового продукту",
          text: "Є ідея або MVP, а дизайнера немає. Розбираюся з користувачами й конкурентами, будую сценарії та екрани й передаю їх у розробку.",
          result: "Дослідження, сценарії, макети з усіма станами, специфікації",
        },
        {
          title: "UX-аудит продукту",
          text: "Продукт працює, але люди губляться або кидають на півдорозі. Проходжу ключові сценарії, перевіряю їх за евристиками й законами UX і порівнюю з конкурентами.",
          result: "Список проблем із пріоритетами й конкретні правки",
        },
        {
          title: "Дизайн-система",
          text: "Макети розходяться з версткою, а кожен екран малюють з нуля. Збираю токени, компоненти й правила. Дві такі системи я вже побудував з нуля.",
          result: "Бібліотека у Figma, документація, правила оновлення",
        },
        {
          title: "Дизайнер у вашу команду",
          text: "Дизайнер потрібен постійно, але не на повний день. Працюю part-time, 20 годин на тиждень, асинхронно, у ваших процесах та інструментах.",
          result: "Регулярний дизайн до релізів, рев’ю реалізації, UI QA",
        },
      ],
      cta: "Обговорити задачу",
    },
    about: {
      index: "03",
      eyebrow: "Хто я",
      title: ["Привіт,", "я Геннадій."],
      text: "Продуктовий дизайнер з Миколаєва. Сім років працюю у вебстудіях і продуктових командах: досліджую, проєктую інтерфейси, збираю дизайн-системи й менторю дизайнерів. Найкраще мені вдаються продукти, де багато ролей і логіки, а розібратися в них треба так, щоб користувач цього не помітив.",
      facts: [
        { value: "7 років", label: "у вебі та продуктових командах" },
        { value: "2 системи", label: "дизайн-системи, зібрані з нуля" },
        { value: "Україна", label: "Миколаїв · працюю дистанційно" },
      ],
      more: "Досвід і резюме",
    },
    process: {
      index: "04",
      eyebrow: "Мій підхід",
      title: ["Спершу розбираюся,", "потім малюю."],
      lead: "Кожен етап лишає артефакт, тож до будь-якого рішення можна повернутися й побачити, звідки воно взялося.",
      steps: [
        { code: "Discover", title: "Розібратися", text: "Поговорити з людьми, зрозуміти бізнес і знайти задачу, яку справді варто вирішувати." },
        { code: "Define", title: "Знайти структуру", text: "Перетворити спостереження на сценарії та пріоритети." },
        { code: "Design", title: "Спроєктувати", text: "Зібрати інтерфейс і компоненти, які легко розвивати." },
        { code: "Deliver", title: "Передати в розробку", text: "Описати логіку й стани, а потім перевірити, як це зібрали." },
      ],
    },
    contact: {
      index: "05",
      eyebrow: "Контакт",
      title: ["Розкажіть", "про задачу."],
      text: ["Коротка форма з кількох кроків або лист напряму.", "Відповідаю протягом доби."],
      brief: "Заповнити бриф",
    },
    back: "До всіх робіт",
    contents: "У цьому кейсі",
    enlarge: "Збільшити",
  },
  en: {
    role: "Product & UI/UX designer",
    discuss: "Discuss a project",
    work: { index: "01", eyebrow: "From problem to solution", title: "Selected work" },
    services: {
      index: "02",
      eyebrow: "Services",
      title: ["How I", "can help"],
      lead: "Not sure which format you need? Describe the problem in the form and I’ll suggest one.",
      resultLabel: "What you get",
      items: [
        {
          title: "Designing a new product",
          text: "You have an idea or an MVP but no designer. I talk to users, look at competitors, build the flows and screens and hand them over to development.",
          result: "Research, flows, screens with every state, specs",
        },
        {
          title: "UX audit",
          text: "The product works, but people get lost or drop off halfway. I walk through the key flows, check them against heuristics and UX laws and compare them with competitors.",
          result: "A prioritised list of problems and concrete fixes",
        },
        {
          title: "Design system",
          text: "Mockups drift from the build and every screen is drawn from scratch. I set up tokens, components and rules. I have built two such systems from scratch.",
          result: "A Figma library, documentation, update rules",
        },
        {
          title: "A designer on your team",
          text: "You need a designer all the time, just not full-time. I work part-time, 20 hours a week, asynchronously, inside your processes and tools.",
          result: "Steady design for releases, build reviews, UI QA",
        },
      ],
      cta: "Discuss your project",
    },
    about: {
      index: "03",
      eyebrow: "About me",
      title: ["Hi,", "I’m Hennadii."],
      text: "A product designer from Mykolaiv, Ukraine. For seven years I’ve worked in web studios and product teams: researching, designing interfaces, building design systems and mentoring designers. I do my best work on products with many roles and a lot of logic, where the job is to sort it out so the user never notices.",
      facts: [
        { value: "7 years", label: "in web and product teams" },
        { value: "2 systems", label: "design systems built from scratch" },
        { value: "Ukraine", label: "Mykolaiv · working remotely" },
      ],
      more: "Experience and CV",
    },
    process: {
      index: "04",
      eyebrow: "My approach",
      title: ["I figure it out first,", "then I draw."],
      lead: "Every stage leaves an artifact, so any decision can be traced back to where it came from.",
      steps: [
        { code: "Discover", title: "Understand", text: "Talk to people, understand the business and find the problem worth solving." },
        { code: "Define", title: "Find the structure", text: "Turn what we learned into flows and priorities." },
        { code: "Design", title: "Design", text: "Build an interface and components that are easy to grow." },
        { code: "Deliver", title: "Hand over", text: "Describe the logic and the states, then check how it was built." },
      ],
    },
    contact: {
      index: "05",
      eyebrow: "Contact",
      title: ["Tell me", "about your project."],
      text: ["A short form in a few steps, or write to me directly.", "I reply within a day."],
      brief: "Fill in the brief",
    },
    back: "All work",
    contents: "In this case",
    enlarge: "Enlarge",
  },
} as const;

export const signalCopy = (locale: Locale) => SIGNAL_COPY[locale];
