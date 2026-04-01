# Audit Comparison: v1 vs v2

**Date:** 2026-04-01
**Purpose:** Compare findings between the initial audit (AUDIT_REPORT.md) and the deep second-pass audit (AUDIT_REPORT_2.md).

---

## Score Comparison

| Audit Area | v1 Score | v2 Score | Change | Why |
|------------|----------|----------|--------|-----|
| **Spec** | 85-90% | 90-95% | +5% | v2 verified more features as complete (ata approval, notification prefs, file upload, calendar). v1 missed some "done" features. |
| **Architecture** | 8.2/10 | 7.5/10 | -0.7 | v2 found more issues: inconsistent transaction handling, fire-and-forget emails, next-auth beta risk. v1 was generous. |
| **Performance** | 6.5/10 | 6.5/10 | Same | Both identified the same core issues. v2 added meetings N+1, missing soft-delete indexes, and estimated impact numbers. |
| **Security** | 6.5/10 | 5.5/10 | -1.0 | v2 found CRITICAL issues v1 missed: financial data exposure to non-admins, plaintext reset tokens, attendance cross-condo bypass. |
| **Finanças UX** | HIGH | HIGH | Same | Both agree on overlap severity. v2 added granular data matrix and 3rd debtor calculation path. |

---

## New Findings in v2 (Not in v1)

### Security — 6 new issues

| # | Finding | Severity | Why v1 Missed It |
|---|---------|----------|-----------------|
| 1 | **Expenses + Livro de Caixa exposed to ALL members** | CRITICAL | v1 only checked mutation auth (`withAdmin`), not page-level data visibility |
| 2 | **Password reset token stored in plaintext** (not hashed) | HIGH | v1 noted `devToken` leak but didn't check storage security |
| 3 | **No email verification on registration** | MEDIUM-HIGH | v1 didn't trace the invite acceptance attack vector |
| 4 | **Attendance accepts cross-condo users** | MEDIUM | v1 didn't read meeting actions in detail |
| 5 | **No audit trail for payment reversals** | HIGH | v1 didn't analyze the `undoPayment` business logic |
| 6 | **Permilagem sum not enforced on unit update** | MEDIUM | v1 only checked onboarding validation, not subsequent edits |

### Performance — 3 new issues

| # | Finding | Impact | Why v1 Missed It |
|---|---------|--------|-----------------|
| 1 | **Meetings page: 31+ queries for 10 meetings** (massive nested includes) | HIGH | v1 didn't count per-page query depth |
| 2 | **Missing soft-delete composite indexes** (3 indexes needed) | MEDIUM | v1 noted missing indexes generally, v2 identified specific combinations |
| 3 | **Livro de Caixa double-fetch for pagination** | MEDIUM | v1 didn't trace the running balance calculation path |

### Architecture — 3 new issues

| # | Finding | Why v1 Missed It |
|---|---------|-----------------|
| 1 | **`next-auth` is beta** (5.0.0-beta.30) — production risk | v1 didn't check dependency versions |
| 2 | **Some actions lack `db.$transaction()`** (budget, announcement) | v1 said "100% adoption" without verifying each file |
| 3 | **Fire-and-forget email in 3 actions** (`.catch(() => {})`) | v1 noted email queue exists but didn't check if it's used everywhere |

### Finanças UX — 2 new details

