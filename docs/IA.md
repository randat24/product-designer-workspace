# Information Architecture & Sitemap

Статус: Draft v0.1

## 1. Модель навигации

```
┌──────────────┬─────────────────────────────────────────┬──────────────┐
│ Sidebar      │ Main                                    │ Trace panel  │
│ ws / project │ header: breadcrumb · code · status      │ (toggle ⌘.)  │
│ PROJECT      │ ─────────────────────────────────────── │ Upstream ↑   │
│ DISCOVER     │ list / table / board / canvas / detail  │ This entity  │
│ DEFINE       │                                         │ Downstream ↓ │
│ STRUCTURE    │                                         │ Unsupported! │
│ DESIGN       │                                         │ Method tip   │
│ SYSTEM       │                                         │              │
│ VALIDATE     │                                         │              │
│ DELIVER      │                                         │              │
│ KNOWLEDGE    │                                         │              │
└──────────────┴─────────────────────────────────────────┴──────────────┘
```

- **Sidebar** — группы процесса (как в спецификации), в каждой — пункты со счётчиками и индикатором заполненности. Пункты вне MVP скрыты фиче-флагом, а не показаны пустыми.
- **Trace panel** — справа на любой detail-странице traceable-сущности: upstream-цепочка, downstream, кнопка «Связать…», предупреждение «Нет источников».
- **Command palette ⌘K** — переход к любой сущности по коду/названию, создание (`new insight`), действия (`link to…`).
- **Method tip** — компактная ссылка «Как это делать» на страницу метода из Knowledge для текущего раздела.
- **Mobile:** sidebar → нижний sheet с группами; trace panel → вкладка на detail-странице.

## 2. Правила URL

```
/w/[ws]                               — workspace
/w/[ws]/p/[project]                   — project root
/w/[ws]/p/[project]/<section>         — список
/w/[ws]/p/[project]/<section>/[code]  — detail (по человекочитаемому коду: /insights/INS-012)
```
Коды в URL — читаемые ссылки, которыми удобно делиться в Slack/Figma-комментариях.

## 3. Sitemap с назначением страниц

Легенда: **MVP** · P2 · P3

### Auth
| Route | Назначение | |
|---|---|---|
| `/login`, `/signup` | Вход по magic link / Google | MVP |
| `/auth/callback` | Обработка OAuth/magic link | MVP |
| `/onboarding` | Имя, язык, создание первого workspace и выбор: пустой проект или демо «Restaurant App» | MVP |

### Workspace
| Route | Назначение | |
|---|---|---|
| `/w/[ws]` | Список проектов: статус, прогресс, последнее изменение, создание проекта | MVP |
| `/w/[ws]/settings` | Название, slug, удаление | MVP |
| `/w/[ws]/members` | Приглашения, роли owner/editor/viewer | P2 (схема в MVP) |
| `/w/[ws]/knowledge` → см. Knowledge | | |

### PROJECT
| Route | Назначение | |
|---|---|---|
| `/p/[project]` (Overview) | Дашборд: прогресс по этапам (✓ ● ○), Next actions (эвристики: «3 интервью без наблюдений», «SCR-012 без empty state», «INS-004 без источников»), счётчики Research/Design, недавняя активность | MVP |
| `/p/[project]/settings` | Название, платформы, AI on/off (P2), экспорт/импорт, архив | MVP |
| `/p/[project]/activity` | Лента изменений | P2 |

