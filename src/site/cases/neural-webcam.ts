// Real case: brand identity of Neural WebCam (live site nudesmaker.com, 18+). The slides are generated from the
// logo file by scripts/neural-webcam-slides.mjs — nothing on them is a mockup of the real product's screens.
// The published snapshot in case_studies (production) mirrors this file; update both together.

import type { Case, GalleryItem } from "../content";

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
  liveUrl: "https://nudesmaker.com",
  metrics: [],
};

export const neuralUk: Case = {
  ...common,
  title: "Neural WebCam: айдентика",
  role: "Brand & Product Designer",
  summary:
    "Продуктовий знак для цифрової платформи живої взаємодії та медіа: від сенсу й геометрії до версій, кольору й поведінки в інтерфейсі.",
  tags: ["Айдентика", "Логотип", "Продуктовий дизайн"],
  cover: slide("00-cover", "Логотип Neural WebCam: знак і назва в рядок на білому", "Neural WebCam"),
  sections: [
    {
      title: "Огляд бренду",
      body: "Neural WebCam — цифрова платформа, побудована навколо спілкування, контенту та взаємодії між людьми. Це не просто застосунок для вебкамери: в архітектурі продукту — профілі, публікації, повідомлення, живі трансляції, преміум-доступ і верифікація.\n\nАйдентика мала бути технологічною, дружньою й упізнаваною у великій продуктовій екосистемі.",
      image: slide("01-overview", "Великий логотип Neural WebCam на білому та короткий опис платформи", "Огляд бренду"),
    },
    {
      title: "Задача логотипу",
      body: "Потрібен був не декоративний логотип, а продуктовий знак, який працює одразу в багатьох сценаріях:\n— основний сайт;\n— профіль користувача;\n— середовище медіа й публікацій;\n— чат і живі трансляції;\n— мобільні та компактні стани;\n— фавікон;\n— системні сповіщення;\n— світла й темна теми.",
    },
    {
      title: "Концепція",
      body: "Знак складається з трьох простих форм.\n\nКоло — обʼєктив камери, вікно відео, аватар користувача, елемент інтерфейсу.\n\nНижня форма — основа камери, плечі людини, опора й точка звʼязку.\n\nОкрема точка — найцікавіша деталь: активний статус, індикатор запису, вузол мережі, ще один учасник системи.\n\nЛюдина + камера + вузол = Neural WebCam.",
      image: slide("02-concept", "Формула знака: коло-користувач, плюс камера, плюс точка-вузол, дорівнює знаку Neural WebCam", "Концепція"),
    },
    {
      title: "Чому «Neural»",
      body: "В архітектурі продукту багато повʼязаних між собою ролей, станів і сценаріїв: клієнт, модель, медіаменеджер, публікації, профіль, повідомлення, преміум, верифікація.\n\nТому «Neural» тут — не про штучний інтелект, а про мережу: повʼязану систему людей, медіа й взаємодій, майже як нейронна структура. Це чесніше й сильніше, ніж вигадувати «AI-вебкамеру», коли продукт ширший.",
    },
    {
      title: "Процес",
      body: "01 — Дослідження продукту: структура, ролі користувачів, основні сценарії взаємодії.\n02 — Смисловий напрям: людина, звʼязок, наживо, відео, мережа, цифрове.\n03 — Пошук форми: проста форма без буквального зображення звичайної вебкамери.\n04 — Редукція знака до кількох базових геометричних елементів.\n05 — Баланс і пропорції: товщина кільця, розмір точки, нижня опора, загальна вага.\n06 — Назва: мʼяка заокруглена типографіка, щоб знак і назва виглядали однією системою.\n07 — Колір: основний синій — технологічний і спокійний.\n08 — Перевірка на розмірах 16, 24, 32, 64 і 128 px.\n09 — Інтеграція в продукт: шапка, профіль, фавікон, екран входу, сповіщення, мобільний інтерфейс.",
    },
    {
      title: "Геометрія",
      body: "Модуль X — діаметр точки. Від нього будуються пропорції знака, захисне поле (X з кожного боку), відступ до назви й мінімальний розмір. Центр точки лежить на лінії до центру кільця, нижня опора повторює нижню дугу кільця.",
      image: slide("03-construction", "Побудова знака: зовнішнє й внутрішнє коло, осі, точка як модуль X і захисне поле", "Побудова й захисне поле"),
    },
    {
      title: "Версії логотипу",
      body: "Основна — синій знак і назва. Горизонтальна — знак ліворуч, назва праворуч. Знак окремо — для інтерфейсу, аватарів і фавікона. Компактна — без «WebCam» для зовсім малих розмірів. Монохромна, інверсна (білий на синьому) й темна (синій і білий на темно-синьому).",
      image: slide("04-versions", "Вісім версій логотипу: основна, горизонтальна, знак, компактна, монохромна, інверсна, темна, горизонтальна інверсна", "Версії логотипу"),
    },
    {
      title: "Колір",
      body: "Фірмовий градієнт іде від світло-синього #71A1F2 до основного синього #2459B4 — так заповнений сам логотип. Темно-синій і світлий фон тримають обидві теми інтерфейсу.",
      image: slide("05-color", "Палітра: фірмовий градієнт, основний синій, світло-синій, темно-синій і світлий фон", "Колір"),
    },
    {
      title: "Масштабування",
      body: "Знак перевірено на 16, 24, 32, 64 і 128 px — на світлому, темному й синьому фоні. Прості форми й окрема точка лишаються читабельними навіть у вкладці браузера.",
      image: slide("06-sizes", "Знак у розмірах 16, 24, 32, 64 і 128 px на білому, темно-синьому й синьому фоні", "Перевірка розмірів"),
    },
    {
      title: "У продукті",
      body: "Логотип показано не на візитках, а там, де він живе: шапка сайту, екран входу, мобільна темна тема, профіль і повідомлення, сповіщення, фавікон та іконка застосунку.",
      image: slide("07-usage", "Знак в інтерфейсі: шапка сайту, екран входу, мобільний темний екран, профіль і повідомлення, сповіщення, фавікон", "У продукті"),
    },
    {
      title: "Результат",
      body: "Компактна продуктова айдентика, що передає головну ідею платформи — поєднувати людей через цифрову взаємодію. Спрощена геометрія тримає впізнаваність у всьому продукті: від повного логотипа до аватарів, навігації, сповіщень і фавікона.",
    },
  ],
};

