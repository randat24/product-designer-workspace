-- SECURITY DEFINER functions live in `internal`, out of the API; `public` keeps invoker wrappers with the same grants.
begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

select is(
  (select string_agg(p.oid::regprocedure::text, ', ' order by 1) from pg_proc p
   where p.pronamespace = 'public'::regnamespace and p.prosecdef
     and (has_function_privilege('anon', p.oid, 'execute') or has_function_privilege('authenticated', p.oid, 'execute'))),
  null, 'no SECURITY DEFINER function in public is callable by anon or authenticated (advisor lints 0028/0029)');

select ok(not has_schema_privilege('anon', 'internal', 'create'), 'visitors cannot create anything in internal');

select ok(has_function_privilege('anon', 'public.site_profile()', 'execute'), 'visitors still read the site profile');
select ok(has_function_privilege('anon', 'public.submit_project_request(jsonb, text, text, uuid)', 'execute'),
  'visitors still send project requests');
select ok(not has_function_privilege('anon', 'public.restore_project(uuid, jsonb)', 'execute'),
  'visitors cannot restore projects through the wrapper');
select ok(not has_function_privilege('anon', 'public.is_workspace_member(uuid, public.workspace_role)', 'execute'),
  'visitors cannot call the membership helper');
select ok(has_function_privilege('authenticated', 'public.next_code(uuid, text)', 'execute'),
  'signed-in users still get codes');

select ok(
  (select bool_and(pg_get_expr(pol.polqual, pol.polrelid) like '%internal.is_workspace_member%')
   from pg_policy pol where pol.polname like '%select%' and pg_get_expr(pol.polqual, pol.polrelid) like '%is_workspace_member%'),
  'policies call the helper in internal directly');
select ok(pg_get_functiondef('public.attach_domain_table(regclass, text)'::regprocedure) not like '%public.is_workspace_member(%',
  'tables attached later get policies on the internal helper too');

select * from finish();
rollback;
