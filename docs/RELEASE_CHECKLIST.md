# Release checklist — публичный сайт

Отмечать по порядку. Подробности — [SEO.md](SEO.md), [ANALYTICS.md](ANALYTICS.md), [GA4_SETUP.md](GA4_SETUP.md),
[SEARCH_CONSOLE_SETUP.md](SEARCH_CONSOLE_SETUP.md).

## 1. Код

- [ ] PR смержен в `main`, CI зелёный (`typecheck`, `build`, pgTAP).
- [ ] Vercel собрал production-деплой без ошибок.

## 2. Домен

- [ ] Домен выбран и куплен (только после явного «да» владельца).
- [ ] Vercel → **Domains**: домен добавлен к проекту, статус *Valid Configuration*, сертификат выдан.
- [ ] Выбран основной вариант (`домен` или `www.домен`); второй настроен как **Redirect** (308) на основной.
- [ ] Старый адрес `*.vercel.app` остаётся рабочим (канонический адрес всё равно ведёт на домен).

## 3. Переменные окружения (Vercel → Settings → Environment Variables)

- [ ] `NEXT_PUBLIC_SITE_URL=https://домен` — **Production**, без слеша в конце.
- [ ] `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Production и Preview.
- [ ] `NEXT_PUBLIC_GA_ID=G-…` — только Production (после [GA4_SETUP.md](GA4_SETUP.md)).
- [ ] `SUPABASE_SERVICE_ROLE_KEY` **нет** среди `NEXT_PUBLIC_*` и в репозитории (сайту он не нужен).
- [ ] `SITE_INDEXABLE` и `ANALYTICS_FORCE` в Vercel **не заданы**.
- [ ] Redeploy production после изменения переменных.

## 4. Supabase

- [ ] Authentication → URL Configuration: **Site URL** = `https://домен`; в **Redirect URLs** добавлены
  `https://домен/auth/callback` (и адрес `*.vercel.app`, пока он используется).
- [ ] Опубликованные кейсы на месте (`/uk/cases` показывает их).

## 5. Проверка production

```bash
SITE=https://домен
curl -sI $SITE/ | grep -iE "^(HTTP|location)"               # 307 → /uk или /en
curl -sI $SITE/uk | grep -iE "^(HTTP|x-robots)"              # 200, без X-Robots-Tag
curl -s  $SITE/uk | grep -o '<link rel="canonical"[^>]*>'   # https://домен/uk
curl -s  $SITE/robots.txt                                     # Allow: /, Sitemap: https://домен/sitemap.xml
curl -s  $SITE/sitemap.xml | grep -c "<loc>"
curl -sI $SITE/uk/nope | head -1                              # 404
curl -sI $SITE/app | grep -i x-robots                         # noindex, nofollow
```

- [ ] `/` ведёт на язык браузера; переключатель UA / EN сохраняет страницу.
- [ ] Светлая и тёмная тема переключаются и запоминаются; без выбора — как в системе.
- [ ] Кейс: бейдж «Реальний проєкт» / «Концепт», галерея страниц открывается, стрелки и Esc работают.
- [ ] Резюме PDF скачивается; ссылки на Telegram, LinkedIn, Dribbble, email верные.
- [ ] Вход в инструмент (`/app`) работает, проекты открываются.
- [ ] Preview-деплой (любая ветка): `X-Robots-Tag: noindex, nofollow`, robots.txt — `Disallow: /`.
- [ ] Картинка превью: вставить `https://домен/uk` в Telegram или <https://www.opengraph.xyz/> — видна карточка 1200×630.
- [ ] Rich Results Test (<https://search.google.com/test/rich-results>) для главной и кейса — без ошибок.
- [ ] PageSpeed Insights (<https://pagespeed.web.dev/>) для `/uk` и кейса: мобильный Performance ≥ 90, SEO 100
  (кейсы-примеры — SEO ниже из-за намеренного noindex).

## 6. Поиск и аналитика

- [ ] Search Console: домен подтверждён, sitemap отправлен ([SEARCH_CONSOLE_SETUP.md](SEARCH_CONSOLE_SETUP.md)).
- [ ] Bing Webmaster Tools: импорт из Search Console.
- [ ] GA4: Realtime показывает `page_view` и клики; ключевые события отмечены.
- [ ] Vercel → Speed Insights включён.

## 7. Контент (до того, как звать людей на сайт)

- [ ] Кейсы-примеры заменены реальными или остаются с плашкой «Кейс-приклад» (они в noindex).
- [ ] У реального кейса снят `sample`, заполнены обложка, галерея, `liveUrl` (если сайт доступен).
- [ ] Метрики в кейсах — только подтверждённые цифры.
- [ ] Фото в «Про мене» (сейчас место под него).

## 8. Через неделю

- [ ] Search Console → Pages: основные страницы в индексе, canonical совпадает.
- [ ] GA4: данные идут, в отчётах нет URL с query-строками.
- [ ] Speed Insights: LCP < 2,5 с, INP < 200 мс, CLS < 0,1 у 75% визитов.
