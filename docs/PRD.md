# Product Designer Workspace — Product Requirements Document

Статус: Draft v0.1 · Этап: Phase 0 (планирование) · Код не пишется до ревью.

## 1. Суть продукта

Product Designer Workspace — рабочее пространство, которое проводит проект через полный процесс продуктового дизайна и **сохраняет связи между решениями и доказательствами**. Главный вопрос, на который продукт отвечает в любой момент: «Почему этот экран вообще существует?»

```
Interview → Quote/Observation → Insight → Pain Point → Opportunity
→ Hypothesis → Feature → User Flow → Screen → Design Decision → Usability Test
```

Цепочку можно пройти в обе стороны: от экрана к интервью и от интервью к экранам, которые из него выросли.

Продукт одновременно:
- рабочий инструмент дизайнера на реальных проектах;
- research repository (сырые данные + синтез + источники);
- генератор документации (brief, спецификации экранов, handoff, decision log);
- база знаний по UX/UI-методам, встроенная в рабочие экраны;
- (после MVP) контекстный AI-copilot, работающий поверх структурированных данных.

## 2. Проблема

| Сейчас | Последствие |
|---|---|
| Исследование живёт в Miro/Notion, макеты в Figma, решения в чатах | Связь «данные → решение» теряется через 2–3 недели |
| Инсайты формулируются без ссылки на источник | Невозможно защитить решение перед командой или стейкхолдером |
| Спецификации экранов пишутся заново под каждый handoff | Пропущенные состояния (empty, error, loading) всплывают в разработке |
| Методики разбросаны по статьям | Начинающий дизайнер не знает, что делать дальше и как |

## 3. Цели

1. **Traceability.** Любой инсайт, pain point, экран и решение имеют видимые источники; обратный путь строится за 1 клик.
2. **Процесс без пробелов.** Дашборд показывает реальный прогресс и конкретные следующие действия, а не абстрактный процент.
3. **Документация как побочный продукт работы.** Brief, research report, screen spec, handoff и decision log собираются из уже введённых данных.
4. **Обучение в контексте.** На каждом этапе доступна страница метода: что это, когда применять, чек-лист, шаблон, типичные ошибки.
5. **Скорость.** Keyboard-first ввод, плотный интерфейс, работа с десятками интервью и сотнями наблюдений без лагов.

### Метрики успеха (для MVP)
- ≥ 80% инсайтов в активных проектах имеют ≥ 1 ссылку на источник.
- ≥ 60% экранов имеют связь с flow и хотя бы одним upstream-элементом (opportunity / pain point).
- Время от завершённого интервью до внесённых наблюдений < 30 мин (самоотчёт + логирование).
- Retention: дизайнер возвращается в проект ≥ 3 раз в неделю на протяжении проекта.

## 4. Non-goals

- Не таск-трекер и не PM-инструмент (нет спринтов, оценок, досок задач) — интеграции с Linear/Jira позже.
- Не графический редактор и не замена Figma. Экраны описываются и связываются, а рисуются в Figma.
- Не AI-чат. AI — функция поверх данных, а не основа архитектуры и не главный экран.
- Не whiteboard общего назначения (не конкурируем с FigJam/Miro); доска синтеза — узкоспециализированная.
- Не инструмент для массовых количественных опросов (survey builder вне MVP).
- Не реалтайм-коллаборация уровня Figma в MVP (одновременное редактирование одного поля).

## 5. Пользователи

| Сегмент | Контекст | Что важно |
|---|---|---|
| **Primary:** продуктовый / UI/UX-дизайнер (соло или в небольшой команде) | Ведёт 1–3 проекта, сам проводит исследования | Скорость, структура, защита решений |
| **Primary:** junior / студент / дизайнер в переходе в продукт | Учебные и портфолио-проекты | Подсказки по методам, «что делать дальше», кейс для портфолио |
| Secondary: UX-researcher | Много интервью, синтез | Repository, цитаты, теги, источники |
| Secondary: PM / разработчик (read-only) | Смотрит обоснования и handoff | Понятный decision log, спецификации, чек-листы |

