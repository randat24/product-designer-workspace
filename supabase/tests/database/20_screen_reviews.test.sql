-- Screen reviews: one per reviewer and screen, scores 1–10, only the author changes it, members read all.
begin;
create extension if not exists pgtap with schema extensions;
select plan(16);

create function pg_temp.login(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'anna@example.com'),
  ('00000000-0000-0000-0000-00000000000b', 'bob@example.com'),
  ('00000000-0000-0000-0000-00000000000c', 'chris@example.com'),
  ('00000000-0000-0000-0000-00000000000d', 'dana@example.com');

select pg_temp.login('00000000-0000-0000-0000-00000000000a');
set local role authenticated;

insert into workspaces (id, name, slug, owner_id)
values ('10000000-0000-0000-0000-000000000001', 'Студія', 'studio-a', '00000000-0000-0000-0000-00000000000a');
insert into workspace_members (workspace_id, user_id, role) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000b', 'editor'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000c', 'viewer');
insert into projects (id, workspace_id, name, slug) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'P1', 'p1'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'P2', 'p2');
insert into screens (id, project_id, name) values
  ('60000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Карта');

select lives_ok($$ insert into screen_reviews (project_id, screen_id, familiar, quality)
  values ('20000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', 8, 7) $$,
  'owner reviews a screen');
select throws_ok($$ insert into screen_reviews (project_id, screen_id)
  values ('20000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001') $$,
  '23505', null, 'one review per reviewer and screen');
select throws_ok($$ update screen_reviews set choice = 11 $$, '23514', null, 'scores stay between 1 and 10');
select throws_ok($$ update screen_reviews set choice = 0 $$, '23514', null, 'zero is not a score');
select throws_ok($$ update screen_reviews set note = repeat('x', 1001) $$, '23514', null, 'a note is at most 1000 characters');
select lives_ok($$ insert into screen_reviews (project_id, screen_id, choice)
  values ('20000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', 6)
  on conflict (screen_id, reviewer_id) do update set choice = excluded.choice $$, 'the app''s upsert updates my own review');
select is((select familiar::int * 100 + choice from screen_reviews), 806, 'the upsert keeps the scores it did not send');
select throws_ok($$ insert into screen_reviews (project_id, screen_id)
  values ('20000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000001') $$,
  '23514', null, 'the screen belongs to the review''s project');

-- editor
select pg_temp.login('00000000-0000-0000-0000-00000000000b');
select throws_ok($$ insert into screen_reviews (project_id, screen_id, reviewer_id)
  values ('20000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a') $$,
  '42501', null, 'nobody writes a review in another member''s name');
select lives_ok($$ insert into screen_reviews (project_id, screen_id, familiar)
  values ('20000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', 5) $$,
  'an editor adds their own review');
update screen_reviews set familiar = 1 where reviewer_id = '00000000-0000-0000-0000-00000000000a';
update screen_reviews set reviewer_id = '00000000-0000-0000-0000-00000000000b' where reviewer_id = '00000000-0000-0000-0000-00000000000a';
delete from screen_reviews where reviewer_id = '00000000-0000-0000-0000-00000000000a';
select is((select familiar::int from screen_reviews where reviewer_id = '00000000-0000-0000-0000-00000000000a'), 8,
  'another editor cannot change, take over or delete someone''s review');

-- viewer
select pg_temp.login('00000000-0000-0000-0000-00000000000c');
select is((select count(*)::int from screen_reviews), 2, 'a viewer sees every review');
select throws_ok($$ insert into screen_reviews (project_id, screen_id)
  values ('20000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001') $$,
  '42501', null, 'a viewer cannot review');
update screen_reviews set familiar = 1;
delete from screen_reviews;
select is((select count(*)::int from screen_reviews where familiar = 1), 0, 'a viewer cannot change a review');
select is((select count(*)::int from screen_reviews), 2, 'a viewer cannot delete a review');

-- outsider
select pg_temp.login('00000000-0000-0000-0000-00000000000d');
select is((select count(*)::int from screen_reviews), 0, 'an outsider sees no reviews');

select * from finish();
rollback;
