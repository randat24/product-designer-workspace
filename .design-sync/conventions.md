# Building with WorkspaceUI — conventions

WorkspaceUI is the UI kit of a notebook-style research tool for product designers (interface language: Ukrainian). Quiet, dense, typographic: warm neutral surfaces, hairline borders, one orange accent for the primary action.

## Setup

- No provider or wrapper is needed. Load `styles.css` and `_ds_bundle.js`; components come from `window.WorkspaceUI`.
- Theme: light by default, dark when the system asks for it. To force one, set `data-theme="light"` or `data-theme="dark"` on `<html>`. Every colour is a token that flips with the theme, so never hard-code hex values.
- `ThemeSwitch` shows the right icon purely through that `data-theme` attribute.
- Icons are not part of the bundle. `IconButton` takes an SVG child sized `size-4` and a required `label` (its accessible name).
- `SectionTabs`, `BackLink`, `ErrorState` and `NotFoundState` render plain `<a href>` links.

## Styling idiom: Tailwind utilities over the DS tokens

Components are styled with utility classes; write your own layout glue the same way. Use only the token-backed names below (they exist in `styles.css`):

| Family | Names |
|---|---|
| Surfaces | `bg-canvas` (page), `bg-surface` (cards), `bg-subtle` (fields, hover) |
| Text | `text-fg`, `text-fg-secondary`, `text-accent`, `text-danger`, `text-warning`, `text-success` |
| Borders | `border border-line`, `border-fg`, `border-danger`, `border-dashed` |
| Entity colours | `bg-entity-research`, `-synthesis`, `-problem`, `-opportunity`, `-structure`, `-design`, `-decision` (same suffixes for `text-`/`border-`) |
| Type scale | `text-caption` 12 · `text-meta` 13 · `text-sm` 14 · `text-body` 15 · `text-heading` 18 · `text-title` 20 · `text-display-xs`/`-sm`/`-md`/`-lg` 22–44 |
| Weight / family | `font-medium`, `font-semibold`, `font-bold`; `font-sans` (Manrope), `font-label` (IBM Plex Mono, for codes and small labels) |
| Radius | `rounded-chip` 4 · `rounded-control` 4 · `rounded-panel` 8 · `rounded-hero` 12 |
| Spacing | Tailwind scale `0`–`16` for `p-*`, `m-*`, `gap-*`; layout with `flex`, `flex-col`, `flex-wrap`, `items-center`, `justify-between`, `grid grid-cols-1..4` |

Two non-utility classes: `page-title` (the big page heading, used by `PageHeader`) and `display-num` (large tabular figures; pair with `text-display-lg tabular-nums`).

Rules of thumb: controls are 36 px high (`size="sm"` is 32 px); labels above fields are `text-meta font-semibold text-fg-secondary`; cards are `Panel` (8 px radius, hairline, `p-5`), never shadows; only one primary (orange) `Button` per view, everything else `secondary` or `ghost`.

## Where the truth lives

- `styles.css` and its imports (`_ds_bundle.css`, `fonts/fonts.css`): every token and class.
- `guidelines/DESIGN-SYSTEM.md`: the system's own rules for colour, type and components.
- `components/general/<Name>/<Name>.prompt.md` and `.d.ts`: per-component API and examples.

## Composition patterns

- A form field is `Field` (label + error) wrapping `Input`, `Select`, `Textarea` or `DateField`; link them with `htmlFor` / `id`. `TextField` is the ready-made label + auto-growing textarea.
- Long forms group fields in `Section` (title + panel).
- A page starts with `PageHeader` (eyebrow, title, lede, optional `progress` or `stat`), then `SectionTabs` when the section has sub-pages.
- Traceable records are referenced with `EntityChip` (`type` + `code`, e.g. `INS-012`); chain them with `→` to show a trace.
- Destructive actions use `ConfirmDelete` (two-step button) instead of a modal.

```jsx
const { PageHeader, Panel, Field, Input, Select, Button, EntityChip } = window.WorkspaceUI;

<div className="bg-canvas p-8 text-fg">
  <PageHeader eyebrow="Restaurant App" title="Інсайти" lede="Висновки з досліджень." stat={{ value: 12, caption: "інсайтів" }} />
  <Panel className="flex max-w-xl flex-col gap-5">
    <div className="flex items-center gap-2">
      <EntityChip type="insight" code="INS-012" />
      <span className="text-caption font-medium text-fg-secondary">5 джерел</span>
    </div>
    <Field label="Назва" htmlFor="title"><Input id="title" defaultValue="Гості не довіряють оцінці часу" /></Field>
    <Field label="Серйозність" htmlFor="severity">
      <Select id="severity" defaultValue="high"><option value="medium">Середня</option><option value="high">Висока</option></Select>
    </Field>
    <div className="flex gap-3"><Button>Зберегти</Button><Button variant="secondary">Скасувати</Button></div>
  </Panel>
</div>
```
