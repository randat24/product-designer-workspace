-- 009: tuning after the Supabase advisors ran against the cloud project.
-- No schema or behaviour changes: policies are rewritten with the same logic,
-- and indexes are added for foreign keys that are joined, filtered or cascaded on.

-- 1. RLS: evaluate auth.uid() once per statement, not once per row (lint 0003_auth_rls_initplan).
drop policy profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated using (
  id = (select auth.uid()) or exists (
    select 1 from public.workspace_members mine
    join public.workspace_members theirs on theirs.workspace_id = mine.workspace_id
    where mine.user_id = (select auth.uid()) and theirs.user_id = profiles.id)
);

drop policy profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy workspaces_select on public.workspaces;
create policy workspaces_select on public.workspaces for select to authenticated
  using (owner_id = (select auth.uid()) or public.is_workspace_member(id));

drop policy workspaces_insert on public.workspaces;
create policy workspaces_insert on public.workspaces for insert to authenticated
  with check (owner_id = (select auth.uid()) and is_personal = false);

drop policy members_delete on public.workspace_members;
create policy members_delete on public.workspace_members for delete to authenticated
  using (public.is_workspace_member(workspace_id, 'owner') or user_id = (select auth.uid()));

-- 2. Supabase creates rls_auto_enable() (an event-trigger function) in public on new projects.
--    It is not meant to be called over the API; event triggers do not need EXECUTE.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;

-- 3. Foreign-key indexes (lint 0001). Audit columns (created_by, updated_by, actor_id,
--    invited_by) and static lookup tables are left out on purpose: they are never filtered
--    on and profiles are not deleted in the MVP.
create index if not exists workspaces_owner_idx                on public.workspaces (owner_id);
create index if not exists activity_log_workspace_idx          on public.activity_log (workspace_id);
create index if not exists attachments_project_idx             on public.attachments (project_id);
create index if not exists attachments_workspace_idx           on public.attachments (workspace_id);
create index if not exists project_briefs_workspace_idx        on public.project_briefs (workspace_id);
create index if not exists competitors_workspace_idx           on public.competitors (workspace_id);
create index if not exists comparison_features_workspace_idx   on public.comparison_features (workspace_id);
create index if not exists cfv_feature_idx                     on public.competitor_feature_values (comparison_feature_id);
create index if not exists cfv_workspace_idx                   on public.competitor_feature_values (workspace_id);
create index if not exists research_plans_workspace_idx        on public.research_plans (workspace_id);
create index if not exists interview_guides_plan_idx           on public.interview_guides (research_plan_id);
create index if not exists interview_guides_workspace_idx      on public.interview_guides (workspace_id);
create index if not exists interview_questions_workspace_idx   on public.interview_questions (workspace_id);
create index if not exists participants_workspace_idx          on public.participants (workspace_id);
create index if not exists interviews_plan_idx                 on public.interviews (research_plan_id);
create index if not exists interviews_interviewer_idx          on public.interviews (interviewer_id);
create index if not exists interviews_workspace_idx            on public.interviews (workspace_id);
create index if not exists interview_answers_question_idx      on public.interview_answers (question_id);
create index if not exists interview_answers_workspace_idx     on public.interview_answers (workspace_id);
create index if not exists quotes_answer_idx                   on public.quotes (answer_id);
create index if not exists quotes_participant_idx              on public.quotes (participant_id);
create index if not exists quotes_workspace_idx                on public.quotes (workspace_id);
create index if not exists observations_participant_idx        on public.observations (participant_id);
create index if not exists observations_workspace_idx          on public.observations (workspace_id);
create index if not exists patterns_workspace_idx              on public.patterns (workspace_id);
create index if not exists insights_workspace_idx              on public.insights (workspace_id);
create index if not exists pain_points_workspace_idx           on public.pain_points (workspace_id);
create index if not exists opportunities_workspace_idx         on public.opportunities (workspace_id);
create index if not exists trace_links_workspace_idx           on public.trace_links (workspace_id);
