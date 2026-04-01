# Audit Report 4 — Fix Tracker

**Source:** `AUDIT_REPORT_4.md`
**Last updated:** 2026-04-01

Legend: ✅ Done | ⬜ Not started | 🔧 In progress

---

## 1. Spec Gaps

| # | Issue | Severity | Status | Notes |
|---|-------|----------|--------|-------|
| S1 | Announcement attachments UI | Medium | ⬜ | Schema exists (`AnnouncementAttachment`), no form/action implementation |
| S2 | Maintenance photos UI | Medium | ⬜ | Schema exists (`MaintenancePhoto`), no form/action implementation |

---

## 2. Architecture

| # | Issue | Severity | Status | Notes |
|---|-------|----------|--------|-------|
| A1 | Missing admin check on Conta de Gerência page | High | ✅ | Added `if (role !== "ADMIN") redirect(...)` |
| A2 | RecurringExpense has no soft-delete | Medium | ✅ | Intentional — documented in schema (templates, not ledger entries) |
| A3 | Repeated hardcoded button strings | Medium | ✅ | Created `src/lib/ui-strings.ts`, replaced in 20+ files |
| A4 | Common error message strings duplicated | Medium | ✅ | `ERRORS` constant used in API routes and admin-context |
| A5 | Possibly unused `reserve-fund.ts` | Low | ⬜ | Used in tests only — keep as tested utility |

---

## 3. Performance

| # | Issue | Severity | Status | Notes |
|---|-------|----------|--------|-------|
| P1 | CSV import N+1 queries | High | ✅ | Batch-fetch existing units + owner emails upfront (200+ queries → 2) |
| P2 | Meetings nested includes too broad | Medium | ✅ | Lazy-load attendees/votes/ata via `getMeetingDetail` server action on expand |
| P3 | Announcements fetches full body in list | Medium | ✅ | Body truncated to 200-char excerpt in list serialization |
| P4 | Quota page fetches ALL unpaid quotas for debtors | Medium | ✅ | Capped at `take: 500` |
| P5 | Calendar fetches full year of quotas | Medium | ✅ | Already uses `select: { dueDate, status }` — no change needed |
| P6 | Atas page has no pagination | Medium | ✅ | Server-side pagination (20/page) with client navigation |
| P7 | Contacts page no pagination | Medium | ✅ | Server-side pagination (50/page) with client navigation |
| P8 | Maintenance page no pagination | Medium | ✅ | Server-side pagination (20/page) with client navigation |
| P9 | Missing `select` on cron recurring expense query | Medium | ✅ | Added `select` for 7 needed fields |
| P10 | No rate limiting on PDF endpoints | Low | ⬜ | Covered by X6 (moved to Security) |
| P11 | Livro de caixa double-fetch for pagination | Low | ⬜ | Could use cursor-based pagination |
| P12 | Missing announcement category index | Low | ⬜ | No `[condominiumId, category]` index |
| P13 | No `useMemo` in expensive list computations | Low | ⬜ | Low real-world impact |

---

## 4. Security

| # | Issue | Severity | Status | Notes |
|---|-------|----------|--------|-------|
| X1 | Missing `isActive` check in `requireMembership()` | High | ✅ | Rejects inactive members |
| X2 | File upload path traversal risk | High | ✅ | Filename sanitized before blob path interpolation |
| X3 | CRON_SECRET not validated for presence | Medium | ✅ | Returns 500 if env var is unset |
| X4 | No URL format validation on file URL fields | Medium | ✅ | Added `z.string().url()` to invoiceUrl, fileUrl, documentUrl |
| X5 | Expired tokens never cleaned up | Medium | ✅ | Cron job step 5 clears expired verification + reset tokens |
| X6 | No rate limiting on PDF endpoints | Medium | ✅ | 10 req/min per user on all 4 PDF routes |
| X7 | No year range validation in conta-gerencia API | Low | ✅ | Validates 2000–2100 |
| X8 | NextAuth beta version | Low | ⬜ | Upgrade to stable v5 before production |
| X9 | X-Forwarded-For spoofable for rate limiting | Low | ⬜ | Acceptable behind Vercel proxy |

---

## 5. UX / Consistency

| # | Issue | Severity | Status | Notes |
|---|-------|----------|--------|-------|
| U1 | Modals lack Escape key and focus management | High | ✅ | ModalForm now has Escape, focus return, ARIA, click-outside-to-close |
| U2 | Missing `htmlFor` on form labels | Medium | ⬜ | Screen readers can't associate labels with inputs |
| U3 | Modal pattern inconsistency | Low | ⬜ | Some forms use inline modals instead of ModalForm |
| U4 | Missing required field indicators | Low | ⬜ | No `*` on required fields |
| U5 | Delete confirmation text inconsistent | Low | ⬜ | Mostly resolved by A3 (shared UI constants) |
| U6 | No loading skeletons | Low | ⬜ | Pages with async data don't show skeleton placeholders |

---

## Summary

| Category | Total | Done | Remaining |
|----------|-------|------|-----------|
| Spec Gaps | 2 | 0 | 2 |
| Architecture | 5 | 4 | 1 |
| Performance | 13 | 9 | 4 |
| Security | 9 | 7 | 2 |
| UX/Consistency | 6 | 1 | 5 |
| **Total** | **35** | **21** | **14** |
