# Product Designer Workspace

Рабочее пространство продуктового дизайнера со сквозной traceability:
`Interview → Quote → Insight → Pain Point → Opportunity → Flow → Screen → Decision`.

Документация: [`docs/`](docs) · решения: [`docs/adr/`](docs/adr) · план: [`docs/ROADMAP.md`](docs/ROADMAP.md)

## Статус

**Phase 5 — Synthesis: готово, ждёт ревью** (в одном PR с Phase 4). Phase 1–3: в `main`.

| Phase 5 | Проверено |
|---|---|
| Цитата `Q-###` из выделенного фрагмента ответа за одно действие (кнопка или ⌥Q), автоматически связана с ответом | e2e, pgTAP |
| Наблюдение `OBS-###` из выделения (⌥O), из цитаты или вручную на доске; 6 типов | e2e, pgTAP |
| Доска синтеза: колонки-паттерны `PAT-##`, карточки с цветом участника, drag-and-drop и «Переместить в…» с клавиатуры | e2e |
| «Сформулировать инсайт» из колонки: все карточки кластера становятся источниками | e2e |
| Инсайты `INS-###` (уверенность, статус, источники), флаг «нет источников» после удаления единственной цитаты | e2e, pgTAP |
| Боли `PP-###`: серьёзность, частота = уникальные участники по trace-графу, сортировка серьёзность × частота | e2e, pgTAP |
| Возможности `OPP-###`: HMW, матрица влияние × усилия | e2e |
| Панель «Связи» на страницах сущностей: коды и тексты источников и последствий, «Связать…» по правилам, удаление связи | e2e |
| Демо: 6 цитат, 7 наблюдений, 3 паттерна, 3 инсайта, 2 боли, 1 возможность — цепочка от возможности до ответов интервью | pgTAP + e2e |

Phase 4 — Research:

| Phase 4 | Проверено |
|---|---|
| Планы исследований `RP-##`: цель, исследовательские вопросы, гипотезы, аудитория, метод, число участников, критерии | e2e |
| Сценарий интервью: 8 секций, уточняющие вопросы, «ключевой», перенос между секциями, порядок ↑↓, шаблон | e2e |
| Участники `P##`: таблица, профиль, личные данные отдельно, согласие, теги | e2e, pgTAP |
| Интервью `INT-##`: детали, ответы по секциям, свободные заметки; ответы `ANS-####` сохраняются по полю | e2e, pgTAP |
| Live-режим: вопрос за вопросом, таймер, Alt+←/→, завершение ставит статус и длительность; планшет 768px | e2e |
| Матрица «вопрос × участник» в стиле тетради: стикеры-колонки, ответы в ячейках, «+ Участник» | e2e |
| Импорт JSON из «Рабочей тетради»: бриф (только пустые поля), конкуренты, вопросы, респонденты, ответы | e2e |
| Демо: план, сценарий из 5 вопросов, 7 участников и их ответы из материалов тетради | pgTAP + e2e |

Phase 3 — Competitors:

| Phase 3 | Проверено |
|---|---|
| Визуальный язык «Рабочей тетради»: тёмная навигация с прогрессом этапов, Oswald/Manrope, панели, стикеры (DESIGN-SYSTEM v0.2) | скриншоты light/dark/mobile |
| Конкуренты `CP-##`: карточки с фильтром по типу, карточка с автосохранением, «наш продукт» | e2e, pgTAP |
| Скриншоты: приватный бакет `attachments`, загрузка из браузера по RLS, галерея, удаление вместе с файлами | e2e, pgTAP (политики Storage) |
| Матрица Feature × Product: группы, переключение ячеек кликом, переименование строк, итог по продуктам | e2e, pgTAP |
| Overview, навигация и ⌘K знают о конкурентах; демо-проект с 3 конкурентами и заполненной матрицей | e2e |

| Phase 2 | Проверено |
|---|---|
| Project Brief: 7 секций, списки целей/метрик/команды/ссылок, автосохранение, режим только чтения для viewer | e2e в браузере, 16 pgTAP-тестов |
| `project_briefs` 1:1 с проектом (создаётся триггером), RLS, activity log | pgTAP |
| Overview: этапы ✓ ● ○, прогресс брифа, next actions v1 (ссылки на пустые поля), недавние изменения | e2e |
| Настройки проекта: название, описание, платформы, статус; архив и возврат; удаление с подтверждением (только owner) | e2e |
| ⌘K v1: разделы, проекты пространства, действия | e2e |
| Демо-проект «Restaurant App» (`create_demo_project`) с заполненным брифом | pgTAP + e2e |

