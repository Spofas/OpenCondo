# Audit Report 4 — Full Deep Dive

**Date:** 2026-04-01
**Scope:** Complete codebase audit across 5 categories
**Context:** Post-fix audit after completing 26/34 items from Audit Report 3

---

## Executive Summary

The codebase is in strong shape after the previous round of fixes. Architecture patterns are consistent, all P0/P1 security issues from Audit 3 are resolved, and the spec is ~95% implemented. This audit found **0 Critical**, **5 High**, **18 Medium**, and **12 Low** new issues.

| Category | Critical | High | Medium | Low |
|----------|----------|------|--------|-----|
| 1. Spec Gaps | 0 | 0 | 2 | 0 |
| 2. Architecture | 0 | 1 | 3 | 1 |
| 3. Performance | 0 | 1 | 8 | 4 |
| 4. Security | 0 | 2 | 4 | 3 |
| 5. UX/Consistency | 0 | 1 | 1 | 4 |
| **Total** | **0** | **5** | **18** | **12** |

---

## 1. Spec Gaps

The product spec is ~95% implemented. Only two meaningful gaps remain.

### MEDIUM

| # | Issue | Notes |
|---|-------|-------|
| S1 | Announcement attachments — schema exists, no UI/actions | `AnnouncementAttachment` model defined in Prisma but zero implementation in form or actions |
| S2 | Maintenance photos — schema exists, no UI/actions | `MaintenancePhoto` model defined but no upload field in form or handling in actions |

### Already Done (verified)

- ✅ Email verification flow — complete end-to-end
- ✅ Invitation flow — invite → register → claim unit works
- ✅ CSV bulk import — UI exists in unit-manager.tsx (spec was outdated saying "not built")
- ✅ All financial modules — quotas, expenses, budget, livro de caixa, conta de gerência
- ✅ Calendar — unified view with meetings, quota due dates, contract renewals
- ✅ Meetings — scheduling, agenda, attendance, quorum, voting, ata, PDF export
- ✅ Contracts — full CRUD with renewal tracking
- ✅ PDF generation — receipts, atas, budgets, conta de gerência all working
- ✅ Dashboard stat cards — admin and owner views differentiated

---

## 2. Architecture

Architecture is solid. HOF pattern, authorization, Decimal serialization, soft-delete extension, validators — all consistent.

### HIGH

| # | Issue | File | Notes |
|---|-------|------|-------|
| A1 | Missing admin check on Conta de Gerência page | `financas/conta-gerencia/page.tsx` | Page renders for any member. API route IS protected, so PDF download is gated, but the page itself shows data to non-admins. Add `if (membership.role !== "ADMIN") redirect(...)` |

### MEDIUM

| # | Issue | File | Notes |
|---|-------|------|-------|
| A2 | RecurringExpense has no soft-delete | `prisma/schema.prisma` | Unlike all 7 other entity models, RecurringExpense uses hard delete. Likely intentional (template, not ledger entry) but should be documented |
| A3 | Repeated hardcoded button strings | 17+ files | "Guardar", "Cancelar", "Eliminar" repeated across all forms. Could extract to i18n keys |
| A4 | Common error message strings duplicated | Multiple actions | "Não encontrado", "Sem permissão" appear in many files. Could centralize |

### LOW

| # | Issue | File | Notes |
|---|-------|------|-------|
| A5 | Possibly unused `reserve-fund.ts` | `src/lib/reserve-fund.ts` | 1018 bytes, no imports found. Remove if confirmed dead |

---

## 3. Performance

Previous fixes (removed page-load writes, scoped revalidatePath, pagination, indexes, dynamic imports) are solid. New issues found:

### HIGH

| # | Issue | File | Notes |
|---|-------|------|-------|
| P1 | CSV import N+1 queries | `(dashboard)/actions.ts:74-135` | Each row triggers 2 separate queries (`findUnique` for unit + user). With 100 units = 200+ queries. Should batch-fetch all existing units and owners upfront |

### MEDIUM

