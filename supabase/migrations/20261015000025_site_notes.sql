-- =====================================================================
-- Site notes («Нотатки»): short posts on design, written in the tool and
-- shown on the site as a feed. A note may continue another one (a thread).
-- Visitors react in one click and can answer the author privately.
--
-- Like the site profile, notes belong to a workspace and only its owner
-- reads or writes them. The site shows the notes of the workspace that runs
-- the site (intake_settings), through site_notes(). Visitors write only
-- through note_react() and submit_note_reply(), which the site's server
-- calls with INTAKE_SUBMIT_SECRET and a keyed hash of the IP (the IP itself
-- is never stored).
-- =====================================================================

create table public.site_notes (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  -- The note's address on the site: /notes/<number>, per workspace, never reused.
  number        int not null default 0 check (number > 0),
  body_uk       text not null default '' check (char_length(body_uk) <= 1500),
  -- Empty: the note is shown only on the Ukrainian site.
  body_en       text check (char_length(body_en) <= 1500),
  image         jsonb check (image is null or (jsonb_typeof(image) = 'object' and pg_column_size(image) <= 4096)),
  tags          text[] not null default '{}' check (cardinality(tags) <= 5),
  -- The note this one continues; the thread survives a deleted note as two threads.
  parent_id     uuid references public.site_notes (id) on delete set null check (parent_id <> id),
  status        text not null default 'draft' check (status in ('draft', 'published')),
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  created_by    uuid default auth.uid() references public.profiles (id) on delete set null,
  unique (workspace_id, number),
  check (status = 'draft' or (published_at is not null and char_length(btrim(body_uk)) > 0))
);
create index site_notes_feed_idx on public.site_notes (workspace_id, status, published_at desc);
create index site_notes_parent_idx on public.site_notes (parent_id) where parent_id is not null;
alter table public.site_notes enable row level security;
revoke all on public.site_notes from anon;

create policy site_notes_select on public.site_notes for select to authenticated
  using (public.is_workspace_member(workspace_id, 'owner'));
create policy site_notes_insert on public.site_notes for insert to authenticated
  with check (public.is_workspace_member(workspace_id, 'owner'));
create policy site_notes_update on public.site_notes for update to authenticated
  using (public.is_workspace_member(workspace_id, 'owner'))
  with check (public.is_workspace_member(workspace_id, 'owner'));
create policy site_notes_delete on public.site_notes for delete to authenticated
  using (public.is_workspace_member(workspace_id, 'owner'));

create trigger site_notes_updated_at before update on public.site_notes
  for each row execute function public.set_updated_at();

-- Number, publication date and the thread's workspace are set here, not trusted from the client.
create function public.site_notes_before_write() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    perform pg_advisory_xact_lock(hashtext('site_notes:' || new.workspace_id::text));
    select coalesce(max(n.number), 0) + 1 into new.number from public.site_notes n where n.workspace_id = new.workspace_id;
  else
    new.number := old.number;
    new.workspace_id := old.workspace_id;
  end if;
  if new.status = 'published' and new.published_at is null then new.published_at := now(); end if;
  if new.parent_id is not null and not exists (
    select 1 from public.site_notes p where p.id = new.parent_id and p.workspace_id = new.workspace_id) then
    raise exception 'invalid:parent' using errcode = '22023';
  end if;
  return new;
end $$;
revoke execute on function public.site_notes_before_write() from public, anon, authenticated;
create trigger site_notes_before_write before insert or update on public.site_notes
  for each row execute function public.site_notes_before_write();

-- ---------------------------------------------------------------------
-- Reactions: one per kind, note and visitor (a keyed hash of the IP).
-- ---------------------------------------------------------------------
create table private.note_votes (
  note_id     uuid not null references public.site_notes (id) on delete cascade,
  kind        text not null check (kind in ('agree', 'disagree', 'new')),
  voter_hash  text not null check (voter_hash ~ '^[0-9a-f]{64}$'),
  created_at  timestamptz not null default now(),
  primary key (note_id, kind, voter_hash)
);

