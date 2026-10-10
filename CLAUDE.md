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
- e2e for the tool needs `E2E_EMAIL` / `E2E_PASSWORD` and a Supabase with that user; the site specs run without them. Projects are `desktop` and `phone`; `retries` is 0.
- A stale copy of the project sits in the parent directory with its own lockfile. `outputFileTracingRoot` in `next.config.ts` exists because of it; do not remove it.

## Architecture

### Routes

`src/app` has several root layouts (hence `experimental.globalNotFound` and `app/global-not-found.tsx`):

- `(site)/[locale]` — the public site. Content and copy for both languages live in `src/site/content.ts`; the site's own components and its SIGNAL styles are in `src/site` (`src/site/signal/signal.css`).
- `(app)` — the tool: `/app` (entry), `/w/[ws]` (workspace), `/w/[ws]/p/[project]/...` (project sections), `/account`.
- `(auth)`, `auth/callback` — sign-in. `src/middleware.ts` refreshes the Supabase session and guards the private routes.

`next.config.ts` adds security headers everywhere and `noindex` on private routes and on every non-production deployment.

### Layers

`app → domains → shared`. A domain (`src/domains/<name>`) is `schema.ts` (Zod), `queries.ts`, `actions.ts` (server actions), its components, and `index.ts` as its public API. Domains import each other only through `index.ts`.

`src/shared` holds what every domain uses: `entities.ts` (the registry of traceable entity types: code prefix, label, colour group, route — it mirrors `public.entity_types`), `navigation.ts`, `i18n/uk.ts` (all tool strings), `ui/` (the tool's component kit), `lib/`.

### Data and access

- All access control is Row Level Security in Postgres. The browser only ever gets the anon/publishable key. Roles per workspace: owner / editor / viewer.
- A new domain table is wired with one call, `select public.attach_domain_table('public.<table>', '<entity>')`: it derives `workspace_id` from `project_id`, assigns codes (`INS-012`), maintains `updated_at`, the activity log, trace cleanup, the index and RLS. The README section «Как добавить таблицу домена» has the template.
- Traceability is one table, `trace_links`, with allowed pairs in `trace_relation_rules` — not a junction table per pair (`docs/adr/0001-trace-links.md`).
- Supabase clients: `src/shared/lib/supabase/server.ts` and `browser.ts`. Writes that must not be lost or duplicated go through `tracked-update.ts` (detects zero affected rows and stale `updated_at`) and `insert-once.ts` (idempotent create by request id).

### Server actions and saving

Actions return a result instead of throwing or returning nothing. Failures carry a kind — `validation`, `denied`, `conflict`, `transient` (`src/shared/lib/action-result.ts`) — and the kind, never the message text, decides what happens next: only transient failures are retried. `src/shared/ui/autosave.tsx` (debounced saves, conflict check by `updated_at`, leave guard) and `use-action.tsx` / `ActionForm` / `ConfirmDelete` are built on that contract; new forms and editors should use them rather than calling actions directly.

### Cases and the project request form

- Site cases are read from the database (`src/site/cases-source.ts`). Built-in samples appear only when no database is configured; with one configured, a read failure throws and already built pages keep their last good version.
- The case editor writes a draft; publishing copies a valid draft into the published content. Anonymous readers can never read the draft.
- The request form (`/[locale]/start-project`, `src/site/intake`, `src/domains/requests`) submits through a database function guarded by `INTAKE_SUBMIT_SECRET`; it produces a PDF brief and can be converted into a project. Design and setup: `docs/CLIENT_INTAKE.md`.

## Migrations

- Files are named like `20261014000024_restore_grants.sql`: a date, then a sequence number that runs through all of them (001–024 so far). Name a new one by hand with a number above the latest: the CLI's generated timestamp can sort before existing files, which makes a fresh database apply migrations in a different order than the cloud did.
- A migration in the repository is not a migration in the cloud. The remote state is known only from the database itself (`npx supabase migration list --linked`, or the project's migration history); the README section «Облако» records the last comparison. Never state that something is applied remotely without checking, and never apply migrations to the remote project without being asked.
- Database changes come with pgTAP tests in `supabase/tests/database`.

## Conventions worth knowing

- Styling is Tailwind 4 with tokens defined in `src/app/globals.css` (`bg-surface`, `text-fg-secondary`, `rounded-control`, `text-meta` …). Arbitrary pixel values such as `max-w-[1440px]` are the house style; do not rewrite them to the canonical scale. Merge classes with `cn` from `src/shared/lib/cn.ts`, which knows the custom scales; plain string concatenation of two `max-w-*` classes does not override.
- Small tap targets are widened with the `.hit` class rather than by resizing the element.
- Accessibility is checked: jsx-a11y in lint and axe in e2e, in both themes. Themes switch through `data-theme` on `<html>`.
- UI rules the project follows are in `docs/UX_LAWS.md` and `docs/DESIGN-SYSTEM.md`; code comments cite them by id (`UX-27`).
- `docs/HANDOFF_TRIAGE.md` and `docs/QUALITY_REVIEW.md` list past findings with their status. Check the status table before fixing something they describe.

## Claude Design sync

`.design-sync/` holds the inputs of the `/design-sync` skill, which uploads `src/shared/ui` to a Claude Design project: the package build (`build.mjs`), authored previews, `conventions.md` and `NOTES.md`. Read `NOTES.md` before a re-sync. `.ds-sync/`, `ds-bundle/` and `.design-sync/.cache/` are generated and ignored by git and ESLint.
