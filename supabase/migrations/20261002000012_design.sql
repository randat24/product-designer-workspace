-- =====================================================================
-- Phase 8a · Screens and Decision Log.
-- screen_states: loading / empty / error… per screen (status missing →
-- designed / not needed). design_decisions (DEC-001): context, decision,
-- reason, alternatives, status, superseded by; evidence via trace_links.
-- See docs/DATABASE.md §8, §11.
-- =====================================================================

create type public.screen_state_kind as enum
  ('default', 'loading', 'empty', 'error', 'success', 'disabled', 'permission_denied', 'offline', 'partial');
create type public.screen_state_status as enum ('missing', 'designed', 'n_a');
create type public.decision_status as enum ('proposed', 'accepted', 'superseded', 'rejected');

-- ---------------------------------------------------------------------
-- screen_states: owned by a screen (no codes)
-- ---------------------------------------------------------------------
create table public.screen_states (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  project_id    uuid not null references public.projects (id) on delete cascade,
  screen_id     uuid not null references public.screens (id) on delete cascade,
  kind          public.screen_state_kind not null,
  description   text check (char_length(description) <= 1000),
  figma_url     text check (figma_url ~ '^https?://'),
  status        public.screen_state_status not null default 'missing',
  position      int not null default 0,
  created_by    uuid references public.profiles (id) default auth.uid(),
  updated_by    uuid references public.profiles (id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (screen_id, kind)
);
select public.attach_project_table('public.screen_states', 'screen_state');

create or replace function public.screen_state_refs()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  select project_id into new.project_id from public.screens where id = new.screen_id;
  return new;
end $$;
revoke execute on function public.screen_state_refs() from public, anon, authenticated;
create trigger a_screen_states_refs before insert or update on public.screen_states
  for each row execute function public.screen_state_refs();

-- Every screen starts with the states a spec must answer for.
create or replace function public.screen_default_states()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.screen_states (project_id, screen_id, kind, position)
  select new.project_id, new.id, k, ord
  from unnest(array['default', 'loading', 'empty', 'error', 'success']::public.screen_state_kind[]) with ordinality as t(k, ord)
  on conflict do nothing;
  return null;
end $$;
revoke execute on function public.screen_default_states() from public, anon, authenticated;
create trigger screens_default_states after insert on public.screens
  for each row execute function public.screen_default_states();

-- Screens created in Phase 7a get the same checklist.
insert into public.screen_states (project_id, screen_id, kind, position)
select s.project_id, s.id, k, ord
from public.screens s,
     unnest(array['default', 'loading', 'empty', 'error', 'success']::public.screen_state_kind[]) with ordinality as t(k, ord)
on conflict do nothing;

-- Screen previews live in attachments (entity_type 'screen'), like competitor screenshots.
create trigger screens_attachments_cleanup after delete on public.screens
  for each row execute function public.attachments_cleanup('screen');

-- ---------------------------------------------------------------------
-- design_decisions (DEC-001)
-- ---------------------------------------------------------------------
create table public.design_decisions (
  id                uuid primary key default gen_random_uuid(),
  workspace_id      uuid not null references public.workspaces (id) on delete cascade,
  project_id        uuid not null references public.projects (id) on delete cascade,
  code              text,
  title             text not null check (char_length(title) between 1 and 300),
  context           text,
  decision          text,
  reason            text,
  alternatives      jsonb not null default '[]'::jsonb check (jsonb_typeof(alternatives) = 'array'),
  status            public.decision_status not null default 'proposed',
  decided_at        date,
  author_id         uuid references public.profiles (id) on delete set null default auth.uid(),
  superseded_by_id  uuid references public.design_decisions (id) on delete set null,
  created_by        uuid references public.profiles (id) default auth.uid(),
  updated_by        uuid references public.profiles (id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  archived_at       timestamptz
);
select public.attach_domain_table('public.design_decisions', 'design_decision');
create index design_decisions_superseded_idx on public.design_decisions (superseded_by_id);
create index design_decisions_author_idx on public.design_decisions (author_id);

-- The replacing decision is in the same project; pointing to it marks this one superseded.
create or replace function public.decision_validate()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.superseded_by_id is not null then
    if new.superseded_by_id = new.id or not exists (
      select 1 from public.design_decisions d where d.id = new.superseded_by_id and d.project_id = new.project_id) then
      raise exception 'decisions: % cannot supersede %', new.superseded_by_id, new.id using errcode = '23503';
    end if;
    new.status := 'superseded';
  elsif tg_op = 'UPDATE' and old.superseded_by_id is not null and new.status = 'superseded' then
    new.status := 'accepted';
  end if;
  return new;
end $$;
revoke execute on function public.decision_validate() from public, anon, authenticated;
create trigger a_design_decisions_validate before insert or update on public.design_decisions
  for each row execute function public.decision_validate();

-- ---------------------------------------------------------------------
-- Numbers for lists. SECURITY INVOKER: the caller's RLS applies.
-- ---------------------------------------------------------------------
create or replace function public.screen_stats(p_project uuid)
returns table (screen_id uuid, missing_states int, flows text[], upstream int, decisions int)
language sql stable set search_path = '' as $$
  select s.id,
    (select count(*)::int from public.screen_states st
      where st.screen_id = s.id and st.status = 'missing' and st.kind in ('loading', 'empty', 'error')),
    coalesce((select array_agg(distinct f.code order by f.code) from public.flow_nodes n
      join public.user_flows f on f.id = n.flow_id where n.screen_id = s.id), '{}'),
    (select count(*)::int from public.trace_links l
      where l.target_type = 'screen' and l.target_id = s.id and l.relation in ('addresses', 'implements')),
    (select count(*)::int from public.trace_links l
      where l.target_type = 'screen' and l.target_id = s.id and l.source_type = 'design_decision')
  from public.screens s
  where s.project_id = p_project
$$;
revoke execute on function public.screen_stats(uuid) from public, anon;
grant  execute on function public.screen_stats(uuid) to authenticated;

create or replace function public.decision_stats(p_project uuid)
returns table (decision_id uuid, evidence int, targets int)
language sql stable set search_path = '' as $$
  select d.id,
    (select count(*)::int from public.trace_links l
      where l.target_type = 'design_decision' and l.target_id = d.id and l.relation = 'justifies'),
    (select count(*)::int from public.trace_links l
      where l.source_type = 'design_decision' and l.source_id = d.id and l.relation = 'implements')
  from public.design_decisions d
  where d.project_id = p_project
$$;
revoke execute on function public.decision_stats(uuid) from public, anon;
grant  execute on function public.decision_stats(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- Demo: specs and states for the 3 demo screens, 1 decision (docs/MVP.md §4).
-- ---------------------------------------------------------------------
create or replace function public.seed_demo_design(p_project uuid)
returns void language plpgsql set search_path = '' as $$
declare
  v_map   uuid;
  v_card  uuid;
  v_phone uuid;
  v_dec   uuid;
begin
  select id into v_phone from public.screens where project_id = p_project and name = 'Профиль по телефону';
  select id into v_map   from public.screens where project_id = p_project and name = 'Карта и список';
  select id into v_card  from public.screens where project_id = p_project and name = 'Карточка ресторана';
  if v_map is null then return; end if;

  update public.screens set
    entry_points = 'После входа; из вкладки «Поиск»; по кнопке «Назад» из карточки ресторана.',
    primary_action = 'Открыть карточку подходящего ресторана',
    secondary_actions = 'Сменить повод, переключить карту/список, изменить район',
    content_hierarchy = '["Повод встречи (чипы)", "Карта с метками", "Список ресторанов: фото, кухня, чек, расстояние", "Фильтры"]'::jsonb,
    permissions = 'Геолокация — по запросу; без неё показываем центр города.',
    analytics_events = '[{"name": "occasion_selected", "trigger": "Тап по чипу повода", "props": "occasion"}, {"name": "restaurant_opened", "trigger": "Тап по ресторану", "props": "restaurant_id, position"}]'::jsonb,
    api_data_requirements = 'GET /restaurants?occasion=&lat=&lng=&radius= — список с координатами, кухней, средним чеком и свободными слотами.'
  where id = v_map;
  update public.screens set
    entry_points = 'Из «Карты и списка», из подборок, по ссылке от друга.',
    primary_action = 'Забронировать столик',
    secondary_actions = 'Позвонить, построить маршрут, поделиться',
    content_hierarchy = '["Фото и название", "Подходит для: поводы", "Свободное время сегодня", "Меню и чек", "Отзывы"]'::jsonb
  where id = v_card;
  update public.screens set
    primary_action = 'Получить код по SMS',
    permissions = 'Нет'
  where id = v_phone;

  update public.screen_states set status = 'designed', description = 'Скелетоны карточек и меток на карте.'
    where screen_id = v_map and kind = 'loading';
  update public.screen_states set status = 'designed', description = 'Нет мест под повод рядом — предлагаем расширить радиус или сменить повод.'
    where screen_id = v_map and kind = 'empty';
  update public.screen_states set status = 'designed' where screen_id = v_map and kind = 'default';
  update public.screen_states set status = 'n_a' where screen_id = v_map and kind = 'success';
  update public.screen_states set status = 'designed' where screen_id = v_phone and kind in ('default', 'loading', 'error');
  update public.screen_states set status = 'designed' where screen_id = v_card and kind = 'default';

  insert into public.design_decisions (project_id, title, context, decision, reason, alternatives, status, decided_at)
  values (p_project, 'Повод встречи — главный фильтр на первом экране',
    'Участники выбирают ресторан под формат встречи, а сервисы предлагают фильтры по кухне и рейтингу.',
    'На «Карте и списке» первым рядом показываем чипы поводов: «Свидание», «Деловой обед», «С друзьями», «С детьми». Кухня и чек — во вторичных фильтрах.',
    'Пять из семи участников описали выбор через повод; это главная боль PP-001 и возможность OPP-001.',
    '[{"option": "Фильтр по кухне первым, как в агрегаторах", "why_rejected": "Не отвечает на вопрос «куда пойти на свидание», участники описывают выбор иначе"}, {"option": "Подборки на главной вместо фильтра", "why_rejected": "Подборки редакционные и быстро устаревают; фильтр работает на всех ресторанах"}]'::jsonb,
    'accepted', date '2026-10-20')
  returning id into v_dec;

  insert into public.trace_links (project_id, source_type, source_id, target_type, target_id, relation)
  select p_project, s_type, s_id, t_type, t_id, rel from (
    select 'insight' as s_type, i.id as s_id, 'design_decision' as t_type, v_dec as t_id, 'justifies' as rel
      from public.insights i where i.project_id = p_project and i.title = 'Ресторан выбирают под повод встречи'
    union all
    select 'pain_point', p.id, 'design_decision', v_dec, 'justifies'
      from public.pain_points p where p.project_id = p_project and p.title = 'Сложно подобрать место под конкретный повод'
    union all
    select 'quote', q.id, 'design_decision', v_dec, 'justifies'
      from public.quotes q where q.project_id = p_project and q.text = 'свидания — в разных местах'
    union all
    select 'design_decision', v_dec, 'screen', v_map, 'implements'
    union all
    select 'opportunity', o.id, 'screen', v_map, 'addresses'
      from public.opportunities o where o.project_id = p_project and o.title = 'Подбор ресторана под повод'
  ) l;
end $$;
revoke execute on function public.seed_demo_design(uuid) from public, anon;
grant  execute on function public.seed_demo_design(uuid) to authenticated;

create or replace function public.seed_demo_content(p_project uuid)
returns void language plpgsql set search_path = '' as $$
begin
  perform public.seed_demo_competitors(p_project);
  perform public.seed_demo_research(p_project);
  perform public.seed_demo_synthesis(p_project);
  perform public.seed_demo_flows(p_project);
  perform public.seed_demo_design(p_project);
end $$;
