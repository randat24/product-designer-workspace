-- =====================================================================
-- Phase 4 · Research: plans, interview guides (8 sections), participants,
-- interviews and answers. See docs/DATABASE.md §3.
-- Codes: RP-01, P01, INT-01, ANS-0001. Guides and questions are project
-- tables without codes.
-- =====================================================================

create type public.research_method as enum ('interview', 'usability', 'survey', 'diary', 'other');
create type public.research_status as enum ('draft', 'active', 'done');
create type public.guide_section as enum
  ('intro', 'context', 'current_behavior', 'problems', 'motivation', 'experience', 'expectations', 'closing');
create type public.interview_mode as enum ('in_person', 'remote', 'phone');
create type public.interview_status as enum ('planned', 'in_progress', 'done', 'synthesized');

-- ---------------------------------------------------------------------
-- research_plans (RP-01)
-- ---------------------------------------------------------------------
create table public.research_plans (
  id                   uuid primary key default gen_random_uuid(),
  workspace_id         uuid not null references public.workspaces (id) on delete cascade,
  project_id           uuid not null references public.projects (id) on delete cascade,
  code                 text,
  title                text not null check (char_length(title) between 1 and 200),
  goal                 text,
  questions            jsonb not null default '[]'::jsonb check (jsonb_typeof(questions) = 'array'),
  hypotheses_text      text,
  audience             text,
  method               public.research_method not null default 'interview',
  participants_target  int check (participants_target between 1 and 500),
  success_criteria     text,
  status               public.research_status not null default 'draft',
  created_by           uuid references public.profiles (id) default auth.uid(),
  updated_by           uuid references public.profiles (id),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  archived_at          timestamptz
);
select public.attach_domain_table('public.research_plans', 'research_plan');