| # | Issue | File | Notes |
|---|-------|------|-------|
| P2 | Meetings nested includes still too broad | `reunioes/page.tsx:37-47` | Even with `take: 20`, loads ALL attendees + ALL votes per meeting. Could be 500+ related records. Lazy-load attendees/votes on expand |
| P3 | Announcements fetches full body in list | `avisos/page.tsx:41-50` | Body field (potentially 50KB each) loaded for all announcements in list view. Should omit body or use excerpt |
| P4 | Quota page fetches ALL unpaid quotas for debtors | `quotas/page.tsx:110-127` | No limit on debtors query. Large condos could have thousands of unpaid quotas |
| P5 | Calendar fetches full year of quotas | `calendario/page.tsx:43-49` | Fetches all quota records just to group by date. Should use aggregate query |
| P6 | Atas page has no pagination | `atas/page.tsx:9-15` | Fetches ALL atas with full `content` field (could be 100KB+ each) |
| P7 | Contacts page no pagination | `contactos/page.tsx:11-17` | No `take` limit |
| P8 | Maintenance page no pagination | `manutencao/page.tsx:9-23` | No `take` limit |
| P9 | Missing `select` on cron recurring expense query | `api/cron/process/route.ts:45` | Fetches entire object when only 7 fields needed |

### LOW

| # | Issue | File | Notes |
|---|-------|------|-------|
| P10 | No rate limiting on PDF endpoints | `api/receipts/`, `api/atas/`, `api/budgets/` | Rate limit infra exists but not applied to PDF generation endpoints |
| P11 | Livro de caixa double-fetch for pagination | `livro-caixa/page.tsx:88-97` | Count + findMany could use cursor-based pagination |
| P12 | Missing announcement category index | `prisma/schema.prisma` | Has `[condominiumId, createdAt]` but no `[condominiumId, category]` for filtering |
| P13 | No `useMemo` in expensive list computations | Various list components | Low real-world impact |

---

## 4. Security

All P0/P1 issues from Audit 3 are confirmed fixed. New findings:

### HIGH

| # | Issue | File | Notes |
|---|-------|------|-------|
| X1 | Missing `isActive` check in `requireMembership()` | `lib/auth/require-membership.ts:20-29` | If admin deactivates a member, they can still access the condo until session expires. Add `if (!membership \|\| !membership.isActive) redirect("/iniciar")` |
| X2 | File upload path traversal risk | `api/upload/route.ts:69` | User-supplied `file.name` interpolated directly into blob path (`${condominiumId}/${file.name}`). A filename like `../../../.env` could be exploited. Sanitize filename |

### MEDIUM

| # | Issue | File | Notes |
|---|-------|------|-------|
| X3 | CRON_SECRET not validated for presence | `api/cron/process/route.ts:20` | If env var is unset, comparison becomes `"Bearer undefined"` — works but fragile. Add explicit presence check |
| X4 | No URL format validation on file URL fields | `validators/expense.ts`, `document.ts`, `contract.ts` | `invoiceUrl`, `fileUrl`, `documentUrl` accept any string up to 2048 chars. Should use `z.string().url()` |
| X5 | Expired tokens never cleaned up | User model | Old email verification and password reset tokens accumulate. Add periodic cleanup to cron job |
| X6 | No rate limiting on PDF endpoints | `api/receipts/`, `api/atas/`, `api/budgets/` | PDF generation is CPU-intensive; unthrottled endpoints enable DoS |

### LOW

| # | Issue | File | Notes |
|---|-------|------|-------|
| X7 | No year range validation in conta-gerencia API | `api/conta-gerencia/route.ts:17` | `parseInt()` accepts any integer; should validate 2000-2100 |
| X8 | NextAuth beta version | `package.json` | Using `next-auth@5.0.0-beta.30`. Upgrade to stable before production |
| X9 | X-Forwarded-For spoofable for rate limiting | `api/auth/register`, `recuperar-password` | Acceptable behind Vercel proxy, but should be documented |

### Confirmed Fixed (from Audit 3)

- ✅ Password reset tokens hashed (SHA-256)
- ✅ Email verification enforced before dashboard
- ✅ devToken not in response
- ✅ Admin gate on expenses page
- ✅ Attendance membership validation
- ✅ Enum validation via `z.enum()`
- ✅ String length limits on all inputs
- ✅ Payment audit trail (recordedBy/recordedAt)

---

## 5. UX / Consistency

UI patterns are largely consistent. Main issues are accessibility and a few inconsistencies.

### HIGH

