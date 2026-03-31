# OpenCondo — Product Specification

**Version:** 0.1 (MVP)
**Date:** 2026-03-20
**License:** MIT (open core — premium features in paid tier)

---

## 1. Vision

OpenCondo is a condominium management platform built for the Portuguese real estate market, where owner-administrators (proprietários-administradores) commonly manage their own buildings. The app provides a friendly, approachable tool that handles finances, communication, meetings, and contracts — replacing spreadsheets, WhatsApp groups, and paper atas.

### 1.1 Target Users

- **Primary:** Owner-administrators of small Portuguese condominiums (6–20 units)
- **Secondary:** Professional administration companies managing condos on behalf of owners
- **End users:** Owners (proprietários), tenants (inquilinos), and administrators

### 1.2 Market Context

Portuguese condominium law (Código Civil, artigos 1414.º–1438.º-A; Decreto-Lei 268/94) requires:
- Annual assembleia de condóminos (general meeting)
- Atas (minutes) for every meeting, legally structured
- Fundo comum de reserva (reserve fund) of at least 10% of the annual budget
- Conta de gerência (annual financial report) presented at the assembleia
- Quotas proportional to permilagem (per mille share), unless otherwise agreed

OpenCondo is designed with these legal requirements as first-class features.

---

## 2. User Roles & Permissions

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| **Administrador** | Building admin (owner or professional) | Full access: manage units, finances, meetings, documents, settings |
| **Proprietário** | Unit owner | View finances (own + building), vote in assembleias, submit maintenance requests, view documents |
| **Inquilino** | Tenant/resident | View announcements, submit maintenance requests, view limited documents |

### 2.1 Authentication

- Email + password registration
- Password reset via email
- Invitation-based onboarding (admin invites owners/tenants via email)
- Session-based auth with secure cookies

---

## 3. Core Features (MVP)

### 3.1 Condominium Setup

**Onboarding flow:**
1. Admin registers and creates a condominium
2. Enters building details: name, address, NIF (tax number), number of floors
3. Creates units (frações): identifier (e.g., "1.º Esq"), floor, typology, permilagem
4. Configures quota model: permilagem-based or equal split
5. Invites owners via email (owner receives link to register and claim their unit)

**Bulk import:**
- CSV upload for units
- Validation with error reporting before import

**Data model — multi-condo ready:**
- The data model supports multiple condominiums from day one
- MVP UI is single-condo focused
- Professional multi-condo dashboard is a future paid feature

### 3.2 Financial Management

#### 3.2.1 Quota Management (Quotas de Condomínio)

- Define quota periods (monthly, quarterly, annual)
- Auto-calculate quota per unit based on:
  - **Permilagem:** unit's permilagem ÷ total permilagem × budget
  - **Equal split:** budget ÷ number of units
- Generate quota statements per owner per period
- Track payment status: pendente, pago, em atraso
- Manual payment recording (admin marks as paid with date, method, notes)
- Overdue tracking
- Payment receipts (recibos) — PDF generation
- Debt summary per owner

**Future (paid tier):** Automatic reconciliation via Multibanco references (Easypay/ifthenpay integration), MB WAY payment requests.

#### 3.2.2 Expense Tracking

- Record expenses with: date, description, amount, category, supplier
- Expense categories: limpeza, elevador, eletricidade, água, seguro, manutenção, obras, jurídico, outros
- Recurring expense support (e.g., monthly cleaning contract)

#### 3.2.3 Budgets & Reserve Fund

- **Annual budget (orçamento anual):**
  - Create budget with line items per expense category
  - Budget approval status (proposto, aprovado em assembleia)
  - Actual vs. budgeted tracking with variance
- **Fundo de reserva:**
  - Automatically calculate 10% minimum contribution
  - Track reserve fund balance separately
  - Alert if contributions fall below legal minimum
- **Conta de gerência (annual financial report):**
  - Auto-generated from recorded income (quotas) and expenses
  - Summary: opening balance, total income, total expenses, closing balance
  - Breakdown by category
  - PDF export for presentation at assembleia

### 3.3 Communication

#### 3.3.1 Announcements (Avisos)

- Admin creates announcements visible to all residents
- Title, body, optional attachments
- Pin important announcements
- Categories: geral, obras, manutenção, assembleia, urgente

#### 3.3.2 Maintenance Requests (Pedidos de Manutenção)

- Any user can submit a request
- Fields: title, description, location, priority
- Status workflow: submetido → em análise → em curso → concluído
- Admin can add notes and update status

