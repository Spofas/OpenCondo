# Audit Report 3 — Fix Tracker

**Source:** `AUDIT_REPORT_3.md`
**Last updated:** 2026-04-01

Legend: ✅ Done | ⬜ Not started | 🔧 In progress

---

## 1. Spec Gaps

### P0

| # | Issue | Status | Notes |
|---|-------|--------|-------|
| 1 | Soft-delete on all entities (Announcements, Documents, Contracts, Meetings) | ✅ | Added `deletedAt` to 4 models, converted hard deletes to soft deletes |

### P1

| # | Issue | Status | Notes |
|---|-------|--------|-------|
| 2 | Announcement Attachments UI | ⬜ | Schema exists, `FileUpload` component exists, not wired |
| 3 | Maintenance Photos UI | ⬜ | Same situation |
| 4 | Member Role Management | ⬜ | No modal to edit role or deactivate |
| 5 | Permilagem sum validation | ⬜ | No warning on settings page if total != 1000 |

### P2

| # | Issue | Status | Notes |
|---|-------|--------|-------|
| 6 | WCAG accessibility audit | ⬜ | |
| 7 | Landing page enhancement | ⬜ | |
| 8 | E2E tests (Playwright) | ⬜ | |
| 9 | English translations | ⬜ | Infrastructure ready, no `en.json` |

---

## 2. Architecture Issues

| # | Issue | Status | Notes |
|---|-------|--------|-------|
| A1 | HOF pattern adoption gap (`dashboard/actions.ts`) | ✅ | All 9 actions migrated to `withAdmin`/`withMember` |
| A2 | Missing soft-delete composite indexes | ✅ | Added `[condominiumId, deletedAt]` to all 7 soft-delete models |
| A3 | Prisma soft-delete auto-filtering | ✅ | Client Extension (`$extends`) auto-adds `deletedAt: null` to reads |
| A4 | Code duplication — overdue marking in 8 locations | ✅ | Removed from 5 page loads, kept cron only, deleted dead `markOverdueQuotas` |

---

## 3. Performance Issues

### P0

| # | Issue | Audit Ref | Status | Notes |
|---|-------|-----------|--------|-------|
| 1 | Database writes on every page load (5 pages) | 3.1 | ✅ | Removed `updateMany()` from all 5 pages; cron-only |
| 2 | Over-broad `revalidatePath("/c/")` (~50 calls) | 3.2 | ✅ | Scoped to `` `/c/${ctx.slug}` `` in all ~48 calls |

### P1

| # | Issue | Audit Ref | Status | Notes |
|---|-------|-----------|--------|-------|
| 3 | No pagination on Expenses page (+ Announcements) | 3.3 | ⬜ | |
| 4 | Meetings page nested includes | 3.4 | ⬜ | |
| 5 | No `dynamic()` imports for modals | 3.5 | ⬜ | |
| 6 | Missing soft-delete indexes | 3.7 | ✅ | 7 indexes added |

### P2

| # | Issue | Audit Ref | Status | Notes |
|---|-------|-----------|--------|-------|
| 7 | No `useMemo` in list components | 3.8 | ⬜ | Low impact |

---

## 4. Security Issues

### Critical / P0

| # | Issue | Audit Ref | Status | Notes |
|---|-------|-----------|--------|-------|
| 1 | Expenses page exposed to non-admin members | 4.1 | ✅ | Added admin redirect |
| 2 | `devToken` exposed in password reset response | 4.3 | ✅ | Token logged to console only, never in response |

### High / P1

| # | Issue | Audit Ref | Status | Notes |
|---|-------|-----------|--------|-------|
| 3 | Password reset token stored in plaintext | 4.2 | ✅ | SHA-256 hashed before storage |
| 4 | No email verification on registration | 4.4 | ✅ | Full verification flow with resend UI |
| 5 | Hard deletes on 4 entity types | 4.5 | ✅ | Converted to soft-delete |
| 6 | No audit trail for payment reversals | 4.10 | ✅ | `recordedBy`/`recordedAt` on Quota |
| 7 | Cross-condo membership not validated on attendance | 4.11 | ✅ | Membership check in `saveAttendance` |

### Medium / P1

| # | Issue | Audit Ref | Status | Notes |
|---|-------|-----------|--------|-------|
| 8 | Open enum validation — category bypass | 4.6 | ✅ | 15 fields converted to `z.enum()` |
| 9 | Missing string length limits | 4.7 | ✅ | `.max()` on ~49 fields across 13 validators |
| 10 | Unvalidated URLs in file fields | 4.8 | ✅ | `.max(2048)` added (full `.url()` not needed — URLs come from our upload system) |

