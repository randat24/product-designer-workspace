-- =====================================================================
-- Site profile: the «Про мене» page of the portfolio, edited in the tool
-- («Профіль сайту») instead of in the code.
-- One profile per workspace, written by its owner. The site shows the
-- profile of the workspace that runs the site: the one the project request
-- form delivers to (intake_settings). Visitors (anon) never read the table;
-- they get that one profile through site_profile().
-- content = { "uk": {...}, "en": {...} }; a field left out keeps the text
-- from the code, so the page never goes blank.
-- =====================================================================

create table public.site_profile (
  workspace_id  uuid primary key references public.workspaces (id) on delete cascade,
  content       jsonb not null default '{}'::jsonb
                check (jsonb_typeof(content) = 'object' and pg_column_size(content) <= 262144),
  updated_at    timestamptz not null default now(),
  updated_by    uuid default auth.uid() references public.profiles (id) on delete set null
);
alter table public.site_profile enable row level security;
revoke all on public.site_profile from anon;

create policy site_profile_select on public.site_profile for select to authenticated
  using (public.is_workspace_member(workspace_id, 'owner'));
create policy site_profile_insert on public.site_profile for insert to authenticated
  with check (public.is_workspace_member(workspace_id, 'owner'));
create policy site_profile_update on public.site_profile for update to authenticated
  using (public.is_workspace_member(workspace_id, 'owner'))
  with check (public.is_workspace_member(workspace_id, 'owner'));

create trigger site_profile_updated_at before update on public.site_profile
  for each row execute function public.set_updated_at();

-- The profile the site shows: the one of the workspace the request form delivers to (the enabled one first).
create function public.site_profile() returns jsonb
language sql stable security definer set search_path = '' as $$
  select p.content
  from public.intake_settings s
  join public.site_profile p on p.workspace_id = s.workspace_id
  order by s.enabled desc, s.updated_at desc
  limit 1
$$;
revoke execute on function public.site_profile() from public;
grant execute on function public.site_profile() to anon, authenticated;
