# OpenCondo — Development Guide

Portuguese condominium management platform built with Next.js 16, Prisma, PostgreSQL, and Tailwind CSS.

## Active branch

All development happens on `claude/opencondo-development-Ch14I`. Do not create new branches — work on this branch, commit, and push here. PRs go from this branch into `develop` or `main`.

## Session start

At the beginning of every session, read these two files before doing anything else:
- `PROJECT_STATUS.md` — current branch, build state, architecture, key patterns, gotchas, and what still needs building
- `CHANGELOG.md` — what changed in the most recent sessions (read top-to-bottom, stop after the third entry)

## Documentation updates (on every push)

After every `git push`, update the following documentation files where relevant. Not every file needs updating on every push — use judgement based on what changed:

| File | When to update | What to write |
|------|----------------|---------------|
| `CHANGELOG.md` | **Every push** — always add an entry | New entry at the top of `[Unreleased]` with date, summary of changes, and details grouped by category |
| `PROJECT_STATUS.md` | When architecture, build state, patterns, or module status changes | Update the "Last updated" date, and any sections affected by the changes (e.g., new modules, changed patterns, updated file structure) |
| `MANUAL_TESTS.md` | When new user-facing flows are added or existing flows change behavior | Add new test items or update existing ones to reflect the new behavior |
| `PRODUCT_SPEC.md` | When features are added, removed, or significantly redesigned | Update the relevant feature section to match what was actually built |

**Rules:**
- Keep entries concise — focus on what changed and why, not implementation details
- CHANGELOG entries use the same date-based format as existing entries
- Don't rewrite entire files — surgically update the affected sections
- If a push is purely internal (refactoring, test fixes) with no user-facing or architectural impact, CHANGELOG is still required but the others can be skipped

## Quick Reference

