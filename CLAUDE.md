# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

One Next.js 15 (App Router) app on Supabase that serves two products from the same codebase:

- **The public site** — the owner's portfolio and CV in Ukrainian and English (`/uk`, `/en`), plus a project request form.
- **The tool** — a private workspace for a product designer (`/app`, `/w/...`) with end-to-end traceability:
  `Interview → Quote → Insight → Pain Point → Opportunity → Flow → Screen → Decision`.

A case on the site is a project from the tool that was published (`case_studies`), so the two halves share data.

Documentation in `docs/` and the README is written in Russian; code comments are in English; the tool's interface is Ukrainian.

## Commands

Node 22 (`engines`), npm. `npm install` applies `patches/` through patch-package (see `patches/README.md` before upgrading Next).

```bash
npm run dev          # http://localhost:3000
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint: Next.js + jsx-a11y
npm test             # Vitest, src/**/*.test.ts, node environment
npm run build
npm run e2e          # Playwright against `npm start`; build first
npm run cv           # rebuild public/cv/*.pdf (uses NEXT_PUBLIC_SITE_URL)
```

Single tests:

```bash
npx vitest run src/shared/lib/url.test.ts            # one file
npx vitest run -t "name of the test"                 # by name
npx playwright test e2e/site.spec.ts --project=desktop
npx playwright test -g "title" --project=phone
```

Database (needs Docker; OrbStack works):

```bash
npx supabase db start   # database only, applies every migration and the seed (what CI does)
npm run db:start        # full local stack (Auth, Storage, Mailpit)
npm run db:test         # pgTAP, supabase/tests/database
npm run db:reset
npm run db:types        # regenerate src/types/database.ts
```

CI (`.github/workflows/ci.yml`) runs typecheck, lint, unit tests, build, pgTAP on a fresh database, and e2e on a local Supabase.

Things that bite:

- `next dev` and `next build` share `.next`. Two builds, or a build next to a dev server, fail with random "file not found" errors. Stop the other one first.
- The middleware is an allowlist. `updateSession` (`src/shared/lib/supabase/middleware.ts`) rewrites every path it does not know to the 404 page: only `/uk`, `/en`, the private and auth prefixes, `PUBLIC_FILES` and `PUBLIC_PREFIXES` pass. A new top-level page or `app/api/...` route returns 404 until its prefix is added there.
- e2e reuses whatever already listens on port 3000 (`reuseExistingServer`). With `npm run dev` running it tests the dev server, not the build.
- A green local e2e run covers less than CI: tool specs skip without `E2E_EMAIL` / `E2E_PASSWORD` and a Supabase with that user, request-submission tests skip without `INTAKE_SUBMIT_SECRET`, the case test skips with no published case. Projects are `desktop` and `phone`; `retries` is 0.
- A stale copy of the project sits in the parent directory with its own lockfile. `outputFileTracingRoot` in `next.config.ts` exists because of it; do not remove it.

## Architecture

### Routes

`src/app` has several root layouts (hence `experimental.globalNotFound` and `app/global-not-found.tsx`):

- `(site)/[locale]` — the public site. Content and copy for both languages live in `src/site/content.ts`; the site's own components and its SIGNAL styles are in `src/site` (`src/site/signal/signal.css`).
- `(app)` — the tool: `/app` (entry), `/w/[ws]` (workspace), `/w/[ws]/p/[project]/...` (project sections), `/account`.
- `(auth)`, `auth/callback` — sign-in. `src/middleware.ts` refreshes the Supabase session, sends signed-out visitors of `/app`, `/w`, `/account` to `/login`, and decides which paths exist at all (see «Things that bite»).

`next.config.ts` adds security headers everywhere and `noindex` on private routes and on every non-production deployment.

### Layers

`app → domains → shared`. A domain (`src/domains/<name>`) is typically `schema.ts` (Zod), `queries.ts`, `actions.ts` (server actions), its components, and `index.ts` as its public API. The intended rule is that domains import each other only through `index.ts`; it is not enforced, and the code has exceptions: `requests`, `importer` and `site-profile` have no `index.ts`, and a few files import another domain's `schema`, `queries` or `client` directly. Follow the rule in new code; do not treat the existing exceptions as bugs to fix in passing.

