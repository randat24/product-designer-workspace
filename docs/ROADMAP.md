# Roadmap

Статус: v0.2 · **Phase 0 ✓ · Phase 1 ✓ (ждёт ревью)** · Каждая фаза — вертикальный срез: БД + UI + тесты + seed-данные.

| Фаза | Содержание | Результат / критерий готовности | MVP |
|---|---|---|---|
| **0 — Specification** | PRD, IA, domain model, DB schema, UX-архитектура, design principles, ADR | Документы в `/docs` утверждены | ✓ |
| **1 — Foundation** | Next.js, Supabase, Auth, layout (sidebar/main/trace panel), routing, реестр сущностей, `project_counters`, `trace_links` + правила + триггеры, RLS, CI (lint, typecheck, DB-тесты), design tokens приложения | Можно войти, создать workspace; DB-тесты RLS и trace зелёные | ✓ |
| **2 — Projects** | Projects list, создание/редактирование, Overview (прогресс, next actions v1), Project Brief, ⌘K v1, демо-проект | Проект с брифом, дашборд показывает этапы | ✓ |
| **3 — Competitors** | Карточки, скриншоты (Storage), comparison matrix с Our Product | Матрица 5×20 редактируется инлайн | ✓ |
| **4 — Research** | Research plan, participants, interview builder (8 секций), интервью, live-режим, матрица Question × Participant, импорт из JSON-прототипа | Проведено интервью в live-режиме на планшете | ✓ |
| **5 — Synthesis** | Quotes (выделение), observations, доска-кластеризация, insights, pain points (frequency view), opportunities + HMW, Trace panel, unsupported-флаги | Инсайт создаётся из кластера с источниками | ✓ |
| **6 — Product Definition** | Segments, JTBD, needs, problem statements, hypotheses, requirements, feature map + «Why does this exist?», приоритизация | Feature показывает свою цепочку до интервью | P2 |
| **7 — UX Architecture** | Sitemap/IA-редактор; **User Flow visual editor** (MVP-часть переносится раньше, см. ниже) | Flow с узлами-экранами и edge cases | ✓ (flows) / P2 (IA) |
| **8 — Design Documentation** | Screens, states, спецификации; **Decision Log** (MVP); UI Foundations, wireframes-галерея (P2) | Экран со спецификацией и решением DEC-### | ✓ / P2 |
| **9 — Design System** | Tokens (+ экспорт JSON), components, patterns, motion, responsive rules | Токены экспортируются в формат Style Dictionary | P2 |
| **10 — Testing** | Usability tests, tasks, sessions, результаты, findings, связь с гипотезами/решениями | Finding ведёт к экрану и решению | P2 |
| **11 — Handoff** | Handoff-спецификация экрана, чек-лист, экспорт документации MD/PDF | Экран «Ready for dev» с полным чек-листом | P2 |
| **12 — AI** | Context builder, задачи (см. AI.md), генерации с источниками, приём по элементам | AI-инсайты принимаются только с валидными источниками | P2 |

## Порядок реализации MVP

Фазы 7 (flows) и 8 (screens + decision log) частично входят в MVP. Практический порядок спринтов:

```
1 Foundation → 2 Projects/Brief → 3 Competitors → 4 Research → 5 Synthesis
→ 7a User Flows → 8a Screens + Decision Log → стабилизация и пилот (MVP)
```

## После MVP (P2), в порядке ценности

1. **Phase 12a — AI для research** (анализ интервью, кластеризация, противоречия) — самый сильный «вау» поверх уже накопленных данных.
2. **Phase 6 — Definition** (hypotheses, features) — замыкает цепочку от opportunity к решению.
3. **Phase 11 — Handoff + экспорт** — видимая ценность для команды и разработчиков.
4. **Командная работа** — приглашения, роли в UI, комментарии.
5. **Phase 10 — Testing.**
6. **Phase 9 — Design System**, UI Foundations, responsive, motion.
7. **Knowledge base** — полный набор UX/UI-методов.

## P3 / Later

- Figma API (превью фреймов, синхронизация статусов, ссылки на ноды), GitHub, Linear, Jira.
- Загрузка записей интервью + транскрипция + таймкоды цитат.
- Surveys, card sorting.
- Свободный canvas синтеза, граф-визуализация trace.
- Портфолио-экспорт кейса («от исследования до решения») — важно для junior-сегмента.
- Публичные read-only ссылки для стейкхолдеров.
