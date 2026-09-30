-- project_stage_counts: one call gives the same stage counts as the per-entity stats, and respects RLS.
begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

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
insert into projects (id, workspace_id, name, slug)
values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Пустой', 'empty');

-- an empty project: all zeros, no research target
create temp table e as select project_stage_counts('20000000-0000-0000-0000-000000000001') as c;
select is((select (c->>'cards_total')::int + (c->>'insights_total')::int + (c->>'screens_total')::int + (c->>'flows_total')::int from e), 0,
  'an empty project counts nothing');
select ok((select c->'research_target' = 'null'::jsonb from e), 'no research target without a plan');

-- the demo project: counts agree with the existing stats functions and base tables
create temp table demo as select create_demo_project('10000000-0000-0000-0000-000000000001') as slug;
create temp table p as select id from projects where slug = (select slug from demo);
create temp table c as select project_stage_counts((select id from p)) as c;

select is((select (c->>'flows_complete')::int from c),
  (select count(*)::int from flow_stats((select id from p)) where missing_cases = 0), 'flows complete = flows without missing edge cases');
select is((select (c->>'screens_complete')::int from c),
  (select count(*)::int from screen_stats((select id from p)) where missing_states = 0), 'screens complete = screens without missing key states');
select is((select (c->>'decisions_evidenced')::int from c),
  (select count(*)::int from decision_stats((select id from p)) where evidence > 0), 'decisions with evidence');
select is((select (c->>'insights_sourced')::int from c),
  (select count(*)::int from synthesis_stats((select id from p)) where entity_type = 'insight' and source_count > 0), 'insights with sources');
select is((select (c->>'pain_points_sourced')::int from c),
  (select count(*)::int from synthesis_stats((select id from p)) where entity_type = 'pain_point' and source_count > 0), 'pain points with sources');
select is((select (c->>'cards_total')::int from c),
  (select count(*)::int from quotes where project_id = (select id from p)) + (select count(*)::int from observations where project_id = (select id from p)),
  'board cards = quotes + observations');
select ok((select (c->>'interviews_conducted')::int > 0 and (c->>'competitors_assessed')::int > 0 and (c->>'opportunities')::int > 0 from c),
  'the demo has conducted interviews, assessed competitors and an opportunity');

-- archived rows drop out, as they do from the lists
update screens set archived_at = now() where id = (select id from screens where project_id = (select id from p) order by code limit 1);
select is((select (project_stage_counts((select id from p))->>'screens_total')::int),
  (select (c->>'screens_total')::int - 1 from c), 'an archived screen is not counted');

-- only the latest interview of a participant counts
select is((select (c->>'interviews_conducted')::int from c),
  (select count(*)::int from (select distinct on (i.participant_id) i.status from interviews i
    join participants pa on pa.id = i.participant_id and pa.archived_at is null
    where i.project_id = (select id from p) order by i.participant_id, i.created_at desc) x
   where status in ('done', 'synthesized')), 'conducted = latest interview per active participant');

-- another user sees nothing of this project
select pg_temp.login('00000000-0000-0000-0000-00000000000b');
select is((select (project_stage_counts((select id from p))->>'cards_total')::int), 0, 'RLS: a stranger counts nothing');

select * from finish();
rollback;
