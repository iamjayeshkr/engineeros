# EngineerOS — Phase 0

Auth + dashboard shell + schema. See `/architecture` doc from planning for the full 6-month roadmap.

## What's in this scaffold

- Supabase Auth: email/password, Google, GitHub, forgot password — `lib/auth/`
- Middleware-based route protection — `middleware.ts`
- Dashboard shell: sidebar, topbar, ⌘K command palette — `components/shared/`
- Dashboard page wired to real Prisma queries (empty-state safe) — `app/(dashboard)/dashboard/`
- Full Prisma schema for all modules (Goals, DSA, Roadmap, Projects, Interviews, Resume, Learning, StudySession) — `prisma/schema.prisma`
- Repository → Service → Server Action layering enforced — `server/`

## Setup

1. **Install deps**
   ```bash
   npm install
   ```

2. **Create a Supabase project** at supabase.com, then:
   - Enable Google + GitHub providers under Authentication → Providers (needs OAuth app credentials from each platform's dev console — redirect URL is `https://<your-project>.supabase.co/auth/v1/callback`)
   - Copy `.env.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` from Project Settings → API
   - Copy the pooled connection string into `DATABASE_URL` from Project Settings → Database

3. **Push the schema**
   ```bash
   npm run db:generate
   npm run db:push
   ```

4. **Run it**
   ```bash
   npm run dev
   ```

## What's intentionally NOT built yet (Phase 1+)

Goals CRUD, DSA tracker UI, Analytics, Calendar, Backend Roadmap, Projects, Interview Tracker, Resume, Learning, Testing module, AI features. Schema for all of them already exists in `prisma/schema.prisma` — building the UI for each is additive, no migrations needed except where noted in the architecture doc.

## Known gaps to fix before this is "real"

- `career_score` is never recalculated — needs a scheduled job or an on-write trigger once Goals/DSA/Roadmap modules exist to feed it
- No rate limiting on `/api/ai/*` routes (add before wiring Gemini in Phase 5)
- OAuth callback route assumes Supabase's default flow; test against your actual Google/GitHub app credentials before relying on it
