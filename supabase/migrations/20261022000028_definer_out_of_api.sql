-- SECURITY DEFINER functions leave the API schema (Supabase advisor lints 0028 / 0029).
--
-- PostgREST exposes every function in `public`. The ones below run with the owner's rights and are meant to be
-- called by visitors (site, intake form, notes) or by signed-in users (RLS helpers, request → project, restore).
-- Their bodies move to schema `internal`, which PostgREST does not expose; `public` keeps a SECURITY INVOKER
-- wrapper with the same name, arguments, volatility and grants, so the app, the generated types, RLS policies
-- (they point at the function itself, not its name) and other functions calling `public.<name>` work unchanged.
-- What a caller may do is still decided inside the function: the server secret, the brief token, the role checks.
--
-- A new SECURITY DEFINER function goes into `internal` (revoke execute from public there, grant to the roles
-- that need it), with a wrapper in `public` only if the app calls it through the API.

create schema if not exists internal;
revoke all on schema internal from public;
grant usage on schema internal to anon, authenticated, service_role;

do $$
declare
  f regprocedure;
  v_name text;
  v_args text;
  v_ident text;
  v_result text;
  v_vol text;
  v_call text;
  v_role text;
begin
  foreach f in array array[
    -- RLS / storage helpers and the code counter (signed-in users)
    'public.is_workspace_member(uuid, public.workspace_role)',
    'public.can_access_project_file(text, public.workspace_role)',
    'public.can_write_note_file(text)',
    'public.next_code(uuid, text)',
    -- tool actions (signed-in users)
    'public.convert_project_request(uuid, text, text, text[], jsonb)',
    'public.restore_project(uuid, jsonb)',
    -- public site, intake form, notes (visitors)
    'public.site_profile()',
    'public.site_notes()',
    'public.note_react(integer, text, boolean, text, text)',
    'public.submit_project_request(jsonb, text, text, uuid)',
    'public.get_request_brief(text)'
  ]::regprocedure[] loop
    select p.proname,
           pg_get_function_arguments(p.oid),
           pg_get_function_identity_arguments(p.oid),
           pg_get_function_result(p.oid),
           case p.provolatile when 'i' then 'immutable' when 's' then 'stable' else 'volatile' end,
           coalesce((select string_agg('$' || i, ', ') from generate_series(1, p.pronargs) i), '')
      into v_name, v_args, v_ident, v_result, v_vol, v_call
      from pg_proc p where p.oid = f;

    execute format('alter function %s set schema internal', f);

    execute format(
      'create function public.%I(%s) returns %s language sql %s security invoker set search_path = '''' '
      'as $w$ select internal.%I(%s) $w$',
      v_name, v_args, v_result, v_vol, v_name, v_call);

    -- Same grants as the body: Supabase's default privileges would otherwise open the wrapper to anon.
    execute format('revoke all on function public.%I(%s) from public, anon, authenticated', v_name, v_ident);
    for v_role in
      select r.rolname from pg_roles r
      where r.rolname in ('anon', 'authenticated', 'service_role') and has_function_privilege(r.oid, f, 'execute')
    loop
      execute format('grant execute on function public.%I(%s) to %I', v_name, v_ident, v_role);
    end loop;
  end loop;
end $$;

-- Policies made by attach_*_table() from now on call the helper directly, like the existing ones.
do $$
declare f regprocedure;
begin
  foreach f in array array[
    'public.attach_domain_table(regclass, text)',
    'public.attach_project_table(regclass, text)'
  ]::regprocedure[] loop
    execute replace(pg_get_functiondef(f), 'public.is_workspace_member(', 'internal.is_workspace_member(');
  end loop;
end $$;

notify pgrst, 'reload schema';
