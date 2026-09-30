// Sample case story: the restaurant booking concept, built on the demo project of the tool.
// Numbers and quotes are illustrative until a real project is published.

import type { CaseStory } from "../case-story";

export const restaurantUk: CaseStory = {
  meta: [
    { label: "Терміни", value: "6 тижнів" },
    { label: "Платформа", value: "iOS · Android" },
    { label: "Команда", value: "Я, PM, 2 розробники" },
  ],
  overview: {
    challenge:
      "Люди обирають ресторан під привід — побачення, день народження, бізнес-ланч, — а застосунки шукають за кухнею й рейтингом. Щоб дізнатися про вільний столик, доводиться дзвонити.",
    solution:
      "Привід — перший фільтр, вільні слоти видно прямо у видачі, бронь за три кроки без переходу в інші застосунки.",
    outcome: "На тесті прототипу всі 8 учасників забронювали столик менш ніж за хвилину.",
  },
  process: [
    { stage: "research", value: "8", label: "інтервʼю" },
    { stage: "synthesis", value: "23", label: "цитати → 3 інсайти" },
    { stage: "competitors", value: "3", label: "конкуренти, 10 евристик" },
    { stage: "opportunities", value: "7", label: "можливостей" },
    { stage: "flows", value: "6", label: "кроків флоу" },
    { stage: "screens", value: "12", label: "екранів зі станами" },
    { stage: "decisions", value: "9", label: "рішень з доказами" },
  ],
  research: {
    intro:
      "Глибинні інтервʼю з людьми, які бронювали столик за останній місяць. Питав не «чи зручно», а як саме вони обирали востаннє.",
    facts: [
      { value: "8", label: "інтервʼю" },
      { value: "45 хв", label: "середня тривалість" },
      { value: "23", label: "цитати в синтезі" },
    ],
    quotes: [
      { text: "Я не шукаю «італійську кухню». Я шукаю, куди піти з дівчиною в пʼятницю.", who: "Олена, 27" },
      { text: "Поки додзвонишся, вже й не хочеться. Я просто йду туди, де вже була.", who: "Андрій, 34" },
      { text: "В Інстаграмі гарні фото, але щоб забронювати, треба писати в директ і чекати.", who: "Марія, 24" },
      { text: "Хочу бачити, чи є столик на 19:00, ще до того, як відкриваю меню.", who: "Ігор, 41" },
    ],
  },
  insights: [
    {
      code: "INS-001",
      title: "Люди шукають привід, а не кухню",
      body: "Вибір починається з ситуації: побачення, свято, зустріч. Кухня — вторинний фільтр.",
      evidence: "7 цитат · 6 з 8 учасників",
    },
    {
      code: "INS-002",
      title: "Невизначеність зі столиком убиває намір",
      body: "Якщо не видно вільних місць, людина відкладає рішення або йде в знайоме місце.",
      evidence: "5 цитат · 5 з 8 учасників",
    },
    {
      code: "INS-003",
      title: "Натхнення і бронь живуть у різних застосунках",
      body: "Ідеї — в Instagram, бронь — у дзвінку чи іншому сервісі. На переході губиться половина намірів.",
      evidence: "4 цитати · 4 з 8 учасників",
    },
  ],
  competitors: {
    intro:
      "Матриця функцій і UX-рев'ю за евристиками Нільсена. Червоні клітинки конкурентів — місця, де продукт може бути кращим.",
    products: ["Наш продукт", "Google Maps", "TheFork", "Instagram"],
    rows: [
      { feature: "Фільтр за приводом", marks: ["yes", "no", "no", "partial"] },
      { feature: "Вільні столи у видачі", marks: ["yes", "no", "partial", "no"] },
      { feature: "Онлайн-бронь", marks: ["yes", "partial", "yes", "no"] },
      { feature: "Фото від гостей", marks: ["yes", "yes", "no", "yes"] },
      { feature: "«Забронювати знову» в один дотик", marks: ["yes", "no", "no", "no"] },
      { feature: "Найближчі слоти, якщо час зайнятий", marks: ["yes", "partial", "no", "no"] },
    ],
  },
  opportunities: [
    { code: "OPP-01", text: "Як ми можемо допомогти обрати місце під привід за хвилину?" },
    { code: "OPP-02", text: "Як ми можемо показати вільний столик ще до відкриття картки ресторану?" },
    { code: "OPP-03", text: "Як ми можемо перетворити натхнення з фото на бронь в один дотик?" },
  ],
  flow: {
    intro: "Основний сценарій — від «куди піти» до підтвердженої броні.",
    steps: [
      { kind: "start", label: "Відкрив застосунок" },
      { kind: "screen", label: "Вибір приводу" },
      { kind: "screen", label: "Підбірка з вільними слотами" },
      { kind: "action", label: "Обрав час" },
      { kind: "screen", label: "Підтвердження" },
      { kind: "end", label: "Бронь у календарі" },
    ],
    edgeCases: [
      "Слот зайняли, поки обирав → пропонуємо найближчі вільні",
      "Немає інтернету → бронь у черзі, повідомлення після відправки",
      "Гостей більше 8 → дзвінок у ресторан однією кнопкою",
    ],
  },
  screens: {
    intro: "12 екранів, і в кожного описані стани: основний, завантаження, порожній, помилка.",
    items: [
      { title: "Привід", caption: "Шість сценаріїв замість сорока фільтрів", states: ["Основний", "Завантаження"] },
      { title: "Підбірка", caption: "Вільні слоти прямо в картці", states: ["Основний", "Порожньо", "Помилка"] },
      { title: "Бронь", caption: "Одна головна дія — «Забронювати»", states: ["Основний", "Успіх", "Слот зайнято"] },
    ],
  },
  decisions: [
    {
      code: "DEC-001",
      title: "Привід — перший крок, кухня — фільтр усередині",
      why: "6 з 8 учасників починали вибір із ситуації, а в жодного конкурента такого фільтра немає.",
      rejected: ["Звичний пошук за кухнею на першому екрані", "Стрічка рекомендацій без вибору"],
      evidence: ["INS-001", "Q-004", "Q-011"],
    },
    {
      code: "DEC-002",
      title: "Вільні слоти в картці підбірки",
      why: "Невизначеність зі столиком — головна причина відмовитися від походу.",
      rejected: ["Слоти лише на сторінці ресторану"],
      evidence: ["INS-002", "Q-007"],
    },
    {
      code: "DEC-003",
      title: "«Забронювати знову» на головній",
      why: "У TheFork повторна бронь займає пʼять кроків — порушення евристики «Гнучкість і ефективність».",
      rejected: ["Історія бронювань тільки в профілі"],
      evidence: ["UX-рев'ю · TheFork #7"],
    },
  ],
  results: {
    intro: "Юзабіліті-тест клікабельного прототипу з 8 учасниками.",
    metrics: [
      { value: "58 с", label: "середній час до броні" },
      { value: "8/8", label: "учасників завершили бронь" },
      { value: "−3", label: "кроки порівняно з TheFork" },
    ],
    quote: {
      text: "Вперше обрала ресторан не за кухнею, а за настроєм — і одразу бачу, що столик є.",
      who: "Учасниця тесту",
    },
  },
};