| # | Finding | Why v1 Missed It |
|---|---------|-----------------|
| 1 | **3rd debtor calculation** — `buildContaGerencia()` reimplements debtor logic inline (doesn't use `buildDebtorSummary()`) | v1 said "2 different implementations", v2 found it's actually 2 functions + 1 inline |
| 2 | **Overdue marking runs 2x per session** if user visits Quotas then Devedores | v1 noted the duplication but didn't trace the session-level impact |

---

## Findings That Remained Consistent

Both audits agreed on these core issues:

### Security
- `devToken` leak in password reset response
- Hard deletes on Announcement/Document/Supplier/Contract
- Cron secret timing-unsafe comparison
- `z.string()` instead of `z.enum()` on categories
- Missing max length on text fields

### Performance
- `updateMany()` on every page load (overdue marking)
- Over-broad `revalidatePath("/c/")`
- No pagination on Expenses page
- No `dynamic()` imports for modals

### Architecture
- Need Prisma middleware for soft-delete
- Form error handling duplication (~10 forms)
- Missing serializers for some models
- Missing database indexes

### Finanças UX
- Debtor info shown 3 times (Quotas tab, Devedores page, Conta de Gerencia)
- Dead Despesas-Recorrentes nav item
- Budget page missing variance analysis
- Overdue marking duplicated across pages

---

## Severity Re-assessments

| Issue | v1 Severity | v2 Severity | Reason for Change |
|-------|-------------|-------------|-------------------|
| Hard deletes | P0 | P0 | Unchanged — both agree this is critical |
| `devToken` leak | P0 | P0 (HIGH) | Unchanged |
| Cache invalidation | P0 | P0 | Unchanged |
| DB writes on page load | P0 | P0 | Unchanged |
| **Broken Access Control (A1)** | **PASS** | **FAIL** | v1 only checked mutations; v2 checked data visibility on pages |
| **Authentication (A7)** | **PASS** | **WARN** | v2 found no email verification |
| **Data Integrity (A8)** | **FAIL** | **FAIL** | Both agree — hard deletes |
| **Logging (A9)** | **UNKNOWN** | **FAIL** | v2 specifically checked for audit logging (none found) |
| **SSRF (A10)** | **PASS** | **WARN** | v2 found unvalidated URLs in file fields |

---

## Recommendation Priority Changes

### Moved UP in priority (v2 found them more critical)

| Item | v1 Priority | v2 Priority | Reason |
|------|-------------|-------------|--------|
| Restrict financial pages to admin | Not identified | P0 | New finding — data exposure |
| Hash password reset tokens | Not identified | P1 | New finding — plaintext storage |
| Email verification on registration | Not identified | P1 | New finding — invite hijack vector |
| Payment reversal audit log | Not identified | P1 | New finding — fraud risk |
| Fix meetings nested includes | Not identified | P1 | New finding — 31+ queries |

### Remained same priority

| Item | Priority |
|------|----------|
| Remove `devToken` | P0 |
| Add soft-delete to all entities | P0 |
| Remove `updateMany()` from page loads | P0 |
| Path-specific `revalidatePath()` | P0 |
| Merge Devedores into Quotas | Critical |
| Add Budget vs. Actual to Orcamento | High |

### Moved DOWN (less critical than v1 suggested)

| Item | v1 Priority | v2 Priority | Reason |
|------|-------------|-------------|--------|
| `npm audit fix` (dev deps) | P0 | P2 | Dev-only, doesn't affect production |
| Timing-safe cron comparison | P1 | P2 | Practical exploitation unlikely behind Vercel |

---

## Coverage Gaps in v1

| Area | v1 Coverage | v2 Coverage |
|------|-------------|-------------|
| **Page-level data visibility** | Not checked | Every page.tsx verified |
| **Password reset token storage** | Only checked `devToken` leak | Checked plaintext storage + rate limiting |
| **Email verification** | Not assessed | Full attack vector traced |
| **Meeting query depth** | Not counted | 31+ queries identified |
| **Business logic security** (undo payment, permilagem) | Not assessed | Full attack scenarios documented |
| **Attendance cross-condo** | Not assessed | Attack vector identified |
| **Soft-delete on update paths** | Partially checked | Every update action verified |
| **Per-page query count** | General assessment | Exact count per page tabulated |
| **OWASP A1 (Access Control)** | Marked PASS | Correctly marked FAIL |

---

## Conclusion

**v2 is significantly more thorough than v1.** The key differences:

1. **Security score dropped from 6.5 to 5.5** — v1 missed the most critical finding (financial data exposed to non-admins). This alone warrants immediate action.

2. **Architecture score dropped from 8.2 to 7.5** — v1 was too generous. The beta auth dependency, fire-and-forget emails, and missing transaction wrapping are real concerns.

3. **Spec score rose from 85-90% to 90-95%** — v1 undercounted implemented features. Many "extras" (ata approval, notification prefs, file upload) are actually spec-aligned.

4. **v2 found 12 new issues** across security (6), performance (3), architecture (3), and UX (2) that v1 completely missed.

5. **The total remediation effort is ~60 hours** (up from ~45 in v1) due to the new security findings.

**Bottom line:** v1 was a useful first pass but gave a false sense of security on access control and data exposure. v2's findings should be used as the authoritative reference for prioritization.
