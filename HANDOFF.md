# OpenCondo — Session Handoff Prompt

Paste the content of this file at the start of a new Claude Code session to resume with full context.

---

## Briefing

You are picking up development on **OpenCondo** — a Portuguese condominium management platform. Read the following before touching anything.

**Before you do anything else, read these files in order:**
1. `CLAUDE.md` — development workflow, architecture rules, and patterns you must follow
2. `PROJECT_STATUS.md` — full architecture, what's built, gotchas, and key patterns
3. `CHANGELOG.md` — what changed in the last 3 sessions (most recent first)

---

## Project in one paragraph

OpenCondo replaces the spreadsheets and WhatsApp groups used by Portuguese condominium administrators. It handles finances (budgets, quotas, expenses, cash ledger), communication (announcements, maintenance requests, documents), meetings (assembleias with quorum + vote tracking), and contracts. The app is Portuguese-first, targets small-to-medium residential buildings, and runs on Vercel + Neon in production.

---

## Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16 (App Router) | Server Components, Server Actions, Middleware |
| Language | TypeScript | Strict mode; no `any` |
| ORM | Prisma 7 + `@prisma/adapter-pg` | Requires driver adapter — `new PrismaClient()` without options throws |
| Database | PostgreSQL (Neon) | Two branches: `main` (prod) and `develop` (staging) |
| Auth | NextAuth.js v5 | JWT sessions; split config for edge/server |
| Styling | Tailwind CSS 4 + CSS vars | `text-foreground`, `bg-card`, `border-border` — never hardcode colours |
| Forms | React Hook Form + Zod v4 | Schemas shared between client forms and server actions |
| i18n | next-intl | All strings in `src/i18n/messages/pt.json` |
| Tests | Vitest | Pure functions only; no component or E2E tests yet |
| Package mgr | pnpm | Use `pnpm`, never `npm` or `yarn` |

---

## Branch and build state

- **Active branch:** `claude/opencondo-development-Ch14I`
- **Build:** Passing (`pnpm build` succeeds, all routes compile)
- **Tests:** 363 passing across 27 test files (`pnpm test`)
- **Lint:** `pnpm lint` is broken on Next.js 16.1.7 — `next lint` misparses args. Non-blocking; build catches type errors.
- **Latest migration:** `20260324224329_add_soft_delete_fields` (adds `deletedAt` to `Expense`, `Quota`, `Transaction`)

**Verify before every push:**
```bash
pnpm verify   # runs lint (skipped if broken) + test + build in sequence
```

---

## Architecture — patterns you must follow

### Server actions (`actions.ts`)
Every mutation starts with `getAdminContext()` — checks auth, cookie, and ADMIN role. Returns `{ error: string }` on failure, `{ success: true }` on success. Validates with Zod before touching the database. Calls `revalidatePath()` after writes.

### Server pages (`page.tsx`)
Use `requireMembership()` from `src/lib/auth/require-membership.ts` — one call handles auth + membership + redirect. Serialize Prisma Decimals and Dates with helpers from `src/lib/serializers.ts` before passing to client.

### Business logic
Pure functions live in `src/lib/<feature>-calculations.ts`. Actions import and call them — never inline complex math in an action. This is what makes things testable.

### Soft deletes
`Expense`, `Quota`, `Transaction` are soft-deleted (set `deletedAt = now()`). All reads filter `deletedAt: null`. Cascades are handled manually in actions (delete expense → also soft-delete its linked Transaction).

### Ledger model
`Transaction` is the cash book (Livro de Caixa). Positive amounts = income (quota payments). Negative amounts = expenses. `buildStatement()` / `getBalanceAt()` in `src/lib/conta-gerencia-calculations.ts` derive balances from this.

### Financial reports
`buildContaGerencia()` in `src/lib/conta-gerencia-calculations.ts` takes Quota and Expense arrays and returns `{ totalIncome, totalExpenses, netBalance, budgetLines[], expensesByCategory }`. Pure function — fully testable.

---

## What's built (complete modules)

