# Аналитика публичного сайта

GA4 (Google Analytics 4) + Vercel Speed Insights. Только публичный сайт: инструмент (`/app`, `/login`)
аналитику не подключает. Настройка аккаунта GA4 для не-разработчика — [GA4_SETUP.md](GA4_SETUP.md).

## Когда включается

| Условие | GA4 | Speed Insights |
|---|---|---|
| Vercel production + `NEXT_PUBLIC_GA_ID=G-…` | да | да (включить в Vercel → Speed Insights) |
| Vercel preview | нет | да (данные preview Vercel показывает отдельно) |
| локально (`npm run dev` / `next start`) | нет; для проверки — `ANALYTICS_FORCE=true` | нет |

`NEXT_PUBLIC_GA_ID` проверяется по формату `G-XXXXXXXX`; пустое или неверное значение — скрипт не загружается.
Значение попадает в сборку, поэтому после изменения нужен redeploy.

## Как устроено

- `src/site/analytics/google-analytics.tsx` — загрузка `gtag.js` через `next/script` (`afterInteractive`, не блокирует отрисовку).
  - Consent по умолчанию: рекламное хранилище и персонализация — `denied`, аналитика — `granted`.
  - `allow_google_signals: false`, `allow_ad_personalization_signals: false`.
  - `page_location` = адрес без query-строки (UTM и любые параметры не уходят в отчёт страниц).
- Просмотры страниц: первый — из `config`, переходы внутри сайта — enhanced measurement GA4
  («Page changes based on browser history events»). Ручной `page_view` не отправляется, поэтому дублей нет.
- `src/site/analytics/track.ts` — `track(name, params)` для клиентских компонентов и `trackAttrs(name, params)` для серверных:
  атрибуты `data-track` / `data-track-params` читает один делегированный обработчик клика
  (`click-listener.tsx` в раскладке сайта). Без загруженного GA4 это no-op.
- Список событий и параметров — один файл `src/site/analytics/events.ts` (TypeScript не даст отправить неизвестное событие).

## События

| Событие | Когда | Параметры |
|---|---|---|
| `page_view` | загрузка страницы и переходы (автоматически) | стандартные GA4 |
| `contact_email_click` | ссылка `mailto:` | `location`: `hero` / `contact` / `footer` / `about` / `case` (+ `case_slug`) |
| `telegram_click` | ссылка на Telegram | `location` |
| `linkedin_click` | ссылка на LinkedIn | `location` |
| `dribbble_click` | ссылка на Dribbble | `location` |
| `resume_download` | «Резюме (PDF)» | `location` |
| `case_open` | карточка кейса | `case_slug`, `location`: `home` / `cases` |
| `case_next` | «Наступний кейс» | `case_slug`, `next_slug` |
| `case_live_open` | «Відкрити сайт проєкту» | `case_slug`, `location` |
| `case_gallery_open` | открытие страницы проекта в галерее | `case_slug`, `page` |
| `certificate_open` | сертификат на «Про мене» | `provider` (организация, выдавшая сертификат) |
| `language_switch` | переключатель UA / EN | `from`, `to` |
| `theme_switch` | светлая / тёмная тема | `theme` |
| `portfolio_cta_click` | «Дивитися роботи →» на «Про мене» | `cta`, `location` |

Персональных данных нет: ни email, ни имён, ни идентификаторов пользователя, ни query-строк. Slug кейса — публичная часть URL.

Enhanced measurement GA4 дополнительно отправит `click` (исходящие ссылки) и `file_download` (PDF) — это другие
имена, не дубли. Если они не нужны — выключить соответствующие переключатели в Data stream.

### Что отметить ключевыми событиями (Key events)

`contact_email_click`, `telegram_click`, `linkedin_click`, `resume_download` — это «контакт состоялся».
Как отметить — в [GA4_SETUP.md](GA4_SETUP.md).

### Проверка

1. Локально: `ANALYTICS_FORCE=true NEXT_PUBLIC_GA_ID=G-… npm run build && npm start`, открыть сайт,
   в консоли браузера `dataLayer` — там `config` и события после кликов.
2. На production: GA4 → Admin → DebugView (с расширением Google Analytics Debugger) или Reports → Realtime.

## Добавить событие

1. Добавить имя в `AnalyticsEvent` (и параметр в `AnalyticsParams`, если нужен новый) в `events.ts`.
2. Серверный компонент: `<a {...trackAttrs("имя", { location: "hero" })}>`; клиентский: `track("имя", {...})`.
3. Строку в таблицу выше. Нестандартный параметр, который нужен в отчётах, зарегистрировать в GA4 как
   custom dimension (Admin → Custom definitions, scope Event).

## Google Tag Manager — не нужен

Событий немного, все они описаны в коде и типизированы. GTM добавил бы ещё один скрипт (~80 КБ), отдельную
консоль с правами на внедрение произвольного JS и второй источник правды. Вернуться к вопросу, если появятся
рекламные пиксели или маркетолог, которому нужно менять теги без деплоя.

## Vercel Speed Insights

`@vercel/speed-insights` (версия закреплена) — реальные Core Web Vitals посетителей (LCP, INP, CLS) по страницам.
Компонент подключён в раскладке сайта и рендерится только на Vercel (вне Vercel нет эндпоинта `/_vercel/…`).
Включить: Vercel → проект → Speed Insights → Enable. Cookies не использует.
