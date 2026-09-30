-- Competitor review: row kinds, cell notes as reminders, demo UX review.
begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

create function pg_temp.login(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;

insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000000a', 'anna@example.com');
select pg_temp.login('00000000-0000-0000-0000-00000000000a');
set local role authenticated;

insert into workspaces (id, name, slug, owner_id)
values ('10000000-0000-0000-0000-000000000001', 'Студия', 'studio-a', '00000000-0000-0000-0000-00000000000a');
insert into projects (id, workspace_id, name, slug)
values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'P1', 'p1');

insert into comparison_features (project_id, name) values ('20000000-0000-0000-0000-000000000001', 'Поиск');
select is((select kind from comparison_features), 'feature', 'rows are features by default');
select throws_ok($$ insert into comparison_features (project_id, name, kind) values ('20000000-0000-0000-0000-000000000001', 'x', 'other') $$,
  '23514', null, 'row kind is feature or ux');

create temp table demo as select create_demo_project('10000000-0000-0000-0000-000000000001') as slug;
create temp table demo_p as select id from projects where slug = (select slug from demo);

select is((select count(*)::int from comparison_features where project_id = (select id from demo_p) and kind = 'ux'), 10,
  'demo has 10 Nielsen heuristics');
select is((select count(*)::int from comparison_features where project_id = (select id from demo_p) and kind = 'feature'), 7,
  'demo keeps 7 feature rows');
select is((select count(*)::int from competitor_feature_values v join competitors c on c.id = v.competitor_id
           where v.project_id = (select id from demo_p) and v.value = 'no' and coalesce(v.note, '') <> '' and not c.is_own_product), 7,
  'demo has 7 reminders (notes on red cells of competitors)');
update competitor_feature_values set note_done = true
where project_id = (select id from demo_p) and value = 'no' and note is not null;
select is((select count(*)::int from competitor_feature_values where project_id = (select id from demo_p) and note_done), 7,
  'reminders can be marked done');

select * from finish();
rollback;
