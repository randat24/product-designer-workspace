-- Client project intake: the public function needs the server secret, validates and rate-limits,
-- anon reads nothing, members read their workspace only, client answers and documents are read-only.
begin;
create extension if not exists pgtap with schema extensions;
select plan(32);

create function pg_temp.login(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;
create function pg_temp.anon() returns void language sql as $$
  select set_config('request.jwt.claims', '{"role": "anon"}', true);
$$;
-- A valid payload; tests override parts of it.
create function pg_temp.payload(p_patch jsonb default '{}') returns jsonb language sql as $$
  select jsonb_build_object(
    'locale', 'uk', 'form_version', 1,
    'client', jsonb_build_object('name', 'Олена', 'email', 'Olena@Example.com', 'preferred_channel', 'telegram', 'telegram', '@olena'),
    'project', jsonb_build_object('types', jsonb_build_array('redesign', 'web_app'), 'name', 'Stefa Books'),
    'existing', jsonb_build_object('has', true, 'url', 'https://stefa.example', 'dislikes', 'Повільний пошук',
                                   'links', jsonb_build_array(jsonb_build_object('kind', 'figma', 'url', 'https://www.figma.com/design/abc/x'))),
    'about', jsonb_build_object('summary', 'Онлайн-бібліотека з підпискою', 'problem', 'Люди не знаходять книжки', 'goals', jsonb_build_array('improve_usability')),
    'audience', jsonb_build_object('audience', 'Батьки дітей 3–10 років', 'market', 'b2c'),
    'competitors', jsonb_build_array(jsonb_build_object('name', 'Yakaboo', 'url', 'https://yakaboo.ua', 'likes', 'Каталог')),
    'references', jsonb_build_array(jsonb_build_object('url', 'https://linear.app', 'note', 'Чистота')),
    'scope', jsonb_build_object('items', jsonb_build_array('ux_design', 'ui_design'), 'needs_advice', false),
    'materials', jsonb_build_object('items', jsonb_build_array('existing_website')),
    'budget', jsonb_build_object('range', 'usd_2500_5000', 'min', 2500, 'max', 5000, 'currency', 'USD'),
    'timeline', jsonb_build_object('start', 'month', 'has_deadline', true, 'deadline_date', '2026-12-01', 'deadline_reason', 'Запуск'),
    'consent', jsonb_build_object('given', true)
  ) || p_patch
$$;
create function pg_temp.ip(n int) returns text language sql as $$ select lpad(n::text, 64, '0') $$;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'anna@example.com'),
  ('00000000-0000-0000-0000-00000000000b', 'boris@example.com');
insert into workspaces (id, name, slug, owner_id) values
  ('10000000-0000-0000-0000-000000000001', 'Студія', 'studio-intake-a', '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-000000000002', 'Інша', 'studio-intake-b', '00000000-0000-0000-0000-00000000000b');

-- 1. Without the secret nothing happens; with it but no receiving workspace — disabled.
select pg_temp.anon();
set local role anon;
select throws_ok($$ select submit_project_request(pg_temp.payload(), 'wrong', pg_temp.ip(1), gen_random_uuid()) $$,
  '42501', 'forbidden', 'a wrong secret is refused');
reset role;
insert into private.intake_secret (secret_hash) values (encode(sha256(convert_to('s3cret', 'UTF8')), 'hex'));
set local role anon;
select throws_ok($$ select submit_project_request(pg_temp.payload(), 's3cret', pg_temp.ip(1), gen_random_uuid()) $$,
  '42501', 'intake_disabled', 'no receiving workspace: the form is off');
reset role;
insert into intake_settings (workspace_id) values ('10000000-0000-0000-0000-000000000001');

-- 2. A valid submission: code, token, client, children, brief v1.
set local role anon;
create temp table r1 as select submit_project_request(pg_temp.payload(), 's3cret', pg_temp.ip(1),
  'a0000000-0000-0000-0000-000000000001') as res;
select matches((select res ->> 'code' from r1), '^REQ-[0-9]{4}-0001$', 'the first request gets number 0001');
select matches((select res ->> 'token' from r1), '^[0-9a-f]{64}$', 'a 64-hex client token is returned');
select is((select (res ->> 'duplicate')::boolean from r1), false, 'not a duplicate');

-- anon reads nothing.
select throws_ok($$ select * from project_requests $$, '42501', null, 'anon cannot read requests');
select throws_ok($$ select * from clients $$, '42501', null, 'anon cannot read clients');
select throws_ok($$ select * from project_request_documents $$, '42501', null, 'anon cannot read documents');
select throws_ok($$ insert into project_requests (workspace_id, client_id, code, locale, idempotency_key, summary, consent_at, privacy_policy_version, project_name)
  values ('10000000-0000-0000-0000-000000000001', gen_random_uuid(), 'REQ-2026-9999', 'uk', gen_random_uuid(), 'x', now(), 'v', 'x') $$,
  '42501', null, 'anon cannot insert directly');

