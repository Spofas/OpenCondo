# Changelog

All notable changes to OpenCondo are recorded here in reverse-chronological order.

---

## [Unreleased]

### 2026-03-25 — Security, data integrity, and architecture hardening

**Security:**
- `api/receipts/[quotaId]` — non-admin users can now only download receipts for units they own or rent; previously any condo member could access any receipt
- CSV import duplicate identifier detection now reports the conflicting line numbers

**Data integrity:**
- Soft deletes on `Expense`, `Quota`, `Transaction` — records are now flagged with `deletedAt` instead of being permanently removed (migration `20260324224329_add_soft_delete_fields`)
- Budget update wrapped in `db.$transaction` — items are replaced atomically; no partial state if the operation fails
- Soft-delete cascades implemented in server actions: deleting an expense also soft-deletes its linked Transaction; undoing a quota payment soft-deletes the payment Transaction

**Performance:**
- Quotas page now accepts a `?year=` search param — only the selected year's quotas are fetched from the database instead of all historical data
- Year selector in the quota list navigates via URL instead of filtering all quotas client-side

**Architecture:**
- New `src/lib/auth/require-membership.ts` — `requireMembership()` centralises the auth + membership boilerplate used by every server page
- New `src/lib/serializers.ts` — `serializeExpense()`, `serializeTransaction()`, `serializeQuota()`, `serializeRecurringExpense()` centralise Decimal→number and Date→string conversions
- `findFirst` membership fallback (multi-condo users) now uses `orderBy: { joinedAt: "asc" }` for deterministic results
- All Prisma queries that read soft-deletable models now filter `deletedAt: null`

**Ops:**
- New `/api/cron/process` route — nightly job (02:00 UTC via Vercel Cron) marks overdue quotas and generates recurring expenses across all condominiums; protected by `CRON_SECRET` env var
- `vercel.json` updated to register the cron schedule

**Tests:**
- Fixed `actions-invite.test.ts` — added missing `db.condominium` mock so the "creates invite and returns token" test no longer throws on `findUnique`

### 2026-03-19 — Database seed for manual testing

Created `prisma/seed.ts` with realistic data covering all modules:

- **5 users**: 1 admin, 3 owners (one multi-unit), 1 tenant — all with password `password123`
- **Edifício Aurora**: 6 units, permilagem = 1000, Portuguese postal code + NIF
- **2026 budget** (approved, €24k) with 4 line items (limpeza, elevador, electricidade, fundo de reserva)
- **72 quotas** (Jan–Dec × 6 units): Jan–Feb paid, Mar mixed, Apr–Dec pending
- **8 expenses** across categories, linked to suppliers and budget items
- **2 recurring expense templates** (limpeza mensal, elevador mensal)
- **3 announcements** (1 pinned obras, 1 assembleia, 1 manutenção)
- **2 maintenance requests** (1 completed with updates, 1 in progress)
- **2 meetings**: 1 completed (with attendance, votes, final ata), 1 scheduled
- **2 contracts** (1 active limpeza, 1 expired seguro)
- **2 suppliers**, **2 documents**, **1 pending invite**

Run with `pnpm db:seed` after `pnpm db:push`.

---

### 2026-03-19 — Test coverage expansion (246 → 305 tests)

Added three new test files covering previously untested areas:

- **`validators/__tests__/auth.test.ts`** (14 tests) — register schema
  (name length, email format, password min length, password mismatch) and
  login schema (email format, password required but no min length)
- **`validators/__tests__/condominium.test.ts`** (19 tests) — condominium
  schema (postal code `XXXX-XXX` format, NIF 9-digit format, quotaModel
  enum, optional fields accepting empty strings), unit schema (identifier
  required, permilagem non-negative integer), units array (min 1 item)
- **`__tests__/scenario-meetings.test.ts`** (26 tests) — quorum calculation
  (present + represented permilagem, 50% boundary, multi-unit owner
  aggregation, unknown attendee handling), permilagem-weighted vote tallying
  (unanimous, split, abstentions, partial voting, exact 50/50 boundary)

