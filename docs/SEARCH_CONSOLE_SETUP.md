# Google Search Console, Bing и IndexNow

Делать после того, как сайт открыт на итоговом домене и в Vercel задан `NEXT_PUBLIC_SITE_URL=https://домен`
(см. [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md)). Ниже `домен` — ваш домен без `https://`.

## Google Search Console

### 1. Добавить ресурс

1. <https://search.google.com/search-console> → **Add property**.
2. Выбрать **Domain** (слева) и ввести `домен` — так подтверждаются сразу все варианты: `https`, `www`, поддомены.
3. Google покажет TXT-запись вида `google-site-verification=…`. Скопировать.

### 2. Подтвердить через DNS

- **Домен куплен в Vercel** (DNS в Vercel): Vercel → **Domains** → домен → **DNS Records → Add**:
  Type `TXT`, Name `@` (пусто), Value — строка из Google. Save.
- **DNS у регистратора** (Cloudflare, Namecheap, GoDaddy…): в разделе DNS добавить такую же TXT-запись для корня домена.

Вернуться в Search Console → **Verify**. Если не прошло — подождать 10–60 минут и нажать ещё раз.
Запись не удалять: она нужна для постоянного подтверждения.

> **Без своего домена** (сайт пока на `*.vercel.app`): ресурс **URL prefix** →
> `https://product-designer-workspace.vercel.app/` → способ **HTML tag**. Из тега
> `<meta name="google-site-verification" content="…">` скопировать значение `content` и добавить в Vercel переменную
> `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` (Production) → Redeploy → **Verify**. Код уже выводит тег на страницах сайта.
> Когда появится домен — добавить ресурс **Domain** с подтверждением через DNS, как выше.

### 3. Отправить sitemap

**Indexing → Sitemaps** → в поле ввести `sitemap.xml` → **Submit**. Статус «Success» и число найденных URL
(6 страниц + опубликованные кейсы не-примеры, на двух языках).

### 4. Запросить индексацию главных страниц

**URL inspection** → вставить `https://домен/uk` → **Request indexing**. Повторить для `/en`, `/uk/about`, `/en/about`,
`/uk/cases`, `/en/cases`. Не обязательно — Google найдёт их по sitemap, — но ускоряет первое появление.

### 5. Что проверить через 3–7 дней

- **Indexing → Pages**: страницы в «Indexed». В «Not indexed» нормальны: `/` (редирект), кейсы-примеры
  («Excluded by noindex»), `/login` (noindex), 404.
- **URL inspection** для кейса: *User-declared canonical* = *Google-selected canonical*.
- **Experience → Core Web Vitals**: появится, когда наберётся трафик.
- **Enhancements / Breadcrumbs**: хлебные крошки на кейсах распознаны.

### 6. Связать с GA4

См. раздел 8 в [GA4_SETUP.md](GA4_SETUP.md).

## Bing Webmaster Tools

1. <https://www.bing.com/webmasters> → войти.
2. **Import from Google Search Console** — самый быстрый путь: ресурс и sitemap переносятся сами.
   Иначе — **Add site** → `https://домен` → подтверждение DNS-записью `CNAME` или `TXT`, как предложит Bing.
3. **Sitemaps → Submit sitemap** → `https://домен/sitemap.xml` (если не импортировался).

Bing также питает поиск DuckDuckGo, Yahoo и ответы ChatGPT/Copilot с веб-поиском.

## IndexNow (по желанию)

IndexNow мгновенно сообщает Bing, Yandex, Seznam и Naver о новом или изменённом URL. Google его не использует.
Для портфолио с редкими обновлениями sitemap достаточно, поэтому в коде IndexNow **не подключён**.

Если захочется ускорить появление нового кейса в Bing:

1. Сгенерировать ключ (32 символа a–z, 0–9) и положить файл `public/<ключ>.txt` с этим же ключом внутри. Закоммитить.
2. После публикации кейса отправить:

   ```bash
   curl -s "https://api.indexnow.org/indexnow?url=https://домен/uk/cases/<slug>&key=<ключ>"
   ```

   Ответ `200` или `202` — принято.

Ключ не секретный (он публичен в файле), но в репозиторий других ключей класть нельзя.
