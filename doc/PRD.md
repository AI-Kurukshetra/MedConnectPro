# MedConnect Pro MVP PRD

## Product Goal
Build a demo-ready patient engagement MVP for small-to-medium healthcare practices that reduces no-shows and improves patient-provider communication.

## Mandatory Technology Stack
Use only:
1. Next.js (App Router)
2. Supabase (Database, Auth, Storage)
3. Vercel (Deployment)
4. TypeScript
5. TailwindCSS

Do not use:
1. Express
2. Standalone Node backend servers
3. Firebase
4. Prisma
5. Docker
6. Any local databases

## MVP Scope (MUST-HAVE ONLY)
1. Secure two-way patient-provider messaging
2. Appointment scheduling with real-time slot availability
3. Automated appointment reminders
4. Basic patient portal (upcoming appointments + message inbox)
5. Provider dashboard (appointments, message queue, reminder status)
6. One EHR integration adapter (single connector surface)
7. Mobile-responsive UX

## Out of Scope (Now)
1. AI chatbot and predictive analytics
2. Telehealth/video workflows
3. Billing/payment flows
4. Native mobile apps
5. Mass communication campaigns
6. Advanced analytics

## Primary Users
1. Practice staff
2. Provider
3. Patient

## Core User Stories
1. As a patient, I can message my provider and get replies in the portal.
2. As a patient, I can book or reschedule appointments.
3. As a patient, I receive automated reminders before appointments.
4. As provider/staff, I can view and reply to patient messages.
5. As provider/staff, I can manage schedule and reminder rules.
6. As staff, I can connect one EHR integration and track sync status.

## Architecture (MVP)
1. Frontend and backend both run in Next.js App Router on Vercel.
2. Protected pages use Supabase Auth session checks in server components and middleware.
3. Data persistence is only Supabase Postgres with RLS policies.
4. File assets (if needed in MVP) use Supabase Storage.
5. No separate backend service, no Express server, and no local DB runtime.

## API Structure (MVP)
1. Use Next.js Route Handlers under `app/api/*` for HTTP endpoints.
2. Use Server Actions for simple authenticated mutations where suitable.
3. API groups:
   - `app/api/messages/*`
   - `app/api/appointments/*`
   - `app/api/reminders/*`
   - `app/api/integrations/ehr/*`
4. Route handlers call Supabase via server client utilities only.
5. Input/output contracts validated with Zod in TypeScript.

## Functional Requirements
1. Authenticated users only for protected routes.
2. Role-based access: patient vs provider/staff.
3. Conversation threads scoped by organization and patient.
4. Appointment lifecycle: `scheduled`, `confirmed`, `cancelled`, `completed`, `no_show`.
5. Reminder jobs generated from appointment times + reminder rules.
6. Audit timestamps on sensitive entities.

## Non-Functional Requirements
1. HIPAA-aware baseline: strict access control, minimal PHI, auditable records.
2. RLS enabled on all tables.
3. Strict TypeScript and schema validation for writes.
4. Mobile-first responsive UI via TailwindCSS.
5. Build-ready on Vercel with `pnpm build`.

## Success Metrics (MVP)
1. Reminder generation success rate >= 95% in test dataset.
2. Median provider response time trend visible on dashboard.
3. Appointment booking completion rate >= 80% in test flow.
4. Patient portal adoption visible from MVP events.

## Assumptions
1. Supabase Auth is identity source of truth.
2. One primary organization context per user in MVP.
3. EHR integration is minimal and asynchronous in MVP.
