# Elets Solution Marketplace

A B2B technology marketplace with managed procurement support. It connects government, healthcare, education, BFSI and public-sector buyers with verified technology providers. Elets' operations team structures each requirement, runs explainable matching, makes introductions and manages **Elets Pro** engagements.

> **Demo build.** Every organisation, person and number in the app is fictional demonstration data. No real company has joined the platform.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Tailwind CSS v4** with design tokens in `src/app/globals.css`
- **Radix UI** primitives with a custom component kit in `src/components/ui`: modal, slide-over sheet, dropdown, tooltip, popover, tabs, select, checkbox, switch and radio cards
- **Recharts** for charts, **cmdk** for global search, **sonner** for toasts, **lucide-react** for icons, **zustand** for the client data layer, **zod** for API validation
- **Neon Postgres** (`@neondatabase/serverless`): shared marketplace data, when `DATABASE_URL` is set. See [Shared data in Neon](#shared-data-in-neon).
- **Supabase**: schema, RLS and storage are defined in `supabase/schema.sql`, and client helpers live in `src/lib/supabase`. The UI is **not wired** to Supabase.

## Getting started

```bash
npm install
cp .env.example .env.local   # set SESSION_SECRET to a long random string
npm run dev                   # http://localhost:3000
```

Production build: `npm run build && npm start`.

## Demo accounts

| Portal | Email | Password | Persona |
|---|---|---|---|
| Buyer | `buyer@elets.demo` | `Buyer@2026` | Dr. Kavita Menon, CIO, Sahyadri Multi-Speciality Hospital Group |
| Solution provider | `provider@elets.demo` | `Provider@2026` | Arjun Iyer, Nimbus Stack Technologies |

The login page also has one-click **Continue as demo …** buttons, and the user menu can switch between the buyer and provider demos. Passwords can be overridden with `DEMO_BUYER_PASSWORD` / `DEMO_PROVIDER_PASSWORD`, and one-click sign-in can be turned off with `DISABLE_DEMO_LOGIN=true`.

### Elets operations accounts

There is no demo operations account. Operations staff are real accounts in `marketplace.users` with the `admin` role. They sign in only at an unlisted path set by `OPS_LOGIN_PATH`, and nothing in the app links to it.

- **Creating an account or resetting a password**: run `node scripts/create-admin.mjs --email you@example.com --name "Full Name"`. It reads `DATABASE_URL` from the environment or `.env.local`, and if you leave out `--password` it prints a generated password once.
- **Hidden from everyone else**: `/admin/*` and the internal `/ops-login` route return a plain 404, so the portal isn't discoverable. The public `/login` treats operations credentials as wrong.
- **The real protection** is the password. The hidden path only keeps the page out of sight.

### Self-service accounts

When `DATABASE_URL` is set, buyers and solution providers can create their own accounts at `/signup`. Elets operations accounts are not self-service.

- **Storage**: accounts live in `marketplace.users` with scrypt-hashed passwords. Sign-up also creates the organisation record (a buyer org, or an unverified provider profile that's kept out of matching) and notifies Elets operations.
- **New providers**: they start in onboarding and stay out of the public directory until their profile lists a technology category.
- **Notifications**: these are addressed to an organisation (`userId: "org:<orgId>"`), so every account in that organisation sees updates about its requirements and profile.
- **Not built yet**: email verification, password reset and rate limiting.

## Routes

**Public:** `/` landing · `/solutions` provider discovery · `/providers/[slug]` public company profile · `/pro` Elets Pro · `/login`

**Buyer (`/buyer`):** dashboard · `requirements` · `requirements/new` (9-step wizard) · `requirements/[id]` (tracking, matched providers, introductions) · `discover` · `providers/[slug]` · `shortlist` · `compare` · `opportunities` · `meetings` · `pro` · `pro/[id]` (engagement workspace) · `messages` · `notifications`

**Provider (`/provider`):** dashboard · `onboarding` · `profile` · `solutions` · `opportunities` · `opportunities/[id]` · `leads` · `analytics` · `verification` · `messages` · `notifications`

**Operations (`/admin`):** dashboard · `providers` · `providers/[id]` · `buyers` · `requirements` · `requirements/[id]` (matching console) · `matching` (review queue) · `opportunities` (kanban) · `pro` · `pro/[id]` · `categories` · `content` · `reports` · `audit` · `messages` · `notifications`

## Architecture

```
src/
  app/                  routes (public pages, /buyer, /provider, /admin, /api/auth/*)
  proxy.ts              role-based route protection (Next 16 "proxy", formerly middleware)
  components/
    ui/                 design-system components
    shell/              sidebar, top bar, breadcrumbs, command palette, notifications
    shared/             cross-portal domain components (stage tracker, match explanation, provider card, discovery, messages)
    marketing/ provider/ admin/ pro/
  lib/
    types.ts            domain model (mirrors supabase/schema.sql)
    data/*.ts           seed data (fictional)
    store.ts            data layer: zustand store, every mutation in one place
    seed.ts             starting dataset and the list of shared collections
    sync.ts             saves store changes to /api/data and pulls others' changes
    db/records.ts       Neon access: schema setup, seeding, batched upserts/deletes
    matching.ts         8-dimension explainable matching engine
    auth/               signed-cookie session + server-only demo accounts
    supabase/           Supabase client helpers (integration boundary)
supabase/schema.sql     tables, enums, RLS policies, audit triggers, storage buckets
```

### Matching engine and integrity controls

`src/lib/matching.ts` scores each eligible provider on eight weighted dimensions: technology alignment (20), industry experience (15), functional capability (15), implementation experience (12), size & capacity (10), geography (10), certifications & compliance (10) and budget fit (8). Each score comes with plain-language reasons and gaps.

- The engine receives a `MatchableProfile` built by `toMatchable()`, which **omits the paid listing package**, so paid listings cannot affect scores. The database mirrors this with the `match_inputs` view.
- **Verification**, **matching eligibility** and **listing package** are three separate provider fields. Only staff can change them, and the database enforces this with the `providers_protect` trigger.
- Engine suggestions start as `suggested`. Buyers see a match only after Elets reviews and approves it.
- Every admin action writes to the audit log (`/admin/audit`, and the `audit_log` table with triggers).

## What is functional vs simulated

| Area | Status |
|---|---|
| Navigation, layouts, responsive shell, global search, filters, sorting, tables, charts, modals, sheets, toasts | **Functional** |
| Role-based sign-in and protected routes | **Functional, demo-grade**: three server-side demo accounts and an HMAC-signed httpOnly cookie. There is no user database, sign-up, password reset or MFA. |
| Requirement wizard, matching, shortlisting, introductions, stage changes, verification decisions, Pro workspace edits, categories, content, messages, notifications | **Functional and shared**: with `DATABASE_URL` set, changes are saved to Neon and everyone sees them (other open browsers pick them up within ~20 s). Favourites, compare and recently viewed stay per-browser. Without a database, everything persists in that browser's localStorage only. *Reset demo data* (Elets operations only) restores the starting dataset for everyone. |
| File uploads (logos, requirement attachments, diligence/RFP documents) | **Simulated**: file names and sizes are recorded, but no file is stored |
| Email / external notifications, calendar invites | **Simulated**: in-app notifications only |
| Supabase database, auth and storage | **Defined, not connected**: run `supabase/schema.sql` to create them; the store actions still need migrating |
| Analytics figures | Derived from demo data and labelled as such |

## Shared data in Neon

Set `DATABASE_URL` to a Postgres connection string (Neon's pooled URL works) in `.env.local` and in the Vercel project. On first use the app creates a `marketplace` schema with one table and fills it with the starting dataset. It never touches other schemas, so it can share a database with other applications.

- **Table**: `marketplace.records (collection, id, data jsonb, ord, updated_at)`. Each provider, requirement, match, notification and so on is one row, and `ord` keeps list order.
- **API**: `GET /api/data` returns everything to signed-in users and only the public directory (providers, taxonomy, announcements, site content) to visitors. `POST /api/data` applies a batch of upserts and deletes and requires a session. `POST /api/data/reset` is for admins only.
- **Sync**: `src/lib/sync.ts` compares each store change by object identity and sends only the changed records in debounced batches. It refreshes every 20 s and when the tab regains focus.
- **Limits**: two people editing the same record at the same moment means the last write wins. Any signed-in demo user can write any collection, because there are no per-role write rules yet.
- **Start over**: run `drop schema marketplace cascade;` and the next request re-seeds the data.

## Database configuration (Supabase)

1. Create a Supabase project and open the SQL editor.
2. Run `supabase/schema.sql`. It creates the enums, tables, the `match_inputs` view, RLS policies for buyer, provider and staff, audit triggers, and the `logos` (public) and `documents` (private) storage buckets.
3. Put `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` (server-only) in `.env.local`.
4. Create users in Supabase Auth, then insert a matching `profiles` row that sets `role` and `buyer_org_id` or `provider_id`.
5. Migrate the data layer. Each action in `src/lib/store.ts` corresponds to a table write. Replace them with Supabase queries (via `getBrowserSupabase()` / `getServerSupabase()`) or server actions, and load the seed state from queries. The seed in `src/lib/data` can be turned into an SQL seed script.
6. Swap `/api/auth/login` to `supabase.auth.signInWithPassword` and have `src/proxy.ts` read the Supabase session instead of the demo cookie.

## Remaining production-readiness work

- Real authentication: Supabase Auth, invitations and org onboarding, password reset, MFA for staff, session revocation
- Move from the generic records table to typed tables with per-role write rules (or Supabase RLS), and run match scoring server-side in a trusted function that snapshots the scores.
- Real file uploads to Supabase Storage, with virus scanning and size/type limits
- Email and WhatsApp notifications, and calendar integration for meetings
- Column-level protections and RPCs for provider-editable match fields. Show buyer identity to providers only after introduction (in an RPC/view).
- Automated tests (unit tests for the matching engine, Playwright for key journeys), error monitoring, rate limiting on auth routes
- Accessibility audit (WCAG 2.1 AA), performance budgets, SEO metadata for public profiles
- Legal: terms, privacy policy, DPDP Act compliance, consent and cookie handling
