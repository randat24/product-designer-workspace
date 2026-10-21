# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

One Next.js 15 app (App Router, React 19, TS strict, Tailwind 4, Supabase) holding two products:

- **Public site** (portfolio + CV) at `/[locale]` (`uk` / `en`), in `src/app/(site)` and `src/site/`. Needs no login.
- **Product designer tool** at `/app` and `/w/[ws]/…`, in `src/app/(app)` and `src/domains/`. Its core is end-to-end traceability: `Interview → Quote → Insight → Pain Point → Opportunity → Flow → Screen → Decision`.

The README, docs and many code comments are in Russian. The tool UI is Ukrainian (strings in `src/shared/i18n/uk.ts`); site copy is uk/en in `src/site/content.ts`, except the home page and site frame of the SIGNAL redesign: `src/site/signal/home-content.ts`, `src/site/signal/hero.tsx` and the hero's decision trail `src/site/signal/hero-trace.tsx` (its records come from the published `designer-workspace` case; without it the block is hidden). The «01 /», «02 /» before home sections come from their order in `src/app/(site)/[locale]/page.tsx`, not from the copy. Product and architecture docs are in `docs/` (PRD, ARCHITECTURE, DATABASE, IA, DESIGN-SYSTEM, QUALITY_REVIEW, UX_LAWS, ADRs in `docs/adr/`).

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
npm run db:test             # pgTAP tests in supabase/tests/database/ (expect a fresh DB: run db:reset first if you signed in locally and opened the demo project — 18_project_restore finds two `restaurant-app` projects and fails)
npm run db:reset            # rebuild local DB from migrations
npm run db:types            # regenerate src/types/database.generated.ts from the local DB (never edit it by hand)
npm run cv                  # build CV PDFs (scripts/build-cv.ts)
```

E2E notes: tool specs need a user via `E2E_EMAIL` / `E2E_PASSWORD` (locally, create it like CI does: `POST $API_URL/auth/v1/admin/users` with the service key and `email_confirm: true`; values from `npx supabase status -o env`; without `.env.local`, pass `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `next dev` the same way); a missing browser means `npx playwright install chromium-headless-shell`; `E2E_BASE_URL` points at an already running server; `E2E_STRICT_MOBILE=1` and `E2E_STRICT_A11Y=1` turn horizontal scroll on phones and axe contrast issues into failures (CI sets both). The intake form needs `INTAKE_SUBMIT_SECRET`. `SITE_SAMPLE_CASES=1` builds the site from built-in sample cases without a database (CI `app` job).

Run e2e against a production build (`npm run build && npm start -- -p 3100`, then `E2E_BASE_URL=http://localhost:3100`), as CI does: a long-running `next dev` compiles the heavy case pages slowly enough to hit Playwright's 30 s timeout. Hydration bugs show up only in production builds and only at random; check a fix with `--repeat-each=5`.

CI (`.github/workflows/ci.yml`) runs on every PR: typecheck, lint, unit tests, build; pgTAP on `supabase db start`; e2e on a local Supabase stack.

## Architecture

**Dependency rule:** `app → domains → shared`. Domains import each other only through `src/domains/<name>/index.ts`. This is a convention; no lint rule enforces it.

**Domain layout** (`src/domains/<name>/`): `schema.ts` (Zod, shared by form and server action), `queries.ts`, `actions.ts` (server actions), components, `index.ts` (public API). `trace` is the cross-cutting domain for all evidence links; don't add ad-hoc relation fields or a second evidence graph.

**Server action results:** return failures via `src/shared/lib/action-result.ts` (`transient` / `invalid` / `denied` / `conflict`). The `kind` decides client behaviour, never the message text: only `transient` is retried automatically (autosave). Shared form/autosave UI lives in `src/shared/ui/` (`action-form`, `autosave`, `use-action`). Autosave sends the whole record and a `validation` failure (the `invalid()` helper) is never retried, so when a field's rule gets stricter, a value stored under the old rule blocks every later save of the record. Parse such records with `parseKeepingStored` (`src/shared/lib/keep-stored.ts`): if that field is the only problem and still holds the stored value, the rest is saved and the old value kept (used for competitor `url` and screen `figma_url`).

