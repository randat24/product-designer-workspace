# MVP Definition

Статус: Draft v0.1

## 1. Цель MVP

Доказать, что **сквозная traceability от интервью до экрана и решения** реально используется дизайнером на живом проекте и экономит время, а не добавляет бюрократии.

**MVP-гипотеза:** Мы считаем, что дизайнеры, которые сами проводят исследования, будут вести в продукте хотя бы один проект до этапа экранов, если связывание источников происходит по ходу работы (выделение цитаты → наблюдение → инсайт). Проверяем по доле инсайтов с источниками (≥ 80%) и доле экранов с upstream-связью (≥ 60%) у 10–15 пилотных дизайнеров.

## 2. Состав (строго)

| # | Модуль | Входит | Не входит в MVP |
|---|---|---|---|
| 1 | Authentication | Magic link, Google, профиль, один workspace на пользователя по умолчанию | Приглашения команды в UI, SSO |
| 2 | Projects | CRUD, архив, Overview-дашборд с прогрессом и next actions, демо-проект | Шаблоны проектов, дублирование |
| 3 | Project Brief | Все поля спецификации, rich text | AI-структурирование текста |
| 4 | Competitor Analysis | Карточки, скриншоты, matrix с Our Product | AI Summary, market research |
| 5 | Research Plan | Все поля, статус | Бюджет, рекрутинг |
| 6 | Participants | Сущность, коды, сегмент-метка, согласие, теги | Segments как сущность |
| 7 | Interview Builder | 8 секций, probes, порядок, шаблон из Knowledge | Ветвление вопросов |
| 8 | Interview Repository | Интервью, ответы, live-режим, матрица Question × Participant | Аудио/видео, транскрипция |
| 9 | Research Synthesis | Quotes (выделение), observations, колоночная доска-кластеризация | Свободный canvas, AI-кластеризация |
| 10 | Insights | Формулировка, confidence, источники, unsupported-флаг | AI-генерация |
| 11 | Pain Points | Severity, вычисляемая frequency, источники | Сегменты-сущности |
| 12 | Opportunities | HMW, impact/effort, статус, источники | Приоритизация фреймворками (RICE) |
| 13 | User Flows | React Flow-редактор, 8 типов узлов, связь узел↔экран, edge-case чек-лист | AI edge cases, версии flow |
| 14 | Screen Documentation | Полная спецификация, states, статус, Figma link + превью-изображение | Figma API sync, handoff-чек-лист |
| 15 | Decision Log | DEC-коды, reason, alternatives, evidence, superseded | Голосование, комментарии |
| — | Cross-cutting | trace_links + Trace panel + trace explorer (список), ⌘K, поиск, теги, activity log (запись), 6 страниц Knowledge | Комментарии, realtime, AI |

**Цепочка MVP:** `Interview → Quote/Observation → Insight → Pain Point → Opportunity → User Flow → Screen → Design Decision`.
Features/Hypotheses (P2) встраиваются в цепочку без миграции существующих связей — благодаря `trace_links` добавляются только новые правила.

## 3. Критерии приёмки (ключевые)

**Traceability**
- С detail-страницы экрана за ≤ 2 клика видна цитата участника, из которой вырос экран (через opportunity → pain point → insight).
- Удаление цитаты удаляет её связи; у инсайта, лишившегося всех источников, появляется флаг «unsupported».
- Нельзя связать сущности разных проектов или недопустимую пару типов (проверка в БД).

**Research**
- Создать guide из 8 секций и провести по нему live-интервью на планшете (768px) без горизонтального скролла.
- Выделение фрагмента ответа создаёт Quote с участником и интервью за одно действие; из Quote — Observation за одно действие.
- Матрица 15 участников × 30 вопросов открывается < 1.5 с (p75) и редактируется инлайн.

**Synthesis → Define**
- Кластер на доске → «Сформулировать инсайт» создаёт инсайт со всеми карточками кластера как источниками.
- Frequency pain point = число уникальных участников среди источников и обновляется автоматически.

**Flows / Screens**
- Узел Screen во flow либо ссылается на существующий экран, либо создаёт новый (с кодом SCR-###).
- Экран без empty/error/loading-состояний показывается в next actions дашборда.

**Decision Log**
- Решение можно создать из экрана; доказательства выбираются из trace-графа экрана и из любых research-сущностей через поиск.

**Общие**
- RLS: пользователь без членства не видит ни одной строки чужого workspace (DB-тесты).
- Все формы — клавиатурно доступны; ⌘K открывает любую сущность по коду.
- Desktop 1280+ основной; tablet — полный функционал кроме редактирования flow-canvas (просмотр); mobile — чтение, live-интервью, быстрый ввод наблюдений.

## 4. Демо-проект (seed)

«Restaurant App» — из материалов исследования: 7 участников (визажист, дизайнер, продакт-менеджер, исследователь, продакт-аналитик, ретушёр, менеджер проектов), 5 вопросов, ответы, flow «Вход → Есть профиль? → Onboarding → Профиль по телефону → SMS → Карта и список → Фильтры → Карточка ресторана → Подходит?». Добавить примеры цитат, 3 инсайта, 2 pain points, 1 opportunity, 3 экрана и 1 решение, чтобы trace-цепочка была видна с первого запуска.

## 5. Вне MVP (явно)

AI (любой), Segments/JTBD/Hypotheses/Requirements/Features/IA, UI Foundations, Design System, Responsive, Motion, Usability Testing, Handoff-чек-листы, экспорт PDF, комментарии, командная работа в UI, интеграции.

## 6. Оценка объёма (грубо, 1 full-stack разработчик)

| Блок | Недели |
|---|---|
| Foundation (auth, layout, RLS, реестр сущностей, trace-ядро) | 2 |
| Projects + Overview + Brief | 1 |
| Competitors + Matrix | 1 |
| Research (plan, guide, participants, interviews, live, matrix) | 2.5 |
| Synthesis (quotes, observations, board, insights, pain points, opportunities) | 2.5 |
| Flows (React Flow editor, edge cases) | 1.5 |
| Screens + states | 1 |
| Decision Log + Trace panel/explorer + ⌘K + поиск | 1.5 |
| Knowledge (6 MDX-страниц + шаблоны) | 0.5 |
| QA, e2e, seed, полировка | 1.5 |
| **Итого** | **~15 недель** |
