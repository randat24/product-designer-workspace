# Architecture

Статус: Draft v0.1 · Связанные документы: DATABASE.md, IA.md, AI.md

## 1. Технологический стек

| Слой | Выбор | Зачем |
|---|---|---|
| Framework | Next.js (App Router), React, TypeScript (strict) | Server Components для тяжёлых списков, route handlers для AI и экспорта |
| UI | Tailwind CSS + shadcn/ui (Radix) | Доступные примитивы, свой визуальный язык поверх |
| DB | Supabase PostgreSQL | Реляционная модель + recursive CTE для traceability |
| Auth | Supabase Auth (email magic link + Google) | RLS на основе `auth.uid()` |
| Files | Supabase Storage | Скриншоты конкурентов, вложения, превью экранов |
| Rich text | TipTap (JSON в `jsonb`) | Заметки, описания, упоминания сущностей `@INS-012` |
| Flows | React Flow | Редактор user flow |
| Charts | Recharts | Дашборд, результаты тестов |
| AI | Claude API (server-side) | P2+, см. AI.md |
| Deploy | Vercel | Preview-деплои на PR |
| Валидация | Zod | Общие схемы для форм, server actions и AI-выводов |
| Data fetching | Server Components + Server Actions; TanStack Query для интерактивных экранов (board, matrix, flow) | Оптимистичные обновления в плотных редакторах |

## 2. Принципы архитектуры

1. **Domain-modular.** Код сгруппирован по доменам, а не по техническим слоям. Домен владеет своими таблицами, схемами, запросами, UI.
2. **Traceability — отдельный сквозной домен.** Все связи «доказательство ↔ решение» идут через единый сервис `trace`, а не через ad-hoc поля в каждом домене.
3. **AI — надстройка.** Домены не зависят от `ai`. `ai` читает данные доменов через их публичные query-функции и пишет только в `ai_generations` (черновики). Принятие черновика вызывает обычные доменные мутации.
4. **Безопасность в базе.** Авторизация — через RLS; серверный код не должен быть единственной линией защиты.
5. **Одна схема — три места.** Zod-схема сущности используется для формы, server action и (позже) для структурированного AI-вывода.

## 3. Домены

| Домен | Ответственность |
|---|---|
| `projects` | Workspaces, members, projects, overview, counters (человекочитаемые коды) |
| `discovery` | Brief, competitors, comparison matrix, market notes |
| `research` | Research plans, interview guides/questions, participants, interviews, answers |
| `synthesis` | Quotes, observations, patterns, insights, pain points, opportunities |
| `definition` | Segments, JTBD, needs, problem statements, hypotheses (P2) |
| `architecture` | Requirements, features (tree), sitemap, user stories (P2) |
| `flows` | User flows, nodes, edges, edge-case checklist |
| `design` | Screens, screen states, UI foundations (P2) |
| `design-system` | Tokens, components, patterns, motion, responsive rules (P2) |
| `testing` | Usability tests, tasks, sessions, results, findings (P2) |
| `handoff` | Handoff checklist, decision log |
| `knowledge` | Методы (MDX-контент в репозитории), пользовательские заметки |
| `trace` | Связи между сущностями, граф upstream/downstream, «unsupported»-проверки |
| `ai` | Context builder, задачи, генерации, проверка ссылок на источники (P2) |
| `shared` | UI-кит, утилиты, типы сущностей, поиск, activity log |

Правило зависимостей: `app/*` → `domains/*` → `shared`. Домены не импортируют внутренности друг друга, только `domains/<x>/index.ts` (public API). Проверяется `eslint-plugin-boundaries`.

## 4. Структура репозитория

