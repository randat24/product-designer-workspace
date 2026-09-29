-- Core: personal workspace bootstrap, membership roles, RLS, codes, activity.
begin;
create extension if not exists pgtap with schema extensions;
select plan(21);

create function pg_temp.login(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'anna.designer@example.com', '{"full_name":"Анна"}'),
  ('00000000-0000-0000-0000-00000000000b', 'bob@example.com', '{}'),
  ('00000000-0000-0000-0000-00000000000c', 'chris@example.com', '{}');

-- bootstrap
select is((select full_name from profiles where id = '00000000-0000-0000-0000-00000000000a'), 'Анна', 'profile created from metadata');
select is((select count(*)::int from workspaces where owner_id = '00000000-0000-0000-0000-00000000000a' and is_personal), 1, 'personal workspace created');
select is((select role::text from workspace_members m join workspaces w on w.id = m.workspace_id
           where w.owner_id = '00000000-0000-0000-0000-00000000000a'), 'owner', 'creator is owner of personal workspace');
select matches((select slug from workspaces where owner_id = '00000000-0000-0000-0000-00000000000a'), '^anna-designer-[0-9a-f]{6}$', 'slug derived from email');

-- A creates a team workspace and a project
select pg_temp.login('00000000-0000-0000-0000-00000000000a');
set local role authenticated;

select lives_ok($$ insert into workspaces (id, name, slug, owner_id)
  values ('10000000-0000-0000-0000-000000000001', 'Студия', 'studio-a', '00000000-0000-0000-0000-00000000000a') $$,
  'user can create a team workspace');
select throws_ok($$ insert into workspaces (name, slug, owner_id, is_personal)
  values ('X', 'x-personal', '00000000-0000-0000-0000-00000000000a', true) $$,
  '42501', null, 'user cannot create extra personal workspaces');
select lives_ok($$ insert into projects (id, workspace_id, name, slug)
  values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Restaurant App', 'restaurant-app') $$,
  'owner can create a project');

select is(next_code('20000000-0000-0000-0000-000000000001', 'insight'), 'INS-001', 'first insight code');
select is(next_code('20000000-0000-0000-0000-000000000001', 'insight'), 'INS-002', 'codes increment');
select is(next_code('20000000-0000-0000-0000-000000000001', 'participant'), 'P01', 'participant code format');

-- A invites C as viewer
select lives_ok($$ insert into workspace_members (workspace_id, user_id, role)
  values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000c', 'viewer') $$,
  'owner can add a member');

-- B: outsider
select pg_temp.login('00000000-0000-0000-0000-00000000000b');
select is((select count(*)::int from projects), 0, 'outsider sees no projects');
select is((select count(*)::int from workspaces where slug = 'studio-a'), 0, 'outsider cannot see the workspace');
select throws_ok($$ insert into projects (workspace_id, name, slug)
  values ('10000000-0000-0000-0000-000000000001', 'Hack', 'hack') $$, '42501', null, 'outsider cannot create projects');
select throws_ok($$ select next_code('20000000-0000-0000-0000-000000000001', 'insight') $$, '42501', null,
  'outsider cannot draw codes');
select throws_ok($$ insert into workspaces (name, slug, owner_id)
  values ('Fake', 'fake-ws', '00000000-0000-0000-0000-00000000000a') $$, '42501', null, 'cannot create workspace for someone else');

-- C: viewer
select pg_temp.login('00000000-0000-0000-0000-00000000000c');
select is((select count(*)::int from projects), 1, 'viewer sees the project');
select throws_ok($$ insert into projects (workspace_id, name, slug)
  values ('10000000-0000-0000-0000-000000000001', 'Nope', 'nope') $$, '42501', null, 'viewer cannot create projects');
update projects set name = 'Renamed' where id = '20000000-0000-0000-0000-000000000001';
select is((select name from projects where id = '20000000-0000-0000-0000-000000000001'), 'Restaurant App', 'viewer cannot rename');

-- activity
select pg_temp.login('00000000-0000-0000-0000-00000000000a');
update projects set description = 'Поиск ресторанов' where id = '20000000-0000-0000-0000-000000000001';
select is((select array_agg(action order by id) from activity_log where entity_id = '20000000-0000-0000-0000-000000000001'),
  array['create', 'update'], 'project activity logged');
select is((select changed_keys from activity_log where entity_id = '20000000-0000-0000-0000-000000000001' and action = 'update'),
  array['description'], 'changed keys recorded');

reset role;
select * from finish();
rollback;
