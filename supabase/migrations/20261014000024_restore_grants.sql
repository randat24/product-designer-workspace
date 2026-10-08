-- Restore functions: no access without signing in. Supabase grants execute on new public functions to anon and
-- authenticated directly, so 023's "revoke … from public" left them open. restore_project already refused a
-- guest (no workspace membership); now the call itself is closed, as for the other functions. The helpers
-- run only inside restore_project, so nobody calls them directly.
revoke execute on function public.restore_project(uuid, jsonb) from anon;
revoke execute on function public.restore_remap(jsonb, jsonb) from anon, authenticated;
revoke execute on function public.restore_row(text, jsonb, jsonb, uuid, uuid) from anon, authenticated;
revoke execute on function public.restore_insert(text, jsonb) from anon, authenticated;
