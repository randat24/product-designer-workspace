# Product Designer Workspace

Рабочее пространство продуктового дизайнера со сквозной traceability:
`Interview → Quote → Insight → Pain Point → Opportunity → Flow → Screen → Decision`.

Документация: [`docs/`](docs) · решения: [`docs/adr/`](docs/adr) · план: [`docs/ROADMAP.md`](docs/ROADMAP.md)

## Статус

**Phase 2 — Projects: готово, ждёт ревью.** Phase 1 — Foundation: в `main`.

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

Supabase: проект `xmrzukcmmybjloallslg` (eu-west-1), миграции 001–005 применены, smoke-тест и security advisor пройдены.
Vercel: https://product-designer-workspace.vercel.app (деплой из `main`).
URL: `https://xmrzukcmmybjloallslg.supabase.co` · ключ: publishable key из Project Settings → API.

## Деплой

1. Создайте проект в Supabase → `npx supabase link --project-ref <ref>` → `npx supabase db push`.
2. Auth → URL Configuration: Site URL = адрес Vercel, Redirect URL = `https://<домен>/auth/callback`. Для Google — включите провайдера в Auth → Providers.
3. Vercel: импортируйте репозиторий, задайте `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`.

## Структура

```
docs/                    PRD, ARCHITECTURE, DATABASE, IA, MVP, ROADMAP, DESIGN-SYSTEM, AI, adr/
supabase/migrations/     001 core · 002 trace · 003 activity + attach_domain_table · 004 hardening · 005 briefs + demo
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

## Допущения Phase 2

- Длинные поля брифа пока plain text; в `jsonb` (TipTap) переедут вместе с rich text.
- Платформы хранятся только в `projects.platforms`, в брифе не дублируются.
- Бриф — не traceable-сущность (нет кода и trace-связей); изменения пишутся в activity log как `project_brief`.
- Адрес проекта (slug) не меняется при переименовании, чтобы ссылки не ломались.
- Демо-проект пока содержит только бриф; исследование, синтез, сценарии и экраны добавятся в `create_demo_project` в своих фазах.
- Next actions v1 — только по брифу; правила для интервью, инсайтов и экранов добавляются с их фазами.
