# SCHEMA

Supabase-first schema for MVP. SQL below is intended for manual execution in Supabase Dashboard SQL Editor.

## Stack Alignment
1. Database: Supabase Postgres only
2. Auth: Supabase Auth only
3. Storage: Supabase Storage only (optional for MVP assets)
4. No Prisma schema, no local DB, no Docker-based local infra

## Migration History
- 2026-03-14: Draft 001 initial MVP schema and RLS
- 2026-03-14: Draft 002 stack-aligned schema notes and API mapping updates
- 2026-03-14: Final 003 MVP schema + RLS finalized for messaging, appointments, reminders, notifications, and EHR sync

## Core Tables (MVP)
1. `profiles` - auth-linked user profile and app role
2. `organizations` - healthcare practice tenant
3. `org_members` - organization membership and role
4. `patients` - patient profile and communication contact data
5. `patient_provider_links` - provider assignments
6. `message_threads` - patient conversation containers
7. `messages` - encrypted message payload metadata for in-app/SMS/email/voice/push
8. `appointments` - scheduling lifecycle and conflict-safe provider slots
9. `reminder_rules` - org-level reminder timing/channel configuration
10. `patient_notification_preferences` - per-patient channel opt-in/opt-out
11. `appointment_reminders` - generated reminder jobs
12. `notification_deliveries` - outbound provider/channel delivery tracking
13. `audit_logs` - HIPAA-aware auditable data access and mutation events
14. `ehr_connections` - one integration connection per organization
15. `ehr_sync_events` - integration sync logs

## API-to-Table Mapping (Next.js Route Handlers)
1. `app/api/messages/*` -> `message_threads`, `messages`, `notification_deliveries`
2. `app/api/appointments/*` -> `appointments`
3. `app/api/reminders/*` -> `reminder_rules`, `patient_notification_preferences`, `appointment_reminders`
4. `app/api/notifications/*` -> `notification_deliveries`, `appointment_reminders`
5. `app/api/integrations/ehr/*` -> `ehr_connections`, `ehr_sync_events`

