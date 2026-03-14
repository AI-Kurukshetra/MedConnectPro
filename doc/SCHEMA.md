# SCHEMA

Supabase-first schema for MVP. SQL is intended for manual execution in Supabase Dashboard.

## Stack Alignment
1. Database: Supabase Postgres only
2. Auth: Supabase Auth only
3. Storage: Supabase Storage only (optional for MVP assets)
4. No Prisma schema, no local DB, no Docker-based local infra

## Migration History
- 2026-03-14: Draft 001 initial MVP schema and RLS
- 2026-03-14: Draft 002 stack-aligned schema notes and API mapping updates

## Core Tables (MVP)
1. `profiles` - auth-linked user profile and role
2. `organizations` - healthcare practice tenant
3. `org_members` - membership and role in organization
4. `patients` - patient profile data
5. `patient_provider_links` - provider assignments
6. `message_threads` - patient conversation containers
7. `messages` - thread messages
8. `appointments` - scheduling lifecycle
9. `reminder_rules` - configurable reminder offsets
10. `appointment_reminders` - generated reminder jobs
11. `ehr_connections` - one integration connection per organization
12. `ehr_sync_events` - integration sync logs

## API-to-Table Mapping (Next.js Route Handlers)
1. `app/api/messages/*` -> `message_threads`, `messages`
2. `app/api/appointments/*` -> `appointments`
3. `app/api/reminders/*` -> `reminder_rules`, `appointment_reminders`
4. `app/api/integrations/ehr/*` -> `ehr_connections`, `ehr_sync_events`

## SQL Block (Draft 001)
```sql
create extension if not exists "pgcrypto";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE app_role AS ENUM ('patient', 'provider', 'staff', 'admin');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_status') THEN
    CREATE TYPE appointment_status AS ENUM ('scheduled', 'confirmed', 'cancelled', 'completed', 'no_show');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reminder_channel') THEN
    CREATE TYPE reminder_channel AS ENUM ('in_app', 'email');
  END IF;
END$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role app_role not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.org_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  member_role app_role not null,
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid unique references public.profiles(id) on delete set null,
  date_of_birth date,
  phone text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.patient_provider_links (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  provider_user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (patient_id, provider_user_id)
);

create table if not exists public.message_threads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  subject text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.message_threads(id) on delete cascade,
  sender_user_id uuid not null references public.profiles(id) on delete restrict,
  body text not null check (char_length(body) > 0),
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  provider_user_id uuid not null references public.profiles(id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status appointment_status not null default 'scheduled',
  notes text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table if not exists public.reminder_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  channel reminder_channel not null,
  minutes_before integer not null check (minutes_before > 0),
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organization_id, channel, minutes_before)
);

create table if not exists public.appointment_reminders (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  channel reminder_channel not null,
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  status text not null default 'pending',
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists public.ehr_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations(id) on delete cascade,
  provider_name text not null,
  external_tenant_id text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ehr_sync_events (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.ehr_connections(id) on delete cascade,
  entity_type text not null,
  entity_id uuid,
  direction text not null check (direction in ('inbound', 'outbound')),
  status text not null check (status in ('pending', 'success', 'failed')),
  payload jsonb,
  error_message text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.org_members enable row level security;
alter table public.patients enable row level security;
alter table public.patient_provider_links enable row level security;
alter table public.message_threads enable row level security;
alter table public.messages enable row level security;
alter table public.appointments enable row level security;
alter table public.reminder_rules enable row level security;
alter table public.appointment_reminders enable row level security;
alter table public.ehr_connections enable row level security;
alter table public.ehr_sync_events enable row level security;

create or replace function public.is_org_member(target_org_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.org_members om
    where om.organization_id = target_org_id
      and om.user_id = (select auth.uid())
  );
$$;

create policy if not exists profiles_self_read on public.profiles
for select using (id = (select auth.uid()));

create policy if not exists profiles_self_update on public.profiles
for update using (id = (select auth.uid()));

create policy if not exists org_members_member_read on public.org_members
for select using (user_id = (select auth.uid()) or public.is_org_member(organization_id));

create policy if not exists organizations_member_read on public.organizations
for select using (public.is_org_member(id));

create policy if not exists patients_member_rw on public.patients
for all using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

create policy if not exists links_member_rw on public.patient_provider_links
for all using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

create policy if not exists threads_member_rw on public.message_threads
for all using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

create policy if not exists messages_thread_member_rw on public.messages
for all using (
  exists (
    select 1
    from public.message_threads mt
    where mt.id = thread_id
      and public.is_org_member(mt.organization_id)
  )
)
with check (
  sender_user_id = (select auth.uid()) and
  exists (
    select 1
    from public.message_threads mt
    where mt.id = thread_id
      and public.is_org_member(mt.organization_id)
  )
);

create policy if not exists appointments_member_rw on public.appointments
for all using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

create policy if not exists reminder_rules_member_rw on public.reminder_rules
for all using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

create policy if not exists appointment_reminders_member_read on public.appointment_reminders
for select using (
  exists (
    select 1
    from public.appointments a
    where a.id = appointment_id
      and public.is_org_member(a.organization_id)
  )
);

create policy if not exists ehr_connections_member_rw on public.ehr_connections
for all using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

create policy if not exists ehr_sync_events_member_read on public.ehr_sync_events
for select using (
  exists (
    select 1
    from public.ehr_connections ec
    where ec.id = connection_id
      and public.is_org_member(ec.organization_id)
  )
);
```

## Notes
1. All write paths should run through Next.js Route Handlers or Server Actions using Supabase server client.
2. Any cross-organization privileged operations must remain server-side only.
