-- open_demo_project: the «Открыть демо-проект» button, safe against double submits.
-- Two requests at the same moment (two tabs, a double click, parallel e2e projects) used to both miss
-- the "recent demo" check, both pick the slug restaurant-app and the second failed with 23505.
-- A transaction-level advisory lock per workspace serialises them; the second one gets the demo the
-- first one just created.
create or replace function public.open_demo_project(p_workspace uuid)
returns text language plpgsql set search_path = '' as $$
declare
  v_slug text;
begin
  if not public.is_workspace_member(p_workspace, 'editor') then
    raise exception 'open_demo_project: no write access to workspace %', p_workspace using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtext('demo:' || p_workspace::text));

  select slug into v_slug from public.projects
  where workspace_id = p_workspace and slug like 'restaurant-app%' and created_at > now() - interval '30 seconds'
  order by created_at desc limit 1;
  if v_slug is not null then
    return v_slug;
  end if;

  return public.create_demo_project(p_workspace);
end;
$$;

revoke all on function public.open_demo_project(uuid) from public, anon;
grant execute on function public.open_demo_project(uuid) to authenticated;