## 6. Core Jobs-to-be-Done

1. **Когда** я начинаю новый проект, **я хочу** быстро зафиксировать вводные в структурированном виде, **чтобы** не потерять ограничения и цели через месяц.
2. **Когда** я готовлюсь к интервью, **я хочу** собрать сценарий из проверенной структуры и провести по нему интервью прямо в инструменте, **чтобы** ответы сразу попали в repository.
3. **Когда** интервью закончены, **я хочу** превратить сырые ответы в наблюдения, паттерны и инсайты с сохранением источников, **чтобы** выводы можно было проверить.
4. **Когда** я проектирую flow и экраны, **я хочу** видеть, какую проблему решает каждый шаг, **чтобы** не проектировать лишнего и не пропустить важного.
5. **Когда** я принимаю спорное решение, **я хочу** записать причину, альтернативы и доказательства, **чтобы** через полгода не спорить заново.
6. **Когда** я передаю макеты в разработку, **я хочу** получить готовый чек-лист состояний и спецификаций, **чтобы** в продакшн не ушли экраны без empty/error/loading.
7. **Когда** я не уверен, как применить метод, **я хочу** открыть его описание в контексте текущего этапа, **чтобы** сделать правильно без переключения на поиск.

## 7. Продуктовые принципы

1. **Evidence first.** Вывод без источника визуально помечается как «unsupported». Это не ошибка, а сигнал.
2. **Одна сущность — одно место.** Participant, quote, insight — отдельные объекты, которые показываются в разных видах (таблица, доска, карточка), а не копируются.
3. **Структура подсказывает следующий шаг.** Пустые состояния объясняют метод и предлагают действие.
4. **AI предлагает, дизайнер утверждает.** Результаты AI — черновики с источниками; в данные попадают только после принятия.
5. **Плотность и скорость важнее декора.**

## 8. Полная карта функций

Уровни: **MVP** · P2 (post-MVP) · P3 (later)

### PROJECT
- Workspaces, members, roles (owner / editor / viewer) — MVP (single-user UX, multi-user schema)
- Projects: создание, архив, статусы — MVP
- Project Overview: прогресс по этапам, next actions, счётчики, недавние изменения — MVP (правила next actions — эвристики)
- Импорт JSON из прототипа «Рабочая тетрадь дизайнера» — MVP (nice-to-have)

### DISCOVER
- Project Brief (структурированные поля + свободный текст) — MVP
- AI: неструктурированный текст → Brief — P2
- Competitors: карточка (URL, скриншоты, позиционирование, ЦА, onboarding, навигация, UX/UI-паттерны, сильные/слабые, pricing, отзывы, возможности) — MVP
- Competitor Matrix (feature × продукт, включая «наш продукт») — MVP
- Market notes (тренды, технологии, ожидания, ограничения) — P2
- AI Competitor Summary (patterns / weaknesses / opportunities / borrow / avoid) — P2

### RESEARCH
- Research Plan (goal, questions, hypotheses, audience, method, participants, success criteria) — MVP
- Interview Builder: секции Intro → Context → Current behavior → Problems → Motivation → Experience → Expectations → Closing, probes — MVP
- Live interview mode (идём по вопросам, пишем ответы, отмечаем цитаты) — MVP
- Participants (role, segment, возраст, контекст, согласие, теги) — MVP
- Interview Repository + матрица Question × Participant — MVP
- Загрузка аудио/видео, транскрипция — P3
- Surveys — P3

### SYNTHESIS
- Quotes как объекты (выделение фрагмента ответа) — MVP
- Observations (pain / need / behavior / emotion / fact) — MVP
- Synthesis board: кластеризация наблюдений в паттерны — MVP (простая колоночная доска), P2 (свободный canvas)
- Insights с confidence и источниками — MVP
- Pain Points (evidence, frequency — вычисляется, severity, segment, связанные интервью и цитаты) — MVP
- Opportunities + How Might We — MVP
- Поиск противоречий (AI) — P2

