-- Traceability: rules, same-project integrity, cleanup, graph traversal, RLS.
begin;
create extension if not exists pgtap with schema extensions;
select plan(18);

create function pg_temp.login(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;

-- Test-only entity types and tables, wired exactly like real domain tables.
insert into entity_types (type, table_name, prefix, domain, phase) values
  ('t_quote', 't_quotes', 'TQ', 'test', 99), ('t_insight', 't_insights', 'TI', 'test', 99);
insert into trace_relation_rules values
  ('t_quote', 't_insight', 'evidences'), ('t_insight', 't_insight', 'derived_from');

create table public.t_quotes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id) on delete cascade,
  project_id uuid not null references projects (id) on delete cascade,
  code text, body text, updated_at timestamptz not null default now());
create table public.t_insights (like public.t_quotes including all);
alter table public.t_insights add foreign key (workspace_id) references workspaces (id) on delete cascade;
alter table public.t_insights add foreign key (project_id) references projects (id) on delete cascade;
grant all on public.t_quotes, public.t_insights to authenticated;
select attach_domain_table('public.t_quotes', 't_quote');
select attach_domain_table('public.t_insights', 't_insight');

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'a@example.com'),
  ('00000000-0000-0000-0000-00000000000b', 'b@example.com');

select pg_temp.login('00000000-0000-0000-0000-00000000000a');
set local role authenticated;

insert into projects (id, workspace_id, name, slug)
select '20000000-0000-0000-0000-000000000001', id, 'P1', 'p1' from workspaces where owner_id = '00000000-0000-0000-0000-00000000000a';
insert into projects (id, workspace_id, name, slug)
select '20000000-0000-0000-0000-000000000002', id, 'P2', 'p2' from workspaces where owner_id = '00000000-0000-0000-0000-00000000000a';

-- workspace_id is derived, a spoofed value is ignored
insert into t_quotes (id, project_id, workspace_id, body) values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
   (select id from workspaces where owner_id = '00000000-0000-0000-0000-00000000000a'), 'Хожу в ресторан, когда есть повод');
reset role;  -- spoof attempt: point workspace_id at B's workspace (needs a real id)
select set_config('test.b_ws', (select id::text from workspaces where owner_id = '00000000-0000-0000-0000-00000000000b'), true);
set local role authenticated;
insert into t_quotes (id, project_id, workspace_id, body) values
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', current_setting('test.b_ws')::uuid, 'spoof');
insert into t_quotes (id, project_id, body) values
  ('30000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000002', 'другой проект');
insert into t_insights (id, project_id, body) values
  ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Ресторан — повод встретиться'),
  ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Выбор места — социальное решение');

select is((select code from t_quotes where id = '30000000-0000-0000-0000-000000000001'), 'TQ-001', 'domain table gets codes');
select is((select workspace_id from t_quotes where id = '30000000-0000-0000-0000-000000000002'),
  (select workspace_id from projects where id = '20000000-0000-0000-0000-000000000001'), 'spoofed workspace_id is overridden');
select is((select array_agg(code order by code) from t_insights), array['TI-001', 'TI-002'], 'codes per type');

select lives_ok($$ insert into trace_links (project_id, source_type, source_id, target_type, target_id, relation)
  values ('20000000-0000-0000-0000-000000000001', 't_quote', '30000000-0000-0000-0000-000000000001',
          't_insight', '40000000-0000-0000-0000-000000000001', 'evidences') $$, 'allowed link');
select lives_ok($$ insert into trace_links (project_id, source_type, source_id, target_type, target_id, relation)
  values ('20000000-0000-0000-0000-000000000001', 't_insight', '40000000-0000-0000-0000-000000000001',
          't_insight', '40000000-0000-0000-0000-000000000002', 'derived_from') $$, 'chain link');

select throws_ok($$ insert into trace_links (project_id, source_type, source_id, target_type, target_id, relation)
  values ('20000000-0000-0000-0000-000000000001', 't_insight', '40000000-0000-0000-0000-000000000001',
          't_quote', '30000000-0000-0000-0000-000000000001', 'evidences') $$, '23503', null, 'disallowed pair/direction rejected');
select throws_ok($$ insert into trace_links (project_id, source_type, source_id, target_type, target_id, relation)
  values ('20000000-0000-0000-0000-000000000001', 't_quote', '30000000-0000-0000-0000-000000000009',
          't_insight', '40000000-0000-0000-0000-000000000001', 'evidences') $$, '23503', null, 'cross-project link rejected');
select throws_ok($$ insert into trace_links (project_id, source_type, source_id, target_type, target_id, relation)
  values ('20000000-0000-0000-0000-000000000001', 't_quote', gen_random_uuid(),
          't_insight', '40000000-0000-0000-0000-000000000001', 'evidences') $$, '23503', null, 'dangling id rejected');

-- graph
select is((select count(*)::int from trace_graph('t_insight', '40000000-0000-0000-0000-000000000002', 'up')), 2, 'walks up two levels');
select is((select max(depth) from trace_graph('t_insight', '40000000-0000-0000-0000-000000000002', 'up')), 2, 'depth reported');
select is((select count(*)::int from trace_graph('t_quote', '30000000-0000-0000-0000-000000000001', 'down')), 2, 'walks down');

-- cycle safety
insert into trace_links (project_id, source_type, source_id, target_type, target_id, relation)
values ('20000000-0000-0000-0000-000000000001', 't_insight', '40000000-0000-0000-0000-000000000002',
        't_insight', '40000000-0000-0000-0000-000000000001', 'derived_from');
select lives_ok($$ select count(*) from trace_graph('t_quote', '30000000-0000-0000-0000-000000000001') $$, 'cycles terminate');

-- RLS for outsider
select pg_temp.login('00000000-0000-0000-0000-00000000000b');
select is((select count(*)::int from trace_links), 0, 'outsider sees no links');
select is((select count(*)::int from trace_graph('t_quote', '30000000-0000-0000-0000-000000000001')), 0, 'outsider graph is empty');
select is((select count(*)::int from t_quotes), 0, 'outsider sees no domain rows');

-- cleanup on delete
select pg_temp.login('00000000-0000-0000-0000-00000000000a');
delete from t_quotes where id = '30000000-0000-0000-0000-000000000001';
select is((select count(*)::int from trace_links where source_type = 't_quote'), 0, 'links removed with entity');
select ok(exists (select 1 from activity_log where entity_type = 't_insight' and action = 'unlink'), 'unlink logged');
select lives_ok($$ delete from projects where id = '20000000-0000-0000-0000-000000000001' $$, 'project with linked entities deletes cleanly');

reset role;
select * from finish();
rollback;