```
/
├─ docs/                         # эти документы + ADR
│  └─ adr/                       # 0001-trace-links.md, ...
├─ content/knowledge/            # MDX-страницы методов (ux/, ui/)
├─ supabase/
│  ├─ migrations/                # 001–024, список в README
│  ├─ seed.sql                   # демо-проект «Restaurant App»
│  └─ functions/                 # SQL-функции: trace_graph, is_member...
├─ src/
│  ├─ app/
│  │  ├─ (auth)/login, signup, callback
│  │  ├─ (app)/w/[ws]/...        # см. IA.md
│  │  └─ api/                    # route handlers: ai/*, export/*, import/*
│  ├─ domains/
│  │  ├─ projects/
│  │  │  ├─ schema.ts            # Zod
│  │  │  ├─ queries.ts           # чтение (server)
│  │  │  ├─ actions.ts           # server actions (мутации)
│  │  │  ├─ components/          # UI домена
│  │  │  └─ index.ts             # public API
│  │  ├─ discovery/ research/ synthesis/ flows/ design/ handoff/ trace/ knowledge/
│  │  └─ ai/                     # P2
│  ├─ shared/
│  │  ├─ ui/                     # shadcn + собственные компоненты (EntityChip, TracePanel...)
│  │  ├─ lib/supabase/           # server/client/middleware клиенты
│  │  ├─ entities.ts             # реестр типов сущностей (type, prefix, route, icon)
│  │  └─ hooks/ utils/
│  └─ types/database.ts          # сгенерировано supabase gen types
└─ tests/ (unit: vitest, e2e: playwright)
```

## 5. Реестр сущностей

Единый реестр `shared/entities.ts` описывает каждый тип, участвующий в traceability:

```ts
{ type: 'insight', table: 'insights', prefix: 'INS', label: 'Insight',
  route: (p, id) => `/w/${p.ws}/p/${p.slug}/insights/${id}`, domain: 'synthesis' }
```

Используется: Trace panel, упоминания в TipTap (`@INS-012`), поиск, command palette, AI context builder. Добавление нового типа = запись в реестр + таблица + разрешённые связи.

## 6. Traceability (ключевое решение)

См. ADR-0001 и DATABASE.md §Traceability.

- Иерархические связи с жёстким владением — обычные FK (`interview.participant_id`, `flow_node.flow_id`).
- Смысловые many-to-many связи «доказательство → вывод» — одна таблица `trace_links(source_type, source_id, target_type, target_id, relation)`.
- Допустимые пары и типы связи — справочник `trace_relation_rules`, проверяется триггером.
- Целостность при удалении — триггер `on delete` на каждой traceable-таблице чистит связи.
- Граф — SQL-функция `trace_graph(type, id, direction, max_depth)` на recursive CTE; результат кешируется на клиенте TanStack Query и инвалидируется при изменении связей.
- «Unsupported» — представление `v_unsupported_entities` (инсайты без источников, экраны без upstream и т.д.) для дашборда.

Почему не отдельные junction-таблицы: цепочка из ~15 типов даёт 25–35 junction-таблиц, а главный запрос продукта («всё выше этого экрана») превращается в UNION по всем. Добавление Features в P2 потребовало бы миграций в существующих связях. Цена решения — нет нативных FK на полиморфных колонках; компенсируем триггерами и тестами.

## 7. Работа с данными

- **Чтение:** Server Components вызывают `domains/x/queries.ts` с серверным Supabase-клиентом (RLS от имени пользователя).
- **Мутации:** Server Actions с Zod-валидацией → Supabase → `revalidatePath`/tag. Для плотных редакторов (matrix, board, flow) — TanStack Query + оптимистичные апдейты + debounce 500 мс.
- **Человекочитаемые коды** (`P07`, `INS-012`, `DEC-024`, `SCR-031`) — функция `next_code(project_id, entity_type)` на таблице `project_counters` с `SELECT … FOR UPDATE`.
- **Поиск:** `tsvector`-колонка `search_text` (generated) на основных таблицах + индекс GIN; конфигурация `simple` (мультиязычность RU/UK/EN). Позже — pg_trgm для fuzzy.
- **Rich text:** TipTap JSON в `jsonb` + плоский текст в `*_text` для поиска и AI-контекста.
- **Activity log:** триггер пишет в `activity_log` (entity, action, diff-ключи, actor).
- **Realtime:** в MVP не используется, кроме presence на экране live-интервью (опционально).