-- The client's copy by token; a wrong token gets nothing.
select is((select get_request_brief(res ->> 'token') ->> 'code' from r1), (select res ->> 'code' from r1),
  'the token opens the client''s brief');
select is(get_request_brief(repeat('0', 64)), null, 'a wrong token opens nothing');
select is((select get_request_brief(res ->> 'token') #>> '{content,client,name}' from r1), 'Олена',
  'the brief snapshot keeps Ukrainian text');

-- 3. Retry with the same idempotency key: same request, no second one.
create temp table r1b as select submit_project_request(pg_temp.payload(), 's3cret', pg_temp.ip(1),
  'a0000000-0000-0000-0000-000000000001') as res;
select is((select res ->> 'code' from r1b), (select res ->> 'code' from r1), 'a retry returns the same request');
select is((select (res ->> 'duplicate')::boolean from r1b), true, 'and says it is a duplicate');
select is(get_request_brief((select res ->> 'token' from r1)), null, 'the retry replaces the old token');

-- 4. Validation in the database (the last line after the server).
select throws_ok($$ select submit_project_request(pg_temp.payload('{"consent": {"given": false}}'), 's3cret', pg_temp.ip(2), gen_random_uuid()) $$,
  '22023', 'invalid:consent', 'consent is required');
select throws_ok($$ select submit_project_request(pg_temp.payload(jsonb_build_object('client', jsonb_build_object('name', 'X', 'email', 'not-an-email'))), 's3cret', pg_temp.ip(3), gen_random_uuid()) $$,
  '22023', 'invalid:email', 'an invalid e-mail is refused');
select throws_ok($$ select submit_project_request(pg_temp.payload(jsonb_build_object('references', jsonb_build_array(jsonb_build_object('url', 'javascript:alert(1)')))), 's3cret', pg_temp.ip(4), gen_random_uuid()) $$,
  '22023', 'invalid:url', 'a non-http URL is refused');
select throws_ok($$ select submit_project_request(pg_temp.payload(jsonb_build_object('competitors', (select jsonb_agg(jsonb_build_object('name', 'C' || i)) from generate_series(1, 11) i))), 's3cret', pg_temp.ip(5), gen_random_uuid()) $$,
  '22023', 'invalid:lists', 'more than 10 competitors are refused');
select throws_ok($$ select submit_project_request(pg_temp.payload(jsonb_build_object('about', jsonb_build_object('summary', repeat('я', 4001)))), 's3cret', pg_temp.ip(6), gen_random_uuid()) $$,
  '22023', 'invalid:summary', 'an over-long text is refused');

-- 5. Rate limit: 3 per 10 minutes per IP (ip 7 gets two more, the fourth fails).
select lives_ok($$ select submit_project_request(pg_temp.payload(), 's3cret', pg_temp.ip(7), gen_random_uuid()) $$, 'ip 7: 1st');
select lives_ok($$ select submit_project_request(pg_temp.payload(jsonb_build_object('existing', jsonb_build_object('has', false, 'url', 'https://ignored.example'))), 's3cret', pg_temp.ip(7), gen_random_uuid()) $$, 'ip 7: 2nd, no existing product');
select lives_ok($$ select submit_project_request(pg_temp.payload(), 's3cret', pg_temp.ip(7), gen_random_uuid()) $$, 'ip 7: 3rd');
select throws_ok($$ select submit_project_request(pg_temp.payload(), 's3cret', pg_temp.ip(7), gen_random_uuid()) $$,
  'P0001', 'rate_limited', 'ip 7: the 4th within 10 minutes is refused');
reset role;

-- 6. Members see their workspace; the owner of another workspace sees nothing.
select pg_temp.login('00000000-0000-0000-0000-00000000000b');
set local role authenticated;
select is((select count(*) from project_requests), 0::bigint, 'another workspace sees no requests');
reset role;
select pg_temp.login('00000000-0000-0000-0000-00000000000a');
set local role authenticated;
select is((select count(*) from project_requests), 4::bigint, 'the receiving workspace sees its requests');
select is((select count(distinct client_id) from project_requests), 1::bigint, 'one client per e-mail, case-insensitive');
select is((select count(*) from project_requests where not has_existing and existing_url is not null), 0::bigint,
  'without an existing product its answers are not stored');

-- 7. Lifecycle and read-only answers.
select lives_ok($$ update project_requests set status = 'reviewing' where code like '%-0001' $$, 'the designer changes the status');
select throws_ok($$ update project_requests set status = 'converted' where code like '%-0001' $$,
  '42501', null, '«converted» cannot be set by hand');
select throws_ok($$ update project_requests set summary = 'змінено' where code like '%-0001' $$,
  '42501', null, 'client answers are read-only');
reset role;
select throws_ok($$ update project_request_documents set version = 2 $$, '42501', null, 'documents are immutable, even for the table owner');

select * from finish();
rollback;