**Link fields:** `src/shared/lib/url.ts`. `optionalHttpUrl()` is the rule for link fields in the tool's forms (competitor links, screen and state Figma links, a case's live URL): it adds `https://` to a bare host, keeps only http(s), reads `host:port` as a host only when the host has a dot or is `localhost`, and treats a half-typed `http:` as empty. It does not check that the host looks real, so "intranet" becomes `https://intranet`. `httpUrlOrNull()` is stricter, for imported data: values with spaces or without a dotted host (or `localhost`) become null. The public project request form has its own, stricter `normalizeUrl` in `src/domains/requests/schema.ts` (no localhost, no credentials) on purpose. The brief's link list only gets `withScheme` (the links are shown as text in the editor, not as hrefs). Use these rather than a new check in a domain.

**Entities and codes:** every traceable entity has a human-readable code (`INS-###`, `SCR-###`, `DEC-###`…) from `project_counters`. The registry is `src/shared/entities.ts`, mirrored by the `entity_types` table. Navigation and project stages are in `src/shared/navigation.ts`.

**Security lives in the database.** RLS on every table, roles owner / editor / viewer; server code is not the only line of defence. Some functions are deliberately callable by `anon` (site, intake form, notes: `site_notes`, `note_react`); see the README "Облако" section before changing grants. SECURITY DEFINER bodies live in schema `internal`, which PostgREST does not expose; `public` holds a SECURITY INVOKER wrapper with the same name and grants for the ones the app calls (migration 028; pgTAP `21_definer_out_of_api` fails on a definer function in `public` that anon or authenticated can run). A new definer function goes into `internal` with `revoke execute … from public`. Signup is restricted by `signup_allowlist`. `src/middleware.ts` refreshes the Supabase session but must not hit Supabase on public site pages. Its matcher skips static files by extension; a new kind of file in `public/` (e.g. video) needs its extension there, or it returns 404.

**Adding a domain table:** create it with `workspace_id`, `project_id`, `code`, audit columns, `archived_at`, then `select public.attach_domain_table('public.<table>', '<entity_type>')`. This wires the code, `workspace_id` from `project_id`, `updated_at`, trace cleanup, activity log, index and RLS in one call (full example in README). Non-traceable project tables use `attach_project_table()`. Add relation rules to `trace_relation_rules` if needed; demo data is extended in `seed_demo_content()`, not by rewriting `create_demo_project`.

**Database types:** code imports `src/types/database.ts`, a thin layer over the generated `database.generated.ts`. It adds what the generator cannot see: columns triggers fill on insert (`workspace_id`, `code`) and text columns limited by a `check` (typed as their values, in `Checked`). After a migration, run `npm run db:types` and `npm run typecheck`; a new trigger-filled column or checked text column goes into that layer. The checked-in file is in the format of the Supabase MCP `generate_typescript_types` (cloud; it has `__InternalSupabase`). A recent CLI (`npx supabase` resolves to the latest, e.g. 2.121) rewrites the whole file in another format and breaks typecheck on `Json` columns: regenerate from the cloud through the MCP once the migration is applied there, and diff before committing.

**Migrations:** `supabase/migrations/` (001–028 so far). Name new migrations manually with a number above the last one, continuing the series (e.g. `20261023000029_<name>.sql`), not with `supabase migration new` (its timestamp would sort before the existing future-dated files). Verify with `npm run db:reset`. Add pgTAP tests in `supabase/tests/database/`. A file in the repo does not prove it's applied in the cloud; check with `npx supabase migration list --linked` (it asks for the database password) or, without it, the Supabase MCP (`list_migrations`, `apply_migration`). MCP `apply_migration` records the migration under the current timestamp, and SQL run in the dashboard editor records nothing: afterwards make `supabase_migrations.schema_migrations` hold the file's version and name, or `supabase db push` will try to apply it again.

