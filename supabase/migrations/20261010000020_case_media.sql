-- =====================================================================
-- Case media: images of a case study (cover, section pictures) edited
-- in the notebook. The bucket is public: the portfolio site shows them
-- to visitors without signing in. Only workspace editors upload, replace
-- or delete, by the project id in the first path segment (same rule as
-- the private `attachments` bucket). No SVG: a public SVG can run script.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('case-media', 'case-media', true, 10485760, array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

create policy case_media_select on storage.objects for select to authenticated
  using (bucket_id = 'case-media' and public.can_access_project_file(name, 'viewer'));
create policy case_media_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'case-media' and public.can_access_project_file(name, 'editor'));
create policy case_media_update on storage.objects for update to authenticated
  using (bucket_id = 'case-media' and public.can_access_project_file(name, 'editor'))
  with check (bucket_id = 'case-media' and public.can_access_project_file(name, 'editor'));
create policy case_media_delete on storage.objects for delete to authenticated
  using (bucket_id = 'case-media' and public.can_access_project_file(name, 'editor'));