Phase 1 — Foundation:

| Есть | Проверено |
|---|---|
| Next.js 15 (App Router, TS strict), Tailwind 4, токены из DESIGN-SYSTEM | `typecheck` и `build` проходят |
| Supabase Auth: magic link + Google, middleware-защита маршрутов | редиректы проверены на собранном приложении |
| Схема ядра: profiles, workspaces, members, projects, entity_types, project_counters, trace_links + правила, activity_log | миграции применяются на PostgreSQL 16 |
| RLS на всех таблицах, роли owner / editor / viewer | 21 pgTAP-тест |
| Traceability: правила, проверка «тот же проект», очистка при удалении, `trace_graph()` | 18 pgTAP-тестов |
| `attach_domain_table()` — подключение новой таблицы домена одной строкой | покрыто тестами trace |
| Экраны: вход, проекты пространства, создание проекта, оболочка проекта (sidebar · main · trace panel), заглушки разделов по фазам | — |

Полный вход через почту проверяется локально через `supabase start` (нужен Docker).

## Быстрый старт

Нужны Node 22 и Docker (для локального Supabase).

```bash
npm install
npx supabase start            # поднимает Postgres, Auth, Storage, Mailpit; применяет миграции
cp .env.example .env.local    # вставьте API URL и anon key из вывода `supabase start`
npm run dev                   # http://localhost:3000
```

Письма со ссылкой для входа локально приходят в Mailpit: http://127.0.0.1:54324

```bash
npm run db:test    # pgTAP-тесты RLS и traceability
npm run db:reset   # пересоздать локальную базу
npm run db:types   # сгенерировать src/types/database.ts (заменяет рукописную версию)
```

## Облако (развёрнуто)

Supabase: проект `xmrzukcmmybjloallslg` (eu-west-1), миграции 001–010 применены, smoke-тест и advisors пройдены. Остаются только осознанные замечания: `is_workspace_member`, `can_access_project_file` и `next_code` вызываются из RLS и триггеров, поэтому роль `authenticated` должна иметь к ним доступ (`next_code` сам проверяет права editor). У `project_counters` нет политик, доступ к нему только через `next_code`. Проверка утёкших паролей не нужна: входа по паролю нет.
Vercel: https://product-designer-workspace.vercel.app (деплой из `main`).
URL: `https://xmrzukcmmybjloallslg.supabase.co` · ключ: publishable key из Project Settings → API.

## Доступ (только по приглашению)

Вход по почте и паролю, письма не отправляются. Регистрацию на уровне базы ограничивает `signup_allowlist` (миграция 010): пока в таблице есть строки, Supabase создаёт пользователей только с этими адресами. Пароль меняется на странице `/account`: ссылка с вашим адресом в шапке.

Задать пароль (Supabase → SQL Editor, пароль вводите там, а не в чате):
```sql
update auth.users set encrypted_password = extensions.crypt('ваш-пароль', extensions.gen_salt('bf'))
where email = 'randat24@gmail.com';
```
Пригласить ещё человека:
```sql
insert into public.signup_allowlist (email) values ('colleague@example.com');
```
Затем создайте его в Authentication → Users → Add user (с паролем, флажок «Auto confirm»).

## Деплой

1. Создайте проект в Supabase → `npx supabase link --project-ref <ref>` → `npx supabase db push`.
2. Auth → URL Configuration:
   - Site URL = `https://product-designer-workspace.vercel.app`.
   - Redirect URLs: `https://product-designer-workspace.vercel.app/**`, `https://*-randat24s-projects.vercel.app/**` (превью) и `http://localhost:3000/**`.
   - Если адреса нет в списке, Supabase молча отправит ссылку из письма на Site URL. Если там стоит `localhost`, вход не завершится.
   - Google (необязательно): включите провайдера в Auth → Providers, затем задайте в Vercel `NEXT_PUBLIC_AUTH_GOOGLE=on`, чтобы показать кнопку.
3. Vercel: импортируйте репозиторий, задайте `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`.

## Структура