**Site cases:** published case studies come from the `case_studies` table (`src/site/cases-source.ts`, revalidated every minute and on status change). The built-in list in `content.ts` is a fallback only, and it is what a local run without Supabase settings shows. It differs from production (other cases, placeholder covers and text), so judge real case content on the live site. Cases with `sample: true` have illustrative numbers: they are `noindex` and kept off the home page. Case content is a `{ uk, en }` snapshot in `content`. Case pictures are rendered with `responsive()` from `src/site/img.ts`: it routes site paths and public Supabase Storage files through the Next.js image optimizer (WebP, a srcset by layout width) and leaves other hosts, SVG and the gallery lightbox on their original file; a plain `<img src>` sends uploads at full size (one PNG cover was 1.4 MB). Client components rendered on the server must sort and format the same way on both sides: `localeCompare` gave a different order on the server than in the browser and caused a hydration error (sort by code point instead). Page titles over 60 characters drop the « | name» suffix and descriptions are clamped to 160 (`pageMetadata` in `src/site/seo.ts`). Site notes («Нотатки», `/[locale]/notes`) are short posts written in the tool at `/w/[ws]/notes` (`src/domains/notes/`, table `site_notes`, migration 025) and read through `src/site/notes-source.ts`; the site shows the notes of the workspace the request form delivers to, as with the site profile. A note without English text is on the Ukrainian site only. Visitors can only react, through `src/domains/notes/public-actions.ts`, which needs `INTAKE_SUBMIT_SECRET` like the request form; private replies were removed (PR #81, migration 026). Screen recordings of a case (a walkthrough above «Сторінки проєкту» and short clips at the end of story chapters) are not part of the snapshot: they are MP4 + WebM files in `public/cases/<slug>/video/`, listed by slug in `src/site/case-videos.ts` and played by `src/site/case-video.tsx` (silent loop while in view, pause button, poster only under reduced motion); `.mp4`/`.webm` are in the middleware matcher's file list, without which they 404. Adding an award means an SVG in `public/awards/`, an id in `src/site/award-icons.tsx`, and entries in `awards` for both locales.

**Design system:** tokens in `src/app/globals.css`, components in `src/shared/ui/`, rules in `docs/DESIGN-SYSTEM.md` (SIGNAL: warm neutral base, one orange accent, Manrope for everything). `.design-sync/` + `ds-bundle/` package `src/shared/ui` for Claude Design (see `.design-sync/NOTES.md`). If you rename a token in `globals.css`, rename it in `.design-sync/tailwind.css` and `.design-sync/conventions.md` too. Motion goes through `--duration-fast` / `--duration-base` / `--ease-standard` (rules in DESIGN-SYSTEM.md, «Движение и отклик»; the full spec is `docs/MOTION.md`).

**Error reporting:** `src/instrumentation.ts` sends server errors (render, server actions, route handlers, middleware) and every `console.error` to Sentry when `SENTRY_DSN` is set; it is server-only and without PII on purpose (the browser SDK would run before analytics consent). Vercel Hobby keeps runtime logs for one hour, so Sentry is where production failures are kept.

**Next.js patch:** `patches/next+15.5.27.patch` does two things: it fixes a vendored-React bug where server action results / `<Link>` navigations never commit, and it hydrates in one pass instead of inside `startTransition` (time-sliced hydration threw random React #418 on the site). Remove both only after upgrading Next, and re-run the repeated e2e check (see `patches/README.md`). After editing anything under `node_modules/next`, delete `.next/cache` before building: webpack otherwise keeps the old module and the change silently has no effect.

## Conventions

- The tool must work fully on a phone; the e2e `phone` project and strict mobile/a11y flags guard this. UX rules and a pre-merge checklist are in `docs/UX_LAWS.md`.
- Commit messages: short imperative-ish summary of the user-visible change, often prefixed with an area (`Site audit: …`, `design-sync: …`, `docs: …`). Work goes through PRs into `main`; Vercel deploys production from `main`. The live site is the latest production deployment, and a branch deployment promoted to production has overridden a newer `main` before: after a release, check the live site (`curl` the page for the new text, about 2–3 minutes after the push) rather than assuming. Vercel reads environment variables at build time: after adding or changing one, redeploy, or the running site keeps working without it (reactions failed this way once).