#### 3.3.3 Document Archive (Arquivo de Documentos)

- Organized by category: atas, orçamentos, seguros, contratos, regulamentos, outros
- Upload any file type (PDF, images, Word, Excel)
- Role-based visibility (some documents admin-only, others shared)

### 3.4 Assembleia de Condóminos (General Meetings)

#### 3.4.1 Meeting Management

- Schedule meeting: date, time, location, type (ordinária/extraordinária)
- Create agenda (ordem de trabalhos) with numbered items
- Track attendance: present, represented (com procuração), absent
- Quorum calculation based on permilagem of present/represented owners

#### 3.4.2 Atas (Minutes)

- Structured ata following Portuguese legal requirements
- Rich text editor for ata content
- PDF export with proper formatting
- Ata numbering (sequential per condominium)

#### 3.4.3 Voting

- Record votes per agenda item: a favor, contra, abstenção
- Vote weight based on permilagem
- Calculate majorities: simple, 2/3, unanimity

### 3.5 Contract Management (Gestão de Contratos)

- Track recurring contracts: cleaning, elevator maintenance, insurance, pest control, etc.
- Fields: supplier, description, start date, end date, renewal type (auto/manual), annual cost, payment frequency
- Contract status: ativo, expirado, renovado, cancelado

### 3.6 Calendar (Calendário)

- Unified view of upcoming meetings, contract renewals, and quota due dates

---

## 4. Non-Functional Requirements

### 4.1 Performance
- Page load < 2s on 3G connection
- Dashboard renders in < 1s on broadband
- Support up to 500 condominiums with 20 units each (10,000 units) on a single instance

