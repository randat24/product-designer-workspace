-- Project brief: created with the project, RLS by role, activity; demo project.
begin;
create extension if not exists pgtap with schema extensions;
select plan(16);

create function pg_temp.login(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'anna@example.com'),
  ('00000000-0000-0000-0000-00000000000b', 'bob@example.com'),
  ('00000000-0000-0000-0000-00000000000c', 'chris@example.com');

select pg_temp.login('00000000-0000-0000-0000-00000000000a');
set local role authenticated;

insert into workspaces (id, name, slug, owner_id)
values ('10000000-0000-0000-0000-000000000001', 'Студия', 'studio-a', '00000000-0000-0000-0000-00000000000a');
insert into workspace_members (workspace_id, user_id, role)
values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000c', 'viewer');
insert into projects (id, workspace_id, name, slug)
values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'P1', 'p1');

select is((select count(*)::int from project_briefs where project_id = '20000000-0000-0000-0000-000000000001'), 1,
  'brief is created with the project');
select is((select workspace_id from project_briefs where project_id = '20000000-0000-0000-0000-000000000001'),
  '10000000-0000-0000-0000-000000000001'::uuid, 'brief inherits workspace_id');
select throws_ok($$ insert into project_briefs (project_id) values ('20000000-0000-0000-0000-000000000001') $$,
  '42501', null, 'briefs cannot be inserted directly');

select lives_ok($$ update project_briefs set problem = 'Долго выбирать', goals = '["Быстрее"]'
  where project_id = '20000000-0000-0000-0000-000000000001' $$, 'editor can update the brief');
select is((select updated_by from project_briefs where project_id = '20000000-0000-0000-0000-000000000001'),
  '00000000-0000-0000-0000-00000000000a'::uuid, 'updated_by is set');
select is((select changed_keys from activity_log where entity_type = 'project_brief' order by id desc limit 1),
  array['goals', 'problem'], 'brief update is logged with changed keys');
select throws_ok($$ update project_briefs set goals = '{"a": 1}' where project_id = '20000000-0000-0000-0000-000000000001' $$,
  '23514', null, 'list fields must be JSON arrays');
select throws_ok($$ update project_briefs set timeline_start = '2026-10-01', timeline_end = '2026-09-01'
  where project_id = '20000000-0000-0000-0000-000000000001' $$, '23514', null, 'timeline end cannot precede start');

-- viewer: reads, cannot write
select pg_temp.login('00000000-0000-0000-0000-00000000000c');
select is((select problem from project_briefs where project_id = '20000000-0000-0000-0000-000000000001'), 'Долго выбирать',
  'viewer reads the brief');
update project_briefs set problem = 'hacked' where project_id = '20000000-0000-0000-0000-000000000001';
select is((select problem from project_briefs where project_id = '20000000-0000-0000-0000-000000000001'), 'Долго выбирать',
  'viewer update changes nothing');
select throws_ok($$ select create_demo_project('10000000-0000-0000-0000-000000000001') $$, '42501', null,
  'viewer cannot create the demo project');

-- outsider
select pg_temp.login('00000000-0000-0000-0000-00000000000b');
select is((select count(*)::int from project_briefs), 0, 'outsider sees no briefs');

-- demo project
select pg_temp.login('00000000-0000-0000-0000-00000000000a');
select is(create_demo_project('10000000-0000-0000-0000-000000000001'), 'restaurant-app', 'demo project created');
select is(create_demo_project('10000000-0000-0000-0000-000000000001'), 'restaurant-app-2', 'second demo gets a free slug');
select is((select jsonb_array_length(b.goals) from project_briefs b join projects p on p.id = b.project_id
           where p.slug = 'restaurant-app'), 3, 'demo brief is filled');

-- deleting the project removes its brief
reset role;
delete from projects where id = '20000000-0000-0000-0000-000000000001';
select is((select count(*)::int from project_briefs where project_id = '20000000-0000-0000-0000-000000000001'), 0,
  'brief is deleted with its project');

select * from finish();
rollback;
