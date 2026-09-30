-- =====================================================================
-- Competitor analysis, part 2: feature matrix with cell notes, UX review
-- (Nielsen heuristics / UX laws as rows), and reminders.
-- A note on a red ("no") cell of a competitor is a reminder for our own
-- design: it shows up on screens and flows until marked done.
-- =====================================================================

-- Rows are either product features or UX criteria; both use the same cells.
alter table public.comparison_features
  add column kind text not null default 'feature' check (kind in ('feature', 'ux'));
create index comparison_features_kind_idx on public.comparison_features (project_id, kind, position);

alter table public.competitor_feature_values
  add column note_done boolean not null default false;

-- ---------------------------------------------------------------------
-- Demo: notes on the feature matrix and a Nielsen review of 3 competitors.
-- ---------------------------------------------------------------------
create or replace function public.seed_demo_review(p_project uuid)
returns void language plpgsql set search_path = '' as $$
declare
  v_maps  uuid;
  v_fork  uuid;
  v_insta uuid;
  v_own   uuid;
  v_h     uuid[];
begin
  select id into v_maps  from public.competitors where project_id = p_project and name = 'Google Maps';
  select id into v_fork  from public.competitors where project_id = p_project and name = 'TheFork';
  select id into v_insta from public.competitors where project_id = p_project and name = 'Instagram';
  select id into v_own   from public.competitors where project_id = p_project and is_own_product;
  if v_maps is null then return; end if;

  -- Notes on the feature matrix; notes on red cells are reminders for our design.
  update public.competitor_feature_values v set note = n.note
  from (values
    (v_maps,  'Фильтр по поводу',          'Ищут по кухне и рейтингу — сделать повод первым фильтром'),
    (v_maps,  'Свободные столы в выдаче',  'Свободные столы видно только после звонка — показать слоты прямо в списке'),
    (v_fork,  'Фильтр по поводу',          'Лента построена на скидках — наш повод + бронь закрывают эту дыру'),
    (v_fork,  'Фото от гостей',            'Только фото ресторана — дать гостям загружать свои'),
    (v_insta, 'Онлайн-бронь',              'Нет брони — из подборки сразу в бронь, без перехода в другое приложение'),
    (v_maps,  'Онлайн-бронь',              'Бронь через сторонние сервисы, у части мест')
  ) as n(competitor, feature, note)
  join public.comparison_features f on f.project_id = p_project and f.name = n.feature and f.kind = 'feature'
  where v.competitor_id = n.competitor and v.comparison_feature_id = f.id;

  -- Nielsen's 10 usability heuristics as UX rows.
  with h(name, pos) as (values
    ('#1 Видимость состояния системы', 1),
    ('#2 Соответствие реальному миру', 2),
    ('#3 Свобода и контроль пользователя', 3),
    ('#4 Единообразие и стандарты', 4),
    ('#5 Предотвращение ошибок', 5),
    ('#6 Узнавание, а не вспоминание', 6),
    ('#7 Гибкость и эффективность', 7),
    ('#8 Эстетичный минималистичный дизайн', 8),
    ('#9 Помощь в распознавании и исправлении ошибок', 9),
    ('#10 Справка и документация', 10))
  , ins as (
    insert into public.comparison_features (project_id, name, group_name, kind, position)
    select p_project, name, 'Эвристики Нильсена', 'ux', pos from h
    returning id, position)
  select array_agg(id order by position) into v_h from ins;

  insert into public.competitor_feature_values (competitor_id, comparison_feature_id, value, note)
  select c, v_h[i], v::public.feature_value, n
  from (values
    (v_maps, 1, 'yes', null), (v_maps, 2, 'yes', null), (v_maps, 3, 'yes', null), (v_maps, 4, 'yes', null),
    (v_maps, 5, 'partial', null), (v_maps, 6, 'yes', null), (v_maps, 7, 'yes', null),
    (v_maps, 8, 'no', 'Карточка места перегружена: 12 кнопок — у нас одно главное действие «Забронировать»'),
    (v_maps, 9, 'yes', null), (v_maps, 10, 'yes', null),
    (v_fork, 1, 'yes', null), (v_fork, 2, 'yes', null), (v_fork, 3, 'partial', null), (v_fork, 4, 'yes', null),
    (v_fork, 5, 'yes', null), (v_fork, 6, 'yes', null),
    (v_fork, 7, 'no', 'Нельзя повторить прошлую бронь в одно касание — добавить «Забронировать снова»'),
    (v_fork, 8, 'partial', null),
    (v_fork, 9, 'no', 'При занятом времени просто ошибка — предлагать ближайшие свободные слоты'),
    (v_fork, 10, 'yes', null),
    (v_insta, 1, 'yes', null), (v_insta, 2, 'yes', null), (v_insta, 3, 'yes', null), (v_insta, 4, 'yes', null),
    (v_insta, 5, 'unknown', null), (v_insta, 6, 'partial', null), (v_insta, 7, 'yes', null), (v_insta, 8, 'yes', null),
    (v_insta, 9, 'unknown', null),
    (v_insta, 10, 'no', null)
  ) as t(c, i, v, n)
  where c is not null;

  if v_own is not null then
    insert into public.competitor_feature_values (competitor_id, comparison_feature_id, value)
    select v_own, id, 'unknown' from unnest(v_h) as id;
  end if;
end $$;
revoke execute on function public.seed_demo_review(uuid) from public, anon;
grant  execute on function public.seed_demo_review(uuid) to authenticated;

create or replace function public.seed_demo_content(p_project uuid)
returns void language plpgsql set search_path = '' as $$
begin
  perform public.seed_demo_competitors(p_project);
  perform public.seed_demo_review(p_project);
  perform public.seed_demo_research(p_project);
  perform public.seed_demo_synthesis(p_project);
  perform public.seed_demo_flows(p_project);
  perform public.seed_demo_design(p_project);
end $$;