All 11 validators now have tests. Scenario test count: 5 suites, 90 tests.

---

### 2026-03-19 — Membership lookup utility + admin-context file (phase 2)

**`getUserMembership()` extracted — rolled out to all 16 dashboard pages.**

Created `src/lib/auth/get-membership.ts` with two exported helpers:
- `getUserMembership(userId)` — resolves basic membership from the
  `activeCondominiumId` cookie, used by 13 pages
- `getUserMembershipWithCondo(userId)` — same but includes the full
  `condominium` relation, used by `conta-gerencia`, `definicoes`, `minha-conta`

Both functions read the cookie internally so pages only need one line:
```ts
const membership = await getUserMembership(session.user.id);
```
This removed ~200 lines of identical boilerplate across 16 page files.

Also created the missing `src/lib/auth/admin-context.ts` file that was
referenced in the previous commit but was absent from disk, causing build
failures if a cold checkout was attempted.

---

### 2026-03-19 — Performance & complexity optimisations (phase 1)

**Completed as part of the post-analysis quick-wins pass.**

#### Removed duplicate `getAdminContext()` definitions (5 files)

The canonical implementation already lived in `src/lib/auth/admin-context.ts`.
Five action files were still carrying identical inline copies.
Each was updated to import from the shared module instead.

- `src/app/(dashboard)/financas/despesas-recorrentes/actions.ts`
- `src/app/(dashboard)/assembleia/reunioes/actions.ts`
- `src/app/(dashboard)/contratos/actions.ts`
- `src/app/(dashboard)/comunicacao/avisos/actions.ts`
- `src/app/(dashboard)/comunicacao/documentos/actions.ts`

#### Parallelised attendance and vote upserts

`saveAttendance()` and `recordVotes()` in `assembleia/reunioes/actions.ts`
previously upserted each record sequentially inside a `for` loop.
Both loops are now wrapped in `Promise.all()`, making all upserts run
in parallel and reducing latency proportionally to the number of attendees/votes.

#### Removed write-on-read in `devedores/page.tsx`

The page was calling `db.quota.updateMany()` on every load to flip
`PENDING → OVERDUE` for past-due quotas. This was an unintended side-effect
on a read path. The `buildDebtorSummary()` pure function already derives
aging buckets from `dueDate` at runtime, so the DB write was redundant.
Removed — consistent with the same cleanup already done on `painel/page.tsx`
and `financas/quotas/page.tsx` in a prior session.

#### Added missing database indexes (`prisma/schema.prisma`)

Five models lacked indexes on the most common filter combinations,
risking full table scans as data grows:

| Model | Index added |
|-------|-------------|
| `Quota` | `(condominiumId, status)` |
| `Quota` | `(condominiumId, status, dueDate)` |
| `Expense` | `(condominiumId, date)` |
| `Announcement` | `(condominiumId, createdAt)` |
| `MaintenanceRequest` | `(condominiumId, status)` |
| `Meeting` | `(condominiumId, status)` |
| `Meeting` | `(condominiumId, date)` |

---

## Previous sessions

### 2026-03-19 — Recurring expenses module

Added full recurring expense management: templates with configurable frequency
(monthly / quarterly / semi-annual / annual), one-click generation per period,
and guards against double-generation via `lastGenerated` tracking.

### 2026-03-19 — Centralised `getAdminContext()` (phase 1)

Extracted `getAdminContext()` into `src/lib/auth/admin-context.ts` and updated
the first batch of action files to import from it (quotas, expenses, budgets,
maintenance, settings). Phase 2 (above) completed the remaining five files.

### Earlier — Core modules

Budget management, quota generation, expense tracking, debtor calculations,
meeting/ata management, announcements, documents, contracts, and onboarding
were implemented across multiple sessions. See git log for full history.