`src/shared` holds what every domain uses: `entities.ts` (the registry of traceable entity types: code prefix, label, colour group, route — it mirrors `public.entity_types`), `navigation.ts`, `i18n/uk.ts` (all tool strings), `ui/` (the tool's component kit), `lib/`.

### Data and access

- All access control is Row Level Security in Postgres. The browser only ever gets the anon/publishable key. Roles per workspace: owner / editor / viewer.
- A new domain table is wired with `select public.attach_domain_table('public.<table>', '<entity>')`: it derives `workspace_id` from `project_id`, assigns codes (`INS-012`), maintains `updated_at`, the activity log, trace cleanup, the index and RLS. It has preconditions: the entity type must already be registered in `public.entity_types` with that table name (the function raises otherwise), and the table needs the template's columns (`project_id`, `workspace_id`, `code`, `updated_at` …). A new entity also touches `src/shared/entities.ts`, usually `trace_relation_rules`, and `navigation.ts`. Template and steps: README, «Как добавить таблицу домена».
- Traceability is one table, `trace_links`, with allowed pairs in `trace_relation_rules` — not a junction table per pair (`docs/adr/0001-trace-links.md`).
- Supabase clients: `src/shared/lib/supabase/server.ts` and `browser.ts`. Updates that must not be lost go through `tracked-update.ts` (detects zero affected rows and stale `updated_at`). `insert-once.ts` is the idempotent create by request id, but it is typed for three tables only (`screens`, `design_decisions`, `user_flows`); extending it to another table means checking that the table has a `code` column and accepts a client-set `id`.

### Server actions and saving

Actions return a result instead of throwing or returning nothing. Failures carry a kind — `validation`, `denied`, `conflict`, `transient` (`src/shared/lib/action-result.ts`) — and the kind, never the message text, decides what happens next: only transient failures are retried. `src/shared/ui/autosave.tsx` (debounced saves, conflict check by `updated_at`, leave guard) and `use-action.tsx` / `ActionForm` / `ConfirmDelete` are built on that contract; new forms and editors should use them rather than calling actions directly.

### Cases and the project request form

- Site cases are read from the database (`src/site/cases-source.ts`). Built-in samples appear only when no database is configured or when `SITE_SAMPLE_CASES=1` forces them (the CI build sets it next to a placeholder Supabase URL). Otherwise a read failure throws and already built pages keep their last good version.
- The case editor writes a draft; publishing copies a valid draft into the published content. Anonymous readers can never read the draft.
- The request form (`/[locale]/start-project`, `src/site/intake`, `src/domains/requests`) submits through a database function guarded by `INTAKE_SUBMIT_SECRET`; it produces a PDF brief and can be converted into a project. Design and setup: `docs/CLIENT_INTAKE.md`.

## Migrations

- Files are named like `20261014000024_restore_grants.sql`: an eight-digit date, then a six-digit sequence number that runs through all of them (`000001`–`000024` so far). Order is decided by the whole prefix, so the date comes first: a new file needs a date later than the newest file's as well as the next number — after `20261014000024` that is `20261015000025_<name>.sql`, whatever today's date is. Name it by hand: the CLI's generated timestamp, or today's date with the next number, can sort before existing files, and then a fresh database applies migrations in a different order than the cloud did.
- A migration in the repository is not a migration in the cloud. The remote state is known only from the database itself (`npx supabase migration list --linked`, or the project's migration history); the README section «Облако» records the last comparison. Never state that something is applied remotely without checking, and never apply migrations to the remote project without being asked.
- Database changes come with pgTAP tests in `supabase/tests/database`.

## Conventions worth knowing

- Styling is Tailwind 4 with tokens defined in `src/app/globals.css` (`bg-surface`, `text-fg-secondary`, `rounded-control`, `text-meta` …). Arbitrary pixel values such as `max-w-[1440px]` are the house style; do not rewrite them to the canonical scale. Merge classes with `cn` from `src/shared/lib/cn.ts`, which knows the custom scales; plain string concatenation of two `max-w-*` classes does not override.
- Small tap targets are widened with the `.hit` class rather than by resizing the element.
- Accessibility is checked by jsx-a11y in lint and axe in e2e. The e2e axe runs use one colour scheme (light); contrast is strict only with `E2E_STRICT_A11Y` (set in CI); the only light/dark loop is the placeholder-contrast test in `e2e/intake.spec.ts`. A green e2e run says nothing about the dark theme: check it separately. Themes switch through `data-theme` on `<html>`.
- UI rules the project follows are in `docs/UX_LAWS.md` and `docs/DESIGN-SYSTEM.md`; code comments cite them by id (`UX-27`).
- `docs/HANDOFF_TRIAGE.md` and `docs/QUALITY_REVIEW.md` list past findings with their status. Check the status table before fixing something they describe.

## Claude Design sync

`.design-sync/` holds the inputs for uploading `src/shared/ui` to a Claude Design project: the package build (`build.mjs`), authored previews, `conventions.md` and `NOTES.md`. The upload is done by Claude Code's built-in `/design-sync` skill; neither the skill nor its staged scripts (`.ds-sync/`) are in the repository, so a fresh clone has only these inputs. Read `NOTES.md` before a re-sync. Ignored by git: `.ds-sync/`, `ds-bundle/`, and inside `.design-sync/` the `.cache/`, `learnings/` and `node_modules`. ESLint ignores all of `.design-sync/`, `.ds-sync/` and `ds-bundle/`.
