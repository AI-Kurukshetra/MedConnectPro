# DECISIONS

## 2026-03-14 - Stack Constraint Override Applied
- Decision: Ignore any blueprint stack suggestions and enforce only Next.js App Router, Supabase, Vercel, TypeScript, TailwindCSS.
- Rationale: User-corrected scope for hackathon delivery and architecture consistency.

## 2026-03-14 - No Standalone Backend Service
- Decision: All backend behavior must live in Next.js Route Handlers and Server Actions.
- Rationale: Prevents architecture drift into Express or separate Node services.

## 2026-03-14 - Supabase as Full BaaS Layer
- Decision: Use Supabase Postgres + Auth + Storage only; no Prisma/Firebase/local DB.
- Rationale: Simplifies setup, keeps deployment aligned with Vercel, and removes infra overhead.

## 2026-03-14 - MVP Scope Locked to Must-Have Features
- Decision: Restrict MVP to messaging, appointments/reminders, patient portal, provider dashboard, and one EHR connector.
- Rationale: Matches blueprint MVP feature list while preserving hackathon timeline.

## 2026-03-14 - Multi-Tenant Organization Boundary + RLS
- Decision: Keep `organizations` and `org_members` as authorization core with RLS on every table.
- Rationale: Enforces least privilege and HIPAA-aware access boundaries from day one.

## 2026-03-14 - TASKS Backlog Extended to Full Feature Coverage
- Decision: Add explicit MVP tasks for partially covered features (two-way SMS transport flow, real-time availability + confirmations, configurable reminders, HIPAA safeguards, mass broadcast tooling, multi-channel notifications, and EHR sync mapping).
- Rationale: Existing backlog had feature-level intent but missed several implementation-critical tasks required to claim full coverage of all 9 must-have features.

## 2026-03-14 - Start with Architecture-Only Scaffold
- Decision: Generate only foundational project structure, configuration, and Supabase client/auth plumbing; defer all business features.
- Rationale: Preserves momentum and de-risks setup while keeping MVP feature implementation in explicit backlog tasks.

## 2026-03-14 - Baseline Quality Gates Must Be Non-Interactive and Strict-Clean
- Decision: Add committed ESLint config and resolve strict TypeScript errors before feature implementation continues.
- Rationale: Prevents CI/dev pipeline stalls and ensures every subsequent feature task starts from a buildable baseline.

## 2026-03-14 - Align MVP Backlog to PRD Scope
- Decision: Treat mass communication as deferred (non-MVP) and update TASKS accordingly.
- Rationale: Removes planning ambiguity and keeps execution aligned to the current PRD scope for hackathon delivery.

## 2026-03-14 - Deterministic Typecheck + Global Session Refresh
- Decision: Run `tsc` in non-incremental mode for `pnpm typecheck`, and apply middleware to all non-static routes for Supabase `updateSession()`.
- Rationale: Eliminates cache-related false negatives in type checks and aligns auth/session behavior with project standards that require request-wide session refresh.

## 2026-03-14 - Password Auth via Server Actions for MVP
- Decision: Implement login/logout with Supabase password auth in Next.js Server Actions and keep route protection in both middleware and dashboard layout.
- Rationale: Provides minimal secure MVP authentication flow with no extra API surface, while preserving destination-aware redirects for protected routes.

## 2026-03-14 - Final Schema Uses Channel-Complete Notifications + Audit Baseline
- Decision: Finalize schema with message/reminder/notification channel coverage (`sms`, `email`, `voice`, `push`), patient-level notification preferences, provider-slot conflict prevention, and service-role-only audit/EHR event writes.
- Rationale: Aligns database model directly to MVP feature requirements and prevents late-stage rework in route handler implementation.

## 2026-03-14 - Messaging API Surface Starts with Thread + Message Endpoints
- Decision: Implement initial messaging API as `GET/POST /api/messages/threads` and `GET/POST /api/messages/threads/[threadId]/messages`, with auth and validation in route handlers and access enforcement via Supabase RLS.
- Rationale: Delivers the minimal composable foundation for patient/provider chat flows while keeping webhook/SMS transport work isolated to the next task.