```bash
pnpm dev              # Start dev server (Turbopack)
pnpm build            # Production build — MUST pass before pushing
pnpm test             # Run all tests (vitest)
pnpm test:watch       # Run tests in watch mode
pnpm lint             # ESLint
pnpm verify           # Run lint + test + build (full check)
pnpm db:migrate       # Create a new migration (generates SQL + applies to local DB)
pnpm db:deploy        # Apply pending migrations to the connected DB (used by Vercel)
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
- Admin mutations use `withAdmin(async (ctx, ...args) => { ... })` HOF — checks auth, membership, and ADMIN role automatically
- Member-level actions use `withMember(async (ctx, ...args) => { ... })` — checks auth and membership (any role)
- Both HOFs provide `ctx` with `userId`, `condominiumId`, `slug`, and `role`
- Returns `ActionReturn` type: `{ error: string }` on failure, `{ success: true, ... }` on success
- Calls `revalidatePath(`/c/${ctx.slug}`)` after mutations (scoped to the active condo)
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

The project uses **Prisma Migrate** for all schema changes. Migration files live in `prisma/migrations/` and are committed to git. Vercel automatically runs `prisma migrate deploy` before every build (`vercel.json`).

**Schema change workflow:**
1. Edit `prisma/schema.prisma`
2. Run `pnpm db:migrate` — Prisma generates the SQL migration file and applies it to your local DB
3. Commit both the schema change and the generated migration file
4. Push — Vercel deploys and automatically applies the migration to production

**Rules:**
- **Never** use `pnpm db:push` on a DB that has migration history — it will conflict
- Migration files are **immutable** once applied; never edit them
- For data migrations alongside schema changes, add the SQL directly to the migration file that Prisma generates
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

Admin checks use `withAdmin` HOF in server actions. View-level access is controlled by passing `isAdmin` to client components which conditionally render action buttons.

## Common pitfalls

- **Decimal serialization**: Prisma returns `Decimal` objects. Always `Number()` them before passing to client components, or you'll get serialization errors.
- **Slug-based condo routing**: The active condominium comes from the URL slug (`/c/[slug]/...`). Server pages use `requireMembership(slug)`, actions use `withAdmin(condominiumId, ...)` / `withMember(condominiumId, ...)`. Never hardcode a condo ID.
- **Date month indexing**: JavaScript `new Date(year, month, day)` uses 0-indexed months. When parsing "2026-01", month is `0`, not `1`.
- **Rounding**: Money splits may not sum exactly to the total due to rounding. This is expected — the important thing is each unit's amount is individually correct to 2 decimal places.

## Git Conventions

### Branch strategy

| Branch | Purpose | Merges into | Deploys to |
|--------|---------|-------------|------------|
| `main` | Stable, deployable code. Always working. | — | Production (Vercel + Neon `main`) |
| `develop` | Integration branch for testing | `main` (via PR) | Develop (Vercel Preview + Neon `develop`) |
| `claude/opencondo-development-Ch14I` | All Claude development work | `develop` (via PR) | — |

**Workflow:**
1. Claude develops on `claude/opencondo-development-Ch14I` (single branch, no new branches)
2. When a feature/phase is complete, Claude creates a **PR** → `develop`
3. The maintainer reviews, merges the PR on GitHub, and promotes `develop` → `main` when ready

> Note: The remote only allows pushes to `claude/` branches. Merging into `develop` or `main` must be done by the maintainer (via GitHub PR merge).

### Multi-environment setup (Neon + Vercel)

The project runs two live environments backed by separate databases:

| Environment | Git branch | Vercel env | Neon branch | URL |
|-------------|------------|------------|-------------|-----|
| Production | `main` | Production | `production` | `opencondo.app` |
| Develop | `develop` | Preview | `develop` | `develop.opencondo.app` |
| Preview | `claude/*` | Preview | `develop` | `preview.opencondo.app` |

**Neon database branching:**
- Neon supports git-like DB branching — the `develop` branch is an isolated copy of production
- Schema migrations run independently on each branch
- To create the develop DB branch: Neon Console → Branches → "New branch" from `production`, name it `develop`

**Vercel environment variables:**
- `DATABASE_URL` is set **twice** — once per Vercel environment scope:
  - **Production** scope → Neon `production` branch connection string
  - **Preview** scope → Neon `develop` branch connection string
- All other env vars (`NEXTAUTH_SECRET`, `NEXTAUTH_URL`, etc.) should also be scoped appropriately
- `NEXTAUTH_URL` for Preview should point to `develop.opencondo.app` (or the preview URL)

**Migration workflow across environments:**
- Migrations applied to `develop` branch DB when the develop environment deploys
- Migrations applied to `production` branch DB when production deploys
- Vercel runs `prisma migrate deploy` automatically before each build (`vercel.json`)
- Test migrations on develop first before merging to `main`

### Conventional Commits

All commit messages follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>: <short description>

<optional body — explain the "why", not the "what">
```

**Types:**

| Type | When to use |
|------|-------------|
| `feat` | New feature or module (e.g., quota management, expense tracking) |
| `fix` | Bug fix |
| `test` | Adding or updating tests |
| `refactor` | Code restructuring without changing behavior |
| `docs` | Documentation changes (CLAUDE.md, PROJECT_STATUS.md, comments) |
| `style` | Formatting, CSS changes, no logic change |
| `chore` | Build config, dependencies, scripts, tooling |
| `perf` | Performance improvement |

**Examples:**
```
feat: add quota management with payment tracking
fix: correct permilagem rounding for 3-unit split
test: add validator and calculation tests for financial modules
refactor: extract quota split logic into pure functions
docs: add CLAUDE.md development guide
chore: add pnpm verify script
```

**Rules:**
- One logical change per commit (don't mix features with refactors)
- Imperative mood in the description ("add", not "added" or "adds")
- Keep the first line under 72 characters
- Use the body for context when the change isn't obvious
- Run `pnpm verify` before pushing
