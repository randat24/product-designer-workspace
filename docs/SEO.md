# SEO публичного сайта

Как устроены индексация, метаданные и структурированные данные сайта-портфолио. Инструмент
(`/app`, `/w/**`, `/account`, `/login`, `/auth/**`) в поиск не попадает никогда.

## Карта маршрутов

| URL | Индексируется | Рендеринг |
|---|---|---|
| `/` | нет (307 на `/uk` или `/en` по `Accept-Language`, `Vary: Accept-Language`) | middleware |
| `/uk`, `/en` | да | ISR 60 с |
| `/uk/cases`, `/en/cases` | да | ISR 60 с |
| `/uk/cases/[slug]`, `/en/cases/[slug]` | да, кроме кейсов-примеров (`sample: true`) | ISR 60 с, новые кейсы — при первом запросе |
| `/uk/about`, `/en/about` | да | статика |
| `/uk/start-project`, `/en/start-project` | да (сама форма; ответы клиента не попадают ни в один URL) | статика + клиентская форма |
| `/uk/privacy`, `/en/privacy` | да | статика |
| `/api/project-request/brief` | нет: `X-Robots-Tag: noindex`, только POST с одноразовым токеном, `Cache-Control: private, no-store` | route handler |
| любой неизвестный URL | нет, статус 404 | `app/global-not-found.tsx` (язык из URL или браузера) |
| неизвестный кейс `/uk/cases/nope` | нет, статус 404 | `app/(site)/[locale]/not-found.tsx` |
| `/app`, `/w/**`, `/account` | нет: `X-Robots-Tag` + `Disallow` в robots.txt; без входа — 307 на `/login` | инструмент |
| `/login`, `/auth/**` | нет: `X-Robots-Tag` + meta robots (не закрыты в robots.txt, чтобы поисковик увидел noindex) | инструмент |
| `/robots.txt`, `/sitemap.xml`, `/og`, иконки | служебные | route handlers / metadata routes |

Middleware (`src/shared/lib/supabase/middleware.ts`) ходит в Supabase только для приватных и auth-путей:
публичные страницы отдаются без сессии и кешируются.

## Один канонический адрес

`src/shared/lib/site-url.ts`:

- `getSiteUrl()` — `NEXT_PUBLIC_SITE_URL` → домен production в Vercel (`VERCEL_PROJECT_PRODUCTION_URL`) → `http://localhost:3000`.
  Адрес preview-деплоя не используется никогда.
- `isIndexable()` — `true` только на Vercel production (`VERCEL_ENV=production`) или при `SITE_INDEXABLE=true` вне Vercel.
  На preview и в разработке все страницы получают `noindex` (meta + заголовок `X-Robots-Tag`), robots.txt — `Disallow: /`.

После подключения домена: задать `NEXT_PUBLIC_SITE_URL=https://домен` в Vercel (Production) и сделать redeploy.

## Метаданные страниц

Все страницы сайта строят метаданные через `pageMetadata()` из `src/site/seo.ts`:

- уникальные `title` и `description` из словаря (`d.seo.*` в `src/site/content.ts`), для кейса — название и краткое описание;
- шаблон заголовка `%s | Имя` задан в `app/(site)/[locale]/layout.tsx`, главная использует полный заголовок;
- `canonical` — абсолютный URL текущей языковой версии;
- `hreflang`: `uk`, `en` и `x-default` (для главной — `/`, для остальных — украинская версия);
- `robots`: `index, follow, max-image-preview:large` или `noindex, follow` для кейсов-примеров;
- Open Graph (`og:locale` `uk_UA` / `en_US` + `alternateLocale`) и Twitter `summary_large_image`;
- `<html lang>` соответствует языку страницы (у сайта своя корневая раскладка, у инструмента — своя, `lang="ru"`).

## Open Graph картинки

`/og?locale=uk` — карточка сайта, `/og?locale=uk&case=<slug>` — карточка кейса (1200×630, `next/og`).
Шрифты Oswald и Manrope (латиница + кириллица) лежат в `src/site/og/fonts/`. Кеш: сутки + stale-while-revalidate неделя.
Проверка: открыть URL картинки в браузере или вставить страницу в <https://www.opengraph.xyz/>.

## Структурированные данные (JSON-LD)

`src/site/seo.ts`, выводятся компонентом `src/site/json-ld.tsx` (экранирование `<`, U+2028/2029):

| Страница | Типы |
|---|---|
| Главная | `WebSite` + `Person` |
| Про мене | `ProfilePage` (mainEntity → `Person`) + `Person` + `BreadcrumbList` |
| Роботи | `CollectionPage` (mainEntity → `ItemList` опубликованных кейсов) + `BreadcrumbList` |
| Кейс | `CreativeWork` (автор → `Person`) + `BreadcrumbList` |

Только факты, видимые на сайте: имя, роль, город, публичные профили (`sameAs`), навыки, награды (`award`),
обучение (`alumniOf`, сертификаты — `hasCredential` со ссылкой на запись). Никаких рейтингов,
отзывов, выдуманных клиентов или дат. Проверка: <https://search.google.com/test/rich-results> и <https://validator.schema.org/>.

## robots.txt и sitemap.xml

