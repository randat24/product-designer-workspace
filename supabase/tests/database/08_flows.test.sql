-- Flows: codes, default edge cases, integrity, flow→screen auto trace, activity, RLS, demo flow.
begin;
create extension if not exists pgtap with schema extensions;
select plan(18);

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
insert into projects (id, workspace_id, name, slug) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'P1', 'p1'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'P2', 'p2');

insert into user_flows (id, project_id, name) values
  ('50000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Вход'),
  ('50000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Бронь');
select is((select string_agg(code, ',' order by code) from user_flows), 'FL-01,FL-02', 'flows get FL-01, FL-02');
select is((select count(*)::int from flow_edge_cases where flow_id = '50000000-0000-0000-0000-000000000001' and status = 'missing'), 8,
  'a new flow starts with 8 missing edge cases');

insert into screens (id, project_id, name) values
  ('51000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Карта'),
  ('51000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'Чужой экран');
select is((select code from screens where id = '51000000-0000-0000-0000-000000000001'), 'SCR-001', 'screen gets SCR-001');

-- nodes take the flow's project; screens must be in it
insert into flow_nodes (id, project_id, flow_id, kind, label) values
  ('52000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', 'start', 'Старт'),
  ('52000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'screen', 'Карта'),
  ('52000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000002', 'end', 'Конец');
select is((select project_id from flow_nodes where id = '52000000-0000-0000-0000-000000000001'),
  '20000000-0000-0000-0000-000000000001'::uuid, 'node takes the flow''s project');
select throws_ok($$ update flow_nodes set screen_id = '51000000-0000-0000-0000-000000000002'
  where id = '52000000-0000-0000-0000-000000000002' $$, '23503', null, 'screen from another project is rejected');

-- edges stay inside one flow
select lives_ok($$ insert into flow_edges (project_id, flow_id, source_node_id, target_node_id)
  values ('20000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001',
          '52000000-0000-0000-0000-000000000001', '52000000-0000-0000-0000-000000000002') $$, 'edge between nodes of one flow');
select throws_ok($$ insert into flow_edges (project_id, flow_id, source_node_id, target_node_id)
  values ('20000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001',
          '52000000-0000-0000-0000-000000000002', '52000000-0000-0000-0000-000000000003') $$,
  '23503', null, 'edge to a node of another flow is rejected');
select throws_ok($$ update flow_edge_cases set node_id = '52000000-0000-0000-0000-000000000003'
  where flow_id = '50000000-0000-0000-0000-000000000001' and kind = 'empty' $$,
  '23503', null, 'edge case points to a node of its own flow only');

-- screen link ⇄ trace link user_flow → screen
update flow_nodes set screen_id = '51000000-0000-0000-0000-000000000001' where id = '52000000-0000-0000-0000-000000000002';
select is((select count(*)::int from trace_links where source_type = 'user_flow' and target_type = 'screen'
  and relation = 'implements' and origin = 'system'), 1, 'linking a screen node traces flow → screen');
insert into flow_nodes (project_id, flow_id, kind, label, screen_id) values
  ('20000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'screen', 'Карта снова', '51000000-0000-0000-0000-000000000001');
delete from flow_nodes where id = '52000000-0000-0000-0000-000000000002';
select is((select count(*)::int from trace_links where source_type = 'user_flow' and target_type = 'screen'), 1,
  'link stays while another node shows the screen');
delete from flow_nodes where flow_id = '50000000-0000-0000-0000-000000000001' and screen_id is not null;
select is((select count(*)::int from trace_links where source_type = 'user_flow' and target_type = 'screen'), 0,
  'link goes with the last node showing the screen');

-- dragging a node is not logged as activity
create temp table act0 as select count(*)::int as c from activity_log where entity_type = 'flow_node';
update flow_nodes set pos_x = 100, pos_y = 50 where id = '52000000-0000-0000-0000-000000000001';
select is((select count(*)::int from activity_log where entity_type = 'flow_node'), (select c from act0),
  'moving a node adds no activity');

select is((select count(*)::int from flow_stats('20000000-0000-0000-0000-000000000001')), 2, 'flow_stats lists both flows');

-- RLS: outsiders see nothing
select pg_temp.login('00000000-0000-0000-0000-00000000000b');
select is((select count(*)::int from user_flows) + (select count(*)::int from flow_nodes)
        + (select count(*)::int from flow_edge_cases) + (select count(*)::int from screens), 0, 'outsider sees no flows or screens');
select pg_temp.login('00000000-0000-0000-0000-00000000000a');

-- demo flow
create temp table demo as select create_demo_project('10000000-0000-0000-0000-000000000001') as slug;
create temp table demo_p as select id from projects where slug = (select slug from demo) and workspace_id = '10000000-0000-0000-0000-000000000001';
select is((select count(*)::int from flow_nodes where project_id = (select id from demo_p)) || '/' ||
          (select count(*)::int from flow_edges where project_id = (select id from demo_p)) || '/' ||
          (select count(*)::int from screens where project_id = (select id from demo_p)),
  '11/12/3', 'demo: 11 nodes, 12 edges, 3 screens');
select is((select count(*)::int from trace_links where project_id = (select id from demo_p)
           and source_type = 'user_flow' and target_type = 'screen'), 3, 'demo flow implements its 3 screens');
select is((select count(*)::int from trace_links where project_id = (select id from demo_p)
           and source_type = 'opportunity' and target_type = 'user_flow'), 1, 'demo opportunity addresses the flow');
select is((select missing_cases from flow_stats((select id from demo_p))), 5, 'demo flow: 5 edge cases still missing');

select * from finish();
rollback;