-- ---------------------------------------------------------------------
-- interview_guides + interview_questions
-- ---------------------------------------------------------------------
create table public.interview_guides (
  id                uuid primary key default gen_random_uuid(),
  workspace_id      uuid not null references public.workspaces (id) on delete cascade,
  project_id        uuid not null references public.projects (id) on delete cascade,
  research_plan_id  uuid references public.research_plans (id) on delete set null,
  title             text not null check (char_length(title) between 1 and 200),
  intro             text,
  outro             text,
  created_by        uuid references public.profiles (id) default auth.uid(),
  updated_by        uuid references public.profiles (id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
select public.attach_project_table('public.interview_guides', 'interview_guide');

create table public.interview_questions (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  project_id    uuid not null references public.projects (id) on delete cascade,
  guide_id      uuid not null references public.interview_guides (id) on delete cascade,
  section       public.guide_section not null default 'context',
  position      int not null default 0,
  text          text not null check (char_length(text) between 1 and 1000),
  probes        text[] not null default '{}',
  is_key        boolean not null default false,
  created_by    uuid references public.profiles (id) default auth.uid(),
  updated_by    uuid references public.profiles (id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
select public.attach_project_table('public.interview_questions', 'interview_question');
create index interview_questions_guide_idx on public.interview_questions (guide_id, section, position);

-- ---------------------------------------------------------------------
-- participants (P01) — PII stays here and never leaves via AI context
-- ---------------------------------------------------------------------
create table public.participants (
  id             uuid primary key default gen_random_uuid(),
  workspace_id   uuid not null references public.workspaces (id) on delete cascade,
  project_id     uuid not null references public.projects (id) on delete cascade,
  code           text,
  display_name   text check (char_length(display_name) <= 120),
  role           text check (char_length(role) <= 200),
  segment_label  text check (char_length(segment_label) <= 80),
  age_range      text check (char_length(age_range) <= 40),
  context        text,
  contact        text check (char_length(contact) <= 300),
  consent_at     timestamptz,
  tags           text[] not null default '{}',
  notes          text,
  created_by     uuid references public.profiles (id) default auth.uid(),
  updated_by     uuid references public.profiles (id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  archived_at    timestamptz
);
select public.attach_domain_table('public.participants', 'participant');

-- ---------------------------------------------------------------------
-- interviews (INT-01)
-- ---------------------------------------------------------------------
create table public.interviews (
  id                uuid primary key default gen_random_uuid(),
  workspace_id      uuid not null references public.workspaces (id) on delete cascade,
  project_id        uuid not null references public.projects (id) on delete cascade,
  code              text,
  participant_id    uuid not null references public.participants (id) on delete cascade,
  guide_id          uuid references public.interview_guides (id) on delete set null,
  research_plan_id  uuid references public.research_plans (id) on delete set null,
  conducted_at      timestamptz,
  duration_min      int check (duration_min between 1 and 600),
  interviewer_id    uuid references public.profiles (id) default auth.uid(),
  mode              public.interview_mode not null default 'remote',
  status            public.interview_status not null default 'planned',
  notes             text,
  created_by        uuid references public.profiles (id) default auth.uid(),
  updated_by        uuid references public.profiles (id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
select public.attach_domain_table('public.interviews', 'interview');
create index interviews_participant_idx on public.interviews (participant_id);
create index interviews_guide_idx on public.interviews (guide_id);

-- ---------------------------------------------------------------------
-- interview_answers (ANS-0001). question_id null = free note.
-- ---------------------------------------------------------------------
create table public.interview_answers (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  project_id    uuid not null references public.projects (id) on delete cascade,
  code          text,
  interview_id  uuid not null references public.interviews (id) on delete cascade,
  question_id   uuid references public.interview_questions (id) on delete set null,
  body_text     text not null default '' check (char_length(body_text) <= 20000),
  position      int not null default 0,
  created_by    uuid references public.profiles (id) default auth.uid(),
  updated_by    uuid references public.profiles (id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
select public.attach_domain_table('public.interview_answers', 'answer');
create unique index interview_answers_one_per_question on public.interview_answers (interview_id, question_id)
  where question_id is not null;

-- ---------------------------------------------------------------------
-- Same-project integrity for every reference between research rows.
-- Children take project_id from their parent; foreign parents are rejected.
-- ---------------------------------------------------------------------
create or replace function public.research_refs_validate()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_proj uuid;
begin
  if tg_table_name = 'interview_questions' then
    select project_id into v_proj from public.interview_guides where id = new.guide_id;
    new.project_id := v_proj;
  elsif tg_table_name = 'interview_answers' then
    select project_id into v_proj from public.interviews where id = new.interview_id;
    new.project_id := v_proj;
    if new.question_id is not null and not exists (
      select 1 from public.interview_questions q where q.id = new.question_id and q.project_id = v_proj) then
      raise exception 'research: question % is not in the interview''s project', new.question_id using errcode = '23503';
    end if;
  elsif tg_table_name = 'interviews' then
    select project_id into v_proj from public.participants where id = new.participant_id;
    new.project_id := v_proj;
    if new.guide_id is not null and not exists (
      select 1 from public.interview_guides g where g.id = new.guide_id and g.project_id = v_proj) then
      raise exception 'research: guide % is not in the participant''s project', new.guide_id using errcode = '23503';
    end if;
    if new.research_plan_id is not null and not exists (
      select 1 from public.research_plans r where r.id = new.research_plan_id and r.project_id = v_proj) then
      raise exception 'research: plan % is not in the participant''s project', new.research_plan_id using errcode = '23503';
    end if;
  elsif tg_table_name = 'interview_guides' then
    if new.research_plan_id is not null and not exists (
      select 1 from public.research_plans r where r.id = new.research_plan_id and r.project_id = new.project_id) then
      raise exception 'research: plan % is not in the guide''s project', new.research_plan_id using errcode = '23503';
    end if;
  end if;
  return new;
end $$;
revoke execute on function public.research_refs_validate() from public, anon, authenticated;

-- "a_" sorts before the "_ws" trigger that derives workspace_id from project_id.
create trigger a_questions_refs before insert or update on public.interview_questions
  for each row execute function public.research_refs_validate();
create trigger a_answers_refs before insert or update on public.interview_answers
  for each row execute function public.research_refs_validate();
create trigger a_interviews_refs before insert or update on public.interviews
  for each row execute function public.research_refs_validate();
create trigger a_guides_refs before insert or update on public.interview_guides
  for each row execute function public.research_refs_validate();

-- ---------------------------------------------------------------------
-- Demo research from the "Designer's notebook" materials (docs/MVP.md §4).
-- ---------------------------------------------------------------------
create or replace function public.seed_demo_research(p_project uuid)
returns void language plpgsql set search_path = '' as $$
declare
  v_plan  uuid;
  v_guide uuid;
  v_q     uuid[];
  v_p     uuid;
  v_i     uuid;
  r       record;
  a       text;
  n       int;
begin
  insert into public.research_plans (project_id, title, goal, questions, hypotheses_text, audience, method,
    participants_target, success_criteria, status)
  values (p_project, 'Как люди выбирают ресторан',
    'Понять, как горожане выбирают ресторан под повод и где теряют время.',
    '["Как часто и с кем люди ходят в рестораны?", "По каким признакам выбирают место?", "Что мешает быстро принять решение?"]'::jsonb,
    'Ресторан выбирают под повод, а не под кухню. Главная потеря времени — сверка отзывов в разных сервисах.',
    'Работающие горожане 25–40 лет, которые ходят в кафе и рестораны хотя бы раз в месяц.',
    'interview', 7,
    'Проведено 7 интервью, по каждому исследовательскому вопросу есть повторяющиеся ответы у 3+ участников.',
    'done')
  returning id into v_plan;

  insert into public.interview_guides (project_id, research_plan_id, title, intro, outro)
  values (p_project, v_plan, 'Выбор ресторана',
    'Здравствуйте! Меня зовут Анна, я дизайнер. Мы делаем приложение для выбора ресторанов и хотим лучше понять, как вы выбираете, куда пойти. Интервью займёт около 30 минут. Правильных и неправильных ответов нет — нам важен ваш опыт.',
    'Спасибо! Можно ли связаться с вами ещё раз, если появятся вопросы? Есть ли что-то, что вы хотели бы добавить?')
  returning id into v_guide;

  with q(section, pos, txt, probes, is_key) as (values
    ('context'::public.guide_section,          1, 'Чем вы увлекаетесь?', array[]::text[], false),
    ('current_behavior'::public.guide_section, 1, 'Как вы предпочитаете проводить свободное время?', array['С кем?', 'Где?'], false),
    ('current_behavior'::public.guide_section, 2, 'Как часто вы ходите в рестораны?', array['А в кофейни?', 'Когда это было в последний раз?'], true),
    ('current_behavior'::public.guide_section, 3, 'В какие рестораны ходите?', array['Какая кухня?', 'Как вы нашли это место?'], true),
    ('motivation'::public.guide_section,       1, 'С какой целью ходите в рестораны?', array['С кем обычно?', 'Что было поводом в последний раз?'], true))
  , ins as (
    insert into public.interview_questions (guide_id, project_id, section, position, text, probes, is_key)
    select v_guide, p_project, section, pos, txt, probes, is_key from q
    returning id, section, position)
  select array_agg(id order by section, position) into v_q from ins;

  n := 0;
  for r in select * from (values
    ('Визажист, бровист', 'Ходят иногда', 'Своей работой — люблю делать людей красивыми, вещами для интерьера, разными стилями музыки', 'Гуляет с собакой, сидит в интернете', 'Раз в месяц. Кофейни — раз в неделю', 'Грузинская, японская кухня', 'С друзьями, с мужем'),
    ('Дизайнер', 'Ходят иногда', '', 'Фильмы, сериалы, прогулки, спорт, музыка, PlayStation', 'Раз в две недели. Чаще всего на выходных', 'Разная, европейская', 'С друзьями после работы вечером, на выходных с девушкой. После шопинга — чтобы завершить день.'),
    ('Продакт-менеджер', 'Ходят часто', 'Бег, групповые занятия в зале, английский, испанский, статистика, математика, пианино, горы, сноуборд', 'С друзьями, с коллегами на кофе. Учится, смотрит видео про стартапы, Netflix', 'Если с кофе — каждый день. В рестораны в среднем 2 раза в неделю', 'Разные. Тайская кухня. Винные бары', 'Разные: пообедать, иногда заказ еды, вечерние посиделки, свидания — в разных местах.'),
    ('Исследователь', 'Ходят иногда', 'Чтение книг, работа', 'YouTube, фильмы и сериалы, TikTok, Instagram, книги, прогулки', 'Пообедать — редко, несколько раз в месяц. С парнем или компанией — около 5 раз в месяц.', 'Бары, кальянные, «Пузата хата» рядом. Грузинская кухня.', 'С подругами, с парнем. Если на работе — пообедать.'),
    ('Продакт-аналитик', 'Ходят часто', 'Ходит в горы, дважды в неделю встречается с друзьями. Летом — горы, зимой — катание. Учёба, аспирантура, профильные ивенты', 'Свободное время — переработки, книги, сериалы, время с девушкой. Увлёкся байком.', '1–2 раза в неделю', 'На Подоле, на Оболони', 'Выпить чай, поесть. Редко — пообедать. Иногда завтрак в «Пузатой хате».'),
    ('Ретушёр', 'Ходят иногда', 'Машины, фотография и ретушь, курсы, мышление', 'Гуляет с собакой, с друзьями', 'До карантина — раз в месяц. Кофе не пьёт, только перекусить.', 'Суши, бургеры', 'Ходит не чтобы поесть, а когда есть повод'),
    ('Менеджер проектов', 'Ходят часто', 'Любит читать, активный отдых (походы, зимние виды спорта), раньше играла на гитаре и занималась танцами. Любит поесть.', 'Общение с друзьями, интернет, музыка, подкасты, видео, сериалы и фильмы', 'Раньше — почти каждый день в кофейнях. Сейчас реже.', 'Уютные кофейни. Азиатская кухня. Популярные места в городе.', '')
  ) as t(role, segment, a1, a2, a3, a4, a5) loop
    n := n + 1;
    insert into public.participants (project_id, role, segment_label, context, consent_at, tags)
    values (p_project, r.role, r.segment, 'Киев, работает в офисе или гибридно.', now(), array['киев'])
    returning id into v_p;

    insert into public.interviews (project_id, participant_id, guide_id, research_plan_id, conducted_at, duration_min, mode, status)
    values (p_project, v_p, v_guide, v_plan, timestamptz '2026-09-14 10:00+03' + (n || ' days')::interval, 30 + n * 2, 'remote', 'done')
    returning id into v_i;

    for k in 1..5 loop
      a := (array[r.a1, r.a2, r.a3, r.a4, r.a5])[k];
      if a <> '' then
        insert into public.interview_answers (project_id, interview_id, question_id, body_text, position)
        values (p_project, v_i, v_q[k], a, k);
      end if;
    end loop;
  end loop;
end $$;
revoke execute on function public.seed_demo_research(uuid) from public, anon;
grant  execute on function public.seed_demo_research(uuid) to authenticated;

-- The demo project gets research too. Body as in 006 plus one call.
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
  perform public.seed_demo_research(v_project);

  return v_slug;
end $$;
revoke execute on function public.create_demo_project(uuid) from public, anon;
grant  execute on function public.create_demo_project(uuid) to authenticated;
