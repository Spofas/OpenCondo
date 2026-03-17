# OpenCondo — Product Specification

**Version:** 0.1 (MVP)
**Date:** 2026-03-17
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
- Email verification required
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
- CSV/Excel upload for units and owners
- Template file provided for download
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
- Overdue tracking with configurable grace period
- Payment receipts (recibos) — PDF generation
- Debt summary per owner

**Future (paid tier):** Automatic reconciliation via Multibanco references (Easypay/ifthenpay integration), MB WAY payment requests.

#### 3.2.2 Expense Tracking

- Record expenses with: date, description, amount, category, supplier
- Expense categories (configurable): limpeza, elevador, eletricidade, água, seguro, manutenção, obras, jurídico, outros
- Attach invoices/receipts (file upload — PDF, image)
- Recurring expense support (e.g., monthly cleaning contract)
- Supplier directory

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
- Title, body (rich text), optional attachments
- Pin important announcements
- Mark as read tracking
- Categories: geral, obras, manutenção, assembleia, urgente
- Email notification sent to all residents on new announcement

#### 3.3.2 Maintenance Requests (Pedidos de Manutenção)

- Any user can submit a request
- Fields: title, description, location (common area or unit-adjacent), priority, photos
- Status workflow: submetido → em análise → em curso → concluído
- Admin can assign to a supplier, add notes, update status
- Requester receives email on status changes
- History log of all updates

#### 3.3.3 Document Archive (Arquivo de Documentos)

- Organized folder structure: atas, orçamentos, seguros, contratos, regulamentos, outros
- Upload any file type (PDF, images, Word, Excel)
- Role-based visibility (some documents admin-only, others shared)
- Version tracking for updated documents
- Search by name and category

### 3.4 Assembleia de Condóminos (General Meetings)

#### 3.4.1 Meeting Management

- Schedule meeting: date, time, location, type (ordinária/extraordinária)
- Create agenda (ordem de trabalhos) with numbered items
- Send convocatória (notice) via email to all owners (legally required 10 days in advance for ordinary, varies for extraordinary)
- Track attendance (presença): present, represented (com procuração), absent
- Quorum calculation based on permilagem of present/represented owners

#### 3.4.2 Atas (Minutes)

- Structured ata template following Portuguese legal requirements:
  - Date, time, location
  - List of attendees with permilagem
  - Quorum verification
  - Deliberations per agenda item with vote counts
  - Signatures section
- Rich text editor for ata content
- PDF export with proper formatting
- Digital approval workflow: owners can approve/contest the ata within 90 days (per law)
- Ata numbering (sequential per condominium)

#### 3.4.3 Voting

- Record votes per agenda item: a favor, contra, abstenção
- Vote weight based on permilagem
- Calculate majorities: simple majority, 2/3 majority, unanimity (as required by different deliberation types)
- Vote results recorded in the ata

### 3.5 Contract Management (Gestão de Contratos)

- Track recurring contracts: cleaning, elevator maintenance, insurance, pest control, etc.
- Fields: supplier, description, start date, end date, renewal type (auto/manual), annual cost, payment frequency
- Document attachment (contract PDF)
- **Renewal reminders:** email alerts at configurable intervals before expiry (e.g., 90, 60, 30 days)
- Insurance-specific fields: policy number, coverage type, insured value
- Contract status: ativo, expirado, renovado, cancelado

### 3.6 Notifications (Email)

Triggered email notifications for:
- New announcement published
- Maintenance request status change
- Quota payment due (configurable days before due date)
- Quota overdue reminder
- Meeting convocatória
- Contract renewal approaching
- Ata available for review

Email provider: transactional email service (e.g., Resend, Postmark)

---

## 4. Non-Functional Requirements

### 4.1 Performance
- Page load < 2s on 3G connection
- Dashboard renders in < 1s on broadband
- Support up to 500 condominiums with 20 units each (10,000 units) on a single instance

### 4.2 Security
- HTTPS everywhere
- Password hashing (bcrypt/argon2)
- CSRF protection
- Rate limiting on auth endpoints
- Input sanitization (XSS, SQL injection prevention)
- File upload validation and scanning
- Role-based access control on every endpoint

