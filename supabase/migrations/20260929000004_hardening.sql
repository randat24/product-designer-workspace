-- =====================================================================
-- Phase 1 · Hardening after Supabase security advisor:
-- pin search_path everywhere and close RPC access to internal functions.
-- =====================================================================

alter function public.set_updated_at() set search_path = '';
alter function public.role_rank(public.workspace_role) set search_path = '';
alter function public.assign_code() set search_path = '';
alter function public.trace_graph(text, uuid, text, int) set search_path = '';
alter function public.attach_domain_table(regclass, text) set search_path = '';

-- Trigger-only functions: triggers fire without an EXECUTE check, so nobody
-- needs to call them via /rest/v1/rpc.
revoke execute on function
  public.set_updated_at(),
  public.assign_code(),
  public.add_workspace_owner(),
  public.handle_new_user(),
  public.set_workspace_from_project(),
  public.trace_links_validate(),
  public.trace_cleanup(),
  public.log_activity(),
  public.log_trace_activity()
from public, anon, authenticated;

-- Used inside RLS policies and by the app: signed-in users only.
revoke execute on function public.is_workspace_member(uuid, public.workspace_role) from public, anon;
grant  execute on function public.is_workspace_member(uuid, public.workspace_role) to authenticated;
revoke execute on function public.role_rank(public.workspace_role) from public, anon;
grant  execute on function public.role_rank(public.workspace_role) to authenticated;
revoke execute on function public.next_code(uuid, text) from public, anon;
grant  execute on function public.next_code(uuid, text) to authenticated;
revoke execute on function public.trace_graph(text, uuid, text, int) from public, anon;
grant  execute on function public.trace_graph(text, uuid, text, int) to authenticated;
