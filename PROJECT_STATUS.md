# OpenCondo — Project Status & Architecture Guide

**Last updated:** 2026-03-25
**For:** Anyone following along, regardless of programming experience

---

## What is OpenCondo?

OpenCondo is a **web application for managing condominiums in Portugal**. Think of it as a digital replacement for the spreadsheets, WhatsApp groups, and paper documents that building administrators typically juggle. It handles finances (who owes what), communication (announcements, maintenance requests), meetings (assembleias), and contracts — all in Portuguese, all in one place.

---

## How the app is built (the tech stack)

Imagine building a house. You need a foundation, walls, plumbing, electricity, etc. Software is similar — each layer has a specific job:

| Layer | What we use | What it does (in plain terms) |
|-------|-------------|-------------------------------|
| **Framework** | Next.js 16 | The "skeleton" of the app. It handles showing pages to users, processing form submissions, and connecting everything together. Think of it as the building's structure. |
| **Language** | TypeScript | The language we write code in. It's like JavaScript (what browsers understand) but with extra safety — it catches mistakes before users ever see them. |
| **Database** | PostgreSQL + Prisma 7 | Where all the data lives (users, condominiums, payments, etc.). PostgreSQL is the database itself (like a giant organized filing cabinet). Prisma is the "translator" that lets our code talk to the database in a safe, structured way. |
| **Authentication** | NextAuth.js v5 | Handles logins, sessions ("remembering" who you are), and protecting private pages. |
| **Styling** | Tailwind CSS 4 | Controls how everything looks — colors, spacing, fonts. Instead of writing separate style files, we apply styles directly to elements (like `bg-blue-500` for a blue background). |
| **Forms** | React Hook Form + Zod | React Hook Form makes forms fast and responsive. Zod is a "validator" — it checks that data makes sense (e.g., an email looks like an email, a password is long enough) before we accept it. |
| **Translations** | next-intl | Makes the app multilingual. Right now it's Portuguese-only, but the system is ready for English or other languages later. All text lives in a single translation file, not scattered across pages. |
| **Package manager** | pnpm | Installs and manages all the external code (libraries) we depend on. Like an app store for code libraries. |

---

## What's been built so far

### Phase 0: Foundation (complete)

**What:** Project scaffolding — setting up the basic structure so everything else can be built on top.

- Created the Next.js project with TypeScript
- Set up the database schema (all 30+ tables) using Prisma
- Configured Tailwind CSS with a custom color theme (blues, slates, clean and professional)
- Set up Portuguese translations for every piece of text in the app
- Created the navigation sidebar with all planned sections
- Built placeholder pages for all 15 routes

**Why these choices:**
- Next.js was chosen because it does both the "front end" (what users see) and the "back end" (server logic, database queries) in one project, which is simpler than having two separate projects.
- PostgreSQL was chosen because financial data (money amounts, payment records) needs a rock-solid database that handles precise decimal numbers and complex relationships well.
- Tailwind CSS was chosen over component libraries because it gives us full control over the design without being locked into someone else's look-and-feel.

### Phase 1: Authentication & Onboarding (complete)

**What:** Users can create accounts, log in, and set up their condominium.

#### Authentication (login system)

The login system has several interconnected pieces:

1. **Registration** (`/registar`): A form where new users enter their name, email, and password. When they submit:
   - The password gets **hashed** (scrambled irreversibly using bcryptjs) before being saved. This means even if someone stole the database, they couldn't read the passwords.
   - We check if the email already exists to prevent duplicate accounts.
   - After creating the account, the user is automatically logged in.

