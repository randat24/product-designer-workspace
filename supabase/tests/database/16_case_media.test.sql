-- Case media bucket: public for reading on the site, editors of the project upload.
begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

create function pg_temp.login(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'anna@example.com'),
  ('00000000-0000-0000-0000-00000000000b', 'boris@example.com'),
  ('00000000-0000-0000-0000-00000000000c', 'chris@example.com');

-- Bucket settings, read before switching role (signed-in users cannot list buckets).
select ok((select public from storage.buckets where id = 'case-media'), 'case media bucket is public');
select ok(not exists (select 1 from storage.buckets where id = 'case-media' and 'image/svg+xml' = any (allowed_mime_types)),
  'svg is not accepted');

select pg_temp.login('00000000-0000-0000-0000-00000000000a');
set local role authenticated;

insert into workspaces (id, name, slug, owner_id)
values ('10000000-0000-0000-0000-000000000001', 'Студія', 'studio-a', '00000000-0000-0000-0000-00000000000a');
insert into workspace_members (workspace_id, user_id, role)
values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000c', 'viewer');
insert into projects (id, workspace_id, name, slug)
values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'P1', 'p1');


select lives_ok($$ insert into storage.objects (bucket_id, name)
  values ('case-media', '20000000-0000-0000-0000-000000000001/case/a.webp') $$, 'editor uploads into own project');

-- viewer
select pg_temp.login('00000000-0000-0000-0000-00000000000c');
select throws_ok($$ insert into storage.objects (bucket_id, name)
  values ('case-media', '20000000-0000-0000-0000-000000000001/case/b.webp') $$, '42501', null, 'viewer cannot upload');

-- outsider
select pg_temp.login('00000000-0000-0000-0000-00000000000b');
select throws_ok($$ insert into storage.objects (bucket_id, name)
  values ('case-media', '20000000-0000-0000-0000-000000000001/case/c.webp') $$, '42501', null, 'outsider cannot upload');
-- Deleting goes through the Storage API (direct deletes are blocked), so check what the outsider can see.
select is((select count(*)::int from storage.objects where bucket_id = 'case-media'), 0, 'outsider does not list project files');

select * from finish();
rollback;
