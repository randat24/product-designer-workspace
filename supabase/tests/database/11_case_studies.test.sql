-- Case studies: one per project, anon reads published only, published_at follows the status.
begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

create function pg_temp.login(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'anna@example.com'),
  ('00000000-0000-0000-0000-00000000000b', 'boris@example.com');

select pg_temp.login('00000000-0000-0000-0000-00000000000a');
set local role authenticated;

insert into workspaces (id, name, slug, owner_id)
values ('10000000-0000-0000-0000-000000000001', 'Студія', 'studio-a', '00000000-0000-0000-0000-00000000000a');
insert into projects (id, workspace_id, name, slug) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'P1', 'p1'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'P2', 'p2');

insert into case_studies (project_id, slug, status, content)
values ('20000000-0000-0000-0000-000000000001', 'test-case-published', 'published', '{"uk": {"title": "Бронь"}}');
insert into case_studies (project_id, slug) values ('20000000-0000-0000-0000-000000000002', 'test-case-draft');

select is((select workspace_id from case_studies where slug = 'test-case-published'),
  '10000000-0000-0000-0000-000000000001'::uuid, 'workspace is derived from the project');
select isnt((select published_at from case_studies where slug = 'test-case-published'), null,
  'published_at is set on publish');
select is((select published_at from case_studies where slug = 'test-case-draft'), null, 'drafts have no published_at');

select throws_ok($$ insert into case_studies (project_id, slug) values ('20000000-0000-0000-0000-000000000001', 'another') $$,
  '23505', null, 'one case per project');
select throws_ok($$ update case_studies set slug = 'test-case-published' where slug = 'test-case-draft' $$,
  '23505', null, 'slug is unique across the site');

update case_studies set status = 'review' where slug = 'test-case-published';
select is((select published_at from case_studies where slug = 'test-case-published'), null,
  'taking a case down clears published_at');
update case_studies set status = 'published' where slug = 'test-case-published';

-- Another user sees nothing and cannot change it.
select pg_temp.login('00000000-0000-0000-0000-00000000000b');
select is((select count(*)::int from case_studies), 0, 'non-members do not see cases in the tool');
update case_studies set status = 'draft' where slug = 'test-case-published';

-- Site visitors: published only, read-only.
reset role;
set local role anon;
select set_config('request.jwt.claims', '', true);
select results_eq($$ select slug from case_studies where slug like 'test-case-%' $$, array['test-case-published'], 'anon sees published cases only');
select is((select content #>> '{uk,title}' from case_studies where slug = 'test-case-published'), 'Бронь', 'anon reads the published snapshot');
select throws_ok($$ insert into case_studies (project_id, slug) values ('20000000-0000-0000-0000-000000000002', 'x-y') $$,
  '42501', null, 'anon cannot write');

select * from finish();
rollback;
