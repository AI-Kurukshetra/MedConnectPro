# TASKS

Status key: `[ ]` todo, `[x]` done, `[~]` in-progress, `[!]` blocked

## Session Bootstrap
- [x] `2026-03-14 10:59` Initialize `/doc` system from AGENTS + BLUEPRINT with MVP-only scope
- [x] `2026-03-14 11:02` Refactor docs to enforce required stack only (Next.js + Supabase + Vercel + TypeScript + TailwindCSS)
- [x] `2026-03-14 11:40` Scaffold initial Next.js App Router architecture with Tailwind + Supabase client setup and core directories
- [x] `2026-03-14 12:15` Stabilize baseline quality gates: fix strict TypeScript errors and add non-interactive ESLint config
- [x] `2026-03-14 12:21` Fix review findings: make `pnpm typecheck` deterministic and run Supabase session middleware on all app routes

## MVP Delivery Plan (Must-Have)
- [ ] Finalize Supabase MVP schema + RLS SQL in `doc/SCHEMA.md` for dashboard execution
- [ ] Apply SQL manually in Supabase Dashboard (human step)
- [x] `2026-03-14 12:23` Implement Supabase Auth + protected dashboard layout gate in Next.js App Router
- [ ] Implement messaging endpoints via Next.js Route Handlers (`app/api/messages/*`)
- [ ] Implement secure inbound SMS webhook + outbound SMS send flow for true two-way patient/provider messaging
- [ ] Implement appointment endpoints via Next.js Route Handlers (`app/api/appointments/*`)
- [ ] Implement real-time appointment availability slot calculation + booking conflict prevention in Supabase
- [ ] Implement automated appointment confirmation notifications on successful booking
- [ ] Implement reminder generation workflow (`app/api/reminders/*`)
- [ ] Implement configurable reminder preferences and channel selection (SMS/email/voice) per patient
- [ ] Implement patient portal pages (appointments + messages)
- [ ] Implement responsive patient portal access patterns for mobile and desktop
- [ ] Implement provider dashboard pages (queue + schedule + reminder status)
- [ ] Implement HIPAA communication safeguards: RLS hardening, encrypted message storage fields, and audit logging tasks in schema/API
- [ ] Implement one EHR integration adapter endpoint (`app/api/integrations/ehr/*`)
- [ ] Implement minimal EHR data sync mapping for appointments and patient communication events
- [ ] Implement multi-channel notification pipeline route handlers (`app/api/notifications/*`) for SMS, email, voice, and push
- [ ] Set up Vitest test runner and add `pnpm test` script
- [ ] Add unit tests for Zod schemas and route handlers
- [ ] Add E2E test for core journey: login -> book -> reminder -> message reply
- [ ] Run checks (`pnpm lint`, `pnpm typecheck`, `pnpm build`) and full test suite once test scripts exist

## Stack Guardrails (Non-Negotiable)
- [ ] No Express or standalone Node backend server introduced
- [ ] No Firebase, Prisma, Docker, or local database introduced
- [ ] No infrastructure CLI dependency that blocks MVP progress

## Explicit Non-MVP (Deferred)
- [ ] AI assistant/chatbot
- [ ] Predictive no-show scoring
- [ ] Telehealth module
- [ ] Payments and billing reminders
- [ ] Mass communication campaigns (cohort targeting + broadcast)
