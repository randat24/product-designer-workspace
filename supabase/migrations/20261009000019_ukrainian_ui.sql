-- =====================================================================
-- The tool speaks Ukrainian (owner decision, 2026-10-01): the public site stays uk/en, the workspace
-- (/app, /w/…) is Ukrainian only. This migration moves the texts the database itself produces:
--  - the default name of a new personal workspace (and renames the ones still called by the old default);
--  - trace relation labels;
--  - the demo project («Відкрити демо-проєкт»): same structure and links, Ukrainian content.
-- Existing projects keep their content as written.
-- =====================================================================

update public.trace_relations r set label_forward = v.f, label_backward = v.b
from (values
  ('evidences',    'підтверджує',            'підтверджено'),
  ('derived_from', 'веде до',                'виведено з'),
  ('addresses',    'розв''язується через',   'розв''язує'),
  ('implements',   'реалізується в',         'реалізує'),
  ('justifies',    'обґрунтовує',            'обґрунтовано'),
  ('validates',    'підтверджує на тесті',   'підтверджено тестом'),
  ('invalidates',  'спростовує на тесті',    'спростовано тестом'),
  ('contradicts',  'суперечить',             'суперечить'),
  ('member_of',    'входить до',             'включає')
) as v(relation, f, b)
where r.relation = v.relation;

update public.workspaces set name = 'Особистий простір' where name = 'Личное пространство';

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_base text;
  v_name text;
begin
  v_name := coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''),
                     split_part(coalesce(new.email, 'user'), '@', 1));

  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, v_name, new.raw_user_meta_data ->> 'avatar_url');

  v_base := lower(regexp_replace(split_part(coalesce(new.email, 'user'), '@', 1), '[^a-zA-Z0-9]+', '-', 'g'));
  v_base := trim(both '-' from left(v_base, 30));
  if v_base = '' then v_base := 'ws'; end if;

  insert into public.workspaces (name, slug, owner_id, is_personal)
  values ('Особистий простір', v_base || '-' || substr(md5(new.id::text), 1, 6), new.id, true);

  return new;
end $$;

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
          'Демо-проєкт: мобільний застосунок для пошуку ресторанів під конкретний привід.',
          array['ios', 'android'])
  returning id into v_project;

  update public.project_briefs set
    product_description = 'Мобільний застосунок, який допомагає швидко обрати ресторан під привід: діловий обід, побачення, зустріч із друзями. Користувач задає умови (район, бюджет, кухня, час), бачить відповідні місця на карті й у списку та бронює столик за кілька дотиків.',
    business = 'Дохід — комісія ресторанів за підтверджені бронювання і платне просування у видачі. На старті — одне місто, 300 ресторанів-партнерів.',
    target_audience = 'Містяни 25–40 років, які працюють і 2–4 рази на місяць обирають місце для зустрічі та не хочуть витрачати на це більше 5 хвилин. Серед них — люди зі щільним графіком: менеджери, дизайнери, фахівці на фрилансі.',
    problem = 'Вибір ресторану забирає 15–30 хвилин: відгуки розкидані по кількох сервісах, фільтри не враховують привід, а вільний столик видно лише після дзвінка.',
    goals = '["Скоротити час вибору ресторану до 5 хвилин", "Зробити бронювання доступним без дзвінка", "Перевірити, що фільтр за приводом допомагає вибору"]'::jsonb,
    kpis = '[{"name": "Час від відкриття до бронювання", "target": "≤ 5 хв", "current": "~20 хв"}, {"name": "Конверсія пошуку в бронювання", "target": "15%", "current": ""}, {"name": "Повторні бронювання за 30 днів", "target": "40%", "current": ""}]'::jsonb,
    constraints = 'Команда з 5 людей, MVP за 4 місяці. Партнерська інтеграція бронювання є лише в частини ресторанів.',
    timeline_start = date '2026-10-01',
    timeline_end = date '2027-01-31',
    team = '[{"name": "Анна", "role": "Продуктова дизайнерка"}, {"name": "Ілля", "role": "Продакт-менеджер"}, {"name": "Марина", "role": "iOS-розробниця"}]'::jsonb,
    links = '[{"title": "Матеріали дослідження", "url": "https://example.com/research"}]'::jsonb,
    existing_product = 'Ні, продукт робиться з нуля. Зараз користувачі обирають через карти, агрегатори відгуків і поради друзів.',
    business_requirements = 'Вхід за номером телефону. Бронювання в ресторанах-партнерах, для решти — дзвінок із застосунку.',
    technical_constraints = 'Нативні застосунки iOS і Android; карта — сторонній SDK; бронювання через API партнерів.'
  where project_id = v_project;

  perform public.seed_demo_content(v_project);

  return v_slug;
