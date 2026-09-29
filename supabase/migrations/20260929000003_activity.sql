-- =====================================================================
-- Phase 1 · Activity log + helper that wires a domain table into the
-- platform (workspace derivation, codes, updated_at, trace cleanup, activity).
-- =====================================================================

create table public.activity_log (
  id            bigint generated always as identity primary key,
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  project_id    uuid references public.projects (id) on delete cascade,
  actor_id      uuid references public.profiles (id) on delete set null,
  entity_type   text not null,
  entity_id     uuid not null,
  action        text not null check (action in ('create', 'update', 'delete', 'link', 'unlink', 'ai_accept')),
  changed_keys  text[],
  created_at    timestamptz not null default now()
);
create index activity_log_project_idx on public.activity_log (project_id, created_at desc);
create index activity_log_entity_idx on public.activity_log (entity_type, entity_id);

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
    where n.key not in ('updated_at', 'updated_by')
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

create trigger projects_activity after insert or update or delete on public.projects
  for each row execute function public.log_activity('project');

-- Links are logged against their downstream (target) entity.
create or replace function public.log_trace_activity()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v public.trace_links := case when tg_op = 'DELETE' then old else new end;
begin
  if tg_op = 'DELETE' and not exists (select 1 from public.projects p where p.id = v.project_id) then
    return null;
  end if;
  insert into public.activity_log (workspace_id, project_id, actor_id, entity_type, entity_id, action, changed_keys)
  values (v.workspace_id, v.project_id, auth.uid(), v.target_type, v.target_id,
          case when tg_op = 'DELETE' then 'unlink' when v.origin = 'ai_accepted' then 'ai_accept' else 'link' end,
          array[v.relation, v.source_type || ':' || v.source_id]);
  return null;
end $$;
create trigger trace_links_activity after insert or delete on public.trace_links
  for each row execute function public.log_trace_activity();

alter table public.activity_log enable row level security;
create policy activity_select on public.activity_log for select to authenticated
  using (public.is_workspace_member(workspace_id));
-- No insert/update/delete policies: rows are written only by triggers.

-- ---------------------------------------------------------------------
-- attach_domain_table: one call per new domain table in future migrations.
--   select public.attach_domain_table('public.insights', 'insight');
-- Expects columns: id, workspace_id, project_id, updated_at; optional code.
-- ---------------------------------------------------------------------
create or replace function public.attach_domain_table(p_table regclass, p_entity text)
returns void language plpgsql as $$
declare
  v_name text := (select relname from pg_class where oid = p_table);
  v_has_code boolean := exists (
    select 1 from pg_attribute where attrelid = p_table and attname = 'code' and not attisdropped);
begin
  if not exists (select 1 from public.entity_types where type = p_entity and table_name = v_name) then
    raise exception 'attach_domain_table: register % → % in entity_types first', p_entity, v_name;
  end if;

  execute format('create trigger %I before insert or update of project_id on %s
                  for each row execute function public.set_workspace_from_project()', v_name || '_ws', p_table);
  if v_has_code then
    execute format('create trigger %I before insert on %s
                    for each row execute function public.assign_code(%L)', v_name || '_code', p_table, p_entity);
    execute format('create unique index %I on %s (project_id, code)', v_name || '_code_uidx', p_table);
  end if;
  execute format('create trigger %I before update on %s
                  for each row execute function public.set_updated_at()', v_name || '_updated_at', p_table);
  execute format('create trigger %I after delete on %s
                  for each row execute function public.trace_cleanup(%L)', v_name || '_trace_cleanup', p_table, p_entity);
  execute format('create trigger %I after insert or update or delete on %s
                  for each row execute function public.log_activity(%L)', v_name || '_activity', p_table, p_entity);
  execute format('create index %I on %s (project_id)', v_name || '_project_idx', p_table);

  execute format('alter table %s enable row level security', p_table);
  execute format('create policy %I on %s for select to authenticated using (public.is_workspace_member(workspace_id))',
                 v_name || '_select', p_table);
  execute format('create policy %I on %s for insert to authenticated with check (public.is_workspace_member(workspace_id, ''editor''))',
                 v_name || '_insert', p_table);
  execute format('create policy %I on %s for update to authenticated using (public.is_workspace_member(workspace_id, ''editor'')) with check (public.is_workspace_member(workspace_id, ''editor''))',
                 v_name || '_update', p_table);
  execute format('create policy %I on %s for delete to authenticated using (public.is_workspace_member(workspace_id, ''editor''))',
                 v_name || '_delete', p_table);
end $$;
revoke all on function public.attach_domain_table(regclass, text) from public, anon, authenticated;
