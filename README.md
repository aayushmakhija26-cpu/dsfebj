# CREDAI Pune Digital Member Portal

Official membership application and lifecycle management platform for CREDAI Pune — the apex body of real-estate developers in Pune.

## Overview

Replaces a paper-heavy, manually-verified membership process with a self-serve lifecycle platform serving:

- **Applicant firms** — 12-step adaptive wizard for Ordinary, Associate, and RERA Project memberships
- **CREDAI Pune staff** — 4-stage approval workflow (Scrutiniser → Convenor → Director General → Secretary)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 App Router |
| Language | TypeScript 5.x (strict mode) |
| API | tRPC v11 + Zod validation |
| ORM | Prisma v7 + PostgreSQL |
| Auth | Auth.js v5 (OTP for applicants, TOTP MFA for staff) |
| UI | React 19 + shadcn/ui + Tailwind CSS v4 |
| Jobs | pg-boss (Postgres-backed queue) |
| PDF | @react-pdf/renderer + AWS KMS signing |
| Storage | Vercel Blob (document vault) |
| Observability | Sentry + pino + OpenTelemetry |
| Testing | Vitest (unit) + Playwright (E2E) + axe-core (a11y) |

## Prerequisites

- Node.js 20 LTS or later
- pnpm 9.x (`npm install -g pnpm`)
- PostgreSQL 15+ (local or Docker)
- Git

## Development Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local` — at minimum set:

```env
DATABASE_URL="postgresql://credai:dev123@localhost:5432/credai"
NEXTAUTH_SECRET="<run: openssl rand -base64 32>"
```

All other values have safe defaults for local development (mock GST/PAN providers, console email).

### 3. Start PostgreSQL (Docker)

```bash
docker run -d \
  --name credai-postgres \
  -e POSTGRES_USER=credai \
  -e POSTGRES_PASSWORD=dev123 \
  -e POSTGRES_DB=credai \
  -p 5432:5432 \
  postgres:15
```

### 4. Run database migrations

```bash
pnpm prisma migrate dev
```

### 5. Start development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm lint:fix` | Auto-fix lint issues |
| `pnpm type-check` | TypeScript type checking |
| `pnpm test` | Run unit tests (Vitest) |
| `pnpm test:watch` | Unit tests in watch mode |
| `pnpm test:coverage` | Unit tests with coverage |
| `pnpm test:e2e` | Run E2E tests (Playwright) |
| `pnpm test:e2e:ui` | Playwright UI mode |
| `pnpm prisma:migrate:dev` | Run new migrations |
| `pnpm prisma:studio` | Open Prisma Studio |
| `pnpm prisma:seed` | Seed test data |

## Project Structure

```text
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/             # Applicant OTP login
│   ├── (apply)/            # 12-step membership wizard
│   ├── (member)/           # Member dashboard + renewal
│   ├── (admin)/            # Staff approval workflow
│   └── public/             # Public certificate verification
│
├── server/
│   ├── api/
│   │   └── routers/        # tRPC procedure definitions
│   ├── services/           # Business logic
│   └── db.ts               # Prisma client singleton
│
├── components/
│   ├── wizard/             # Wizard step components
│   ├── staff/              # Staff review components
│   ├── ui/                 # shadcn/ui base components
│   └── common/             # Shared layout components
│
├── schemas/                # Zod validation schemas
├── lib/                    # Utilities (auth, RBAC, encryption, logging)
├── i18n/                   # next-intl configuration
└── middleware.ts           # Auth + RBAC + audit middleware

messages/
└── en.json                 # All UI strings (no hardcoded strings in components)

prisma/
├── schema.prisma           # Database schema (Phase 2)
└── migrations/             # Migration history

tests/
├── unit/                   # Vitest unit tests
├── integration/            # Integration tests
├── e2e/                    # Playwright E2E tests
└── fixtures/               # Test seed data
```

## Implementation Phases

| Phase | Scope | Status |
|-------|-------|--------|
| 1 | Project setup & initialization | ✅ Complete |
| 2 | Database schema + auth framework | 🔜 Next |
| 3 | US1: New member application wizard (P1) | ⏳ Planned |
| 4 | US2: Staff 4-stage approval workflow (P1) | ⏳ Planned |
| 5 | US3: Annual renewal (P2) | ⏳ Planned |
| 6 | US4: Offline payment recording (P2) | ⏳ Planned |
| 7 | US5: Certificate issuance & public verification (P2) | ⏳ Planned |
| 8 | US6: Admin & President record (P3) | ⏳ Planned |
| 9 | Polish: accessibility, performance, observability | ⏳ Planned |
| 10 | Pre-launch validation & VAPT | ⏳ Planned |

## Security

- No PII in URLs, logs, or error messages
- AES-256 encryption at rest for sensitive fields; separate envelope key for Aadhaar
- TOTP MFA mandatory for all staff roles
- Append-only audit log for all state transitions and staff actions
- OWASP Top 10 mitigations; pre-launch VAPT required
- WCAG 2.1 AA accessibility mandatory

## Contributing

See implementation plan at `specs/001-credai-member-portal/plan.md` and task list at `specs/001-credai-member-portal/tasks.md`.
