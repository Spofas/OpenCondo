# OpenCondo — Verified Audit Report (v3)

**Date:** 2026-04-01
**Scope:** Spec, Architecture, Performance, Security, Finanças UX/Overlap
**Branch:** `claude/opencondo-development-Ch14I`
**Methodology:** Every claim from AUDIT_REPORT_2.md independently verified against source code. Each finding marked as ✅ (confirmed), ⚠️ (corrected), or 🔍 (new finding). File paths and line numbers provided as evidence.

---

## Table of Contents

1. [Spec Audit](#1-spec-audit)
2. [Architecture Audit](#2-architecture-audit)
3. [Performance / Speed Audit](#3-performance--speed-audit)
4. [Security Audit](#4-security-audit)
5. [Finanças Information Overlap & Redundancy](#5-finanças-information-overlap--redundancy)
6. [Cross-Cutting Recommendations](#6-cross-cutting-recommendations)
7. [Appendix: v2 Correction Summary](#7-appendix-v2-correction-summary)

---

# 1. Spec Audit

**Feature Completeness: ~93-95%**
**Critical Path Verified:** Register → Create Condo → Add Units → Generate Quotas → Record Payment → View Debtors → Export Conta de Gerencia PDF. All working end-to-end.

## Feature Status Matrix

| Feature | Spec § | Status | Verified | Implementation Details |
|---------|--------|--------|----------|----------------------|
| Registration | 2.1 | Done | ✅ | `/registar` with Zod validation, auto-login, rate limit (5/15min). `api/auth/register/route.ts` |
| Login | 2.1 | Done | ✅ | NextAuth credentials provider, JWT sessions. `lib/auth/config.ts:10` strategy: "jwt" |
| Password Reset | 2.1 | Done | ✅ | `randomBytes(32)` token, 1hr expiry (`60*60*1000`), Resend email. `recuperar-password/actions.ts:32-42` |
| Invite System | 2.1 | Done | ✅ | Token (CUID) + code at `/entrar`, 7-day expiry (`dashboard/actions.ts:45`), unit claim |
| Condo Setup Wizard | 3.1 | Done | ✅ | Two-step. Validates permilagem=1000 (`onboarding/actions.ts:31-34`). `db.$transaction` at line 48 |
| Unit Management | 3.1 | Done | ✅ | Identifier, floor, typology, permilagem, owner/tenant assignment |
| ⚠️ CSV Bulk Import | 3.1 | Done | ⚠️ | **v2 said Missing — WRONG.** Full UI exists in `definicoes/unit-manager.tsx` (lines 1-350+): file upload (`accept=".csv,.txt"` line 192), text area paste (line 210), preview step (line 88), import with validation (line 107). Parser at `lib/csv-import.ts`. |
| Budget Management | 3.2.3 | Done | ✅ | Create, approve (locks), line items, reserve fund %, PDF export at `/api/budgets/[budgetId]` |
| Budget Year Uniqueness | 3.2.3 | Done | ✅ | `@@unique([condominiumId, year])` in schema.prisma |
| Quota Generation | 3.2.1 | Done | ✅ | Permilagem + equal split, bulk generation, live preview, dup prevention via unique constraint `[condominiumId, unitId, period]` |
| Quota Payment | 3.2.1 | Done | ✅ | Manual entry, undo, 6 methods (TRANSFERENCIA, NUMERARIO, CHEQUE, MBWAY, MULTIBANCO, OUTRO), receipt PDF |
| Overdue Detection | 3.2.1 | Done | ✅ | Auto-mark on page load + nightly cron. (Note: runs in too many places — see Performance §3.1) |
| Expense Tracking | 3.2.2 | Done | ✅ | 12 categories confirmed (Limpeza through Outros), supplier links, invoice upload, soft deletes |
| Recurring Expenses | 3.2.2 | Done | ✅ | 4 frequencies (MENSAL, TRIMESTRAL, SEMESTRAL, ANUAL), cron, pause/resume (`isActive`), dup prevention (`lastGenerated`) |
| Reserve Fund | 3.2.3 | Done | ✅ | 10% default, configurable %, tracked in conta de gerencia |
| Devedores | Implied | Done | ✅ | 5-bucket aging analysis (blue, amber, orange, red, dark red), per-unit breakdown, color-coded |
| Livro de Caixa | Implied | Done | ✅ | Transaction journal, opening balance, pagination (50/page), date filter |
| Conta de Gerencia | 3.2.3 | Done | ✅ | Pure function `buildContaGerencia()` in `lib/conta-gerencia.ts`, budget variance, PDF export |
| Announcements | 3.3.1 | Done | ✅ | 5 categories (GERAL, OBRAS, MANUTENCAO, ASSEMBLEIA, URGENTE), pinning, read tracking (`AnnouncementRead`) |
| **Announcement Attachments UI** | Implied | **Missing** | ✅ | Schema `AnnouncementAttachment` exists, no FileUpload in announcement-form.tsx |
| Maintenance Requests | 3.3.2 | Done | ✅ | 4-state (SUBMETIDO, EM_ANALISE, EM_CURSO, CONCLUIDO), 4 priority (BAIXA, MEDIA, ALTA, URGENTE), admin notes, `MaintenanceUpdate` history |
| **Maintenance Photos UI** | Implied | **Missing** | ✅ | Schema `MaintenancePhoto` exists, no FileUpload in maintenance-form.tsx |
| Document Archive | 3.3.3 | Done | ✅ | 6 categories (ATAS, ORCAMENTOS, SEGUROS, CONTRATOS, REGULAMENTOS, OUTROS), visibility ALL/ADMIN_ONLY, Vercel Blob |
| Supplier Directory | Implied | Done | ✅ | Name, phone, email, NIF, category |
| Meeting Scheduling | 3.4.1 | Done | ✅ | Date, time, location, ORDINARIA/EXTRAORDINARIA, agenda items |
| Attendance Tracking | 3.4.1 | Done | ✅ | PRESENTE/REPRESENTADO/AUSENTE, permilagem-weighted quorum |
| Voting | 3.4.3 | Done | ✅ | Per-agenda-item, A_FAVOR/CONTRA/ABSTENCAO, permilagem-weighted results |
| Atas (Minutes) | 3.4.2 | Done | ✅ | Rich text, RASCUNHO→FINAL, sequential numbering, PDF at `/api/atas/[ataId]` |
| Ata Approval | Extra | Done | ✅ | `AtaApproval`: PENDENTE/APROVADO/CONTESTADO per member |
| Contract Management | 3.5 | Done | ✅ | 8 types (Limpeza through Outros), ATIVO/EXPIRADO/RENOVADO/CANCELADO, renewal alerts, insurance fields (policyNumber, insuredValue, coverageType) |
| Calendar | 3.6 | Done | ✅ | Monthly grid, meetings + quota due dates + contract renewals |
| Dashboard (Admin) | 3.7 | Done | ✅ | YTD saldo/receitas/despesas, alerts (overdue, open maintenance, expiring contracts) |
| Dashboard (Member) | 3.7 | Done | ✅ | Next quota + due date, next meeting, own overdue quotas |
| My Account | 2.2 | Done | ✅ | Profile, my quotas, notification preferences |
| Role-Based Access | 2.2 | Done | ✅ | ADMIN/OWNER/TENANT. `withAdmin`/`withMember` HOF defined in `lib/auth/admin-context.ts` |
| i18n (Portuguese) | 4.5 | Done | ✅ | ~290 keys in `pt.json` (316 lines), `next-intl` configured |
| ⚠️ Email Notifications | 4.2 | Done | ⚠️ | **v2 said "quota reminders never called" — MISLEADING.** `sendQuotaReminderNotification` IS called from `sendBulkQuotaReminders()` at `cron/process/route.ts:100`. Not called from server actions directly, but IS wired via cron. |
| Receipt PDF | 3.2.1 | Done | ✅ | `/api/receipts/[quotaId]`, ownership-gated |
| Ata PDF | 3.4.2 | Done | ✅ | `/api/atas/[ataId]`, membership-gated |
| Budget PDF | 3.2.3 | Done | ✅ | `/api/budgets/[budgetId]`, membership-gated |
| Conta de Gerencia PDF | 3.2.3 | Done | ✅ | `/api/conta-gerencia?year=YYYY`, admin-only |
| **Member Role Management** | 2.2 | **Missing** | ✅ | No UI to change OWNER→TENANT or deactivate. Members displayed read-only in settings. |
| **WCAG Accessibility** | 4.4 | **Minimal** | ✅ | Responsive Tailwind, semantic HTML, no formal audit |
| Rate Limiting | 4.2 | Done | ✅ | Auth (5/15min), cron (2/hr), in-memory store at `lib/rate-limit.ts` |
| Soft Deletes | 4.2 | Partial | ✅ | On Quota, Expense, Transaction. NOT on Announcement, Document, Contract, Supplier, Meeting |
| File Upload | Extra | Done | ✅ | `/api/upload`, Vercel Blob, 10 MIME types whitelisted, 10MB max |
| Email Queue | Extra | Done | ✅ | `PendingEmail` model, retry (3x), batch processing in cron |
| Notification Preferences | Extra | Done | ✅ | Per-user opt-in/out |
| Slug-based Routing | Extra | Done | ✅ | `/c/[slug]/...`, slug resolved via DB lookup in layout.tsx |
| Optimistic Updates | Extra | Done | ✅ | `useOptimistic` + `useTransition` on 9+ list components |

## Spec Gaps (Prioritized)

### P0 — Must fix before launch
1. **Soft-delete on all entities** — Announcements, Documents, Suppliers, Contracts, Meetings use hard delete (or have no delete). Destroys audit trail.

### P1 — Should fix for polish
2. **Announcement Attachments UI** — Schema exists, `FileUpload` component exists, just not wired.
3. **Maintenance Photos UI** — Same situation.
4. **Member Role Management** — No modal to edit membership role or deactivate.
5. **Permilagem sum validation** — No warning on settings page if total != 1000.

### P2 — Nice-to-have
6. **WCAG accessibility audit** — Run axe/WAVE, add aria labels, check contrast.
7. **Landing page enhancement** — Current `/page.tsx` is minimal.
8. **E2E tests** — No Playwright/Cypress.
9. **English translations** — Infrastructure ready, no `en.json`.

---

# 2. Architecture Audit

**Architecture Score: 7.5/10**

## Scoring Breakdown

| Area | Score | Notes |
|------|-------|-------|
| Dependency Management | 8/10 | Clean stack, `next-auth@5.0.0-beta.30` (confirmed in package.json:50) |
| Code Architecture Patterns | 7/10 | ⚠️ HOF pattern ~68% adoption (11/16 action files), not 100% |
| Database Design | 7/10 | Solid schema, missing some indexes, incomplete soft-delete |
| Error Handling | 6.5/10 | Good server actions, fire-and-forget on emails |
| Type Safety | 8/10 | Zero `: any` confirmed. ⚠️ ~150 `as` assertions (not 7) |
| Code Duplication | 5/10 | ⚠️ Overdue marking in 8 locations (not 3) |
| Architectural Patterns | 8/10 | Clear separation of concerns, consistent naming |
| Performance Architecture | 7.5/10 | Good query awareness, some in-memory filtering |

## Auth System: 7.5/10

**Verified structure:**
- Split config: `lib/auth/config.ts` (edge-safe, lines 1-33) + `lib/auth/index.ts` (full server, lines 1-46) ✅
- JWT sessions with `strategy: "jwt"` at `config.ts:10` ✅
- `requireMembership()` on all protected pages (spot-checked 5+ pages) ✅
- Middleware (`proxy.ts`) routes auth/unauth correctly ✅

**⚠️ withAdmin/withMember adoption: ~68%, NOT 100%**

v2 claimed 100% adoption. Verified reality:

**Uses HOF (11 files):** All module-specific action files under `financas/`, `comunicacao/`, `contratos/`, `assembleia/`:
- `financas/despesas/actions.ts`, `financas/quotas/actions.ts`, `financas/despesas-recorrentes/actions.ts`
- `financas/orcamento/actions.ts`, `financas/livro-caixa/actions.ts`
- `assembleia/reunioes/actions.ts`, `contratos/actions.ts`
- `comunicacao/avisos/actions.ts`, `comunicacao/manutencao/actions.ts`
- `comunicacao/documentos/actions.ts`, `comunicacao/contactos/actions.ts`

**Does NOT use HOF (5 files):**
1. **`src/app/(dashboard)/actions.ts`** — 9 exported functions with manual `auth()` + membership checks: `createInvite`, `listInvites`, `importUnitsFromCsv`, `assignUnitMember`, `updateCondominium`, `updateUnitIdentifier`, `updateUnitPermilagem`, `getNotificationPreferences`, `saveNotificationPreferences`
2. **`src/app/(auth)/onboarding/actions.ts`** — `createCondominiumWithUnits` uses manual auth
3. **`src/app/(auth)/entrar/actions.ts`** — `joinWithInvite` (expected: pre-auth flow)
4. **`src/app/(auth)/login/actions.ts`** — `resolvePostLoginDestination` (expected: auth flow)
5. **`src/app/(auth)/recuperar-password/actions.ts`** — password reset (expected: pre-auth flow)

Auth flows (3-5) are expected to skip HOF. The real gap is `dashboard/actions.ts` and `onboarding/actions.ts`.

## Server Actions: 8/10

16 action files confirmed. Module-specific files (11) follow consistent structure:
1. `withAdmin(async (ctx, input) => { ... })`
2. Zod validation: `schema.safeParse(input)`
3. Business logic
4. `revalidatePath("/c/")`
5. Return `{ success: true }` or `{ error: string }`

**Exceptions:** `dashboard/actions.ts` uses manual auth pattern. Budget creation relies on Prisma nested create (no explicit `$transaction`). Announcement creation is sequential with fire-and-forget email.

## Database Schema: 7/10

**30+ tables**, well-normalized.

**Existing indexes (all verified in schema.prisma):**
- ✅ `Quota(condominiumId, status)` — line 274
- ✅ `Quota(condominiumId, status, dueDate)` — line 275
- ✅ `Expense(condominiumId, date)` — line 301
- ✅ `Transaction(condominiumId, date)` — line 329
- ✅ `Meeting(condominiumId, status)` — line 519
- ✅ `Meeting(condominiumId, date)` — line 520
- ✅ `Announcement(condominiumId, createdAt)` — line 375

**Missing indexes (all verified as absent):**
- ❌ `Unit(condominiumId)` — only ownerId/tenantId indexes (lines 197-198)
- ❌ `Quota(condominiumId, period)` — for year listing
- ❌ `Quota(condominiumId, deletedAt, dueDate)` — soft-delete filter
- ❌ `Expense(condominiumId, deletedAt, date)` — soft-delete filter
- ❌ `Transaction(condominiumId, deletedAt, date)` — soft-delete filter
- ❌ `Membership(condominiumId, isActive)` — for member count queries

**Soft-delete pattern — verified per model:**

| Model | Has `deletedAt`? | Delete method |
|-------|------------------|---------------|
| Quota | ✅ Yes (line 267) | Soft delete |
| Expense | ✅ Yes (line 294) | Soft delete |
| Transaction | ✅ Yes (line 323) | Soft delete |
| Announcement | ❌ No | Hard delete (`avisos/actions.ts:87`) |
| Document | ❌ No | Hard delete (`documentos/actions.ts:69`) |
| Contract | ❌ No | Hard delete (`contratos/actions.ts:128`) |
| Meeting | ❌ No | Hard delete (`reunioes/actions.ts:222`) |
| ⚠️ Supplier | ❌ No | **No delete action exists** |
| ⚠️ Ata | ❌ No | **No delete action exists** |
| Budget | ❌ No | No delete action exists |

## Type Safety: 8/10

- Zero `: any` in production code ✅
- ⚠️ **~150 `as` assertions** (v2 said "7 justified"):
  - ~23× `as const` (legitimate, not real assertions)
  - ~7× `as string` (credentials, env vars)
  - ~4× `as unknown as Uint8Array` (PDF generation)
  - ~10× status type narrowing (`as "PENDING" | "PAID"`)
  - ~5× DOM types (`as HTMLInputElement`, `as File`)
  - ~3× Prisma workarounds (`as unknown as PrismaClient`)
  - Remaining: import renames, misc casts
  - ~7-10 are potentially problematic (`as unknown` casts)

## Code Duplication

| Pattern | v2 Claimed | Actual | Evidence |
|---------|-----------|--------|----------|
| ⚠️ Overdue quota `updateMany` | 3 | **8** | See list below |
| Debtor calculation | 2 implementations | ✅ 2 | `buildDebtorSummary` + inline in `conta-gerencia.ts` |
| Form error pattern | 10+ forms | ✅ ~10 forms, 22 files with pattern | Confirmed |
| Recurring expense generation | 2 | ✅ 2 | Action + cron |

**All 8 overdue marking locations:**

| # | File | Line | Context |
|---|------|------|---------|
| 1 | `painel/page.tsx` | 162-165 | Admin dashboard, page load |
| 2 | `painel/page.tsx` | 358-361 | Member dashboard, page load |
| 3 | `financas/quotas/page.tsx` | 49-57 | Quotas page, page load |
| 4 | `financas/devedores/page.tsx` | 32-40 | Devedores page, page load |
| 5 | `minha-conta/page.tsx` | 29-36 | My Account page, page load |
| 6 | `api/cron/process/route.ts` | 36-39 | Nightly cron (canonical) |
| 7 | `financas/quotas/actions.ts` | 205-210 | Helper function |
| 8 | `financas/quotas/actions.ts` | 229-237 | Exported `markOverdueQuotas` (never called — dead code) |

## Architecture Recommendations

| Priority | Item | Effort |
|----------|------|--------|
| P0 | Migrate `dashboard/actions.ts` to use `withAdmin`/`withMember` HOF | 2 hours |
| P0 | Prisma middleware for soft-delete auto-filtering | 30 min |
| P0 | Centralize overdue marking — remove from all 5 page loads, keep cron only | 1 hour |
| P0 | Delete dead code: unused `markOverdueQuotas` action | 5 min |
| P1 | Upgrade `next-auth` to stable when available | 1 hour |
| P1 | Extract `useFormAction()` hook (eliminates ~300 lines) | 2 hours |
| P1 | Add missing database indexes (6 indexes) | 30 min + migration |
| P1 | Replace fire-and-forget email with queue in actions | 1 hour |
| P2 | Audit trail table for sensitive operations | 4 hours |
| P2 | Redis-based rate limiting for production | 2 hours |

---

# 3. Performance / Speed Audit

**Performance Score: 6.5/10**

## Query Count Per Page — Verified

| Page | v2 Claimed | Actual Queries | Actual Writes | Issues |
|------|-----------|---------------|---------------|--------|
| Dashboard (admin) | 8-9 + 1 write | ✅ ~8 + 1 write | `updateMany` at line 162 | Write on every load |
| Dashboard (member) | (not listed) | 🔍 ~4 + 1 write | `updateMany` at line 358 | Write on every load — **v2 didn't list this separately** |
| Quotas | 7 + 1 write | ⚠️ ~6 + 1 write | `updateMany` at line 49 | Unconditional debtor fetch for admins |
| Despesas | 2, no writes | ✅ 2, no writes | — | **No pagination** — loads ALL expenses |
| ⚠️ Devedores | 5 + 1 write | ⚠️ **2 + 1 write** | `updateMany` at line 32 | v2 said 5 queries — actually 2 (updateMany + findMany) |
| 🔍 Minha Conta | (not listed) | 🔍 ~3 + 1 write | `updateMany` at line 29 | **Not in v2 table at all** |
| ⚠️ Orcamento | 2 | ⚠️ **1** | — | v2 said 2 — actually 1 (findMany with include) |
| Conta de Gerencia | 5 | ✅ ~5 | — | Confirmed: budget + quotas + expenses + 2 list queries |
| Livro de Caixa | 6 | ✅ ~6 | — | Double-fetch for running balance confirmed |
| ⚠️ Meetings | 4 | ⚠️ **3** | — | v2 said 4 — actually 3 in Promise.all, but with massive nested includes |
| Announcements | 2 | ✅ 2 | — | No pagination |
| Settings | 3 | ✅ ~3 | — | Good |
| Calendar | 3 | ✅ ~3 | — | Good, scoped to year |

## Critical Issues

### 3.1 ⚠️ Database writes on every page load (P0) — MUCH WORSE than v2 reported

v2 said "Dashboard, Quotas, and Devedores" (3 pages). Actual: **5 pages + 1 cron + 2 action helpers = 8 total locations**.

**Pages with updateMany on every load:**
| # | Page | File:Line |
|---|------|-----------|
| 1 | Dashboard (admin) | `painel/page.tsx:162-165` |
| 2 | Dashboard (member) | `painel/page.tsx:358-361` |
| 3 | Quotas | `quotas/page.tsx:49-57` |
| 4 | Devedores | `devedores/page.tsx:32-40` |
| 5 | Minha Conta | `minha-conta/page.tsx:29-36` |

**Other locations:**
| 6 | Cron (canonical) | `cron/process/route.ts:36-39` |
| 7 | Action helper | `quotas/actions.ts:205-210` |
| 8 | Dead code | `quotas/actions.ts:229-237` (exported `markOverdueQuotas`, never called) |

If a user visits Dashboard → Quotas → Minha Conta in one session: **3 redundant DB writes**.

**Fix:** Remove from all 5 page loads. Keep only the cron job. Delete the dead `markOverdueQuotas` export.

### 3.2 ⚠️ Over-broad cache invalidation (P0) — count corrected

```typescript
revalidatePath("/c/"); // Invalidates ALL condominiums for ALL users
```

⚠️ v2 said "65 calls." Actual count: **~50 calls**. Pattern issue is real regardless — one admin's expense update invalidates every user's cached pages across all condos.

**Fix:** Path-specific: `` revalidatePath(`/c/${slug}/financas/despesas`) ``.

### 3.3 No pagination on Expenses page (P1) ✅

```typescript
// despesas/page.tsx:12-15
const expenses = await db.expense.findMany({
  where: { condominiumId, deletedAt: null },
  orderBy: { date: "desc" }, // NO take/skip
});
```

Confirmed. Also no pagination on Announcements page.

**Fix:** Add `take: 50` + `skip` (pattern exists in Livro de Caixa).

### 3.4 Meetings page: nested includes (P1) ✅

```typescript
// reunioes/page.tsx:37-60
db.meeting.findMany({
  include: {
    agendaItems: { orderBy: { order: "asc" } },
    attendees: { include: { user: { select: { name: true } } } },
    votes: { include: { unit: { select: { identifier: true } } } },
    ata: true,
  },
});
```

Nested includes confirmed. ⚠️ v2 claimed "31+ queries for 10 meetings" — this is **speculative and unverifiable** from static analysis. Prisma batches related queries. The N+1 risk is real but the specific number is an estimate.

**Fix:** Only include `agendaItems` and `ata` initially. Lazy-load attendees/votes on expand.

### 3.5 No `dynamic()` imports for modals (P1) ✅

Zero `next/dynamic` imports in the entire codebase. All form modals eagerly bundled. Confirmed.

### 3.6 ⚠️ Quotas page year listing with distinct — criticism overstated

```typescript
// quotas/page.tsx:81-90
const allPeriods = await db.quota.findMany({
  select: { period: true },
  distinct: ["period"],
  orderBy: { period: "asc" },
});
```

v2 said "Fetches ALL quota rows to deduplicate." **This is misleading** — Prisma's `distinct` actually generates `SELECT DISTINCT` in SQL, NOT a full table scan with JS deduplication. The query is reasonable, though a raw `SELECT DISTINCT period` might be marginally faster.

### 3.7 Missing soft-delete indexes (P1) ✅

Confirmed in schema.prisma:
- Quota indexes (lines 274-275): `[condominiumId, status]`, `[condominiumId, status, dueDate]` — no `deletedAt`
- Expense index (line 301): `[condominiumId, date]` — no `deletedAt`
- Transaction index (line 329): `[condominiumId, date]` — no `deletedAt`

Every financial query filters `deletedAt: null` without index support.

### 3.8 No `useMemo` in list components (P2) ✅

Zero `useMemo()` in `quota-list.tsx`, `expense-list.tsx`, `announcement-list.tsx`. All groupings, totals, and sorts recompute on every render. Confirmed.

### 3.9 ⚠️ Performance estimates — SPECULATIVE

v2's "Estimated Impact" table (Dashboard 800→450ms, Quotas 1.2→600ms, Meetings 2.0→900ms) is **not backed by measurements**. No instrumentation found. These are educated guesses, not data.

## Performance Recommendations

| Priority | Item | Impact | Effort |
|----------|------|--------|--------|
| P0 | Remove `updateMany()` from all 5 page loads (keep cron only) | Eliminates 5 DB writes per session | 1 hour |
| P0 | Path-specific `revalidatePath()` (~50 calls) | Eliminates cache thrashing | 2 hours |
| P1 | Add pagination to Expenses page (and Announcements) | Critical for scale | 2 hours |
| P1 | Reduce Meetings nested includes (lazy-load) | Faster meeting list | 2 hours |
| P1 | Lazy-load form modals with `next/dynamic` | Smaller bundles | 1 hour |
| P1 | Add soft-delete composite indexes (3) | Faster financial queries | 30 min |
| P2 | `useMemo()` for list computations | Smoother re-renders | 1 hour |

---

# 4. Security Audit

**Security Score: 6/10** (8.5/10 after critical fixes)

## Critical Vulnerabilities

### 4.1 ⚠️ Expenses page exposed to non-admin members (CRITICAL) — CORRECTED from v2

**v2 claimed BOTH `despesas/page.tsx` AND `livro-caixa/page.tsx` were exposed. This is WRONG for Livro de Caixa.**

**Despesas (Expenses) — EXPOSED ✅:**
- `despesas/page.tsx:10`: Sets `isAdmin = membership.role === "ADMIN"`
- `despesas/page.tsx:12-15`: Fetches ALL expenses regardless of role — no filter, no redirect
- Navigation hides it (`roles: ["ADMIN"]` in `sidebar.tsx:54`), but no server-side protection
- A non-admin typing the URL directly sees all expense data in rendered HTML. No dev tools needed.

**Livro de Caixa — PROPERLY PROTECTED ⚠️:**
- `livro-caixa/page.tsx:123`: `if (membership.role !== "ADMIN") redirect(\`/c/${slug}/painel\`);`
- Non-admins are redirected before any data is fetched.
- **v2 was wrong about this page.**

**Fix:** Add `if (membership.role !== "ADMIN") redirect(...)` to `despesas/page.tsx`.

### 4.2 Password reset token stored in plaintext (HIGH) ✅

```typescript
// recuperar-password/actions.ts:33-42
const token = randomBytes(32).toString("hex");
await db.user.update({
  where: { id: user.id },
  data: { passwordResetToken: token, passwordResetExpiresAt: expiresAt },
});
```

Token NOT hashed before storage. If DB compromised, all active reset tokens usable immediately. Confirmed.

### 4.3 Password reset token exposed in dev mode (HIGH) ✅

```typescript
// recuperar-password/actions.ts:44-50
if (process.env.NODE_ENV === "production") {
  await sendPasswordResetEmail(user.email, token);
  return { success: true };
}
return { success: true, devToken: token }; // Plaintext token in response
```

If `NODE_ENV` misconfigured on staging/preview, tokens leak. Confirmed.

### 4.4 No email verification on registration (MEDIUM-HIGH) ✅

```typescript
// api/auth/register/route.ts:46-52
const user = await db.user.create({
  data: { name, email, passwordHash },
});
```

Schema has `emailVerified DateTime?` (schema.prisma:16) but never populated. Confirmed.

### 4.5 ⚠️ Hard deletes — CORRECTED from v2

v2 claimed "6 entity types: Announcements, Documents, Suppliers, Contracts, Meetings, Atas." Verified reality:

| Entity | v2 Claim | Actual | Evidence |
|--------|----------|--------|----------|
| Announcements | Hard delete | ✅ Hard delete | `avisos/actions.ts:87` — `db.announcement.delete()` |
| Documents | Hard delete | ✅ Hard delete | `documentos/actions.ts:69` — `db.document.delete()` |
| Contracts | Hard delete | ✅ Hard delete | `contratos/actions.ts:128` — `db.contract.delete()` |
| Meetings | Hard delete | ✅ Hard delete | `reunioes/actions.ts:222` — `db.meeting.delete()` |
| ⚠️ Suppliers | Hard delete | **NO delete action exists** | Searched entire codebase — suppliers can only be created/updated |
| ⚠️ Atas | Hard delete | **NO delete action exists** | `saveAta()` creates/updates only. No `deleteAta` function. |

**Actual: 4 hard deletes, 2 entities with no delete at all.** v2 was wrong on Suppliers and Atas.

**Fix:** Add `deletedAt DateTime?` to the 4 models that hard-delete. Decide if Suppliers/Atas should be deletable.

## High-Priority Issues

### 4.6 Open enum validation — category bypass (MEDIUM) ✅

All 4 validator files confirmed to use `z.string()` instead of `z.enum()`:

| File | Field | Code | Constants defined but unused |
|------|-------|------|-----------------------------|
| `validators/announcement.ts:14` | category | `z.string().min(1)` | `ANNOUNCEMENT_CATEGORIES` (lines 3-9) |
| `validators/maintenance.ts:10` | priority | `z.string().min(1)` | `MAINTENANCE_PRIORITIES` (line 3) |
| `validators/maintenance.ts:16` | status | `z.string().min(1)` | `MAINTENANCE_STATUSES` (line 4) |
| `validators/document.ts:16` | category | `z.string().min(1)` | `DOCUMENT_CATEGORIES` (lines 3-10) |
| `validators/contract.ts:26` | type | `z.string().min(1)` | `CONTRACT_TYPES` (lines 3-12) |
| `validators/contract.ts:29` | renewalType | `z.string().optional()` | — |
| `validators/contract.ts:31` | paymentFrequency | `z.string().optional()` | — |

**Fix:** Use `z.enum(ANNOUNCEMENT_CATEGORIES)` etc.

### 4.7 Missing string length limits (MEDIUM) ✅

No `.max()` on ANY text field across all validators. Confirmed on: `announcement.title`, `announcement.body`, `maintenance.description`, `expense.description`, `contract.notes`, `document.name`. Confirmed.

### 4.8 Unvalidated URLs in file fields (MEDIUM) ✅

- `validators/expense.ts:11`: `invoiceUrl: z.string().optional()` — no `.url()`
- `validators/document.ts:17`: `fileUrl: z.string().min(1)` — no `.url()`
- `validators/contract.ts:38`: `documentUrl: z.string().optional()` — no `.url()`

Confirmed.

### 4.9 ⚠️ Soft-delete filter on update operations — CORRECTED from v2

v2 used `avisos/actions.ts updateAnnouncement` as the example: "Missing `deletedAt: null` check." **This is a moot claim** — Announcements don't have a `deletedAt` field. They use hard deletes.

The underlying pattern concern is valid for models that DO have soft-delete (Quota, Expense, Transaction). The `updateExpense` bug was already fixed earlier in this session.

### 4.10 No audit trail for payment reversals (HIGH) ✅

```typescript
// quotas/actions.ts:170-198 — undoPayment
await db.$transaction([
  db.quota.update({ where: { id: quotaId }, data: { status: newStatus, paymentDate: null, paymentMethod: null, paymentNotes: null } }),
  db.transaction.updateMany({ where: { quotaId, deletedAt: null }, data: { deletedAt: new Date() } }),
]);
```

No audit log, no record of who reversed or why. Confirmed.

### 4.11 Cross-condo membership not validated on attendance (MEDIUM) ✅

`saveAttendance()` in `reunioes/actions.ts` verifies the meeting exists in the condo (line 84-87) but does NOT verify each `attendee.userId` is a member of that condo. `userId` passed directly from input. Confirmed.

### 4.12 Cron secret: timing-unsafe comparison (MEDIUM) ✅

```typescript
// cron/process/route.ts:20
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`)
```

Uses `!==` instead of `crypto.timingSafeEqual()`. Also doesn't validate `CRON_SECRET` is set. Confirmed.

### 4.13 No rate limiting on PDF endpoints (MEDIUM) ✅

All 4 PDF endpoints have NO rate limiting:
- `/api/receipts/[quotaId]/route.ts`
- `/api/atas/[ataId]/route.ts`
- `/api/budgets/[budgetId]/route.ts`
- `/api/conta-gerencia/route.ts`

Rate limiting infrastructure exists (used on cron at `lib/rate-limit.ts`), just not applied to PDFs. Confirmed.

### 4.14 Permilagem sum not enforced on unit update (MEDIUM) ✅

`updateUnitPermilagem()` in `dashboard/actions.ts` checks individual value 0-1000 but does NOT verify total across all units = 1000. Confirmed.

## OWASP Top 10 Results

| # | Vulnerability | Status | Details |
|---|---------------|--------|---------|
| A1 | Broken Access Control | **FAIL** | Expenses page exposed to non-admins; attendance accepts cross-condo users |
| A2 | Cryptographic Failures | **WARN** | Reset tokens stored plaintext; devToken in response |
| A3 | Injection | **PASS** | Prisma ORM prevents SQL injection |
| A4 | Insecure Design | **FAIL** | Hard deletes (4 entities), no audit trail for reversals, no email verification |
| A5 | Security Misconfiguration | **WARN** | Timing-unsafe cron check, no env var validation |
| A6 | Vulnerable Components | **UNKNOWN** | next-auth beta |
| A7 | Authentication Failures | **WARN** | No email verification on registration |
| A8 | Data Integrity Failures | **FAIL** | Hard deletes destroy audit trail |
| A9 | Logging & Monitoring | **FAIL** | No audit logging for sensitive operations |
| A10 | SSRF | **WARN** | Unvalidated URLs in file fields |

## What's Working Well — All Verified

- ✅ `withAdmin`/`withMember` HOF on all module-specific actions (~11 files)
- ✅ All queries scoped by `condominiumId` — slug resolved via DB in layout.tsx
- ✅ Slug-based routing — tamper-proof (DB lookup, not client-controlled)
- ✅ bcrypt(12) password hashing — `hash(password, 12)` at `register/route.ts:44` and `recuperar-password/actions.ts:72`
- ✅ No hardcoded secrets, `.env` gitignored
- ✅ File upload with 10 MIME types whitelisted + 10MB max at `api/upload/route.ts:8-20`
- ✅ CSRF protection via NextAuth SameSite cookies
- ✅ Livro de Caixa properly admin-gated with redirect

## Security Recommendations

| Priority | Item | Effort |
|----------|------|--------|
| P0 | Restrict expenses page to admin-only (add redirect) | 30 min |
| P0 | Remove `devToken` from password reset response | 30 min |
| P0 | Migrate `dashboard/actions.ts` to HOF pattern | 2 hours |
| P0 | Add soft-delete to 4 hard-delete entities | 4-6 hours |
| P1 | Hash password reset tokens before storing | 2 hours |
| P1 | Add email verification on registration | 3 hours |
| P1 | Fix enum validation (`z.enum()` not `z.string()`) | 1 hour |
| P1 | Add string length limits to all text validators | 2 hours |
| P1 | Add payment reversal audit log | 4 hours |
| P1 | Validate attendance users belong to condo | 1 hour |
| P2 | Timing-safe cron secret comparison | 30 min |
| P2 | Rate limit PDF endpoints | 1 hour |
| P2 | URL validation on file fields | 30 min |
| P2 | Enforce permilagem sum = 1000 on unit update | 1 hour |

---

# 5. Finanças Information Overlap & Redundancy

**Overlap Severity: HIGH — Confirmed**

## Current Structure (7 sub-pages) ✅

| # | Page | URL | In Sidebar? | Purpose | Access |
|---|------|-----|-------------|---------|--------|
| 1 | Quotas | `/financas/quotas` | ✅ Yes | Quota list + payment + embedded devedores tab | All (actions: admin) |
| 2 | Despesas | `/financas/despesas` | ✅ Yes (admin) | Expense list + recurring expense tab | Admin nav, but accessible to all via URL |
| 3 | Despesas Recorrentes | `/financas/despesas-recorrentes` | ⚠️ **NOT in sidebar** | Dead redirect → Despesas | Orphaned route |
| 4 | Devedores | `/financas/devedores` | ⚠️ **NOT in sidebar** | Debtor aging analysis | Orphaned route |
| 5 | Orcamento | `/financas/orcamento` | ✅ Yes | Budget management | All (actions: admin) |
| 6 | Conta de Gerencia | `/financas/conta-gerencia` | ✅ Yes (admin) | Annual financial report | Admin |
| 7 | Livro de Caixa | `/financas/livro-caixa` | ✅ Yes (admin) | Transaction ledger | Admin (redirect-gated) |

**Sidebar nav (verified at `sidebar.tsx:50-58`):**
```
Quotas → Despesas → Orcamento → Conta de Gerencia → Livro de Caixa
```

⚠️ **v2 incorrectly implied Despesas Recorrentes and Devedores were in the sidebar as visible nav items.** They are NOT — they are orphaned routes. Despesas Recorrentes redirects silently. Devedores is only reachable via the Quotas page's devedores tab or by typing the URL directly.

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

## Redundant Calculations — Verified

### ⚠️ Debtor calculation — 2 implementations (v2 said 3)

v2 said "3 independent implementations." Verified reality: **2 implementations, one reused in 2 places.**

1. **`buildDebtorSummary()`** — defined in `lib/debtor-calculations.ts:47-130`
   - Called from **Quotas page** at `quotas/page.tsx:149`
   - Called from **Devedores page** at `devedores/page.tsx:72`
   - Same function, same output, **separate DB queries** (redundant fetching)

2. **Inline in `conta-gerencia.ts:137-162`** — separate `unitMap` loop
   - Calculates `pending` + `overdue` per unit
   - Does NOT use `buildDebtorSummary()` — different structure (no aging buckets)
   - Serves different purpose (annual report summary vs real-time tracking)

The core issue is real (redundant calculation in conta-gerencia), but v2 miscounted.

### Overdue marking — 5 page loads + 1 cron (v2 said 3)

Already detailed in §3.1. Key point: if a user visits Dashboard → Quotas → Minha Conta in one session, the same `updateMany()` runs 3 times.

## Devedores Page vs Quotas Devedores Tab ✅

Both verified to use:
- **Same function:** `buildDebtorSummary()` from `lib/debtor-calculations.ts`
- **Same component:** `<DebtorClient>` from `devedores/debtor-client.tsx`
- **Same query:** Unpaid quotas with `status: { in: ["PENDING", "OVERDUE"] }`
- **Only difference:** Quotas tab passes `hideTitle` prop

**100% identical output.** The standalone Devedores page is entirely redundant — AND it's not even in the sidebar, making it an orphaned route accessible only by direct URL.

## Budget Page: Variance Missing from UI ✅

- **Budget page** (`orcamento/budget-list.tsx`): Shows ONLY planned amounts per category
- **Variance calculation** EXISTS in `conta-gerencia.ts:120-131` (planned vs actual per category)
- The variance is in the wrong place — Conta de Gerencia instead of Budget page
- Admin must navigate to Conta de Gerencia to see "actual vs planned"

This is a UX placement issue, not missing functionality.

## Proposed Streamlined Structure

### Sidebar stays at 5 pages (already the case):

```
Quotas → Despesas → Orcamento → Conta de Gerencia → Livro de Caixa
```

No sidebar changes needed (Despesas Recorrentes and Devedores are already absent).

### Code changes:

| # | Change | Effort | Payoff |
|---|--------|--------|--------|
| 1 | Delete `/financas/devedores/` directory (or add redirect to quotas) | 30 min | Removes orphaned route + duplicate DB query |
| 2 | Delete `/financas/despesas-recorrentes/page.tsx` redirect | 5 min | Removes dead route |
| 3 | Remove overdue marking from all 5 page loads | 1 hour | Eliminates 5 redundant DB writes |
| 4 | Refactor `buildContaGerencia()` to use `buildDebtorSummary()` | 2 hours | Single source of truth for debtor data |
| 5 | Add budget variance view to Orcamento page | 4 hours | Makes budget page complete |
| 6 | Add transaction context links in Livro de Caixa | 2 hours | Better navigation |

---

# 6. Cross-Cutting Recommendations

## Immediate Priorities (This Week)

| # | Item | Source | Effort |
|---|------|--------|--------|
| 1 | Remove `devToken` from password reset response | Security P0 | 30 min |
| 2 | Restrict expenses page to admin-only (add redirect) | Security P0 | 30 min |
| 3 | Remove `updateMany()` from all 5 page loads | Performance P0 | 1 hour |
| 4 | Delete unused `markOverdueQuotas` action (dead code) | Cleanup | 5 min |
| 5 | Delete orphaned `/financas/devedores/` route | Cleanup | 30 min |
| 6 | Delete orphaned `/financas/despesas-recorrentes/page.tsx` | Cleanup | 5 min |

## Short-Term (Next 2 Weeks)

| # | Item | Source | Effort |
|---|------|--------|--------|
| 7 | Fix `revalidatePath()` to be path-specific (~50 calls) | Performance P0 | 2 hours |
| 8 | Migrate `dashboard/actions.ts` to use HOF pattern | Security/Arch P0 | 2 hours |
| 9 | Add soft-delete to 4 hard-delete entity types | Security/Arch P0 | 4-6 hours |
| 10 | Fix enum validation (`z.enum()` not `z.string()`) | Security P1 | 1 hour |
| 11 | Add string length limits to validators | Security P1 | 2 hours |
| 12 | Add pagination to Expenses page (and Announcements) | Performance P1 | 2 hours |
| 13 | Refactor `buildContaGerencia()` to use `buildDebtorSummary()` | UX/Arch | 2 hours |
| 14 | Add soft-delete composite indexes (3) | Performance P1 | 30 min |
| 15 | Prisma middleware for soft-delete auto-filtering | Architecture P0 | 30 min |

## Medium-Term (Next Month)

| # | Item | Source | Effort |
|---|------|--------|--------|
| 16 | Add Budget vs. Actual variance to Orcamento page | UX High | 4 hours |
| 17 | Hash password reset tokens | Security P1 | 2 hours |
| 18 | Add email verification on registration | Security P1 | 3 hours |
| 19 | Lazy-load modal form components (`next/dynamic`) | Performance P1 | 1 hour |
| 20 | Reduce Meetings nested includes | Performance P1 | 2 hours |
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
| **Spec** | 93-95% complete | Core features done. CSV import and email wiring work (v2 was wrong on both). Attachment UIs and member role management still missing. |
| **Architecture** | 7.5/10 | HOF pattern ~68% adopted (not 100%). 8 overdue marking locations (not 3). Needs soft-delete middleware and missing indexes. |
| **Performance** | 6.5/10 | 5 pages write to DB on every load (not 3). ~50 over-broad revalidatePath calls (not 65). Several v2 query counts were wrong. Performance estimates speculative. |
| **Security** | 6/10 (8.5/10 after fixes) | Only Expenses page exposed (not Livro de Caixa). 4 hard-delete entities (not 6 — Suppliers and Atas have no delete). Plaintext reset tokens confirmed. |
| **Finanças UX** | HIGH overlap | 2 orphaned routes (not in sidebar). Devedores page 100% redundant with Quotas tab. 2 debtor implementations (not 3). 5 page-level overdue writes. |

---

# 7. Appendix: v2 Correction Summary

Every factual error found in AUDIT_REPORT_2.md, compiled with evidence:

| # | v2 Claim | v3 Correction | Evidence | Impact |
|---|----------|--------------|----------|--------|
| 1 | "CSV Bulk Import UI Missing" (P0 spec gap) | **Fully implemented** | `definicoes/unit-manager.tsx` lines 1-350+ with file upload, paste, preview, import | HIGH — false P0 gap |
| 2 | "Livro de Caixa exposed to non-admins" | **Properly protected** | `livro-caixa/page.tsx:123` has `redirect()` for non-admins | HIGH — false security alarm |
| 3 | "withAdmin/withMember 100% adoption" | **~68% adoption** (11/16 files) | `dashboard/actions.ts` has 9 unwrapped actions; `onboarding/actions.ts` also unwrapped | HIGH — masked real security gap |
| 4 | "sendQuotaReminderNotification never called" | **Called via cron** | `sendBulkQuotaReminders()` at `cron/process/route.ts:100` calls it | MEDIUM — false gap |
| 5 | "Hard deletes on 6 entities (including Suppliers and Atas)" | **4 hard deletes** | Suppliers: no delete action exists. Atas: no delete action exists. | MEDIUM — 2 entities miscategorized |
| 6 | "Overdue marking in 3 locations" | **8 locations** (5 page loads + cron + 2 actions) | Full list in Architecture §Code Duplication | MEDIUM — severely undercounted |
| 7 | "7 justified as assertions" | **~150 total assertions** | "7" only counts `as string`; full count includes ~23 `as const`, ~10 status narrowing, etc. | MEDIUM — misleading stat |
| 8 | "65 revalidatePath calls" | **~50 calls** | Pattern issue is real; count was inflated | LOW — inflated count |
| 9 | "Soft-delete missing on Announcement updates" (4.9 example) | **Moot** — Announcements have no `deletedAt` field | Schema.prisma: Announcement model has no deletedAt | LOW — wrong example |
| 10 | "Despesas Recorrentes dead nav link" | **Not in sidebar** | `sidebar.tsx:50-58` has no entry for despesas-recorrentes | LOW — not a nav issue, just an orphaned route |
| 11 | "Devedores page" (implied as active nav item) | **Not in sidebar** | `sidebar.tsx:50-58` has no entry for devedores | LOW — orphaned route |
| 12 | "3 debtor implementations" | **2 implementations** | 1 shared function (`buildDebtorSummary`) reused in 2 places + 1 inline in conta-gerencia | LOW — miscounted |
| 13 | Query counts: Devedores "5 queries" | **2 queries** | `devedores/page.tsx` has 1 updateMany + 1 findMany | LOW — inflated count |
| 14 | Query counts: Orcamento "2 queries" | **1 query** | `orcamento/page.tsx` has 1 findMany with include | LOW — inflated count |
| 15 | Query counts: Meetings "4 queries" | **3 queries** | `reunioes/page.tsx` has 3 queries in Promise.all | LOW — inflated count |
| 16 | "31+ queries for 10 meetings" | **Unverifiable** | Speculative from static analysis; Prisma batches queries | LOW — speculative claim |
| 17 | Prisma distinct "fetches ALL rows" | **Generates SQL DISTINCT** | Prisma `distinct` maps to SQL, not JS deduplication | LOW — overstated criticism |
| 18 | Performance estimates (800ms→450ms, etc.) | **Speculative** | No instrumentation or measurements found | LOW — unverified estimates |

**v2 accuracy: ~70%** — 18 errors across ~60 distinct verifiable claims.

The most consequential errors: claiming CSV import is missing (#1), claiming Livro de Caixa is exposed (#2), claiming 100% HOF adoption (#3), and severely undercounting overdue marking (#6). These would lead to wasted effort on non-issues and missed effort on real issues.
