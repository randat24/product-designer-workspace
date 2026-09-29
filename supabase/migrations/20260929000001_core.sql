-- =====================================================================
-- Phase 1 · Core: profiles, workspaces, members, projects, entity registry,
-- human-readable codes, shared trigger helpers, RLS.
-- See docs/DATABASE.md §0–1, docs/adr/0002, docs/adr/0006.
-- =====================================================================

create type public.workspace_role as enum ('owner', 'editor', 'viewer');
create type public.project_status as enum ('active', 'paused', 'done', 'archived');

-- ---------------------------------------------------------------------
-- Generic helpers
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  if to_jsonb(new) ? 'updated_by' then
    new := jsonb_populate_record(new, jsonb_build_object('updated_by', auth.uid()));
  end if;
  return new;
end $$;

create or replace function public.role_rank(r public.workspace_role)
returns int language sql immutable as $$
  select case r when 'owner' then 3 when 'editor' then 2 else 1 end
$$;

-- ---------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  avatar_url  text,
  locale      text not null default 'ru' check (locale in ('ru', 'uk', 'en')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Workspaces & members
-- ---------------------------------------------------------------------
create table public.workspaces (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(name) between 1 and 120),
  slug         text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$'),
  owner_id     uuid not null references public.profiles (id),
  is_personal  boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger workspaces_updated_at before update on public.workspaces
  for each row execute function public.set_updated_at();

create table public.workspace_members (
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  user_id       uuid not null references public.profiles (id) on delete cascade,
  role          public.workspace_role not null default 'editor',
  invited_by    uuid references public.profiles (id),
  joined_at     timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
create index workspace_members_user_idx on public.workspace_members (user_id);

-- Membership check used by every RLS policy. SECURITY DEFINER so it can read
-- workspace_members without recursing into that table's own policies.
create or replace function public.is_workspace_member(
  ws uuid,
  min_role public.workspace_role default 'viewer'
) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = ws
      and m.user_id = auth.uid()
      and public.role_rank(m.role) >= public.role_rank(min_role)
  )
$$;

-- The creator of a workspace becomes its owner automatically.
create or replace function public.add_workspace_owner()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (workspace_id, user_id) do update set role = 'owner';
  return new;
end $$;
create trigger workspaces_add_owner after insert on public.workspaces
  for each row execute function public.add_workspace_owner();

-- ---------------------------------------------------------------------
-- Projects
-- ---------------------------------------------------------------------
create table public.projects (
  id             uuid primary key default gen_random_uuid(),
  workspace_id   uuid not null references public.workspaces (id) on delete cascade,
  name           text not null check (char_length(name) between 1 and 120),
  slug           text not null check (slug ~ '^[a-z0-9][a-z0-9-]{0,58}[a-z0-9]$'),
  description    text,
  status         public.project_status not null default 'active',
  platforms      text[] not null default '{}'
                 check (platforms <@ array['ios', 'android', 'web', 'desktop']),
  current_stage  text,
  created_by     uuid references public.profiles (id) default auth.uid(),
  updated_by     uuid references public.profiles (id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  archived_at    timestamptz,
  unique (workspace_id, slug)
);
create index projects_workspace_idx on public.projects (workspace_id, archived_at);
create trigger projects_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- New auth user → profile + personal workspace
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_base text;
  v_name text;
begin
  v_name := coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''),
                     split_part(coalesce(new.email, 'user'), '@', 1));

  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, v_name, new.raw_user_meta_data ->> 'avatar_url');

  v_base := lower(regexp_replace(split_part(coalesce(new.email, 'user'), '@', 1), '[^a-zA-Z0-9]+', '-', 'g'));
  v_base := trim(both '-' from left(v_base, 30));
  if v_base = '' then v_base := 'ws'; end if;

  insert into public.workspaces (name, slug, owner_id, is_personal)
  values ('Личное пространство', v_base || '-' || substr(md5(new.id::text), 1, 6), new.id, true);

  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Entity registry (mirrors src/shared/entities.ts). Every traceable domain
