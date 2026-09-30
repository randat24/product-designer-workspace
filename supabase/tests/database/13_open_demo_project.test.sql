-- open_demo_project: a repeated call within 30 s returns the same demo; outsiders cannot call it.
begin;
create extension if not exists pgtap with schema extensions;
select plan(4);

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

select is(open_demo_project('10000000-0000-0000-0000-000000000001'), 'restaurant-app', 'the first call creates the demo');
select is(open_demo_project('10000000-0000-0000-0000-000000000001'), 'restaurant-app', 'a repeated call opens the same demo');
select is((select count(*)::int from projects where workspace_id = '10000000-0000-0000-0000-000000000001'), 1,
  'no second copy is created');

select pg_temp.login('00000000-0000-0000-0000-00000000000b');
select throws_ok($$ select open_demo_project('10000000-0000-0000-0000-000000000001') $$, '42501', null,
  'a non-member cannot open the demo in someone else''s workspace');

select * from finish();
rollback;