| # | Issue | Files | Notes |
|---|-------|-------|-------|
| U1 | Modals lack Escape key handler and focus management | `components/ui/modal-form.tsx`, all inline modals | No `onKeyDown` for Escape, no focus trap, focus not returned to trigger on close. Violates WCAG 2.1 AA |

### MEDIUM

| # | Issue | Files | Notes |
|---|-------|-------|-------|
| U2 | Missing `htmlFor` on form labels | `contactos/contact-form.tsx`, `livro-caixa-page-client.tsx` | Screen readers can't associate labels with inputs |

### LOW

| # | Issue | Notes |
|---|-------|-------|
| U3 | Modal pattern inconsistency | `ModalForm` component exists but some forms (contacts, livro-caixa) use inline modals with different styling |
| U4 | Missing required field indicators | Most forms don't mark required fields with `*` |
| U5 | Delete confirmation text inconsistent | Some say "Sim/Não", others "Sim, eliminar/Não" |
| U6 | No loading skeletons | Pages with async data don't show skeleton placeholders |

### Consistent (verified)

- ✅ Card pattern: `rounded-xl border border-border bg-card` — 107 instances, all consistent
- ✅ Button styling: consistent padding, radius, hover states
- ✅ Status badges: consistent colors across modules
- ✅ Currency formatting: `toLocaleString("pt-PT", { minimumFractionDigits: 2 })` everywhere
- ✅ Date formatting: `toLocaleDateString("pt-PT")` everywhere
- ✅ Empty states: all list pages have proper empty state with icon + message
- ✅ Two-step delete confirmation: implemented across all delete flows
- ✅ Mobile responsive: all tables have mobile card alternatives
- ✅ Loading states on submit buttons: "A guardar...", "A gerar..." etc.

---

## Prioritized Action Plan

### Priority 1 — Security hardening (do before production)

| # | Item | Effort | Impact |
|---|------|--------|--------|
| X1 | Add `isActive` check to `requireMembership()` | 5 min | Prevents deactivated members from accessing condo |
| X2 | Sanitize file upload filename | 15 min | Prevents path traversal |
| X3 | Validate CRON_SECRET presence | 5 min | Prevents silent misconfiguration |
| A1 | Add admin check to conta-gerencia page | 5 min | Prevents non-admin data viewing |

### Priority 2 — Performance fixes

| # | Item | Effort | Impact |
|---|------|--------|--------|
| P1 | Batch CSV import queries | 1h | Fixes N+1 on import (200+ queries → 3) |
| P2 | Lazy-load meeting attendees/votes | 1.5h | Reduces 500+ related records on page load |
| P3 | Omit announcement body from list query | 30 min | Saves potentially MBs of data transfer |
| P6 | Add pagination to atas page | 1h | Prevents loading all atas with full content |

### Priority 3 — Remaining security + UX

| # | Item | Effort | Impact |
|---|------|--------|--------|
| X4 | Add `.url()` validation to file URL fields | 15 min | Input validation hardening |
| U1 | Add Escape key + focus management to modals | 1h | WCAG 2.1 AA compliance |
| U2 | Add `htmlFor` to form labels | 30 min | Screen reader accessibility |
| P7-P8 | Add pagination to contacts + maintenance | 1h | Scale safety |

### Priority 4 — Polish

| # | Item | Effort | Impact |
|---|------|--------|--------|
| S1-S2 | Implement attachment/photo upload UI | 3h | Complete spec coverage |
| X5 | Add expired token cleanup to cron | 30 min | Database hygiene |
| A3-A4 | Centralize repeated strings to i18n | 1h | Maintenance improvement |
| P4-P5 | Optimize quota debtors + calendar queries | 1.5h | Scale safety |

---

## Summary vs Audit 3

| Metric | Audit 3 | Audit 4 |
|--------|---------|---------|
| Critical issues | 2 | **0** |
| High issues | 11 | **5** |
| Medium issues | 10 | **18** |
| Low issues | 11 | **12** |
| Security score | ~5/10 | **8/10** |
| Spec coverage | ~90% | **~95%** |
| Architecture compliance | ~70% | **~95%** |

The codebase has improved significantly. Remaining issues are predominantly performance optimization for scale, accessibility improvements, and minor security hardening — no architectural or design flaws.