### Medium / P2

| # | Issue | Audit Ref | Status | Notes |
|---|-------|-----------|--------|-------|
| 11 | Cron secret: timing-unsafe comparison | 4.12 | ⬜ | Use `crypto.timingSafeEqual()` |
| 12 | No rate limiting on PDF endpoints | 4.13 | ⬜ | Rate limit infra exists, not applied |
| 13 | Permilagem sum not enforced on unit update | 4.14 | ⬜ | Warning or enforcement on save |

---

## 5. Finanças Overlap / Redundancy

| # | Issue | Status | Notes |
|---|-------|--------|-------|
| 1 | Orphaned `/financas/devedores/` route | ✅ | Redirects to quotas page |
| 2 | Orphaned `/financas/despesas-recorrentes/` route | ✅ | Already redirects to despesas |
| 3 | Redundant overdue marking (8 locations → cron only) | ✅ | Cleaned up |
| 4 | `buildContaGerencia()` duplicates debtor logic | ⬜ | Should reuse `buildDebtorSummary()` |
| 5 | Budget vs. Actual variance missing from Orcamento page | ⬜ | Conta de gerência has it, budget page doesn't |

---

## 6. Roadmap Items (from Audit Priorities)

### Immediate (This Week) — All Done

| # | Item | Status |
|---|------|--------|
| 1 | Remove `devToken` from password reset response | ✅ |
| 2 | Restrict expenses page to admin-only | ✅ |
| 3 | Remove `updateMany()` from all 5 page loads | ✅ |
| 4 | Delete unused `markOverdueQuotas` action | ✅ |
| 5 | Delete orphaned `/financas/devedores/` route | ✅ |
| 6 | Delete orphaned `/financas/despesas-recorrentes/page.tsx` | ✅ |

### Short-Term (Next 2 Weeks)

| # | Item | Status |
|---|------|--------|
| 7 | Fix `revalidatePath()` to be path-specific | ✅ |
| 8 | Migrate `dashboard/actions.ts` to HOF pattern | ✅ |
| 9 | Add soft-delete to 4 hard-delete entity types | ✅ |
| 10 | Fix enum validation (`z.enum()`) | ✅ |
| 11 | Add string length limits to validators | ✅ |
| 12 | Add pagination to Expenses/Announcements | ⬜ |
| 13 | Refactor `buildContaGerencia()` to use `buildDebtorSummary()` | ⬜ |
| 14 | Add soft-delete composite indexes | ✅ |
| 15 | Prisma middleware for soft-delete auto-filtering | ✅ |

### Medium-Term (Next Month)

| # | Item | Status |
|---|------|--------|
| 16 | Add Budget vs. Actual variance to Orcamento page | ⬜ |
| 17 | Hash password reset tokens | ✅ |
| 18 | Add email verification on registration | ✅ |
| 19 | Lazy-load modal form components (`next/dynamic`) | ⬜ |
| 20 | Reduce Meetings nested includes | ⬜ |
| 21 | Add payment reversal audit log | ✅ |
| 22 | Extract `useFormAction()` hook | ⬜ |
| 23 | Announcement/Maintenance attachment upload UI | ⬜ |
| 24 | Member role management UI | ⬜ |
| 25 | Validate attendance users belong to condo | ✅ |

### Long-Term (Post-Launch)

| # | Item | Status |
|---|------|--------|
| 26 | Audit trail table for all sensitive operations | ⬜ |
| 27 | Redis-based rate limiting | ⬜ |
| 28 | Rate limit PDF endpoints | ⬜ |
| 29 | Timing-safe cron secret comparison | ⬜ |
| 30 | URL validation on file fields | ✅ |
| 31 | Enforce permilagem sum = 1000 on unit update | ⬜ |
| 32 | WCAG accessibility audit | ⬜ |
| 33 | E2E tests with Playwright | ⬜ |
| 34 | English translations | ⬜ |

---

## Summary

| Category | Total | Done | Remaining |
|----------|-------|------|-----------|
| Immediate (P0) | 6 | 6 | 0 |
| Short-Term | 9 | 7 | 2 |
| Medium-Term | 10 | 4 | 6 |
| Long-Term | 9 | 1 | 8 |
| **Total** | **34** | **18** | **16** |
