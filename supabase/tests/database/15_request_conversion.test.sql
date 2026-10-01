-- Request → project: one transaction, client input marked, the request becomes «converted» and stays as history.
begin;
create extension if not exists pgtap with schema extensions;
select plan(16);

create function pg_temp.login(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'anna@example.com'),
  ('00000000-0000-0000-0000-00000000000c', 'viktor@example.com');
insert into workspaces (id, name, slug, owner_id) values
  ('10000000-0000-0000-0000-000000000001', 'Студія', 'studio-conv', '00000000-0000-0000-0000-00000000000a');
insert into workspace_members (workspace_id, user_id, role) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000c', 'viewer');
-- Independent of the database's own settings (rolled back at the end).
delete from intake_settings;
insert into private.intake_secret (secret_hash) values (encode(sha256(convert_to('s3cret', 'UTF8')), 'hex'))
  on conflict (id) do update set secret_hash = excluded.secret_hash;
insert into intake_settings (workspace_id) values ('10000000-0000-0000-0000-000000000001');
-- A project already uses the slug the request will ask for.
insert into projects (workspace_id, name, slug) values ('10000000-0000-0000-0000-000000000001', 'Old', 'stefa-books');

select set_config('request.jwt.claims', '{"role": "anon"}', true);
set local role anon;
create temp table r as select submit_project_request(jsonb_build_object(
  'locale', 'uk',
  'client', jsonb_build_object('name', 'Олена', 'email', 'olena@example.com'),
  'project', jsonb_build_object('types', jsonb_build_array('redesign'), 'name', 'Stefa Books'),
  'about', jsonb_build_object('summary', 'Онлайн-бібліотека', 'problem', 'Складно обрати книжку'),
  'competitors', jsonb_build_array(jsonb_build_object('name', 'Yakaboo', 'url', 'https://yakaboo.ua', 'likes', 'Каталог', 'dislikes', 'Пошук')),
  'timeline', jsonb_build_object('has_deadline', true, 'deadline_date', '2026-12-01'),
  'consent', jsonb_build_object('given', true)), 's3cret', repeat('a', 64), gen_random_uuid()) as res;
reset role;
create temp table req as select id from project_requests
  where code = (select res ->> 'code' from r) and workspace_id = '10000000-0000-0000-0000-000000000001';
grant select on r, req to authenticated;

-- A viewer cannot convert.
select pg_temp.login('00000000-0000-0000-0000-00000000000c');
set local role authenticated;
select throws_ok($$ select convert_project_request((select id from req), 'Stefa Books', 'stefa-books', '{web}',
  '{"problem": "Складно обрати книжку"}') $$, '42501', null, 'a viewer cannot convert');
reset role;

-- The owner converts.
select pg_temp.login('00000000-0000-0000-0000-00000000000a');
set local role authenticated;
select is(convert_project_request((select id from req), 'Stefa Books', 'stefa-books', '{web}',
  '{"problem": "Складно обрати книжку", "product_description": "Онлайн-бібліотека", "goals": ["Зробити зручнішим"]}'),
  'stefa-books-2', 'the slug gets -2 when taken');
select is((select source_request_id from projects where slug = 'stefa-books-2'), (select id from req), 'the project points to its request');
select is((select problem from project_briefs b join projects p on p.id = b.project_id where p.slug = 'stefa-books-2'),
  'Складно обрати книжку', 'the brief is filled');
select is((select client_input ->> 'problem' from project_briefs b join projects p on p.id = b.project_id where p.slug = 'stefa-books-2'),
  'Складно обрати книжку', 'the client wording is kept as client input');
select is((select client_input ->> 'request_code' from project_briefs b join projects p on p.id = b.project_id where p.slug = 'stefa-books-2'),
  (select res ->> 'code' from r), 'client input names the request');
select is((select goals from project_briefs b join projects p on p.id = b.project_id where p.slug = 'stefa-books-2'),
  '["Зробити зручнішим"]'::jsonb, 'goals are copied');
select is((select timeline_end from project_briefs b join projects p on p.id = b.project_id where p.slug = 'stefa-books-2'),
  '2026-12-01'::date, 'the deadline becomes the timeline end');
select is((select c.origin || ':' || c.name || ':' || c.strengths || ':' || c.weaknesses from competitors c join projects p on p.id = c.project_id where p.slug = 'stefa-books-2'),
  'client:Yakaboo:Каталог:Пошук', 'competitors come over marked as client input');
select is((select status::text from project_requests where id = (select id from req)), 'converted', 'the request is converted');
select hasnt_column('public', 'projects', 'budget_min', 'budget is not copied into the project');

select throws_ok($$ select convert_project_request((select id from req), 'Again', 'again', '{}', '{}') $$,
  '23505', null, 'a request converts once');
select throws_ok($$ delete from project_requests where id = (select id from req) $$,
  '42501', null, 'a converted request cannot be deleted');
select lives_ok($$ update project_requests set archived_at = now() where id = (select id from req) $$,
  'but it can be archived');

-- Deleting a request that did not become a project removes everything it owns.
reset role;
select set_config('request.jwt.claims', '{"role": "anon"}', true);
set local role anon;
create temp table r2 as select submit_project_request(jsonb_build_object(
  'locale', 'en', 'client', jsonb_build_object('name', 'Max', 'email', 'max@example.com'),
  'project', jsonb_build_object('types', jsonb_build_array('website'), 'name_unknown', true),
  'about', jsonb_build_object('summary', 'Landing'),
  'competitors', jsonb_build_array(jsonb_build_object('name', 'A')),
  'references', jsonb_build_array(jsonb_build_object('url', 'https://a.example')),
  'consent', jsonb_build_object('given', true)), 's3cret', repeat('b', 64), gen_random_uuid()) as res;
reset role;
create temp table req2 as select id from project_requests
  where code = (select res ->> 'code' from r2) and workspace_id = '10000000-0000-0000-0000-000000000001';
grant select on r2, req2 to authenticated;
select pg_temp.login('00000000-0000-0000-0000-00000000000a');
set local role authenticated;
select lives_ok($$ delete from project_requests where id = (select id from req2) $$, 'the owner deletes a request');
reset role;
select is((select count(*) from project_request_competitors where request_id = (select id from req2))
        + (select count(*) from project_request_references where request_id = (select id from req2))
        + (select count(*) from project_request_documents where request_id = (select id from req2)), 0::bigint,
  'its competitors, references and documents go with it');

select * from finish();
rollback;