- Auth (register, login, JWT sessions, middleware gatekeeper)
- Onboarding wizard (condominium + units setup, permilagem validation)
- Budget management (create, approve, lock; DRAFT → APROVADO workflow)
- Quota management (generate by permilagem or equal split, record payment, undo, year filter)
- Expense tracking (create, edit, delete with soft delete; receipt upload/download)
- Recurring expenses (templates with MENSAL/TRIMESTRAL/SEMESTRAL/ANUAL frequency, cron generation)
- Debtor tracking (aging buckets: current/30/60/90 days)
- Cash ledger (Livro de Caixa, Transaction-based, YTD aggregates)
- Financial report (Conta de Gerência — budget vs actuals, variance)
- CSV import (parsing + duplicate detection with line numbers, no UI yet — see below)
- Announcements, maintenance requests, documents
- Meeting management (assembleia, agenda, attendance, quorum calc, permilagem-weighted votes, ata)
- Contracts + suppliers
- Settings (profile, condo details, member invites)
- Nightly cron job (`/api/cron/process`) — marks overdue quotas, generates recurring expenses for all condos at 02:00 UTC

---

## What still needs to be built (priority order)

1. **Bulk import UI** — CSV parsing is complete in `src/lib/csv-import.ts` (duplicate detection works, tested). Needs a page with file upload, preview table, and confirm/reject flow. Likely at `/definicoes` or a new `/onboarding/importar` route.
2. **Email notifications** — Transactional emails for quota reminders, announcements, maintenance updates, meeting convocatória. Needs `RESEND_API_KEY` env var and email templates (React Email or similar).
3. **Mobile responsiveness** — Desktop-first at the moment. Sidebar, tables, and modals need responsive passes.
4. **Production deployment** — See `DEPLOYMENT_GUIDE.md`. Env vars needed: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `CRON_SECRET`.

---

## Security posture

**What's in place:**
- All mutations gated by `getAdminContext()` (auth + role check)
- Receipt download endpoint (`/api/receipts/[quotaId]`) checks that non-admin users only access their own units
- CRON endpoint protected by `CRON_SECRET` bearer token
- Passwords hashed with bcryptjs (never stored in plaintext)
- Soft deletes on financial records (no accidental permanent loss)
- Budget updates wrapped in `db.$transaction` (atomic, no partial state)

**Open gaps:**
- No rate limiting on auth endpoints (register, login). Low risk now; add before public launch.
- CSV import has no server-side file size or MIME type validation yet (the UI doesn't exist, so the attack surface isn't exposed, but add it when building the upload page).
- No CSRF protection beyond what NextAuth provides via its own cookie handling.

---

## Performance posture

**What's in place:**
- Quota page uses `?year=` URL param — only fetches current year from DB (not full history)
- Indexes on `(condominiumId, status)`, `(condominiumId, dueDate)`, `(condominiumId, date)` on the most-queried models
- Attendance/vote upserts run in `Promise.all()` (parallel, not sequential)
- Overdue marking moved from read paths (page loads) to the nightly cron (single job covers all condos)
- JWT sessions — no DB hit to verify who's logged in

**Watch out for:**
- `buildContaGerencia()` and `buildDebtorSummary()` load all quotas/expenses into memory. Fine for one condo with a few years of data; becomes a problem if a condo has thousands of records. Will need pagination or date-range filtering eventually.
- No query result caching. Vercel's `unstable_cache` or React `cache()` could reduce DB load on high-traffic pages if needed later.

---

## Known gotchas

1. **Prisma 7 driver adapter** — `new PrismaClient()` without a driver adapter throws. The singleton in `src/lib/db/index.ts` already handles this correctly; don't copy-paste PrismaClient instantiation from old docs.
2. **Decimal serialization** — Prisma returns `Decimal` objects. Always `Number(value)` or use a serializer from `src/lib/serializers.ts` before passing to client components. Missing this causes a silent serialization error.
3. **Date month indexing** — `new Date(year, month, day)` uses 0-indexed months. When parsing "2026-01", month is `0`, not `1`.
4. **Zod v4 API** — `.errors` is now `.issues` on ZodError. Use `error.issues[0].message`.
5. **Zod v4 coerce** — `z.coerce.number()` produces `unknown` output type, breaking React Hook Form inference. Use `z.number()` + `valueAsNumber` in the form's `register()` call.
6. **NextAuth edge/server split** — `middleware.ts` cannot import Prisma or bcryptjs (edge runtime). Auth config is split: `config.ts` (edge-safe) and `index.ts` (server-only).
7. **`activeCondominiumId` cookie** — the active condo comes from this cookie, not a URL param. Always read it in server components/actions via `getUserMembership()` or `getAdminContext()`; never hardcode a condo ID.
8. **Rounding** — `splitByPermilagem()` may not sum exactly to the total (each unit is independently rounded to 2dp). This is expected; don't "fix" it by adjusting the last unit.

