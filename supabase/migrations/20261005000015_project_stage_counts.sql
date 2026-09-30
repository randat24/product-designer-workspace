-- Stage progress of a project in one call (docs/QUALITY_REVIEW.md, A4). The project shell used to load
-- twelve full lists to compute a few percentages; this returns just the counts. The rules mirror
-- src/domains/projects/progress.ts and the list queries (archived rows excluded where lists exclude them).
-- Security invoker (default): RLS decides what the caller may count.

create or replace function public.project_stage_counts(p_project uuid)
returns jsonb
language sql stable set search_path = '' as $$
  with
  latest_interview as (
    -- Research progress counts the latest interview of each active participant.
    select distinct on (i.participant_id) i.status
    from public.interviews i
    join public.participants p on p.id = i.participant_id and p.archived_at is null
    where i.project_id = p_project
    order by i.participant_id, i.created_at desc
  ),
  sourced as (
    select l.target_type, l.target_id
    from public.trace_links l
    where l.project_id = p_project and l.relation in ('evidences', 'derived_from')
    group by l.target_type, l.target_id
  )
  select jsonb_build_object(
    'competitors_assessed', (select count(*) from public.competitors c
      where c.project_id = p_project and c.archived_at is null and not c.is_own_product
        and (coalesce(c.strengths, '') <> '' or coalesce(c.weaknesses, '') <> '')),
    'interviews_conducted', (select count(*) from latest_interview where status in ('done', 'synthesized')),
    'research_target', (select r.participants_target from public.research_plans r
      where r.project_id = p_project and r.archived_at is null and r.participants_target is not null
      order by r.created_at limit 1),
    'cards_total', (select count(*) from public.quotes q where q.project_id = p_project)
      + (select count(*) from public.observations o where o.project_id = p_project),
    'cards_sorted', (select count(*) from public.quotes q where q.project_id = p_project and q.pattern_id is not null)
      + (select count(*) from public.observations o where o.project_id = p_project and o.pattern_id is not null),
    'insights_total', (select count(*) from public.insights x where x.project_id = p_project and x.archived_at is null),
    'insights_sourced', (select count(*) from public.insights x where x.project_id = p_project and x.archived_at is null
      and exists (select 1 from sourced s where s.target_type = 'insight' and s.target_id = x.id)),
    'pain_points_total', (select count(*) from public.pain_points x where x.project_id = p_project and x.archived_at is null),
    'pain_points_sourced', (select count(*) from public.pain_points x where x.project_id = p_project and x.archived_at is null
      and exists (select 1 from sourced s where s.target_type = 'pain_point' and s.target_id = x.id)),
    'opportunities', (select count(*) from public.opportunities x where x.project_id = p_project and x.archived_at is null),
    'flows_total', (select count(*) from public.user_flows f where f.project_id = p_project),
    'flows_complete', (select count(*) from public.user_flows f where f.project_id = p_project
      and not exists (select 1 from public.flow_edge_cases c where c.flow_id = f.id and c.status = 'missing')),
    'screens_total', (select count(*) from public.screens s where s.project_id = p_project and s.archived_at is null),
    'screens_complete', (select count(*) from public.screens s where s.project_id = p_project and s.archived_at is null
      and not exists (select 1 from public.screen_states st where st.screen_id = s.id and st.status = 'missing'
        and st.kind in ('loading', 'empty', 'error'))),
    'decisions_total', (select count(*) from public.design_decisions d where d.project_id = p_project and d.archived_at is null),
    'decisions_evidenced', (select count(*) from public.design_decisions d where d.project_id = p_project and d.archived_at is null
      and exists (select 1 from public.trace_links l where l.target_type = 'design_decision' and l.target_id = d.id
        and l.relation = 'justifies'))
  )
$$;
revoke execute on function public.project_stage_counts(uuid) from public, anon;
grant  execute on function public.project_stage_counts(uuid) to authenticated;
