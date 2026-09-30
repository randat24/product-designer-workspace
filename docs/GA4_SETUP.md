# Google Analytics 4 — настройка без программиста

Займёт 15 минут. Нужен Google-аккаунт и доступ к проекту в Vercel. Что именно сайт отправляет — [ANALYTICS.md](ANALYTICS.md).

## 1. Создать ресурс

1. Открыть <https://analytics.google.com/> → **Start measuring** (или **Admin → Create → Property**, если аккаунт уже есть).
2. **Account name**: например, «Portfolio». Галочки обмена данными с Google можно снять все.
3. **Property name**: «Портфоліо — Геннадій Федоров». **Reporting time zone**: Ukraine. **Currency**: UAH или USD.
4. **Business details**: любая категория (например, *Jobs & Education*), размер — *Small*.
5. **Business objectives**: *Generate leads* (или *Understand web and/or app traffic*).
6. **Platform**: **Web**.

## 2. Поток данных (Data stream)

1. **Website URL**: итоговый домен сайта (например, `https://fedorov.design`), **Stream name**: «Site».
2. **Enhanced measurement** — оставить включённым. Внутри (значок шестерёнки) проверить, что включено
   **Page views → Page changes based on browser history events**: без этого переходы внутри сайта не посчитаются.
   *Site search*, *Form interactions* и *Video engagement* можно выключить — на сайте этого нет.
3. Нажать **Create stream** и скопировать **Measurement ID** вида `G-XXXXXXXXXX`.

## 3. Подключить к сайту

1. Vercel → проект → **Settings → Environment Variables**.
2. **Key**: `NEXT_PUBLIC_GA_ID`, **Value**: `G-XXXXXXXXXX` (без кавычек и пробелов), **Environment**: только **Production**.
3. **Save**, затем **Deployments** → последний production-деплой → **⋯ → Redeploy** (переменная попадает в сайт только при сборке).

## 4. Проверить, что данные идут

1. Открыть сайт в обычной вкладке (не в режиме инкогнито с блокировщиком рекламы).
2. GA4 → **Reports → Realtime**: через 10–30 секунд появится 1 пользователь и события `page_view`.
3. Нажать «Написати мені» или открыть кейс — в Realtime появятся `contact_email_click`, `case_open`.

Если ничего нет: проверить значение `NEXT_PUBLIC_GA_ID`, что был redeploy, и выключить блокировщик рекламы.

## 5. Отметить ключевые события (конверсии)

События появляются в списке в течение суток после первого срабатывания.

1. **Admin → Data display → Events**.
2. У событий `contact_email_click`, `telegram_click`, `linkedin_click`, `resume_download` включить звёздочку **Mark as key event**.

## 6. Параметры в отчётах (по желанию)

Чтобы видеть, *какой* кейс открывали и *откуда* писали:
**Admin → Data display → Custom definitions → Create custom dimension**, Scope: **Event**:

| Dimension name | Event parameter |
|---|---|
| Case | `case_slug` |
| Location | `location` |
| Language to | `to` |

## 7. Хранение данных и приватность

- **Admin → Data collection and modification → Data retention** → **14 months**.
- **Google signals** — не включать (сайт их и так отключает).
- Сайт не передаёт email, имена и параметры адреса; рекламные cookie запрещены по умолчанию.
  Если понадобится баннер согласия (например, для посетителей из ЕС), его можно добавить позже:
  код уже вызывает `gtag('consent', 'default', …)`.

## 8. Связать с Search Console

После [SEARCH_CONSOLE_SETUP.md](SEARCH_CONSOLE_SETUP.md): **Admin → Product links → Search Console links → Link**,
выбрать ресурс Search Console и поток «Site». Тогда в GA4 появятся запросы, по которым находят сайт.