```
docs/                    PRD, ARCHITECTURE, DATABASE, IA, MVP, ROADMAP, DESIGN-SYSTEM, AI, adr/
supabase/migrations/     001 core · 002 trace · 003 activity + attach_domain_table · 004 hardening · 005 briefs + demo · 006 competitors + matrix + attachments · 007 research · 008 synthesis
supabase/tests/database/ pgTAP
src/app/                 маршруты (docs/IA.md)
src/domains/<name>/      schema.ts (Zod) · queries.ts · actions.ts · компоненты · index.ts (public API)
src/shared/              entities.ts (реестр сущностей) · navigation.ts · i18n · ui · lib
```

Правило зависимостей: `app → domains → shared`. Домены импортируют друг друга только через `index.ts`.

## Как добавить таблицу домена (с Phase 2)

```sql
create table public.insights (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  project_id   uuid not null references public.projects (id) on delete cascade,
  code text,
  title text not null,
  created_by uuid references public.profiles (id) default auth.uid(),
  updated_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);
select public.attach_domain_table('public.insights', 'insight');
-- даёт: workspace_id из project_id, код INS-###, updated_at, очистку trace-связей,
-- activity log, индекс, RLS (select — участник, запись — editor)
```

Затем: тип уже есть в `entity_types` и `src/shared/entities.ts`; при необходимости добавьте правила в `trace_relation_rules`; обновите `CURRENT_PHASE` и `navigation.ts`.

## Допущения Phase 1 (из открытых вопросов)

- Схема рассчитана на команды, интерфейс MVP — на одного дизайнера (приглашения в P2).
- Интерфейс на русском; строки вынесены в `src/shared/i18n/ru.ts` для будущих uk/en.
- В MVP цепочка идёт Opportunity → Flow напрямую; правила для Features уже заведены.
- AI в MVP нет; таблицы AI появятся в Phase 12.

## Допущения Phase 5

- Частота боли и число участников инсайта считаются функцией `synthesis_stats` по trace-графу (уникальные участники за цитатами, наблюдениями, ответами и интервью), а не хранятся.
- Карточка на доске принадлежит одному паттерну (`pattern_id`); смысловые связи — через trace-links.
- Демо-контент теперь заполняет `seed_demo_content()`; следующие фазы расширяют её, не переписывая `create_demo_project`.
- Панель «Связи» живёт на страницах сущностей (инсайт, боль, возможность, цитата, наблюдение), а не в общей оболочке.
- Drag-and-drop работает мышью; с клавиатуры и на планшете — меню «Переместить в…» на карточке.

## Допущения Phase 4

- Вступление и завершение сценария, ответы и заметки — plain text (`body_text`); TipTap-JSON появится вместе с rich text.
- Вопросы сценария двигаются кнопками ↑↓ и выбором секции (доступно с клавиатуры); drag-and-drop — позже.
- В списках и матрице участник показывается кодом и ролью; имя и контакт видны только в карточке.
- Удаление вопроса оставляет ответы на него как свободные заметки интервью.
- Импорт кладёт вопросы тетради в секцию «Текущее поведение» (в тетради секций нет); инсайты, шаги сценария и экраны импортируются в своих фазах.
- Быстрые метки (боль / потребность / цитата) в live-режиме появятся в Phase 5 вместе с наблюдениями.

## Допущения Phase 3

- Визуальный язык взят из прототипа «Рабочая тетрадь дизайнера» по решению владельца продукта; правая панель «Связи» вернётся на страницы сущностей в Phase 5.
- «Наш продукт» — строка `competitors` с `is_own_product`, у неё тоже есть код `CP-##`.
- Файлы загружаются браузером прямо в Storage (путь `<project_id>/competitor/<uuid>.<ext>`, RLS по проекту), затем сервер регистрирует `attachments`. При удалении конкурента приложение сначала удаляет файлы.
- `attach_project_table()` — подключение не-трассируемых таблиц проекта (строки матрицы, дальше — вопросы гайда и т. п.).

## Допущения Phase 2

- Длинные поля брифа пока plain text; в `jsonb` (TipTap) переедут вместе с rich text.
- Платформы хранятся только в `projects.platforms`, в брифе не дублируются.
- Бриф — не traceable-сущность (нет кода и trace-связей); изменения пишутся в activity log как `project_brief`.
- Адрес проекта (slug) не меняется при переименовании, чтобы ссылки не ломались.
- Демо-проект пока содержит только бриф; исследование, синтез, сценарии и экраны добавятся в `create_demo_project` в своих фазах.
- Next actions v1 — только по брифу; правила для интервью, инсайтов и экранов добавляются с их фазами.