### 4.3 Privacy (GDPR/RGPD)
- EU-hosted infrastructure
- Privacy policy in Portuguese
- Cookie consent
- User data export on request
- Account deletion capability
- Minimal data collection

### 4.4 Accessibility
- WCAG 2.1 AA compliance target
- Keyboard navigation
- Screen reader support
- Sufficient color contrast

### 4.5 Internationalization
- Portuguese (pt-PT) as default language
- i18n framework from day one (next-intl or similar)
- All user-facing strings externalized
- Date/currency formatting: dd/mm/yyyy, € (EUR)
- Future: English (en) support

---

## 5. Technical Architecture

### 5.1 Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Framework** | Next.js 14+ (App Router) | Fullstack React, SSR/SSG, API routes, great DX |
| **Language** | TypeScript | Type safety across the stack |
| **Database** | PostgreSQL | Robust relational DB, perfect for financial data |
| **ORM** | Prisma | Type-safe queries, migrations, great DX |
| **Auth** | NextAuth.js (Auth.js) | Flexible auth with session management |
| **UI Library** | shadcn/ui + Tailwind CSS | Friendly, customizable components. Not a heavy dependency |
| **Forms** | React Hook Form + Zod | Validation on client and server |
| **Email** | Resend (or Postmark) | Transactional email with good deliverability |
| **File Storage** | S3-compatible (Cloudflare R2 or AWS S3) | Document and invoice uploads |
| **PDF Generation** | @react-pdf/renderer or Puppeteer | Receipts, atas, financial reports |
| **i18n** | next-intl | Proven i18n for Next.js App Router |
| **Hosting** | Vercel (app) + Supabase or Neon (DB) | Managed, scalable, EU regions available |
| **Monorepo** | Turborepo (if needed) | Future: shared packages between web and mobile |

### 5.2 Project Structure

```
OpenCondo/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/             # Login, register, forgot password
│   │   ├── (dashboard)/        # Authenticated app shell
│   │   │   ├── painel/         # Dashboard overview
│   │   │   ├── financas/       # Finances section
│   │   │   │   ├── quotas/
│   │   │   │   ├── despesas/
│   │   │   │   └── orcamento/
│   │   │   ├── comunicacao/    # Communication section
│   │   │   │   ├── avisos/
│   │   │   │   ├── manutencao/
│   │   │   │   └── documentos/
│   │   │   ├── assembleia/     # Meetings section
│   │   │   │   ├── reunioes/
│   │   │   │   └── atas/
│   │   │   ├── contratos/      # Contracts section
│   │   │   └── definicoes/     # Settings
│   │   └── api/                # API routes
│   ├── components/             # Shared UI components
│   │   ├── ui/                 # shadcn/ui primitives
│   │   ├── forms/              # Form components
│   │   └── layout/             # Layout components (sidebar, header)
│   ├── lib/                    # Utilities and shared logic
│   │   ├── auth/               # Auth configuration
│   │   ├── db/                 # Prisma client, helpers
│   │   ├── email/              # Email templates and sending
│   │   ├── pdf/                # PDF generation
│   │   ├── validators/         # Zod schemas
│   │   └── utils/              # General utilities
│   ├── i18n/                   # Internationalization
│   │   ├── pt.json             # Portuguese translations
│   │   └── en.json             # English translations (future)
│   └── types/                  # TypeScript type definitions
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── migrations/             # Database migrations
│   └── seed.ts                 # Seed data for development
├── public/                     # Static assets
├── tests/                      # Test files
├── .env.example                # Environment variables template
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### 5.3 Data Model (Key Entities)

```
Condominium
├── id, name, address, nif, totalPermilagem
├── quotaModel (PERMILAGEM | EQUAL)
├── fiscalYearStart
│
├── Units (Frações)
│   ├── id, identifier, floor, typology, permilagem
│   ├── ownerId → User
│   └── tenantId → User (optional)
│
├── Users (via membership)
│   ├── id, name, email, phone, nif
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
│   └── paymentDate, paymentMethod, receiptUrl
│
├── Expenses (Despesas)
│   ├── id, date, description, amount, category
│   ├── supplierId, invoiceUrl
│   └── budgetItemId (optional link to budget)
│
├── Announcements (Avisos)
│   ├── id, title, body, category, pinned
│   ├── authorId → User
│   └── AnnouncementReads (userId, readAt)
│
├── MaintenanceRequests (Pedidos de Manutenção)
│   ├── id, title, description, location, priority
│   ├── status, requesterId → User
│   ├── assignedSupplierId
│   └── MaintenanceUpdates (status, note, date)
│
├── Documents (Documentos)
│   ├── id, name, category, fileUrl, version
│   └── visibility (ALL | ADMIN_ONLY)
│
├── Meetings (Assembleias)
│   ├── id, date, time, location, type (ORDINARY | EXTRAORDINARY)
│   ├── status (SCHEDULED | COMPLETED | CANCELLED)
│   ├── AgendaItems (order, title, description)
│   ├── Attendees (userId, status, permilagem, representedBy)
│   └── Ata
│       ├── id, number, content, status (DRAFT | FINAL)
│       ├── pdfUrl
│       └── AtaApprovals (userId, status, date)
│
├── Votes
│   ├── id, meetingId, agendaItemId, unitId
│   ├── vote (FOR | AGAINST | ABSTAIN)
│   └── permilagem (weight)
│
├── Contracts (Contratos)
│   ├── id, supplier, description, type
│   ├── startDate, endDate, renewalType (AUTO | MANUAL)
│   ├── annualCost, paymentFrequency
│   ├── status (ACTIVE | EXPIRED | RENEWED | CANCELLED)
│   └── documentUrl, policyNumber (insurance)
│
└── Suppliers (Fornecedores)
    ├── id, name, nif, phone, email
    ├── category, notes
    └── contractIds
