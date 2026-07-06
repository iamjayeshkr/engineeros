# EngineerOS — Architecture & Product Plan v1

Personal Engineering Operating System. Goal: SDE-1 readiness tracker + productivity SaaS, built over 6 months, portfolio-grade.

Scope note upfront: the brief lists ~15 modules, each with 10-20 fields. Building all of it in parallel is how side projects die. This plan sequences it into phases so you have a working, deployable product after Phase 1, not after month 6. Everything below is designed so later phases slot into the same schema/architecture without rewrites.

---

## 1. Architecture Decisions (and why)

| Layer | Choice | Reasoning |
|---|---|---|
| Framework | Next.js 15 App Router | Server Components + Server Actions = less API boilerplate |
| Language | TypeScript strict | Non-negotiable at this scope |
| ORM | **Prisma only** | Drop Drizzle from v1 — running two ORMs against one DB is pure overhead with zero benefit at solo-dev scale. Revisit only if you hit a Prisma perf wall. |
| DB | PostgreSQL (Supabase-hosted) | One provider for DB + Auth, fewer moving parts |
| Auth | Supabase Auth (Email + Google + GitHub) | Native RLS integration with Postgres |
| State | Zustand (client UI state) + React Query (server cache) | Don't put server data in Zustand — common mistake, causes stale-cache bugs |
| Forms | React Hook Form + Zod | Same Zod schema reused for server-action validation |
| Tables | TanStack Table | DSA tracker, interview tracker, resume versions all need sortable/filterable tables |
| Charts | Recharts | Heatmaps need a custom SVG component (Recharts doesn't do GitHub-style heatmaps natively) |
| AI | Gemini API via server-only route | Never call Gemini from client — key exposure + no rate limiting |

---

## 2. Folder Structure

```
engineeros/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   ├── signup/
│   │   └── forgot-password/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── goals/
│   │   ├── dsa/
│   │   ├── roadmap/            # backend engineering roadmap
│   │   ├── projects/           # company website + flagship project modules
│   │   ├── interviews/
│   │   ├── resume/
│   │   ├── learning/
│   │   ├── testing/
│   │   ├── calendar/
│   │   ├── analytics/
│   │   └── settings/
│   ├── api/
│   │   ├── ai/                 # Gemini endpoints only
│   │   └── webhooks/
│   └── layout.tsx
│
├── components/
│   ├── ui/                     # shadcn primitives — don't touch, regenerate via CLI
│   └── shared/                 # composed components used across 2+ features (Heatmap, CircularProgress, CommandPalette)
│
├── features/                   # one folder per module, self-contained
│   ├── dashboard/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── actions.ts          # server actions
│   │   └── types.ts
│   ├── goals/
│   ├── dsa/
│   ├── backend-roadmap/
│   ├── projects/
│   ├── interviews/
│   ├── resume/
│   ├── learning/
│   ├── testing/
│   ├── calendar/
│   ├── analytics/
│   └── ai/
│
├── server/
│   ├── db/                     # prisma client singleton
│   ├── repositories/           # one per Prisma model — ONLY layer that calls prisma.*
│   └── services/               # business logic, composes repositories, called by actions
│
├── lib/
│   ├── auth/
│   ├── validations/            # zod schemas, shared client+server
│   └── constants/
│
├── hooks/                      # global hooks only (useDebounce, useMediaQuery)
├── types/                      # global types not tied to one feature
├── prisma/
│   └── schema.prisma
└── styles/
```

**Rule that keeps this maintainable:** `features/*` never imports Prisma directly. `features/*/actions.ts` calls `server/services/*`, services call `server/repositories/*`. This is the one architectural rule worth enforcing strictly — everything else is negotiable.

---

## 3. Database Schema (Prisma) — Core Models

Below is the backbone. Every module's table follows the same pattern: `userId` FK, `status` enum, `createdAt/updatedAt`, and a `metadata Json?` field for module-specific extensibility (avoids constant migrations as you add fields mid-build).

```prisma
// ── Identity ──────────────────────────────
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  avatarUrl     String?
  careerScore   Int      @default(0)   // computed, cached
  currentStreak Int      @default(0)
  longestStreak Int      @default(0)
  createdAt     DateTime @default(now())

  goals         Goal[]
  dsaProblems   DsaProblem[]
  roadmapItems  RoadmapItem[]
  projects      Project[]
  applications  Application[]
  resumeVersions ResumeVersion[]
  learningItems LearningItem[]
  studySessions StudySession[]   // powers streaks + heatmap, shared across modules
}

// ── Goals (self-referential for nesting) ─────
model Goal {
  id           String   @id @default(cuid())
  userId       String
  parentId     String?
  title        String
  type         GoalType  // LONG_TERM | QUARTERLY | MONTHLY | WEEKLY | DAILY
  priority     Priority  // LOW | MEDIUM | HIGH
  tags         String[]
  estHours     Float?
  actualHours  Float?
  progress     Int      @default(0)  // 0-100, auto-computed from children if any
  status       Status    // NOT_STARTED | IN_PROGRESS | DONE | BLOCKED
  dependsOnIds String[]  // simple array; upgrade to join table if you need dependency graphs later
  startDate    DateTime?
  dueDate      DateTime?

  user     User   @relation(fields: [userId], references: [id])
  parent   Goal?  @relation("GoalHierarchy", fields: [parentId], references: [id])
  children Goal[] @relation("GoalHierarchy")
}

// ── DSA Tracker ───────────────────────────
model DsaProblem {
  id            String     @id @default(cuid())
  userId        String
  title         String
  platform      Platform   // LEETCODE | CODEFORCES | GFG | OTHER
  difficulty    Difficulty // EASY | MEDIUM | HARD
  topic         String[]
  companyTags   String[]
  timeTakenMins Int?
  mistakes      String?
  confidence    Int        @default(3) // 1-5
  revisionCount Int        @default(0)
  bookmarked    Boolean    @default(false)
  solvedAt      DateTime   @default(now())
  nextRevisionAt DateTime?

  user User @relation(fields: [userId], references: [id])
}

// ── Backend Roadmap ───────────────────────
model RoadmapItem {
  id         String   @id @default(cuid())
  userId     String
  topic      String   // "Redis", "Kafka", "System Design", etc.
  category   String
  confidence Int      @default(1) // 1-5
  progress   Int      @default(0)
  notes      String?
  resources  Json?    // [{title, url, type}]
  projectIds String[] // linked projects that used this topic

  user User @relation(fields: [userId], references: [id])
}

// ── Unified Project Model (Company Website + Flagship Project share this) ──
model Project {
  id          String   @id @default(cuid())
  userId      String
  name        String
  kind        ProjectKind // COMPANY_WEBSITE | FLAGSHIP | OTHER
  status      Status
  owner       String?
  risk        RiskLevel?  // LOW | MEDIUM | HIGH
  estHours    Float?
  actualHours Float?
  metadata    Json        // holds kind-specific fields: BRD/PRD/HLD/LLD links, milestones, etc.

  user  User          @relation(fields: [userId], references: [id])
  tasks ProjectTask[]
}

model ProjectTask {
  id        String @id @default(cuid())
  projectId String
  title     String
  phase     String // BRD | PRD | HLD | LLD | FRONTEND | BACKEND | DB | AUTH | DEPLOY | DOCS | TESTING | BUG | PERF
  status    Status

  project Project @relation(fields: [projectId], references: [id])
}

// ── Interview Tracker ─────────────────────
model Application {
  id           String   @id @default(cuid())
  userId       String
  company      String
  role         String
  stage        AppStage // APPLIED | OA | INTERVIEW | OFFER | REJECTED
  appliedAt    DateTime @default(now())

  user   User            @relation(fields: [userId], references: [id])
  rounds InterviewRound[]
}

model InterviewRound {
  id            String   @id @default(cuid())
  applicationId String
  roundName     String
  scheduledAt   DateTime?
  feedback      String?
  result        String?  // PASS | FAIL | PENDING
  notes         String?

  application Application @relation(fields: [applicationId], references: [id])
}

// ── Resume ────────────────────────────────
model ResumeVersion {
  id          String   @id @default(cuid())
  userId      String
  label       String   // "v3 - Backend focused"
  targetRole  String?
  fileUrl     String?
  starStories Json?    // [{situation, task, action, result}]
  createdAt   DateTime @default(now())

  user User @relation(fields: [userId], references: [id])
}

// ── Learning ──────────────────────────────
model LearningItem {
  id        String   @id @default(cuid())
  userId    String
  title     String
  type      LearningType // BOOK | COURSE | ARTICLE | VIDEO
  status    Status
  notes     String?
  highlights Json?

  user User @relation(fields: [userId], references: [id])
}

// ── Shared: Study Sessions (drives streaks, heatmap, analytics) ──
model StudySession {
  id         String   @id @default(cuid())
  userId     String
  date       DateTime @db.Date
  category   String   // DSA | BACKEND | PROJECT | INTERVIEW_PREP | LEARNING
  minutes    Int
  deepWork   Boolean  @default(false)

  user User @relation(fields: [userId], references: [id])
  @@unique([userId, date, category])
}
```

**Why one `StudySession` model instead of computing hours separately per module:** every "study hours / deep work / streak / heatmap" requirement across Dashboard, DSA, Analytics reads from this single table. Log time once from wherever the user is working; the heatmap, streak counter, and dashboard charts all query it the same way. This is the single biggest schema decision that keeps analytics from becoming spaghetti.

Career Readiness Score is **not stored as raw input** — it's computed server-side (weighted formula across goal completion %, DSA consistency, roadmap progress, interview pipeline health) and cached on `User.careerScore`, recalculated via a scheduled job or on-write trigger. Don't let users edit it directly.

---

## 4. API / Server Action Design

Given App Router + Server Actions, you mostly don't need REST endpoints — only `app/api/ai/*` (Gemini calls) and `app/api/webhooks/*` (Supabase auth webhooks) are real API routes. Everything else:

```
features/dsa/actions.ts
  createProblem(input)      → validates via zod → server/services/dsa.service
  updateProblem(id, input)
  deleteProblem(id)
  getProblems(filters)      → paginated, used by TanStack Table
  getRevisionQueue()        → problems where nextRevisionAt <= now

features/goals/actions.ts
  createGoal / updateGoal / deleteGoal
  recomputeProgress(goalId) → cascades up parent chain when a child goal completes
```

Pattern for every mutation: **optimistic update in the client hook → server action → on error, React Query rolls back automatically.** This is what makes the app feel like Linear instead of a CRUD form.

AI routes (`app/api/ai/*`) — thin wrappers, one per feature, all server-only:
```
/api/ai/study-planner
/api/ai/resume-review
/api/ai/interview-questions
/api/ai/project-ideas
/api/ai/system-design-mentor
/api/ai/code-review
/api/ai/roadmap-generator
/api/ai/mock-interview
```
All accept a typed payload, call Gemini with a fixed system prompt per feature, return structured JSON (zod-validated on the way back too — don't trust the model's JSON blindly).

---

## 5. Phased Roadmap (6 months, working software at every milestone)

Building all 15 modules before shipping anything is the #1 way this kind of project stalls. Sequence:

**Phase 0 — Foundation (Week 1-2)**
Auth (email + Google + GitHub), base layout, dark theme, Prisma schema migrated, empty dashboard shell, command palette skeleton.

**Phase 1 — Core Loop (Week 3-6)**
Goals module (full nesting/dependencies) + DSA tracker + StudySession logging + real Dashboard (streak, today/week/month progress, heatmap). *This alone is a usable daily-driver app.* Ship it, use it for a week before continuing.

**Phase 2 — Analytics + Calendar (Week 7-9)**
Analytics module reading from StudySession/Goal/DsaProblem, Recharts (radar/line/bar/area), full calendar (daily/weekly/monthly planner).

**Phase 3 — Backend Roadmap + Projects (Week 10-14)**
Roadmap tracker, unified Project model powering both Company Website and Flagship Project modules, ProjectTask kanban view.

**Phase 4 — Interview + Resume + Learning (Week 15-18)**
Application/InterviewRound tracker, resume versions + STAR stories, learning tracker.

**Phase 5 — AI Layer (Week 19-22)**
All 8 Gemini features, starting with Study Planner and Mock Interview (highest daily-use value), then Resume Review and Code Review.

**Phase 6 — Polish (Week 23-26)**
Testing module, notifications, keyboard shortcuts everywhere, skeleton loaders, empty states, performance pass (streaming, Suspense boundaries), accessibility audit.

---

## 6. UI Wireframe Notes (Dashboard — the highest-leverage screen)

```
┌─────────────────────────────────────────────────────────┐
│ ⌘K palette   [Logo]              🔔  [Avatar]           │
├───────────┬─────────────────────────────────────────────┤
│  Sidebar  │  Career Readiness Score   ●●●●○  72%         │
│           │  ┌───────────┬───────────┬───────────┐       │
│ Dashboard │  │ Streak 14 │ Today 3h  │ Week 18h  │       │
│ Goals     │  └───────────┴───────────┴───────────┘       │
│ DSA       │  ┌─────────────────────┬─────────────┐       │
│ Roadmap   │  │  Contribution Heatmap│ Weekly Cal  │       │
│ Projects  │  │  (GitHub-style)      │             │       │
│ Interviews│  └─────────────────────┴─────────────┘       │
│ Resume    │  ┌─────────────────────┬─────────────┐       │
│ Learning  │  │  Productivity Graph  │ Upcoming    │       │
│ Analytics │  │  (line, 30-day)      │ Deadlines   │       │
│ Settings  │  └─────────────────────┴─────────────┘       │
└───────────┴─────────────────────────────────────────────┘
```

Design language: Linear's density + Vercel's contrast + Stripe's motion easing. Concretely: `bg-zinc-950` base, `zinc-900` cards with 1px `zinc-800` borders (no heavy shadows — depth via border + subtle backdrop-blur), accent color used sparingly (one signal color for primary actions, not gradients everywhere). Framer Motion only on state changes (progress bar fills, card mount, streak increment) — not decorative page-load animations, which read as amateur past a certain polish level.

---

## Open decisions before coding starts

1. **Drizzle** — dropped from stack, confirm you're OK with Prisma-only.
2. **Dependencies field on Goal** — string array now; fine unless you actually need cycle-detection/critical-path logic, which would need a proper join table + graph traversal. Flag if you want that in v1.
3. **Multi-tenancy** — this reads as single-user (you). If you want colleagues using their own instance later, Supabase RLS policies need to be scoped per-user now, not retrofitted.

Confirm these three and I'll scaffold Phase 0 (auth + layout + schema migration) as actual code.
