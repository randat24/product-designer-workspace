-- =====================================================================
-- Phase 7a · User flows: flows (FL-01), nodes, edges, edge-case checklist.
-- Screens (SCR-001) get their table now so a Screen node can link to or
-- create one; the screen specification UI and states come in Phase 8a.
-- See docs/DATABASE.md §7–8.
-- =====================================================================

create type public.flow_status as enum ('draft', 'review', 'final');
create type public.flow_node_kind as enum ('start', 'screen', 'action', 'decision', 'system', 'error', 'success', 'end');
create type public.flow_edge_branch as enum ('default', 'yes', 'no', 'error', 'back');
create type public.edge_case_kind as enum ('payment_failed', 'no_internet', 'unavailable', 'session_expired', 'empty',
                                           'permission_denied', 'timeout', 'validation', 'custom');
create type public.edge_case_status as enum ('missing', 'covered', 'not_applicable');
create type public.screen_status as enum ('sketch', 'wireframe', 'prototype', 'tested', 'ready');

-- Moving nodes or panning the canvas is not activity worth logging.
create or replace function public.log_activity()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_row   jsonb := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  v_ws    uuid  := (v_row ->> 'workspace_id')::uuid;
  v_proj  uuid  := case when tg_table_name = 'projects' then (v_row ->> 'id')::uuid
                        else (v_row ->> 'project_id')::uuid end;
  v_keys  text[];
begin
  if tg_op = 'UPDATE' then
    select array_agg(n.key order by n.key) into v_keys
    from jsonb_each(to_jsonb(new)) n
    where n.key not in ('updated_at', 'updated_by', 'pos_x', 'pos_y', 'viewport')
      and (to_jsonb(old) -> n.key) is distinct from n.value;
    if v_keys is null then return null; end if;
  end if;

  -- During cascading deletes the parent is already gone: skip or detach.
  if tg_op = 'DELETE' then
    if not exists (select 1 from public.workspaces w where w.id = v_ws) then return null; end if;
    if tg_table_name = 'projects' then
      v_proj := null;
    elsif v_proj is not null and not exists (select 1 from public.projects p where p.id = v_proj) then
      return null;
    end if;
  end if;

  insert into public.activity_log (workspace_id, project_id, actor_id, entity_type, entity_id, action, changed_keys)
  values (v_ws, v_proj, auth.uid(), tg_argv[0], (v_row ->> 'id')::uuid,
          case tg_op when 'INSERT' then 'create' else lower(tg_op) end, v_keys);
  return null;
end $$;

-- ---------------------------------------------------------------------
-- screens (SCR-001)
-- ---------------------------------------------------------------------
create table public.screens (
  id                     uuid primary key default gen_random_uuid(),
  workspace_id           uuid not null references public.workspaces (id) on delete cascade,
  project_id             uuid not null references public.projects (id) on delete cascade,
  code                   text,
  name                   text not null check (char_length(name) between 1 and 200),
  purpose                text,
  user_goal              text,
  entry_points           text,
  primary_action         text,
  secondary_actions      text,
  content_hierarchy      jsonb not null default '[]'::jsonb,
  permissions            text,
  analytics_events       jsonb not null default '[]'::jsonb,
  api_data_requirements  text,
  status                 public.screen_status not null default 'sketch',
  figma_url              text check (figma_url ~ '^https?://'),
  figma_node_id          text,
  thumbnail_path         text,
  created_by             uuid references public.profiles (id) default auth.uid(),
  updated_by             uuid references public.profiles (id),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  archived_at            timestamptz
);
select public.attach_domain_table('public.screens', 'screen');

