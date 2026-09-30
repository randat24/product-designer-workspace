-- Screens and Decision Log: default states, integrity, supersede, stats, RLS, demo.
begin;
create extension if not exists pgtap with schema extensions;
select plan(16);

create function pg_temp.login(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'anna@example.com'),
  ('00000000-0000-0000-0000-00000000000b', 'bob@example.com');

select pg_temp.login('00000000-0000-0000-0000-00000000000a');
set local role authenticated;

insert into workspaces (id, name, slug, owner_id)
values ('10000000-0000-0000-0000-000000000001', 'Студия', 'studio-a', '00000000-0000-0000-0000-00000000000a');
insert into projects (id, workspace_id, name, slug) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'P1', 'p1'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'P2', 'p2');

-- screens and their default states
insert into screens (id, project_id, name) values
  ('60000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Карта');
select is((select string_agg(kind::text, ',' order by position) from screen_states where screen_id = '60000000-0000-0000-0000-000000000001'),
  'default,loading,empty,error,success', 'a new screen gets 5 standard states');
select is((select missing_states from screen_stats('20000000-0000-0000-0000-000000000001')), 3,
  'loading, empty and error are missing at first');
insert into screen_states (project_id, screen_id, kind) values
  ('20000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000001', 'offline');
select is((select project_id from screen_states where kind = 'offline'), '20000000-0000-0000-0000-000000000001'::uuid,
  'a state takes the screen''s project');
select throws_ok($$ insert into screen_states (project_id, screen_id, kind) values
  ('20000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', 'loading') $$,
  '23505', null, 'one state of each kind per screen');
update screen_states set status = 'designed' where screen_id = '60000000-0000-0000-0000-000000000001' and kind in ('loading', 'empty');
update screen_states set status = 'n_a' where screen_id = '60000000-0000-0000-0000-000000000001' and kind = 'error';
select is((select missing_states from screen_stats('20000000-0000-0000-0000-000000000001')), 0, 'designed / not needed states are not missing');

-- decisions
insert into design_decisions (id, project_id, title) values
  ('61000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Фильтр по поводу'),
  ('61000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Подборки поводов'),
  ('61000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', 'Чужое решение');
select is((select string_agg(code, ',' order by code) from design_decisions where project_id = '20000000-0000-0000-0000-000000000001'),
  'DEC-001,DEC-002', 'decisions get DEC-001, DEC-002');
select is((select author_id from design_decisions where id = '61000000-0000-0000-0000-000000000001'),
  '00000000-0000-0000-0000-00000000000a'::uuid, 'author is the current user');

update design_decisions set superseded_by_id = '61000000-0000-0000-0000-000000000002' where id = '61000000-0000-0000-0000-000000000001';
select is((select status::text from design_decisions where id = '61000000-0000-0000-0000-000000000001'), 'superseded',
  'pointing to a replacement marks the decision superseded');
update design_decisions set superseded_by_id = null where id = '61000000-0000-0000-0000-000000000001';
select is((select status::text from design_decisions where id = '61000000-0000-0000-0000-000000000001'), 'accepted',
  'clearing the replacement brings it back to accepted');
select throws_ok($$ update design_decisions set superseded_by_id = '61000000-0000-0000-0000-000000000003'
  where id = '61000000-0000-0000-0000-000000000001' $$, '23503', null, 'a decision from another project cannot supersede');
select throws_ok($$ update design_decisions set superseded_by_id = id where id = '61000000-0000-0000-0000-000000000002' $$,
  '23503', null, 'a decision cannot supersede itself');

-- evidence and targets
insert into insights (id, project_id, title) values ('62000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Повод');
insert into trace_links (project_id, source_type, source_id, target_type, target_id, relation) values
  ('20000000-0000-0000-0000-000000000001', 'insight', '62000000-0000-0000-0000-000000000001', 'design_decision', '61000000-0000-0000-0000-000000000002', 'justifies'),
  ('20000000-0000-0000-0000-000000000001', 'design_decision', '61000000-0000-0000-0000-000000000002', 'screen', '60000000-0000-0000-0000-000000000001', 'implements');
select is((select evidence || '/' || targets from decision_stats('20000000-0000-0000-0000-000000000001')
           where decision_id = '61000000-0000-0000-0000-000000000002'), '1/1', 'decision_stats counts evidence and screens');
select is((select decisions from screen_stats('20000000-0000-0000-0000-000000000001')), 1, 'screen_stats counts decisions behind the screen');

-- RLS
select pg_temp.login('00000000-0000-0000-0000-00000000000b');
select is((select count(*)::int from design_decisions) + (select count(*)::int from screen_states), 0, 'outsider sees no decisions or states');
select pg_temp.login('00000000-0000-0000-0000-00000000000a');

-- demo
create temp table demo as select create_demo_project('10000000-0000-0000-0000-000000000001') as slug;
create temp table demo_p as select id from projects where slug = (select slug from demo) and workspace_id = '10000000-0000-0000-0000-000000000001';
select is((select code || ' ' || status || ' ' || jsonb_array_length(alternatives) from design_decisions where project_id = (select id from demo_p)),
  'DEC-001 accepted 2', 'demo decision DEC-001 with 2 alternatives');
select is((select evidence || '/' || targets from decision_stats((select id from demo_p))), '3/1',
  'demo decision is justified by 3 research entities and implements a screen');

select * from finish();
rollback;