-- Visitor actions per hashed IP, for rate limiting.
create table private.note_rate (
  ip_hash     text not null check (ip_hash ~ '^[0-9a-f]{64}$'),
  action      text not null check (action in ('react', 'reply')),
  created_at  timestamptz not null default now()
);
create index note_rate_idx on private.note_rate (ip_hash, action, created_at);

-- ---------------------------------------------------------------------
-- Private replies to a note. Only the owner reads them.
-- ---------------------------------------------------------------------
create table public.note_replies (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  note_id       uuid not null references public.site_notes (id) on delete cascade,
  body          text not null check (char_length(btrim(body)) between 1 and 1000),
  -- How to answer back, if the visitor left it: free text (e-mail, Telegram…).
  contact       text check (char_length(contact) <= 200),
  locale        text not null check (locale in ('uk', 'en')),
  created_at    timestamptz not null default now(),
  read_at       timestamptz
);
create index note_replies_inbox_idx on public.note_replies (workspace_id, created_at desc);
create index note_replies_note_idx on public.note_replies (note_id);
alter table public.note_replies enable row level security;
revoke all on public.note_replies from anon;

create policy note_replies_select on public.note_replies for select to authenticated
  using (public.is_workspace_member(workspace_id, 'owner'));
-- The owner marks a reply read; nothing else of it changes.
create policy note_replies_update on public.note_replies for update to authenticated
  using (public.is_workspace_member(workspace_id, 'owner'))
  with check (public.is_workspace_member(workspace_id, 'owner'));
create policy note_replies_delete on public.note_replies for delete to authenticated
  using (public.is_workspace_member(workspace_id, 'owner'));
revoke update on public.note_replies from authenticated;
grant update (read_at) on public.note_replies to authenticated;

-- ---------------------------------------------------------------------
-- What the site reads and writes.
-- ---------------------------------------------------------------------

-- The workspace that runs the site: the one the request form delivers to (the enabled one first).
create function private.site_workspace() returns uuid
language sql stable security definer set search_path = '' as $$
  select s.workspace_id from public.intake_settings s order by s.enabled desc, s.updated_at desc limit 1
$$;
revoke execute on function private.site_workspace() from public, anon, authenticated;

-- Published notes of the site, newest first, with the number of the note each continues and its reactions.
create function public.site_notes() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
      'number', n.number, 'body_uk', n.body_uk, 'body_en', n.body_en, 'image', n.image, 'tags', to_jsonb(n.tags),
      'parent', p.number, 'published_at', n.published_at,
      'reactions', (select coalesce(jsonb_object_agg(v.kind, v.c), '{}'::jsonb)
                    from (select kind, count(*) c from private.note_votes where note_id = n.id group by kind) v)
    ) order by n.published_at desc, n.number desc), '[]'::jsonb)
  from public.site_notes n
  left join public.site_notes p on p.id = n.parent_id and p.status = 'published'
  where n.workspace_id = private.site_workspace() and n.status = 'published'
$$;
revoke execute on function public.site_notes() from public;
grant execute on function public.site_notes() to anon, authenticated;

create function private.check_site_secret(p_secret text) returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  if p_secret is null or not exists (
    select 1 from private.intake_secret s where s.secret_hash = encode(sha256(convert_to(p_secret, 'UTF8')), 'hex')) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
end $$;
revoke execute on function private.check_site_secret(text) from public, anon, authenticated;

create function private.published_site_note(p_number int) returns uuid
language sql stable security definer set search_path = '' as $$
  select n.id from public.site_notes n
  where n.workspace_id = private.site_workspace() and n.number = p_number and n.status = 'published'
$$;
revoke execute on function private.published_site_note(int) from public, anon, authenticated;