end $$;

create or replace function public.seed_demo_competitors(p_project uuid)
returns void language plpgsql set search_path = '' as $$
declare
  v_own uuid; v_maps uuid; v_fork uuid; v_insta uuid;
  v_f   uuid[];
begin
  insert into public.competitors (project_id, name, kind, is_own_product, positioning, position)
  values (p_project, 'Restaurant App', 'direct', true, 'Вибір ресторану під привід і бронювання за кілька дотиків.', 0)
  returning id into v_own;

  insert into public.competitors (project_id, name, url, kind, positioning, target_audience, pricing,
    onboarding_notes, navigation_notes, strengths, weaknesses, reviews_summary, opportunities, borrow, position)
  values (p_project, 'Google Maps', 'https://maps.google.com', 'indirect',
    'Карти з каталогом закладів і відгуками.', 'Усі, хто шукає місце поблизу.', 'Безкоштовно',
    'Без онбордингу: одразу карта.', 'Пошук угорі, картка місця знизу аркушем.',
    'Величезна база місць і відгуків, маршрут до ресторану в один дотик.',
    'Немає фільтра за приводом, бронювання — лише в частини місць і через сторонні сервіси.',
    'Хвалять повноту бази, лають накручені оцінки.',
    'Фільтр «за приводом» і чесна добірка замість нескінченної видачі.',
    'Нижній аркуш із карткою поверх карти.', 1)
  returning id into v_maps;

  insert into public.competitors (project_id, name, url, kind, positioning, target_audience, pricing,
    onboarding_notes, strengths, weaknesses, reviews_summary, opportunities, borrow, position)
  values (p_project, 'TheFork', 'https://www.thefork.com', 'direct',
    'Онлайн-бронювання ресторанів зі знижками.', 'Містяни, які бронюють заздалегідь.', 'Безкоштовно для гостей, комісія з ресторанів',
    'Вибір міста, потім стрічка акцій.',
    'Бронювання без дзвінка, підтвердження за секунди, програма лояльності.',
    'Видачу побудовано навколо знижок, а не приводу; мало місць поза партнерами.',
    'Подобається швидкість бронювання, дратують нав''язливі акції.',
    'Показувати вільні столи просто у видачі.',
    'Вибір часу й кількості гостей одним екраном.', 2)
  returning id into v_fork;

  insert into public.competitors (project_id, name, url, kind, positioning, strengths, weaknesses, opportunities, position)
  values (p_project, 'Instagram', 'https://instagram.com', 'substitute',
    'Обирають за фото й порадами блогерів.',
    'Живі фото інтер''єру і страв, довіра до знайомих.',
    'Немає пошуку за умовами, інформація застаріває.',
    'Фотографії від гостей замість рекламних.', 3)
  returning id into v_insta;

  with f(name, grp, pos) as (values
    ('Пошук на карті', 'Пошук', 1),
    ('Фільтр за приводом', 'Пошук', 2),
    ('Фільтр за бюджетом', 'Пошук', 3),
    ('Онлайн-бронювання', 'Бронювання', 4),
    ('Вільні столи у видачі', 'Бронювання', 5),
    ('Відгуки гостей', 'Довіра', 6),
    ('Фото від гостей', 'Довіра', 7))
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
  values (p_project, 'Як люди обирають ресторан',
    'Зрозуміти, як містяни обирають ресторан під привід і де втрачають час.',
    '["Як часто і з ким люди ходять у ресторани?", "За якими ознаками обирають місце?", "Що заважає швидко ухвалити рішення?"]'::jsonb,
    'Ресторан обирають під привід, а не під кухню. Головна втрата часу — звіряння відгуків у різних сервісах.',
    'Містяни 25–40 років, які працюють і ходять у кафе та ресторани хоча б раз на місяць.',
    'interview', 7,
    'Проведено 7 інтерв''ю, на кожне дослідницьке питання є повторювані відповіді у 3+ учасників.',
    'done')
  returning id into v_plan;

  insert into public.interview_guides (project_id, research_plan_id, title, intro, outro)
  values (p_project, v_plan, 'Вибір ресторану',
    'Вітаю! Мене звати Анна, я дизайнерка. Ми робимо застосунок для вибору ресторанів і хочемо краще зрозуміти, як ви обираєте, куди піти. Інтерв''ю триватиме близько 30 хвилин. Правильних і неправильних відповідей немає — нам важливий ваш досвід.',
    'Дякую! Чи можна зв''язатися з вами ще раз, якщо з''являться питання? Чи є щось, що ви хотіли б додати?')
  returning id into v_guide;

  with q(section, pos, txt, probes, is_key) as (values
    ('context'::public.guide_section,          1, 'Чим ви захоплюєтеся?', array[]::text[], false),
    ('current_behavior'::public.guide_section, 1, 'Як ви любите проводити вільний час?', array['З ким?', 'Де?'], false),
    ('current_behavior'::public.guide_section, 2, 'Як часто ви ходите в ресторани?', array['А в кав''ярні?', 'Коли це було останнього разу?'], true),
    ('current_behavior'::public.guide_section, 3, 'У які ресторани ходите?', array['Яка кухня?', 'Як ви знайшли це місце?'], true),
    ('motivation'::public.guide_section,       1, 'З якою метою ходите в ресторани?', array['З ким зазвичай?', 'Що було приводом останнього разу?'], true))
  , ins as (
    insert into public.interview_questions (guide_id, project_id, section, position, text, probes, is_key)
    select v_guide, p_project, section, pos, txt, probes, is_key from q
    returning id, section, position)
  select array_agg(id order by section, position) into v_q from ins;

  n := 0;
  for r in select * from (values
    ('Візажистка, бровистка', 'Ходять іноді', 'Своєю роботою — люблю робити людей гарними, речами для інтер''єру, різними стилями музики', 'Гуляє із собакою, сидить в інтернеті', 'Раз на місяць. Кав''ярні — раз на тиждень', 'Грузинська, японська кухня', 'З друзями, з чоловіком'),
    ('Дизайнер', 'Ходять іноді', '', 'Фільми, серіали, прогулянки, спорт, музика, PlayStation', 'Раз на два тижні. Найчастіше на вихідних', 'Різна, європейська', 'З друзями після роботи ввечері, на вихідних із дівчиною. Після шопінгу — щоб завершити день.'),
    ('Продакт-менеджерка', 'Ходять часто', 'Біг, групові заняття в залі, англійська, іспанська, статистика, математика, піаніно, гори, сноуборд', 'З друзями, з колегами на каву. Навчається, дивиться відео про стартапи, Netflix', 'Якщо з кавою — щодня. У ресторани в середньому 2 рази на тиждень', 'Різні. Тайська кухня. Винні бари', 'Різні: пообідати, іноді замовлення їжі, вечірні посиденьки, побачення — в різних місцях.'),
    ('Дослідниця', 'Ходять іноді', 'Читання книжок, робота', 'YouTube, фільми й серіали, TikTok, Instagram, книжки, прогулянки', 'Пообідати — рідко, кілька разів на місяць. З хлопцем або компанією — близько 5 разів на місяць.', 'Бари, кальянні, «Пузата хата» поруч. Грузинська кухня.', 'З подругами, з хлопцем. Якщо на роботі — пообідати.'),
    ('Продакт-аналітик', 'Ходять часто', 'Ходить у гори, двічі на тиждень зустрічається з друзями. Улітку — гори, взимку — катання. Навчання, аспірантура, профільні івенти', 'Вільний час — переробки, книжки, серіали, час із дівчиною. Захопився байком.', '1–2 рази на тиждень', 'На Подолі, на Оболоні', 'Випити чаю, поїсти. Рідко — пообідати. Іноді сніданок у «Пузатій хаті».'),
    ('Ретушер', 'Ходять іноді', 'Машини, фотографія і ретуш, курси, мислення', 'Гуляє із собакою, з друзями', 'До карантину — раз на місяць. Каву не п''є, лише перекусити.', 'Суші, бургери', 'Ходить не щоб поїсти, а коли є привід'),
    ('Менеджерка проєктів', 'Ходять часто', 'Любить читати, активний відпочинок (походи, зимові види спорту), раніше грала на гітарі й займалася танцями. Любить поїсти.', 'Спілкування з друзями, інтернет, музика, подкасти, відео, серіали й фільми', 'Раніше — майже щодня в кав''ярнях. Зараз рідше.', 'Затишні кав''ярні. Азійська кухня. Популярні місця в місті.', '')
  ) as t(role, segment, a1, a2, a3, a4, a5) loop
    n := n + 1;
    insert into public.participants (project_id, role, segment_label, context, consent_at, tags)
    values (p_project, r.role, r.segment, 'Київ, працює в офісі або гібридно.', now(), array['київ'])
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
    (p_project, 'Ресторан — привід для зустрічі', 's1', 1),
    (p_project, 'Вибір за кухнею й атмосферою', 's3', 2),
    (p_project, 'Мало вільного часу', 's6', 3);
  select array_agg(id order by position) into v_pat from public.patterns where project_id = p_project;

  -- Quotes: exact fragments of demo answers.
  for r in select * from (values
    (1, 'Ретушер', 'З якою метою', 'Ходить не щоб поїсти, а коли є привід'),
    (2, 'Дизайнер', 'З якою метою', 'Після шопінгу — щоб завершити день.'),
    (3, 'Продакт-менеджерка', 'З якою метою', 'побачення — в різних місцях'),
    (4, 'Дослідниця', 'У які ресторани', 'Грузинська кухня.'),
    (5, 'Візажистка, бровистка', 'З якою метою', 'З друзями, з чоловіком'),
    (6, 'Менеджерка проєктів', 'Як часто', 'Раніше — майже щодня в кав''ярнях. Зараз рідше.')
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
    (1, 'Візажистка, бровистка', 'behavior', 'Ходить у ресторани з друзями й партнером', 1),
    (2, 'Ретушер',           'need',     'Потрібен привід, щоб піти в ресторан', 1),
    (3, 'Продакт-менеджерка',  'behavior', 'Обирає місце під формат зустрічі: обід, посиденьки, побачення', 1),
    (4, 'Дослідниця',     'behavior', 'Орієнтується на кухню: грузинська, азійська', 2),
    (5, 'Менеджерка проєктів', 'need',     'Шукає затишні місця з атмосферою', 2),
    (6, 'Менеджерка проєктів', 'fact',     'Стала рідше ходити в кав''ярні', 3),
    (7, 'Продакт-аналітик',  'pain',     'Вільний час з''їдають переробки', 3)
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
    (p_project, 'Ресторан обирають під привід зустрічі',
     'Для більшості учасників ресторан — спосіб провести час із друзями чи партнером, а не просто поїсти. Вибір місця залежить від формату зустрічі.',
     'high', 'validated')
  returning id into v_id; v_ins := v_ins || v_id;
  insert into public.insights (project_id, title, statement, confidence, status) values
    (p_project, 'Кухня й атмосфера важливіші за рейтинг',
     'Учасники описують улюблені місця через кухню й затишок, а не через оцінки й відгуки.', 'medium', 'draft')
  returning id into v_id; v_ins := v_ins || v_id;
  insert into public.insights (project_id, title, statement, confidence, status) values
    (p_project, 'На довгий вибір немає часу',
     'У зайнятих учасників мало вільного часу, тому пошук місця має забирати хвилини.', 'low', 'draft')
  returning id into v_id; v_ins := v_ins || v_id;

  insert into public.pain_points (project_id, title, description, severity, segment_label) values
    (p_project, 'Складно підібрати місце під конкретний привід',
     'Сервіси шукають за кухнею й рейтингом, а люди думають про формат зустрічі.', 'high', 'Ходять часто')
  returning id into v_id; v_pp := v_pp || v_id;
  insert into public.pain_points (project_id, title, description, severity) values
    (p_project, 'На вибір іде забагато часу',
     'Доводиться звіряти відгуки й фото в кількох сервісах.', 'medium')
  returning id into v_id; v_pp := v_pp || v_id;

  insert into public.opportunities (project_id, title, description, hmw, impact, effort, status) values
    (p_project, 'Підбір ресторану під привід',
     'Фільтр і добірки «побачення», «діловий обід», «з друзями» на першому екрані.',
     'Як ми могли б допомогти обрати місце під привід зустрічі за кілька хвилин?', 'high', 'medium', 'open')
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

create or replace function public.seed_demo_flows(p_project uuid)
returns void language plpgsql set search_path = '' as $$
declare
  v_flow  uuid;
  v_scr   uuid[] := '{}';
  v_n     uuid[] := '{}';
  v_id    uuid;
  r       record;
begin
  for r in select * from (values
    (1, 'Профіль за телефоном', 'Створити профіль без пароля — за номером телефону.', 'Зареєструватися за хвилину', 'wireframe'),
    (2, 'Карта і список', 'Показати відповідні ресторани поруч на карті та списком.', 'Знайти місце під привід', 'prototype'),
    (3, 'Картка ресторану', 'Допомогти вирішити, чи підходить місце, і забронювати столик.', 'Зрозуміти, чи підходить місце', 'sketch')
  ) as t(n, name, purpose, goal, status) loop
    insert into public.screens (project_id, name, purpose, user_goal, status)
    values (p_project, r.name, r.purpose, r.goal, r.status::public.screen_status)
    returning id into v_id;
    v_scr := v_scr || v_id;
  end loop;

  insert into public.user_flows (project_id, name, description, status)
  values (p_project, 'Перший вхід і вибір ресторану',
          'Від першого запуску застосунку до бронювання столика у відповідному ресторані.', 'review')
  returning id into v_flow;

  for r in select * from (values
    (1,  'start',    'Відкриває застосунок', null::int, 0,    160),
    (2,  'decision', 'Є профіль?',        null,      240,  160),
    (3,  'screen',   'Onboarding',           null,      480,  0),
    (4,  'screen',   'Профіль за телефоном',  1,         720,  0),
    (5,  'action',   'Вводить код з SMS',    null,      960,  0),
    (6,  'screen',   'Карта і список',       2,         960,  160),
    (7,  'action',   'Обирає фільтр «привід»', null,   1200, 160),
    (8,  'screen',   'Картка ресторану',   3,         1440, 160),
    (9,  'decision', 'Підходить?',            null,      1680, 160),
    (10, 'success',  'Столик заброньовано',  null,      1920, 160),
    (11, 'error',    'Немає мережі',             null,      960,  320)
  ) as t(n, kind, label, scr, x, y) loop
    insert into public.flow_nodes (project_id, flow_id, kind, label, screen_id, pos_x, pos_y)
    values (p_project, v_flow, r.kind::public.flow_node_kind, r.label, v_scr[r.scr], r.x, r.y)
    returning id into v_id;
    v_n := v_n || v_id;
  end loop;

  insert into public.flow_edges (project_id, flow_id, source_node_id, target_node_id, branch, label)
  select p_project, v_flow, v_n[s], v_n[t], b::public.flow_edge_branch, l from (values
    (1, 2, 'default', null),
    (2, 3, 'no', 'Ні'),
    (2, 6, 'yes', 'Так'),
    (3, 4, 'default', null),
    (4, 5, 'default', null),
    (5, 6, 'default', null),
    (6, 7, 'default', null),
    (7, 8, 'default', null),
    (8, 9, 'default', null),
    (9, 10, 'yes', 'Так'),
    (9, 6, 'no', 'Ні — до списку'),
    (6, 11, 'error', 'Немає з''єднання')
  ) as e(s, t, b, l);

  update public.flow_edge_cases set status = 'covered', node_id = v_n[11],
    description = 'Екран «Немає мережі» з повтором запиту й останніми результатами з кешу.'
  where flow_id = v_flow and kind = 'no_internet';
  update public.flow_edge_cases set status = 'covered', node_id = v_n[5],
    description = 'Неправильний код з SMS: підказка й повторне надсилання через 60 секунд.'
  where flow_id = v_flow and kind = 'validation';
  update public.flow_edge_cases set status = 'not_applicable',
    description = 'Оплати в застосунку немає: бронювання без передоплати.'
  where flow_id = v_flow and kind = 'payment_failed';

  insert into public.trace_links (project_id, source_type, source_id, target_type, target_id, relation)
  select p_project, 'opportunity', o.id, 'user_flow', v_flow, 'addresses'
  from public.opportunities o
  where o.project_id = p_project and o.title = 'Підбір ресторану під привід';
end $$;

create or replace function public.seed_demo_design(p_project uuid)
returns void language plpgsql set search_path = '' as $$
declare
  v_map   uuid;
  v_card  uuid;
  v_phone uuid;
  v_dec   uuid;
begin
  select id into v_phone from public.screens where project_id = p_project and name = 'Профіль за телефоном';
  select id into v_map   from public.screens where project_id = p_project and name = 'Карта і список';
  select id into v_card  from public.screens where project_id = p_project and name = 'Картка ресторану';
  if v_map is null then return; end if;

  update public.screens set
    entry_points = 'Після входу; з вкладки «Пошук»; кнопкою «Назад» з картки ресторану.',
    primary_action = 'Відкрити картку відповідного ресторану',
    secondary_actions = 'Змінити привід, перемкнути карту/список, змінити район',
    content_hierarchy = '["Привід зустрічі (чипи)", "Карта з мітками", "Список ресторанів: фото, кухня, чек, відстань", "Фільтри"]'::jsonb,
    permissions = 'Геолокація — за запитом; без неї показуємо центр міста.',
    analytics_events = '[{"name": "occasion_selected", "trigger": "Дотик до чипа приводу", "props": "occasion"}, {"name": "restaurant_opened", "trigger": "Дотик до ресторану", "props": "restaurant_id, position"}]'::jsonb,
    api_data_requirements = 'GET /restaurants?occasion=&lat=&lng=&radius= — список з координатами, кухнею, середнім чеком і вільними слотами.'
  where id = v_map;
  update public.screens set
    entry_points = 'З «Карти і списку», з добірок, за посиланням від друга.',
    primary_action = 'Забронювати столик',
    secondary_actions = 'Зателефонувати, прокласти маршрут, поділитися',
    content_hierarchy = '["Фото й назва", "Підходить для: приводи", "Вільний час сьогодні", "Меню і чек", "Відгуки"]'::jsonb
  where id = v_card;
  update public.screens set
    primary_action = 'Отримати код в SMS',
    permissions = 'Ні'
  where id = v_phone;

  update public.screen_states set status = 'designed', description = 'Скелетони карток і міток на карті.'
    where screen_id = v_map and kind = 'loading';
  update public.screen_states set status = 'designed', description = 'Немає місць під привід поруч — пропонуємо розширити радіус або змінити привід.'
    where screen_id = v_map and kind = 'empty';
  update public.screen_states set status = 'designed' where screen_id = v_map and kind = 'default';
  update public.screen_states set status = 'n_a' where screen_id = v_map and kind = 'success';
  update public.screen_states set status = 'designed' where screen_id = v_phone and kind in ('default', 'loading', 'error');
  update public.screen_states set status = 'designed' where screen_id = v_card and kind = 'default';

  insert into public.design_decisions (project_id, title, context, decision, reason, alternatives, status, decided_at)
  values (p_project, 'Привід зустрічі — головний фільтр на першому екрані',
    'Учасники обирають ресторан під формат зустрічі, а сервіси пропонують фільтри за кухнею й рейтингом.',
    'На «Карті і списку» першим рядом показуємо чипи приводів: «Побачення», «Діловий обід», «З друзями», «З дітьми». Кухня і чек — у вторинних фільтрах.',
    'П''ятеро із семи учасників описали вибір через привід; це головний біль PP-001 і можливість OPP-001.',
    '[{"option": "Фільтр за кухнею першим, як в агрегаторах", "why_rejected": "Не відповідає на питання «куди піти на побачення», учасники описують вибір інакше"}, {"option": "Добірки на головній замість фільтра", "why_rejected": "Добірки редакційні й швидко застарівають; фільтр працює на всіх ресторанах"}]'::jsonb,
    'accepted', date '2026-10-20')
  returning id into v_dec;

  insert into public.trace_links (project_id, source_type, source_id, target_type, target_id, relation)
  select p_project, s_type, s_id, t_type, t_id, rel from (
    select 'insight' as s_type, i.id as s_id, 'design_decision' as t_type, v_dec as t_id, 'justifies' as rel
      from public.insights i where i.project_id = p_project and i.title = 'Ресторан обирають під привід зустрічі'
    union all
    select 'pain_point', p.id, 'design_decision', v_dec, 'justifies'
      from public.pain_points p where p.project_id = p_project and p.title = 'Складно підібрати місце під конкретний привід'
    union all
    select 'quote', q.id, 'design_decision', v_dec, 'justifies'
      from public.quotes q where q.project_id = p_project and q.text = 'побачення — в різних місцях'
    union all
    select 'design_decision', v_dec, 'screen', v_map, 'implements'
    union all
    select 'opportunity', o.id, 'screen', v_map, 'addresses'
      from public.opportunities o where o.project_id = p_project and o.title = 'Підбір ресторану під привід'
  ) l;
end $$;

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
    (v_maps,  'Фільтр за приводом',          'Шукають за кухнею й рейтингом — зробити привід першим фільтром'),
    (v_maps,  'Вільні столи у видачі',  'Вільні столи видно лише після дзвінка — показати слоти просто в списку'),
    (v_fork,  'Фільтр за приводом',          'Стрічку побудовано на знижках — наш привід + бронювання закривають цю прогалину'),
    (v_fork,  'Фото від гостей',            'Лише фото ресторану — дати гостям завантажувати свої'),
    (v_insta, 'Онлайн-бронювання',              'Немає бронювання — з добірки одразу в бронювання, без переходу в інший застосунок'),
    (v_maps,  'Онлайн-бронювання',              'Бронювання через сторонні сервіси, у частини місць')
  ) as n(competitor, feature, note)
  join public.comparison_features f on f.project_id = p_project and f.name = n.feature and f.kind = 'feature'
  where v.competitor_id = n.competitor and v.comparison_feature_id = f.id;

  -- Nielsen's 10 usability heuristics as UX rows.
  with h(name, pos) as (values
    ('#1 Видимість стану системи', 1),
    ('#2 Відповідність реальному світу', 2),
    ('#3 Свобода й контроль користувача', 3),
    ('#4 Узгодженість і стандарти', 4),
    ('#5 Запобігання помилкам', 5),
    ('#6 Упізнавання, а не пригадування', 6),
    ('#7 Гнучкість і ефективність', 7),
    ('#8 Естетичний мінімалістичний дизайн', 8),
    ('#9 Допомога в розпізнаванні й виправленні помилок', 9),
    ('#10 Довідка й документація', 10))
  , ins as (
    insert into public.comparison_features (project_id, name, group_name, kind, position)
    select p_project, name, 'Евристики Нільсена', 'ux', pos from h
    returning id, position)
  select array_agg(id order by position) into v_h from ins;

  insert into public.competitor_feature_values (competitor_id, comparison_feature_id, value, note)
  select c, v_h[i], v::public.feature_value, n
  from (values
    (v_maps, 1, 'yes', null), (v_maps, 2, 'yes', null), (v_maps, 3, 'yes', null), (v_maps, 4, 'yes', null),
    (v_maps, 5, 'partial', null), (v_maps, 6, 'yes', null), (v_maps, 7, 'yes', null),
    (v_maps, 8, 'no', 'Картка місця перевантажена: 12 кнопок — у нас одна головна дія «Забронювати»'),
    (v_maps, 9, 'yes', null), (v_maps, 10, 'yes', null),
    (v_fork, 1, 'yes', null), (v_fork, 2, 'yes', null), (v_fork, 3, 'partial', null), (v_fork, 4, 'yes', null),
    (v_fork, 5, 'yes', null), (v_fork, 6, 'yes', null),
    (v_fork, 7, 'no', 'Не можна повторити минуле бронювання одним дотиком — додати «Забронювати знову»'),
    (v_fork, 8, 'partial', null),
    (v_fork, 9, 'no', 'Коли час зайнятий, просто помилка — пропонувати найближчі вільні слоти'),
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
