-- Site profile: the owner writes it, nobody else does; visitors get only the site's profile, via site_profile().
begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

create function pg_temp.login(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'anna@example.com'),
  ('00000000-0000-0000-0000-00000000000b', 'boris@example.com'),
  ('00000000-0000-0000-0000-00000000000c', 'chris@example.com');

select pg_temp.login('00000000-0000-0000-0000-00000000000a');
set local role authenticated;
insert into workspaces (id, name, slug, owner_id)
values ('10000000-0000-0000-0000-000000000001', 'Сайт', 'site-a', '00000000-0000-0000-0000-00000000000a');
insert into workspace_members (workspace_id, user_id, role)
values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000c', 'editor');

select pg_temp.login('00000000-0000-0000-0000-00000000000b');
insert into workspaces (id, name, slug, owner_id)
values ('10000000-0000-0000-0000-000000000002', 'Інший', 'other-b', '00000000-0000-0000-0000-00000000000b');
reset role;

-- The site is run by Anna's workspace (the request form delivers there).
insert into intake_settings (workspace_id) values ('10000000-0000-0000-0000-000000000001');

select pg_temp.login('00000000-0000-0000-0000-00000000000a');
set local role authenticated;
select lives_ok($$ insert into site_profile (workspace_id, content)
  values ('10000000-0000-0000-0000-000000000001', '{"uk": {"summary": "Привіт"}}') $$, 'owner creates the profile');
select lives_ok($$ update site_profile set content = '{"uk": {"summary": "Оновлено"}}'
  where workspace_id = '10000000-0000-0000-0000-000000000001' $$, 'owner updates the profile');

-- An editor of the same workspace cannot see or change it.
select pg_temp.login('00000000-0000-0000-0000-00000000000c');
select is((select count(*)::int from site_profile), 0, 'editor does not read the profile');
update site_profile set content = '{"uk": {"summary": "Зламано"}}' where workspace_id = '10000000-0000-0000-0000-000000000001';

-- Another user writes a profile for their own workspace: allowed, but it is not the site's.
select pg_temp.login('00000000-0000-0000-0000-00000000000b');
select lives_ok($$ insert into site_profile (workspace_id, content)
  values ('10000000-0000-0000-0000-000000000002', '{"uk": {"summary": "Чужий"}}') $$, 'any owner writes a profile of their own workspace');
select throws_ok($$ insert into site_profile (workspace_id, content)
  values ('10000000-0000-0000-0000-000000000001', '{}') $$, '42501', null, 'nobody writes the profile of a workspace they do not own');
select is((select count(*)::int from site_profile where workspace_id = '10000000-0000-0000-0000-000000000001'), 0,
  'another user does not read it');
reset role;

-- Visitors: no table access, only the site's profile through the function.
set local role anon;
select throws_ok($$ select * from site_profile $$, '42501', null, 'visitors cannot read the table');
select is(site_profile() -> 'uk' ->> 'summary', 'Оновлено', 'visitors get the site''s profile; the editor''s write did not land');
reset role;
select throws_ok($$ update site_profile set content = '[]' where workspace_id = '10000000-0000-0000-0000-000000000001' $$,
  '23514', null, 'content must be an object');

select * from finish();
rollback;
