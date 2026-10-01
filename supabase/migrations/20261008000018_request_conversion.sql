-- =====================================================================
-- Project request → project. The request stays the record of what the client said; the project gets a
-- prepared brief and competitor cards, marked as client input (not research). See docs/CLIENT_INTAKE.md §3.
-- Existing tables only get nullable/defaulted columns.
-- =====================================================================

-- The project a request turned into (one request → at most one project).
alter table public.projects
  add column source_request_id uuid unique references public.project_requests (id) on delete set null;

-- Original client wording per brief field: while the field still equals it, the brief shows «со слов клиента».
alter table public.project_briefs
  add column client_input jsonb not null default '{}'::jsonb check (jsonb_typeof(client_input) = 'object');

-- Competitors named by the client vs found by the designer.
alter table public.competitors
  add column origin text not null default 'designer' check (origin in ('designer', 'client'));

/**
 * Creates the project from a request in one transaction:
 *  - project (name, slug with -2, -3… on collisions, platforms, source_request_id);
 *  - brief fields from p_brief (prepared by the app with labels in the workspace language) + client_input;
 *  - competitor cards from the client's list, origin = client;
 *  - request status → converted.
 * Returns the project slug. Editors only; a request converts once.
 */
create or replace function public.convert_project_request(
  p_request uuid, p_name text, p_slug text, p_platforms text[], p_brief jsonb)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_req     public.project_requests;
  v_project uuid;
  v_slug    text;
  v_try     int := 1;
  v_comp    public.project_request_competitors;
begin
  select * into v_req from public.project_requests where id = p_request for update;
  if not found or not public.is_workspace_member(v_req.workspace_id, 'editor') then
    raise exception 'convert_project_request: no access to request %', p_request using errcode = '42501';
  end if;
  if v_req.status = 'converted' then
    raise exception 'convert_project_request: already converted' using errcode = '23505';
  end if;
  if p_name is null or char_length(btrim(p_name)) not between 1 and 120
     or p_slug !~ '^[a-z0-9][a-z0-9-]{0,48}[a-z0-9]$' then
    raise exception 'convert_project_request: invalid name or slug' using errcode = '22023';
  end if;

  loop
    v_slug := case when v_try = 1 then p_slug else left(p_slug, 44) || '-' || v_try end;
    begin
      insert into public.projects (workspace_id, name, slug, description, platforms, source_request_id)
      values (v_req.workspace_id, btrim(p_name), v_slug, v_req.summary,
              coalesce(p_platforms, '{}'), v_req.id)
      returning id into v_project;
      exit;
    exception when unique_violation then
      if v_try >= 20 then raise; end if;
      v_try := v_try + 1;
    end;
  end loop;

  -- The brief row exists already (projects_create_brief trigger).
  update public.project_briefs b set
    product_description   = coalesce(p_brief ->> 'product_description', b.product_description),
    existing_product      = coalesce(p_brief ->> 'existing_product', b.existing_product),
    target_audience       = coalesce(p_brief ->> 'target_audience', b.target_audience),
    problem               = coalesce(p_brief ->> 'problem', b.problem),
    business_requirements = coalesce(p_brief ->> 'business_requirements', b.business_requirements),
    constraints           = coalesce(p_brief ->> 'constraints', b.constraints),
    goals                 = coalesce(p_brief -> 'goals', b.goals),
    links                 = coalesce(p_brief -> 'links', b.links),
    timeline_end          = coalesce(v_req.deadline_date, b.timeline_end),
    client_input          = (select coalesce(jsonb_object_agg(k, v), '{}') from jsonb_each(p_brief) e(k, v)
                             where k in ('product_description', 'existing_product', 'target_audience', 'problem',
                                         'business_requirements', 'constraints', 'goals', 'links'))
                            || jsonb_build_object('request_code', v_req.code)
  where b.project_id = v_project;

  for v_comp in select * from public.project_request_competitors where request_id = v_req.id order by position loop
    insert into public.competitors (project_id, name, url, strengths, weaknesses, positioning, origin, position)
    values (v_project, v_comp.name, v_comp.url, v_comp.likes, v_comp.dislikes, v_comp.why, 'client', v_comp.position);
  end loop;

  perform set_config('app.converting_request', v_req.id::text, true);
  update public.project_requests set status = 'converted' where id = v_req.id;
  perform set_config('app.converting_request', '', true);

  return v_slug;
end $$;
revoke execute on function public.convert_project_request(uuid, text, text, text[], jsonb) from public, anon;
grant execute on function public.convert_project_request(uuid, text, text, text[], jsonb) to authenticated;
