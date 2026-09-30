-- 010: invite-only sign-up.
-- When signup_allowlist has rows, auth.users accepts only those e-mails, whatever the
-- dashboard's "Allow new users to sign up" setting or the client does. An empty list keeps
-- sign-up open (local development, tests). Rows are managed with SQL by the project owner.

create table public.signup_allowlist (
  email      text primary key check (email = lower(email)),
  note       text,
  created_at timestamptz not null default now()
);
alter table public.signup_allowlist enable row level security; -- no policies: not exposed over the API
revoke all on public.signup_allowlist from anon, authenticated;

create function public.guard_signup() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.signup_allowlist)
     and not exists (select 1 from public.signup_allowlist where email = lower(new.email)) then
    raise exception 'sign-up is invite-only' using errcode = '42501';
  end if;
  return new;
end $$;
revoke execute on function public.guard_signup() from public, anon, authenticated;

create trigger a_guard_signup before insert on auth.users
  for each row execute function public.guard_signup();