### 4.2 Security
- HTTPS everywhere ✅
- Password hashing (bcryptjs) ✅
- Role-based access control on every server action and API route (`getAdminContext()`) ✅
- Receipt download endpoint restricted to the owning unit (non-admins cannot access other units' receipts) ✅
- Cron endpoint protected by `CRON_SECRET` bearer token ✅
- Soft deletes on financial records (no accidental permanent data loss) ✅
- CSRF protection — handled by NextAuth session cookies (SameSite) ✅
- Input sanitization via Zod validation on all server actions ✅
- Rate limiting on auth endpoints — **not yet implemented** (low risk at current scale; add before public launch)
- CSV upload file-size and MIME-type validation — **not yet implemented** (upload UI does not exist yet)

### 4.3 Privacy (GDPR/RGPD)
- EU-hosted infrastructure (Neon Frankfurt region)
- Minimal data collection

### 4.4 Accessibility
- Keyboard navigation
- Sufficient color contrast

### 4.5 Internationalization
- Portuguese (pt-PT) as default and primary language
- i18n framework in place (next-intl)
- All user-facing strings externalized
- Date/currency formatting: dd/mm/yyyy, € (EUR)
- Future: English (en) support

---

## 5. Technical Architecture

### 5.1 Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Framework** | Next.js 16 (App Router) | Fullstack React, SSR/SSG, API routes, great DX |
| **Language** | TypeScript | Type safety across the stack |
| **Database** | PostgreSQL | Robust relational DB, perfect for financial data |
| **ORM** | Prisma | Type-safe queries, migrations, great DX |
| **Auth** | NextAuth.js (Auth.js) | Flexible auth with session management |
| **UI** | Tailwind CSS + custom components | Lightweight, no heavy component library dependency |
| **Forms** | React Hook Form + Zod | Validation on client and server |
| **Email** | Resend (planned) | Transactional email with good deliverability |
| **File Storage** | S3-compatible (planned) | Document and invoice uploads |
| **PDF Generation** | API route (receipts implemented) | Receipts, atas, financial reports |
| **i18n** | next-intl | Proven i18n for Next.js App Router |
| **Hosting** | Vercel (app) + Neon (DB) | Managed, scalable, EU regions. Neon chosen over Supabase because OpenCondo already has its own auth (NextAuth) and ORM (Prisma) — Supabase's bundled auth/client would be redundant. |

### 5.2 Project Structure

```
OpenCondo/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/             # Login, register, forgot password
│   │   ├── (dashboard)/        # Authenticated app shell
│   │   │   ├── actions.ts      # Shared server actions
│   │   │   ├── painel/         # Dashboard overview
│   │   │   ├── financas/       # Finances section
│   │   │   │   ├── quotas/
│   │   │   │   ├── despesas/
│   │   │   │   ├── despesas-recorrentes/
│   │   │   │   ├── devedores/
│   │   │   │   ├── orcamento/
│   │   │   │   └── conta-gerencia/
│   │   │   ├── comunicacao/    # Communication section
│   │   │   │   ├── avisos/
│   │   │   │   ├── manutencao/
│   │   │   │   └── documentos/
│   │   │   ├── assembleia/     # Meetings section
│   │   │   │   ├── reunioes/
│   │   │   │   └── atas/
│   │   │   ├── contratos/      # Contracts section
│   │   │   ├── calendario/     # Calendar
│   │   │   └── definicoes/     # Settings (units, members, condo info)
│   │   └── api/                # API routes (auth, receipts, conta-gerencia)
│   ├── lib/                    # Utilities and shared logic
│   │   ├── auth/               # Auth configuration
│   │   ├── db/                 # Prisma client (lazy-initialized)
│   │   ├── validators/         # Zod schemas + tests
│   │   └── *-calculations.ts   # Pure business logic (testable)
│   └── i18n/messages/pt.json   # Portuguese translations
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── migrations/             # Database migrations (committed to git)
│   └── seed.ts                 # Seed data for development
├── vercel.json                 # Build command (migrate + build)
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

### 5.3 Data Model (Key Entities)

```
Condominium
├── id, name, address, nif, totalPermilagem
├── quotaModel (PERMILAGEM | EQUAL)
│
├── Units (Frações)
│   ├── id, identifier, floor (INT), typology, permilagem
│   ├── ownerId → User
│   └── tenantId → User (optional)
│
├── Users (via Membership)
│   ├── id, name, email, passwordHash
│   ├── role (ADMIN | OWNER | TENANT)
│   └── condominiumId → Condominium
│
├── Budgets (Orçamentos)
│   ├── id, year, status (DRAFT | APPROVED)
│   ├── totalAmount, reserveFundPercentage
│   └── BudgetItems (category, plannedAmount)
│
├── Quotas
│   ├── id, unitId, period, amount, dueDate
│   ├── status (PENDING | PAID | OVERDUE)
│   ├── paymentDate, paymentMethod, notes
│   └── deletedAt (soft delete)
│
├── Expenses (Despesas)
│   ├── id, date, description, amount, category
│   ├── supplierId (optional), budgetItemId (optional)
│   ├── receiptUrl (optional)
│   └── deletedAt (soft delete — set with its linked Transaction together)
│
├── RecurringExpenses (Despesas Recorrentes)
│   ├── id, description, amount, category
│   ├── frequency (MENSAL | TRIMESTRAL | SEMESTRAL | ANUAL)
│   ├── startDate, lastGenerated (prevents double-generation per period)
│   └── supplierId (optional)
│
├── Transactions (Livro de Caixa — cash ledger)
│   ├── id, date, description, amount
│   │   (positive = income; negative = expense)
│   ├── type (QUOTA_PAYMENT | EXPENSE | ADJUSTMENT)
│   ├── quotaId (optional — set when recording a quota payment)
│   ├── expenseId (optional — set when recording an expense)
│   └── deletedAt (soft delete — cascades from parent quota/expense deletion)
│
├── Suppliers (Fornecedores)
│   ├── id, name, nif (optional), email (optional), phone (optional)
│   └── condominiumId
│
├── Announcements (Avisos)
│   ├── id, title, body, category, pinned
│   └── authorId → User
│
├── MaintenanceRequests (Pedidos de Manutenção)
│   ├── id, title, description, location, priority
│   ├── status, requesterId → User
│   └── MaintenanceUpdates (status, note, date)
│
├── Documents (Documentos)
│   ├── id, name, category, fileUrl
│   └── visibility (ALL | ADMIN_ONLY)
│
├── Meetings (Assembleias)
│   ├── id, date, time, location, type (ORDINARY | EXTRAORDINARY)
│   ├── status (SCHEDULED | COMPLETED | CANCELLED)
│   ├── AgendaItems (order, title, description)
│   ├── Attendees (userId, status, permilagem)
│   └── Ata
│       ├── id, number, content, status (DRAFT | FINAL)
│       └── pdfUrl
│
├── Contracts (Contratos)
│   ├── id, name, type, startDate, endDate
│   ├── renewalType (AUTO | MANUAL), annualCost, paymentFrequency
│   ├── status (ACTIVE | EXPIRED | RENEWED | CANCELLED)
│   └── supplierId (optional) → Supplier
│
└── Invites
    ├── id, email, role, unitId (optional)
    └── token, expiresAt, usedAt
```

### 5.4 API Design

Server Actions (Next.js) for all mutations, React Server Components for data fetching. API routes for:
- Auth (NextAuth) — `/api/auth/[...nextauth]`
- PDF receipt generation — `/api/receipts/[quotaId]` (ownership-gated: non-admins can only access their own units)
- Nightly cron job — `/api/cron/process` (protected by `CRON_SECRET` bearer token; registered in `vercel.json` at 02:00 UTC)

The Conta de Gerência report is built server-side via `buildContaGerencia()` in `src/lib/conta-gerencia-calculations.ts` and rendered directly in the page — there is no separate API route for it.

All mutations validated with Zod schemas. Authorization checked per-action via `getAdminContext()`. Every server page uses `requireMembership()` for auth + membership resolution.

---

## 6. MVP Roadmap

### Phase 1 — Foundation ✅
- [x] Project scaffolding (Next.js, Prisma, Tailwind)
- [x] Database schema and migrations
- [x] Authentication (register, login, forgot password, password reset)
- [x] Condominium creation and unit setup
- [x] User invitation flow (email invite → register → claim unit)
- [x] App shell (sidebar navigation, responsive layout)
- [x] Role-based views (ADMIN, OWNER, TENANT)
- [x] i18n setup with Portuguese strings

### Phase 2 — Finances ✅
- [x] Budget creation and management
- [x] Reserve fund tracking (10% legal minimum)
- [x] Quota generation (permilagem-based and equal split)
- [x] Manual payment recording
- [x] Expense tracking with categories
- [x] Recurring expenses
- [x] Overdue quota tracking (Devedores page)
- [x] Payment receipt PDF generation
- [x] Conta de gerência (annual financial report) PDF

### Phase 3 — Communication ✅
- [x] Announcements (create, pin, categorize)
- [x] Maintenance requests (submit, status workflow, admin notes)
- [x] Document archive (upload, organize by category, visibility control)

### Phase 4 — Meetings & Contracts ✅
- [x] Meeting scheduling with agenda
- [x] Attendance and quorum tracking
- [x] Voting and results recording
- [x] Ata creation and management
- [x] Contract management (track renewals, costs, status)
- [x] Calendar view

### Phase 5 — Polish & Launch (In Progress)
- [x] Seed data for development (realistic multi-user dataset with Transactions populated)
- [x] Deployment to production (Vercel + Neon, three-environment setup: production, develop, preview)
- [x] Nightly cron job (overdue marking + recurring expense generation across all condos)
- [x] Dashboard stat cards (admin: YTD Saldo/Receitas/Despesas/Próxima assembleia; owner: Próxima quota/Próxima assembleia)
- [x] CSV parsing logic + duplicate detection (`src/lib/csv-import.ts`, tested) — **upload UI not yet built**
- [ ] CSV bulk import UI (file upload → preview → confirm flow, likely at `/definicoes`)
- [ ] Email notifications (announcements, maintenance updates, quota reminders) — needs `RESEND_API_KEY`
- [ ] Receipt PDF polish
- [ ] Mobile responsiveness polish
- [ ] Landing page

---

## 7. Future Features (Post-MVP / Paid Tier)

| Feature | Tier |
|---------|------|
| Multi-condo dashboard for professional admins | Paid |
| Multibanco/MB WAY payment integration | Paid |
| Automatic bank reconciliation | Paid |
| Push notifications (mobile app) | Paid |
| Remote/digital voting for assembleias | Paid |
| Advanced financial reports and charts | Paid |
| Accounting export (SAF-T PT format) | Paid |
| White-label for professional companies | Paid |
| API access for integrations | Paid |
| SMS notifications | Paid |
| Native mobile apps (iOS/Android) | Free + Paid |
| Full GDPR tooling (data export, consent mgmt) | Free |
| English language support | Free |

---

## 8. Design Principles

1. **Portuguese-first:** Every label, message, and flow designed for Portuguese users. Legal terms use correct Portuguese terminology.
2. **Friendly & approachable:** Clean UI with clear visual hierarchy. Not intimidating for non-technical owner-administrators.
3. **Mobile-ready:** Fully responsive. All features usable on a phone browser.
4. **Legal compliance:** Atas, budgets, and financial reports follow Portuguese condominium law requirements.
5. **Progressive complexity:** Simple for a 6-unit building, capable enough for 20 units with a professional admin.
6. **Open core:** Core condominium management is free and open source. Premium features for professional use cases.
