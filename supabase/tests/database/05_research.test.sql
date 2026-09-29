-- Research: codes, same-project integrity, answers, RLS, demo research.
begin;
create extension if not exists pgtap with schema extensions;
select plan(22);

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

-- plan, guide, questions
insert into research_plans (id, project_id, title) values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'План');
select is((select code from research_plans), 'RP-01', 'plan gets RP-01');

insert into interview_guides (id, project_id, research_plan_id, title) values
  ('31000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Гайд'),
  ('31000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', null, 'Чужой гайд');
select throws_ok($$ insert into interview_guides (project_id, research_plan_id, title)
  values ('20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'X') $$,
  '23503', null, 'guide cannot use a plan from another project');

insert into interview_questions (id, guide_id, project_id, section, position, text, probes, is_key) values
  ('32000000-0000-0000-0000-000000000001', '31000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002',
   'current_behavior', 1, 'Как часто?', array['А в кофейни?'], true);
select is((select project_id from interview_questions where id = '32000000-0000-0000-0000-000000000001'),
  '20000000-0000-0000-0000-000000000001'::uuid, 'question takes the guide''s project, spoofed value ignored');
select is((select workspace_id from interview_questions where id = '32000000-0000-0000-0000-000000000001'),
  '10000000-0000-0000-0000-000000000001'::uuid, 'question workspace derived');
select throws_ok($$ insert into interview_questions (guide_id, project_id, section, text)
  values ('31000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'somewhere', 'X') $$,
  '22P02', null, 'section must be one of the 8');

-- participants & interviews
insert into participants (id, project_id, role) values
  ('33000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Дизайнер'),
  ('33000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Аналитик');
select is((select string_agg(code, ',' order by code) from participants), 'P01,P02', 'participant codes P01, P02');

insert into interviews (id, project_id, participant_id, guide_id) values
  ('34000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
   '33000000-0000-0000-0000-000000000001', '31000000-0000-0000-0000-000000000001');
select is((select code from interviews), 'INT-01', 'interview gets INT-01');
select is((select status::text from interviews), 'planned', 'interview starts planned');
select throws_ok($$ insert into interviews (project_id, participant_id, guide_id)
  values ('20000000-0000-0000-0000-000000000001', '33000000-0000-0000-0000-000000000001', '31000000-0000-0000-0000-000000000002') $$,
  '23503', null, 'interview cannot use a guide from another project');

-- answers
insert into interview_answers (id, project_id, interview_id, question_id, body_text) values
  ('35000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
   '34000000-0000-0000-0000-000000000001', '32000000-0000-0000-0000-000000000001', 'Раз в неделю');
select is((select code from interview_answers), 'ANS-0001', 'answer gets ANS-0001');
select throws_ok($$ insert into interview_answers (project_id, interview_id, question_id, body_text)
  values ('20000000-0000-0000-0000-000000000001', '34000000-0000-0000-0000-000000000001', '32000000-0000-0000-0000-000000000001', 'Дубль') $$,
  '23505', null, 'one answer per question per interview');
select lives_ok($$ insert into interview_answers (project_id, interview_id, question_id, body_text)
  values ('20000000-0000-0000-0000-000000000001', '34000000-0000-0000-0000-000000000001', null, 'Заметка 1'),
         ('20000000-0000-0000-0000-000000000001', '34000000-0000-0000-0000-000000000001', null, 'Заметка 2') $$,
  'free notes are not limited');

-- traceability from research: answer → (future) quote rule exists
select is((select count(*)::int from trace_relation_rules where source_type = 'answer'), 4, 'answer trace rules exist');

-- deleting a question keeps its answers as free notes
delete from interview_questions where id = '32000000-0000-0000-0000-000000000001';
select is((select question_id from interview_answers where id = '35000000-0000-0000-0000-000000000001'), null,
  'answer survives question deletion as a free note');

-- viewer
select pg_temp.login('00000000-0000-0000-0000-00000000000c');
select is((select count(*)::int from participants), 2, 'viewer sees participants');
select throws_ok($$ insert into participants (project_id, role) values ('20000000-0000-0000-0000-000000000001', 'X') $$,
  '42501', null, 'viewer cannot add participants');
update interview_answers set body_text = 'hacked';
select is((select body_text from interview_answers where id = '35000000-0000-0000-0000-000000000001'), 'Раз в неделю',
  'viewer cannot edit answers');

-- outsider
select pg_temp.login('00000000-0000-0000-0000-00000000000b');
select is((select count(*)::int from participants) + (select count(*)::int from interviews)
          + (select count(*)::int from interview_answers) + (select count(*)::int from interview_guides), 0,
  'outsider sees no research');

-- deleting a participant removes their interviews and answers
select pg_temp.login('00000000-0000-0000-0000-00000000000a');
delete from participants where id = '33000000-0000-0000-0000-000000000001';
select is((select count(*)::int from interviews) + (select count(*)::int from interview_answers), 0,
  'interviews and answers go with the participant');

-- demo research
create temp table demo as select create_demo_project('10000000-0000-0000-0000-000000000001') as slug;
select is((select count(*)::int from participants p join projects pr on pr.id = p.project_id where pr.slug = (select slug from demo)),
  7, 'demo has 7 participants');
select is((select count(*)::int from interview_questions q join projects pr on pr.id = q.project_id where pr.slug = (select slug from demo)),
  5, 'demo guide has 5 questions');
select is((select count(*)::int from interview_answers a join projects pr on pr.id = a.project_id where pr.slug = (select slug from demo)),
  33, 'demo has 33 non-empty answers');

select * from finish();
rollback;