-- table registers here; codes and trace_links rely on it.
-- ---------------------------------------------------------------------
create table public.entity_types (
  type        text primary key check (type ~ '^[a-z_]+$'),
  table_name  text not null unique,
  prefix      text not null unique,
  code_sep    text not null default '-',
  code_pad    int  not null default 3 check (code_pad between 1 and 6),
  domain      text not null,
  phase       int  not null
);

insert into public.entity_types (type, table_name, prefix, code_sep, code_pad, domain, phase) values
  ('competitor',        'competitors',        'CP',   '-', 2, 'discovery',     3),
  ('research_plan',     'research_plans',     'RP',   '-', 2, 'research',      4),
  ('participant',       'participants',       'P',    '',  2, 'research',      4),
  ('interview',         'interviews',         'INT',  '-', 2, 'research',      4),
  ('answer',            'interview_answers',  'ANS',  '-', 4, 'research',      4),
  ('quote',             'quotes',             'Q',    '-', 3, 'synthesis',     5),
  ('observation',       'observations',       'OBS',  '-', 3, 'synthesis',     5),
  ('pattern',           'patterns',           'PAT',  '-', 2, 'synthesis',     5),
  ('insight',           'insights',           'INS',  '-', 3, 'synthesis',     5),
  ('pain_point',        'pain_points',        'PP',   '-', 3, 'synthesis',     5),
  ('opportunity',       'opportunities',      'OPP',  '-', 3, 'synthesis',     5),
  ('user_need',         'user_needs',         'UN',   '-', 3, 'definition',    6),
  ('segment',           'segments',           'SEG',  '-', 2, 'definition',    6),
  ('jtbd',              'jtbd',               'JTBD', '-', 2, 'definition',    6),
  ('problem_statement', 'problem_statements', 'PS',   '-', 2, 'definition',    6),
  ('hypothesis',        'hypotheses',         'HYP',  '-', 2, 'definition',    6),
  ('requirement',       'requirements',       'REQ',  '-', 3, 'architecture',  6),
  ('feature',           'features',           'FT',   '-', 3, 'architecture',  6),
  ('user_story',        'user_stories',       'US',   '-', 3, 'architecture',  6),
  ('user_flow',         'user_flows',         'FL',   '-', 2, 'flows',         7),
  ('flow_node',         'flow_nodes',         'N',    '-', 4, 'flows',         7),
  ('screen',            'screens',            'SCR',  '-', 3, 'design',        8),
  ('screen_state',      'screen_states',      'ST',   '-', 4, 'design',        8),
  ('design_decision',   'design_decisions',   'DEC',  '-', 3, 'handoff',       8),
  ('component',         'components',         'CMP',  '-', 3, 'design_system', 9),
  ('usability_test',    'usability_tests',    'UT',   '-', 2, 'testing',      10),
  ('test_finding',      'test_findings',      'F',    '-', 3, 'testing',      10);

-- ---------------------------------------------------------------------
-- Human-readable codes: INS-012, P07, DEC-024 (ADR-0006)
-- ---------------------------------------------------------------------
create table public.project_counters (
  project_id   uuid not null references public.projects (id) on delete cascade,
  entity_type  text not null references public.entity_types (type),
  last_value   int  not null default 0,
  primary key (project_id, entity_type)
);

create or replace function public.next_code(p_project uuid, p_entity text)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_ws  uuid;
  v_et  public.entity_types;
  v_n   int;
begin
  select workspace_id into v_ws from public.projects where id = p_project;
  if v_ws is null or not public.is_workspace_member(v_ws, 'editor') then
    raise exception 'next_code: no write access to project %', p_project using errcode = '42501';
  end if;
  select * into v_et from public.entity_types where type = p_entity;
  if not found then
    raise exception 'next_code: unknown entity type %', p_entity;
  end if;

  -- Atomic increment: concurrent inserts serialize on the counter row.
  insert into public.project_counters as c (project_id, entity_type, last_value)
  values (p_project, p_entity, 1)
  on conflict (project_id, entity_type) do update set last_value = c.last_value + 1
  returning c.last_value into v_n;

  return v_et.prefix || v_et.code_sep || lpad(v_n::text, greatest(v_et.code_pad, length(v_n::text)), '0');