## 2026-03-14 - SMS Webhook Security Uses Signed Raw Payload + Timestamp Window
- Decision: Require `x-medconnect-signature` (HMAC-SHA256 hex over `<timestamp>.<raw_body>`) and `x-medconnect-timestamp` on inbound SMS webhook requests, validated server-side before any DB write.
- Rationale: Prevents spoofed/replayed inbound SMS payloads while keeping provider integration transport-agnostic for MVP.

## 2026-03-14 - Appointment API Uses Conflict-Driven Booking Validation
- Decision: Implement booking/edit endpoints directly on `appointments` table and surface DB exclusion-constraint conflicts as API-level `409` responses.
- Rationale: Keeps availability integrity centralized in Postgres and avoids divergent conflict logic between API and schema.

## 2026-03-14 - Availability Calculation Uses Booked-Range Exclusion
- Decision: Compute available appointment slots in API by generating a provider/day slot grid and excluding overlaps against existing `scheduled` and `confirmed` rows.
- Rationale: Delivers deterministic real-time availability for MVP without introducing background schedulers or additional infrastructure.

## 2026-03-14 - Booking API Enqueues Confirmation Notifications Immediately
- Decision: On successful appointment creation, enqueue confirmation deliveries across allowed channels using patient contact and preference data.
- Rationale: Guarantees confirmation workflow is triggered at booking time and keeps downstream channel dispatch decoupled.

## 2026-03-14 - Reminder Generation Applies Both Org Rules and Patient Preferences
- Decision: Generate reminder jobs only where an enabled org reminder rule exists and the target patient channel preference allows delivery.
- Rationale: Prevents generating reminder jobs that are invalid for user-configured channels and reduces downstream delivery failures.

## 2026-03-14 - Dashboard UX Split Into Patient and Provider Views
- Decision: Use dedicated dashboard routes (`/dashboard/patient`, `/dashboard/provider`) with a lightweight root selector page instead of a single mixed dashboard screen.
- Rationale: Keeps MVP workflows focused per user context and simplifies iteration on role-specific UI blocks.

## 2026-03-14 - Audit Logging Is Best-Effort and Non-Blocking in MVP
- Decision: Record audit events through service-role inserts where available, but never fail primary API operations solely due to audit write errors.
- Rationale: Preserves user-facing workflow reliability while still capturing HIPAA-oriented audit trails under normal conditions.

## 2026-03-14 - EHR Sync Is Event-Enqueued With Minimal Canonical Payloads
- Decision: Adapter writes `ehr_sync_events` with `pending` status using mapped appointment (`Appointment`) and message (`Communication`) payloads instead of synchronous external calls.
- Rationale: Keeps MVP integration resilient and observable without coupling request latency to third-party EHR availability.

## 2026-03-14 - Notification Pipeline Uses Queue + Dispatcher Endpoints
- Decision: Split notification handling into enqueue/list (`/api/notifications`) and delivery processing (`/api/notifications/dispatch`) endpoints with channel-specific dispatch behavior.
- Rationale: Supports multi-channel MVP messaging while allowing later replacement of mocked channel providers without API contract changes.

## 2026-03-14 - Testing Baseline Uses Vitest + Route-Level Unit Coverage
- Decision: Establish lightweight test baseline with Vitest and prioritize unit tests on shared validation/security logic plus API handler auth/validation behavior.
- Rationale: Delivers fast confidence gates in the hackathon timeline while E2E infrastructure is still being wired.

## 2026-03-14 - Introduce Zod Schemas for Reminder Payload Validation
- Decision: Add dedicated Zod schema module for reminder generation and preference payloads, with tests asserting valid/invalid parse behavior.
- Rationale: Aligns with project validation standards and provides a stable schema surface for API handlers and future form integration.
