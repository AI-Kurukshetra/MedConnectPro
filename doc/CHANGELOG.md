# CHANGELOG

## 2026-03-14
- docs(doc): Added initial `/doc` system files for MVP planning and coordination.
- docs(schema): Added first-pass Supabase MVP schema + RLS SQL draft in `doc/SCHEMA.md`.
- docs(product): Added MVP-only PRD and prioritized task backlog.
- docs(product): Refined MVP PRD with explicit architecture/API constraints and banned technologies.
- docs(tasks): Updated backlog and guardrails to prohibit Express/Firebase/Prisma/Docker/local DB.
- docs(schema): Updated schema notes and API mapping for Supabase-only architecture.
- docs(decisions): Added stack-constraint and no-standalone-backend architecture decisions.

- docs(tasks): Expanded MVP checklist to fully cover all 9 must-have features from required feature source of truth.
- feat(config): Scaffolded project baseline with Next.js App Router, TypeScript strict config, TailwindCSS, Supabase SSR/browser clients, middleware auth gate, and starter app/pages.
- fix(auth): Added explicit cookie typing for Supabase SSR helpers to satisfy strict TypeScript in middleware and server client.
- chore(config): Added `.eslintrc.json` so `pnpm lint` runs non-interactively.
- docs(tasks): Reconciled backlog scope/check entries with PRD; moved mass communication to deferred and added explicit Vitest setup task.
- fix(config): Made `pnpm typecheck` deterministic by disabling TypeScript incremental cache usage in the typecheck script.
- fix(auth): Updated root middleware matcher to run Supabase `updateSession()` on all non-static routes instead of only `/dashboard`.
- chore(config): Ignored `*.tsbuildinfo` artifacts to keep working tree clean after TypeScript runs.
- feat(auth): Added server actions for password sign-in and sign-out with safe `next` redirect handling.
- feat(ui): Replaced login placeholder with functional auth form and error states; added dashboard sign-out control in app shell header.
- fix(auth): Preserved intended destination for protected route redirects by attaching `next` query param when redirecting to `/login`.
- docs(schema): Finalized `doc/SCHEMA.md` SQL for MVP execution with full channel enums (SMS/email/voice/push), patient notification preferences, appointment no-overlap exclusion constraint, notification delivery tracking, and HIPAA-oriented audit log policies.
- fix(schema): Replaced unsupported `create policy if not exists` syntax with Postgres-compatible `drop policy if exists` + `create policy` statements for Supabase SQL Editor execution.
- feat(api): Added messaging route handlers at `app/api/messages/threads` and `app/api/messages/threads/[threadId]/messages` for authenticated thread/message read-write operations.
- fix(config): Added `tsconfig.typecheck.json` and updated `pnpm typecheck` script to avoid generated `.next/types` race conditions.
- feat(api): Added secure inbound SMS webhook endpoint at `app/api/messages/inbound/sms` with HMAC signature + timestamp verification and admin-client persistence flow.
- feat(api): Added outbound SMS send endpoint at `app/api/messages/send/sms` with provider dispatch, message persistence, and notification delivery tracking.
- feat(config): Added server-side Supabase admin helper and SMS env typings (`SUPABASE_SERVICE_ROLE_KEY`, `SMS_WEBHOOK_SECRET`, provider config vars).
