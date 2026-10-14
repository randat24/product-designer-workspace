-- Site notes: the owner writes them; visitors read the site's published notes, react and reply only through the functions.
begin;
create extension if not exists pgtap with schema extensions;
select plan(22);

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

insert into intake_settings (workspace_id) values ('10000000-0000-0000-0000-000000000001');
insert into private.intake_secret (secret_hash) values (encode(sha256(convert_to('s3cret', 'UTF8')), 'hex'));

-- The owner writes: numbers come from the database, publishing stamps the date.
select pg_temp.login('00000000-0000-0000-0000-00000000000a');
set local role authenticated;
select lives_ok($$ insert into site_notes (id, workspace_id, body_uk, status, number)
  values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Перша думка', 'published', 99) $$,
  'owner publishes a note');
select lives_ok($$ insert into site_notes (id, workspace_id, body_uk, body_en, status, parent_id)
  values ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Продовження', 'Follow-up', 'published',
          '20000000-0000-0000-0000-000000000001') $$, 'owner continues the thread');
select lives_ok($$ insert into site_notes (id, workspace_id, body_uk)
  values ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'Чернетка') $$, 'owner keeps a draft');
select is((select array_agg(number order by number) from site_notes), array[1, 2, 3], 'numbers are 1, 2, 3 whatever the client sent');
select isnt((select published_at from site_notes where number = 1), null, 'publishing stamps the date');
select throws_ok($$ update site_notes set status = 'published', body_uk = ' ' where number = 3 $$,
  '23514', null, 'an empty note cannot be published');
update site_notes set number = 50 where number = 3;
select is((select count(*)::int from site_notes where number = 3), 1, 'the number never changes');
reset role;

-- An editor of the same workspace sees nothing and changes nothing.
select pg_temp.login('00000000-0000-0000-0000-00000000000c');
set local role authenticated;
select is((select count(*)::int from site_notes), 0, 'editor does not read notes');
select throws_ok($$ insert into site_notes (workspace_id, body_uk) values ('10000000-0000-0000-0000-000000000001', 'x') $$,
  '42501', null, 'editor cannot write notes');
reset role;

-- Another owner cannot thread onto a note of a workspace not theirs.
select pg_temp.login('00000000-0000-0000-0000-00000000000b');
set local role authenticated;
select throws_ok($$ insert into site_notes (workspace_id, body_uk, parent_id)
  values ('10000000-0000-0000-0000-000000000002', 'x', '20000000-0000-0000-0000-000000000001') $$,
  '22023', 'invalid:parent', 'a thread stays in its workspace');
reset role;

-- Visitors.
set local role anon;
select throws_ok($$ select * from site_notes $$, '42501', null, 'visitors cannot read the table');
select is(jsonb_array_length(site_notes()), 2, 'visitors get the published notes only');
select is((site_notes() -> 0 ->> 'parent')::int, 1, 'the newest note says which one it continues');
select throws_ok($$ select note_react(1, 'agree', true, 'wrong', repeat('a', 64)) $$, '42501', null, 'reacting needs the secret');
select is(note_react(1, 'agree', true, 's3cret', repeat('a', 64)) ->> 'agree', '1', 'a reaction counts');
select is(note_react(1, 'agree', true, 's3cret', repeat('a', 64)) ->> 'agree', '1', 'the same visitor counts once');
select is(note_react(1, 'agree', false, 's3cret', repeat('a', 64)), '{}'::jsonb, 'a reaction can be taken back');
select throws_ok($$ select note_react(3, 'agree', true, 's3cret', repeat('a', 64)) $$, 'P0002', null, 'no reactions on a draft');
select lives_ok($$ select submit_note_reply(2, 'Цікаво, а як ви…', 'tg @someone', 'uk', 's3cret', repeat('b', 64)) $$,
  'a visitor replies privately');
select throws_ok($$ select submit_note_reply(2, '   ', null, 'uk', 's3cret', repeat('b', 64)) $$, '22023', 'invalid:body', 'an empty reply is refused');
reset role;

select pg_temp.login('00000000-0000-0000-0000-00000000000a');
set local role authenticated;
select is((select body from note_replies), 'Цікаво, а як ви…', 'the owner reads the reply');
reset role;
select pg_temp.login('00000000-0000-0000-0000-00000000000c');
set local role authenticated;
select is((select count(*)::int from note_replies), 0, 'the editor does not');
reset role;

select * from finish();
rollback;
