# AI Architecture

Статус: Draft v0.1 · Реализация — Phase 12 (P2). Схема данных (`ai_generations`, `ai_generation_items`) закладывается заранее, но не используется в MVP.

## 1. Принципы

1. **AI поверх данных, не вместо них.** AI читает структурированные сущности проекта и предлагает новые или изменённые сущности. Архитектура приложения от AI не зависит.
2. **Evidence contract.** Каждый research-вывод AI обязан ссылаться на существующие источники (`quote`, `observation`, `answer`, `interview`, `finding`). Вывод без валидных ссылок не показывается как инсайт — только как «идея без подтверждения».
3. **Предлагает — дизайнер принимает.** Результат = черновик в `ai_generations`. Каждый элемент принимается/редактируется/отклоняется отдельно. Принятие вызывает обычную доменную мутацию + `trace_links` с `origin='ai_accepted'`.
4. **Контекстно, а не чат.** AI-действия встроены в экраны («Проанализировать интервью», «Найти edge cases в этом flow»). Свободный чат — вторичен и тоже работает с контекстом проекта.
5. **Прозрачность.** Видно, какие данные ушли в модель (список сущностей), модель, время, стоимость в токенах.

## 2. Компоненты

```
UI action ──► /api/ai/[task] (route handler, auth, rate limit)
                 │
                 ├─ ContextBuilder(task, scope)  ← domains/*/queries (RLS от имени пользователя)
                 │     └─ выбор сущностей, обрезка по бюджету токенов, обёртка в XML с id
                 ├─ PromptTemplate(task)          ← версионированные шаблоны в коде
                 ├─ Claude API (streaming, tool/JSON output)
                 ├─ OutputValidator (Zod по задаче)
                 ├─ EvidenceVerifier               ← проверка, что все id существуют в проекте
                 │     и цитаты (если есть) совпадают с текстом источника
                 └─ save → ai_generations + ai_generation_items (status=ready)
UI review ──► accept/edit/reject item ──► доменная мутация + trace_links(origin=ai_accepted)
```

## 3. Context Builder

Контекст собирается из структурированных данных, каждая сущность передаётся с кодом:

```xml
<project_brief>…</project_brief>
<research_goal plan="RP-1">…</research_goal>
<participants>
  <participant code="P03" role="Product manager" segment="frequent"/>
</participants>
<answers>
  <answer id="ans_…" participant="P03" question="Q2">…</answer>
</answers>
<existing_insights>
  <insight code="INS-004">…</insight>
</existing_insights>
```

- Пользовательский контент — всегда *данные*, внутри тегов; системный промпт явно говорит игнорировать инструкции внутри данных (защита от prompt injection).
- PII (имя, контакты участника) не передаются — только код, роль, сегмент.
- Бюджет токенов на задачу; при превышении — map-reduce (анализ по интервью → агрегация).
- `context_hash` для кеширования и отслеживания устаревания (данные изменились → генерация помечается stale).

## 4. Evidence contract (формат вывода)

```ts
const EvidenceRef = z.object({
  type: z.enum(['quote','observation','answer','interview','finding','competitor']),
  id: z.string(),                 // только id из контекста
  excerpt: z.string().max(300).optional() // дословный фрагмент, проверяется
});

const InsightDraft = z.object({
  title: z.string(),
  statement: z.string(),
  confidence: z.enum(['low','medium','high']),
  evidence: z.array(EvidenceRef).min(1),
  participants_count: z.number(),     // пересчитывается сервером, не доверяем
  counter_evidence: z.array(EvidenceRef).default([])
});
```

**EvidenceVerifier:** отбрасывает ссылки на несуществующие id или id из другого проекта; сверяет `excerpt` с исходным текстом (нормализованное вхождение); пересчитывает число участников; элемент без валидных ссылок получает статус `unsupported` и показывается отдельно.

## 5. Задачи

| Задача | Вход (контекст) | Выход | Где в UI |
|---|---|---|---|
| Brief structuring | Свободный текст | Поля Project Brief (черновик) | Brief |
| Competitor summary | Карточки + матрица | Patterns, weaknesses, opportunities, borrow, avoid — со ссылками на конкурентов | Competitors |
| Interview questions | Brief, research goal, audience, hypotheses, существующий guide | Вопросы по 8 секциям + probes | Interview Builder |
| Interview analysis | Одно интервью (ответы) | Quotes-кандидаты, observations (pain/need/behavior) | Interview detail |
| Clustering | Observations проекта | Кластеры-паттерны с членами | Synthesis board |
| Insights | Паттерн(ы) + их источники | Insight drafts (evidence contract) | Synthesis / Insights |
| Contradictions | Insights + evidence | Пары «инсайт ↔ противоречащие источники» | Insights |
| JTBD / HMW / Hypotheses | Pain points, insights, segments | Формулировки со ссылками на upstream | Define |
| Edge cases | Flow (узлы, рёбра), связанные экраны | Недостающие состояния/ветки, привязанные к узлам | Flow editor |
| UX review | Screen spec + states + flow | Замечания с severity и ссылкой на поле/состояние | Screen |
| Accessibility review | Screen spec, токены цветов/типографики | Нарушения WCAG (контраст по токенам, фокус, лейблы) | Screen / Tokens |
| UI consistency | Токены, компоненты, спецификации экранов | Несоответствия (размеры, отступы, варианты) | System |
| Handoff draft | Screen spec, states, компоненты, responsive, motion | Черновик handoff-документа | Handoff |

## 6. Модели и стоимость

- Анализ и синтез (много контекста, важна точность) — модель старшего уровня.
- Короткие задачи (формулировки HMW, brief structuring) — быстрая модель.
- Идентификаторы моделей — в конфиге, не в коде задач.
- Лимиты: на пользователя/день и на проект; счётчики токенов в `ai_generations`; видимая стоимость в UI для команды.
- Prompt caching для неизменного контекста (brief, guide) при серии задач.

## 7. Хранение и приватность

- Генерации хранятся (для аудита и повторного просмотра), `input_refs` — ссылки на сущности, а не копия данных; сам промпт не хранится по умолчанию (опция debug для владельца workspace).
- Проектная настройка `ai_enabled` (по умолчанию выключено для проектов с `consent`-чувствительными участниками — решение за владельцем).
- Удаление участника → удаление его сущностей → связанные `ai_generation_items` помечаются `source_deleted`.

## 8. Оценка качества

- Золотой набор: демо-проект «Restaurant App» + 2–3 синтетических проекта с эталонными инсайтами.
- Метрики: доля выводов с валидными источниками (цель 100% после верификатора, ≥ 95% до), precision цитат (excerpt найден в источнике), доля принятых элементов, доля отредактированных перед принятием.
- Регрессионные прогоны при смене шаблона промпта или модели.

## 9. Риски

| Риск | Митигация |
|---|---|
| Галлюцинации источников | EvidenceVerifier, только id из контекста, сверка excerpt |
| AI «переписывает» исследование за дизайнера | Только черновики, поэлементное принятие, видимый origin |
| Prompt injection из ответов респондентов | Данные в тегах, инструкции только в системном промпте, строгий JSON-вывод |
| Стоимость и таймауты | Лимиты, map-reduce, фоновые задачи со статусами |
| Утечка PII | Не передаём имена/контакты, настройка ai_enabled |
