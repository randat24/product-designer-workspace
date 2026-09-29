// UI strings. Add uk.ts / en.ts with the same shape when localisation ships.
export const ru = {
  app: { name: "Product Designer Workspace" },
  auth: {
    title: "Вход",
    lede: "Отправим ссылку для входа на почту. Пароль не нужен.",
    email: "Эл. почта",
    emailPlaceholder: "you@example.com",
    sendLink: "Отправить ссылку",
    sent: (email: string) => `Ссылка отправлена на ${email}. Откройте письмо на этом устройстве.`,
    google: "Войти через Google",
    or: "или",
    invalidEmail: "Введите адрес эл. почты целиком, например anna@studio.com",
    callbackFailed: "Ссылка для входа устарела или уже использована. Запросите новую.",
    signOut: "Выйти",
  },
  workspace: {
    projects: "Проекты",
    empty: "Здесь будут ваши проекты. Начните с названия — бриф, исследование и сценарии добавите по ходу.",
    newProject: "Новый проект",
    name: "Название",
    namePlaceholder: "Например: приложение для поиска ресторанов",
    description: "Коротко о продукте",
    descriptionPlaceholder: "Необязательно. Что это и для кого",
    platforms: "Платформы",
    create: "Создать проект",
    creating: "Создаю…",
    updated: "Изменён",
    nameRequired: "Введите название проекта",
    createFailed: "Не удалось создать проект. Проверьте, что у вас есть права редактора в этом пространстве.",
  },
  project: {
    overview: "Обзор",
    process: "Процесс",
    phaseSoon: (phase: number) => `Фаза ${phase}`,
    sectionSoonTitle: (label: string) => `Раздел «${label}» пока в разработке`,
    sectionSoonBody: (phase: number) =>
      `Он появится в фазе ${phase} дорожной карты. Структура данных для него уже заложена, поэтому связи с исследованием не придётся переносить.`,
    back: "К обзору проекта",
  },
  trace: {
    title: "Связи",
    emptyTitle: "Откройте инсайт, экран или решение",
    emptyBody: "Здесь будет видно, из каких интервью и цитат выросла сущность и во что она превратилась дальше.",
    upstream: "Источники",
    downstream: "Во что превратилось",
    none: "Пока нет связей",
    unsupported: "Нет источников",
  },
} as const;

export type Messages = typeof ru;
export const t = ru;
