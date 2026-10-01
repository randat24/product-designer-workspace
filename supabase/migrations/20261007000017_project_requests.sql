-- =====================================================================
-- Client project intake: a visitor of the public site describes a project once,
-- the workspace gets a client + a project request (a lead, not a project) and
-- an immutable snapshot «Project brief v1». See docs/CLIENT_INTAKE.md.
--
-- Public writes go only through submit_project_request(), which requires the
-- server secret (INTAKE_SUBMIT_SECRET, its hash lives in private.intake_secret),
-- so the public API key alone cannot bypass the site's spam checks.
-- anon has no rights on any table here.
-- =====================================================================

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.request_status as enum ('submitted', 'reviewing', 'qualified', 'accepted', 'declined', 'converted');
create type public.request_document_type as enum (
  'project_brief', 'discovery_summary', 'project_scope', 'proposal', 'estimate', 'statement_of_work', 'design_brief');

-- ---------------------------------------------------------------------
-- Settings: which workspace receives public requests (one at a time).
-- ---------------------------------------------------------------------
create table public.intake_settings (
  workspace_id            uuid primary key references public.workspaces (id) on delete cascade,
  enabled                 boolean not null default true,
  privacy_policy_version  text not null default '2026-10-01' check (char_length(privacy_policy_version) between 1 and 40),
  updated_at              timestamptz not null default now()
);
create unique index intake_settings_one_enabled on public.intake_settings ((true)) where enabled;
alter table public.intake_settings enable row level security;
revoke all on public.intake_settings from anon;
create policy intake_settings_select on public.intake_settings for select to authenticated
  using (public.is_workspace_member(workspace_id, 'owner'));
create policy intake_settings_update on public.intake_settings for update to authenticated
  using (public.is_workspace_member(workspace_id, 'owner'))
  with check (public.is_workspace_member(workspace_id, 'owner'));

-- Server secret (sha256 hex of INTAKE_SUBMIT_SECRET). Set with SQL by the owner, never in a migration.
create table private.intake_secret (
  id           boolean primary key default true check (id),
  secret_hash  text not null check (secret_hash ~ '^[0-9a-f]{64}$'),
  updated_at   timestamptz not null default now()
);

-- Submissions per hashed IP (the IP itself is never stored), for rate limiting.
create table private.intake_rate (
  ip_hash     text not null check (ip_hash ~ '^[0-9a-f]{64}$'),
  created_at  timestamptz not null default now()
);
create index intake_rate_idx on private.intake_rate (ip_hash, created_at);

-- REQ-2026-0001: one counter per workspace and year, incremented atomically.
create table public.request_counters (
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  year          int not null,
  last_value    int not null default 0,
  primary key (workspace_id, year)
);
alter table public.request_counters enable row level security; -- no policies: internal
revoke all on public.request_counters from anon, authenticated;

