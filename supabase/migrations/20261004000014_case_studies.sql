-- =====================================================================
-- Case studies: a project published to the public portfolio site.
-- One case per project. `content` is the snapshot the site shows,
-- { "uk": Case, "en": Case } (see src/site/content.ts and case-story.ts),
-- so later work in the project does not leak to the site until it is
-- published again. Status: draft → review (client approval) → published.
-- Visitors of the site (anon) read published cases only.
-- =====================================================================

create type public.case_status as enum ('draft', 'review', 'published');

create table public.case_studies (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  project_id    uuid not null unique references public.projects (id) on delete cascade,
  slug          text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{0,58}[a-z0-9]$'),
  status        public.case_status not null default 'draft',
  position      int not null default 0,
  content       jsonb not null default '{}'::jsonb check (jsonb_typeof(content) = 'object'),
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
select public.attach_project_table('public.case_studies', 'case_study');
create index case_studies_published_idx on public.case_studies (position) where status = 'published';

-- published_at: set when a case goes public, cleared when it is taken down.
create or replace function public.case_studies_published_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    new.published_at := coalesce(new.published_at, now());
  elsif new.status <> 'published' then
    new.published_at := null;
  end if;
  return new;
end $$;
create trigger case_studies_published_at before insert or update of status on public.case_studies
  for each row execute function public.case_studies_published_at();

-- The public site reads published cases without signing in.
create policy case_studies_public_read on public.case_studies for select to anon
  using (status = 'published');
grant select on public.case_studies to anon;
