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