```

### 5.4 API Design

Server Actions (Next.js) for mutations, with RSC (React Server Components) for data fetching. API routes for:
- Webhook endpoints (future payment provider callbacks)
- File upload endpoints
- PDF generation endpoints
- Email preview (development)

All mutations validated with Zod schemas. Authorization checked via middleware and per-action guards.

---

## 6. MVP Roadmap

### Phase 1 — Foundation (Weeks 1–2)
- [ ] Project scaffolding (Next.js, Prisma, Tailwind, shadcn/ui)
- [ ] Database schema and initial migration
- [ ] Authentication (register, login, forgot password)
- [ ] Condominium creation and unit setup
- [ ] User invitation flow
- [ ] App shell (sidebar navigation, responsive layout)
- [ ] i18n setup with Portuguese strings

### Phase 2 — Finances (Weeks 3–4)
- [ ] Budget creation and management
- [ ] Reserve fund tracking
- [ ] Quota generation and management
- [ ] Manual payment recording
- [ ] Expense tracking with categories
- [ ] Overdue quota tracking
- [ ] Basic financial dashboard

### Phase 3 — Communication (Weeks 5–6)
- [ ] Announcements (CRUD, pinning, read tracking)
- [ ] Maintenance requests (submit, status workflow)
- [ ] Document archive (upload, organize, search)
- [ ] Email notifications (announcement, maintenance updates)

### Phase 4 — Meetings & Contracts (Weeks 7–8)
- [ ] Meeting scheduling and agenda
- [ ] Convocatória generation and email sending
- [ ] Attendance and quorum tracking
- [ ] Voting and results recording
- [ ] Ata creation with legal template
- [ ] Ata PDF export and approval workflow
- [ ] Contract management with renewal reminders

### Phase 5 — Polish & Launch (Weeks 9–10)
- [ ] Conta de gerência (annual report) generation
- [ ] Bulk import (units and owners via CSV)
- [ ] Receipt (recibo) PDF generation
- [ ] Email notification tuning
- [ ] Mobile responsiveness polish
- [ ] Seed data and demo condominium
- [ ] Landing page
- [ ] Deployment to production (Vercel + managed DB)

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
