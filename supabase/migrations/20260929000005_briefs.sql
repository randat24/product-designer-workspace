-- =====================================================================
-- Phase 2 · Project brief (1:1 with project) and the demo project.
-- See docs/DATABASE.md §2, docs/MVP.md §4.
-- =====================================================================

-- ---------------------------------------------------------------------
-- project_briefs
-- Long-form fields are plain text for now; they move to TipTap JSON when
-- rich text ships. Platforms live on projects and are not duplicated here.
-- ---------------------------------------------------------------------
create table public.project_briefs (
  id                     uuid primary key default gen_random_uuid(),
  workspace_id           uuid not null references public.workspaces (id) on delete cascade,
  project_id             uuid not null unique references public.projects (id) on delete cascade,
  product_description    text,
  business               text,
  target_audience        text,
  problem                text,
  goals                  jsonb not null default '[]'::jsonb check (jsonb_typeof(goals) = 'array'),
  kpis                   jsonb not null default '[]'::jsonb check (jsonb_typeof(kpis) = 'array'),
  constraints            text,
  timeline_start         date,
  timeline_end           date,
  team                   jsonb not null default '[]'::jsonb check (jsonb_typeof(team) = 'array'),
  links                  jsonb not null default '[]'::jsonb check (jsonb_typeof(links) = 'array'),
  existing_product       text,
  business_requirements  text,
  technical_constraints  text,
  created_by             uuid references public.profiles (id) default auth.uid(),
  updated_by             uuid references public.profiles (id),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  constraint project_briefs_timeline check (timeline_end is null or timeline_start is null or timeline_end >= timeline_start)
);

create trigger project_briefs_ws before insert or update of project_id on public.project_briefs
  for each row execute function public.set_workspace_from_project();
create trigger project_briefs_updated_at before update on public.project_briefs
  for each row execute function public.set_updated_at();
create trigger project_briefs_activity after update on public.project_briefs
  for each row execute function public.log_activity('project_brief');

alter table public.project_briefs enable row level security;
create policy project_briefs_select on public.project_briefs for select to authenticated
  using (public.is_workspace_member(workspace_id));
create policy project_briefs_update on public.project_briefs for update to authenticated
  using (public.is_workspace_member(workspace_id, 'editor'))
  with check (public.is_workspace_member(workspace_id, 'editor'));
-- No insert/delete policies: a brief is created with its project and dies with it.

-- Every project has exactly one brief.
create or replace function public.create_project_brief()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.project_briefs (project_id, workspace_id, created_by)
  values (new.id, new.workspace_id, auth.uid())
  on conflict (project_id) do nothing;
  return new;
end $$;
create trigger projects_create_brief after insert on public.projects
  for each row execute function public.create_project_brief();
revoke execute on function public.create_project_brief() from public, anon, authenticated;

-- Editing the brief counts as a change to the project (projects list sorts by updated_at).
create or replace function public.touch_project()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.projects set updated_at = now() where id = new.project_id;
  return null;
end $$;
create trigger project_briefs_touch_project after update on public.project_briefs
  for each row execute function public.touch_project();
revoke execute on function public.touch_project() from public, anon, authenticated;

insert into public.project_briefs (project_id, workspace_id, created_by)
select id, workspace_id, created_by from public.projects
on conflict (project_id) do nothing;

-- ---------------------------------------------------------------------
-- Demo project "Restaurant App" (docs/MVP.md §4).
-- SECURITY INVOKER: runs under the caller's RLS, so only editors can create it.
-- Later phases extend it with research, synthesis, flows, screens and decisions.
-- Returns the new project's slug.
-- ---------------------------------------------------------------------
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

  return v_slug;
end $$;
revoke execute on function public.create_demo_project(uuid) from public, anon;
grant  execute on function public.create_demo_project(uuid) to authenticated;
