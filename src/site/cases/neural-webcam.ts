// Real case: Neural WebCam — product design and brand identity of a multi-role creator platform (18+).
// The product later continued under another brand; that brand and its later visual changes are not
// part of this case. Sources: the owner's brief, the product's UML boards (roles, flows, account
// areas) and the logo file. No research, metrics, dates beyond the owner's, or product screens are
// invented: the «Key screens» section appears only once real Figma or product screens are added.
// Slides are generated from the logo by scripts/neural-webcam-slides.mjs.
// The published snapshot in case_studies (production) mirrors this file; update both together.

import type { Case, GalleryItem } from "../content";
import type { ProductStory } from "../product-story";

const slide = (file: string, alt: string, caption: string): GalleryItem => ({
  src: `/cases/neural-webcam/${file}.webp`,
  alt,
  caption,
  device: "desktop",
  width: 2400,
  height: 1500,
});

const common = {
  slug: "neural-webcam",
  kind: "real" as const,
  adult: true,
  // The cover is the logo: nothing in it needs the age gate.
  coverSafe: true,
  sticker: "#C9DAF8",
  year: "2020 — 2022",
  client: "Neural WebCam",
  metrics: [],
  sections: [],
};

const productUk: ProductStory = {
  disciplines: ["Product Design", "UI/UX", "Brand Identity"],
  note: "Згодом продукт продовжив роботу під іншим брендом. У кейсі — лише моя робота над Neural WebCam.",
  contents: "Зміст кейса",
  sections: [
    {
      id: "overview", kind: "overview", title: "Про продукт",
      body: [
        "Neural WebCam — цифрова платформа для взаємодії між користувачами та контент-кріейторами.",
        "Продукт об'єднував профілі, публікації, приватний контент, підписки, повідомлення, live-сценарії, внутрішню валюту та монетизацію в єдиній екосистемі.",
        "Одним із головних викликів було не створення окремих красивих екранів, а проєктування складної системи ролей, станів, платежів і сценаріїв взаємодії так, щоб продукт залишався зрозумілим для користувача.",
      ],
      facts: [
        { label: "Категорія", value: "Соціальна платформа · Creator economy · Live video · 18+" },
        { label: "Продукт", value: "Вебзастосунок, адаптивний" },
        { label: "Ролі", value: "Гість · Клієнт · Модель / автор · Медіаменеджер" },
        { label: "Моя роль", value: "Product / UI/UX Designer, айдентика" },
      ],
    },
    {
      id: "role", kind: "role", title: "Моя роль",
      lede: "Від архітектури продукту й сценаріїв до інтерфейсу, логотипа й передачі в розробку.",
      areas: ["Product Design", "UX-архітектура", "User flows", "Інформаційна архітектура", "Interaction design", "UI design",
        "Дизайн-система", "Адаптивний дизайн", "Прототипування", "Логотип і айдентика", "Handoff розробникам"],
    },
    {
      id: "challenge", kind: "challenge", title: "Один продукт для багатьох ролей",
      body: [
        "Основною UX-задачею було об'єднати в одному продукті різні моделі поведінки.",
        "Інтерфейс мав залишатися послідовним, але змінювати доступні можливості залежно від ролі, статусу, підписки та доступу користувача.",
      ],
      behaviors: [
        { who: "Клієнт", goal: "приходить за контентом і взаємодією." },
        { who: "Автор", goal: "приходить за аудиторією та монетизацією." },
        { who: "Медіаменеджер", goal: "потребує окремого робочого процесу: керування контентом і публікаціями." },
      ],
    },
    {
      id: "ecosystem", kind: "ecosystem", title: "Екосистема продукту",
      lede: "П'ятнадцять повʼязаних областей навколо одного ядра — масштаб, з яким мав впоратися інтерфейс.",
      center: "Neural WebCam",
      nodes: ["Discovery", "Профілі", "Контент", "Підписники", "Месенджер", "Live", "Підписки", "Кредити", "Чайові",
        "Подарунки", "Преміум", "Верифікація", "Транзакції", "Реферали", "Безпека"],
    },
    {
      id: "roles", kind: "roles", title: "Ролі користувачів",
      lede: "Від гостя до автора: кожна роль бачить той самий продукт, але з іншим набором можливостей.",
      items: [
        { name: "Гість", summary: "Неавторизований відвідувач.", can: ["переглядає публічний контент", "бачить профілі", "реєструється й входить", "читає довідкові та юридичні сторінки"] },
        { name: "Клієнт", summary: "Учасник платформи.", can: ["створює профіль і стежить за авторами", "купує преміум-контент і кредити", "надсилає чайові й подарунки", "користується месенджером і live", "керує підписками, історією покупок, безпекою й приватністю"] },
        { name: "Модель / автор", summary: "Роль кріейтора; клієнт отримує її після верифікації.", can: ["веде профіль і публікує контент", "дає доступ підписникам і за оплату", "спілкується з користувачами", "отримує чайові", "проводить приватні та групові live"] },
        { name: "Медіаменеджер", summary: "Окрема роль із власною реєстрацією та верифікацією.", can: ["працює з контентом і публікаціями авторів", "діє в межах прав, які дає продукт"] },
      ],
    },
    {
      id: "ia", kind: "ia", title: "Інформаційна архітектура",
      lede: "Десятки розділів з UML-схем, згруповані у шість областей замість однієї нечитабельної карти сайту.",
      groups: [
        { title: "Акаунт", items: ["Реєстрація й підтвердження пошти", "Вхід і відновлення пароля", "Профіль і особисті дані", "Налаштування: безпека, конфіденційність", "Сесії та сповіщення"] },
        { title: "Контент", items: ["Публікації", "Преміум-публікації", "Платний контент", "Підписники: безкоштовні та платні"] },
        { title: "Комунікація", items: ["Месенджер", "Приватний live", "Груповий live", "Чат-кімната"] },
        { title: "Монетизація", items: ["Купівля кредитів", "Преміум", "Чайові", "Подарунки", "Історія транзакцій", "Реферальна програма"] },
        { title: "Інструменти автора", items: ["Верифікація моделі", "Реєстрація й верифікація медіаменеджера", "Промо: банери, лендинги", "Субакаунти", "Посилання для аналітики"] },
        { title: "Підтримка й правила", items: ["FAQ, допомога, контакти", "Умови використання", "GDPR і cookie", "Відповідність 18+", "Як розпізнати шахрайство"] },
      ],
    },
    {
      id: "flows", kind: "flows", title: "Ключові сценарії",
      lede: "Сім сценаріїв, на яких тримається продукт. Кожен — у кілька кроків, без зайвих розгалужень.",
      items: [
        { title: "Реєстрація", steps: ["Гість", "Реєстрація", "Підтвердження пошти", "Профіль", "Заповнений профіль"] },
        { title: "Стати моделлю", steps: ["Клієнт", "«Стати моделлю»", "Дані профілю", "Пошта", "Документи", "Роль «Модель»"] },
        { title: "Медіаменеджер", steps: ["Реєстрація", "Підтвердження пошти", "Документи", "Верифікація", "Профіль медіаменеджера"] },
        { title: "Платний контент", steps: ["Автор", "Профіль", "Публікація", "Закритий стан", "Доступ", "Перегляд"] },
        { title: "Кредити", steps: ["Платна дія", "Бракує кредитів", "Купівля кредитів", "Оплата", "Повернення до дії"] },
        { title: "Повідомлення", steps: ["Профіль автора", "Написати", "Месенджер", "Безкоштовні й платні медіа"] },
        { title: "Live", steps: ["Профіль автора", "Приватний / груповий live", "Ціна й доступ", "Кредити", "Сесія"] },
      ],
    },
    {
      id: "monetization", kind: "monetization", title: "Система монетизації",
      lede: "Кілька моделей заробітку на одній внутрішній валюті: користувач один раз розуміє механіку — і вона працює всюди.",
      chain: ["Реальна оплата", "Кредити"],
      actions: ["Контент", "Чайові", "Live", "Подарунки"],
      models: [
        { title: "Кредити", body: "Внутрішня валюта для всіх платних дій у продукті." },
        { title: "Платний контент", body: "Окремі публікації відкриваються за оплату." },
        { title: "Преміум-підписка", body: "Доступ до контенту автора для платних підписників." },
        { title: "Чайові", body: "Пряма підтримка автора з профілю, чату чи live." },
        { title: "Подарунки", body: "Ще один спосіб висловити підтримку під час взаємодії." },
        { title: "Приватний live", body: "Сесія один на один за кредити." },
        { title: "Груповий live", body: "Спільна сесія з доступом за кредити." },
      ],
    },
    {
      id: "principles", kind: "principles", title: "UX-принципи",
      items: [
        { title: "Ясність", body: "Складна монетизація не повинна ускладнювати базову навігацію." },
        { title: "Послідовність", body: "Ті самі патерни працюють у профілях, публікаціях, повідомленнях і покупках." },
        { title: "Поступове розкриття", body: "Розширені можливості з'являються тоді, коли стають доречними." },
        { title: "Довіра", body: "Платежі, верифікація, безпека й приватна взаємодія мають явні стани та зворотний зв'язок." },
      ],
    },
    { id: "screens", kind: "screens", title: "Ключові екрани", items: [] },
    {
      id: "responsive", kind: "checklist", title: "Адаптивність",
      body: [
        "Продукт складається з медійних сторінок, профілів, повідомлень і сценаріїв оплати, тож адаптивність не зводилася до стискання десктопних макетів.",
        "На малих екранах змінювалися пріоритет контенту й навігація: що показати першим, що сховати за дією, як не загубити платний стан.",
      ],
      items: ["Медіа й публікації", "Профілі", "Месенджер", "Оплата й кредити", "Навігація", "Модальні вікна"],
    },
    {
      id: "system", kind: "system", title: "Система, а не екрани",
      body: ["Продукт вимагав системного підходу: десятки сценаріїв використовували спільні компоненти, стани та правила поведінки."],
      groups: [
        { title: "Навігація", items: ["Шапка й меню", "Вкладки", "Профіль і аватар"] },
        { title: "Контент", items: ["Картка публікації", "Закритий / преміум-стан", "Медіа"] },
        { title: "Комунікація", items: ["Месенджер", "Live-сесії", "Чат-кімната"] },
        { title: "Оплата", items: ["Кредити й баланс", "Купівля", "Чайові й подарунки"] },
        { title: "Зворотний зв'язок", items: ["Сповіщення", "Помилки", "Порожні стани"] },
      ],
    },
    {
      id: "brand", kind: "brand", title: "Айдентика",
      lede: "Логотип — логічне продовження роботи над продуктом: знак, який живе в інтерфейсі, а не на візитці.",
      body: [
        "Потрібен був продуктовий знак, що працює всюди: від повного логотипа на сайті до аватара, сповіщення й фавікона, у світлій і темній темах.",
        "Знак зведено до трьох простих форм. Їхні значення нижче — обґрунтування дизайну, а не історичний факт.",
      ],
      parts: [
        { shape: "circle", title: "Коло", meaning: "камера, об'єктив, відео, профіль" },
        { shape: "base", title: "Основа", meaning: "силует людини, опора вебкамери" },
        { shape: "dot", title: "Точка", meaning: "активний статус, звʼязок, вузол мережі" },
      ],
      formula: "Людина + камера + цифровий звʼязок",
      image: slide("02-concept", "Формула знака: коло-користувач, плюс камера, плюс точка-вузол, дорівнює знаку Neural WebCam", "Концепція знака"),
    },
    {
      id: "logo-process", kind: "timeline", title: "Як народжувався знак",
      steps: [
        { title: "Дослідження", body: "Продукт, аудиторія, цифровий контекст." },
        { title: "Ключові слова", body: "Людина, звʼязок, відео, live, цифрове, мережа." },
        { title: "Пошук форми", body: "Асоціації камери, людини й мережі — у просту геометрію." },
        { title: "Побудова символу", body: "Коло, основа й окремий вузол." },
        { title: "Баланс", body: "Товщина кільця, розмір точки, візуальний центр, нижня дуга, відступи." },
        { title: "Типографіка", body: "Заокруглені літери продовжують мʼяку геометрію знака." },
        { title: "Колір", body: "Синій — технологічність, довіра, ясність." },
        { title: "Перевірка розмірів", body: "128, 64, 32, 24 і 16 px." },
      ],
    },
    {
      id: "construction", kind: "figure", title: "Побудова",
      body: ["Модуль X — діаметр точки. Від нього будуються пропорції знака, захисне поле (X з кожного боку) і відступ до назви. Пропорції логотипа не змінювалися."],
      images: [slide("03-construction", "Побудова знака: зовнішнє й внутрішнє коло, осі, точка як модуль X і захисне поле", "Сітка побудови й захисне поле")],
    },
    {
      id: "variations", kind: "figure", title: "Версії логотипа",
      body: ["Основна, горизонтальна, знак окремо, компактна, монохромна, інверсна й темна. Знак перевірено від 128 до 16 px — на світлому, темному й синьому фоні."],
      images: [
        slide("04-versions", "Вісім версій логотипа: основна, горизонтальна, знак, компактна, монохромна, інверсна, темна, горизонтальна інверсна", "Версії логотипа"),
        slide("05-color", "Палітра: фірмовий градієнт, основний синій, світло-синій, темно-синій і світлий фон", "Колір"),
        slide("06-sizes", "Знак у розмірах 16, 24, 32, 64 і 128 px на білому, темно-синьому й синьому фоні", "Знак у малих розмірах"),
      ],
    },
    {
      id: "trust", kind: "trust", title: "Довіра й безпека",
      lede: "Для платформи 18+ довіра — частина UX: кожен чутливий крок має зрозумілий стан і наслідок.",
      items: [
        { icon: "age", title: "Вікове обмеження", body: "Перевірка 18+ до будь-якого контенту." },
        { icon: "identity", title: "Верифікація особи", body: "Документи для автора й медіаменеджера." },
        { icon: "security", title: "Безпека акаунта", body: "Пароль, сесії, вхід з нового пристрою." },
        { icon: "privacy", title: "Приватність", body: "Окремі налаштування конфіденційності." },
        { icon: "gdpr", title: "GDPR і cookie", body: "Прозорі правила обробки даних." },
        { icon: "scam", title: "Розпізнавання шахрайства", body: "Довідка про типові схеми." },
        { icon: "payment", title: "Стани оплати", body: "Успіх, помилка, недостатньо кредитів." },
        { icon: "access", title: "Обмеження доступу", body: "Закритий контент пояснює, як отримати доступ." },
      ],
    },
    {
      id: "handoff", kind: "checklist", title: "Передача в розробку",
      body: ["Дизайн включав логіку, готову до реалізації: не лише «щасливий шлях», а всі стани, від яких залежить поведінка продукту."],
      items: ["Стани й варіанти", "Адаптивна поведінка", "Логіка модальних вікон", "Права доступу", "Платні / закриті стани", "Помилки", "Порожні стани", "Стани верифікації"],
    },
    {
      id: "outcome", kind: "outcome", title: "Результат",
      body: [
        "Масштабована продуктова система: соціальна взаємодія, контент, live і монетизація в одному інтерфейсі.",
        "Системний підхід до UX, ролей і компонентів дозволив підтримувати велику кількість сценаріїв без створення окремого продукту для кожного типу користувача.",
      ],
    },
  ],
};