export const neuralEn: Case = {
  ...common,
  title: "Neural WebCam identity",
  role: "Brand & Product Designer",
  summary:
    "A product mark for a digital platform for live interaction and media: from meaning and geometry to versions, colour and behaviour in the interface.",
  tags: ["Brand identity", "Logo", "Product design"],
  cover: slide("00-cover", "Neural WebCam logo: the symbol and the name in one line on white", "Neural WebCam"),
  sections: [
    {
      title: "Brand overview",
      body: "Neural WebCam is a digital platform built around communication, content and interaction between users. It is more than a webcam app: the product holds profiles, publications, messaging, live sessions, premium access and verification.\n\nThe identity needed to feel technological, approachable and recognisable across a large product ecosystem.",
      image: slide("01-overview", "The large Neural WebCam logo on white with a short description of the platform", "Brand overview"),
    },
    {
      title: "The logo's task",
      body: "Not a decorative logo but a product mark, working in many places at once:\n— the main website;\n— the user profile;\n— the media and publication environment;\n— chat and live scenarios;\n— mobile and compact states;\n— favicon;\n— system notifications;\n— light and dark themes.",
    },
    {
      title: "Concept",
      body: "The mark is made of three simple shapes.\n\nThe circle: a camera lens, a live video window, a user avatar, an interface element.\n\nThe lower form: a camera base, a person's shoulders, a support and a connection point.\n\nThe separate dot, the most interesting detail: an active status, a recording indicator, a neural node, another participant of the system.\n\nUser + camera + node = Neural WebCam.",
      image: slide("02-concept", "The formula of the mark: a user circle, plus a camera, plus a node dot, equals the Neural WebCam symbol", "Concept"),
    },
    {
      title: "Why “Neural”",
      body: "The product's architecture has many connected roles, states and scenarios: Client, Model, Mediamanager, publication, profile, messaging, premium, verification.\n\nSo “Neural” is not about AI here. It is a connected system of users, media and interactions, almost like a neural structure. That is stronger and more honest than inventing an “AI webcam” when the product is wider.",
    },
    {
      title: "Process",
      body: "01 — Product research: the structure, user roles and main interaction scenarios.\n02 — Semantic direction: human, connection, live, video, network, digital.\n03 — Shape exploration: a simple form without a literal webcam.\n04 — Symbol reduction to a few basic geometric elements.\n05 — Balance and proportions: ring thickness, dot size, the lower support, overall weight.\n06 — Wordmark: soft rounded lettering, so the symbol and the name read as one system.\n07 — Colour: a primary blue, technological and calm.\n08 — Responsive testing at 16, 24, 32, 64 and 128 px.\n09 — Product integration: header, profile, favicon, sign-in screen, notifications, mobile UI.",
    },
    {
      title: "Geometry",
      body: "The module X is the diameter of the dot. It sets the proportions of the mark, the clear space (X on every side), the distance to the wordmark and the minimum size. The dot sits on a line to the centre of the ring; the lower support follows the ring's lower arc.",
      image: slide("03-construction", "Construction: outer and inner circles, axes, the dot as module X and the clear space", "Construction and clear space"),
    },
    {
      title: "Logo versions",
      body: "Primary: the blue symbol with the name. Horizontal: symbol on the left, name on the right. Symbol only: for UI, avatars and the favicon. Compact: without “WebCam”, for the smallest sizes. Monochrome, inverse (white on blue) and dark mode (blue and white on navy).",
      image: slide("04-versions", "Eight logo versions: primary, horizontal, symbol, compact, monochrome, inverse, dark, horizontal inverse", "Logo versions"),
    },
    {
      title: "Colour",
      body: "The signature gradient runs from light blue #71A1F2 to the primary blue #2459B4, the logo's own fill. Navy and a light paper tone carry both interface themes.",
      image: slide("05-color", "Palette: signature gradient, primary blue, light blue, navy and paper", "Colour"),
    },
    {
      title: "Responsive testing",
      body: "The symbol is checked at 16, 24, 32, 64 and 128 px on light, dark and blue backgrounds. Simple shapes and the separate dot stay readable even in a browser tab.",
      image: slide("06-sizes", "The symbol at 16, 24, 32, 64 and 128 px on white, navy and blue", "Responsive testing"),
    },
    {
      title: "In the product",
      body: "Instead of business cards and packaging, the logo is shown where it lives: the website header, the sign-in screen, the mobile dark theme, profile and messaging, notifications, the favicon and the app icon.",
      image: slide("07-usage", "The mark in the interface: website header, sign-in screen, mobile dark screen, profile and messaging, notification, favicon", "In the product"),
    },
    {
      title: "Result",
      body: "The visual identity was designed for a complex digital platform built around people, content and communication. The symbol combines a circular form associated with a camera, a profile and live interaction with a separate node representing connection and activity within the system. The simplified geometry keeps the identity recognisable across product interfaces, from full-size branding to avatars, navigation, notifications and favicon states. The result is a compact, product-oriented identity that reflects the platform's core idea: connecting people through digital interaction.",
    },
  ],
};