-- ---------------------------------------------------------------------
-- user_flows (FL-01)
-- ---------------------------------------------------------------------
create table public.user_flows (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  project_id    uuid not null references public.projects (id) on delete cascade,
  code          text,
  name          text not null check (char_length(name) between 1 and 200),
  description   text,
  status        public.flow_status not null default 'draft',
  viewport      jsonb,
  created_by    uuid references public.profiles (id) default auth.uid(),
  updated_by    uuid references public.profiles (id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  archived_at   timestamptz
);
select public.attach_domain_table('public.user_flows', 'user_flow');

-- ---------------------------------------------------------------------
-- flow_nodes, flow_edges, flow_edge_cases: owned by a flow (no codes)
-- ---------------------------------------------------------------------
create table public.flow_nodes (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  project_id    uuid not null references public.projects (id) on delete cascade,
  flow_id       uuid not null references public.user_flows (id) on delete cascade,
  kind          public.flow_node_kind not null,
  label         text not null default '' check (char_length(label) <= 200),
  screen_id     uuid references public.screens (id) on delete set null,
  pos_x         double precision not null default 0,
  pos_y         double precision not null default 0,
  data          jsonb not null default '{}'::jsonb,
  created_by    uuid references public.profiles (id) default auth.uid(),
  updated_by    uuid references public.profiles (id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
select public.attach_project_table('public.flow_nodes', 'flow_node');
create index flow_nodes_flow_idx on public.flow_nodes (flow_id);
create index flow_nodes_screen_idx on public.flow_nodes (screen_id);

create table public.flow_edges (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references public.workspaces (id) on delete cascade,
  project_id      uuid not null references public.projects (id) on delete cascade,
  flow_id         uuid not null references public.user_flows (id) on delete cascade,
  source_node_id  uuid not null references public.flow_nodes (id) on delete cascade,
  target_node_id  uuid not null references public.flow_nodes (id) on delete cascade,
  label           text check (char_length(label) <= 120),
  branch          public.flow_edge_branch not null default 'default',
  condition       text,
  created_by      uuid references public.profiles (id) default auth.uid(),
  updated_by      uuid references public.profiles (id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (source_node_id <> target_node_id),
  unique (source_node_id, target_node_id)
);
select public.attach_project_table('public.flow_edges', 'flow_edge');
create index flow_edges_flow_idx on public.flow_edges (flow_id);
create index flow_edges_target_idx on public.flow_edges (target_node_id);

create table public.flow_edge_cases (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  project_id    uuid not null references public.projects (id) on delete cascade,
  flow_id       uuid not null references public.user_flows (id) on delete cascade,
  kind          public.edge_case_kind not null,
  description   text check (char_length(description) <= 500),
  status        public.edge_case_status not null default 'missing',
  node_id       uuid references public.flow_nodes (id) on delete set null,
  position      int not null default 0,
  created_by    uuid references public.profiles (id) default auth.uid(),
  updated_by    uuid references public.profiles (id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
select public.attach_project_table('public.flow_edge_cases', 'flow_edge_case');
create index flow_edge_cases_flow_idx on public.flow_edge_cases (flow_id);
create index flow_edge_cases_node_idx on public.flow_edge_cases (node_id);
create unique index flow_edge_cases_kind_uidx on public.flow_edge_cases (flow_id, kind) where kind <> 'custom';

-- ---------------------------------------------------------------------
-- Integrity: children take project from their flow; referenced nodes must be
-- in the same flow and screens in the same project.
-- ---------------------------------------------------------------------
create or replace function public.flow_refs_validate()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  select project_id into new.project_id from public.user_flows where id = new.flow_id;

  -- Nested per table: PL/pgSQL resolves every field in an AND.
  if tg_table_name = 'flow_nodes' then
    if new.screen_id is not null and not exists (
      select 1 from public.screens s where s.id = new.screen_id and s.project_id = new.project_id) then
      raise exception 'flows: screen % is not in project %', new.screen_id, new.project_id using errcode = '23503';
    end if;
  elsif tg_table_name = 'flow_edges' then
    if (select count(*) from public.flow_nodes n
        where n.id in (new.source_node_id, new.target_node_id) and n.flow_id = new.flow_id) <> 2 then
      raise exception 'flows: edge nodes must belong to flow %', new.flow_id using errcode = '23503';
    end if;
  elsif tg_table_name = 'flow_edge_cases' then
    if new.node_id is not null and not exists (
      select 1 from public.flow_nodes n where n.id = new.node_id and n.flow_id = new.flow_id) then
      raise exception 'flows: node % is not in flow %', new.node_id, new.flow_id using errcode = '23503';
    end if;
  end if;
  return new;
end $$;
revoke execute on function public.flow_refs_validate() from public, anon, authenticated;

create trigger a_flow_nodes_refs before insert or update on public.flow_nodes
  for each row execute function public.flow_refs_validate();
create trigger a_flow_edges_refs before insert or update on public.flow_edges
  for each row execute function public.flow_refs_validate();
create trigger a_flow_edge_cases_refs before insert or update on public.flow_edge_cases
  for each row execute function public.flow_refs_validate();

-- Every new flow starts with the standard edge-case checklist.
create or replace function public.flow_default_edge_cases()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.flow_edge_cases (project_id, flow_id, kind, position)
  select new.project_id, new.id, k, ord
  from unnest(array['no_internet', 'timeout', 'session_expired', 'permission_denied',
                    'validation', 'empty', 'unavailable', 'payment_failed']::public.edge_case_kind[])
       with ordinality as t(k, ord);
  return null;
end $$;
revoke execute on function public.flow_default_edge_cases() from public, anon, authenticated;
create trigger user_flows_default_edge_cases after insert on public.user_flows
  for each row execute function public.flow_default_edge_cases();

-- A Screen node keeps the trace link "flow implements screen" (origin system).
create or replace function public.flow_node_screen_trace()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op in ('UPDATE', 'DELETE') and old.screen_id is not null
     and (tg_op = 'DELETE' or new.screen_id is distinct from old.screen_id)
     and not exists (select 1 from public.flow_nodes n
                     where n.flow_id = old.flow_id and n.screen_id = old.screen_id and n.id <> old.id) then
    delete from public.trace_links
    where source_type = 'user_flow' and source_id = old.flow_id
      and target_type = 'screen' and target_id = old.screen_id
      and relation = 'implements' and origin = 'system';
  end if;
  if tg_op in ('INSERT', 'UPDATE') and new.screen_id is not null then
    insert into public.trace_links (project_id, source_type, source_id, target_type, target_id, relation, origin, created_by)
    values (new.project_id, 'user_flow', new.flow_id, 'screen', new.screen_id, 'implements', 'system', auth.uid())
    on conflict do nothing;
  end if;
  return null;
end $$;
revoke execute on function public.flow_node_screen_trace() from public, anon, authenticated;
create trigger flow_nodes_screen_trace after insert or update of screen_id or delete on public.flow_nodes
  for each row execute function public.flow_node_screen_trace();

-- ---------------------------------------------------------------------
-- Numbers for the flows list: steps, screen nodes, unresolved edge cases.
-- SECURITY INVOKER: the caller's RLS applies.
-- ---------------------------------------------------------------------
create or replace function public.flow_stats(p_project uuid)
returns table (flow_id uuid, node_count int, screen_count int, missing_cases int)
language sql stable set search_path = '' as $$
  select f.id,
    (select count(*)::int from public.flow_nodes n where n.flow_id = f.id),
    (select count(*)::int from public.flow_nodes n where n.flow_id = f.id and n.kind = 'screen'),
    (select count(*)::int from public.flow_edge_cases c where c.flow_id = f.id and c.status = 'missing')
  from public.user_flows f
  where f.project_id = p_project
$$;
revoke execute on function public.flow_stats(uuid) from public, anon;
grant  execute on function public.flow_stats(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- Demo flow (docs/MVP.md §4): Вход → Есть профиль? → Onboarding → Профиль
-- по телефону → SMS → Карта и список → Фильтры → Карточка ресторана → Подходит?
-- ---------------------------------------------------------------------
create or replace function public.seed_demo_flows(p_project uuid)
returns void language plpgsql set search_path = '' as $$
declare
  v_flow  uuid;
  v_scr   uuid[] := '{}';
  v_n     uuid[] := '{}';
  v_id    uuid;
  r       record;
begin
  for r in select * from (values
    (1, 'Профиль по телефону', 'Создать профиль без пароля — по номеру телефона.', 'Зарегистрироваться за минуту', 'wireframe'),
    (2, 'Карта и список', 'Показать подходящие рестораны рядом на карте и списком.', 'Найти место под повод', 'prototype'),
    (3, 'Карточка ресторана', 'Помочь решить, подходит ли место, и забронировать столик.', 'Понять, подходит ли место', 'sketch')
  ) as t(n, name, purpose, goal, status) loop
    insert into public.screens (project_id, name, purpose, user_goal, status)
    values (p_project, r.name, r.purpose, r.goal, r.status::public.screen_status)
    returning id into v_id;
    v_scr := v_scr || v_id;
  end loop;

  insert into public.user_flows (project_id, name, description, status)
  values (p_project, 'Первый вход и выбор ресторана',
          'От первого запуска приложения до брони столика в подходящем ресторане.', 'review')
  returning id into v_flow;

  for r in select * from (values
    (1,  'start',    'Открывает приложение', null::int, 0,    160),
    (2,  'decision', 'Есть профиль?',        null,      240,  160),
    (3,  'screen',   'Onboarding',           null,      480,  0),
    (4,  'screen',   'Профиль по телефону',  1,         720,  0),
    (5,  'action',   'Вводит код из SMS',    null,      960,  0),
    (6,  'screen',   'Карта и список',       2,         960,  160),
    (7,  'action',   'Выбирает фильтр «повод»', null,   1200, 160),
    (8,  'screen',   'Карточка ресторана',   3,         1440, 160),
    (9,  'decision', 'Подходит?',            null,      1680, 160),
    (10, 'success',  'Столик забронирован',  null,      1920, 160),
    (11, 'error',    'Нет сети',             null,      960,  320)
  ) as t(n, kind, label, scr, x, y) loop
    insert into public.flow_nodes (project_id, flow_id, kind, label, screen_id, pos_x, pos_y)
    values (p_project, v_flow, r.kind::public.flow_node_kind, r.label, v_scr[r.scr], r.x, r.y)
    returning id into v_id;
    v_n := v_n || v_id;
  end loop;

  insert into public.flow_edges (project_id, flow_id, source_node_id, target_node_id, branch, label)
  select p_project, v_flow, v_n[s], v_n[t], b::public.flow_edge_branch, l from (values
    (1, 2, 'default', null),
    (2, 3, 'no', 'Нет'),
    (2, 6, 'yes', 'Да'),
    (3, 4, 'default', null),
    (4, 5, 'default', null),
    (5, 6, 'default', null),
    (6, 7, 'default', null),
    (7, 8, 'default', null),
    (8, 9, 'default', null),
    (9, 10, 'yes', 'Да'),
    (9, 6, 'no', 'Нет — к списку'),
    (6, 11, 'error', 'Нет соединения')
  ) as e(s, t, b, l);

  update public.flow_edge_cases set status = 'covered', node_id = v_n[11],
    description = 'Экран «Нет сети» с повтором запроса и последними результатами из кэша.'
  where flow_id = v_flow and kind = 'no_internet';
  update public.flow_edge_cases set status = 'covered', node_id = v_n[5],
    description = 'Неверный код из SMS: подсказка и повторная отправка через 60 секунд.'
  where flow_id = v_flow and kind = 'validation';
  update public.flow_edge_cases set status = 'not_applicable',
    description = 'Оплаты в приложении нет: бронь без предоплаты.'
  where flow_id = v_flow and kind = 'payment_failed';

  insert into public.trace_links (project_id, source_type, source_id, target_type, target_id, relation)
  select p_project, 'opportunity', o.id, 'user_flow', v_flow, 'addresses'
  from public.opportunities o
  where o.project_id = p_project and o.title = 'Подбор ресторана под повод';
end $$;
revoke execute on function public.seed_demo_flows(uuid) from public, anon;
grant  execute on function public.seed_demo_flows(uuid) to authenticated;

create or replace function public.seed_demo_content(p_project uuid)
returns void language plpgsql set search_path = '' as $$
begin
  perform public.seed_demo_competitors(p_project);
  perform public.seed_demo_research(p_project);
  perform public.seed_demo_synthesis(p_project);
  perform public.seed_demo_flows(p_project);
end $$;
