-- restore_project: an export file comes back as a new project with every row, link and code;
-- counters continue; the file cannot reach other projects; only editors of the workspace can restore.
begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

create function pg_temp.login(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;

-- The same shape as src/domains/projects/export.ts builds: { format, version, project, tables }.
create function pg_temp.export(p uuid) returns jsonb language plpgsql as $$
declare
  v_tables jsonb := '{}';
  t text;
  v jsonb;
begin
  foreach t in array array['project_briefs', 'competitors', 'comparison_features', 'competitor_feature_values',
    'research_plans', 'interview_guides', 'interview_questions', 'participants', 'interviews', 'interview_answers',
    'quotes', 'observations', 'patterns', 'insights', 'pain_points', 'opportunities',
    'user_flows', 'flow_nodes', 'flow_edges', 'flow_edge_cases', 'screens', 'screen_states', 'design_decisions',
    'trace_links', 'attachments', 'case_studies', 'activity_log'] loop
    execute format('select coalesce(jsonb_agg(to_jsonb(x)), ''[]'') from public.%I x where project_id = $1', t)
      into v using p;
    v_tables := v_tables || jsonb_build_object(t, v);
  end loop;
  return jsonb_build_object('format', 'pdw-project-export', 'version', 1,
    'project', (select to_jsonb(p2) from public.projects p2 where id = p), 'tables', v_tables);
end $$;

-- Row counts of every restored table, to compare the copy with the original.
create function pg_temp.counts(p uuid) returns jsonb language plpgsql as $$
declare
  v_out jsonb := '{}';
  t text;
  n int;
begin
  foreach t in array array['project_briefs', 'competitors', 'comparison_features', 'competitor_feature_values',
    'research_plans', 'interview_guides', 'interview_questions', 'participants', 'interviews', 'interview_answers',
    'quotes', 'observations', 'patterns', 'insights', 'pain_points', 'opportunities',
    'user_flows', 'flow_nodes', 'flow_edges', 'flow_edge_cases', 'screens', 'screen_states', 'design_decisions',
    'trace_links', 'case_studies'] loop
    execute format('select count(*)::int from public.%I where project_id = $1', t) into n using p;
    v_out := v_out || jsonb_build_object(t, n);
  end loop;
  return v_out;
end $$;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'anna@example.com'),
  ('00000000-0000-0000-0000-00000000000b', 'bob@example.com');
select pg_temp.login('00000000-0000-0000-0000-00000000000a');
set local role authenticated;

insert into workspaces (id, name, slug, owner_id)
values ('10000000-0000-0000-0000-000000000001', 'Студия', 'studio-a', '00000000-0000-0000-0000-00000000000a');
select open_demo_project('10000000-0000-0000-0000-000000000001');

reset role;
create temp table src as
  select id, pg_temp.export(id) as file from projects where slug = 'restaurant-app';
grant select on src to authenticated;
set local role authenticated;

create temp table restored as
  select restore_project('10000000-0000-0000-0000-000000000001', (select file from src)) as r;

select is((select r ->> 'slug' from restored), 'restaurant-app-2', 'the copy gets a free slug next to the original');

reset role;
select is(pg_temp.counts((select (r ->> 'project_id')::uuid from restored)), pg_temp.counts((select id from src)),
  'every table has as many rows as the original');
select is(
  (select array_agg(code || ' ' || statement order by code) from insights
   where project_id = (select (r ->> 'project_id')::uuid from restored)),
  (select array_agg(code || ' ' || statement order by code) from insights where project_id = (select id from src)),
  'codes and texts are kept');
select is(
  (select array_agg(code || ' ' || status::text order by code) from design_decisions
   where project_id = (select (r ->> 'project_id')::uuid from restored)),
  (select array_agg(code || ' ' || status::text order by code) from design_decisions
   where project_id = (select id from src)),
  'decisions keep their status');
select is(
  (select count(*)::int from trace_links t
   where t.project_id = (select (r ->> 'project_id')::uuid from restored)
     and (t.source_id in (select id from insights where project_id = (select id from src))
       or t.target_id in (select id from insights where project_id = (select id from src)))),
  0, 'links point to the copy''s own rows, not to the original');
select is(
  (select count(*)::int from activity_log
   where project_id = (select (r ->> 'project_id')::uuid from restored) and entity_type <> 'project'),
  0, 'the history shows the restore as one event');
set local role authenticated;

select is(next_code((select (r ->> 'project_id')::uuid from restored), 'insight'),
  'INS-' || lpad(((select count(*) from insights where project_id = (select id from src)) + 1)::text, 3, '0'),
  'codes continue after the restored ones');

select throws_ok(
  $$ select restore_project('10000000-0000-0000-0000-000000000001', '{"format": "something-else"}') $$,
  '22023', null, 'a file that is not an export is refused');

select throws_ok(
  $$ select restore_project('10000000-0000-0000-0000-000000000001',
       jsonb_set((select file from src), '{tables,quotes,0,interview_id}', '"30000000-0000-0000-0000-000000000001"')) $$,
  '23503', null, 'a row pointing outside the file is refused');

select is((select count(*)::int from projects where workspace_id = '10000000-0000-0000-0000-000000000001'), 2,
  'a refused file leaves nothing behind');

select pg_temp.login('00000000-0000-0000-0000-00000000000b');
select throws_ok(
  $$ select restore_project('10000000-0000-0000-0000-000000000001', (select file from src)) $$,
  '42501', null, 'a non-member cannot restore into someone else''s workspace');

select ok(not has_function_privilege('anon', 'public.restore_project(uuid, jsonb)', 'execute'),
  'a guest cannot call restore_project');
select ok(not has_function_privilege('authenticated', 'public.restore_insert(text, jsonb)', 'execute'),
  'the helpers are not callable directly');

select * from finish();
rollback;
