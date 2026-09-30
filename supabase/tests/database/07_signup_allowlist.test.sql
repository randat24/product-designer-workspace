-- Invite-only sign-up guard on auth.users.
begin;
create extension if not exists pgtap with schema extensions;
select plan(4);

select lives_ok($$ insert into auth.users (id, email) values (gen_random_uuid(), 'anyone@example.com') $$,
  'empty allowlist keeps sign-up open');

insert into public.signup_allowlist (email) values ('admin@example.com');

select lives_ok($$ insert into auth.users (id, email) values (gen_random_uuid(), 'Admin@Example.com') $$,
  'allowlisted e-mail can sign up (case-insensitive)');
select throws_ok($$ insert into auth.users (id, email) values (gen_random_uuid(), 'stranger@example.com') $$,
  '42501', 'sign-up is invite-only', 'other e-mails are rejected');

set local role authenticated;
select throws_ok($$ select * from public.signup_allowlist $$, '42501', null, 'allowlist is not readable over the API');

select * from finish();
rollback;
