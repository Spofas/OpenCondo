# OpenCondo — Product Status

**Last updated:** 2026-03-18

---

## Phase 1 — Foundation

| Feature | Status | Notes |
|---------|--------|-------|
| Project scaffolding (Next.js 16, Prisma 7, Tailwind 4) | Done | pnpm, Turbopack, TypeScript 5.9 |
| Database schema | Done | Full schema: auth, condos, units, finances, communication, meetings, contracts |
| Authentication (register, login) | Done | NextAuth v5 with Credentials provider, JWT sessions, bcrypt hashing |
| Condominium creation & unit setup | Done | 2-step onboarding wizard (condo details → add units with permilagem) |
| User invitation flow | Done | Admin generates invite tokens, users join via `/entrar` with token |
| App shell (sidebar, responsive layout) | Done | Sidebar with condo switcher, role-based navigation, mobile menu |
| i18n setup (Portuguese) | Done | next-intl with 240+ translation keys in `pt.json` |
| Multi-condo support | Done | Cookie-based condo switching, memberships per user |
| Settings page (members, invites) | Done | View members, create/manage invites (admin only) |
| Tests | Done | Vitest setup with tests for validators and server actions |

## Phase 2 — Finances

| Feature | Status | Notes |
|---------|--------|-------|
| Budget creation & management | Done | Create/edit/delete budgets with line items, reserve fund %, live totals |
| Budget approval workflow | Done | DRAFT → APPROVED status, approved budgets are immutable |
| Budget categories | Done | 13 Portuguese condo categories (Limpeza, Elevador, Seguro, etc.) |
| Reserve fund tracking | Partial | Reserve fund % is stored and displayed; separate balance tracking not yet |
| Quota generation from budget | Not started | Next: auto-calculate quotas per unit from approved budget |
| Manual payment recording | Not started | |
| Expense tracking | Not started | Page exists as empty state |
| Overdue quota tracking | Not started | |
| Basic financial dashboard | Partial | Dashboard shows hardcoded €0 stats; needs real data integration |

## Phase 3 — Communication

| Feature | Status | Notes |
|---------|--------|-------|
| Announcements | Not started | Page exists as empty state |
| Maintenance requests | Not started | Page exists as empty state |
| Document archive | Not started | Page exists as empty state |
| Email notifications | Not started | `src/lib/email/` directory exists but empty |

## Phase 4 — Meetings & Contracts

| Feature | Status | Notes |
|---------|--------|-------|
| Meeting scheduling | Not started | Page exists as empty state |
| Atas (minutes) | Not started | Page exists as empty state |
| Voting | Not started | Schema ready |
| Contract management | Not started | Page exists as empty state |

## Phase 5 — Polish & Launch

| Feature | Status | Notes |
|---------|--------|-------|
| Conta de gerência | Not started | |
| Bulk import (CSV) | Not started | |
| Receipt PDF generation | Not started | `src/lib/pdf/` directory exists but empty |
| Landing page | Done | Basic landing page at `/` |
| Deployment | Not started | |

---

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | Next.js 16 (App Router) | Latest version; Turbopack for fast dev |
| Auth | NextAuth v5 (beta) | JWT sessions, Credentials provider |
| ORM | Prisma 7 with `@prisma/adapter-pg` | Direct PostgreSQL adapter |
| CSS | Tailwind CSS v4 | Utility-first, no component library (inline styles) |
| Forms | React Hook Form + Zod | Client & server validation |
| Package manager | pnpm | Fast, disk-efficient |
| Testing | Vitest | Fast, Vite-native test runner |
| UI components | Custom (no shadcn/ui) | Tailwind-only components for simplicity |
| DB hosting | PostgreSQL (env-configured) | Standard connection string via `DATABASE_URL` |

## Tech Stack Versions

- Next.js 16.1.7
- React 19
- TypeScript 5.9.3
- Prisma 7.5.0
- NextAuth 5.0.0-beta.30
- Tailwind CSS 4.2.1
- Zod 4.3.6
- Vitest 4.1.0
- pnpm 10.29.3

---

## Next Steps (Priority Order)

1. **Quota generation** — auto-calculate monthly quotas per unit from an approved budget
2. **Manual payment recording** — mark quotas as paid with date/method
3. **Expense tracking** — CRUD for expenses linked to budget items
4. **Dashboard integration** — wire up real financial data to the dashboard stats