---

## Test coverage

```
27 test files, 363 tests — all passing

Validators (9 files):         auth, condominium, budget, quota, expense,
                               recurring-expense, debtor, conta-gerencia, csv
Pure logic (4 files):         quota-calculations, debtor-calculations,
                               conta-gerencia, cron-utils
Scenario suites (4 files):    lifecycle, csv-import, recurring-expenses,
                               edge-cases (shared fixtures in __fixtures__/)
Server action mocks (3 files): condominium, invites, actions-invite
Auth validators (2 files):    register, login
Meetings scenario (1 file):   quorum + weighted vote calculations
```

**Test philosophy:** Test validators and pure logic exhaustively. Don't test server actions directly (mock-heavy, fragile). Don't test React components yet (UI is still stabilising). Edge cases around money are the highest priority.

---

## File structure quick reference

```
src/
├── app/(auth)/              # login, registar, onboarding (no sidebar)
├── app/(dashboard)/         # all authenticated pages (with sidebar)
│   ├── painel/              # dashboard with YTD stat cards
│   ├── financas/
│   │   ├── orcamento/       # budgets
│   │   ├── quotas/          # quota generation + payment
│   │   ├── despesas/        # expense tracking
│   │   ├── despesas-recorrentes/  # recurring expense templates
│   │   ├── devedores/       # debtor aging
│   │   ├── livro-caixa/     # cash ledger (Transaction-based)
│   │   └── conta-gerencia/  # budget vs actuals report
│   ├── comunicacao/         # avisos, manutencao, documentos
│   ├── assembleia/          # reunioes (meetings + ata)
│   ├── contratos/           # contracts + suppliers
│   ├── calendario/          # calendar view
│   └── definicoes/          # settings, profile, invites
├── app/api/
│   ├── cron/process/        # nightly job (protected by CRON_SECRET)
│   └── receipts/[quotaId]/  # receipt download (ownership-gated)
├── lib/
│   ├── auth/
│   │   ├── admin-context.ts      # getAdminContext() — use in every action
│   │   ├── require-membership.ts # requireMembership() — use in every page
│   │   └── get-membership.ts     # lower-level helpers
│   ├── validators/          # Zod schemas (one file per feature)
│   ├── serializers.ts       # Decimal→number, Date→string converters
│   ├── cron-utils.ts        # isDueThisPeriod() — pure, testable
│   ├── quota-calculations.ts
│   ├── debtor-calculations.ts
│   ├── conta-gerencia-calculations.ts
│   └── csv-import.ts        # parsing + duplicate detection (no UI yet)
└── i18n/messages/pt.json    # all Portuguese strings
```

---

## Seed data (for local/staging testing)

Run `pnpm db:seed` (local) or `dotenv -e .env.develop -- pnpm db:seed` (against Neon `develop`).

Seed creates: **Edifício Aurora** — 5 users (all password `password123`):
- `admin@aurora.pt` — ADMIN
- `joao@aurora.pt` — OWNER (fração 1.º Esq)
- `maria@aurora.pt` — OWNER (2.º Dto)
- `carlos@aurora.pt` — OWNER (3.º Esq + 3.º Dto — two units)
- `ana@aurora.pt` — TENANT (1.º Dto)

72 quotas (Jan–Dec × 6 units), 8 expenses, 15 quota payment Transactions, 8 expense Transactions, 2 recurring templates, 3 announcements, 2 meetings, 2 contracts.

---

## Git conventions

Branch: `claude/opencondo-development-Ch14I` — push only here.

Commit format: `<type>: <short description>` (conventional commits).
Types: `feat`, `fix`, `test`, `refactor`, `docs`, `style`, `chore`, `perf`.

Always run `pnpm verify` (test + build) before committing. Never push failing code.
