-- Synthesis: codes, integrity, auto trace, unsupported flag, frequency, RLS, demo chain.
begin;
create extension if not exists pgtap with schema extensions;
select plan(25);

create function pg_temp.login(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'anna@example.com'),
  ('00000000-0000-0000-0000-00000000000b', 'bob@example.com'),
  ('00000000-0000-0000-0000-00000000000c', 'chris@example.com');

select pg_temp.login('00000000-0000-0000-0000-00000000000a');
set local role authenticated;

insert into workspaces (id, name, slug, owner_id)
values ('10000000-0000-0000-0000-000000000001', 'Студия', 'studio-a', '00000000-0000-0000-0000-00000000000a');
insert into workspace_members (workspace_id, user_id, role)
values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000c', 'viewer');
insert into projects (id, workspace_id, name, slug) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'P1', 'p1'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'P2', 'p2');

-- two participants, one interview each, one answer each
insert into participants (id, project_id, role) values
  ('33000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Дизайнер'),
  ('33000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Аналитик');
insert into interviews (id, project_id, participant_id) values
  ('34000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '33000000-0000-0000-0000-000000000001'),
  ('34000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '33000000-0000-0000-0000-000000000002');
insert into interview_answers (id, project_id, interview_id, body_text) values
  ('35000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '34000000-0000-0000-0000-000000000001', 'Ходим, когда есть повод'),
  ('35000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '34000000-0000-0000-0000-000000000002', 'Нет времени выбирать');

-- quotes
insert into quotes (id, project_id, interview_id, answer_id, text, start_offset, end_offset) values
  ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002',
   '34000000-0000-0000-0000-000000000001', '35000000-0000-0000-0000-000000000001', 'когда есть повод', 7, 23);
select is((select code from quotes), 'Q-001', 'quote gets Q-001');
select is((select project_id from quotes), '20000000-0000-0000-0000-000000000001'::uuid, 'quote takes the interview''s project');
select is((select participant_id from quotes), '33000000-0000-0000-0000-000000000001'::uuid, 'quote takes the interview''s participant');
select is((select count(*)::int from trace_links where source_type = 'answer' and target_type = 'quote' and origin = 'system'), 1,
  'quote is traced to its answer automatically');
select throws_ok($$ insert into quotes (project_id, interview_id, answer_id, text)
  values ('20000000-0000-0000-0000-000000000001', '34000000-0000-0000-0000-000000000002', '35000000-0000-0000-0000-000000000001', 'x') $$,
  '23503', null, 'answer must belong to the quote''s interview');

-- observations & patterns
insert into patterns (id, project_id, title) values
  ('41000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Повод'),
  ('41000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'Чужой');
select is((select code from patterns where id = '41000000-0000-0000-0000-000000000001'), 'PAT-01', 'pattern gets PAT-01');
insert into observations (id, project_id, interview_id, kind, body_text, pattern_id) values
  ('42000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '34000000-0000-0000-0000-000000000002',
   'pain', 'Нет времени на выбор', '41000000-0000-0000-0000-000000000001');
select is((select code || ' ' || participant_id from observations),
  'OBS-001 33000000-0000-0000-0000-000000000002', 'observation gets OBS-001 and the interview''s participant');
select throws_ok($$ insert into observations (project_id, kind, body_text, pattern_id)
  values ('20000000-0000-0000-0000-000000000001', 'need', 'x', '41000000-0000-0000-0000-000000000002') $$,
  '23503', null, 'pattern must be in the same project');
select lives_ok($$ insert into observations (project_id, kind, body_text)
  values ('20000000-0000-0000-0000-000000000001', 'fact', 'Без интервью') $$, 'observation without interview is allowed');

-- insight with two sources from two participants
insert into insights (id, project_id, title) values ('43000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Инсайт');
insert into trace_links (project_id, source_type, source_id, target_type, target_id, relation) values
  ('20000000-0000-0000-0000-000000000001', 'quote', '40000000-0000-0000-0000-000000000001', 'insight', '43000000-0000-0000-0000-000000000001', 'evidences'),
  ('20000000-0000-0000-0000-000000000001', 'observation', '42000000-0000-0000-0000-000000000001', 'insight', '43000000-0000-0000-0000-000000000001', 'evidences');
select is((select code from insights), 'INS-001', 'insight gets INS-001');
select is((select source_count || '/' || participant_count from synthesis_stats('20000000-0000-0000-0000-000000000001') where entity_type = 'insight'),
  '2/2', 'insight: 2 sources, 2 participants');

-- pain point derived from the insight: frequency comes through the insight
insert into pain_points (id, project_id, title, severity) values
  ('44000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Боль', 'high');
insert into trace_links (project_id, source_type, source_id, target_type, target_id, relation) values
  ('20000000-0000-0000-0000-000000000001', 'insight', '43000000-0000-0000-0000-000000000001', 'pain_point', '44000000-0000-0000-0000-000000000001', 'derived_from'),
  ('20000000-0000-0000-0000-000000000001', 'observation', '42000000-0000-0000-0000-000000000001', 'pain_point', '44000000-0000-0000-0000-000000000001', 'evidences');
select is((select participant_count from synthesis_stats('20000000-0000-0000-0000-000000000001') where entity_type = 'pain_point'),
  2, 'pain point frequency = unique participants upstream, not number of links');

-- opportunity
insert into opportunities (id, project_id, title, hmw) values
  ('45000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Возможность', 'Как мы могли бы…');
select is((select code from opportunities), 'OPP-001', 'opportunity gets OPP-001');
select throws_ok($$ insert into trace_links (project_id, source_type, source_id, target_type, target_id, relation) values
  ('20000000-0000-0000-0000-000000000001', 'opportunity', '45000000-0000-0000-0000-000000000001', 'quote', '40000000-0000-0000-0000-000000000001', 'evidences') $$,
  '23503', null, 'links against the chain direction are rejected');

-- acceptance (docs/MVP.md §3): deleting a quote removes its links; an insight left without sources is unsupported
delete from quotes where id = '40000000-0000-0000-0000-000000000001';
select is((select count(*)::int from trace_links where source_type = 'quote' or target_type = 'quote'), 0, 'quote links are removed');
delete from observations where id = '42000000-0000-0000-0000-000000000001';
select is((select source_count from synthesis_stats('20000000-0000-0000-0000-000000000001') where entity_type = 'insight'), 0,
  'insight without sources shows 0 (unsupported)');

-- deleting a pattern keeps its cards, unclustered
insert into observations (id, project_id, kind, body_text, pattern_id) values
  ('42000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'need', 'Карточка', '41000000-0000-0000-0000-000000000001');
delete from patterns where id = '41000000-0000-0000-0000-000000000001';
select is((select pattern_id from observations where id = '42000000-0000-0000-0000-000000000002'), null, 'cards survive pattern deletion');

-- viewer / outsider
select pg_temp.login('00000000-0000-0000-0000-00000000000c');
select is((select count(*)::int from insights), 1, 'viewer sees insights');
select throws_ok($$ insert into insights (project_id, title) values ('20000000-0000-0000-0000-000000000001', 'X') $$,
  '42501', null, 'viewer cannot create insights');
select pg_temp.login('00000000-0000-0000-0000-00000000000b');
select is((select count(*)::int from insights) + (select count(*)::int from observations) + (select count(*)::int from pain_points), 0,
  'outsider sees no synthesis');

-- deleting a participant removes their observations
select pg_temp.login('00000000-0000-0000-0000-00000000000a');
insert into observations (project_id, interview_id, kind, body_text) values
  ('20000000-0000-0000-0000-000000000001', '34000000-0000-0000-0000-000000000001', 'behavior', 'Удалится');
delete from participants where id = '33000000-0000-0000-0000-000000000001';
select is((select count(*)::int from observations where body_text = 'Удалится'), 0, 'observations go with their participant');

-- demo chain
create temp table demo as select create_demo_project('10000000-0000-0000-0000-000000000001') as slug;
create temp table demo_p as select id from projects where slug = (select slug from demo) and workspace_id = '10000000-0000-0000-0000-000000000001';
select is((select count(*)::int from quotes where project_id = (select id from demo_p)) || '/' ||
          (select count(*)::int from observations where project_id = (select id from demo_p)) || '/' ||
          (select count(*)::int from patterns where project_id = (select id from demo_p)),
  '6/7/3', 'demo: 6 quotes, 7 observations, 3 patterns');
select is((select string_agg(code, ',' order by code) from insights where project_id = (select id from demo_p)) || ' ' ||
          (select string_agg(code, ',' order by code) from pain_points where project_id = (select id from demo_p)) || ' ' ||
          (select string_agg(code, ',' order by code) from opportunities where project_id = (select id from demo_p)),
  'INS-001,INS-002,INS-003 PP-001,PP-002 OPP-001', 'demo: insights, pain points, opportunity');
select is((select s.participant_count from synthesis_stats((select id from demo_p)) s join pain_points p on p.id = s.entity_id
           where p.code = 'PP-001'), 4, 'demo PP-001 frequency is 4 participants');
select is((select count(*)::int from trace_graph('opportunity', (select id from opportunities where project_id = (select id from demo_p)), 'up', 6)
           where source_type = 'answer'), 4, 'demo opportunity traces back to interview answers');

select * from finish();
rollback;