const productEn: ProductStory = {
  disciplines: ["Product Design", "UI/UX", "Brand Identity"],
  note: "The product later continued under a different brand. This case covers only my work on Neural WebCam.",
  contents: "Case contents",
  sections: [
    {
      id: "overview", kind: "overview", title: "Overview",
      body: [
        "Neural WebCam was a multi-role digital platform connecting users with content creators.",
        "The product combined profiles, publications, private content, subscriptions, messaging, live experiences, virtual currency and monetization inside one ecosystem.",
        "The main challenge was not simply designing individual screens, but building a complex system of roles, permissions, payments and interactions while keeping the experience clear and consistent.",
      ],
      facts: [
        { label: "Category", value: "Social platform · Creator economy · Live video · 18+" },
        { label: "Product", value: "Web application, responsive" },
        { label: "Roles", value: "Guest · Member · Model / creator · Media manager" },
        { label: "My role", value: "Product / UI/UX Designer, brand identity" },
      ],
    },
    {
      id: "role", kind: "role", title: "My role",
      lede: "From product architecture and flows to the interface, the logo and developer handoff.",
      areas: ["Product Design", "UX Architecture", "User Flows", "Information Architecture", "Interaction Design", "UI Design",
        "Design System", "Responsive Design", "Prototyping", "Brand / Logo Design", "Developer Handoff"],
    },
    {
      id: "challenge", kind: "challenge", title: "One product for multiple roles",
      body: [
        "The central UX challenge was supporting multiple behavioral models inside the same product.",
        "The interface needed to remain consistent while dynamically adapting functionality to the user's role, subscription and permissions.",
      ],
      behaviors: [
        { who: "Members", goal: "came for discovery, content and interaction." },
        { who: "Creators", goal: "came for audience and monetization." },
        { who: "Media managers", goal: "required a separate operational workflow." },
      ],
    },
    {
      id: "ecosystem", kind: "ecosystem", title: "Product ecosystem",
      lede: "Fifteen connected areas around one core: the scale the interface had to hold together.",
      center: "Neural WebCam",
      nodes: ["Discovery", "Profiles", "Content", "Followers", "Messenger", "Live", "Subscriptions", "Credits", "Tips",
        "Gifts", "Premium", "Verification", "Transactions", "Referral", "Security"],
    },
    {
      id: "roles", kind: "roles", title: "User roles",
      lede: "From guest to creator: every role sees the same product with a different set of capabilities.",
      items: [
        { name: "Guest", summary: "An unauthorized visitor.", can: ["browses public content", "views profiles", "signs up and logs in", "reads help and legal pages"] },
        { name: "Member", summary: "A client of the platform.", can: ["creates a profile and follows creators", "buys premium content and credits", "sends tips and gifts", "uses messenger and live", "manages subscriptions, purchases, security and privacy"] },
        { name: "Model / Creator", summary: "The creator role; a member gets it after verification.", can: ["maintains a profile and publishes", "offers subscriber and paid content", "talks to users", "receives tips", "hosts private and group live"] },
        { name: "Media Manager", summary: "A separate role with its own registration and verification.", can: ["works with creators' content and publications", "acts within the permissions the product grants"] },
      ],
    },
    {
      id: "ia", kind: "ia", title: "Information architecture",
      lede: "Dozens of areas from the UML boards, grouped into six domains instead of one unreadable sitemap.",
      groups: [
        { title: "Account", items: ["Sign-up and email confirmation", "Log-in and password recovery", "Profile and personal information", "Settings: security, confidentiality", "Sessions and notifications"] },
        { title: "Content", items: ["Publications", "Premium publications", "Paid content", "Followers: free and paid"] },
        { title: "Communication", items: ["Messenger", "Private live", "Group live", "Chat room"] },
        { title: "Monetization", items: ["Buy credits", "Premium", "Tips", "Gifts", "Transaction history", "Referral"] },
        { title: "Creator tools", items: ["Model verification", "Media manager registration and verification", "Promo: banners, landing pages", "Subaccounts", "Analytics links"] },
        { title: "Support & compliance", items: ["FAQ, help, contact", "Terms", "GDPR and cookie policy", "18+ compliance", "Scam recognition"] },
      ],
    },
    {
      id: "flows", kind: "flows", title: "Core user flows",
      lede: "Seven flows the product rests on, each a few steps long and free of needless branches.",
      items: [
        { title: "Registration", steps: ["Guest", "Sign up", "Email verification", "Profile", "Completed profile"] },
        { title: "Become a creator", steps: ["Member", "Become a Model", "Profile details", "Email", "Documents", "Role: Model"] },
        { title: "Media manager", steps: ["Registration", "Email verification", "Documents", "Verification", "Media manager profile"] },
        { title: "Paid content", steps: ["Creator", "Profile", "Publication", "Locked state", "Access", "View"] },
        { title: "Credits", steps: ["Paid action", "Not enough credits", "Buy credits", "Payment", "Back to the action"] },
        { title: "Messaging", steps: ["Creator profile", "Message", "Messenger", "Free and paid media"] },
        { title: "Live", steps: ["Creator profile", "Private / group live", "Price and access", "Credits", "Session"] },
      ],
    },
    {
      id: "monetization", kind: "monetization", title: "Monetization system",
      lede: "Several revenue models on one virtual currency: users learn the mechanics once and they work everywhere.",
      chain: ["Real payment", "Credits"],
      actions: ["Content", "Tips", "Live", "Gifts"],
      models: [
        { title: "Credits", body: "The virtual currency behind every paid action." },
        { title: "Paid content", body: "Single publications unlock for a payment." },
        { title: "Premium subscription", body: "Access to a creator's content for paying followers." },
        { title: "Tips", body: "Direct support from a profile, chat or live session." },
        { title: "Gifts", body: "Another way to show support during an interaction." },
        { title: "Private live", body: "A one-to-one session paid in credits." },
        { title: "Group live", body: "A shared session with access paid in credits." },
      ],
    },
    {
      id: "principles", kind: "principles", title: "UX principles",
      items: [
        { title: "Clarity", body: "Complex monetization should never make basic navigation difficult." },
        { title: "Consistency", body: "The same patterns work across profiles, publications, messaging and purchase flows." },
        { title: "Progressive disclosure", body: "Advanced functionality appears only when it becomes relevant." },
        { title: "Trust", body: "Payments, verification, security and private interactions need explicit states and feedback." },
      ],
    },
    { id: "screens", kind: "screens", title: "Key screens", items: [] },
    {
      id: "responsive", kind: "checklist", title: "Responsive experience",
      body: [
        "The product holds media-heavy pages, profiles, messaging and monetization flows, so responsive behavior was not simply resizing desktop layouts.",
        "On smaller screens content priority and navigation adapted: what comes first, what moves behind an action, how a paid state stays visible.",
      ],
      items: ["Media and publications", "Profiles", "Messenger", "Payments and credits", "Navigation", "Modal windows"],
    },
    {
      id: "system", kind: "system", title: "System, not screens",
      body: ["The product required a system rather than a collection of isolated screens. Shared components and interaction patterns made complex flows consistent and scalable."],
      groups: [
        { title: "Navigation", items: ["Header and menu", "Tabs", "Profile and avatar"] },
        { title: "Content", items: ["Publication card", "Locked / premium state", "Media"] },
        { title: "Communication", items: ["Messenger", "Live sessions", "Chat room"] },
        { title: "Payments", items: ["Credits and balance", "Purchase", "Tips and gifts"] },
        { title: "Feedback", items: ["Notifications", "Errors", "Empty states"] },
      ],
    },
    {
      id: "brand", kind: "brand", title: "Brand identity",
      lede: "The logo continues the product work: a mark that lives in the interface, not on a business card.",
      body: [
        "The product needed a mark that works everywhere: from the full logo on the website to an avatar, a notification and the favicon, in light and dark themes.",
        "The mark is reduced to three simple shapes. Their meanings below are design rationale, not historical fact.",
      ],
      parts: [
        { shape: "circle", title: "Circle", meaning: "camera, lens, video, profile" },
        { shape: "base", title: "Base", meaning: "human silhouette, webcam support" },
        { shape: "dot", title: "Dot", meaning: "active status, connection, node" },
      ],
      formula: "Human + Camera + Digital connection",
      image: slide("02-concept", "The formula of the mark: a user circle, plus a camera, plus a node dot, equals the Neural WebCam symbol", "The concept of the mark"),
    },
    {
      id: "logo-process", kind: "timeline", title: "Logo development",
      steps: [
        { title: "Research", body: "The product, its audience and digital context." },
        { title: "Keywords", body: "Human, connection, video, live, digital, network." },
        { title: "Shape exploration", body: "Camera, person and network associations reduced to simple geometry." },
        { title: "Symbol construction", body: "Circle, base and an independent node." },
        { title: "Balance", body: "Ring thickness, dot size, visual centre, bottom curve, spacing." },
        { title: "Typography", body: "Rounded lettering complements the soft geometry of the symbol." },
        { title: "Color", body: "Blue for digital technology, trust and clarity." },
        { title: "Responsive testing", body: "128, 64, 32, 24 and 16 px." },
      ],
    },
    {
      id: "construction", kind: "figure", title: "Construction",
      body: ["The module X is the diameter of the dot. It sets the proportions of the mark, the clear space (X on every side) and the distance to the wordmark. The logo's proportions were never changed."],
      images: [slide("03-construction", "Construction: outer and inner circles, axes, the dot as module X and the clear space", "Construction grid and clear space")],
    },
    {
      id: "variations", kind: "figure", title: "Logo variations",
      body: ["Primary, horizontal, symbol only, compact, monochrome, inverse and dark. The symbol is checked from 128 down to 16 px on light, dark and blue backgrounds."],
      images: [
        slide("04-versions", "Eight logo versions: primary, horizontal, symbol, compact, monochrome, inverse, dark, horizontal inverse", "Logo variations"),
        slide("05-color", "Palette: signature gradient, primary blue, light blue, navy and paper", "Colour"),
        slide("06-sizes", "The symbol at 16, 24, 32, 64 and 128 px on white, navy and blue", "The mark at small sizes"),
      ],
    },
    {
      id: "trust", kind: "trust", title: "Trust & safety",
      lede: "On an 18+ platform trust is part of the UX: every sensitive step has a clear state and consequence.",
      items: [
        { icon: "age", title: "Age restriction", body: "An 18+ check before any content." },
        { icon: "identity", title: "Identity verification", body: "Documents for creators and media managers." },
        { icon: "security", title: "Account security", body: "Password, sessions, sign-in from a new device." },
        { icon: "privacy", title: "Privacy", body: "Dedicated confidentiality settings." },
        { icon: "gdpr", title: "GDPR and cookies", body: "Transparent data processing rules." },
        { icon: "scam", title: "Scam recognition", body: "Guidance on common schemes." },
        { icon: "payment", title: "Payment states", body: "Success, failure, not enough credits." },
        { icon: "access", title: "Access restrictions", body: "Locked content explains how to get access." },
      ],
    },
    {
      id: "handoff", kind: "checklist", title: "Developer handoff",
      body: ["The design included developer-ready logic: not just the happy path, but every state the product's behavior depends on."],
      items: ["States and variants", "Responsive behavior", "Modal logic", "Access permissions", "Paid / locked states", "Error states", "Empty states", "Verification states"],
    },
    {
      id: "outcome", kind: "outcome", title: "Outcome",
      body: [
        "A scalable product system combining social interaction, content, live communication and monetization within one interface.",
        "A role-based architecture and reusable interaction patterns allowed the platform to support a large number of scenarios without fragmenting the experience into separate products.",
      ],
    },
  ],
};

