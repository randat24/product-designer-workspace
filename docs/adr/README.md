# Architecture Decision Records

| ADR | Решение | Статус |
|---|---|---|
| [0001](0001-trace-links.md) | Единая таблица `trace_links` + справочник правил | Accepted |
| [0002](0002-workspace-id-denormalized.md) | `workspace_id` на всех таблицах, RLS через `is_workspace_member` | Accepted |
| 0003 | Quote — самостоятельная сущность | Proposed (Phase 5) |
| 0004 | Knowledge base — MDX в репозитории | Proposed (Phase 2) |
| 0005 | AI пишет только в `ai_generations` | Proposed (Phase 12) |
| [0006](0006-entity-codes.md) | Коды сущностей через `project_counters` | Accepted |
| 0007 | Server Actions по умолчанию, TanStack Query для плотных редакторов | Proposed (Phase 4) |