-- ---------------------------------------------------------------------
-- Clients of a workspace (not system users; a client portal may link auth users later).
-- ---------------------------------------------------------------------
create table public.clients (
  id                      uuid primary key default gen_random_uuid(),
  workspace_id            uuid not null references public.workspaces (id) on delete cascade,
  name                    text not null check (char_length(name) between 1 and 120),
  email                   text not null check (char_length(email) <= 254 and email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
  company                 text check (char_length(company) <= 160),
  role                    text check (char_length(role) <= 120),
  phone                   text check (char_length(phone) <= 40),
  telegram                text check (char_length(telegram) <= 64),
  website                 text check (char_length(website) <= 500),
  preferred_channel       text not null default 'email' check (preferred_channel in ('email', 'telegram', 'phone', 'other')),
  preferred_channel_note  text check (char_length(preferred_channel_note) <= 200),
  auth_user_id            uuid references auth.users (id) on delete set null,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
create unique index clients_email_uidx on public.clients (workspace_id, lower(email));
create trigger clients_updated_at before update on public.clients
  for each row execute function public.set_updated_at();
alter table public.clients enable row level security;
revoke all on public.clients from anon;
create policy clients_select on public.clients for select to authenticated
  using (public.is_workspace_member(workspace_id));
create policy clients_update on public.clients for update to authenticated
  using (public.is_workspace_member(workspace_id, 'editor'))
  with check (public.is_workspace_member(workspace_id, 'editor'));
create policy clients_delete on public.clients for delete to authenticated
  using (public.is_workspace_member(workspace_id, 'owner'));

-- ---------------------------------------------------------------------
-- The request. Typed columns: lists filter and sort by them, conversion maps them.
-- Keys of types/goals/scope/materials/budget come from src/domains/requests/config.ts;
-- the database checks their shape, the server checks them against the config.
-- ---------------------------------------------------------------------
create table public.project_requests (
  id                      uuid primary key default gen_random_uuid(),
  workspace_id            uuid not null references public.workspaces (id) on delete cascade,
  client_id               uuid not null references public.clients (id) on delete restrict,
  code                    text not null check (code ~ '^REQ-[0-9]{4}-[0-9]{4,}$'),
  status                  public.request_status not null default 'submitted',
  locale                  text not null check (locale in ('uk', 'en')),
  form_version            int not null default 1,
  idempotency_key         uuid not null,

  project_types           text[] not null default '{}' check (cardinality(project_types) <= 20),
  project_type_other      text check (char_length(project_type_other) <= 200),
  project_name            text check (char_length(project_name) <= 120),
  project_name_unknown    boolean not null default false,

  has_existing            boolean not null default false,
  existing_url            text check (char_length(existing_url) <= 500),
  existing_description    text check (char_length(existing_description) <= 4000),
  existing_dislikes       text check (char_length(existing_dislikes) <= 4000),
  existing_works_well     text check (char_length(existing_works_well) <= 4000),
  existing_must_change    text check (char_length(existing_must_change) <= 4000),

  summary                 text not null check (char_length(summary) between 1 and 4000),
  what_it_does            text check (char_length(what_it_does) <= 4000),
  problem                 text check (char_length(problem) <= 4000),
  why_now                 text check (char_length(why_now) <= 4000),
  goals                   text[] not null default '{}' check (cardinality(goals) <= 20),
  goal_other              text check (char_length(goal_other) <= 200),

  audience                text check (char_length(audience) <= 4000),
  primary_users           text check (char_length(primary_users) <= 4000),
  geography               text check (char_length(geography) <= 200),
  market                  text check (market in ('b2b', 'b2c', 'b2b2c', 'internal', 'unknown')),
  demographics            text check (char_length(demographics) <= 1000),
  pain_points             text check (char_length(pain_points) <= 4000),

  scope                   text[] not null default '{}' check (cardinality(scope) <= 30),
  scope_needs_advice      boolean not null default false,
  materials               text[] not null default '{}' check (cardinality(materials) <= 30),

  -- Private: never shown outside the workspace.
  budget_range            text check (budget_range ~ '^[a-z0-9_]{1,40}$'),
  budget_min              numeric(12, 2) check (budget_min >= 0),
  budget_max              numeric(12, 2) check (budget_max >= 0),
  budget_currency         text check (budget_currency in ('USD', 'EUR', 'UAH')),
  budget_note             text check (char_length(budget_note) <= 1000),

  start_preference        text check (start_preference ~ '^[a-z0-9_]{1,40}$'),
  has_deadline            boolean not null default false,
  deadline_date           date,
  deadline_reason         text check (char_length(deadline_reason) <= 1000),

  additional_info         text check (char_length(additional_info) <= 6000),

  consent_at              timestamptz not null,
  privacy_policy_version  text not null check (char_length(privacy_policy_version) between 1 and 40),
  client_token_hash       text unique check (client_token_hash ~ '^[0-9a-f]{64}$'),
  client_token_expires_at timestamptz,

  submitted_at            timestamptz not null default now(),
  archived_at             timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),

  unique (workspace_id, code),
  unique (workspace_id, idempotency_key),
  constraint project_requests_budget_order check (budget_min is null or budget_max is null or budget_max >= budget_min),
  constraint project_requests_name check (project_name is not null or project_name_unknown)
);
create index project_requests_list_idx on public.project_requests (workspace_id, archived_at, submitted_at desc);
create index project_requests_client_idx on public.project_requests (client_id);
create trigger project_requests_updated_at before update on public.project_requests
  for each row execute function public.set_updated_at();
create trigger project_requests_activity after update on public.project_requests
  for each row execute function public.log_activity('project_request');

-- Lifecycle guard: «converted» is set and kept only by the conversion function;
-- the client's answers are a record of what they said and are not edited afterwards.
create or replace function public.project_requests_guard()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    if old.status = 'converted' then
      raise exception 'project_requests: a converted request is project history; archive it instead' using errcode = '42501';
    end if;
    return old;
  end if;
  if (old.status = 'converted' or new.status = 'converted') and new.status is distinct from old.status
     and coalesce(current_setting('app.converting_request', true), '') <> old.id::text then
    raise exception 'project_requests: status converted is managed by the conversion' using errcode = '42501';
  end if;
  if (to_jsonb(new) - array['status', 'archived_at', 'updated_at', 'client_token_hash', 'client_token_expires_at'])
     is distinct from (to_jsonb(old) - array['status', 'archived_at', 'updated_at', 'client_token_hash', 'client_token_expires_at']) then
    raise exception 'project_requests: client answers are read-only' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger project_requests_guard before update or delete on public.project_requests
  for each row execute function public.project_requests_guard();

alter table public.project_requests enable row level security;
revoke all on public.project_requests from anon;
create policy project_requests_select on public.project_requests for select to authenticated
  using (public.is_workspace_member(workspace_id));
create policy project_requests_update on public.project_requests for update to authenticated
  using (public.is_workspace_member(workspace_id, 'editor'))
  with check (public.is_workspace_member(workspace_id, 'editor'));
create policy project_requests_delete on public.project_requests for delete to authenticated
  using (public.is_workspace_member(workspace_id, 'owner'));

-- ---------------------------------------------------------------------
-- Children: competitors, design references, links (current product, materials), internal notes.
-- workspace_id is copied from the request so RLS stays a single function call.
-- ---------------------------------------------------------------------
create or replace function public.set_workspace_from_request()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  select r.workspace_id into new.workspace_id from public.project_requests r where r.id = new.request_id;
  if new.workspace_id is null then
    raise exception 'request % not found', new.request_id using errcode = '23503';
  end if;
  return new;
end $$;
revoke execute on function public.set_workspace_from_request() from public, anon, authenticated;

create table public.project_request_competitors (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  request_id    uuid not null references public.project_requests (id) on delete cascade,
  name          text not null check (char_length(name) between 1 and 120),
  url           text check (char_length(url) <= 500),
  likes         text check (char_length(likes) <= 2000),
  dislikes      text check (char_length(dislikes) <= 2000),
  why           text check (char_length(why) <= 2000),
  position      int not null default 0
);

create table public.project_request_references (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  request_id    uuid not null references public.project_requests (id) on delete cascade,
  url           text not null check (char_length(url) <= 500),
  note          text check (char_length(note) <= 2000),
  position      int not null default 0
);

create table public.project_request_links (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  request_id    uuid not null references public.project_requests (id) on delete cascade,
  link_group    text not null check (link_group in ('existing', 'materials')),
  kind          text not null check (kind ~ '^[a-z0-9_]{1,40}$'),
  url           text not null check (char_length(url) <= 500),
  position      int not null default 0
);

create table public.project_request_notes (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  request_id    uuid not null references public.project_requests (id) on delete cascade,
  body          text not null check (char_length(body) between 1 and 4000),
  author_id     uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at    timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['project_request_competitors', 'project_request_references', 'project_request_links', 'project_request_notes'] loop
    execute format('create trigger %I before insert on public.%I for each row execute function public.set_workspace_from_request()', t || '_ws', t);
    execute format('create index %I on public.%I (request_id)', t || '_request_idx', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('create policy %I on public.%I for select to authenticated using (public.is_workspace_member(workspace_id))', t || '_select', t);
  end loop;
end $$;
-- The client's lists are read-only; notes are the designer's own.
create policy project_request_notes_insert on public.project_request_notes for insert to authenticated
  with check (public.is_workspace_member(workspace_id, 'editor') and author_id = auth.uid());
create policy project_request_notes_delete on public.project_request_notes for delete to authenticated
  using (author_id = auth.uid() or public.is_workspace_member(workspace_id, 'owner'));

-- ---------------------------------------------------------------------
-- Documents: immutable snapshots. A new edition is a new row with version + 1.
-- ---------------------------------------------------------------------
create table public.project_request_documents (
  id                uuid primary key default gen_random_uuid(),
  workspace_id      uuid not null references public.workspaces (id) on delete cascade,
  request_id        uuid not null references public.project_requests (id) on delete cascade,
  document_type     public.request_document_type not null,
  version           int not null check (version >= 1),
  locale            text not null check (locale in ('uk', 'en')),
  template_version  int not null default 1,
  content           jsonb not null check (jsonb_typeof(content) = 'object'),
  generated_at      timestamptz not null default now(),
  created_by        uuid references public.profiles (id) on delete set null default auth.uid(),
  unique (request_id, document_type, version)
);
create trigger project_request_documents_ws before insert on public.project_request_documents
  for each row execute function public.set_workspace_from_request();
create or replace function public.project_request_documents_immutable()
returns trigger language plpgsql set search_path = '' as $$
begin
  raise exception 'project_request_documents: documents are immutable, add a new version' using errcode = '42501';
end $$;
create trigger project_request_documents_immutable before update on public.project_request_documents
  for each row execute function public.project_request_documents_immutable();
alter table public.project_request_documents enable row level security;
revoke all on public.project_request_documents from anon;
create policy project_request_documents_select on public.project_request_documents for select to authenticated
  using (public.is_workspace_member(workspace_id));

-- ---------------------------------------------------------------------
-- Snapshot of a request: everything the client sent, in one document.
-- ---------------------------------------------------------------------
create or replace function public.project_request_snapshot(p_request uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'code', r.code,
    'submitted_at', r.submitted_at,
    'locale', r.locale,
    'form_version', r.form_version,
    'client', jsonb_build_object(
      'name', c.name, 'email', c.email, 'company', c.company, 'role', c.role, 'phone', c.phone,
      'telegram', c.telegram, 'website', c.website, 'preferred_channel', c.preferred_channel,
      'preferred_channel_note', c.preferred_channel_note),
    'project', jsonb_build_object(
      'types', to_jsonb(r.project_types), 'type_other', r.project_type_other,
      'name', r.project_name, 'name_unknown', r.project_name_unknown),
    'existing', jsonb_build_object(
      'has', r.has_existing, 'url', r.existing_url, 'description', r.existing_description,
      'dislikes', r.existing_dislikes, 'works_well', r.existing_works_well, 'must_change', r.existing_must_change,
      'links', coalesce((select jsonb_agg(jsonb_build_object('kind', l.kind, 'url', l.url) order by l.position)
                         from public.project_request_links l where l.request_id = r.id and l.link_group = 'existing'), '[]')),
    'about', jsonb_build_object(
      'summary', r.summary, 'what_it_does', r.what_it_does, 'problem', r.problem, 'why_now', r.why_now,
      'goals', to_jsonb(r.goals), 'goal_other', r.goal_other),
    'audience', jsonb_build_object(
      'audience', r.audience, 'primary_users', r.primary_users, 'geography', r.geography, 'market', r.market,
      'demographics', r.demographics, 'pain_points', r.pain_points),
    'competitors', coalesce((select jsonb_agg(jsonb_build_object('name', x.name, 'url', x.url, 'likes', x.likes,
                               'dislikes', x.dislikes, 'why', x.why) order by x.position)
                             from public.project_request_competitors x where x.request_id = r.id), '[]'),
    'references', coalesce((select jsonb_agg(jsonb_build_object('url', x.url, 'note', x.note) order by x.position)
                            from public.project_request_references x where x.request_id = r.id), '[]'),
    'scope', jsonb_build_object('items', to_jsonb(r.scope), 'needs_advice', r.scope_needs_advice),
    'materials', jsonb_build_object(
      'items', to_jsonb(r.materials),
      'links', coalesce((select jsonb_agg(jsonb_build_object('kind', l.kind, 'url', l.url) order by l.position)
                         from public.project_request_links l where l.request_id = r.id and l.link_group = 'materials'), '[]')),
    'budget', jsonb_build_object('range', r.budget_range, 'min', r.budget_min, 'max', r.budget_max,
                                 'currency', r.budget_currency, 'note', r.budget_note),
    'timeline', jsonb_build_object('start', r.start_preference, 'has_deadline', r.has_deadline,
                                   'deadline_date', r.deadline_date, 'deadline_reason', r.deadline_reason),
    'additional_info', r.additional_info,
    'consent', jsonb_build_object('at', r.consent_at, 'privacy_policy_version', r.privacy_policy_version))
  from public.project_requests r join public.clients c on c.id = r.client_id
  where r.id = p_request
$$;
revoke execute on function public.project_request_snapshot(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Validation helpers for the public payload (the server validates first; this is the last line).
-- ---------------------------------------------------------------------
create or replace function private.intake_text(p jsonb, p_key text, p_max int, p_required boolean default false)
returns text language plpgsql immutable set search_path = '' as $$
declare v text := nullif(btrim(coalesce(p ->> p_key, '')), '');
begin
  if v is null and p_required then raise exception 'invalid:%', p_key using errcode = '22023'; end if;
  if char_length(v) > p_max then raise exception 'invalid:%', p_key using errcode = '22023'; end if;
  return v;
end $$;

create or replace function private.intake_url(p jsonb, p_key text, p_required boolean default false)
returns text language plpgsql immutable set search_path = '' as $$
declare v text := private.intake_text(p, p_key, 500, p_required);
begin
  if v is not null and v !~* '^https?://[^\s/?#@]+\.[^\s/?#@]+([/?#][^\s]*)?$' then
    raise exception 'invalid:%', p_key using errcode = '22023';
  end if;
  return v;
end $$;

create or replace function private.intake_keys(p jsonb, p_key text, p_max int)
returns text[] language plpgsql immutable set search_path = '' as $$
declare v text[];
begin
  if p -> p_key is null or jsonb_typeof(p -> p_key) = 'null' then return '{}'; end if;
  if jsonb_typeof(p -> p_key) <> 'array' or jsonb_array_length(p -> p_key) > p_max then
    raise exception 'invalid:%', p_key using errcode = '22023';
  end if;
  select coalesce(array_agg(distinct e), '{}') into v from jsonb_array_elements_text(p -> p_key) e;
  if exists (select 1 from unnest(v) k where k !~ '^[a-z0-9_]{1,40}$') then
    raise exception 'invalid:%', p_key using errcode = '22023';
  end if;
  return v;
end $$;

-- ---------------------------------------------------------------------
-- Public submission. Called by the site's server with the secret; returns the request code
-- and a one-time client token (only its hash is stored) to download the brief for 30 days.
-- ---------------------------------------------------------------------
create or replace function public.submit_project_request(
  p_payload jsonb, p_secret text, p_ip_hash text, p_idempotency_key uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_ws        uuid;
  v_policy    text;
  v_client    jsonb := coalesce(p_payload -> 'client', '{}');
  v_project   jsonb := coalesce(p_payload -> 'project', '{}');
  v_existing  jsonb := coalesce(p_payload -> 'existing', '{}');
  v_about     jsonb := coalesce(p_payload -> 'about', '{}');
  v_aud       jsonb := coalesce(p_payload -> 'audience', '{}');
  v_scope     jsonb := coalesce(p_payload -> 'scope', '{}');
  v_mat       jsonb := coalesce(p_payload -> 'materials', '{}');
  v_budget    jsonb := coalesce(p_payload -> 'budget', '{}');
  v_time      jsonb := coalesce(p_payload -> 'timeline', '{}');
  v_locale    text := p_payload ->> 'locale';
  v_email     text;
  v_client_id uuid;
  v_req       public.project_requests;
  v_year      int := extract(year from now() at time zone 'Europe/Kyiv')::int;
  v_n         int;
  v_token     text := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  v_has       boolean := coalesce((v_existing ->> 'has')::boolean, false);
  v_deadline  boolean := coalesce((v_time ->> 'has_deadline')::boolean, false);
  v_item      jsonb;
  v_i         int;
begin
  -- Only the site's server knows the secret.
  if p_secret is null or not exists (
    select 1 from private.intake_secret s where s.secret_hash = encode(sha256(convert_to(p_secret, 'UTF8')), 'hex')) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select s.workspace_id, s.privacy_policy_version into v_ws, v_policy from public.intake_settings s where s.enabled;
  if v_ws is null then raise exception 'intake_disabled' using errcode = '42501'; end if;
  if pg_column_size(p_payload) > 65536 or octet_length(p_payload::text) > 65536 then
    raise exception 'invalid:payload' using errcode = '22023';
  end if;
  if p_ip_hash is null or p_ip_hash !~ '^[0-9a-f]{64}$' or p_idempotency_key is null then
    raise exception 'invalid:request' using errcode = '22023';
  end if;

  -- A retry of the same submission (double click, network) returns the same request with a fresh token.
  select * into v_req from public.project_requests r where r.workspace_id = v_ws and r.idempotency_key = p_idempotency_key;
  if found then
    update public.project_requests set client_token_hash = encode(sha256(convert_to(v_token, 'UTF8')), 'hex'),
      client_token_expires_at = now() + interval '30 days' where id = v_req.id;
    return jsonb_build_object('code', v_req.code, 'submitted_at', v_req.submitted_at, 'token', v_token,
                              'project_name', v_req.project_name, 'duplicate', true);
  end if;

  -- Rate limits: 3 per 10 minutes and 10 per day per IP, 200 per day for the whole form.
  if (select count(*) from private.intake_rate where ip_hash = p_ip_hash and created_at > now() - interval '10 minutes') >= 3
     or (select count(*) from private.intake_rate where ip_hash = p_ip_hash and created_at > now() - interval '1 day') >= 10
     or (select count(*) from private.intake_rate where created_at > now() - interval '1 day') >= 200 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  insert into private.intake_rate (ip_hash) values (p_ip_hash);
  delete from private.intake_rate where created_at < now() - interval '2 days';

  if v_locale is null or v_locale not in ('uk', 'en') then raise exception 'invalid:locale' using errcode = '22023'; end if;
  if coalesce((p_payload #>> '{consent,given}')::boolean, false) is not true then
    raise exception 'invalid:consent' using errcode = '22023';
  end if;
  v_email := lower(private.intake_text(v_client, 'email', 254, true));
  if v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then raise exception 'invalid:email' using errcode = '22023'; end if;

  -- One client per e-mail in the workspace; a repeat request fills only empty contact fields.
  insert into public.clients as c (workspace_id, name, email, company, role, phone, telegram, website,
                                   preferred_channel, preferred_channel_note)
  values (v_ws, private.intake_text(v_client, 'name', 120, true), v_email,
          private.intake_text(v_client, 'company', 160), private.intake_text(v_client, 'role', 120),
          private.intake_text(v_client, 'phone', 40), private.intake_text(v_client, 'telegram', 64),
          private.intake_url(v_client, 'website'),
          coalesce(private.intake_text(v_client, 'preferred_channel', 20), 'email'),
          private.intake_text(v_client, 'preferred_channel_note', 200))
  on conflict (workspace_id, lower(email)) do update set
    company = coalesce(c.company, excluded.company), role = coalesce(c.role, excluded.role),
    phone = coalesce(c.phone, excluded.phone), telegram = coalesce(c.telegram, excluded.telegram),
    website = coalesce(c.website, excluded.website)
  returning c.id into v_client_id;

  insert into public.request_counters as rc (workspace_id, year, last_value) values (v_ws, v_year, 1)
  on conflict (workspace_id, year) do update set last_value = rc.last_value + 1
  returning rc.last_value into v_n;

  insert into public.project_requests (
    workspace_id, client_id, code, locale, form_version, idempotency_key,
    project_types, project_type_other, project_name, project_name_unknown,
    has_existing, existing_url, existing_description, existing_dislikes, existing_works_well, existing_must_change,
    summary, what_it_does, problem, why_now, goals, goal_other,
    audience, primary_users, geography, market, demographics, pain_points,
    scope, scope_needs_advice, materials,
    budget_range, budget_min, budget_max, budget_currency, budget_note,
    start_preference, has_deadline, deadline_date, deadline_reason,
    additional_info, consent_at, privacy_policy_version,
    client_token_hash, client_token_expires_at)
  values (
    v_ws, v_client_id, format('REQ-%s-%s', v_year, lpad(v_n::text, 4, '0')), v_locale,
    coalesce((p_payload ->> 'form_version')::int, 1), p_idempotency_key,
    private.intake_keys(v_project, 'types', 20), private.intake_text(v_project, 'type_other', 200),
    private.intake_text(v_project, 'name', 120), coalesce((v_project ->> 'name_unknown')::boolean, false),
    v_has,
    case when v_has then private.intake_url(v_existing, 'url') end,
    case when v_has then private.intake_text(v_existing, 'description', 4000) end,
    case when v_has then private.intake_text(v_existing, 'dislikes', 4000) end,
    case when v_has then private.intake_text(v_existing, 'works_well', 4000) end,
    case when v_has then private.intake_text(v_existing, 'must_change', 4000) end,
    private.intake_text(v_about, 'summary', 4000, true), private.intake_text(v_about, 'what_it_does', 4000),
    private.intake_text(v_about, 'problem', 4000), private.intake_text(v_about, 'why_now', 4000),
    private.intake_keys(v_about, 'goals', 20), private.intake_text(v_about, 'goal_other', 200),
    private.intake_text(v_aud, 'audience', 4000), private.intake_text(v_aud, 'primary_users', 4000),
    private.intake_text(v_aud, 'geography', 200), private.intake_text(v_aud, 'market', 20),
    private.intake_text(v_aud, 'demographics', 1000), private.intake_text(v_aud, 'pain_points', 4000),
    private.intake_keys(v_scope, 'items', 30), coalesce((v_scope ->> 'needs_advice')::boolean, false),
    private.intake_keys(v_mat, 'items', 30),
    private.intake_text(v_budget, 'range', 40), (v_budget ->> 'min')::numeric, (v_budget ->> 'max')::numeric,
    private.intake_text(v_budget, 'currency', 3), private.intake_text(v_budget, 'note', 1000),
    private.intake_text(v_time, 'start', 40), v_deadline,
    case when v_deadline then (v_time ->> 'deadline_date')::date end,
    case when v_deadline then private.intake_text(v_time, 'deadline_reason', 1000) end,
    private.intake_text(p_payload, 'additional_info', 6000), now(), v_policy,
    encode(sha256(convert_to(v_token, 'UTF8')), 'hex'), now() + interval '30 days')
  returning * into v_req;

  -- Lists: bounded sizes, every URL validated.
  if jsonb_typeof(coalesce(p_payload -> 'competitors', '[]')) <> 'array' or jsonb_array_length(coalesce(p_payload -> 'competitors', '[]')) > 10
     or jsonb_typeof(coalesce(p_payload -> 'references', '[]')) <> 'array' or jsonb_array_length(coalesce(p_payload -> 'references', '[]')) > 10
     or jsonb_array_length(coalesce(v_existing -> 'links', '[]')) + jsonb_array_length(coalesce(v_mat -> 'links', '[]')) > 15 then
    raise exception 'invalid:lists' using errcode = '22023';
  end if;
  v_i := 0;
  for v_item in select * from jsonb_array_elements(coalesce(p_payload -> 'competitors', '[]')) loop
    insert into public.project_request_competitors (request_id, name, url, likes, dislikes, why, position)
    values (v_req.id, private.intake_text(v_item, 'name', 120, true), private.intake_url(v_item, 'url'),
            private.intake_text(v_item, 'likes', 2000), private.intake_text(v_item, 'dislikes', 2000),
            private.intake_text(v_item, 'why', 2000), v_i);
    v_i := v_i + 1;
  end loop;
  v_i := 0;
  for v_item in select * from jsonb_array_elements(coalesce(p_payload -> 'references', '[]')) loop
    insert into public.project_request_references (request_id, url, note, position)
    values (v_req.id, private.intake_url(v_item, 'url', true), private.intake_text(v_item, 'note', 2000), v_i);
    v_i := v_i + 1;
  end loop;
  v_i := 0;
  for v_item in
    select e from jsonb_array_elements(case when v_has then coalesce(v_existing -> 'links', '[]') else '[]' end) e
  loop
    insert into public.project_request_links (request_id, link_group, kind, url, position)
    values (v_req.id, 'existing', coalesce(private.intake_text(v_item, 'kind', 40), 'other'), private.intake_url(v_item, 'url', true), v_i);
    v_i := v_i + 1;
  end loop;
  v_i := 0;
  for v_item in select * from jsonb_array_elements(coalesce(v_mat -> 'links', '[]')) loop
    insert into public.project_request_links (request_id, link_group, kind, url, position)
    values (v_req.id, 'materials', coalesce(private.intake_text(v_item, 'kind', 40), 'other'), private.intake_url(v_item, 'url', true), v_i);
    v_i := v_i + 1;
  end loop;

  -- Project brief, version 1: the immutable record of what the client sent.
  insert into public.project_request_documents (request_id, document_type, version, locale, content, created_by)
  values (v_req.id, 'project_brief', 1, v_locale, public.project_request_snapshot(v_req.id), null);

  return jsonb_build_object('code', v_req.code, 'submitted_at', v_req.submitted_at, 'token', v_token,
                            'project_name', v_req.project_name, 'duplicate', false);
end $$;
revoke execute on function public.submit_project_request(jsonb, text, text, uuid) from public;
grant execute on function public.submit_project_request(jsonb, text, text, uuid) to anon, authenticated;

-- The client's copy of the brief: the first «project_brief» document, by the token from the submission.
create or replace function public.get_request_brief(p_token text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('code', r.code, 'version', d.version, 'generated_at', d.generated_at,
                            'template_version', d.template_version, 'content', d.content)
  from public.project_requests r
  join public.project_request_documents d on d.request_id = r.id and d.document_type = 'project_brief' and d.version = 1
  where p_token ~ '^[0-9a-f]{64}$'
    and r.client_token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
    and r.client_token_expires_at > now()
$$;
revoke execute on function public.get_request_brief(text) from public;
grant execute on function public.get_request_brief(text) to anon, authenticated;

revoke execute on function public.project_requests_guard() from public, anon, authenticated;
revoke execute on function public.project_request_documents_immutable() from public, anon, authenticated;
