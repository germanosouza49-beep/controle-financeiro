# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FinControl is a personal/collaborative financial dashboard that consolidates multiple bank accounts and credit cards. It features CSV/PDF import, AI-powered categorization (Gemini), predictive analytics, and a natural language financial chat assistant. The project language is **Brazilian Portuguese** for all user-facing content.

## Commands

```bash
# Install all dependencies (root + client + server)
npm run install:all

# Run both client and server concurrently
npm run dev

# Run individually
npm run dev:client    # Vite dev server on :5173
npm run dev:server    # Express server on :3001 (tsx watch)

# Build
npm run build

# Lint & type-check
npm run lint
npm run type-check

# Tests (server only)
npm --prefix server run test          # single run
npm --prefix server run test:watch    # watch mode

# Drizzle ORM (from server/)
npm --prefix server run db:generate   # generate migrations from schema
npm --prefix server run db:push       # push schema to DB
npm --prefix server run db:studio     # open Drizzle Studio

# Supabase migrations
supabase db push          # apply migrations to remote
supabase db reset         # reset local DB and re-seed
supabase gen types typescript --local > shared/types/database.types.ts
```

## Architecture

**Monorepo** with four top-level directories:

- `client/` — React 18 SPA (Vite + TypeScript + TailwindCSS)
- `server/` — Node.js API (Express + TypeScript + Drizzle ORM)
- `supabase/` — SQL migrations, seed data, Supabase config
- `shared/` — TypeScript types shared between client and server

See `ARCHITECTURE.md` for full diagrams, patterns, and conventions.

### Client (`client/`)

- **State management**: Zustand stores in `src/store/`, server-state via React Query (`@tanstack/react-query`)
- **Routing**: React Router v6 with lazy-loaded pages in `src/pages/`
- **Charts**: Recharts (PieChart, LineChart, BarChart) in `src/components/charts/`
- **API calls**: `src/services/api.ts` wraps fetch with Supabase JWT auth headers; `src/services/supabase.ts` is the Supabase client (anon key only)
- **Path aliases**: `@/*` maps to `src/*`, `@shared/*` maps to `../shared/*`
- **Env vars**: prefixed with `VITE_` — see `client/.env.example`

### Server (`server/`)

- **Entry point**: `src/index.ts` — Express app with CORS, JSON parsing, route mounting
- **ORM**: Drizzle ORM with `postgres` driver. Schema in `src/db/schema.ts`, connection in `src/db/index.ts`
- **Route pattern**: `src/routes/*.routes.ts` → `src/controllers/` → `src/services/` → `src/repositories/`
- **Auth middleware** (`src/middlewares/auth.middleware.ts`): validates Supabase JWT, injects `req.userId`
- **AI integration**: `src/config/gemini.ts` exports `geminiFlash` (fast/cheap tasks) and `geminiPro` (chat). Prompt templates live in `src/prompts/`
- **Validation**: Zod schemas in `src/validators/`
- **File uploads**: Multer for CSV/PDF → PapaParse for CSV, pdf-parse + Gemini multimodal for PDF extraction
- **Supabase clients** (`src/config/supabase.ts`): `supabaseAdmin` (service role, bypasses RLS) and `createUserClient(token)` (per-request, respects RLS)

### Database (Supabase/PostgreSQL)

- **13 tables**: `profiles`, `accounts`, `credit_cards`, `categories`, `transactions`, `budgets`, `ai_insights`, `chat_messages`, `categorization_rules`, `notifications`, `recurring_templates`, `savings_goals`, `savings_contributions`, `transaction_splits`
- **RLS enforced on all tables** — users only access their own data
- `profiles` auto-created via trigger on `auth.users` insert
- `categories` has system-wide defaults (`is_system = true`) visible to all users
- `categorization_rules` has system-wide defaults + user-created rules; regex rules run BEFORE AI
- `transactions` requires either `account_id` or `card_id` (CHECK constraint)
- `transactions.scope` separates personal/business/shared (PF/PJ)
- Duplicate detection via `import_hash` (hash of date + amount + description)
- Migrations in `supabase/migrations/`, seed categories + rules in `supabase/seed.sql`
- Drizzle schema in `server/src/db/schema.ts` mirrors all SQL tables

### AI Modules

All AI flows: Frontend → Backend endpoint (`/api/ai/*`) → query Supabase for user context → build prompt → call Gemini → validate/persist → return.

| Module | Gemini Model | Purpose |
|---|---|---|
| Categorization | 2.0 Flash | Batch categorize transactions (max 50/call). Rules run first. Confidence >= 0.85 auto-applies. |
| PDF extraction | 2.0 Flash | Multimodal extraction of transactions from bank statement PDFs |
| Summary/Forecast/Anomalies | 2.0 Flash | Monthly reports, 3-month projections, outlier detection |
| Health Score | 2.0 Flash | Financial health score 0-100 with tips |
| Financial Chat | 2.5 Pro | Complex reasoning over user's financial data |

Rate limit: 30 AI calls/day per user. Cache categorizations by description hash. Rules engine (regex) runs before AI at zero cost.

## Key Conventions

- **TypeScript strict mode** in both client and server
- Shared types in `shared/types/api.types.ts` — import as `@shared/types/api.types`
- All monetary values use `DECIMAL(12,2)` in the DB and `number` in TypeScript
- Icons reference [Lucide](https://lucide.dev) icon names (e.g., `'building-2'`, `'utensils'`)
- User roles: `admin` (full control), `member` (view + add transactions), `viewer` (read-only)
- `SUPABASE_SERVICE_ROLE_KEY` and `GEMINI_API_KEY` are server-only — never expose to frontend
- Frontend uses only `VITE_SUPABASE_ANON_KEY` combined with RLS
- Request flow: Route → Auth Middleware → Zod Validator → Controller → Service → Repository → DB

## API Endpoints

Routes follow RESTful patterns under `/api/`:
- `/api/accounts` — CRUD bank accounts
- `/api/cards` — CRUD credit cards
- `/api/transactions` — CRUD + filters + `/summary`
- `/api/import/csv` and `/api/import/pdf` — upload → preview → confirm flow
- `/api/budgets` — CRUD budgets per category/month
- `/api/rules` — CRUD categorization rules
- `/api/goals` — CRUD savings goals + contribute
- `/api/notifications` — List + mark read
- `/api/cashflow` — Projected cashflow (30/60/90 days)
- `/api/analytics/compare` — Period comparison
- `/api/ai/categorize`, `/api/ai/summary`, `/api/ai/suggestions`, `/api/ai/forecast`, `/api/ai/anomalies`, `/api/ai/health-score`, `/api/ai/chat`
- `/api/export/pdf`, `/api/export/excel` — Report export

## Deploy Targets

- Frontend: **Netlify** (configured via `netlify.toml`)
- Backend: Railway or Render
- Database: Supabase Cloud
