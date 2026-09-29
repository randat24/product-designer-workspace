-- Competitors, comparison matrix, attachments and storage policies.
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

-- competitors
insert into competitors (id, project_id, name) values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Google Maps'),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'TheFork');
select is((select code from competitors where id = '30000000-0000-0000-0000-000000000001'), 'CP-01', 'competitor gets CP-01');
select is((select code from competitors where id = '30000000-0000-0000-0000-000000000002'), 'CP-02', 'codes increment');
select is((select workspace_id from competitors where id = '30000000-0000-0000-0000-000000000001'),
  '10000000-0000-0000-0000-000000000001'::uuid, 'workspace derived from project');
select is((select kind::text from competitors where id = '30000000-0000-0000-0000-000000000001'), 'direct', 'default kind is direct');

select lives_ok($$ insert into competitors (id, project_id, name, is_own_product)
  values ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 'Наш продукт', true) $$,
  'own product row');
select throws_ok($$ insert into competitors (project_id, name, is_own_product)
  values ('20000000-0000-0000-0000-000000000001', 'Ещё наш', true) $$, '23505', null, 'only one own product per project');

-- matrix
insert into comparison_features (id, project_id, name, group_name) values
  ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Онлайн-бронь', 'Бронирование'),
  ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'Чужая строка', null);
select lives_ok($$ insert into competitor_feature_values (competitor_id, comparison_feature_id, value)
  values ('30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'partial') $$, 'editor sets a cell');
select is((select project_id from competitor_feature_values where competitor_id = '30000000-0000-0000-0000-000000000001'),
  '20000000-0000-0000-0000-000000000001'::uuid, 'cell takes the competitor''s project');
select throws_ok($$ insert into competitor_feature_values (competitor_id, comparison_feature_id, value)
  values ('30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', 'yes') $$,
  '23503', null, 'cell cannot mix projects');
select lives_ok($$ insert into competitor_feature_values (competitor_id, comparison_feature_id, value)
  values ('30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'yes')
  on conflict (competitor_id, comparison_feature_id) do update set value = excluded.value $$, 'cell upsert');
select is((select value::text from competitor_feature_values where competitor_id = '30000000-0000-0000-0000-000000000001'), 'yes',
  'cell value updated');

-- trace: competitor is a traceable entity
select is((select count(*)::int from trace_relation_rules where source_type = 'competitor'), 3, 'competitor trace rules exist');

-- attachments
select lives_ok($$ insert into attachments (project_id, entity_type, entity_id, storage_path, file_name, mime_type, size_bytes)
  values ('20000000-0000-0000-0000-000000000001', 'competitor', '30000000-0000-0000-0000-000000000001',
          '20000000-0000-0000-0000-000000000001/competitor/a.png', 'a.png', 'image/png', 1000) $$, 'attach a screenshot');
select throws_ok($$ insert into attachments (project_id, entity_type, entity_id, storage_path, file_name, mime_type, size_bytes)
  values ('20000000-0000-0000-0000-000000000002', 'competitor', '30000000-0000-0000-0000-000000000001',
          '20000000-0000-0000-0000-000000000002/competitor/b.png', 'b.png', 'image/png', 1000) $$,
  '23503', null, 'attachment must belong to the entity''s project');
select throws_ok($$ insert into attachments (project_id, entity_type, entity_id, storage_path, file_name, mime_type, size_bytes)
  values ('20000000-0000-0000-0000-000000000001', 'competitor', '30000000-0000-0000-0000-000000000001',
          '20000000-0000-0000-0000-000000000002/competitor/c.png', 'c.png', 'image/png', 1000) $$,
  '23514', null, 'storage path must start with the project id');
select throws_ok($$ insert into attachments (project_id, entity_type, entity_id, storage_path, file_name, mime_type, size_bytes)
  values ('20000000-0000-0000-0000-000000000001', 'competitor', '30000000-0000-0000-0000-000000000001',
          '20000000-0000-0000-0000-000000000001/competitor/d.exe', 'd.exe', 'application/x-msdownload', 1000) $$,
  '23514', null, 'only images are accepted');

-- storage policies
select lives_ok($$ insert into storage.objects (bucket_id, name)
  values ('attachments', '20000000-0000-0000-0000-000000000001/competitor/a.png') $$, 'editor uploads into own project');

-- viewer
select pg_temp.login('00000000-0000-0000-0000-00000000000c');
select is((select count(*)::int from competitors), 3, 'viewer sees competitors');
select is((select count(*)::int from storage.objects where bucket_id = 'attachments'), 1, 'viewer reads project files');
select throws_ok($$ insert into storage.objects (bucket_id, name)
  values ('attachments', '20000000-0000-0000-0000-000000000001/competitor/x.png') $$, '42501', null, 'viewer cannot upload');
update competitor_feature_values set value = 'no';
select is((select value::text from competitor_feature_values limit 1), 'yes', 'viewer cannot change cells');

-- outsider
select pg_temp.login('00000000-0000-0000-0000-00000000000b');
select is((select count(*)::int from competitors) + (select count(*)::int from attachments)
          + (select count(*)::int from storage.objects where bucket_id = 'attachments'), 0, 'outsider sees nothing');

-- deleting a competitor clears its cells and attachments
select pg_temp.login('00000000-0000-0000-0000-00000000000a');
delete from competitors where id = '30000000-0000-0000-0000-000000000001';
select is((select count(*)::int from competitor_feature_values) + (select count(*)::int from attachments), 0,
  'cells and attachments go with the competitor');

-- demo project has competitors and a matrix
create temp table demo as select create_demo_project('10000000-0000-0000-0000-000000000001') as slug;
select is((select count(*)::int from competitors c join projects p on p.id = c.project_id
           where p.slug = (select slug from demo)), 4, 'demo has 4 competitors incl. own product');

select is((select count(*)::int from competitor_feature_values v join projects p on p.id = v.project_id
           where p.slug = (select slug from demo)), 28, 'demo matrix is filled');

select * from finish();
rollback;
