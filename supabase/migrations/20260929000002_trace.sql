-- =====================================================================
-- Phase 1 · Traceability core (ADR-0001).
-- Direction is always upstream → downstream: source is closer to research,
-- target is closer to the interface. "Walk back from a screen" = follow
-- target → source.
-- =====================================================================

create type public.trace_origin as enum ('manual', 'ai_accepted', 'system');

create table public.trace_relations (
  relation        text primary key check (relation ~ '^[a-z_]+$'),
  label_forward   text not null,   -- "подтверждает"
  label_backward  text not null    -- "подтверждено"
);

insert into public.trace_relations (relation, label_forward, label_backward) values
  ('evidences',    'подтверждает',          'подтверждено'),
  ('derived_from', 'ведёт к',               'выведено из'),
  ('addresses',    'решается через',        'решает'),
  ('implements',   'реализуется в',         'реализует'),
  ('justifies',    'обосновывает',          'обосновано'),
  ('validates',    'подтверждает на тесте', 'подтверждено тестом'),
  ('invalidates',  'опровергает на тесте',  'опровергнуто тестом'),
  ('contradicts',  'противоречит',          'противоречит'),
  ('member_of',    'входит в',              'включает');

create table public.trace_relation_rules (
  source_type  text not null references public.entity_types (type) on delete cascade,
  target_type  text not null references public.entity_types (type) on delete cascade,
  relation     text not null references public.trace_relations (relation) on delete cascade,
  primary key (source_type, target_type, relation)
);

-- Allowed links. Extend in later migrations when new entity types ship.
insert into public.trace_relation_rules (source_type, target_type, relation)
select s, t, r from (values
  -- raw research → synthesis
  ('answer',      'quote',        'derived_from'),
  ('answer',      'observation',  'derived_from'),
  ('quote',       'observation',  'evidences'),
  ('observation', 'pattern',      'evidences'),
  ('quote',       'pattern',      'evidences'),
  ('quote',       'insight',      'evidences'),
  ('observation', 'insight',      'evidences'),
  ('answer',      'insight',      'evidences'),
  ('interview',   'insight',      'evidences'),
  ('pattern',     'insight',      'derived_from'),
  ('quote',       'insight',      'contradicts'),
  ('observation', 'insight',      'contradicts'),
  ('quote',       'pain_point',   'evidences'),
  ('observation', 'pain_point',   'evidences'),
  ('answer',      'pain_point',   'evidences'),
  ('competitor',  'insight',      'evidences'),
  ('competitor',  'opportunity',  'evidences'),
  -- synthesis chain
  ('insight',     'pain_point',   'derived_from'),
  ('insight',     'user_need',    'derived_from'),
  ('insight',     'opportunity',  'derived_from'),
  ('pain_point',  'opportunity',  'derived_from'),
  ('user_need',   'opportunity',  'derived_from'),
  ('participant', 'segment',      'member_of'),
  -- definition
  ('insight',     'jtbd',              'derived_from'),
  ('pain_point',  'problem_statement', 'derived_from'),
  ('insight',     'hypothesis',        'derived_from'),
  ('opportunity', 'hypothesis',        'derived_from'),
  ('pain_point',  'hypothesis',        'derived_from'),
  -- structure & design
  ('opportunity', 'feature',      'addresses'),
  ('pain_point',  'feature',      'addresses'),
  ('hypothesis',  'feature',      'addresses'),
  ('requirement', 'feature',      'implements'),
  ('feature',     'user_story',   'implements'),
  ('opportunity', 'user_flow',    'addresses'),
  ('pain_point',  'user_flow',    'addresses'),
  ('feature',     'user_flow',    'implements'),
  ('requirement', 'user_flow',    'implements'),
  ('opportunity', 'screen',       'addresses'),
  ('pain_point',  'screen',       'addresses'),
  ('feature',     'screen',       'implements'),
  ('user_flow',   'screen',       'implements'),
  ('requirement', 'screen',       'implements'),
  ('screen',      'component',    'implements'),
  -- decisions
  ('interview',      'design_decision', 'justifies'),
  ('quote',          'design_decision', 'justifies'),
  ('observation',    'design_decision', 'justifies'),
  ('insight',        'design_decision', 'justifies'),
  ('pain_point',     'design_decision', 'justifies'),
  ('opportunity',    'design_decision', 'justifies'),
  ('competitor',     'design_decision', 'justifies'),
  ('hypothesis',     'design_decision', 'justifies'),
  ('usability_test', 'design_decision', 'justifies'),
  ('test_finding',   'design_decision', 'justifies'),
  ('design_decision','screen',          'implements'),
  ('design_decision','component',       'implements'),
  ('design_decision','user_flow',       'implements'),
  -- validation
  ('test_finding',   'screen',          'invalidates'),
  ('usability_test', 'hypothesis',      'validates'),
  ('usability_test', 'hypothesis',      'invalidates'),
  ('usability_test', 'screen',          'validates'),
  ('test_finding',   'hypothesis',      'invalidates')
) as v(s, t, r);

