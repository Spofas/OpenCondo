# Changelog

All notable changes to OpenCondo are recorded here in reverse-chronological order.

---

## [Unreleased]

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