export const neuralUk: Case = {
  ...common,
  title: "Neural WebCam",
  role: "Product / UI/UX Designer",
  summary: "Соціальна платформа для авторів, контенту й живої взаємодії: ролі, архітектура, сценарії, монетизація та айдентика.",
  tags: ["Product Design", "UX-архітектура", "Айдентика"],
  cover: slide("00-cover", "Логотип Neural WebCam: знак і назва в рядок на білому", "Neural WebCam"),
  product: productUk,
  seo: {
    title: "Neural WebCam — кейс продуктового дизайну",
    description: "Кейс продуктового дизайну Neural WebCam — багаторольової платформи для авторів: профілі, контент, повідомлення, live, підписки, монетизація й айдентика.",
  },
};

export const neuralEn: Case = {
  ...common,
  title: "Neural WebCam",
  role: "Product / UI/UX Designer",
  summary: "A social platform for creators, content and live interaction: roles, architecture, flows, monetization and brand identity.",
  tags: ["Product Design", "UX Architecture", "Brand Identity"],
  cover: slide("00-cover", "Neural WebCam logo: the symbol and the name in one line on white", "Neural WebCam"),
  product: productEn,
  seo: {
    title: "Neural WebCam — Product Design Case Study",
    description: "Product design case study of Neural WebCam — a multi-role creator platform with profiles, content, messaging, live interaction, subscriptions and monetization.",
  },
};
