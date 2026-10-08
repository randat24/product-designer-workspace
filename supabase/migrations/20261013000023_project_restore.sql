-- =====================================================================
-- Restore a project from its JSON export (src/domains/projects/export.ts).
-- The file becomes a NEW project in the chosen workspace: every row gets a
-- new id, references are rewritten to the new ids, codes (INS-012…) stay.
-- Skipped: attachments (the files are not in the export) and the activity
-- log (the restore is one fresh "create" of the project).
-- =====================================================================

-- Rewrite every string found in the id map, at any depth (for jsonb columns such as flow_nodes.data).
create or replace function public.restore_remap(p_value jsonb, p_map jsonb)
returns jsonb language sql immutable set search_path = '' as $$
  select case jsonb_typeof(p_value)
    when 'string' then coalesce(p_map -> (p_value #>> '{}'), p_value)
    when 'array' then (select coalesce(jsonb_agg(public.restore_remap(e, p_map) order by i), '[]'::jsonb)
                       from jsonb_array_elements(p_value) with ordinality as a(e, i))
    when 'object' then (select coalesce(jsonb_object_agg(k, public.restore_remap(v, p_map)), '{}'::jsonb)
                        from jsonb_each(p_value) as o(k, v))
    else p_value
  end
$$;

-- One exported row → the row to insert. Only the table's real columns are kept; workspace_id is derived by
-- the table's own trigger; project_id is always the new project. A uuid column must point to a row of this
-- same file (its new id) — a hand-made file cannot reach rows of other projects. People columns keep a
-- person only when they are a member of the target workspace.
create or replace function public.restore_row(
  p_table text, p_row jsonb, p_map jsonb, p_project uuid, p_workspace uuid
) returns jsonb language plpgsql stable set search_path = '' as $$
declare
  v_out jsonb := '{}'::jsonb;
  c record;
  v jsonb;
begin
  for c in
    select a.attname::text as name, a.atttypid = 'uuid'::regtype as is_uuid, a.atttypid = 'jsonb'::regtype as is_jsonb,
           exists (select 1 from pg_constraint f
                   where f.conrelid = a.attrelid and f.contype = 'f' and f.conkey = array[a.attnum]
                     and f.confrelid = 'public.profiles'::regclass) as is_person
    from pg_attribute a
    where a.attrelid = ('public.' || quote_ident(p_table))::regclass and a.attnum > 0 and not a.attisdropped
      and a.attidentity = '' and a.attgenerated = ''
  loop
    if c.name = 'workspace_id' or not (p_row ? c.name) then continue; end if;
    v := p_row -> c.name;
    if c.name = 'project_id' then
      v := to_jsonb(p_project);
    elsif jsonb_typeof(v) = 'null' then
      null;
    elsif c.is_person then
      if not exists (select 1 from public.workspace_members m
                     where m.workspace_id = p_workspace and m.user_id = (v #>> '{}')::uuid) then
        v := case when c.name = 'created_by' then to_jsonb(auth.uid()) else 'null'::jsonb end;
      end if;
    elsif c.is_uuid then
      if not (p_map ? (v #>> '{}')) then
        raise exception 'restore: %.% points outside the file (%)', p_table, c.name, v #>> '{}'
          using errcode = '23503';
      end if;
      v := p_map -> (v #>> '{}');
    elsif c.is_jsonb then
      v := public.restore_remap(v, p_map);
    end if;
    v_out := v_out || jsonb_build_object(c.name, v);
  end loop;
  return v_out;
end $$;

create or replace function public.restore_insert(p_table text, p_row jsonb)
returns void language plpgsql set search_path = '' as $$
declare
  v_cols text := (select string_agg(quote_ident(k), ', ') from jsonb_object_keys(p_row) as k);
begin
  execute format('insert into public.%I (%s) select %s from jsonb_populate_record(null::public.%I, $1)',
                 p_table, v_cols, v_cols, p_table) using p_row;
end $$;

create or replace function public.restore_project(p_workspace uuid, p_export jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  -- Parents before children; screens before flow nodes (a step can be a screen).
  v_tables constant text[] := array[
    'project_briefs',
    'competitors', 'comparison_features', 'competitor_feature_values',
    'research_plans', 'interview_guides', 'interview_questions', 'participants', 'interviews', 'interview_answers',
    'patterns', 'quotes', 'observations', 'insights', 'pain_points', 'opportunities',
    'screens', 'screen_states', 'user_flows', 'flow_nodes', 'flow_edges', 'flow_edge_cases',
    'design_decisions', 'trace_links', 'case_studies'];
  v_src     jsonb := p_export -> 'project';
  v_project uuid := gen_random_uuid();
  v_map     jsonb;
  v_base    text;
  v_slug    text;
  v_table   text;
  v_row     jsonb;
  v_n       int;
  v_et      record;
begin
  if not public.is_workspace_member(p_workspace, 'editor') then
    raise exception 'restore: no write access to workspace %', p_workspace using errcode = '42501';
  end if;
  if p_export ->> 'format' is distinct from 'pdw-project-export' or p_export ->> 'version' is distinct from '1'
     or jsonb_typeof(v_src) is distinct from 'object' or jsonb_typeof(p_export -> 'tables') is distinct from 'object' then
    raise exception 'restore: not a project export file' using errcode = '22023';
  end if;

  -- Old id → new id for the project and every row of the file.
  select jsonb_object_agg(old_id, gen_random_uuid()) into v_map
  from (
    select distinct r ->> 'id' as old_id
    from unnest(v_tables) as t(name), jsonb_array_elements(coalesce(p_export -> 'tables' -> t.name, '[]')) as r
    where r ->> 'id' is not null
  ) ids;
  v_map := coalesce(v_map, '{}'::jsonb) || jsonb_build_object(v_src ->> 'id', v_project);

  -- The project itself: a free slug in the workspace (name, name-2, name-3…), active, without a site request.
  v_base := coalesce(nullif(v_src ->> 'slug', ''), 'project');
  v_slug := v_base;
  v_n := 1;
  while exists (select 1 from public.projects p where p.workspace_id = p_workspace and p.slug = v_slug) loop
    v_n := v_n + 1;
    v_slug := left(v_base, 44) || '-' || v_n;
  end loop;
  insert into public.projects (id, workspace_id, name, slug, description, status, platforms, current_stage, created_by)
  values (v_project, p_workspace, v_src ->> 'name', v_slug, v_src ->> 'description',
          coalesce((v_src ->> 'status')::public.project_status, 'active'),
          coalesce((select array_agg(x) from jsonb_array_elements_text(v_src -> 'platforms') as x), '{}'),
          v_src ->> 'current_stage', auth.uid());

  foreach v_table in array v_tables loop
    -- Rows that triggers created for the new parents are replaced by the file's own.
    case v_table
      when 'project_briefs' then delete from public.project_briefs where project_id = v_project;
      when 'screen_states' then delete from public.screen_states where project_id = v_project;
      when 'flow_edge_cases' then delete from public.flow_edge_cases where project_id = v_project;
      when 'trace_links' then delete from public.trace_links where project_id = v_project;
      else null;
    end case;

    for v_row in select jsonb_array_elements(coalesce(p_export -> 'tables' -> v_table, '[]')) loop
      v_row := public.restore_row(v_table, v_row, v_map, v_project, p_workspace);
      if v_table = 'design_decisions' then
        v_row := v_row - 'superseded_by_id'; -- set below, once every decision exists
      elsif v_table = 'case_studies' then
        -- A restored case never goes live by itself; its slug is unique across the site.
        v_base := coalesce(v_row ->> 'slug', v_slug);
        v_n := 1;
        while exists (select 1 from public.case_studies c
                      where c.slug = (case when v_n = 1 then v_base else left(v_base, 44) || '-' || v_n end)) loop
          v_n := v_n + 1;
        end loop;
        v_row := v_row || jsonb_build_object(
          'slug', case when v_n = 1 then v_base else left(v_base, 44) || '-' || v_n end,
          'status', 'draft', 'published_at', null);
      end if;
      perform public.restore_insert(v_table, v_row);
    end loop;
  end loop;

  update public.design_decisions d
  set superseded_by_id = (v_map ->> (r ->> 'superseded_by_id'))::uuid
  from jsonb_array_elements(coalesce(p_export -> 'tables' -> 'design_decisions', '[]')) as r
  where d.id = (v_map ->> (r ->> 'id'))::uuid and r ->> 'superseded_by_id' is not null
    and v_map ? (r ->> 'superseded_by_id');

  -- Counters continue after the highest restored code, so the next insight is not INS-001 again.
  for v_et in select e.type, e.table_name from public.entity_types e
              where e.table_name = any (v_tables)
                and exists (select 1 from pg_attribute a where a.attrelid = ('public.' || quote_ident(e.table_name))::regclass
                              and a.attname = 'code' and not a.attisdropped)
  loop
    execute format($q$select max(nullif(regexp_replace(code, '\D', '', 'g'), '')::int)
                      from public.%I where project_id = $1$q$, v_et.table_name)
      into v_n using v_project;
    if v_n is not null then
      insert into public.project_counters as c (project_id, entity_type, last_value)
      values (v_project, v_et.type, v_n)
      on conflict (project_id, entity_type) do update set last_value = greatest(c.last_value, excluded.last_value);
    end if;
  end loop;

  -- The history shows one event: the project was created. Not hundreds of row inserts.
  delete from public.activity_log where project_id = v_project and entity_type <> 'project';

  return jsonb_build_object('project_id', v_project, 'slug', v_slug);
end $$;

revoke execute on function public.restore_remap(jsonb, jsonb) from public;
revoke execute on function public.restore_row(text, jsonb, jsonb, uuid, uuid) from public;
revoke execute on function public.restore_insert(text, jsonb) from public;
revoke execute on function public.restore_project(uuid, jsonb) from public;
grant execute on function public.restore_project(uuid, jsonb) to authenticated;