## 8. Безопасность

- RLS включён на всех таблицах. Каждая таблица проекта содержит денормализованный `workspace_id` → одна политика на основе `is_workspace_member(workspace_id, min_role)` (`security definer`, `stable`).
- Роли: `owner` (управление участниками, удаление), `editor` (CRUD), `viewer` (read-only; для PM/разработчиков).
- Storage: бакеты `project-files` с путями `{workspace_id}/{project_id}/…`, политики по тому же membership.
- Персональные данные респондентов: поля с ФИО/контактами опциональны; по умолчанию участник — код `P07` + роль. Флаг `consent_at`, экспорт и удаление участника со всеми цитатами (GDPR-подобное право на удаление).
- Секреты (Claude API key, service role) только на сервере; service role не используется в пользовательских запросах.
- AI (P2): данные проекта отправляются в Claude API только по явному действию пользователя; настройка проекта «AI disabled»; в промпт не попадают контактные данные участников.
- Rate limiting на `api/ai/*` и `api/export/*` (Vercel KV / Upstash или таблица лимитов).
- Защита от prompt injection из пользовательского контента: данные передаются как данные (XML-обёртки), вывод валидируется Zod, ссылки проверяются на существование (см. AI.md).
- Аудит: `activity_log` + `created_by`/`updated_by`.

## 9. Производительность и ограничения

- Матрица Question × Participant: до 30 участников × 60 вопросов — виртуализация строк/колонок (TanStack Virtual).
- Synthesis board: до ~1000 наблюдений — виртуализация по колонкам; canvas-вариант только в P2.
- Trace graph: глубина по умолчанию 6, лимит узлов 500; индексы `(project_id, source_type, source_id)` и `(project_id, target_type, target_id)`.
- Supabase free/pro лимиты на Storage и соединения — pooler (Supavisor) для serverless.
- Vercel function timeout для AI-задач: стриминг + фоновые задачи (P2: очередь через `ai_generations.status` и cron/Edge Function).

## 10. Тестирование

- Unit (Vitest): Zod-схемы, next-actions эвристики, преобразования trace-графа.
- DB (pgTAP или SQL-тесты в CI): RLS-политики, триггеры целостности trace_links, `next_code` при конкурентных вставках.
- E2E (Playwright): сквозной сценарий «интервью → цитата → наблюдение → инсайт → pain point → opportunity → flow → экран → решение → trace назад».

## 11. Architecture Decision Records (начальный список)

| ADR | Решение | Статус |
|---|---|---|
| 0001 | Полиморфная `trace_links` + справочник правил вместо junction-таблиц | Proposed |
| 0002 | Денормализованный `workspace_id` на всех таблицах для простых RLS | Proposed |
| 0003 | Quote — самостоятельная сущность (фрагмент ответа с offset) | Proposed |
| 0004 | Knowledge base — MDX в репозитории (версионируется, ревьюится), пользовательские заметки — в БД | Proposed |
| 0005 | AI пишет только в `ai_generations`; принятие = обычная доменная мутация с `origin='ai_accepted'` | Proposed |
| 0006 | Коды сущностей через `project_counters`, не через sequence на таблицу | Proposed |
| 0007 | Server Actions по умолчанию, TanStack Query только для плотных интерактивных редакторов | Proposed |

## 12. Технические риски

| Риск | Вероятность | Митигация |
|---|---|---|
| Полиморфные связи ломают целостность | Средняя | Триггеры, справочник правил, DB-тесты, периодическая проверка «висячих» ссылок |
| Сложность RLS + recursive CTE → медленные запросы | Средняя | `trace_graph` как `security invoker` с фильтром по project_id первым условием; индексы; EXPLAIN в CI для ключевых запросов |
| React Flow + большие диаграммы на мобильных | Средняя | На мобиле — read-only список шагов вместо canvas |
| Объём MVP | Высокая | Жёсткая отсечка в MVP.md, вертикальные срезы по фазам |
| Стоимость AI | Средняя (P2) | Лимиты, кеш контекста, выбор модели по задаче |