create table public.trace_links (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  project_id    uuid not null references public.projects (id) on delete cascade,
  source_type   text not null,
  source_id     uuid not null,
  target_type   text not null,
  target_id     uuid not null,
  relation      text not null,
  note          text,
  origin        public.trace_origin not null default 'manual',
  created_by    uuid references public.profiles (id) default auth.uid(),
  created_at    timestamptz not null default now(),
  constraint trace_links_rule_fk foreign key (source_type, target_type, relation)
    references public.trace_relation_rules (source_type, target_type, relation),
  constraint trace_links_no_self check (not (source_type = target_type and source_id = target_id)),
  constraint trace_links_unique unique (project_id, source_type, source_id, target_type, target_id, relation)
);
create index trace_links_source_idx on public.trace_links (project_id, source_type, source_id);
create index trace_links_target_idx on public.trace_links (project_id, target_type, target_id);

-- Validate that both endpoints exist in the same project; derive workspace_id.
create or replace function public.trace_links_validate()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_table text;
  v_proj  uuid;
begin
  select p.workspace_id into new.workspace_id from public.projects p where p.id = new.project_id;

  foreach v_table in array array['source', 'target'] loop
    declare
      v_type text := case v_table when 'source' then new.source_type else new.target_type end;
      v_id   uuid := case v_table when 'source' then new.source_id   else new.target_id   end;
      v_tbl  text;
    begin
      select table_name into v_tbl from public.entity_types where type = v_type;
      if v_tbl is null or to_regclass('public.' || quote_ident(v_tbl)) is null then
        raise exception 'trace: entity type % is not available yet', v_type using errcode = '23503';
      end if;
      execute format('select project_id from public.%I where id = $1', v_tbl) into v_proj using v_id;
      if v_proj is distinct from new.project_id then
        raise exception 'trace: % %:% not found in project %', v_table, v_type, v_id, new.project_id
          using errcode = '23503';
      end if;
    end;
  end loop;
  return new;
end $$;

create trigger trace_links_validate before insert or update on public.trace_links
  for each row execute function public.trace_links_validate();

-- Remove links pointing at a deleted entity. Attached per traceable table.
create or replace function public.trace_cleanup()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  delete from public.trace_links
  where (source_type = tg_argv[0] and source_id = old.id)
     or (target_type = tg_argv[0] and target_id = old.id);
  return old;
end $$;

-- Walk the graph. Returns edges (not nodes) so the UI can draw chains.
-- SECURITY INVOKER: RLS on trace_links applies to the caller.
create or replace function public.trace_graph(
  p_type       text,
  p_id         uuid,
  p_direction  text default 'both',   -- 'up' | 'down' | 'both'
  p_max_depth  int  default 6
) returns table (
  link_id      uuid,
  direction    text,
  depth        int,
  relation     text,
  source_type  text,
  source_id    uuid,
  target_type  text,
  target_id    uuid,
  origin       public.trace_origin
) language sql stable as $$
  with recursive
  up as (
    select l.id, 1 as depth, l.source_type as nt, l.source_id as nid,
           array[p_type || ':' || p_id, l.source_type || ':' || l.source_id] as path
    from public.trace_links l
    where p_direction in ('up', 'both') and l.target_type = p_type and l.target_id = p_id
    union all
    select l.id, u.depth + 1, l.source_type, l.source_id, u.path || (l.source_type || ':' || l.source_id)
    from up u
    join public.trace_links l on l.target_type = u.nt and l.target_id = u.nid
    where u.depth < p_max_depth and not ((l.source_type || ':' || l.source_id) = any (u.path))
  ),
  down as (
    select l.id, 1 as depth, l.target_type as nt, l.target_id as nid,
           array[p_type || ':' || p_id, l.target_type || ':' || l.target_id] as path
    from public.trace_links l
    where p_direction in ('down', 'both') and l.source_type = p_type and l.source_id = p_id
    union all
    select l.id, d.depth + 1, l.target_type, l.target_id, d.path || (l.target_type || ':' || l.target_id)
    from down d
    join public.trace_links l on l.source_type = d.nt and l.source_id = d.nid
    where d.depth < p_max_depth and not ((l.target_type || ':' || l.target_id) = any (d.path))
  ),
  edges as (
    select id, 'up'::text as direction, min(depth) as depth from up group by id
    union all
    select id, 'down'::text, min(depth) from down group by id
  )
  select l.id, e.direction, e.depth, l.relation, l.source_type, l.source_id,
         l.target_type, l.target_id, l.origin
  from edges e join public.trace_links l on l.id = e.id
  order by e.direction, e.depth
  limit 500
$$;

-- RLS
alter table public.trace_relations      enable row level security;
alter table public.trace_relation_rules enable row level security;
alter table public.trace_links          enable row level security;

create policy trace_relations_select on public.trace_relations for select to authenticated using (true);
create policy trace_rules_select on public.trace_relation_rules for select to authenticated using (true);

create policy trace_links_select on public.trace_links for select to authenticated
  using (public.is_workspace_member(workspace_id));
create policy trace_links_insert on public.trace_links for insert to authenticated
  with check (public.is_workspace_member(workspace_id, 'editor'));
create policy trace_links_update on public.trace_links for update to authenticated
  using (public.is_workspace_member(workspace_id, 'editor'))
  with check (public.is_workspace_member(workspace_id, 'editor'));
create policy trace_links_delete on public.trace_links for delete to authenticated
  using (public.is_workspace_member(workspace_id, 'editor'));