-- A visitor's reaction, set (p_on) or taken back. Returns the note's counts after it.
create function public.note_react(p_number int, p_kind text, p_on boolean, p_secret text, p_voter_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_note uuid;
begin
  perform private.check_site_secret(p_secret);
  if p_voter_hash is null or p_voter_hash !~ '^[0-9a-f]{64}$' or p_kind is null
     or p_kind not in ('agree', 'disagree', 'new') or p_on is null then
    raise exception 'invalid:request' using errcode = '22023';
  end if;
  v_note := private.published_site_note(p_number);
  if v_note is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  -- 30 a minute and 300 a day per visitor: enough for a person, not for a script.
  if (select count(*) from private.note_rate where ip_hash = p_voter_hash and action = 'react' and created_at > now() - interval '1 minute') >= 30
     or (select count(*) from private.note_rate where ip_hash = p_voter_hash and action = 'react' and created_at > now() - interval '1 day') >= 300 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  insert into private.note_rate (ip_hash, action) values (p_voter_hash, 'react');
  delete from private.note_rate where created_at < now() - interval '2 days';

  if p_on then
    insert into private.note_votes (note_id, kind, voter_hash) values (v_note, p_kind, p_voter_hash) on conflict do nothing;
  else
    delete from private.note_votes where note_id = v_note and kind = p_kind and voter_hash = p_voter_hash;
  end if;
  return (select coalesce(jsonb_object_agg(v.kind, v.c), '{}'::jsonb)
          from (select kind, count(*) c from private.note_votes where note_id = v_note group by kind) v);
end $$;
revoke execute on function public.note_react(int, text, boolean, text, text) from public;
grant execute on function public.note_react(int, text, boolean, text, text) to anon, authenticated;

-- A visitor's private reply to a published note.
create function public.submit_note_reply(p_number int, p_body text, p_contact text, p_locale text, p_secret text, p_ip_hash text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_note uuid;
begin
  perform private.check_site_secret(p_secret);
  if p_ip_hash is null or p_ip_hash !~ '^[0-9a-f]{64}$' then raise exception 'invalid:request' using errcode = '22023'; end if;
  if p_body is null or char_length(btrim(p_body)) not between 1 and 1000 then raise exception 'invalid:body' using errcode = '22023'; end if;
  if char_length(p_contact) > 200 then raise exception 'invalid:contact' using errcode = '22023'; end if;
  if p_locale is null or p_locale not in ('uk', 'en') then raise exception 'invalid:locale' using errcode = '22023'; end if;
  v_note := private.published_site_note(p_number);
  if v_note is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  -- 3 per 10 minutes and 10 a day per visitor, 100 a day for the whole site.
  if (select count(*) from private.note_rate where ip_hash = p_ip_hash and action = 'reply' and created_at > now() - interval '10 minutes') >= 3
     or (select count(*) from private.note_rate where ip_hash = p_ip_hash and action = 'reply' and created_at > now() - interval '1 day') >= 10
     or (select count(*) from private.note_rate where action = 'reply' and created_at > now() - interval '1 day') >= 100 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  insert into private.note_rate (ip_hash, action) values (p_ip_hash, 'reply');

  insert into public.note_replies (workspace_id, note_id, body, contact, locale)
  values (private.site_workspace(), v_note, btrim(p_body), nullif(btrim(coalesce(p_contact, '')), ''), p_locale);
end $$;
revoke execute on function public.submit_note_reply(int, text, text, text, text, text) from public;
grant execute on function public.submit_note_reply(int, text, text, text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- Pictures of notes: public bucket, the owner writes under <workspace_id>/.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('note-media', 'note-media', true, 10485760, array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

create function public.can_write_note_file(p_name text) returns boolean
language sql stable security definer set search_path = '' as $$
  select case when split_part(p_name, '/', 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then public.is_workspace_member(split_part(p_name, '/', 1)::uuid, 'owner') else false end
$$;
revoke execute on function public.can_write_note_file(text) from public, anon;
grant execute on function public.can_write_note_file(text) to authenticated;

create policy note_media_select on storage.objects for select to authenticated
  using (bucket_id = 'note-media' and public.can_write_note_file(name));
create policy note_media_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'note-media' and public.can_write_note_file(name));
create policy note_media_update on storage.objects for update to authenticated
  using (bucket_id = 'note-media' and public.can_write_note_file(name))
  with check (bucket_id = 'note-media' and public.can_write_note_file(name));
create policy note_media_delete on storage.objects for delete to authenticated
  using (bucket_id = 'note-media' and public.can_write_note_file(name));
