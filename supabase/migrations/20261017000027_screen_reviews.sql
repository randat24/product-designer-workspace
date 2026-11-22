-- =====================================================================
-- Screen review: a rubric score per reviewer. Each member who can edit
-- the project scores a screen 1–10 on the six groups of the laws of UX
-- (src/domains/ux-laws: familiar, choice, memory, gestalt, motion,
-- quality); a criterion left empty is not scored yet. The overall score
-- is the average of the filled ones, computed in the app. One review per
-- reviewer and screen; everyone in the workspace sees all of them, but
-- only its author changes or removes a review.
-- =====================================================================

create table public.screen_reviews (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  project_id    uuid not null references public.projects (id) on delete cascade,
  screen_id     uuid not null references public.screens (id) on delete cascade,
  reviewer_id   uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  familiar      smallint check (familiar between 1 and 10),
  choice        smallint check (choice between 1 and 10),
  memory        smallint check (memory between 1 and 10),
  gestalt       smallint check (gestalt between 1 and 10),
  motion        smallint check (motion between 1 and 10),
  quality       smallint check (quality between 1 and 10),
  note          text check (char_length(note) <= 1000),
  created_by    uuid references public.profiles (id) default auth.uid(),
  updated_by    uuid references public.profiles (id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (screen_id, reviewer_id)
);
select public.attach_project_table('public.screen_reviews', 'screen_review');
create index screen_reviews_reviewer_idx on public.screen_reviews (reviewer_id);

-- On top of the editor rule from attach_project_table: a review is its author's own.
create policy screen_reviews_own_insert on public.screen_reviews as restrictive for insert to authenticated
  with check (reviewer_id = (select auth.uid()));
create policy screen_reviews_own_update on public.screen_reviews as restrictive for update to authenticated
  using (reviewer_id = (select auth.uid())) with check (reviewer_id = (select auth.uid()));
create policy screen_reviews_own_delete on public.screen_reviews as restrictive for delete to authenticated
  using (reviewer_id = (select auth.uid()));

-- The screen and the review always belong to the same project.
create or replace function public.screen_reviews_same_project()
returns trigger language plpgsql set search_path = '' as $$
begin
  if not exists (select 1 from public.screens s where s.id = new.screen_id and s.project_id = new.project_id) then
    raise exception 'screen % is not in project %', new.screen_id, new.project_id using errcode = '23514';
  end if;
  return new;
end $$;
create trigger screen_reviews_same_project before insert or update of screen_id, project_id on public.screen_reviews
  for each row execute function public.screen_reviews_same_project();
