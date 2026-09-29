-- =====================================================================
-- Phase 5 · Synthesis: quotes, observations, patterns (board columns),
-- insights, pain points, opportunities. See docs/DATABASE.md §4, ADR-0001.
-- Codes: Q-001, OBS-001, PAT-01, INS-001, PP-001, OPP-001.
-- Frequency / participant counts are computed from the trace graph.
-- =====================================================================

create type public.observation_kind as enum ('pain', 'need', 'behavior', 'emotion', 'fact', 'workaround');
create type public.confidence_level as enum ('low', 'medium', 'high');
create type public.insight_status as enum ('draft', 'validated', 'rejected');
create type public.severity_level as enum ('critical', 'high', 'medium', 'low');
create type public.opportunity_status as enum ('open', 'in_design', 'addressed', 'dropped');

-- ---------------------------------------------------------------------
-- patterns (PAT-01): columns of the synthesis board
-- ---------------------------------------------------------------------
create table public.patterns (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  project_id    uuid not null references public.projects (id) on delete cascade,
  code          text,
  title         text not null check (char_length(title) between 1 and 200),
  description   text,
  color         text check (color ~ '^s[1-7]$'),
  position      int not null default 0,
  created_by    uuid references public.profiles (id) default auth.uid(),
  updated_by    uuid references public.profiles (id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
select public.attach_domain_table('public.patterns', 'pattern');

-- ---------------------------------------------------------------------
-- quotes (Q-001): exact words of a participant, usually selected in an answer
-- ---------------------------------------------------------------------
create table public.quotes (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references public.workspaces (id) on delete cascade,
  project_id      uuid not null references public.projects (id) on delete cascade,
  code            text,
  interview_id    uuid not null references public.interviews (id) on delete cascade,
  answer_id       uuid references public.interview_answers (id) on delete set null,
  participant_id  uuid references public.participants (id) on delete cascade,
  text            text not null check (char_length(text) between 1 and 2000),
  start_offset    int check (start_offset >= 0),
  end_offset      int check (end_offset >= start_offset),
  pattern_id      uuid references public.patterns (id) on delete set null,
  position        int not null default 0,
  created_by      uuid references public.profiles (id) default auth.uid(),
  updated_by      uuid references public.profiles (id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
select public.attach_domain_table('public.quotes', 'quote');
create index quotes_interview_idx on public.quotes (interview_id);
create index quotes_pattern_idx on public.quotes (pattern_id);

-- ---------------------------------------------------------------------
-- observations (OBS-001): what the researcher noticed
-- ---------------------------------------------------------------------
create table public.observations (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references public.workspaces (id) on delete cascade,
  project_id      uuid not null references public.projects (id) on delete cascade,
  code            text,
  interview_id    uuid references public.interviews (id) on delete cascade,
  participant_id  uuid references public.participants (id) on delete cascade,
  kind            public.observation_kind not null default 'behavior',
  body_text       text not null check (char_length(body_text) between 1 and 2000),
  pattern_id      uuid references public.patterns (id) on delete set null,
  position        int not null default 0,
  created_by      uuid references public.profiles (id) default auth.uid(),
  updated_by      uuid references public.profiles (id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
select public.attach_domain_table('public.observations', 'observation');
create index observations_pattern_idx on public.observations (pattern_id);
create index observations_interview_idx on public.observations (interview_id);

-- ---------------------------------------------------------------------
-- insights, pain points, opportunities
-- ---------------------------------------------------------------------
create table public.insights (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  project_id    uuid not null references public.projects (id) on delete cascade,
  code          text,
  title         text not null check (char_length(title) between 1 and 300),
  statement     text,
  confidence    public.confidence_level not null default 'medium',
  status        public.insight_status not null default 'draft',
  origin        public.trace_origin not null default 'manual',
  created_by    uuid references public.profiles (id) default auth.uid(),
  updated_by    uuid references public.profiles (id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  archived_at   timestamptz
);
select public.attach_domain_table('public.insights', 'insight');

create table public.pain_points (
  id             uuid primary key default gen_random_uuid(),
  workspace_id   uuid not null references public.workspaces (id) on delete cascade,
  project_id     uuid not null references public.projects (id) on delete cascade,
  code           text,
  title          text not null check (char_length(title) between 1 and 300),
  description    text,
  severity       public.severity_level not null default 'medium',
  segment_label  text check (char_length(segment_label) <= 80),
  created_by     uuid references public.profiles (id) default auth.uid(),
  updated_by     uuid references public.profiles (id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  archived_at    timestamptz
);
select public.attach_domain_table('public.pain_points', 'pain_point');

create table public.opportunities (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  project_id    uuid not null references public.projects (id) on delete cascade,
  code          text,
  title         text not null check (char_length(title) between 1 and 300),
  description   text,
  hmw           text,
  impact        public.confidence_level not null default 'medium',
  effort        public.confidence_level not null default 'medium',
  status        public.opportunity_status not null default 'open',
  created_by    uuid references public.profiles (id) default auth.uid(),
  updated_by    uuid references public.profiles (id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  archived_at   timestamptz
);
select public.attach_domain_table('public.opportunities', 'opportunity');

-- ---------------------------------------------------------------------
-- Integrity: quotes/observations take project and participant from their
-- interview; the answer must be in that interview; the pattern and an
-- explicit participant must be in the same project.
-- ---------------------------------------------------------------------
create or replace function public.synthesis_refs_validate()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_iv record;
begin
  if new.interview_id is not null then
    select project_id, participant_id into v_iv from public.interviews where id = new.interview_id;
    new.project_id := v_iv.project_id;
    new.participant_id := v_iv.participant_id;
  elsif new.participant_id is not null and not exists (
    select 1 from public.participants p where p.id = new.participant_id and p.project_id = new.project_id) then
    raise exception 'synthesis: participant % is not in project %', new.participant_id, new.project_id using errcode = '23503';
  end if;

  -- Nested: observations have no answer_id, and PL/pgSQL resolves every field in an AND.
  if tg_table_name = 'quotes' then
    if new.answer_id is not null and not exists (
      select 1 from public.interview_answers a where a.id = new.answer_id and a.interview_id = new.interview_id) then
      raise exception 'synthesis: answer % is not in interview %', new.answer_id, new.interview_id using errcode = '23503';
    end if;
  end if;

  if new.pattern_id is not null and not exists (
    select 1 from public.patterns p where p.id = new.pattern_id and p.project_id = new.project_id) then
    raise exception 'synthesis: pattern % is not in project %', new.pattern_id, new.project_id using errcode = '23503';
  end if;
  return new;
end $$;
revoke execute on function public.synthesis_refs_validate() from public, anon, authenticated;

create trigger a_quotes_refs before insert or update on public.quotes
  for each row execute function public.synthesis_refs_validate();
create trigger a_observations_refs before insert or update on public.observations
  for each row execute function public.synthesis_refs_validate();

-- A quote selected in an answer is automatically traced to it.
create or replace function public.quote_link_answer()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.answer_id is not null then
    insert into public.trace_links (project_id, source_type, source_id, target_type, target_id, relation, origin, created_by)
    values (new.project_id, 'answer', new.answer_id, 'quote', new.id, 'derived_from', 'system', auth.uid())
    on conflict do nothing;
  end if;
  return null;
end $$;
create trigger quotes_link_answer after insert on public.quotes
  for each row execute function public.quote_link_answer();
revoke execute on function public.quote_link_answer() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Participants behind an entity: walk the trace graph upstream and collect
-- the participants of quotes, observations, answers and interviews.
-- SECURITY INVOKER: the caller's RLS applies.
-- ---------------------------------------------------------------------
create or replace function public.upstream_participants(p_type text, p_id uuid)
returns table (participant_id uuid) language sql stable set search_path = '' as $$
  with nodes as (
    select g.source_type as t, g.source_id as id from public.trace_graph(p_type, p_id, 'up', 6) g
    union
    select p_type, p_id
  )
  select distinct pid from (
    select q.participant_id as pid from nodes n join public.quotes q on n.t = 'quote' and q.id = n.id
    union all
    select o.participant_id from nodes n join public.observations o on n.t = 'observation' and o.id = n.id
    union all
    select i.participant_id from nodes n join public.interview_answers a on n.t = 'answer' and a.id = n.id
      join public.interviews i on i.id = a.interview_id
    union all
    select i.participant_id from nodes n join public.interviews i on n.t = 'interview' and i.id = n.id
  ) x
  where pid is not null
$$;
revoke execute on function public.upstream_participants(text, uuid) from public, anon;
grant  execute on function public.upstream_participants(text, uuid) to authenticated;

-- Per-entity numbers for lists: direct sources (unsupported when 0) and
-- unique participants upstream (= frequency for pain points).
create or replace function public.synthesis_stats(p_project uuid)
returns table (entity_type text, entity_id uuid, source_count int, participant_count int)
language sql stable set search_path = '' as $$
  select e.t, e.id,
    (select count(*)::int from public.trace_links l
      where l.target_type = e.t and l.target_id = e.id and l.relation in ('evidences', 'derived_from')),
    (select count(*)::int from public.upstream_participants(e.t, e.id))
  from (
    select 'insight'::text as t, id from public.insights where project_id = p_project
    union all select 'pain_point', id from public.pain_points where project_id = p_project
    union all select 'opportunity', id from public.opportunities where project_id = p_project
  ) e
$$;
revoke execute on function public.synthesis_stats(uuid) from public, anon;
grant  execute on function public.synthesis_stats(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- Demo synthesis on top of the demo research (docs/MVP.md §4):
-- quotes → observations → 3 patterns → 3 insights → 2 pain points → 1 opportunity.
-- ---------------------------------------------------------------------
create or replace function public.seed_demo_synthesis(p_project uuid)
returns void language plpgsql set search_path = '' as $$
declare
  v_pat   uuid[];
  v_q     uuid[] := '{}';
  v_o     uuid[] := '{}';
  v_ins   uuid[] := '{}';
  v_pp    uuid[] := '{}';
  v_opp   uuid;
  v_id    uuid;
  r       record;
begin
  insert into public.patterns (project_id, title, color, position) values
    (p_project, 'Ресторан — повод для встречи', 's1', 1),
    (p_project, 'Выбор по кухне и атмосфере', 's3', 2),
    (p_project, 'Мало свободного времени', 's6', 3);
  select array_agg(id order by position) into v_pat from public.patterns where project_id = p_project;

  -- Quotes: exact fragments of demo answers.
  for r in select * from (values
    (1, 'Ретушёр', 'С какой целью', 'Ходит не чтобы поесть, а когда есть повод'),
    (2, 'Дизайнер', 'С какой целью', 'После шопинга — чтобы завершить день.'),
    (3, 'Продакт-менеджер', 'С какой целью', 'свидания — в разных местах'),
    (4, 'Исследователь', 'В какие рестораны', 'Грузинская кухня.'),
    (5, 'Визажист, бровист', 'С какой целью', 'С друзьями, с мужем'),
    (6, 'Менеджер проектов', 'Как часто', 'Раньше — почти каждый день в кофейнях. Сейчас реже.')
  ) as t(n, role, question, fragment) loop
    insert into public.quotes (project_id, interview_id, answer_id, text, start_offset, end_offset, position)
    select p_project, a.interview_id, a.id, r.fragment,
           strpos(a.body_text, r.fragment) - 1, strpos(a.body_text, r.fragment) - 1 + char_length(r.fragment), r.n
    from public.interview_answers a
    join public.interviews i on i.id = a.interview_id
    join public.participants p on p.id = i.participant_id
    join public.interview_questions q on q.id = a.question_id
    where p.project_id = p_project and p.role = r.role and q.text like r.question || '%'
      and strpos(a.body_text, r.fragment) > 0
    limit 1
    returning id into v_id;
    v_q := v_q || v_id;
  end loop;

  -- Observations clustered into patterns.
  for r in select * from (values
    (1, 'Визажист, бровист', 'behavior', 'Ходит в рестораны с друзьями и партнёром', 1),
    (2, 'Ретушёр',           'need',     'Нужен повод, чтобы пойти в ресторан', 1),
    (3, 'Продакт-менеджер',  'behavior', 'Выбирает место под формат встречи: обед, посиделки, свидание', 1),
    (4, 'Исследователь',     'behavior', 'Ориентируется на кухню: грузинская, азиатская', 2),
    (5, 'Менеджер проектов', 'need',     'Ищет уютные места с атмосферой', 2),
    (6, 'Менеджер проектов', 'fact',     'Стала реже ходить в кофейни', 3),
    (7, 'Продакт-аналитик',  'pain',     'Свободное время съедают переработки', 3)
  ) as t(n, role, kind, body, pat) loop
    insert into public.observations (project_id, interview_id, kind, body_text, pattern_id, position)
    select p_project, i.id, r.kind::public.observation_kind, r.body, v_pat[r.pat], r.n
    from public.interviews i join public.participants p on p.id = i.participant_id
    where p.project_id = p_project and p.role = r.role
    limit 1
    returning id into v_id;
    v_o := v_o || v_id;
  end loop;

  insert into public.insights (project_id, title, statement, confidence, status) values
    (p_project, 'Ресторан выбирают под повод встречи',
     'Для большинства участников ресторан — способ провести время с друзьями или партнёром, а не просто поесть. Выбор места зависит от формата встречи.',
     'high', 'validated')
  returning id into v_id; v_ins := v_ins || v_id;
  insert into public.insights (project_id, title, statement, confidence, status) values
    (p_project, 'Кухня и атмосфера важнее рейтинга',
     'Участники описывают любимые места через кухню и уют, а не через оценки и отзывы.', 'medium', 'draft')
  returning id into v_id; v_ins := v_ins || v_id;
  insert into public.insights (project_id, title, statement, confidence, status) values
    (p_project, 'На долгий выбор нет времени',
     'У занятых участников мало свободного времени, поэтому поиск места должен занимать минуты.', 'low', 'draft')
  returning id into v_id; v_ins := v_ins || v_id;

  insert into public.pain_points (project_id, title, description, severity, segment_label) values
    (p_project, 'Сложно подобрать место под конкретный повод',
     'Сервисы ищут по кухне и рейтингу, а люди думают о формате встречи.', 'high', 'Ходят часто')
  returning id into v_id; v_pp := v_pp || v_id;
  insert into public.pain_points (project_id, title, description, severity) values
    (p_project, 'На выбор уходит слишком много времени',
     'Приходится сверять отзывы и фото в нескольких сервисах.', 'medium')
  returning id into v_id; v_pp := v_pp || v_id;

  insert into public.opportunities (project_id, title, description, hmw, impact, effort, status) values
    (p_project, 'Подбор ресторана под повод',
     'Фильтр и подборки «свидание», «деловой обед», «с друзьями» на первом экране.',
     'Как мы могли бы помочь выбрать место под повод встречи за пару минут?', 'high', 'medium', 'open')
  returning id into v_opp;

  insert into public.trace_links (project_id, source_type, source_id, target_type, target_id, relation)
  select p_project, s_type, s_id, t_type, t_id, rel from (values
    -- quote → observation
    ('quote', v_q[5], 'observation', v_o[1], 'evidences'),
    ('quote', v_q[1], 'observation', v_o[2], 'evidences'),
    ('quote', v_q[3], 'observation', v_o[3], 'evidences'),
    ('quote', v_q[4], 'observation', v_o[4], 'evidences'),
    ('quote', v_q[6], 'observation', v_o[6], 'evidences'),
    -- pattern / evidence → insights
    ('pattern', v_pat[1], 'insight', v_ins[1], 'derived_from'),
    ('observation', v_o[1], 'insight', v_ins[1], 'evidences'),
    ('observation', v_o[2], 'insight', v_ins[1], 'evidences'),
    ('observation', v_o[3], 'insight', v_ins[1], 'evidences'),
    ('quote', v_q[1], 'insight', v_ins[1], 'evidences'),
    ('quote', v_q[2], 'insight', v_ins[1], 'evidences'),
    ('pattern', v_pat[2], 'insight', v_ins[2], 'derived_from'),
    ('observation', v_o[4], 'insight', v_ins[2], 'evidences'),
    ('observation', v_o[5], 'insight', v_ins[2], 'evidences'),
    ('observation', v_o[7], 'insight', v_ins[3], 'evidences'),
    -- pain points
    ('insight', v_ins[1], 'pain_point', v_pp[1], 'derived_from'),
    ('observation', v_o[3], 'pain_point', v_pp[1], 'evidences'),
    ('quote', v_q[3], 'pain_point', v_pp[1], 'evidences'),
    ('insight', v_ins[3], 'pain_point', v_pp[2], 'derived_from'),
    ('observation', v_o[7], 'pain_point', v_pp[2], 'evidences'),
    -- opportunity
    ('pain_point', v_pp[1], 'opportunity', v_opp, 'derived_from'),
    ('insight', v_ins[1], 'opportunity', v_opp, 'derived_from')
  ) as l(s_type, s_id, t_type, t_id, rel)
  where s_id is not null and t_id is not null;
end $$;
revoke execute on function public.seed_demo_synthesis(uuid) from public, anon;
grant  execute on function public.seed_demo_synthesis(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- Demo content is now filled by one function that later phases redefine,
-- so create_demo_project no longer has to be repeated in every migration.
-- ---------------------------------------------------------------------
create or replace function public.seed_demo_content(p_project uuid)
returns void language plpgsql set search_path = '' as $$
begin
  perform public.seed_demo_competitors(p_project);
  perform public.seed_demo_research(p_project);
  perform public.seed_demo_synthesis(p_project);
end $$;
revoke execute on function public.seed_demo_content(uuid) from public, anon;
grant  execute on function public.seed_demo_content(uuid) to authenticated;

create or replace function public.create_demo_project(p_workspace uuid)
returns text language plpgsql set search_path = '' as $$
declare
  v_project uuid;
  v_slug    text;
  v_n       int := 1;
begin
  if not public.is_workspace_member(p_workspace, 'editor') then
    raise exception 'create_demo_project: no write access to workspace %', p_workspace using errcode = '42501';
  end if;

  loop
    v_slug := case when v_n = 1 then 'restaurant-app' else 'restaurant-app-' || v_n end;
    exit when not exists (select 1 from public.projects where workspace_id = p_workspace and slug = v_slug);
    v_n := v_n + 1;
  end loop;

  insert into public.projects (workspace_id, name, slug, description, platforms)
  values (p_workspace, 'Restaurant App', v_slug,
          'Демо-проект: мобильное приложение для поиска ресторанов под конкретный повод.',
          array['ios', 'android'])
  returning id into v_project;

  update public.project_briefs set
    product_description = 'Мобильное приложение, которое помогает быстро выбрать ресторан под повод: деловой обед, свидание, встреча с друзьями. Пользователь задаёт условия (район, бюджет, кухня, время), видит подходящие места на карте и в списке и бронирует столик в пару касаний.',
    business = 'Доход — комиссия ресторанов за подтверждённые бронирования и платное продвижение в выдаче. На старте — один город, 300 ресторанов-партнёров.',
    target_audience = 'Работающие горожане 25–40 лет, которые 2–4 раза в месяц выбирают место для встречи и не хотят тратить на это больше 5 минут. Среди них — люди с плотным графиком: менеджеры, дизайнеры, специалисты на фрилансе.',
    problem = 'Выбор ресторана занимает 15–30 минут: отзывы разбросаны по нескольким сервисам, фильтры не учитывают повод, а наличие свободного столика видно только после звонка.',
    goals = '["Сократить время выбора ресторана до 5 минут", "Сделать бронирование доступным без звонка", "Проверить, что фильтр по поводу помогает выбору"]'::jsonb,
    kpis = '[{"name": "Время от открытия до брони", "target": "≤ 5 мин", "current": "~20 мин"}, {"name": "Конверсия поиска в бронь", "target": "15%", "current": ""}, {"name": "Повторные брони за 30 дней", "target": "40%", "current": ""}]'::jsonb,
    constraints = 'Команда из 5 человек, MVP за 4 месяца. Партнёрская интеграция бронирования есть только у части ресторанов.',
    timeline_start = date '2026-10-01',
    timeline_end = date '2027-01-31',
    team = '[{"name": "Анна", "role": "Продуктовый дизайнер"}, {"name": "Илья", "role": "Продакт-менеджер"}, {"name": "Марина", "role": "iOS-разработчик"}]'::jsonb,
    links = '[{"title": "Материалы исследования", "url": "https://example.com/research"}]'::jsonb,
    existing_product = 'Нет, продукт делается с нуля. Сейчас пользователи выбирают через карты, агрегаторы отзывов и советы друзей.',
    business_requirements = 'Вход по номеру телефона. Бронирование у ресторанов-партнёров, для остальных — звонок из приложения.',
    technical_constraints = 'Нативные приложения iOS и Android; карта — сторонний SDK; бронирование через API партнёров.'
  where project_id = v_project;

  perform public.seed_demo_content(v_project);

  return v_slug;
end $$;
revoke execute on function public.create_demo_project(uuid) from public, anon;
grant  execute on function public.create_demo_project(uuid) to authenticated;
