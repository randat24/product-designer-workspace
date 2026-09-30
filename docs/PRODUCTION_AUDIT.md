# Production audit — публичный сайт и границы приложения

Дата: 2026-09-30. Ветка `main` на коммите `cbc7dca` (после PR #13).
Метод: чтение кода, `next build` + `next start` локально, реальные HTTP-ответы (`curl`), сгенерированный HTML.

Приоритеты: **Critical** — ломает индексацию или безопасность; **High** — заметно вредит SEO/доступности/скорости; **Medium** — стоит исправить до релиза; **Low** — улучшение.

---

## 1. Текущее состояние

### Стек и развёртывание
- Next.js 15.5 (App Router), React 19, TypeScript strict, Tailwind 4, Supabase (Auth + Postgres + Storage), Vercel (`vercel.json`: только `framework: nextjs`).
- `next.config.ts`: `typedRoutes: false`, лимит тела server actions 2 MB. Заголовков, редиректов, настроек изображений нет.
- Шрифты: `@fontsource-variable/manrope` и `oswald`, подключены CSS-импортом в корневом `layout.tsx` (self-hosted, `font-display: swap`, подмножества по `unicode-range`).
- Одна корневая раскладка `src/app/layout.tsx` с `<html lang="ru">` для всего: и для инструмента, и для сайта.

### Карта URL

**Публичные, должны индексироваться**

| URL | Рендеринг | Источник данных |
|---|---|---|
| `/uk`, `/en` | ISR, `revalidate = 60` | `content.ts` + кейсы из Supabase |
| `/uk/cases`, `/en/cases` | ISR 60 с | `case_studies` (published) |
| `/uk/cases/[slug]`, `/en/cases/[slug]` | ISR 60 с, `generateStaticParams` из базы | `case_studies.content` |
| `/uk/about`, `/en/about` | статика | `content.ts` |

**Публичные вспомогательные**
- `/` — 307 на `/uk` или `/en` по `Accept-Language` (server component `redirect()`).
- `/cv/hennadii-fedorov-cv-uk.pdf`, `/awards/*.svg` — статические файлы.

**Приватные, не должны попадать в поиск**
- `/app` (выбор пространства), `/w/[ws]/**` (весь инструмент), `/account`.
- `/login`, `/auth/callback`, `/auth/signout` (route handlers).
- API-роутов (`/api`) нет; мутации — server actions.

### Как защищены приватные маршруты
`src/middleware.ts` → `updateSession()`: на **каждом** запросе (кроме статики по расширению) создаётся Supabase-клиент и вызывается `auth.getUser()` (сетевой запрос к Supabase). Публичными считаются `/`, `/login`, `/auth`, `/uk`, `/en`, `/cv`; всё остальное без сессии → 307 на `/login?next=…`. Данные дополнительно защищены RLS в Postgres.

### Что уже есть из SEO
- `generateMetadata` на страницах сайта: title, description (у кейсов), `alternates.languages` для `uk`/`en`.
- Шаблон заголовка сайта `%s — Геннадій Федоров`.
- Больше ничего: canonical, x-default, Open Graph, Twitter, robots, sitemap, JSON-LD, favicon, аналитики нет.

---

## 2. Найденные проблемы

### Индексация
| # | Проблема | Факт (локальная проверка) | Приоритет |
|---|---|---|---|
| I1 | `/robots.txt` и `/sitemap.xml` не существуют и уходят на логин | `/robots.txt → 307 /login?next=%2Frobots.txt` | **Critical** |
| I2 | Любой неизвестный URL уводит на логин вместо 404 | `/foo → 307 /login?next=%2Ffoo` — мягкие 404 и цепочки редиректов для ботов | **Critical** |
| I3 | `/login` индексируем: нет `noindex`, есть в выдаче потенциально | `<title>Вход · …</title>`, нет `robots` | High |
| I4 | Приватные маршруты закрыты только редиректом; нет `noindex`/`X-Robots-Tag` на случай утечки URL | — | High |
| I5 | Превью-деплои Vercel (`*-git-*.vercel.app`) индексируемы, как и прод | нет различия окружений | High |
| I6 | Кейсы — заглушки («Приклад тексту», метрики «+00%», иллюстративные цитаты) открыты для индексации как настоящие работы | содержимое `case_studies.content` | High |

### SEO страниц
| # | Проблема | Приоритет |
|---|---|---|
| S1 | Нет canonical ни на одной странице | High |
| S2 | hreflang относительные (`href="/uk"`), нет `x-default` | High |
| S3 | Заголовок сайта получает хвост инструмента: `Геннадій Федоров — … · Product Designer Workspace` (корневой шаблон перекрывает) | High |
| S4 | Описание главной начинается со строчной буквы («продуктовий дизайнер…» — обрезок фразы); у «Роботи» и «Про мене» нет своих описаний | Medium |
| S5 | Нет Open Graph / Twitter-метаданных и изображения для превью | High |
| S6 | Нет favicon / apple-touch-icon (`/favicon.ico → 404`) | Medium |
| S7 | Нет структурированных данных (Person, WebSite, ProfilePage, BreadcrumbList, CreativeWork) | Medium |
| S8 | Нет базового origin: всё, что должно быть абсолютным (canonical, OG, sitemap), некуда привязать; `NEXT_PUBLIC_SITE_URL` используется только для auth-писем | High |

### Международное SEO
| # | Проблема | Приоритет |
|---|---|---|
| L1 | `<html lang="ru">` на украинских и английских страницах (язык выставлен только на внутреннем `<div lang>`) | High |
| L2 | `/` решает язык по `Accept-Language` без `x-default` — боты без заголовка всегда видят `/uk`, связь с `/en` не объявлена | Medium |
| L3 | Нет `og:locale` / `og:locale:alternate` | Low |

### Производительность
| # | Проблема | Приоритет |
|---|---|---|
| P1 | Middleware делает `supabase.auth.getUser()` (сетевой запрос) на каждом запросе к публичным страницам — лишняя задержка TTFB для всех посетителей сайта | High |
| P2 | Шрифты без preload; возможен сдвиг при подмене (FOUT). Для сайта с крупной типографикой Oswald заметно | Low |
| P3 | SVG наград 27–86 КБ (6 штук на «Про мене», миниатюры на главной); уже `loading="lazy"` | Low |
| P4 | Клиентского JS на сайте мало (переключатель языка, «Вгору») — хорошо. Сторонних скриптов нет | — |

### Доступность (влияет и на SEO)
| # | Проблема | Приоритет |
|---|---|---|
| A1 | Неверный язык документа (см. L1) — скринридеры читают украинский как русский | High |
| A2 | Основная навигация подписана `aria-label="Роботи"`; мобильная навигация без подписи | Medium |
| A3 | Нет ссылки «Перейти до вмісту» | Medium |
| A4 | Нет переключателя темы (запрос владельца), тема только системная | Medium |
| A5 | Заголовки: на страницах один `h1`, иерархия h2/h3 корректна; фокус `:focus-visible` глобально есть; анимация подписи уважает `prefers-reduced-motion` | — |

### Аналитика
Не установлена: ни GA4, ни Vercel Analytics / Speed Insights. Событий нет. — **Medium** (нужно до релиза, но не блокирует индексацию).

### Безопасность и конфигурация
| # | Проблема | Приоритет |
|---|---|---|
| X1 | Нет базовых заголовков: `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, защиты от фрейминга; отдаётся `X-Powered-By: Next.js` | Medium |
| X2 | `.env.example` содержит реальные URL проекта Supabase и publishable-ключ. Ключ публичный по дизайну (он и так в клиентском JS), но пример должен содержать только заглушки | Low |
| X3 | `SUPABASE_SERVICE_ROLE_KEY` в коде и репозитории не используется и не встречается — хорошо | — |
| X4 | Все таблицы под RLS; `anon` читает только опубликованные `case_studies` (проверено pgTAP и в облаке) | — |

### Контент
- Все 4 кейса — заглушки (помечены «Приклад тексту» / «приклад», метрики-нули, цитаты иллюстративные). Честный вариант до появления реального контента — не отдавать их в индекс.
- Нет разделения «реальный проект / концепт» и способа показать страницы проекта, если живого сайта нет (запрос владельца).
- Внутренние ссылки: главная → кейсы и «Про мене»; кейс → «Усі роботи» и «Наступний кейс». С «Про мене» нет ссылки на работы; в подвале нет навигации.

### Ошибки и редиректы
- `/uk/nope`, `/uk/cases/nope` → 404, но страница 404 общая, на русском, из инструмента («Страница не найдена», ссылка «На главную» на `/` → ещё редирект).
- `/` → 307 (корректно для выбора языка, но без `x-default`).

---

## 3. Что меняем (план)

| Приоритет | Изменение | Закрывает |
|---|---|---|
| Critical | `app/robots.ts`, `app/sitemap.ts`; middleware пропускает их и все публичные файлы | I1 |
| Critical | Middleware защищает только маршруты инструмента (`/app`, `/w`, `/account`); остальное неизвестное → локализованный 404 | I2 |
| High | Отдельные корневые раскладки: сайт — `<html lang={locale}>`, инструмент — `lang="ru"` | L1, A1, S3 |
| High | Единый origin `getSiteUrl()` из `NEXT_PUBLIC_SITE_URL` (+ `VERCEL_PROJECT_PRODUCTION_URL` как запасной), `metadataBase` | S8 |
| High | Общий построитель метаданных: title, description, canonical, hreflang uk/en/x-default, OG, Twitter, robots | S1, S2, S5, L3 |
| High | `noindex` на инструменте и логине (metadata + заголовок `X-Robots-Tag`); на превью-деплоях `noindex` для всего и `Disallow: /` | I3, I4, I5 |
| High | Кейсы-заглушки помечены `sample` → `noindex`, не попадают в sitemap | I6 |
| High | Middleware не ходит в Supabase на публичных страницах | P1 |
| Medium | JSON-LD: Person, WebSite, ProfilePage, BreadcrumbList, CreativeWork | S7 |
| Medium | OG-картинки (общая и для каждого кейса), иконки | S5, S6 |
| Medium | GA4 через переменную окружения, события через один помощник; Vercel Speed Insights | аналитика |
| Medium | Заголовки безопасности, убрать `X-Powered-By` | X1 |
| Medium | Локализованная 404, skip-link, подписи навигации, ссылки в подвале, переключатель темы | A2–A4, 404 |
| Medium | Реальный проект / концепт + просмотр страниц проекта | контент |
| Low | Заглушки в `.env.example` | X2 |

Подробности внедрения — в `docs/SEO.md`, `docs/ANALYTICS.md`, `docs/GA4_SETUP.md`, `docs/SEARCH_CONSOLE_SETUP.md`, `docs/RELEASE_CHECKLIST.md`.
