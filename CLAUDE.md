# OpenCondo — Development Guide

Portuguese condominium management platform built with Next.js 16, Prisma, PostgreSQL, and Tailwind CSS.

## Quick Reference

```bash
pnpm dev              # Start dev server (Turbopack)
pnpm build            # Production build — MUST pass before pushing
pnpm test             # Run all tests (vitest)
pnpm test:watch       # Run tests in watch mode
pnpm lint             # ESLint
pnpm verify           # Run lint + test + build (full check)
pnpm db:push          # Push schema changes to dev DB
pnpm db:migrate       # Create a migration (production)
pnpm db:studio        # Open Prisma Studio
```

## Development Workflow

### The "verify before push" rule

Every push must pass three gates:

1. **Lint** — `pnpm lint` (catches code quality issues)
2. **Test** — `pnpm test` (catches logic regressions)
3. **Build** — `pnpm build` (catches type errors, import issues, SSR problems)

Run `pnpm verify` to check all three in sequence. Never push code that fails any gate.

### Feature development lifecycle

When building a new module:

1. **Schema first** — Add/modify Prisma models in `prisma/schema.prisma`, run `pnpm db:push`
2. **Validators** — Create Zod schemas in `src/lib/validators/<feature>.ts`
3. **Pure logic** — Extract business logic into `src/lib/<feature>-calculations.ts` (testable without Next.js)
4. **Server actions** — Create `actions.ts` in the route folder (call validators + pure logic)
5. **Server page** — Create `page.tsx` that fetches data, serializes Decimals, passes to client
6. **Client components** — Build form, list, and modal components
7. **Tests** — Write tests for validators and pure logic
8. **i18n** — Add strings to `src/i18n/messages/pt.json`
9. **Verify** — Run `pnpm verify` before committing

### When to write tests

**Always test:**
- Validators (Zod schemas) — every new validator gets a `__tests__/<name>.test.ts`
- Business logic (calculations, state machines, date logic) — any pure function in `src/lib/`
- Edge cases around money (rounding, splitting, zero amounts, negative values)

**Don't test (yet):**
- React components (the build catches rendering issues; add component tests when the UI stabilizes)
- Server actions directly (they depend on Next.js runtime; test the logic they call instead)
- E2E flows (needs running DB + auth; add when approaching production)

### Test file locations

Tests live next to the code they test:
- `src/lib/validators/__tests__/budget.test.ts` — tests `src/lib/validators/budget.ts`
- `src/lib/__tests__/quota-calculations.test.ts` — tests `src/lib/quota-calculations.ts`

## Architecture

### File structure for each module

```
src/
├── lib/
│   ├── validators/<feature>.ts          # Zod schemas + constants
│   ├── validators/__tests__/<feature>.test.ts
│   ├── <feature>-calculations.ts        # Pure business logic (if needed)
│   └── __tests__/<feature>-calculations.test.ts
├── app/(dashboard)/<section>/<feature>/
│   ├── page.tsx                         # Server component (data fetching)
│   ├── actions.ts                       # Server actions (mutations)
│   ├── <feature>-page-client.tsx        # Client wrapper (manages modal/form state)
│   ├── <feature>-form.tsx               # Modal form (create/edit)
│   └── <feature>-list.tsx               # List/table display
└── i18n/messages/pt.json                # Portuguese translations
```

### Key patterns

**Server actions (`actions.ts`):**
- Every mutation starts with `getAdminContext()` — checks auth, cookie, and ADMIN role
- Returns `{ error: string }` on failure, `{ success: true, ... }` on success
- Calls `revalidatePath()` after mutations
- Validates input with Zod before touching the database

**Server pages (`page.tsx`):**
- Checks session, gets membership, redirects if unauthorized
- Fetches data with Prisma
- Serializes Decimal fields to `number` (Prisma Decimals aren't JSON-serializable)
- Passes serialized data + `isAdmin` flag to client component

**Client components:**
- Use `react-hook-form` + `@hookform/resolvers/zod` for form validation
- Modal pattern: fixed overlay (`fixed inset-0 z-50`) rather than separate pages
- Two-step delete confirmation ("Tem a certeza?" → "Sim, eliminar" / "Não")
- Loading states on submit buttons ("A guardar...", "A gerar...")

**Pure logic extraction:**
- Business calculations live in `src/lib/<feature>-calculations.ts`
- Server actions import and call these — never inline complex math in actions
- This makes logic testable without mocking Next.js internals

### Prisma / Database

- **Dev:** Use `pnpm db:push` (quick schema sync, no migration files)
- **Prod:** Use `pnpm db:migrate` (creates migration SQL)
- **Decimals:** Always convert to `number` before sending to client: `Number(record.amount)`
- **Unique constraints:** Use `@@unique` for business rules (e.g., one budget per condo per year)
- **Cascade deletes:** Use `onDelete: Cascade` for owned children, `SetNull` for optional references

### Styling conventions

- Tailwind CSS with CSS variables for theming (`text-foreground`, `bg-card`, `border-border`)
- Cards: `rounded-xl border border-border bg-card`
- Buttons: `rounded-lg` with consistent padding (`px-4 py-2`)
- Status badges: color-coded (`bg-green-100 text-green-700` for success, `bg-red-100 text-red-700` for errors)
- Modals: `fixed inset-0 z-50` with `bg-black/50` overlay
- Forms: `rounded-lg border border-input bg-background` for inputs

### i18n

- All user-facing strings should have a Portuguese translation in `src/i18n/messages/pt.json`
- Nested by feature: `quotas.title`, `budget.saving`, etc.
- Hardcoded Portuguese in components is acceptable for now (we're PT-first), but prefer i18n keys for strings that appear in multiple places

## Role-based access

Three roles: `ADMIN`, `OWNER`, `TENANT`

| Action | ADMIN | OWNER | TENANT |
|--------|-------|-------|--------|
| View dashboards, quotas, expenses | Yes | Yes | Yes |
| Create/edit budgets | Yes | No | No |
| Generate quotas | Yes | No | No |
| Record payments | Yes | No | No |
| Register expenses | Yes | No | No |
| Create announcements | Yes | No | No |

Admin checks use `getAdminContext()` in server actions. View-level access is controlled by passing `isAdmin` to client components which conditionally render action buttons.

## Common pitfalls

- **Decimal serialization**: Prisma returns `Decimal` objects. Always `Number()` them before passing to client components, or you'll get serialization errors.
- **Cookie-based condo selection**: The active condominium comes from `activeCondominiumId` cookie. Always read it in server components/actions; never hardcode a condo ID.
- **Date month indexing**: JavaScript `new Date(year, month, day)` uses 0-indexed months. When parsing "2026-01", month is `0`, not `1`.
- **Rounding**: Money splits may not sum exactly to the total due to rounding. This is expected — the important thing is each unit's amount is individually correct to 2 decimal places.

## Git conventions

- Feature branches: `claude/<feature>-<session-id>`
- Commit messages: imperative mood, explain the "why" not just the "what"
- One logical change per commit (don't mix features)
- Run `pnpm verify` before pushing
