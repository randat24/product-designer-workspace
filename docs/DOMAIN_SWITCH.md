# Переход на свой домен

Состояние: **отложено до команды владельца.** Домен не покупается без явного «да».
Кандидат: `hennadiifedorov.com` ($11.25 / год в Vercel, на 1 октября 2026 свободен). Ниже `домен` — выбранный домен.

Код к переходу готов: все абсолютные адреса (canonical, hreflang, sitemap, robots, JSON-LD, Open Graph)
строятся из одной переменной `NEXT_PUBLIC_SITE_URL` (`src/shared/lib/site-url.ts`). В коде нет зашитого
`*.vercel.app`; исключение — PDF-резюме, их пересобирают (шаг 5).

## Шаги (по команде)

1. **Купить домен** в Vercel (команда `randat24s-projects`) — только после «да».
2. **Подключить к проекту** `product-designer-workspace`: Vercel → Domains → Add.
   - Основной — `домен`; `www.домен` — Redirect (308) на основной.
   - `product-designer-workspace.vercel.app` — Redirect (308) на `https://домен`, чтобы у поисковиков был один адрес.
   - Дождаться *Valid Configuration* и выпуска сертификата (DNS у Vercel — минуты).
3. **Переменные Vercel (Production):** `NEXT_PUBLIC_SITE_URL=https://домен` (без слеша в конце). Redeploy production.
4. **Supabase → Authentication → URL Configuration** (делает владелец):
   - Site URL = `https://домен`;
   - Redirect URLs: добавить `https://домен/auth/callback`; старый `*.vercel.app/auth/callback` оставить на переходный период.
   - Без этого письма «Забыли пароль?» поведут на старый адрес.
5. **Резюме:** `NEXT_PUBLIC_SITE_URL=https://домен npm run cv` → PR с обновлёнными `public/cv/*.pdf` (в них ссылка на портфолио).
6. **Проверка** (`RELEASE_CHECKLIST.md`, раздел 5): `https://домен/uk` открывается, canonical и `sitemap.xml` на новом
   домене, старый адрес отвечает 308, вход в `/app` и восстановление пароля работают.
7. **Search Console:** ресурс **Domain** с подтверждением TXT-записью (Vercel → Domains → DNS Records),
   sitemap `https://домен/sitemap.xml`. Ресурс для `*.vercel.app` удалить через месяц. Bing — импорт из Search Console.
   Подробно — [SEARCH_CONSOLE_SETUP.md](SEARCH_CONSOLE_SETUP.md).
8. **Ссылки снаружи:** LinkedIn, Dribbble, Telegram, подпись в почте.

## Что не нужно менять

- Код и миграции — адрес берётся из переменной.
- Vercel Analytics и Speed Insights — привязаны к проекту, а не к домену.
- GA4 (если будет включён) — в потоке данных поменять URL сайта.