### DISCOVER
| Route | Назначение | |
|---|---|---|
| `/brief` | Project Brief: структурированные секции (продукт, бизнес, ЦА, проблема, цели, KPI, ограничения, платформы, сроки, команда, ссылки, требования). P2: «Вставить текст → структурировать AI» | MVP |
| `/competitors` | Список/карточки конкурентов, фильтр direct/indirect, добавление | MVP |
| `/competitors/[id]` | Карточка конкурента: все поля, галерея скриншотов, связанные opportunities | MVP |
| `/competitors/matrix` | Матрица Feature × Product (+ Our Product), быстрый ввод yes/partial/no | MVP |
| `/competitors/summary` | AI Summary: patterns, weaknesses, opportunities, borrow, avoid — с источниками | P2 |
| `/market` | Market notes: тренды, решения, технологии, ожидания | P2 |
| `/research` | Обзор исследований: планы, количество интервью, статус синтеза | MVP |
| `/research/plans/[id]` | Research Plan: goal, questions, hypotheses, audience, method, participants target, success criteria | MVP |
| `/research/guides/[id]` | Interview Builder: секции Intro → … → Closing, drag-and-drop вопросов, probes, «ключевой вопрос», шаблоны из Knowledge | MVP |
| `/research/participants` | Таблица участников: код, роль, сегмент, статус интервью, согласие, теги | MVP |
| `/research/participants/[code]` | Профиль участника: контекст, интервью, его цитаты, наблюдения, куда они пошли дальше (downstream) | MVP |
| `/research/interviews/[code]` | Интервью: ответы по вопросам guide + свободные заметки; выделение текста → Quote / Observation | MVP |
| `/research/interviews/[code]/live` | Live-режим: вопрос за вопросом, крупные поля ввода, таймер, быстрые метки (pain/need/quote) — работает на планшете | MVP |
| `/research/matrix` | Repository-матрица Question × Participant (как Miro-таблица), фильтры по сегменту/тегам, клик по ячейке → ответ | MVP |

### DEFINE (синтез + определение)
| Route | Назначение | |
|---|---|---|
| `/synthesis` | Доска синтеза: колонки-паттерны, карточки наблюдений и цитат с цветом участника; перетаскивание = кластеризация; «Сформулировать инсайт» из кластера (источники подставляются автоматически) | MVP |
| `/insights` | Список инсайтов: confidence, число источников/участников, статус, флаг «unsupported» | MVP |
| `/insights/[code]` | Инсайт: формулировка, источники (цитаты с участником и интервью), downstream (pain points, opportunities, decisions) | MVP |
| `/pain-points` | Список: severity × frequency (вычисленная), сегмент; сортировка по приоритету | MVP |
| `/pain-points/[code]` | Evidence, frequency, severity, segment, связанные интервью и цитаты, opportunities | MVP |
| `/opportunities` | Opportunities + HMW, impact/effort матрица, статус | MVP |
| `/opportunities/[code]` | Opportunity: HMW, источники, что её адресует (flows, screens, features) | MVP |
| `/users` | Evidence-based segments с составом участников | P2 |
| `/jtbd` | JTBD-карточки When / I want to / So I can | P2 |
| `/problems` | Problem statements, user needs | P2 |
| `/hypotheses` | Hypotheses: Evidence → Hypothesis → Solution → Test → Result | P2 |

### STRUCTURE
| Route | Назначение | |
|---|---|---|
| `/requirements` | Требования business/functional/non-functional, MoSCoW, источник | P2 |
| `/features` | Feature Map (дерево), приоритет, статус; в detail — блок «Why does this exist?» | P2 |
| `/ia` | Sitemap-редактор, content hierarchy, привязка узлов к экранам | P2 |
| `/flows` | Список flows: количество шагов, непокрытых edge cases, экранов | MVP |
| `/flows/[code]` | Визуальный редактор (React Flow): типы узлов Start/Screen/Action/Decision/System/Error/Success/End; узел Screen связывается с экраном или создаёт его; панель Edge cases (missing/covered); связь flow с opportunities | MVP |

### DESIGN
| Route | Назначение | |
|---|---|---|
| `/screens` | Таблица экранов: статус Sketch→Ready, состояния (индикаторы loading/empty/error), flow, upstream | MVP |
| `/screens/[code]` | Screen Specification: purpose, user goal, entry points, primary/secondary actions, content hierarchy, states, errors, permissions, analytics events, API/data, related flow/requirement, Figma link + превью | MVP |
| `/wireframes` | Галерея превью экранов по статусу | P2 |
| `/prototype` | Ссылки на прототипы, связь с тестами | P2 |
| `/ui` | UI Foundations: typography, colors, composition, spacing, grid, icons, buttons, forms, motion, accessibility, responsive — «решение + причина + правила» | P2 |

