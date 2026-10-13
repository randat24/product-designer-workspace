# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

One Next.js 15 app (App Router, React 19, TS strict, Tailwind 4, Supabase) holding two products:

- **Public site** (portfolio + CV) at `/[locale]` (`uk` / `en`), in `src/app/(site)` and `src/site/`. Needs no login.
- **Product designer tool** at `/app` and `/w/[ws]/…`, in `src/app/(app)` and `src/domains/`. Its core is end-to-end traceability: `Interview → Quote → Insight → Pain Point → Opportunity → Flow → Screen → Decision`.

The README, docs and many code comments are in Russian. The tool UI is Ukrainian (strings in `src/shared/i18n/uk.ts`); site copy is uk/en in `src/site/content.ts`. Product and architecture docs are in `docs/` (PRD, ARCHITECTURE, DATABASE, IA, DESIGN-SYSTEM, QUALITY_REVIEW, UX_LAWS, ADRs in `docs/adr/`).

## Commands

Node 22. Docker is needed for local Supabase.

```bash
npm install                 # also runs patch-package (patches/next+15.5.27.patch, fails loudly if it no longer applies)
npx supabase start          # local Postgres/Auth/Storage/Mailpit; applies migrations. Copy API URL + anon key into .env.local (see .env.example)
npm run dev                 # http://localhost:3000; magic-link mail goes to Mailpit at http://127.0.0.1:54324

npm run typecheck           # tsc --noEmit
npm run lint                # ESLint: next/core-web-vitals + next/typescript + jsx-a11y/recommended
npm test                    # Vitest, src/**/*.test.ts, node environment (pure logic only)
npx vitest run src/shared/lib/url.test.ts   # one test file; add -t "<name>" for one test
npm run build
npm run e2e                 # Playwright against `npm start` (build first); projects: setup, desktop, phone
npx playwright test e2e/site.spec.ts --project=desktop   # one spec / one viewport
npm run db:test             # pgTAP tests in supabase/tests/database/
npm run db:reset            # rebuild local DB from migrations
npm run db:types            # regenerate src/types/database.ts from the local DB
npm run cv                  # build CV PDFs (scripts/build-cv.ts)
```

E2E notes: tool specs need a user via `E2E_EMAIL` / `E2E_PASSWORD`; `E2E_BASE_URL` points at an already running server; `E2E_STRICT_MOBILE=1` and `E2E_STRICT_A11Y=1` turn horizontal scroll on phones and axe contrast issues into failures (CI sets both). The intake form needs `INTAKE_SUBMIT_SECRET`. `SITE_SAMPLE_CASES=1` builds the site from built-in sample cases without a database (CI `app` job).

CI (`.github/workflows/ci.yml`) runs on every PR: typecheck, lint, unit tests, build; pgTAP on `supabase db start`; e2e on a local Supabase stack.

## Architecture

**Dependency rule:** `app → domains → shared`. Domains import each other only through `src/domains/<name>/index.ts`. This is a convention; no lint rule enforces it.

**Domain layout** (`src/domains/<name>/`): `schema.ts` (Zod, shared by form and server action), `queries.ts`, `actions.ts` (server actions), components, `index.ts` (public API). `trace` is the cross-cutting domain for all evidence links; don't add ad-hoc relation fields or a second evidence graph.

**Server action results:** return failures via `src/shared/lib/action-result.ts` (`transient` / `invalid` / `denied` / `conflict`). The `kind` decides client behaviour, never the message text: only `transient` is retried automatically (autosave). Shared form/autosave UI lives in `src/shared/ui/` (`action-form`, `autosave`, `use-action`).

**Entities and codes:** every traceable entity has a human-readable code (`INS-###`, `SCR-###`, `DEC-###`…) from `project_counters`. The registry is `src/shared/entities.ts`, mirrored by the `entity_types` table. Navigation and project stages are in `src/shared/navigation.ts`.

**Security lives in the database.** RLS on every table, roles owner / editor / viewer; server code is not the only line of defence. Some functions are deliberately callable by `anon` (site, intake form); see the README "Облако" section before changing grants. Signup is restricted by `signup_allowlist`. `src/middleware.ts` refreshes the Supabase session but must not hit Supabase on public site pages.

**Adding a domain table:** create it with `workspace_id`, `project_id`, `code`, audit columns, `archived_at`, then `select public.attach_domain_table('public.<table>', '<entity_type>')`. This wires the code, `workspace_id` from `project_id`, `updated_at`, trace cleanup, activity log, index and RLS in one call (full example in README). Non-traceable project tables use `attach_project_table()`. Add relation rules to `trace_relation_rules` if needed; demo data is extended in `seed_demo_content()`, not by rewriting `create_demo_project`.

**Migrations:** `supabase/migrations/` (001–024 so far). Name new migrations manually with a number above the last one, continuing the series (e.g. `20261015000025_<name>.sql`), not with `supabase migration new` (its timestamp would sort before the existing future-dated files). Verify with `npm run db:reset`. Add pgTAP tests in `supabase/tests/database/`. A file in the repo does not prove it's applied in the cloud; check with `npx supabase migration list --linked`.

**Site cases:** published case studies come from the `case_studies` table (`src/site/cases-source.ts`, revalidated every minute and on status change). The built-in list in `content.ts` is a fallback only. Case content is a `{ uk, en }` snapshot in `content`. Adding an award means an SVG in `public/awards/`, an id in `src/site/award-icons.tsx`, and entries in `awards` for both locales.

**Design system:** tokens in `src/app/globals.css`, components in `src/shared/ui/`, rules in `docs/DESIGN-SYSTEM.md` (ink base, pastel stickers, Manrope for UI, Oswald for display headings). `.design-sync/` + `ds-bundle/` package `src/shared/ui` for Claude Design (see `.design-sync/NOTES.md`). If you rename a token in `globals.css`, rename it in `.design-sync/tailwind.css` and `.design-sync/conventions.md` too.

**Next.js patch:** `patches/next+15.5.27.patch` fixes a vendored-React bug where server action results / `<Link>` navigations never commit. Remove it only after upgrading Next to a version with the fix (see `patches/README.md`).

## Conventions

- The tool must work fully on a phone; the e2e `phone` project and strict mobile/a11y flags guard this. UX rules and a pre-merge checklist are in `docs/UX_LAWS.md`.
- Commit messages: short imperative-ish summary of the user-visible change, often prefixed with an area (`Site audit: …`, `design-sync: …`, `docs: …`). Work goes through PRs into `main`; Vercel deploys from `main`.
