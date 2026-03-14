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
