---
name: frontend-design
description: >
  Build clean, modern Next.js pages and components with Tailwind and shadcn/ui.
  Triggers on: landing pages, dashboard UI, component design, and visual polish requests.
  Does NOT trigger for: database migrations, API business logic, and backend-only tasks.
allow_implicit_invocation: true
---

# Frontend Design Skill

## Purpose
Deliver production-ready UI that is accessible, responsive, and visually intentional.

## Workflow
1. Read existing app routes, shared components, and styling tokens before editing.
2. Prefer server components; add `use client` only when browser APIs or client state are required.
3. Build mobile-first layouts with clear hierarchy and meaningful empty/loading/error states.
4. Reuse shared primitives where available; avoid ad-hoc one-off styling patterns.
5. Verify with `pnpm lint` and `pnpm typecheck` after UI changes.

## Design Standards
- Use a clear visual direction with strong spacing rhythm and readable typography.
- Keep contrast accessible and interactive states obvious (hover/focus/disabled).
- Avoid visual noise; prioritize clean structure and fast scanability.
- Ensure desktop and mobile both load correctly.