## SQL Block (Final 003)
```sql
create extension if not exists "pgcrypto";
create extension if not exists "btree_gist";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('patient', 'provider', 'staff', 'admin');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_status') THEN
    CREATE TYPE public.appointment_status AS ENUM ('scheduled', 'confirmed', 'cancelled', 'completed', 'no_show');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_channel') THEN
    CREATE TYPE public.message_channel AS ENUM ('in_app', 'sms', 'email', 'voice', 'push');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_direction') THEN
    CREATE TYPE public.message_direction AS ENUM ('inbound', 'outbound');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'delivery_status') THEN
    CREATE TYPE public.delivery_status AS ENUM ('pending', 'queued', 'sent', 'delivered', 'failed', 'cancelled');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ehr_connection_status') THEN
    CREATE TYPE public.ehr_connection_status AS ENUM ('active', 'paused', 'error');
  END IF;
END$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.app_role not null,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.org_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  member_role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid unique references public.profiles(id) on delete set null,
  mrn text,
  full_name text not null,
  date_of_birth date,
  phone text,
  email text,
  preferred_timezone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, mrn)
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
  channel public.message_channel not null default 'in_app',
  direction public.message_direction not null,
  body_ciphertext text not null,
  body_preview text,
  external_message_id text,
  metadata jsonb not null default '{}'::jsonb,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_thread_sent_at on public.messages (thread_id, sent_at desc);
create unique index if not exists idx_messages_external_id on public.messages (external_message_id) where external_message_id is not null;

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  provider_user_id uuid not null references public.profiles(id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.appointment_status not null default 'scheduled',
  notes text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index if not exists idx_appointments_org_starts_at on public.appointments (organization_id, starts_at);
create index if not exists idx_appointments_provider_starts_at on public.appointments (provider_user_id, starts_at);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'appointments_provider_no_overlap'
  ) THEN
    ALTER TABLE public.appointments
      ADD CONSTRAINT appointments_provider_no_overlap
      EXCLUDE USING gist (
        provider_user_id WITH =,
        tstzrange(starts_at, ends_at, '[)') WITH &&
      )
      WHERE (status IN ('scheduled', 'confirmed'));
  END IF;
END$$;

create table if not exists public.reminder_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  channel public.message_channel not null,
  minutes_before integer not null check (minutes_before > 0 and minutes_before <= 10080),
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, channel, minutes_before)
);

create table if not exists public.patient_notification_preferences (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  patient_id uuid not null unique references public.patients(id) on delete cascade,
  allow_sms boolean not null default true,
  allow_email boolean not null default true,
  allow_voice boolean not null default false,
  allow_push boolean not null default false,
  quiet_hours_start time,
  quiet_hours_end time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    quiet_hours_start is null
    or quiet_hours_end is null
    or quiet_hours_start <> quiet_hours_end
  )
);

create table if not exists public.appointment_reminders (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  channel public.message_channel not null,
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  status public.delivery_status not null default 'pending',
  error_message text,
  created_at timestamptz not null default now(),
  unique (appointment_id, channel, scheduled_for)
);

create index if not exists idx_reminders_status_schedule on public.appointment_reminders (status, scheduled_for);

create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  patient_id uuid references public.patients(id) on delete set null,
  message_id uuid references public.messages(id) on delete set null,
  appointment_reminder_id uuid references public.appointment_reminders(id) on delete set null,
  channel public.message_channel not null,
  destination text,
  provider_name text,
  provider_message_id text,
  status public.delivery_status not null default 'pending',
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  error_message text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_notification_deliveries_org_requested on public.notification_deliveries (organization_id, requested_at desc);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  phi_accessed boolean not null default false,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_org_created on public.audit_logs (organization_id, created_at desc);

create table if not exists public.ehr_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations(id) on delete cascade,
  provider_name text not null,
  external_tenant_id text,
  status public.ehr_connection_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ehr_sync_events (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.ehr_connections(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_type text not null,
  entity_id uuid,
  direction public.message_direction not null,
  status public.delivery_status not null,
  payload jsonb,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_ehr_sync_events_org_created on public.ehr_sync_events (organization_id, created_at desc);

DROP TRIGGER IF EXISTS trg_profiles_set_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_organizations_set_updated_at ON public.organizations;
CREATE TRIGGER trg_organizations_set_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_patients_set_updated_at ON public.patients;
CREATE TRIGGER trg_patients_set_updated_at
BEFORE UPDATE ON public.patients
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_threads_set_updated_at ON public.message_threads;
CREATE TRIGGER trg_threads_set_updated_at
BEFORE UPDATE ON public.message_threads
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_appointments_set_updated_at ON public.appointments;
CREATE TRIGGER trg_appointments_set_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_reminder_rules_set_updated_at ON public.reminder_rules;
CREATE TRIGGER trg_reminder_rules_set_updated_at
BEFORE UPDATE ON public.reminder_rules
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_patient_notification_preferences_set_updated_at ON public.patient_notification_preferences;
CREATE TRIGGER trg_patient_notification_preferences_set_updated_at
BEFORE UPDATE ON public.patient_notification_preferences
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_ehr_connections_set_updated_at ON public.ehr_connections;
CREATE TRIGGER trg_ehr_connections_set_updated_at
BEFORE UPDATE ON public.ehr_connections
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

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

create or replace function public.is_org_admin(target_org_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.org_members om
    where om.organization_id = target_org_id
      and om.user_id = (select auth.uid())
      and om.member_role = 'admin'
  );
$$;

create or replace function public.is_patient_self(target_patient_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.patients p
    where p.id = target_patient_id
      and p.profile_id = (select auth.uid())
  );
$$;

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.org_members enable row level security;
alter table public.patients enable row level security;
alter table public.patient_provider_links enable row level security;
alter table public.message_threads enable row level security;
alter table public.messages enable row level security;
alter table public.appointments enable row level security;
alter table public.reminder_rules enable row level security;
alter table public.patient_notification_preferences enable row level security;
alter table public.appointment_reminders enable row level security;
alter table public.notification_deliveries enable row level security;
alter table public.audit_logs enable row level security;
alter table public.ehr_connections enable row level security;
alter table public.ehr_sync_events enable row level security;

drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select on public.profiles
for select using (id = (select auth.uid()));

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles
for update using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists organizations_member_select on public.organizations;
create policy organizations_member_select on public.organizations
for select using (public.is_org_member(id));

drop policy if exists organizations_admin_update on public.organizations;
create policy organizations_admin_update on public.organizations
for update using (public.is_org_admin(id)) with check (public.is_org_admin(id));

drop policy if exists org_members_member_select on public.org_members;
create policy org_members_member_select on public.org_members
for select using (public.is_org_member(organization_id));

drop policy if exists org_members_admin_write on public.org_members;
create policy org_members_admin_write on public.org_members
for all using (public.is_org_admin(organization_id)) with check (public.is_org_admin(organization_id));

drop policy if exists patients_member_select on public.patients;
create policy patients_member_select on public.patients
for select using (public.is_org_member(organization_id) or profile_id = (select auth.uid()));

drop policy if exists patients_member_write on public.patients;
create policy patients_member_write on public.patients
for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));

drop policy if exists links_member_rw on public.patient_provider_links;
create policy links_member_rw on public.patient_provider_links
for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));

drop policy if exists threads_member_or_patient_select on public.message_threads;
create policy threads_member_or_patient_select on public.message_threads
for select using (
  public.is_org_member(organization_id)
  or public.is_patient_self(patient_id)
);

drop policy if exists threads_member_write on public.message_threads;
create policy threads_member_write on public.message_threads
for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));

drop policy if exists messages_thread_participant_select on public.messages;
create policy messages_thread_participant_select on public.messages
for select using (
  exists (
    select 1
    from public.message_threads mt
    where mt.id = messages.thread_id
      and (
        public.is_org_member(mt.organization_id)
        or public.is_patient_self(mt.patient_id)
      )
  )
);

drop policy if exists messages_thread_participant_insert on public.messages;
create policy messages_thread_participant_insert on public.messages
for insert with check (
  sender_user_id = (select auth.uid())
  and exists (
    select 1
    from public.message_threads mt
    where mt.id = messages.thread_id
      and (
        public.is_org_member(mt.organization_id)
        or public.is_patient_self(mt.patient_id)
      )
  )
);

drop policy if exists appointments_member_or_patient_select on public.appointments;
create policy appointments_member_or_patient_select on public.appointments
for select using (
  public.is_org_member(organization_id)
  or public.is_patient_self(patient_id)
);

drop policy if exists appointments_member_write on public.appointments;
create policy appointments_member_write on public.appointments
for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));

drop policy if exists reminder_rules_member_rw on public.reminder_rules;
create policy reminder_rules_member_rw on public.reminder_rules
for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));

drop policy if exists patient_prefs_member_or_self_select on public.patient_notification_preferences;
create policy patient_prefs_member_or_self_select on public.patient_notification_preferences
for select using (
  public.is_org_member(organization_id)
  or public.is_patient_self(patient_id)
);

drop policy if exists patient_prefs_member_or_self_update on public.patient_notification_preferences;
create policy patient_prefs_member_or_self_update on public.patient_notification_preferences
for update using (
  public.is_org_member(organization_id)
  or public.is_patient_self(patient_id)
)
with check (
  public.is_org_member(organization_id)
  or public.is_patient_self(patient_id)
);

drop policy if exists patient_prefs_member_insert on public.patient_notification_preferences;
create policy patient_prefs_member_insert on public.patient_notification_preferences
for insert with check (public.is_org_member(organization_id));

drop policy if exists reminders_member_rw on public.appointment_reminders;
create policy reminders_member_rw on public.appointment_reminders
for all using (
  exists (
    select 1
    from public.appointments a
    where a.id = appointment_reminders.appointment_id
      and public.is_org_member(a.organization_id)
  )
)
with check (
  exists (
    select 1
    from public.appointments a
    where a.id = appointment_reminders.appointment_id
      and public.is_org_member(a.organization_id)
  )
);

drop policy if exists deliveries_member_rw on public.notification_deliveries;
create policy deliveries_member_rw on public.notification_deliveries
for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));

drop policy if exists audit_logs_admin_select on public.audit_logs;
create policy audit_logs_admin_select on public.audit_logs
for select using (public.is_org_admin(organization_id));

drop policy if exists audit_logs_service_insert on public.audit_logs;
create policy audit_logs_service_insert on public.audit_logs
for insert with check (auth.role() = 'service_role');

drop policy if exists ehr_connections_member_select on public.ehr_connections;
create policy ehr_connections_member_select on public.ehr_connections
for select using (public.is_org_member(organization_id));

drop policy if exists ehr_connections_admin_write on public.ehr_connections;
create policy ehr_connections_admin_write on public.ehr_connections
for all using (public.is_org_admin(organization_id)) with check (public.is_org_admin(organization_id));

drop policy if exists ehr_sync_events_member_select on public.ehr_sync_events;
create policy ehr_sync_events_member_select on public.ehr_sync_events
for select using (public.is_org_member(organization_id));

drop policy if exists ehr_sync_events_service_insert on public.ehr_sync_events;
create policy ehr_sync_events_service_insert on public.ehr_sync_events
for insert with check (auth.role() = 'service_role');
```

## Implementation Notes
1. `messages.body_ciphertext` stores encrypted payload only; clients should never write plaintext PHI into database fields.
2. `appointments_provider_no_overlap` prevents double-booking active slots for the same provider (`scheduled` and `confirmed` only).
3. `patient_notification_preferences` and `reminder_rules` together support configurable reminder channels (SMS/email/voice/push) and patient-level opt-outs.
4. `notification_deliveries` unifies outbound status tracking across reminders and messaging pipelines.
5. Use service-role server-side only for privileged inserts into `audit_logs` and `ehr_sync_events`.
6. Execute this block once in Supabase Dashboard SQL editor before implementing message/appointment/reminder route handlers.