### SYSTEM
| Route | Назначение | |
|---|---|---|
| `/system/tokens` | Токены по категориям, light/dark, использование, обоснование; экспорт JSON (Tokens Studio / Style Dictionary) | P2 |
| `/system/components` / `[code]` | Компоненты: anatomy, variants, sizes, states, properties, behavior, a11y, do/don't, Figma/code | P2 |
| `/system/patterns` | Паттерны | P3 |
| `/system/motion` | Motion library: trigger, duration, easing, start/end, purpose | P2 |
| `/system/responsive` | Брейкпоинты и правила fixed/fluid/stack/hide/replace/scroll/collapse | P2 |

### VALIDATE
| Route | Назначение | |
|---|---|---|
| `/tests` | Usability tests: статус, участники, success rate | P2 |
| `/tests/[code]` | Goal, scenario, tasks, questions; сетка результатов Task × Session | P2 |
| `/tests/[code]/sessions/[id]` | Проведение сессии: outcome/time/errors/comment по задачам | P2 |
| `/findings` | Usability issues по severity, связь с экранами и решениями | P2 |

### DELIVER
| Route | Назначение | |
|---|---|---|
| `/decisions` | Decision Log: код, заголовок, статус, дата, автор, число доказательств | MVP |
| `/decisions/[code]` | Context, decision, reason, alternatives, evidence (ссылки на интервью/цитаты/тесты), superseded by | MVP |
| `/handoff` | Статус готовности экранов к передаче, чек-листы | P2 |
| `/handoff/[screenCode]` | Handoff-спецификация экрана: Figma, компоненты, состояния, поведение, responsive, анимации, a11y, API/data, edge cases | P2 |
| `/export` | Экспорт документации: brief, research report, screen specs, decision log (MD/PDF) | P2 |

### KNOWLEDGE (workspace-уровень, доступна и вне проекта)
| Route | Назначение | |
|---|---|---|
| `/knowledge` | Каталог: UX (Research, Define, Structure, Design, Validate) и UI (Typography, Color, Grid…) | MVP |
| `/knowledge/[domain]/[slug]` | Страница метода: What / When / When NOT / Preparation / How / Questions / Mistakes / Example / Template (кнопка «Создать в проекте») / Checklist | MVP (6 методов) |
| `/knowledge/notes` | Личные заметки | P2 |

### Утилиты
| Route | Назначение | |
|---|---|---|
| `/p/[project]/trace/[type]/[code]` | Полноэкранный trace explorer: граф от интервью до экрана | MVP (простой вертикальный вид), P2 (граф) |
| `/p/[project]/search?q=` | Результаты поиска по всем сущностям | MVP |
| `/api/import/workbook` | Импорт JSON из прототипа «Рабочая тетрадь» | MVP (nice-to-have) |
| `/api/ai/*` | AI-задачи | P2 |

## 4. Ключевые пользовательские пути (MVP)

1. **Новый проект:** Projects → New → Brief → Competitors → Research Plan → Guide.
2. **Интервью:** Participants → New P08 → Live interview → Завершить → Interview detail (выделить цитаты, создать наблюдения).
3. **Синтез:** Synthesis board → кластеры → Insight (источники автоматически) → Pain point → Opportunity (HMW).
4. **Проектирование:** Opportunity → «Создать flow» → Flow editor → Screen node → Screen spec → States.
5. **Решение:** Screen → «Записать решение» → DEC-025 с evidence из trace-графа экрана.
6. **Обратный путь:** Screen → Trace panel → Opportunity → Pain point → Insight → Quotes → Interview P03.
