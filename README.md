# MedConnect Pro

Initial MVP scaffold built with:
- Next.js App Router
- TypeScript (strict)
- TailwindCSS
- Supabase JS client (`@supabase/supabase-js` + `@supabase/ssr`)
- Vercel-ready build scripts

## Quick Start

1. Install dependencies:

```bash
pnpm install
```

2. Configure environment variables:

```bash
cp .env.example .env.local
```

Set values in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. Run locally:

```bash
pnpm dev
```

4. Build check:

```bash
pnpm build
```

## Current Scaffold

- `app/` basic pages and layout
- `app/login` login placeholder page
- `app/dashboard` protected placeholder page
- `lib/supabase` browser/server Supabase client setup
- `lib/auth` auth helper (`requireUser`)
- `middleware.ts` dashboard route protection baseline
- `components/`, `types/`, `hooks/`, `utils/` starter modules

No full feature implementation is included yet.