- `app/robots.ts`: на production — `Allow: /`, `Disallow: /app`, `/w/`, `/account` и ссылка на sitemap; иначе `Disallow: /`.
  Боты AI-ассистентов перечислены отдельной группой с теми же правилами (см. «AI-поиск»).
- `app/sitemap.ts`: главная, «Роботи», «Про мене» и опубликованные кейсы на обоих языках с `hreflang`-альтернативами.
  Кейсы-примеры (`sample: true`) и приватные URL в sitemap не попадают. Обновляется раз в час.

## AI-поиск (ChatGPT, Perplexity, Claude, Google AI)

Цель — чтобы ассистенты находили сайт и цитировали нужную страницу на вопросы вроде «продуктовый дизайнер
из Украины с дизайн-системами».

- **`/llms.txt`** (`app/llms.txt/route.ts`, формат <https://llmstxt.org>): Markdown-сводка — кто, роль, город,
  навыки, опыт, служба, награды, обучение, формат работы, все опубликованные кейсы со ссылками и коротким
  описанием, страницы и контакты. Сначала английский, затем то же по-украински. Собирается из тех же данных,
  что и страницы (`dict()`, «Профіль сайту», опубликованные кейсы), обновляется раз в час; примеры не входят.
  Новый кейс попадает туда сам. На превью отдаётся с `X-Robots-Tag: noindex`.
- **robots.txt**: поисковые и «по запросу пользователя» боты (`OAI-SearchBot`, `ChatGPT-User`, `Claude-SearchBot`,
  `Claude-User`, `PerplexityBot`, `Perplexity-User`, `Bingbot`) и боты обучения (`GPTBot`, `ClaudeBot`,
  `Google-Extended`, `Applebot-Extended`) разрешены явно: для портфолио важно, чтобы модели знали автора.
  Чтобы запретить только обучение, вынести `GPTBot`, `ClaudeBot`, `Google-Extended`, `Applebot-Extended` в
  отдельную группу с `Disallow: /` — цитирование в поиске это не отключит.
- **JSON-LD** (выше): `Person` с наградами и обучением, `CollectionPage` + `ItemList` для списка работ.

Что делается вне кода:
- Тексты: короткие самодостаточные ответы (40–60 слов) в начале «Про мене» и кейсов — кто, что сделал, какой
  результат в цифрах. Тексты ведутся в `src/site/content.ts` и в инструменте.
- Присутствие: LinkedIn, Dribbble, Behance с той же ролью и формулировкой, что на сайте, и ссылкой на него.
  Ассистенты сверяют источники между собой.
- Проверка раз в месяц: задать ChatGPT (с поиском), Perplexity и Google 5–10 запросов («product designer
  Mykolaiv», «Hennadii Fedorov designer», «UI/UX дизайнер Україна дизайн-система») и записать, цитируется ли сайт.

## Кейсы: реальные, концепты, примеры

Поля кейса (`Case` в `content.ts`, в базе — `case_studies.content.{uk,en}`):

- `kind: "real" | "concept"` — бейдж «Реальний проєкт» / «Концепт» на карточке и странице;
- `liveUrl` — кнопка «Відкрити сайт проєкту»; если её нет (сайт недоступен или это концепт) — ссылка на галерею;
- `gallery` — «Сторінки проєкту»: сетка превью и полноэкранный просмотр (стрелки, Esc); картинки в `public/cases/<slug>/`;
- `sample: true` — кейс-пример с иллюстративными цифрами: `noindex`, нет в sitemap, плашка «Кейс-приклад».

Когда кейс заполнен реальным содержимым — убрать `sample` (в базе: `content.uk.sample` и `content.en.sample`),
и он попадёт в индекс и sitemap сам.

## 404

- Неизвестный URL → middleware переписывает запрос на путь без маршрута, Next.js отдаёт `app/global-not-found.tsx`:
  статус 404, полный HTML на языке из URL (`/en/...`) или браузера, ссылки на главную, работы, «Про мене».
- Неизвестный кейс → `notFound()` → `app/(site)/[locale]/not-found.tsx` внутри раскладки сайта, тоже 404.
- Next.js сам добавляет `<meta name="robots" content="noindex">` к ответам 404.
- В `not-found.tsx` нельзя читать `headers()`: это делает динамическими все страницы сайта (проверено сборкой).

## Заголовки безопасности

`next.config.ts`: `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options: DENY`,
CSP `frame-ancestors 'none'; base-uri 'self'; object-src 'none'` (без `script-src`, чтобы не ломать Next.js, GA4 и
Speed Insights). HSTS Vercel ставит сам. `poweredByHeader: false`.

## Проверка после деплоя

```bash
SITE=https://домен
curl -sI $SITE/ | grep -iE "^(HTTP|location|vary)"          # 307 → /uk или /en
curl -s  $SITE/robots.txt
curl -sI $SITE/llms.txt | grep -i content-type                  # text/markdown
curl -s  $SITE/sitemap.xml | head -40
curl -sI $SITE/uk/nope | head -1                              # 404
curl -sI $SITE/app | grep -i x-robots                          # noindex, nofollow
curl -s  $SITE/uk | grep -oE '<link rel="(canonical|alternate)"[^>]*>'
```

Дальше — [SEARCH_CONSOLE_SETUP.md](SEARCH_CONSOLE_SETUP.md) и [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md).
