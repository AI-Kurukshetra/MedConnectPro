# MedConnect Pro

Hackathon MVP for patient-provider communication, appointments, reminders, and EHR event sync.

## Stack

- Next.js App Router
- TypeScript (strict)
- TailwindCSS
- Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
- pnpm

## Quick Start

1. Install dependencies:

```bash
pnpm install
```

2. Configure `.env.local`:

```bash
cp .env.example .env.local
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Server-side/API variables:
- `SUPABASE_SERVICE_ROLE_KEY`
- `SMS_WEBHOOK_SECRET`
- `SMS_PROVIDER_API_URL`
- `SMS_PROVIDER_API_KEY`
- `SMS_PROVIDER_FROM_NUMBER`

3. Run app:

```bash
pnpm dev
```

4. Run checks:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Implemented MVP Features

- Supabase Auth login/logout with protected dashboard routes
- Messaging APIs:
  - Thread list/create
  - Message list/create
  - Outbound SMS send
  - Inbound SMS webhook (HMAC + timestamp verification)
- Appointments APIs:
  - List/create/update/read appointments
  - Real-time slot availability
  - Booking conflict protection (`appointments_provider_no_overlap`)
  - Automated confirmation notification enqueue on booking
- Reminders APIs:
  - Reminder generation from org rules + patient preferences
  - Patient notification preference get/update
- Notifications APIs:
  - Queue/list notification deliveries
  - Dispatch pending deliveries across channels (SMS/email/voice/push/in-app)
- EHR APIs:
  - EHR connection upsert/read
  - Sync event enqueue for appointment/message payloads
- Dashboard UI:
  - `/dashboard` role-view selector
  - `/dashboard/patient` patient portal sections
  - `/dashboard/provider` provider operational view
- HIPAA baseline:
  - RLS-oriented data model and policies in `doc/SCHEMA.md`
  - Encrypted-message field usage (`body_ciphertext`)
  - API-level audit event writes to `audit_logs`

## API Routes

- `GET/POST /api/messages/threads`
- `GET/POST /api/messages/threads/[threadId]/messages`
- `POST /api/messages/send/sms`
- `POST /api/messages/inbound/sms`
- `GET/POST /api/appointments`
- `GET/PATCH /api/appointments/[appointmentId]`
- `GET /api/appointments/availability`
- `POST /api/reminders/generate`
- `GET/PATCH /api/reminders/preferences`
- `GET/POST /api/notifications`
- `POST /api/notifications/dispatch`
- `GET/POST /api/integrations/ehr/connection`
- `POST /api/integrations/ehr/sync`

## Tests

- Unit tests run with Vitest (`pnpm test`)
- Current coverage includes:
  - Validation logic
  - SMS signature verification
  - Route-level auth/validation behavior
- E2E scaffold exists at `tests/e2e/core-journey.spec.js`

## Project Planning Docs

See `doc/`:
- `PRD.md`
- `TASKS.md`
- `PROGRESS.md`
- `CHANGELOG.md`
- `DECISIONS.md`
- `SCHEMA.md`