export const restaurantEn: CaseStory = {
  meta: [
    { label: "Timeline", value: "6 weeks" },
    { label: "Platform", value: "iOS · Android" },
    { label: "Team", value: "Me, a PM, 2 developers" },
  ],
  overview: {
    challenge:
      "People pick a restaurant for an occasion — a date, a birthday, a business lunch — while apps search by cuisine and rating. To find a free table you still have to call.",
    solution:
      "The occasion is the first filter, free slots show right in the results, and booking takes three steps without leaving the app.",
    outcome: "In a prototype test all 8 participants booked a table in under a minute.",
  },
  process: [
    { stage: "research", value: "8", label: "interviews" },
    { stage: "synthesis", value: "23", label: "quotes → 3 insights" },
    { stage: "competitors", value: "3", label: "competitors, 10 heuristics" },
    { stage: "opportunities", value: "7", label: "opportunities" },
    { stage: "flows", value: "6", label: "flow steps" },
    { stage: "screens", value: "12", label: "screens with states" },
    { stage: "decisions", value: "9", label: "decisions with evidence" },
  ],
  research: {
    intro:
      "In-depth interviews with people who booked a table in the past month. I didn't ask whether it was convenient — I asked how exactly they chose last time.",
    facts: [
      { value: "8", label: "interviews" },
      { value: "45 min", label: "average length" },
      { value: "23", label: "quotes in synthesis" },
    ],
    quotes: [
      { text: "I'm not looking for “Italian food”. I'm looking for where to go with my girlfriend on Friday.", who: "Olena, 27" },
      { text: "By the time you get through on the phone, you don't feel like it anymore. I just go where I've been.", who: "Andrii, 34" },
      { text: "Instagram has great photos, but to book you have to DM and wait.", who: "Mariia, 24" },
      { text: "I want to see if there's a table at 7 pm before I even open the menu.", who: "Ihor, 41" },
    ],
  },
  insights: [
    {
      code: "INS-001",
      title: "People look for an occasion, not a cuisine",
      body: "The choice starts with the situation: a date, a celebration, a meeting. Cuisine is a secondary filter.",
      evidence: "7 quotes · 6 of 8 participants",
    },
    {
      code: "INS-002",
      title: "Uncertainty about a table kills the intent",
      body: "When free seats aren't visible, people postpone the decision or go somewhere familiar.",
      evidence: "5 quotes · 5 of 8 participants",
    },
    {
      code: "INS-003",
      title: "Inspiration and booking live in different apps",
      body: "Ideas come from Instagram, booking happens by phone or in another service. Half of the intent is lost in between.",
      evidence: "4 quotes · 4 of 8 participants",
    },
  ],
  competitors: {
    intro:
      "A feature matrix plus a UX review against Nielsen's heuristics. Competitors' red cells are where the product can do better.",
    products: ["Our product", "Google Maps", "TheFork", "Instagram"],
    rows: [
      { feature: "Filter by occasion", marks: ["yes", "no", "no", "partial"] },
      { feature: "Free tables in results", marks: ["yes", "no", "partial", "no"] },
      { feature: "Online booking", marks: ["yes", "partial", "yes", "no"] },
      { feature: "Guest photos", marks: ["yes", "yes", "no", "yes"] },
      { feature: "One-tap “Book again”", marks: ["yes", "no", "no", "no"] },
      { feature: "Nearest slots when the time is taken", marks: ["yes", "partial", "no", "no"] },
    ],
  },
  opportunities: [
    { code: "OPP-01", text: "How might we help people pick a place for an occasion in a minute?" },
    { code: "OPP-02", text: "How might we show a free table before the restaurant page opens?" },
    { code: "OPP-03", text: "How might we turn inspiration from a photo into a booking in one tap?" },
  ],
  flow: {
    intro: "The main scenario — from “where to go” to a confirmed booking.",
    steps: [
      { kind: "start", label: "Opens the app" },
      { kind: "screen", label: "Pick an occasion" },
      { kind: "screen", label: "Picks with free slots" },
      { kind: "action", label: "Chooses a time" },
      { kind: "screen", label: "Confirmation" },
      { kind: "end", label: "Booking in calendar" },
    ],
    edgeCases: [
      "Slot taken while choosing → offer the nearest free ones",
      "No connection → booking queued, notification once sent",
      "More than 8 guests → call the restaurant with one button",
    ],
  },
  screens: {
    intro: "12 screens, each with its states described: default, loading, empty, error.",
    items: [
      { title: "Occasion", caption: "Six scenarios instead of forty filters", states: ["Default", "Loading"] },
      { title: "Picks", caption: "Free slots right in the card", states: ["Default", "Empty", "Error"] },
      { title: "Booking", caption: "One primary action — “Book”", states: ["Default", "Success", "Slot taken"] },
    ],
  },
  decisions: [
    {
      code: "DEC-001",
      title: "Occasion first, cuisine as a filter inside",
      why: "6 of 8 participants started from the situation, and no competitor has such a filter.",
      rejected: ["The usual cuisine search on the first screen", "A recommendation feed without a choice"],
      evidence: ["INS-001", "Q-004", "Q-011"],
    },
    {
      code: "DEC-002",
      title: "Free slots in the results card",
      why: "Uncertainty about a table is the main reason people give up on going out.",
      rejected: ["Slots only on the restaurant page"],
      evidence: ["INS-002", "Q-007"],
    },
    {
      code: "DEC-003",
      title: "“Book again” on the home screen",
      why: "Rebooking takes five steps in TheFork — a violation of the “Flexibility and efficiency” heuristic.",
      rejected: ["Booking history only in the profile"],
      evidence: ["UX review · TheFork #7"],
    },
  ],
  results: {
    intro: "A usability test of the clickable prototype with 8 participants.",
    metrics: [
      { value: "58 s", label: "average time to book" },
      { value: "8/8", label: "participants completed a booking" },
      { value: "−3", label: "steps compared to TheFork" },
    ],
    quote: {
      text: "For the first time I picked a restaurant by mood, not cuisine — and I can see right away there's a table.",
      who: "Test participant",
    },
  },
};
