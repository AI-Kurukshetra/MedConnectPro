# TASKS

Status key: `[ ]` todo, `[x]` done, `[~]` in-progress, `[!]` blocked

## Session Bootstrap
- [x] `2026-03-14 10:59` Initialize `/doc` system from AGENTS + BLUEPRINT with MVP-only scope
- [x] `2026-03-14 11:02` Refactor docs to enforce required stack only (Next.js + Supabase + Vercel + TypeScript + TailwindCSS)
- [x] `2026-03-14 11:40` Scaffold initial Next.js App Router architecture with Tailwind + Supabase client setup and core directories
- [x] `2026-03-14 12:15` Stabilize baseline quality gates: fix strict TypeScript errors and add non-interactive ESLint config
- [x] `2026-03-14 12:21` Fix review findings: make `pnpm typecheck` deterministic and run Supabase session middleware on all app routes
- [x] `2026-03-14 14:20` Add manual QA seed SQL block in `doc/SCHEMA.md` for dashboard/API end-to-end testing
- [x] `2026-03-14 15:33` Add project-local frontend skill scaffolding (`.agents/skills/frontend-design`, `.codex/agents`) for repeatable UI workflows
- [x] `2026-03-14 16:55` Upgrade Next.js and lint config to clear Vercel vulnerable Next.js alert (`CVE-2025-66478`)

## MVP Delivery Plan (Must-Have)
- [x] `2026-03-14 12:32` Finalize Supabase MVP schema + RLS SQL in `doc/SCHEMA.md` for dashboard execution
- [x] `2026-03-14 12:39` Apply SQL manually in Supabase Dashboard (human step)
- [x] `2026-03-14 12:23` Implement Supabase Auth + protected dashboard layout gate in Next.js App Router
- [x] `2026-03-14 17:35` Enforce role-based dashboard access: patient users restricted from provider dashboard and role-specific entry cards
- [x] `2026-03-14 12:42` Implement messaging endpoints via Next.js Route Handlers (`app/api/messages/*`)
- [x] `2026-03-14 12:45` Implement secure inbound SMS webhook + outbound SMS send flow for true two-way patient/provider messaging
- [x] `2026-03-14 12:49` Implement appointment endpoints via Next.js Route Handlers (`app/api/appointments/*`)
- [x] `2026-03-14 12:50` Implement real-time appointment availability slot calculation + booking conflict prevention in Supabase
- [x] `2026-03-14 12:53` Implement automated appointment confirmation notifications on successful booking
- [x] `2026-03-14 12:54` Implement reminder generation workflow (`app/api/reminders/*`)
- [x] `2026-03-14 12:54` Implement configurable reminder preferences and channel selection (SMS/email/voice) per patient
- [x] `2026-03-14 12:56` Implement patient portal pages (appointments + messages)
- [x] `2026-03-14 12:56` Implement responsive patient portal access patterns for mobile and desktop
- [x] `2026-03-14 12:56` Implement provider dashboard pages (queue + schedule + reminder status)
- [x] `2026-03-14 12:58` Implement HIPAA communication safeguards: RLS hardening, encrypted message storage fields, and audit logging tasks in schema/API
- [x] `2026-03-14 12:59` Implement one EHR integration adapter endpoint (`app/api/integrations/ehr/*`)
- [x] `2026-03-14 12:59` Implement minimal EHR data sync mapping for appointments and patient communication events
- [x] `2026-03-14 13:01` Implement multi-channel notification pipeline route handlers (`app/api/notifications/*`) for SMS, email, voice, and push
- [x] `2026-03-14 13:54` Set up Vitest test runner and add `pnpm test` script
- [x] `2026-03-14 14:02` Add unit tests for Zod schemas and route handlers
- [x] `2026-03-14 13:54` Add E2E test for core journey: login -> book -> reminder -> message reply
- [x] `2026-03-14 13:54` Run checks (`pnpm lint`, `pnpm typecheck`, `pnpm build`) and full test suite once test scripts exist
- [x] `2026-03-14 15:23` Stabilize auth flow under intermittent Supabase latency by removing login precheck loop and hardening server auth retries/timeouts
- [x] `2026-03-14 15:33` Redesign landing page with clean responsive visual system, clear product messaging, and dashboard/login CTAs

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
