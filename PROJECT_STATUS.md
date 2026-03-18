# OpenCondo — Project Status & Architecture Guide

**Last updated:** 2026-03-18
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
│   │   ├── painel/               # Dashboard overview
│   │   ├── financas/             # Quotas, expenses, budget
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
│   └── validators/condominium.ts # Building/unit validation rules
├── i18n/messages/pt.json         # All Portuguese text strings
└── middleware.ts                  # Route gatekeeper
```

**Why `(auth)` and `(dashboard)` in parentheses?**
Next.js uses parentheses for "route groups" — they organize files without affecting the URL. Both `/login` and `/painel` are at the root level in the URL, but their code is in separate folders with different layouts (login has no sidebar; dashboard has the sidebar).

---

## What's next — upcoming phases

### Phase 2: Financial Management (next up)

This is the core of what makes OpenCondo useful:

- **Quota generation**: Auto-calculate how much each unit owes per month, based on the budget and their permilagem
- **Payment recording**: Admin marks quotas as paid (date, method, notes)
- **Overdue tracking**: Automatically flag unpaid quotas past their due date
- **Expense tracking**: Record building expenses with categories and receipts
- **Budget creation**: Plan annual spending by category
- **Reserve fund**: Track the legally-required 10% reserve fund
- **Financial dashboard**: Show balances, pending payments, overdue amounts at a glance

### Phase 3: Communication

- **Announcements**: Admin posts notices (pinnable, categorized, with read tracking)
- **Maintenance requests**: Any resident can report issues, admin tracks resolution
- **Document archive**: Upload and organize building documents

### Phase 4: Meetings & Contracts

- **Meeting scheduling**: Create assembleias with agenda items
- **Attendance & quorum**: Track who's present and calculate voting eligibility
- **Voting**: Record votes per agenda item with permilagem-weighted results
- **Atas (minutes)**: Structured meeting minutes following Portuguese legal format
- **Contract management**: Track service contracts with renewal reminders

### Phase 5: Polish & Launch

- Annual financial report generation (conta de gerência)
- PDF receipts and ata exports
- Bulk import (CSV upload for units/owners)
- Email notifications
- Mobile responsiveness polish

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
