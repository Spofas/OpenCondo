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
| A2 | RecurringExpense has no soft-delete | Medium | ⬜ | Likely intentional (template, not ledger entry) — document decision |
| A3 | Repeated hardcoded button strings | Medium | ⬜ | "Guardar", "Cancelar", "Eliminar" in 17+ files — extract to i18n |
| A4 | Common error message strings duplicated | Medium | ⬜ | "Não encontrado", "Sem permissão" — could centralize |
| A5 | Possibly unused `reserve-fund.ts` | Low | ⬜ | Verify and remove if confirmed dead |

---

## 3. Performance

| # | Issue | Severity | Status | Notes |
|---|-------|----------|--------|-------|
| P1 | CSV import N+1 queries | High | ✅ | Batch-fetch existing units + owner emails upfront (200+ queries → 2) |
| P2 | Meetings nested includes too broad | Medium | ✅ | Lazy-load attendees/votes/ata via `getMeetingDetail` server action on expand |
| P3 | Announcements fetches full body in list | Medium | ⬜ | Should omit body or use excerpt in list query |
| P4 | Quota page fetches ALL unpaid quotas for debtors | Medium | ⬜ | No limit — large condos could have thousands |
| P5 | Calendar fetches full year of quotas | Medium | ⬜ | Should use aggregate query instead |
| P6 | Atas page has no pagination | Medium | ⬜ | Fetches ALL atas with full content field |
| P7 | Contacts page no pagination | Medium | ⬜ | No `take` limit |
| P8 | Maintenance page no pagination | Medium | ⬜ | No `take` limit |
| P9 | Missing `select` on cron recurring expense query | Medium | ⬜ | Fetches entire object when only 7 fields needed |
| P10 | No rate limiting on PDF endpoints | Low | ⬜ | Rate limit infra exists, not applied to PDF routes |
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
| X5 | Expired tokens never cleaned up | Medium | ⬜ | Add periodic cleanup to cron job |
| X6 | No rate limiting on PDF endpoints | Medium | ⬜ | PDF generation is CPU-intensive |
| X7 | No year range validation in conta-gerencia API | Low | ⬜ | Should validate 2000–2100 |
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
| U5 | Delete confirmation text inconsistent | Low | ⬜ | "Sim/Não" vs "Sim, eliminar/Não" |
| U6 | No loading skeletons | Low | ⬜ | Pages with async data don't show skeleton placeholders |

---

## Summary

| Category | Total | Done | Remaining |
|----------|-------|------|-----------|
| Spec Gaps | 2 | 0 | 2 |
| Architecture | 5 | 1 | 4 |
| Performance | 13 | 2 | 11 |
| Security | 9 | 4 | 5 |
| UX/Consistency | 6 | 1 | 5 |
| **Total** | **35** | **8** | **27** |
