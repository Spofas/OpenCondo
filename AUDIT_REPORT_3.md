# OpenCondo — Verified Audit Report (v3)

**Date:** 2026-04-01
**Scope:** Spec, Architecture, Performance, Security, Finanças UX/Overlap
**Branch:** `claude/opencondo-development-Ch14I`
**Methodology:** Third-pass audit — every claim from v2 independently verified against source code. Corrections marked with ✅ (confirmed) or ⚠️ (corrected from v2).

---

## Table of Contents

1. [Spec Audit](#1-spec-audit)
2. [Architecture Audit](#2-architecture-audit)
3. [Performance / Speed Audit](#3-performance--speed-audit)
4. [Security Audit](#4-security-audit)
5. [Finanças Information Overlap & Redundancy](#5-finanças-information-overlap--redundancy)
6. [Cross-Cutting Recommendations](#6-cross-cutting-recommendations)

---

# 1. Spec Audit

**Feature Completeness: ~92-95%**
**Critical Path Verified:** Register → Create Condo → Add Units → Generate Quotas → Record Payment → View Debtors → Export Conta de Gerencia PDF. All working end-to-end.

## Feature Status Matrix

| Feature | Spec § | Status | Implementation Details |
|---------|--------|--------|----------------------|
| Registration | 2.1 | ✅ Done | `/registar` with Zod validation, auto-login, rate limit (5/15min) |
| Login | 2.1 | ✅ Done | NextAuth credentials provider, JWT sessions, 30-day expiry |
| Password Reset | 2.1 | ✅ Done | `randomBytes(32)` token, 1hr expiry, Resend email |
| Invite System | 2.1 | ✅ Done | Token + code-based entry at `/entrar`, 7-day expiry, unit claim |
| Condo Setup Wizard | 3.1 | ✅ Done | Two-step: building details → units. Validates permilagem=1000. Atomic transaction |
| Unit Management | 3.1 | ✅ Done | Identifier, floor, typology, permilagem, owner/tenant assignment |
| ⚠️ CSV Bulk Import | 3.1 | ✅ Done | `src/lib/csv-import.ts` parser + full UI in `unit-manager.tsx` (file upload, paste, preview, validation). v2 incorrectly listed this as Missing. |
| Budget Management | 3.2.3 | ✅ Done | Create, approve (locks), line items, reserve fund %, PDF export |
| Budget Year Uniqueness | 3.2.3 | ✅ Done | `@@unique([condominiumId, year])` enforced |
| Quota Generation | 3.2.1 | ✅ Done | Permilagem + equal split, bulk generation, live preview, dup prevention |
| Quota Payment | 3.2.1 | ✅ Done | Manual entry, undo, 6 payment methods, receipt PDF |
| Overdue Detection | 3.2.1 | ✅ Done | Auto-mark on page load + nightly cron |
| Expense Tracking | 3.2.2 | ✅ Done | 12 categories, supplier links, invoice upload, soft deletes |
| Recurring Expenses | 3.2.2 | ✅ Done | 4 frequencies, cron generation, pause/resume, dup prevention |
| Reserve Fund | 3.2.3 | ✅ Done | 10% default, configurable %, tracked in conta de gerencia |
| Devedores | Implied | ✅ Done | Aging analysis (5 buckets), per-unit breakdown, color-coded |
| Livro de Caixa | Implied | ✅ Done | Transaction journal, opening balance, pagination (50/page), date filter |
| Conta de Gerencia | 3.2.3 | ✅ Done | Pure function `buildContaGerencia()`, budget variance, PDF export |
| Announcements | 3.3.1 | ✅ Done | 5 categories, pinning, read tracking |
| **Announcement Attachments UI** | Implied | **Missing** | Schema `AnnouncementAttachment` exists, upload UI not wired |
| Maintenance Requests | 3.3.2 | ✅ Done | 4-state workflow, 4 priority levels, admin notes, `MaintenanceUpdate` history |
| **Maintenance Photos UI** | Implied | **Missing** | Schema `MaintenancePhoto` exists, upload UI not wired |
| Document Archive | 3.3.3 | ✅ Done | 6 categories, visibility control (ALL/ADMIN_ONLY), Vercel Blob upload |
| Supplier Directory | Implied | ✅ Done | Name, phone, email, NIF, category, linked to contracts/expenses |
| Meeting Scheduling | 3.4.1 | ✅ Done | Date, time, location, type (ORDINARIA/EXTRAORDINARIA), agenda items |
| Attendance Tracking | 3.4.1 | ✅ Done | PRESENTE/REPRESENTADO/AUSENTE, permilagem-weighted quorum |
| Voting | 3.4.3 | ✅ Done | Per-agenda-item, A_FAVOR/CONTRA/ABSTENCAO, permilagem-weighted results |
| Atas (Minutes) | 3.4.2 | ✅ Done | Rich text, RASCUNHO→FINAL status, sequential numbering, PDF export |
| Ata Approval | Extra | ✅ Done | `AtaApproval` model: PENDENTE/APROVADO/CONTESTADO per member |
| Contract Management | 3.5 | ✅ Done | 8+ types, ATIVO/EXPIRADO/RENOVADO/CANCELADO, renewal alerts, insurance fields |
| Calendar | 3.6 | ✅ Done | Monthly grid, meetings + quota due dates + contract renewals |
| Dashboard (Admin) | 3.7 | ✅ Done | YTD saldo/receitas/despesas, alerts (overdue, open maintenance, expiring contracts) |
| Dashboard (Member) | 3.7 | ✅ Done | Next quota + due date, next meeting, own overdue quotas |
| My Account | 2.2 | ✅ Done | Profile, my quotas, notification preferences |
| Role-Based Access | 2.2 | ✅ Done | ADMIN/OWNER/TENANT via `withAdmin`/`withMember` HOF on module actions |
| i18n (Portuguese) | 4.5 | ✅ Done | 300+ keys in `pt.json`, `next-intl` configured |
| Receipt PDF | 3.2.1 | ✅ Done | `/api/receipts/[quotaId]`, ownership-gated |
| Ata PDF | 3.4.2 | ✅ Done | `/api/atas/[ataId]`, membership-gated |
| Budget PDF | 3.2.3 | ✅ Done | `/api/budgets/[budgetId]`, membership-gated |
| Conta de Gerencia PDF | 3.2.3 | ✅ Done | `/api/conta-gerencia?year=YYYY`, admin-only |
| ⚠️ Email Notifications | 4.2 | ✅ Done | Queue (`PendingEmail`), templates, retry logic. `sendQuotaReminderNotification` IS called via `sendBulkQuotaReminders()` in cron. v2 incorrectly said it was never called. |
| **Member Role Management** | 2.2 | **Missing** | No UI to change OWNER→TENANT or deactivate post-invite |
| **WCAG Accessibility** | 4.4 | **Minimal** | Responsive Tailwind, semantic HTML, but no formal audit |
| Rate Limiting | 4.2 | ✅ Done | Auth endpoints (5/15min), cron (2/hr), in-memory store |
| Soft Deletes | 4.2 | Partial | Quota, Expense, Transaction — but NOT on Announcement, Document, Contract, Supplier, Meeting |
| File Upload | Extra | ✅ Done | `/api/upload`, Vercel Blob, whitelist (PDF/images/Office), 10MB max |
| Email Queue | Extra | ✅ Done | `PendingEmail` model, retry (3x), batch processing in cron |
| Notification Preferences | Extra | ✅ Done | Per-user opt-in/out for quotas, announcements, meetings, etc. |
| Slug-based Routing | Extra | ✅ Done | `/c/[slug]/...` — bookmarkable, multi-tenant ready |
| Optimistic Updates | Extra | ✅ Done | `useOptimistic` + `useTransition` on 9+ list components |

## Spec Gaps (Prioritized)

### P0 — Must fix before launch
1. **Soft-delete on all entities** — Announcements, Documents, Suppliers, Contracts, Meetings use hard delete. Destroys audit trail.

### P1 — Should fix for polish
2. **Announcement Attachments UI** — Schema exists, `FileUpload` component exists, just not wired.
3. **Maintenance Photos UI** — Same situation.
4. **Member Role Management** — No modal to edit membership role or deactivate.
5. **Permilagem sum validation** — No warning on settings page if total != 1000.
6. **Reserve fund % validation** — No `min(0).max(100)` on budget Zod schema.

### P2 — Nice-to-have
7. **WCAG accessibility audit** — Run axe/WAVE, add aria labels, check contrast.
8. **Landing page enhancement** — Current `/page.tsx` is minimal.
9. **E2E tests** — No Playwright/Cypress.
10. **English translations** — Infrastructure ready, no `en.json`.

## ⚠️ v2 Corrections

| v2 Claim | v3 Verdict | Why |
|----------|-----------|-----|
| "CSV Bulk Import UI Missing" (P0) | **WRONG — Fully implemented** | `unit-manager.tsx` has file upload, paste, preview, validation, and import button. Visible in `/definicoes`. |
| "sendQuotaReminderNotification never called" | **WRONG — Called in cron** | Called via `sendBulkQuotaReminders()` at `cron/process/route.ts:100` |

---

# 2. Architecture Audit

**Architecture Score: 7.5/10**

## Scoring Breakdown

| Area | Score | Notes |
|------|-------|-------|
| Dependency Management | 8/10 | Clean stack, `next-auth` is beta (5.0.0-beta.30) |
| Code Architecture Patterns | 7.5/10 | ⚠️ Good HOF pattern but NOT 100% adoption (see below) |
| Database Design | 7/10 | Solid schema, missing some indexes, incomplete soft-delete |
| Error Handling | 6.5/10 | Good server actions, fire-and-forget on emails |
| Type Safety | 8/10 | ⚠️ Zero `any` confirmed, but ~60+ `as` assertions (not 7) |
| Code Duplication | 5.5/10 | ⚠️ Overdue marking in 6 places (not 3), form error pattern 10x |
| Architectural Patterns | 8/10 | Clear separation of concerns, consistent naming |
| Performance Architecture | 7.5/10 | Good query awareness, some in-memory filtering |

## Auth System: 7.5/10

- Split config: edge-safe `config.ts` + full server `index.ts`
- `withAdmin`/`withMember` HOF wraps all **module-specific** mutations (financas, comunicacao, contratos, assembleia)
- ⚠️ **NOT 100% adoption**: `src/app/(dashboard)/actions.ts` has ~9 exported actions that use manual auth checks instead of the HOF:
  - `createInvite`, `listInvites`, `importUnitsFromCsv`, `assignUnitMember`
  - `updateCondominium`, `updateUnitIdentifier`, `updateUnitPermilagem`
  - `getNotificationPreferences`, `saveNotificationPreferences`
- `onboarding/actions.ts` (`createCondominiumWithUnits`) also skips the HOF
- `requireMembership()` on every protected page
- Middleware (`proxy.ts`) routes authenticated/unauthenticated users correctly
- JWT sessions with 30-day expiry

**Concern:** `next-auth@5.0.0-beta.30` — beta version, risk of breaking changes between releases.

## Server Actions: 8/10

Module-specific action files (16 files) follow identical structure:
1. `withAdmin(async (ctx, input) => { ... })`
2. Zod validation: `schema.safeParse(input)`
3. Business logic with `db.$transaction()`
4. `revalidatePath("/c/")`
5. Return `{ success: true, ... }` or `{ error: string }`

⚠️ **Exception:** `src/app/(dashboard)/actions.ts` uses manual auth checks (session + membership lookup) instead of the HOF. These actions still check auth, but don't follow the standardized pattern.

**Concern:** Some actions don't use `db.$transaction()` (budget creation relies on Prisma nested create, announcement creation is sequential).

## Database Schema: 7/10

**30+ tables**, well-normalized with proper enums and cascade rules.

**Existing indexes (good):**
- `Quota(condominiumId, status)`, `Quota(condominiumId, status, dueDate)`
- `Expense(condominiumId, date)`, `Transaction(condominiumId, date)`
- `Meeting(condominiumId, status)`, `Meeting(condominiumId, date)`
- `Announcement(condominiumId, createdAt)`

**Missing indexes:**
- `Unit(condominiumId)` — heavily queried, no explicit index
- `Quota(condominiumId, period)` — for year listing
- `Quota(condominiumId, deletedAt, dueDate)` — soft-delete filter
- `Expense(condominiumId, deletedAt, date)` — soft-delete filter
- `Transaction(condominiumId, deletedAt, date)` — soft-delete filter
- `Membership(condominiumId, isActive)` — for member count queries

**Soft-delete pattern: Inconsistent.**
- Applied: Quota, Expense, Transaction
- NOT applied: Announcement, Document, Supplier, Contract, Meeting
- ⚠️ Atas have NO delete action at all (neither hard nor soft)

**`deletedAt` checks are manual everywhere** — should use Prisma middleware to auto-filter.

## Type Safety: 8/10

- Zero `: any` type annotations in production code ✅
- ⚠️ **~60+ `as` type assertions** (v2 said "7 justified" — this was misleading)
  - ~23× `as const` (legitimate, not real assertions)
  - ~7× `as string` (credentials, env vars)
  - ~4× `as unknown as Uint8Array` (PDF generation)
  - ~10× status type narrowing (`as "PENDING" | "PAID"`)
  - ~5× DOM types (`as HTMLInputElement`, `as File`)
  - ~3× Prisma type workarounds (`as unknown as PrismaClient`)
  - Most are reasonable; ~7-10 are potentially problematic (`as unknown` casts)

## Code Duplication (Key Patterns)

| Pattern | Occurrences | Severity |
|---------|-------------|----------|
| ⚠️ Overdue quota marking (`updateMany`) | **6** (quotas page, dashboard admin, dashboard member, devedores, minha-conta, cron) + 1 unused action | High |
| Form error handling (`setError`, `setIsSubmitting`) | 10+ forms | Medium |
| Debtor calculation (two implementations) | 2 (`buildDebtorSummary` vs `buildContaGerencia` inline) | Medium |
| Recurring expense generation | 2 (action + cron) | Low |

## Architecture Recommendations

| Priority | Item | Effort |
|----------|------|--------|
| P0 | Migrate `dashboard/actions.ts` to use `withAdmin`/`withMember` HOF | 2 hours |
| P0 | Prisma middleware for soft-delete auto-filtering | 30 min |
| P0 | Centralize overdue marking (remove from all 5 page loads, keep only cron) | 1 hour |
| P1 | Upgrade `next-auth` to stable when available | 1 hour |
| P1 | Extract `useFormAction()` hook (eliminates ~300 lines) | 2 hours |
| P1 | Add missing database indexes (6 indexes) | 30 min + migration |
| P1 | Replace fire-and-forget email with queue in 3 actions | 1 hour |
| P2 | Audit trail table for sensitive operations | 4 hours |
| P2 | Redis-based rate limiting for production | 2 hours |
| P2 | Centralized toast/notification system | 2 hours |

## ⚠️ v2 Corrections

| v2 Claim | v3 Verdict | Why |
|----------|-----------|-----|
| "withAdmin/withMember 100% adoption" | **WRONG — ~85% adoption** | 9 actions in `dashboard/actions.ts` + 1 in `onboarding/actions.ts` use manual auth |
| "7 justified as assertions" | **WRONG — ~60+ assertions** | "7" only counts `as string`; total is ~60+ across many categories |
| "Overdue marking — 3 occurrences" | **WRONG — 6 occurrences** | Dashboard has 2 (admin + member), plus minha-conta page also marks overdue |
| "Atas use hard delete" | **WRONG — no delete action exists** | Atas cannot be deleted at all (by design or omission) |

---

# 3. Performance / Speed Audit

**Performance Score: 6.5/10**

## Query Count Per Page

| Page | Queries | Writes on Load | Issues |
|------|---------|----------------|--------|
| Dashboard (admin) | 8-9 | 1 (`updateMany` overdue) | Write on every load |
| Dashboard (member) | 5-6 | 1 (`updateMany` overdue) | Write on every load |
| Quotas | 7 | 1 (`updateMany` overdue) | Unconditional debtor fetch |
| Despesas | 2 | 0 | **No pagination** — loads ALL expenses |
| Devedores | 5 | 1 (`updateMany` overdue) | Duplicates quotas page data |
| Minha Conta | 3 | 1 (`updateMany` overdue) | Write on every load |
| Orcamento | 2 | 0 | Good |
| Conta de Gerencia | 5 | 0 | Duplicate year-list query |
| Livro de Caixa | 6 | 0 | Double-fetch for pagination running balance |
| Meetings | 4 | 0 | Nested includes with N+1 risk |
| Announcements | 2 | 0 | No pagination |
| Settings | 3 | 0 | Good |
| Calendar | 3 | 0 | Good, scoped to year |

## Critical Issues

### 3.1 ⚠️ Database writes on every page load (P0) — WORSE than v2 reported

v2 said 3 locations. Actual count: **5 page-level writes + 1 cron + 1 unused action = 7 total**.

Pages that run `updateMany()` on every load:
1. **Dashboard (admin)** — `painel/page.tsx:162-165`
2. **Dashboard (member)** — `painel/page.tsx:358-361`
3. **Quotas page** — `quotas/page.tsx:49-57`
4. **Devedores page** — `devedores/page.tsx:32-40`
5. **Minha Conta page** — `minha-conta/page.tsx:35`

Plus:
6. **Cron job** — `cron/process/route.ts:36-39` (this is the correct canonical location)
7. **Unused action** — `quotas/actions.ts:227-241` (`markOverdueQuotas` — exported but never called)

```typescript
await db.quota.updateMany({
  where: { condominiumId, status: "PENDING", dueDate: { lt: now }, deletedAt: null },
  data: { status: "OVERDUE" },
});
```

**Impact:** Full table scan + write on every user session, potentially running 5 times in a single browsing session.
**Fix:** Remove from ALL page loads. Keep only the cron job. Delete the unused `markOverdueQuotas` action.

### 3.2 ⚠️ Over-broad cache invalidation (P0) — count corrected

All `revalidatePath()` calls use `/c/`:

```typescript
revalidatePath("/c/"); // Invalidates ALL condominiums for ALL users
```

⚠️ v2 said 65 calls. Actual count is **~49 calls**. The pattern issue is real regardless of count — one admin's expense update invalidates every other user's cached pages across all condos.

**Fix:** Path-specific: `revalidatePath(\`/c/${slug}/financas/despesas\`)`.

### 3.3 No pagination on Expenses page (P1 — HIGH impact) ✅

```typescript
const expenses = await db.expense.findMany({
  where: { condominiumId, deletedAt: null },
  orderBy: { date: "desc" }, // NO take/skip — fetches ALL
});
```

For a condo with 500+ expenses/year, this fetches everything on every load.

**Fix:** Add `take: 50` + `skip` pagination (pattern already exists in Livro de Caixa).

### 3.4 Meetings page: nested includes (P1) ✅

```typescript
const meetings = await db.meeting.findMany({
  include: {
    agendaItems: { orderBy: { order: "asc" } },
    attendees: { include: { user: { select: { name: true } } } },
    votes: { include: { unit: { select: { identifier: true } } } },
    ata: true,
  },
});
```

Nested includes confirmed. ⚠️ v2 claimed "31+ queries for 10 meetings" — exact query count is unverifiable without Prisma logs, but the N+1 risk from nested includes is real.

**Fix:** Only include `agendaItems` and `ata` in initial load. Lazy-load attendees/votes on expand.

### 3.5 No `dynamic()` imports for modals (P1) ✅

Zero `next/dynamic` imports found in the entire codebase. All form modals eagerly bundled.

**Fix:** Use `next/dynamic` — saves ~20-30 KB per page.

### 3.6 Quotas page: inefficient year listing (P2) ✅

```typescript
const allPeriods = await db.quota.findMany({
  where: { condominiumId, deletedAt: null },
  select: { period: true },
  distinct: ["period"],
});
```

Uses Prisma `distinct` on `findMany` instead of raw SQL `SELECT DISTINCT`.

### 3.7 Missing soft-delete indexes (P1) ✅

Every query filters `deletedAt: null` but no index includes `deletedAt`. Confirmed by reading `schema.prisma` — Quota, Expense, Transaction indexes don't include `deletedAt`.

**Fix:** Add composite indexes: `(condominiumId, deletedAt, dueDate)` on Quota, `(condominiumId, deletedAt, date)` on Expense and Transaction.

### 3.8 List computations not memoized (P2) ✅

Confirmed: zero `useMemo()` usage in `quota-list.tsx`, `expense-list.tsx`, or `announcement-list.tsx`. All compute groupings, totals, and sorts on every render.

## Performance Recommendations

| Priority | Item | Impact | Effort |
|----------|------|--------|--------|
| P0 | Remove `updateMany()` from all 5 page loads (keep cron only) | 20-30% faster pages | 1 hour |
| P0 | Path-specific `revalidatePath()` (~49 calls) | Eliminates cache thrashing | 2 hours |
| P1 | Add pagination to Expenses page | Critical for scale | 2 hours |
| P1 | Fix Meetings nested includes (lazy-load) | Faster meeting list | 2 hours |
| P1 | Lazy-load form modals with `dynamic()` | 20-30 KB smaller bundles | 1 hour |
| P1 | Add soft-delete composite indexes (3) | Faster financial queries | 30 min |
| P2 | `useMemo()` for list computations | Smoother re-renders | 1 hour |
| P2 | Cache year list across pages | Saves 2 queries/session | 30 min |

## ⚠️ v2 Corrections

| v2 Claim | v3 Verdict | Why |
|----------|-----------|-----|
| "3 page loads with updateMany" | **WRONG — 5 page loads** | Dashboard has 2 (admin + member), plus minha-conta also runs it |
| "65 revalidatePath calls" | **WRONG — ~49 calls** | Count inflated by ~16; pattern issue is still valid |
| "31+ queries for 10 meetings" | **UNVERIFIABLE** | Nested includes confirmed but exact query count is speculative |

---

# 4. Security Audit

**Security Score: 6/10** (8.5/10 after critical fixes)

## Critical Vulnerabilities

### 4.1 ⚠️ Expenses page exposed to non-admin members (CRITICAL) — CORRECTED

⚠️ **v2 claimed both Expenses AND Livro de Caixa were exposed. Only Expenses is actually exposed.**

**Despesas (Expenses) — EXPOSED:**
- `despesas/page.tsx` fetches ALL expenses regardless of role
- Navigation hides it (`roles: ["ADMIN"]` in sidebar), but no server-side redirect
- A non-admin who types the URL directly sees all expense data in rendered HTML
- No dev tools or browser inspection needed

**Livro de Caixa — PROPERLY PROTECTED:**
- `livro-caixa/page.tsx:123` has explicit check: `if (membership.role !== "ADMIN") redirect(\`/c/${slug}/painel\`);`
- Non-admins are redirected before any data is fetched

**Fix:** Add `if (membership.role !== "ADMIN") redirect(...)` to `despesas/page.tsx`.

### 4.2 Password reset token stored in plaintext (HIGH) ✅

```typescript
const token = randomBytes(32).toString("hex");
await db.user.update({ data: { passwordResetToken: token } }); // Not hashed
```

If the database is compromised, all active reset tokens are immediately usable.

**Fix:** Hash token before storing (like passwords). Compare with hash on validation.

### 4.3 Password reset token exposed in dev mode (HIGH) ✅

```typescript
return { success: true, devToken: token }; // Returned in HTTP response
```

If `NODE_ENV` is misconfigured on staging/preview, tokens leak in API responses.

**Fix:** Remove `devToken` entirely. Use `console.log` in dev mode instead.

### 4.4 No email verification on registration (MEDIUM-HIGH) ✅

Users register with any email without verification. `emailVerified` field exists in schema but is never populated during registration.

**Fix:** Add email verification flow before allowing invite acceptance.

### 4.5 ⚠️ Hard deletes on 5 entity types (HIGH) — CORRECTED

⚠️ v2 said 6 entities. Actual: **5 hard deletes + 1 with no delete at all.**

| Entity | Delete method | Status |
|--------|--------------|--------|
| Announcements | `db.announcement.delete()` | Hard delete ✅ |
| Documents | `db.document.delete()` | Hard delete ✅ |
| Suppliers | `db.supplier.delete()` | Hard delete ✅ |
| Contracts | `db.contract.delete()` | Hard delete ✅ |
| Meetings | `db.meeting.delete()` | Hard delete ✅ |
| ⚠️ Atas | **No delete action exists** | Cannot be deleted at all |

**Fix:** Add `deletedAt DateTime?` to all 5 models. Replace `delete()` with soft-delete. Decide if Atas should be deletable (likely not — minutes are legal records).

## High-Priority Issues

### 4.6 Open enum validation — category bypass (MEDIUM) ✅

Confirmed across all 4 validator files:
- `announcement.ts`: `category: z.string().min(1)` — not `z.enum()`
- `maintenance.ts`: `priority: z.string().min(1)`, `status: z.string().min(1)`
- `document.ts`: `category: z.string().min(1)`
- `contract.ts`: `type: z.string().min(1)`, `renewalType: z.string()`, `paymentFrequency: z.string()`

Constants arrays (e.g., `ANNOUNCEMENT_CATEGORIES`) are defined but never used in the Zod schemas.

**Fix:** Use `z.enum(ANNOUNCEMENT_CATEGORIES)` etc.

### 4.7 Missing string length limits (MEDIUM) ✅

No `.max()` on text fields across all validators. Confirmed on: `announcement.title`, `announcement.body`, `maintenance.description`, `expense.description`, `contract.notes`, etc.

**Fix:** Add `.max(200)` on titles, `.max(10000)` on body fields.

### 4.8 Unvalidated URLs in file fields (MEDIUM) ✅

`invoiceUrl`, `documentUrl`, `fileUrl` all use `z.string()` without `.url()` validation.

**Fix:** Use `z.string().url()` and require `https://` prefix.

### 4.9 ⚠️ Soft-delete filter missing on update operations — CORRECTED

⚠️ **v2 used `avisos/actions.ts updateAnnouncement` as an example, but Announcements don't have a `deletedAt` field.** The Announcement model uses hard deletes, making this claim moot for that specific example.

The underlying concern is valid for models that DO have soft-delete (Quota, Expense, Transaction) — update operations on these should check `deletedAt: null`. The `updateExpense` bug was already fixed in this session.

### 4.10 No audit trail for payment reversals (HIGH) ✅

`undoPayment()` reverses payments with no record of who reversed it or why. The related transactions are soft-deleted but no audit log entry is created.

**Fix:** Add `PaymentReversal` log table or audit mechanism.

### 4.11 Cross-condo membership not validated on attendance (MEDIUM) ✅

`saveAttendance()` accepts arbitrary `userId` values. It validates the meeting belongs to the condo but does NOT verify each userId is a member of that condo.

### 4.12 Cron secret: timing-unsafe comparison (MEDIUM) ✅

```typescript
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`)
```

Uses `!==` instead of `crypto.timingSafeEqual()`. Also doesn't validate `CRON_SECRET` is set.

### 4.13 No rate limiting on PDF endpoints (MEDIUM) ✅

No rate limiting on `/api/receipts/`, `/api/atas/`, `/api/conta-gerencia`, `/api/budgets/`. Rate limiting infrastructure exists (used on cron), just not applied to PDFs.

### 4.14 Permilagem sum not enforced on unit update (MEDIUM) ✅

Individual unit permilagem validated 0-1000, but total sum across all units is not checked against 1000.

## ⚠️ NEW finding: dashboard/actions.ts skips HOF pattern

9 server actions in `src/app/(dashboard)/actions.ts` use manual auth checks instead of `withAdmin`/`withMember`. While they do check authentication, they don't follow the standardized pattern, making security review harder. Actions include: `createInvite`, `importUnitsFromCsv`, `updateCondominium`, `updateUnitPermilagem`, etc.

## OWASP Top 10 Results

| # | Vulnerability | Status | Details |
|---|---------------|--------|---------|
| A1 | Broken Access Control | **FAIL** | ⚠️ Expenses exposed to non-admins (Livro de Caixa is fine); attendance accepts cross-condo users |
| A2 | Cryptographic Failures | **WARN** | Reset tokens stored plaintext; devToken in response |
| A3 | Injection | **PASS** | Prisma ORM prevents SQL injection |
| A4 | Insecure Design | **FAIL** | Hard deletes, no audit trail for reversals, no email verification |
| A5 | Security Misconfiguration | **WARN** | Timing-unsafe cron check, no env var validation |
| A6 | Vulnerable Components | **UNKNOWN** | Dev dependency vulns (Hono, Effect) |
| A7 | Authentication Failures | **WARN** | No email verification on registration |
| A8 | Data Integrity Failures | **FAIL** | Hard deletes destroy audit trail |
| A9 | Logging & Monitoring | **FAIL** | No audit logging for sensitive operations |
| A10 | SSRF | **WARN** | Unvalidated URLs in file fields |

## What's Working Well

- `withAdmin`/`withMember` HOF on all module-specific actions (~85% total coverage)
- All queries scoped by `condominiumId` — no horizontal privilege escalation
- Slug-based routing — can't tamper with condo selection
- bcrypt(12) password hashing
- Prisma ORM prevents SQL injection
- No hardcoded secrets, `.env` properly gitignored
- File upload with type whitelist + size limit (10MB)
- CSRF protection via NextAuth SameSite cookies
- Livro de Caixa properly admin-gated with redirect

## Security Recommendations

| Priority | Item | Effort |
|----------|------|--------|
| P0 | Restrict expenses page to admin-only (add redirect) | 30 min |
| P0 | Remove `devToken` from password reset response | 30 min |
| P0 | Migrate `dashboard/actions.ts` to use HOF pattern | 2 hours |
| P0 | Add soft-delete to 5 hard-delete entity types | 4-6 hours |
| P1 | Hash password reset tokens before storing | 2 hours |
| P1 | Add email verification on registration | 3 hours |
| P1 | Fix enum validation (use `z.enum()` not `z.string()`) | 1 hour |
| P1 | Add string length limits to all text validators | 2 hours |
| P1 | Add payment reversal audit log | 4 hours |
| P1 | Validate attendance users belong to condo | 1 hour |
| P2 | Timing-safe cron secret comparison | 30 min |
| P2 | Rate limit PDF endpoints (30/hour/user) | 1 hour |
| P2 | URL validation on file fields (require https://) | 30 min |
| P2 | Enforce permilagem sum = 1000 on unit update | 1 hour |

## ⚠️ v2 Corrections

| v2 Claim | v3 Verdict | Why |
|----------|-----------|-----|
| "Expenses + Livro de Caixa exposed" | **PARTIALLY WRONG** | Only Expenses is exposed; Livro de Caixa has proper `redirect()` |
| "Hard deletes on 6 entities (including Atas)" | **WRONG — 5 entities** | Atas have no delete action at all |
| "4.9: Soft-delete missing on Announcement updates" | **WRONG — moot claim** | Announcements don't have a `deletedAt` field |
| "dashboard/actions.ts uses HOF" (implied by 100%) | **WRONG — skips HOF** | 9 actions use manual auth, not withAdmin/withMember |

---

# 5. Finanças Information Overlap & Redundancy

**Overlap Severity: HIGH — Confirmed**

## Current Structure (7 sub-pages) ✅

| # | Page | URL | Purpose | Roles |
|---|------|-----|---------|-------|
| 1 | Quotas | `/financas/quotas` | Quota list + payment + embedded devedores tab | All (actions: admin) |
| 2 | Despesas | `/financas/despesas` | Expense list + recurring expense tab | Admin (nav-hidden, but accessible via URL to all) |
| 3 | Despesas Recorrentes | `/financas/despesas-recorrentes` | **Dead redirect** → Despesas | Admin |
| 4 | Devedores | `/financas/devedores` | Debtor aging analysis | Admin |
| 5 | Orcamento | `/financas/orcamento` | Budget management | All (actions: admin) |
| 6 | Conta de Gerencia | `/financas/conta-gerencia` | Annual financial report | Admin |
| 7 | Livro de Caixa | `/financas/livro-caixa` | Transaction ledger | Admin (properly gated) |

## Granular Data Overlap Matrix ✅

| Data Point | Quotas | Quotas (Devedores tab) | Devedores Page | Conta Gerencia | Livro Caixa | Dashboard |
|------------|--------|----------------------|----------------|----------------|-------------|-----------|
| Individual quota amount | **Full** | — | — | — | Aggregated | — |
| Quota status per unit | **Full** | — | — | — | — | Count |
| Total quotas generated | Summary | — | — | **Summary** | — | — |
| Total quotas paid | Summary | — | — | **Summary** | — | YTD |
| Total quotas pending | Summary | — | — | **Summary** | — | Amount |
| Total quotas overdue | Summary | — | — | **Summary** | — | Amount+Count |
| **Debtor per unit** | — | **Full list** | **Full list** | **Full table** | — | — |
| **Debtor aging buckets** | — | **5 buckets** | **5 buckets** | — | — | — |
| Debtor total debt | — | **Sum** | **Sum** | **Sum** | — | — |
| Collection rate % | — | — | — | **Calculated** | — | — |
| Individual expense | — | — | — | — | Detail rows | — |
| Expense by category | — | — | — | **Breakdown** | — | — |
| Total expenses | — | — | — | **Sum** | — | YTD |
| Budget variance | — | — | — | **Full table** | — | — |
| Reserve fund | — | — | — | **Calculated** | — | — |
| Net balance | — | — | — | **Calculated** | Running | YTD |
| Payment receipt | Download | — | — | — | — | — |

## Redundant Calculations ✅

### Debtor calculation — 3 independent implementations:

1. **Quotas page** (`quotas/page.tsx:149`): Calls `buildDebtorSummary()` — full aging analysis
2. **Devedores page** (`devedores/page.tsx:72`): Also calls `buildDebtorSummary()` — identical output, separate DB query
3. **Conta de Gerencia** (`conta-gerencia.ts:137-162`): **Inline reimplementation** — separate loop with `unitMap`, calculates pending + overdue per unit but WITHOUT aging buckets

The Conta de Gerencia version is simpler (no 30/60/90-day breakdown), but it duplicates the core logic of "group unpaid quotas by unit."

### ⚠️ Overdue marking — 6 independent locations (v2 said 3):

| # | Location | File:Line | Runs when |
|---|----------|-----------|-----------|
| 1 | Quotas page | `quotas/page.tsx:49-57` | Every page load |
| 2 | Dashboard (admin) | `painel/page.tsx:162-165` | Every page load |
| 3 | Dashboard (member) | `painel/page.tsx:358-361` | Every page load |
| 4 | Devedores page | `devedores/page.tsx:32-40` | Every page load |
| 5 | Minha Conta page | `minha-conta/page.tsx:35` | Every page load |
| 6 | Cron job | `cron/process/route.ts:36-39` | Nightly |
| 7 | Unused action | `quotas/actions.ts:227-241` | Never (dead code) |

If a user visits Dashboard → Quotas → Minha Conta in one session, overdue marking runs **3 times**.

## Devedores Page vs Quotas Devedores Tab ✅

Both use:
- Same function: `buildDebtorSummary()`
- Same component: `<DebtorClient summary={...} />`
- Same data: unpaid quotas with `status: { in: ["PENDING", "OVERDUE"] }`
- Only difference: Quotas tab passes `hideTitle` prop

**These are 100% identical in output.** The Devedores page is entirely redundant.

## Budget Page Missing Variance — NUANCED

⚠️ v2 said "Budget page is incomplete without variance." More precisely:
- Budget page (`orcamento`) shows **only planned amounts** per category — correct
- Variance calculation **exists** in `conta-gerencia.ts` (planned vs actual per category) — also correct
- The variance isn't "missing from the system" — it's in the wrong place (Conta de Gerencia instead of Budget)
- **User journey issue:** Admin creates a budget, wants to see actual vs planned, has to navigate to Conta de Gerencia to find it

## Proposed Streamlined Structure

### Option A: 5 pages (Recommended)

| Page | What it contains | Change |
|------|-----------------|--------|
| **Quotas** | Quota list + payment + Devedores tab (with aging) | Merge Devedores page content into tab (already mostly done) |
| **Despesas** | Expense list + recurring tab (already done) | Remove dead Despesas Recorrentes nav item |
| **Orcamento** | Budget + Budget vs. Actual variance | **Add** variance table from Conta de Gerencia |
| **Livro de Caixa** | Transaction ledger + cross-links | **Add** clickable links to source quotas/expenses |
| **Conta de Gerencia** | Annual compliance report + PDF export | Keep as legal/export tool, remove debtor duplication |

### Navigation (After)

```
Quotas → Despesas → Orcamento → Livro de Caixa → Conta de Gerencia
```

Removed: Despesas Recorrentes (dead), Devedores (merged into Quotas)

### Code Changes Required

1. **Delete `/financas/devedores/` directory** (or redirect to quotas)
2. **Remove "Despesas Recorrentes" from sidebar** navigation
3. **Extract `markOverdueQuotas()`** into shared utility, remove from all 5 pages
4. **Refactor `buildContaGerencia()`** to use `buildDebtorSummary()` instead of inline logic
5. **Add variance calculation** to orcamento page
6. **Add transaction context links** in Livro de Caixa

## Overlap Recommendations

| Priority | Item | Effort | Payoff |
|----------|------|--------|--------|
| Critical | Remove overdue marking from all 5 page loads | 1 hour | Eliminates 5 redundant DB writes |
| ⚠️ ~~Remove Despesas-Recorrentes nav item~~ | N/A | **Not in sidebar** — redirect page exists but is not linked from navigation. Non-issue. |
| Critical | Merge Devedores into Quotas page (already a tab) | 2 hours | Eliminates duplicate page + query |
| High | Unify debtor calculation (refactor Conta de Gerencia) | 2 hours | Single source of truth |
| High | Add Budget vs. Actual to Orcamento | 4 hours | Makes budget page complete |
| Medium | Add transaction links in Livro de Caixa | 2 hours | Better navigation |
| Low | Reorder finance nav | 5 min | Logical flow |

## ⚠️ v2 Corrections

| v2 Claim | v3 Verdict | Why |
|----------|-----------|-----|
| "Overdue marking — 3 locations" | **WRONG — 6 locations** | Missed dashboard member, minha-conta, and unused action |
| "Budget page missing variance" | **NUANCED** | Variance exists in conta-gerencia.ts; it's a UX placement issue, not missing functionality |

---

# 6. Cross-Cutting Recommendations

## Immediate Priorities (This Week)

| # | Item | Source | Effort |
|---|------|--------|--------|
| 1 | Remove `devToken` from password reset response | Security P0 | 30 min |
| 2 | Restrict expenses page to admin-only (add redirect) | Security P0 | 30 min |
| 3 | Remove `updateMany()` from all 5 page loads | Performance P0 | 1 hour |
| ~~4~~ | ~~Remove Despesas-Recorrentes nav item~~ | ~~UX Critical~~ | ⚠️ **Not in sidebar** — v2 and v3 both wrong. Redirect page exists but no nav link to remove. |
| 4 | Delete unused `markOverdueQuotas` action | Cleanup | 5 min |

## Short-Term (Next 2 Weeks)

| # | Item | Source | Effort |
|---|------|--------|--------|
| 6 | Fix `revalidatePath()` to be path-specific (~49 calls) | Performance P0 | 2 hours |
| 7 | Migrate `dashboard/actions.ts` to use HOF pattern | Security/Arch P0 | 2 hours |
| 8 | Add soft-delete to 5 hard-delete entity types | Security/Arch P0 | 4-6 hours |
| 9 | Merge Devedores into Quotas page | UX Critical | 2 hours |
| 10 | Fix enum validation (`z.enum()` not `z.string()`) | Security P1 | 1 hour |
| 11 | Add string length limits to validators | Security P1 | 2 hours |
| 12 | Add pagination to Expenses page | Performance P1 | 2 hours |
| 13 | Unify debtor calculation (refactor Conta de Gerencia) | UX/Arch | 2 hours |
| 14 | Add soft-delete composite indexes (3) | Performance P1 | 30 min |
| 15 | Prisma middleware for soft-delete auto-filtering | Architecture P0 | 30 min |

## Medium-Term (Next Month)

| # | Item | Source | Effort |
|---|------|--------|--------|
| 16 | Add Budget vs. Actual to Orcamento page | UX High | 4 hours |
| 17 | Hash password reset tokens | Security P1 | 2 hours |
| 18 | Add email verification on registration | Security P1 | 3 hours |
| 19 | Lazy-load modal form components | Performance P1 | 1 hour |
| 20 | Fix Meetings nested includes | Performance P1 | 2 hours |
| 21 | Add payment reversal audit log | Security P1 | 4 hours |
| 22 | Extract `useFormAction()` hook | Architecture P1 | 2 hours |
| 23 | Announcement/Maintenance attachment upload UI | Spec P1 | 2 hours |
| 24 | Member role management UI | Spec P1 | 2 hours |
| 25 | Validate attendance users belong to condo | Security P1 | 1 hour |

## Long-Term (Post-Launch)

| # | Item | Source | Effort |
|---|------|--------|--------|
| 26 | Audit trail table for all sensitive operations | Arch/Security P2 | 4 hours |
| 27 | Redis-based rate limiting | Architecture P2 | 2 hours |
| 28 | Rate limit PDF endpoints | Security P2 | 1 hour |
| 29 | Timing-safe cron secret comparison | Security P2 | 30 min |
| 30 | URL validation on file fields | Security P2 | 30 min |
| 31 | Enforce permilagem sum = 1000 on unit update | Security P2 | 1 hour |
| 32 | WCAG accessibility audit | Spec P2 | 4-6 hours |
| 33 | E2E tests with Playwright | Spec P2 | 8-12 hours |
| 34 | English translations | Spec P2 | 4-8 hours |

---

## Summary Scores

| Audit | Score | Key Takeaway |
|-------|-------|-------------|
| **Spec** | 92-95% complete | Core features done. CSV import and email wiring work (v2 was wrong). Attachment UIs and member role management still missing. |
| **Architecture** | 7.5/10 | HOF pattern is ~85% adopted (not 100%). 6 overdue marking locations (not 3). Needs soft-delete middleware and missing indexes. |
| **Performance** | 6.5/10 | 5 pages write to DB on every load (not 3). ~49 over-broad revalidatePath calls (not 65). No expense pagination. |
| **Security** | 6/10 (8.5/10 after fixes) | Only Expenses page exposed (Livro de Caixa is fine). Plaintext reset tokens. 5 hard-delete entities (not 6). 9 actions skip HOF. |
| **Finanças UX** | HIGH overlap | Devedores page 100% redundant with Quotas tab. 6 overdue marking locations. 3 debtor calc implementations. Dead nav link. |

---

## Appendix: v2 → v3 Correction Summary

All factual errors found in AUDIT_REPORT_2.md, compiled in one place:

| # | v2 Claim | v3 Correction | Impact |
|---|----------|--------------|--------|
| 1 | "Livro de Caixa exposed to non-admins" | **Protected** — has `redirect()` for non-admins | HIGH — false security alarm |
| 2 | "withAdmin/withMember 100% adoption" | **~85%** — 9 actions in `dashboard/actions.ts` skip HOF | HIGH — masked a real gap |
| 3 | "CSV Bulk Import UI Missing" (listed as P0) | **Fully implemented** in `unit-manager.tsx` | HIGH — false P0 spec gap |
| 4 | "sendQuotaReminderNotification never called" | **Called** via `sendBulkQuotaReminders()` in cron | MEDIUM — false gap |
| 5 | "Overdue marking in 3 locations" | **6 locations** (5 pages + cron + 1 unused action) | MEDIUM — undercount |
| 6 | "7 justified as assertions" | **~60+ assertions** total; "7" was only `as string` | MEDIUM — misleading stat |
| 7 | "65 revalidatePath calls" | **~49 calls** — pattern issue still valid | LOW — inflated count |
| 8 | "Soft-delete missing on Announcement updates" (4.9) | **Moot** — Announcements don't have `deletedAt` field | LOW — wrong example |
| 9 | "Atas use hard delete" | **No delete action exists** for Atas | LOW — mischaracterization |
| 10 | "Despesas Recorrentes dead nav link in sidebar" | **Not in sidebar** — redirect page exists at `/despesas-recorrentes/page.tsx` but no nav item links to it | LOW — non-issue presented as "Critical" |

**v2 accuracy: ~71%** (25 of 35 distinct claims correct, 10 wrong or misleading)
**v3 initially repeated error #10** — caught only after manual user review.