2. **Login** (`/login`): A form where existing users enter email + password. The system:
   - Finds the user by email
   - Compares the submitted password against the stored hash (bcryptjs can check a password against a hash without ever "unhashing" it — it's a one-way process)
   - Creates a **session** (a secure token stored in the browser that says "this person is logged in")

3. **Route protection** (middleware): A "gatekeeper" that runs before any page loads. If you try to access `/painel` (the dashboard) without being logged in, you're automatically redirected to `/login`. This protects 7 route groups: dashboard, finances, communication, meetings, contracts, settings, and onboarding.

4. **Session management**: We use JWT (JSON Web Tokens) — small encrypted tokens stored in cookies. The server can read them to know who you are without hitting the database on every page load. This is faster than looking up sessions in the database each time.

**Architecture decision — split auth config:**
NextAuth runs in two places: the "edge" (a lightweight environment for the middleware/gatekeeper) and the server (for actual login logic). The edge can't use the database or password-hashing libraries. So we split the config:
- `config.ts`: Lightweight rules (which pages need login) — runs on the edge
- `index.ts`: Full login logic with database + bcrypt — runs on the server

#### Condominium Onboarding (`/onboarding`)

After registering, new users land on a **two-step wizard** to set up their building:

**Step 1 — Building details:**
- Name (e.g., "Edifício Sol Nascente")
- Address, postal code, city
- NIF (the building's tax number — Portuguese condominiums have their own tax ID)
- Quota model: **permilagem** (each unit pays proportionally to its size) or **equal split** (everyone pays the same)

**Step 2 — Units (frações):**
- Add each apartment/unit in the building
- For each: identifier (e.g., "1.º Esq" = 1st floor left), floor, typology (T1, T2, T3...)
- If using permilagem: assign each unit's share (all must add up to exactly 1000‰)
- A live counter shows the running total so you know when you've hit 1000

**What happens when you submit:**
Everything is created in a **database transaction** — meaning either ALL of it succeeds (condominium + all units + your admin membership) or NONE of it does. This prevents a situation where the building exists but the units don't, or vice versa.

After onboarding, you're redirected to the dashboard. If you already have a condominium, visiting `/onboarding` redirects you to the dashboard instead.

#### Dashboard protection

The dashboard layout (the sidebar + main content area) now:
- Checks if you're logged in (redirects to `/login` if not)
- Checks if you have a condominium (redirects to `/onboarding` if not)
- Shows your name and building name in the sidebar
- Has a logout button

---

## Database design (what data we store)

The database has 30+ tables organized into groups. Here's how they relate, in plain terms:

```
Users
  └── belong to Condominiums (via Memberships, with a role: Admin/Owner/Tenant)

Condominiums
  ├── have Units (frações) — each apartment in the building
  │     ├── may have an Owner (a User)
  │     └── may have a Tenant (a User)
  │
  ├── have Budgets — annual spending plans
  │     └── with Budget Items (per category: cleaning, elevator, etc.)
  │
  ├── have Quotas — monthly/quarterly bills per unit
  │
  ├── have Expenses — recorded spending with receipts
  │
  ├── have Announcements — notices from admin to residents
  │
  ├── have Maintenance Requests — "the elevator is broken" type reports
  │
  ├── have Documents — uploaded files (contracts, insurance, minutes)
  │
  ├── have Meetings (Assembleias)
  │     ├── with Agenda Items
  │     ├── with Attendees (who showed up, their voting weight)
  │     ├── with Votes (per agenda item)
  │     └── with an Ata (minutes document)
  │
  ├── have Contracts — ongoing agreements (cleaning company, insurance, etc.)
  │
  └── have Suppliers — companies that provide services
```

**Key concept — Permilagem:**
In Portuguese law, each unit in a building has a "permilagem" (per mille share) — a number that represents what fraction of the building it is. All units together must add up to 1000‰. A bigger apartment might have 150‰, a small studio 50‰. This number determines how much each unit pays in condominium fees and how much their vote counts in meetings.

---

## File organization

```
src/
├── app/                          # Pages and API routes
│   ├── (auth)/                   # Auth-related pages (no sidebar)
│   │   ├── login/                # Login form
│   │   ├── registar/             # Registration form
│   │   └── onboarding/           # Condominium setup wizard
│   │       ├── page.tsx          # The wizard UI (client-side)
│   │       ├── actions.ts        # Server logic (database writes)
│   │       └── layout.tsx        # Guards (redirect if already set up)
│   ├── (dashboard)/              # All authenticated pages (with sidebar)
│   │   ├── layout.tsx            # Checks login + condominium, shows sidebar
│   │   ├── actions.ts            # Shared actions (condo switching, invites)
│   │   ├── painel/               # Dashboard overview
│   │   ├── financas/
│   │   │   ├── orcamento/        # Budget management (COMPLETE)
│   │   │   │   ├── page.tsx      # Server component — fetches budgets from DB
│   │   │   │   ├── actions.ts    # Server actions (create, update, approve, delete)
│   │   │   │   ├── budget-form.tsx        # Modal form with dynamic line items
│   │   │   │   ├── budget-list.tsx        # Expandable budget cards
│   │   │   │   └── budget-page-client.tsx # Client wrapper (manages modal state)
│   │   │   ├── quotas/           # Quota management (placeholder)
│   │   │   └── despesas/         # Expense tracking (placeholder)
│   │   ├── comunicacao/          # Announcements, maintenance, documents
│   │   ├── assembleia/           # Meetings, minutes
│   │   ├── contratos/            # Contract management
│   │   └── definicoes/           # Settings
│   └── api/auth/                 # API endpoints
│       ├── register/             # POST: create new account
│       └── [...nextauth]/        # NextAuth magic route (handles login/logout)
├── components/                   # Reusable UI pieces
│   ├── layout/sidebar.tsx        # Navigation sidebar
│   └── providers/session-provider.tsx  # Makes login state available everywhere
├── lib/                          # Shared logic
│   ├── auth/config.ts            # Auth rules (lightweight, for middleware)
│   ├── auth/index.ts             # Auth logic (full, with database)
│   ├── db/index.ts               # Database connection
│   ├── validators/auth.ts        # Email/password validation rules
│   ├── validators/condominium.ts # Building/unit validation rules
│   └── validators/budget.ts      # Budget validation + category list
├── i18n/messages/pt.json         # All Portuguese text strings
└── middleware.ts                  # Route gatekeeper
```

**Why `(auth)` and `(dashboard)` in parentheses?**
Next.js uses parentheses for "route groups" — they organize files without affecting the URL. Both `/login` and `/painel` are at the root level in the URL, but their code is in separate folders with different layouts (login has no sidebar; dashboard has the sidebar).

### Phase 2: Financial Management (in progress)

#### Budget Management (complete)

**What:** Administrators can create, edit, approve, and delete annual budgets for their condominium.

A budget is the annual spending plan for the building — "we expect to spend €X on cleaning, €Y on the elevator, €Z on insurance..." This is the foundation for everything else in finances, because quotas (what each owner pays monthly) are calculated from the budget.

**How it works:**

1. **Creating a budget**: The admin clicks "Novo orçamento" and fills in a form with:
   - **Year** (e.g., 2026)
   - **Reserve fund percentage** — Portuguese law requires at least 10% of the budget goes into a savings reserve (fundo de reserva). We default to 10% but allow adjustment.
   - **Line items (rubricas)** — each is a spending category with an amount. For example: "Limpeza: €1.200", "Elevador: €800", "Seguro: €600". We provide 13 common Portuguese condo categories to choose from (cleaning, elevator, electricity, water, insurance, maintenance, gardening, security, administration, reserve fund, construction, legal, other).

2. **Live calculation**: As you add items, the form shows a running total: subtotal of all line items + reserve fund amount + grand total. This updates instantly as you type — no need to submit to see the numbers.

3. **Budget status workflow**: A new budget starts as **Rascunho** (Draft). The admin can edit or delete it freely. Once reviewed (typically at the annual assembleia/meeting), the admin clicks "Aprovar" to mark it as **Aprovado** (Approved). An approved budget is **locked** — it cannot be edited or deleted, because it's the official record of what was agreed.

4. **Year uniqueness**: Each condominium can only have one budget per year. Trying to create a second budget for 2026 when one already exists will show an error message.

5. **Role-based access**: Only administrators can create, edit, approve, or delete budgets. Owners and tenants can view them but can't change anything.

**Technical choices:**

- **Server Actions for mutations**: Creating/updating/deleting budgets uses Next.js Server Actions — functions that run on the server when the form is submitted. This keeps database logic out of the browser.
- **Helper function `getAdminContext()`**: Every budget action first checks: (a) is the user logged in? (b) which condominium are they viewing? (c) are they an admin of that condominium? If any check fails, the action returns an error. This is the "bouncer at the door" pattern — check permissions before doing anything.
- **Modal form**: The budget form opens as a modal (overlay on top of the page) rather than navigating to a separate page. This feels faster and keeps context — you can see the existing budgets behind the form.
- **Field array (useFieldArray)**: The line items section uses React Hook Form's `useFieldArray`, which lets you dynamically add and remove rows. Each row is independently validated.
- **Decimal handling**: Budget amounts come from the database as Prisma `Decimal` type (precise money values). We convert to JavaScript `number` when sending to the client, since the UI doesn't need accounting-level precision for display.
- **`revalidatePath`**: After creating/updating/deleting a budget, we tell Next.js to refresh the budget page's data. Without this, the page would show stale data until you manually refreshed.

**New files created:**
- `src/lib/validators/budget.ts` — Zod validation schema and category list
- `src/app/(dashboard)/financas/orcamento/actions.ts` — Server actions (create, update, approve, delete)
- `src/app/(dashboard)/financas/orcamento/budget-form.tsx` — Modal form with dynamic line items
- `src/app/(dashboard)/financas/orcamento/budget-list.tsx` — Expandable budget cards with actions
- `src/app/(dashboard)/financas/orcamento/budget-page-client.tsx` — Client wrapper managing modal state
- `src/app/(dashboard)/financas/orcamento/page.tsx` — Server component that fetches budget data

#### Quota Management (complete)

**What:** Administrators can set quota amounts, generate monthly quota records for all units, record payments, and track overdue quotas.

**Key design decision:** In real Portuguese condominiums, quotas are typically set **independently** from the budget. The admin decides the monthly amount (at the assembleia or unilaterally), not derived from the budget. Our implementation reflects this — quotas and budgets are independent modules.

**How it works:**

1. **Generating quotas**: The admin clicks "Gerar quotas" and configures:
   - **Period range** (e.g., January 2026 to December 2026) using month pickers
   - **Total monthly amount** (e.g., €500/month for the whole building)
   - **Split method**: by permilagem (proportional to unit size) or equal split
   - **Due day**: which day of the month quotas are due (1–28)

2. **Live preview**: Before generating, the form shows a table with each unit's calculated monthly amount. This updates instantly as you change the total or split method.

3. **Quota records**: Each generated quota is a record per unit per month: "Unit 1.º Esq owes €75 for January 2026, due January 8th." Quotas that already exist for a unit+period are skipped (no duplicates).

4. **Payment recording**: Admin clicks "Pagar" on any unpaid quota and enters: payment date, payment method (transferência, numerário, cheque, MB WAY, Multibanco, outro), and optional notes (e.g., "Ref. MB 123456789").

5. **Undo payment**: If a payment was recorded in error, admin can click "Anular" to set it back to pending/overdue.

6. **Overdue detection**: Every time the page loads, any PENDING quotas past their due date are automatically marked as OVERDUE. No manual action needed.

7. **Delete by period**: Admin can delete all unpaid quotas for a given month (e.g., if quotas were generated with wrong amounts). Paid quotas are preserved.

8. **Summary cards**: The page shows three cards at the top: total pending, total overdue, and total received — giving a quick financial snapshot.

**Role-based access**: Only administrators can generate quotas, record payments, undo payments, and delete quotas. All roles can view quotas.

**New files created:**
- `src/lib/validators/quota.ts` — Zod schemas for generation, payment, and config
- `src/app/(dashboard)/financas/quotas/actions.ts` — Server actions (generate, pay, undo, delete)
- `src/app/(dashboard)/financas/quotas/page.tsx` — Server component (fetch data, mark overdue)
- `src/app/(dashboard)/financas/quotas/quota-page-client.tsx` — Client wrapper managing form state
- `src/app/(dashboard)/financas/quotas/quota-generate-form.tsx` — Modal form for generating quotas
- `src/app/(dashboard)/financas/quotas/quota-list.tsx` — Grouped list view with period expansion
- `src/app/(dashboard)/financas/quotas/payment-modal.tsx` — Payment recording modal

---

## What's next — upcoming phases

#### Financial Dashboard (complete)

**What:** The dashboard (`/painel`) now shows real financial data instead of hardcoded zeros.

- **Stat cards**: Pending quotas amount, overdue quotas (count + amount), open maintenance requests, next assembleia
- **Recent payments**: Last 5 recorded quota payments with unit, period, amount, and date
- **Financial summary**: Receitas (paid quotas), despesas (expenses), pending + overdue balance, net balance
- **Links**: Stat cards link to relevant pages (e.g., quotas card links to `/financas/quotas`)
- Auto-marks overdue quotas on page load

#### Expense Tracking (complete)

**What:** Administrators can record, edit, and delete building expenses with categories.

**How it works:**

1. **Creating an expense**: Admin clicks "Registar despesa" and enters: date, category (from 12 Portuguese condo categories), description, amount, and optional notes.
2. **Category summary**: The page shows a visual breakdown by category with progress bars and percentage of total spending.
3. **Expense table**: All expenses listed chronologically with date, description, category badge, amount, and inline edit/delete actions.
4. **Dashboard integration**: Expense totals feed into the dashboard's financial summary (despesas line and balance calculation).

**New files created:**
- `src/lib/validators/expense.ts` — Zod schema and category list
- `src/app/(dashboard)/financas/despesas/actions.ts` — Server actions (create, update, delete)
- `src/app/(dashboard)/financas/despesas/page.tsx` — Server component
- `src/app/(dashboard)/financas/despesas/expense-page-client.tsx` — Client wrapper
- `src/app/(dashboard)/financas/despesas/expense-form.tsx` — Modal form
- `src/app/(dashboard)/financas/despesas/expense-list.tsx` — Category summary + table

### Phase 3: Communication (complete)

#### Announcements (complete)

**What:** Administrators can create, edit, pin, and delete announcements with categories and read tracking.

- **Categories**: Geral, Obras, Manutenção, Assembleia, Urgente (color-coded badges)
- **Pinning**: Pin important announcements to the top of the list
- **Read tracking**: Shows how many members have seen each announcement (X/total)
- **Dashboard integration**: Last 3 announcements shown on the dashboard
- **Role-based**: Only admins can create/edit/delete; all members can view

#### Maintenance Requests (complete)

**What:** Any resident can submit maintenance requests; admins manage the resolution workflow.

- **Status workflow**: Submetido → Em análise → Em curso → Concluído
- **Priority levels**: Baixa, Média, Alta, Urgente (color-coded)
- **Status tracking**: Admin can update status via dropdown; each change creates a history record
- **Summary cards**: Count of requests per status at the top
- **Role-based**: All members can create requests; only admins can update status/delete
- **Dashboard integration**: Open request count shown on dashboard

#### Document Archive (complete)

**What:** Administrators can register and organize building documents with categories and visibility.

- **Categories**: Atas, Orçamentos, Seguros, Contratos, Regulamentos, Outros (filterable tabs with counts)
- **Visibility**: Documents can be marked as "All" or "Admin only"
- **External links**: Documents link to external storage (Google Drive, Dropbox, etc.)
- **Role-based**: Only admins can add/edit/delete; non-admin users only see "All" visibility docs

### Phase 4: Meetings & Contracts (complete)

#### Meeting Management (complete)

**What:** Full assembleia lifecycle — scheduling, attendance, voting, and minutes.

- **Scheduling**: Create meetings with date, time, location, type (Ordinária/Extraordinária), and agenda items
- **Agenda**: Dynamic field array for adding/removing agenda points with descriptions
- **Attendance**: Track each member's status (Presente, Representado, Ausente) with live quorum calculation (permilagem-based)
- **Voting**: Per-agenda-item voting with A favor/Contra/Abstenção buttons per unit; live permilagem-weighted results
- **Ata (minutes)**: Rich text editor for meeting minutes; saved per meeting; viewable on dedicated Atas page
- **Status management**: Mark meetings as Realizada or Cancelada
- **Dashboard integration**: Next scheduled meeting date shown on dashboard

#### Contract Management (complete)

**What:** Track service contracts and insurance policies with renewal reminders.

- **Contract types**: Limpeza, Elevador, Seguro, Jardinagem, Segurança, Administração, Manutenção, Outros
- **Status tracking**: Ativo, Expirado, Renovado, Cancelado
- **Payment info**: Annual cost, payment frequency (Mensal to Pontual), renewal type (Automática/Manual)
- **Insurance fields**: Policy number, insured value, coverage type (shown conditionally for "Seguro" type)
- **Supplier management**: Create suppliers inline when adding contracts (name, NIF, phone, email)
- **Expiry warnings**: Summary cards show active count, total annual cost, and contracts expiring within 30 days
- **CRUD**: Full create/edit/delete with status change dropdown

### Phase 5: Advanced Features & Polish (in progress)

#### Conta de Gerência — Annual Financial Report (complete)

**What:** Auto-generated annual management report required by Portuguese law.

- Summarizes: total income (quotas), expenses by category, budget variance, reserve fund status, outstanding debts per unit
- Pure function `buildContaGerencia()` processes all data — fully testable without Next.js
- PDF export via API route
- Available at `/financas/conta-gerencia`

#### Debtor Tracking (complete)

**What:** Dedicated view for tracking overdue units with aging analysis.

- **Aging buckets**: Current (not yet due), 1-30 days, 31-60 days, 61-90 days, 90+ days overdue
- **Per-unit breakdown**: Owner name/email, unpaid count, visual aging bar, amounts per bucket
- **Summary cards**: Total debt, total overdue, units with debt, units with overdue
- **Color-coded**: Blue (current) → amber (1-30d) → orange (31-60d) → red (61-90d) → dark red (90d+)
- Pure logic in `src/lib/debtor-calculations.ts` (8 unit tests + 12 scenario tests)
- Available at `/financas/devedores` (admin only)

#### Recurring Expenses (complete)

**What:** Template-based expense management for expenses that repeat periodically.

- **CRUD for templates**: Create/edit/delete recurring expense models with description, amount, category, frequency
- **Frequency support**: Monthly (MENSAL), quarterly (TRIMESTRAL), semi-annual (SEMESTRAL), annual (ANUAL)
- **One-click generation**: "Gerar" button creates actual expense records for the current period
- **Duplicate prevention**: Tracks `lastGenerated` period per template to avoid double-generation
- **Pause/resume**: Toggle individual templates active/inactive without deleting
- Schema: Added `RecurringExpense` model to Prisma
- Validator tests (5) + frequency scenario tests (16)
- Available at `/financas/despesas-recorrentes` (admin only)

#### Calendar View (complete)

**What:** Visual monthly calendar showing meetings, quota due dates, and contract renewals.

- **Monthly grid**: Clickable days with color-coded dots (green = meetings, blue = quotas, orange = contracts)
- **Event detail sidebar**: Click a day to see full event details; otherwise shows next 10 upcoming events
- **Month navigation**: Previous/next buttons with "Today" shortcut
- **Data sources**: Meetings (date + type + status), quota due dates (grouped + overdue count), contract end dates
- Available at `/calendario` (all roles)

#### Remaining Phase 5 items:

- PDF receipts and ata exports
- Bulk import UI (CSV parsing logic exists in `src/lib/csv-import.ts`, needs page)
- Email notifications
- Mobile responsiveness polish
- Deployment to production — see `DEPLOYMENT_GUIDE.md` for step-by-step instructions (Vercel + Neon)

---

## Decisions log

| Date | Decision | Why |
|------|----------|-----|
| 2026-03-17 | PostgreSQL over SQLite | Financial data needs decimal precision and ACID transactions |
| 2026-03-17 | Prisma 7 as ORM | Type-safe database queries, auto-generated migrations |
| 2026-03-17 | NextAuth v5 beta | Best auth solution for Next.js App Router, supports edge middleware |
| 2026-03-17 | Portuguese-first UI | Target market is Portuguese; all strings externalized via next-intl |
| 2026-03-17 | Permilagem as default quota model | Required by Portuguese condominium law (Código Civil) |
| 2026-03-18 | bcryptjs for password hashing | Industry standard, works in Node.js without native dependencies |
| 2026-03-18 | Split auth config (edge vs server) | Middleware runs on edge (no DB access), auth logic needs DB |
| 2026-03-18 | JWT sessions over database sessions | Faster — no DB query needed to check if user is logged in |
| 2026-03-18 | Server Actions for mutations | Next.js recommended pattern; simpler than REST APIs for form submissions |
| 2026-03-18 | Database transactions for onboarding | All-or-nothing creation prevents orphaned/incomplete data |
| 2026-03-18 | PrismaPg driver adapter | Prisma 7 requires explicit driver adapters instead of built-in database connections |
| 2026-03-18 | Zod v4 for validation | Same schemas validate on both client (forms) and server (API/actions) |
| 2026-03-18 | Modal forms over separate pages | Budget form opens as overlay — faster UX, keeps context of existing data |
| 2026-03-18 | getAdminContext() helper pattern | Reusable permission check for all admin-only actions — DRY, consistent |
| 2026-03-18 | Immutable approved budgets | Once approved, budgets can't be edited/deleted — preserves official record |
| 2026-03-18 | Dynamic field arrays for line items | React Hook Form's useFieldArray lets admins add/remove budget rows freely |
| 2026-03-18 | Vercel + Neon for hosting | Vercel is built by the Next.js team (best optimization). Neon over Supabase because OpenCondo already has NextAuth (auth) and Prisma (ORM) — Supabase's bundled auth/client would be redundant and unused. Both scale from free tier to production. |
| 2026-03-18 | Deployment guide created | `DEPLOYMENT_GUIDE.md` — step-by-step instructions for non-technical users to deploy on Vercel + Neon |
| 2026-03-25 | Soft deletes on Expense/Quota/Transaction | Recoverable deletions, audit trail, no orphaned financial data; hard deletes permanently destroy payment history |
| 2026-03-25 | URL search param for quota year filter | Avoids loading full quota history on every render; bookmarkable and shareable links |
| 2026-03-25 | requireMembership() centralized helper | Every server page repeated the same auth+membership boilerplate — extracted to `src/lib/auth/require-membership.ts` |
| 2026-03-25 | Centralized serializers | Prisma Decimal→number and Date→string conversions scattered across pages; consolidated in `src/lib/serializers.ts` |
| 2026-03-25 | Vercel Cron for overdue + recurring | Nightly job at 02:00 UTC covers all condominiums; removes per-page side-effects for overdue marking (still kept as fallback on page load) |
| 2026-03-25 | Receipt endpoint ownership check | Non-admin users could previously download any unit's receipt; restricted to units they own/rent |

---

## Session handoff notes (for Claude Code context recovery)

This section exists so that if we start a fresh Claude Code session, I (Claude) can read this file
and get back up to speed without needing the conversation history.

### Current state (2026-03-25)
- **Branch:** `claude/opencondo-development-Ch14I`
- **Build status:** Passing (`next build` succeeds, all routes compile)
- **Database:** Prisma Migrate in use (migration history committed). Latest migration: `20260324224329_add_soft_delete_fields` (adds `deletedAt` to `Expense`, `Quota`, `Transaction`).
- **Test suite:** 348 tests passing (21 test files)
  - 9 validator test files
  - 3 pure logic unit test files (quota-calculations, debtor-calculations, conta-gerencia)
  - 4 scenario test files (lifecycle, csv-import, recurring-expenses, edge-cases) with shared fixtures
  - 3 server action mock tests (condominium, invites — fixed in this session)
  - 2 auth validator tests
- **Latest features (2026-03-25):** Soft deletes on financial records, nightly cron, receipt ownership gate, year-scoped quota queries, centralized auth+serializer helpers.
- **Note:** `pnpm lint` is broken on Next.js 16.1.7 (`next lint` misparses args). The build catches type errors, so this is non-blocking.

### Gotchas & quirks discovered during development
1. **Prisma 7 breaking changes:** PrismaClient no longer auto-connects to the DB. You must pass a driver adapter (we use `@prisma/adapter-pg` with `PrismaPg`). `new PrismaClient()` without options throws an error.
2. **Prisma 7 missing package:** `@prisma/client-runtime-utils` is not auto-installed with `@prisma/client` — had to add it manually to `package.json`.
3. **Zod v4 API change:** `.errors` is now `.issues` on ZodError objects. Use `error.issues[0].message` not `error.errors[0].message`.
4. **Zod v4 + coerce:** `z.coerce.number()` outputs `unknown` type in Zod v4, which breaks `react-hook-form` type inference. Use `z.number()` instead and handle string→number conversion with `valueAsNumber` in the form's `register()` call.
5. **NextAuth v5 edge/server split:** The middleware file CANNOT import Prisma or bcryptjs (edge runtime doesn't support them). Auth config is split into `config.ts` (edge-safe, no providers) and `index.ts` (server-only, with Credentials provider + DB).
6. **Next.js 16 middleware deprecation:** Shows a warning about "middleware" being deprecated in favor of "proxy". Still works, but the warning is expected.
7. **next.config.ts:** Uses `serverExternalPackages: ["@prisma/client", "bcryptjs"]` to prevent bundling issues.
8. **Zod v4 `.default()` + React Hook Form:** Using `z.string().default("")` makes the Zod *input* type `string | undefined` but the *output* type `string`. Since `zodResolver` uses the input type and `useForm<T>` expects the output type, this causes a type mismatch. Fix: use `z.string()` (required) instead and provide default values in the form's `defaultValues`.
9. **Prisma Decimal → JavaScript number:** Prisma's `Decimal` type (used for money) doesn't serialize to JSON automatically. Convert with `Number(value)` before passing to client components.

### Key patterns used
- **Server Actions** (`"use server"`) for database mutations (e.g., `onboarding/actions.ts`)
- **Client Components** (`"use client"`) for interactive forms (login, register, onboarding wizard)
- **Server Components** (default) for layouts that read the session/DB (dashboard layout)
- **Route groups** `(auth)` and `(dashboard)` to share layouts without affecting URLs
- **Zod schemas** in `lib/validators/` shared between client forms and server actions
- **`db` singleton** in `lib/db/index.ts` with global caching to prevent connection leaks in dev
- **`requireMembership()`** in `lib/auth/require-membership.ts` — call at the top of every server page instead of repeating `auth()` + `getUserMembership()` + redirect logic
- **Serializers** in `lib/serializers.ts` — call `serializeExpense(e)`, `serializeTransaction(t)`, etc. to convert Prisma Decimals and Dates before passing to client components
- **Soft deletes** — all `Expense`, `Quota`, `Transaction` writes filter `deletedAt: null`; deletions set `deletedAt = now()` instead of removing rows; cascades handled manually in actions (delete expense → also soft-delete its Transaction)

### What still needs to be built (in order)
1. **Bulk import UI** — CSV parsing logic exists (`src/lib/csv-import.ts`, with duplicate detection) but has no page/form yet. Needs a page at `/definicoes` or `/onboarding` with file upload + preview + confirm flow.
2. **Email notifications** — Transactional emails for announcements, quota reminders, maintenance updates, meeting convocatória. Needs `RESEND_API_KEY` env var and email templates.
3. **Mobile responsiveness** — Current UI is desktop-first; needs responsive tweaks for sidebar, tables, modals.
4. **Deployment** — See `DEPLOYMENT_GUIDE.md` for Vercel + Neon setup. Remember to set `CRON_SECRET` in env vars.
