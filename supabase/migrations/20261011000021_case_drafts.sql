-- =====================================================================
-- Case drafts (docs/HANDOFF_TRIAGE.md, V06).
-- The case editor used to write straight into `content`, the snapshot the
-- public site reads: every keystroke of a published case went live.
-- Now the editor and the case settings write `draft`; «Опублікувати»
-- copies `draft` into `content` and stamps `content_updated_at`.
-- Taking a case down (status back to draft) keeps both.
-- Site visitors (anon) may read the published columns only, never `draft`.
-- =====================================================================

alter table public.case_studies
  add column draft jsonb not null default '{}'::jsonb check (jsonb_typeof(draft) = 'object'),
  add column content_updated_at timestamptz;

-- Existing cases start with a draft equal to what is published.
update public.case_studies set draft = content, content_updated_at = coalesce(published_at, updated_at);

-- Column-level read for the site: what it shows, never the draft. `updated_at` stays readable so the site
-- version deployed before this migration keeps working until the new one replaces it.
revoke select on public.case_studies from anon;
grant select (slug, status, position, content, published_at, content_updated_at, updated_at) on public.case_studies to anon;