end $$;

-- ---------------------------------------------------------------------
-- Shared triggers for domain tables (used from Phase 2 on)
-- ---------------------------------------------------------------------

-- Derive workspace_id from project_id; never trust the client (ADR-0002).
create or replace function public.set_workspace_from_project()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new := jsonb_populate_record(new, jsonb_build_object(
    'workspace_id', (select p.workspace_id from public.projects p
                     where p.id = (to_jsonb(new) ->> 'project_id')::uuid)));
  return new;
end $$;

-- Assign a code on insert when none is given. TG_ARGV[0] = entity type.
create or replace function public.assign_code()
returns trigger language plpgsql as $$
begin
  if (to_jsonb(new) ->> 'code') is null then
    new := jsonb_populate_record(new, jsonb_build_object(
      'code', public.next_code((to_jsonb(new) ->> 'project_id')::uuid, tg_argv[0])));
  end if;
  return new;
end $$;

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.profiles          enable row level security;
alter table public.workspaces        enable row level security;
alter table public.workspace_members enable row level security;
alter table public.projects          enable row level security;
alter table public.entity_types      enable row level security;
alter table public.project_counters  enable row level security; -- no policies: only via next_code()

-- profiles: yourself + people you share a workspace with
create policy profiles_select on public.profiles for select to authenticated using (
  id = auth.uid() or exists (
    select 1 from public.workspace_members mine
    join public.workspace_members theirs on theirs.workspace_id = mine.workspace_id
    where mine.user_id = auth.uid() and theirs.user_id = profiles.id)
);
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- workspaces
create policy workspaces_select on public.workspaces for select to authenticated
  using (owner_id = auth.uid() or public.is_workspace_member(id));
create policy workspaces_insert on public.workspaces for insert to authenticated
  with check (owner_id = auth.uid() and is_personal = false);
create policy workspaces_update on public.workspaces for update to authenticated
  using (public.is_workspace_member(id, 'owner')) with check (public.is_workspace_member(id, 'owner'));
create policy workspaces_delete on public.workspaces for delete to authenticated
  using (public.is_workspace_member(id, 'owner') and is_personal = false);

-- members: visible to members; managed by owners
create policy members_select on public.workspace_members for select to authenticated
  using (public.is_workspace_member(workspace_id));
create policy members_insert on public.workspace_members for insert to authenticated
  with check (public.is_workspace_member(workspace_id, 'owner'));
create policy members_update on public.workspace_members for update to authenticated
  using (public.is_workspace_member(workspace_id, 'owner'))
  with check (public.is_workspace_member(workspace_id, 'owner'));
create policy members_delete on public.workspace_members for delete to authenticated
  using (public.is_workspace_member(workspace_id, 'owner') or user_id = auth.uid());

-- projects
create policy projects_select on public.projects for select to authenticated
  using (public.is_workspace_member(workspace_id));
create policy projects_insert on public.projects for insert to authenticated
  with check (public.is_workspace_member(workspace_id, 'editor'));
create policy projects_update on public.projects for update to authenticated
  using (public.is_workspace_member(workspace_id, 'editor'))
  with check (public.is_workspace_member(workspace_id, 'editor'));
create policy projects_delete on public.projects for delete to authenticated
  using (public.is_workspace_member(workspace_id, 'owner'));

-- registry is public reference data
create policy entity_types_select on public.entity_types for select to authenticated using (true);

revoke all on function public.next_code(uuid, text) from anon;
revoke all on function public.is_workspace_member(uuid, public.workspace_role) from anon;
