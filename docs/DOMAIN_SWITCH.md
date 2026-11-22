# Переход на свой домен

Состояние: **22 октября 2026 переходим на `fedorov-design.com.ua`.** Владелец купил `fedorov-design.com.ua` (основной) и
`fedorov-design.store` у украинского регистратора, DNS на `ns10–12.uadns.com`: `A @ 76.76.21.21`, `CNAME www cname.vercel-dns.com`.
В Vercel `www.fedorov-design.com.ua`, `fedorov-design.store` и `www.fedorov-design.store` — Redirect 308 на основной.
Шаг 1 ниже (покупка в Vercel) не понадобился.

13 октября 2026 адрес на Vercel сменили с `product-designer-workspace.vercel.app` на `fedorov-design.vercel.app`: новый адрес добавлен к проекту, `NEXT_PUBLIC_SITE_URL` указывает на него, резюме пересобраны. Старый адрес пока тоже открывается (canonical ведёт на новый). В Supabase → Authentication → URL Configuration нужно добавить новый адрес (шаг 4 ниже).

Ниже `домен` — `fedorov-design.com.ua`.

Код к переходу готов: все абсолютные адреса (canonical, hreflang, sitemap, robots, JSON-LD, Open Graph)
строятся из одной переменной `NEXT_PUBLIC_SITE_URL` (`src/shared/lib/site-url.ts`). В коде нет зашитого
`*.vercel.app`; исключение — PDF-резюме, их пересобирают (шаг 5).

## Шаги (по команде)

1. **Купить домен** в Vercel (команда `randat24s-projects`) — только после «да».
2. **Подключить к проекту** `product-designer-workspace`: Vercel → Domains → Add.
   - Основной — `домен`; `www.домен` — Redirect (308) на основной.
   - `fedorov-design.vercel.app` и старый `product-designer-workspace.vercel.app` — Redirect (308) на `https://домен`, чтобы у поисковиков был один адрес.
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