### DEFINE
- Evidence-based segments — P2
- JTBD (When / I want to / So I can) — P2
- Problem Statements, User Needs — P2
- Hypotheses (Evidence → Hypothesis → Solution → Test → Result) — P2

### STRUCTURE
- Requirements (business / functional / non-functional, MoSCoW) — P2
- Feature Map (дерево) + «Why does this exist?» — P2
- Sitemap / IA, content hierarchy — P2
- Card sorting — P3
- User Stories — P2

### FLOWS
- Визуальный редактор (React Flow): Start, Screen, Action, Decision, System, Error, Success, End — MVP
- Связь node ↔ screen — MVP
- Edge-case checklist на flow (payment failed, no internet, session expired, empty, permission denied…) — MVP (ручной), P2 (AI-поиск)

### DESIGN
- Screens: спецификация (purpose, user goal, entry points, primary/secondary actions, content hierarchy, states, errors, empty, loading, permissions, analytics events, related flow/requirement), статус Sketch → Wireframe → Prototype → Tested → Ready, Figma link — MVP
- Screen states как отдельные записи — MVP
- Wireframes/Prototype галерея (превью из Figma) — P2
- UI Foundations с обоснованием («значение + причина») — P2

### SYSTEM
- Tokens (color, typography scale Display…Label, spacing, radius, shadow, motion) — P2
- Components (anatomy, variants, sizes, states, properties, behavior, a11y, do/don't, Figma/code links) — P2
- Patterns, Templates — P3
- Motion library (trigger, duration, easing, start/end, purpose) — P2
- Responsive rules (breakpoints; fixed/fluid/stack/hide/replace/scroll/collapse) — P2

### VALIDATE
- Usability tests (goal, scenario, tasks, participants, questions) — P2
- Результаты: Task × Session (success/partial/failure, time, errors, comment) — P2
- Findings с severity Critical/High/Medium/Low и связью с экраном — P2

### DELIVER
- Decision Log (DEC-###, reason, evidence, alternatives, status, author, date, superseded by) — MVP
- Handoff per screen + чек-лист (Desktop/Tablet/Mobile, Loading/Empty/Error/Success/Disabled, components documented, tokens used, prototype ready, dev reviewed) — P2 (в MVP частично: states-чек-лист на экране)
- Экспорт документации (Markdown/PDF) — P2

### KNOWLEDGE
- Страницы методов (What / When / When NOT / Preparation / How / Questions / Mistakes / Example / Template / Checklist) — MVP: 6 методов, привязанных к MVP-этапам (User Interview, Research Synthesis, Competitor Analysis, User Flow, Screen Spec, Decision Log). Полный набор UX/UI — P2
- Личные заметки — P2

### CROSS-CUTTING
- Trace panel на каждой сущности (upstream / downstream) — MVP
- Command palette ⌘K, глобальный поиск — MVP
- Теги — MVP
- Activity log / история изменений — MVP (запись), P2 (UI)
- Комментарии — P2
- AI-задачи (см. AI.md) — P2+
- Интеграции Figma API, GitHub, Linear, Jira — P3

## 9. Риски продукта

| Риск | Митигация |
|---|---|
| Слишком «тяжело» заполнять — дизайнер бросает | Быстрый ввод, импорт, всё опционально; прогресс мотивирует, но не блокирует |
| Traceability превращается в бюрократию | Ссылки создаются по ходу работы (выделил цитату → «создать наблюдение»), а не отдельным шагом |
| Размывание в «всё для всех» | Жёсткий MVP, non-goals, AI позже |
| Конкуренция с Dovetail/Notion | Сила — сквозная связь research ↔ design, которой у них нет |
