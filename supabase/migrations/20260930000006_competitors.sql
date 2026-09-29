-- =====================================================================
-- Phase 3 · Competitors: cards, comparison matrix (with "our product"),
-- screenshots via attachments + Storage. See docs/DATABASE.md §2.
-- =====================================================================

-- ---------------------------------------------------------------------
-- attach_project_table: platform wiring for project tables that are not
-- traceable entities (no code, no trace links): workspace derivation,
-- updated_at, activity log, index, RLS (read — member, write — editor).
-- ---------------------------------------------------------------------
create or replace function public.attach_project_table(p_table regclass, p_activity_type text)
returns void language plpgsql set search_path = '' as $$
declare
  v_name text := (select relname from pg_class where oid = p_table);
begin
  execute format('create trigger %I before insert or update of project_id on %s
                  for each row execute function public.set_workspace_from_project()', v_name || '_ws', p_table);
  execute format('create trigger %I before update on %s
                  for each row execute function public.set_updated_at()', v_name || '_updated_at', p_table);
  execute format('create trigger %I after insert or update or delete on %s
                  for each row execute function public.log_activity(%L)', v_name || '_activity', p_table, p_activity_type);
  execute format('create index %I on %s (project_id)', v_name || '_project_idx', p_table);

  execute format('alter table %s enable row level security', p_table);
  execute format('create policy %I on %s for select to authenticated using (public.is_workspace_member(workspace_id))',
                 v_name || '_select', p_table);
  execute format('create policy %I on %s for insert to authenticated with check (public.is_workspace_member(workspace_id, ''editor''))',
                 v_name || '_insert', p_table);
  execute format('create policy %I on %s for update to authenticated using (public.is_workspace_member(workspace_id, ''editor'')) with check (public.is_workspace_member(workspace_id, ''editor''))',
                 v_name || '_update', p_table);
  execute format('create policy %I on %s for delete to authenticated using (public.is_workspace_member(workspace_id, ''editor''))',
                 v_name || '_delete', p_table);
end $$;
revoke all on function public.attach_project_table(regclass, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- competitors (traceable: CP-01)
-- "Our product" is a row with is_own_product = true so it joins the matrix.
-- ---------------------------------------------------------------------
create type public.competitor_kind as enum ('direct', 'indirect', 'substitute');

create table public.competitors (
  id                uuid primary key default gen_random_uuid(),
  workspace_id      uuid not null references public.workspaces (id) on delete cascade,
  project_id        uuid not null references public.projects (id) on delete cascade,
  code              text,
  name              text not null check (char_length(name) between 1 and 120),
  url               text,
  kind              public.competitor_kind not null default 'direct',
  is_own_product    boolean not null default false,
  positioning       text,
  target_audience   text,
  pricing           text,
  onboarding_notes  text,
  navigation_notes  text,
  ux_patterns       text,
  ui_patterns       text,
  strengths         text,
  weaknesses        text,
  reviews_summary   text,
  opportunities     text,
  borrow            text,
  position          int not null default 0,
  created_by        uuid references public.profiles (id) default auth.uid(),
  updated_by        uuid references public.profiles (id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  archived_at       timestamptz
);
select public.attach_domain_table('public.competitors', 'competitor');
create unique index competitors_one_own_product on public.competitors (project_id) where is_own_product;

-- ---------------------------------------------------------------------
-- Comparison matrix: rows (features) × columns (competitors) → value
-- ---------------------------------------------------------------------
create table public.comparison_features (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  project_id    uuid not null references public.projects (id) on delete cascade,
  name          text not null check (char_length(name) between 1 and 200),
  group_name    text,
  position      int not null default 0,
  created_by    uuid references public.profiles (id) default auth.uid(),
  updated_by    uuid references public.profiles (id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
select public.attach_project_table('public.comparison_features', 'comparison_feature');

create type public.feature_value as enum ('yes', 'partial', 'no', 'unknown');

create table public.competitor_feature_values (
  competitor_id          uuid not null references public.competitors (id) on delete cascade,
  comparison_feature_id  uuid not null references public.comparison_features (id) on delete cascade,
  workspace_id           uuid not null references public.workspaces (id) on delete cascade,
  project_id             uuid not null references public.projects (id) on delete cascade,
  value                  public.feature_value not null default 'unknown',
  note                   text check (char_length(note) <= 500),
  updated_by             uuid references public.profiles (id) default auth.uid(),
  updated_at             timestamptz not null default now(),
  primary key (competitor_id, comparison_feature_id)
);
create index competitor_feature_values_project_idx on public.competitor_feature_values (project_id);

-- Project and workspace come from the competitor; the feature must be in the same project.
create or replace function public.feature_values_validate()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  select c.project_id, c.workspace_id into new.project_id, new.workspace_id
  from public.competitors c where c.id = new.competitor_id;
  if not exists (select 1 from public.comparison_features f
                 where f.id = new.comparison_feature_id and f.project_id = new.project_id) then
    raise exception 'matrix: feature % is not in the competitor''s project', new.comparison_feature_id
      using errcode = '23503';
  end if;
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end $$;
create trigger competitor_feature_values_validate before insert or update on public.competitor_feature_values
  for each row execute function public.feature_values_validate();
revoke execute on function public.feature_values_validate() from public, anon, authenticated;

alter table public.competitor_feature_values enable row level security;
create policy cfv_select on public.competitor_feature_values for select to authenticated
  using (public.is_workspace_member(workspace_id));
create policy cfv_insert on public.competitor_feature_values for insert to authenticated
  with check (public.is_workspace_member(workspace_id, 'editor'));
create policy cfv_update on public.competitor_feature_values for update to authenticated
  using (public.is_workspace_member(workspace_id, 'editor'))
  with check (public.is_workspace_member(workspace_id, 'editor'));
create policy cfv_delete on public.competitor_feature_values for delete to authenticated
  using (public.is_workspace_member(workspace_id, 'editor'));

-- ---------------------------------------------------------------------
-- Attachments: files (screenshots) attached to any entity. The file lives in
-- Storage bucket "attachments" at <project_id>/<entity_type>/<uuid>.<ext>.
-- ---------------------------------------------------------------------
create table public.attachments (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  project_id    uuid not null references public.projects (id) on delete cascade,
  entity_type   text not null references public.entity_types (type),
  entity_id     uuid not null,
  storage_path  text not null unique,
  file_name     text not null check (char_length(file_name) between 1 and 255),
  mime_type     text not null check (mime_type in ('image/png', 'image/jpeg', 'image/webp', 'image/gif')),
  size_bytes    int not null check (size_bytes between 1 and 10485760),
  caption       text check (char_length(caption) <= 300),
  position      int not null default 0,
  created_by    uuid references public.profiles (id) default auth.uid(),
  created_at    timestamptz not null default now(),
  constraint attachments_path_in_project check (storage_path like project_id::text || '/%')
);
create index attachments_entity_idx on public.attachments (entity_type, entity_id);

-- The owning entity must exist in the same project.
create or replace function public.attachments_validate()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_tbl  text;
  v_proj uuid;
begin
  select p.workspace_id into new.workspace_id from public.projects p where p.id = new.project_id;
  select table_name into v_tbl from public.entity_types where type = new.entity_type;
  if v_tbl is null or to_regclass('public.' || quote_ident(v_tbl)) is null then
    raise exception 'attachments: entity type % is not available yet', new.entity_type using errcode = '23503';
  end if;
  execute format('select project_id from public.%I where id = $1', v_tbl) into v_proj using new.entity_id;
  if v_proj is distinct from new.project_id then
    raise exception 'attachments: %:% not found in project %', new.entity_type, new.entity_id, new.project_id
      using errcode = '23503';
  end if;
  return new;
end $$;
create trigger attachments_validate before insert or update on public.attachments
  for each row execute function public.attachments_validate();
revoke execute on function public.attachments_validate() from public, anon, authenticated;

-- Deleting an entity drops its attachment rows (files are removed by the app).
create or replace function public.attachments_cleanup()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  delete from public.attachments where entity_type = tg_argv[0] and entity_id = old.id;
  return old;
end $$;
create trigger competitors_attachments_cleanup after delete on public.competitors
  for each row execute function public.attachments_cleanup('competitor');
revoke execute on function public.attachments_cleanup() from public, anon, authenticated;

alter table public.attachments enable row level security;
create policy attachments_select on public.attachments for select to authenticated
  using (public.is_workspace_member(workspace_id));
create policy attachments_insert on public.attachments for insert to authenticated
  with check (public.is_workspace_member(workspace_id, 'editor'));
create policy attachments_update on public.attachments for update to authenticated
  using (public.is_workspace_member(workspace_id, 'editor'))
  with check (public.is_workspace_member(workspace_id, 'editor'));
create policy attachments_delete on public.attachments for delete to authenticated
  using (public.is_workspace_member(workspace_id, 'editor'));

-- ---------------------------------------------------------------------
-- Storage: private bucket, access by project membership from the path.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('attachments', 'attachments', false, 10485760, array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

-- First path segment is the project id.
create or replace function public.can_access_project_file(p_name text, p_min_role public.workspace_role)
returns boolean language plpgsql stable security definer set search_path = '' as $$
declare
  v_ws uuid;
begin
  if split_part(p_name, '/', 1) !~ '^[0-9a-f-]{36}$' then return false; end if;
  select workspace_id into v_ws from public.projects where id = split_part(p_name, '/', 1)::uuid;
  return v_ws is not null and public.is_workspace_member(v_ws, p_min_role);
end $$;
revoke execute on function public.can_access_project_file(text, public.workspace_role) from public, anon;
grant  execute on function public.can_access_project_file(text, public.workspace_role) to authenticated;

create policy attachments_files_select on storage.objects for select to authenticated
  using (bucket_id = 'attachments' and public.can_access_project_file(name, 'viewer'));
create policy attachments_files_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'attachments' and public.can_access_project_file(name, 'editor'));
create policy attachments_files_update on storage.objects for update to authenticated
  using (bucket_id = 'attachments' and public.can_access_project_file(name, 'editor'))
  with check (bucket_id = 'attachments' and public.can_access_project_file(name, 'editor'));
create policy attachments_files_delete on storage.objects for delete to authenticated
  using (bucket_id = 'attachments' and public.can_access_project_file(name, 'editor'));

-- ---------------------------------------------------------------------
-- Demo project: competitors and a filled matrix.
-- ---------------------------------------------------------------------
create or replace function public.seed_demo_competitors(p_project uuid)
returns void language plpgsql set search_path = '' as $$
declare
  v_own uuid; v_maps uuid; v_fork uuid; v_insta uuid;
  v_f   uuid[];
begin
  insert into public.competitors (project_id, name, kind, is_own_product, positioning, position)
  values (p_project, 'Restaurant App', 'direct', true, 'Выбор ресторана под повод и бронь в пару касаний.', 0)
  returning id into v_own;

  insert into public.competitors (project_id, name, url, kind, positioning, target_audience, pricing,
    onboarding_notes, navigation_notes, strengths, weaknesses, reviews_summary, opportunities, borrow, position)
  values (p_project, 'Google Maps', 'https://maps.google.com', 'indirect',
    'Карты с каталогом заведений и отзывами.', 'Все, кто ищет место поблизости.', 'Бесплатно',
    'Без онбординга: сразу карта.', 'Поиск сверху, карточка места снизу листом.',
    'Огромная база мест и отзывов, маршрут до ресторана в один тап.',
    'Нет фильтра по поводу, бронь — только у части мест и через сторонние сервисы.',
    'Хвалят полноту базы, ругают накрученные оценки.',
    'Фильтр «по поводу» и честная подборка вместо бесконечной выдачи.',
    'Нижний лист с карточкой поверх карты.', 1)
  returning id into v_maps;

  insert into public.competitors (project_id, name, url, kind, positioning, target_audience, pricing,
    onboarding_notes, strengths, weaknesses, reviews_summary, opportunities, borrow, position)
  values (p_project, 'TheFork', 'https://www.thefork.com', 'direct',
    'Онлайн-бронирование ресторанов со скидками.', 'Горожане, которые бронируют заранее.', 'Бесплатно для гостей, комиссия с ресторанов',
    'Выбор города, затем лента акций.',
    'Бронь без звонка, подтверждение за секунды, программа лояльности.',
    'Выдача построена вокруг скидок, а не повода; мало мест за пределами партнёров.',
    'Нравится скорость брони, раздражают навязчивые акции.',
    'Показывать свободные столы прямо в выдаче.',
    'Выбор времени и числа гостей одним экраном.', 2)
  returning id into v_fork;

  insert into public.competitors (project_id, name, url, kind, positioning, strengths, weaknesses, opportunities, position)
  values (p_project, 'Instagram', 'https://instagram.com', 'substitute',
    'Выбирают по фото и советам блогеров.',
    'Живые фото интерьера и блюд, доверие к знакомым.',
    'Нет поиска по условиям, информация устаревает.',
    'Фотографии от гостей вместо рекламных.', 3)
  returning id into v_insta;

  with f(name, grp, pos) as (values
    ('Поиск на карте', 'Поиск', 1),
    ('Фильтр по поводу', 'Поиск', 2),
    ('Фильтр по бюджету', 'Поиск', 3),
    ('Онлайн-бронь', 'Бронирование', 4),
    ('Свободные столы в выдаче', 'Бронирование', 5),
    ('Отзывы гостей', 'Доверие', 6),
    ('Фото от гостей', 'Доверие', 7))
  , ins as (
    insert into public.comparison_features (project_id, name, group_name, position)
    select p_project, name, grp, pos from f
    returning id, position)
  select array_agg(id order by position) into v_f from ins;

  insert into public.competitor_feature_values (competitor_id, comparison_feature_id, value)
  select c, v_f[i], v::public.feature_value
  from (values
    (v_own, 1, 'yes'), (v_own, 2, 'yes'), (v_own, 3, 'yes'), (v_own, 4, 'yes'), (v_own, 5, 'yes'), (v_own, 6, 'partial'), (v_own, 7, 'no'),
    (v_maps, 1, 'yes'), (v_maps, 2, 'no'), (v_maps, 3, 'partial'), (v_maps, 4, 'partial'), (v_maps, 5, 'no'), (v_maps, 6, 'yes'), (v_maps, 7, 'yes'),
    (v_fork, 1, 'partial'), (v_fork, 2, 'no'), (v_fork, 3, 'yes'), (v_fork, 4, 'yes'), (v_fork, 5, 'yes'), (v_fork, 6, 'yes'), (v_fork, 7, 'partial'),
    (v_insta, 1, 'no'), (v_insta, 2, 'no'), (v_insta, 3, 'no'), (v_insta, 4, 'no'), (v_insta, 5, 'no'), (v_insta, 6, 'partial'), (v_insta, 7, 'yes')
  ) as t(c, i, v);
end $$;
revoke execute on function public.seed_demo_competitors(uuid) from public, anon;
grant  execute on function public.seed_demo_competitors(uuid) to authenticated;

-- Demo project now also gets competitors. Same body as in 005 plus one call.
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

  perform public.seed_demo_competitors(v_project);

  return v_slug;
end $$;
revoke execute on function public.create_demo_project(uuid) from public, anon;
grant  execute on function public.create_demo_project(uuid) to authenticated;
