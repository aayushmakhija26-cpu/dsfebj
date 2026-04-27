---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - credai_srs/CredAi_SRS.md
workflowType: 'architecture'
project_name: 'Credai'
user_name: 'Aayush Makhija'
date: '2026-04-27'
lastStep: 8
status: 'complete'
completedAt: '2026-04-27'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements (FR1–FR102, 14 capability groups):**

| # | Capability Group | FR Range | Architectural Implication |
|---|---|---|---|
| 1 | Authentication & Identity | FR1–FR6 | Email + OTP for applicants; email + password + TOTP MFA for 6 staff roles; configurable session timeout. Two distinct auth flows; same identity store. |
| 2 | Membership Application Wizard | FR7–FR31 | Schema-driven 12-step adaptive form across 3 × 7 = 21 conditional paths; draft save/resume; submit-locks-for-edit. Forms layer must be declarative (Zod). |
| 3 | External Verification (GST / PAN) | FR32–FR35 | Async-by-default with queue-and-retry on outage; verification status as a first-class application field; Scrutiniser-triggered re-verification. |
| 4 | Payment & Fee Collection | FR36–FR44 | Dual-mode ledger (online gateway + offline entry); idempotent gateway webhooks; uniqueness on receipt/reference numbers; GST-compliant tax invoice generation; reversal workflow; payment-gated final approval. |
| 5 | Multi-Stage Approval Workflow | FR45–FR59 | Custom state machine (Scrutiniser → Convenor → DG → Secretary) with bounce-back-to-Scrutiniser, full-chain restart on Scrutiniser re-approval, terminal Reject with no data inheritance, per-role inboxes, SLA-aging surface, Scrutiniser-only inline edit, auto-revalidation on GST/PAN edits. |
| 6 | Certificate & Public Verification | FR60–FR69 | Server-rendered tamper-evident PDF; portal-held document-signing certificate; embedded snapshot of President name + signature image; QR-encoded verification URL; supersession on renewal; revocation surfaces on public endpoint; rate-limited + captcha-protected unauthenticated verification page. |
| 7 | Member Lifecycle & Renewal | FR70–FR79 | Member directory auto-update; auto-process renewals with no material changes; T-30 / T-15 scheduled reminders; status transitions (Active → Renewal Due → Lapsed) with configurable grace; read-only access for Lapsed. |
| 8 | Document Management & Vault | FR80–FR84 | Per-member, per-document-type versioning; format/size validation at upload; supersession marking; retention policy enforcement; staff inline view subject to RBAC. |
| 9 | Staff Dashboards & Analytics | FR85–FR89 | Operational + Member + Payment + KPI views; filter by date/Membership Type/Firm Type; CSV/Excel export; near-real-time refresh (~30 s polling acceptable in MVP, SSE/WebSocket as Growth). |
| 10 | Notifications & Communications | FR90–FR91 | Email-only in MVP; structured event taxonomy; send-success/failure logged for audit; SMS/WhatsApp deferred to Phase 2 behind the same internal interface. |
| 11 | User, Role & President Management | FR92–FR97 | RBAC (7 roles) with invite + lifecycle; master-data lookups; President as master-data with single-active enforcement; historical fidelity (issued certificates immutable to later President changes). |
| 12 | Audit & Compliance | FR98–FR102 | Append-only, tamper-evident audit log; Aadhaar-read auditing; consent capture (DPDP) timestamped + immutable; data-subject access/correction/erasure handlers; default Aadhaar masking. |

**Non-Functional Requirements (NFR1–NFR65):**

The NFRs decompose into nine architectural drivers:

- **Performance (NFR1–NFR9).** Cold load ≤ 3 s 4G / ≤ 1.5 s desktop p95; warm SPA navigation ≤ 500 ms p95; wizard step ≤ 2 s p95; FCP ≤ 1.8 s, LCP ≤ 2.5 s, CLS ≤ 0.1, INP ≤ 200 ms (p75 mobile); JS budget ≤ 250 KB gzipped initial / ≤ 100 KB per route chunk; OTP delivery ≤ 30 s; document upload ≤ 10 s on 4 Mbps; vault retrieval < 1 minute end-to-end; public verification ≤ 1 s p95 cached / ≤ 3 s cold.
- **Availability & Reliability (NFR10–NFR17).** ≥ 99.5 % monthly applicant uptime (≥ 99.5 % staff in business hours, ≥ 99.0 % out of hours); RTO ≤ 24 h, RPO ≤ 1 h; daily encrypted backups + 35-day PITR; verification + payment outages must not block submit (queue-and-retry); ≥ 99 % upload success; ≥ 99 % renewal-reminder dispatch with manual-outreach escalation on failure; idempotent payment-gateway callbacks under retry / replay / out-of-order.
- **Security (NFR18–NFR31).** TLS 1.2+ with HSTS; AES-256 at rest; envelope encryption with separate key for Aadhaar; secrets in a secrets manager (never in code/env-dumps/logs); no PII in URLs/history/logs/error messages; TOTP MFA for all 6 CREDAI-side roles; session timeout ≤ 30 min idle / 8 h absolute; RBAC enforced server-side on every endpoint; OWASP Top 10 mitigations; pre-launch + annual VAPT; rate-limit + captcha on public verification; brute-force protection on staff login + OTP-resend.
- **Privacy & Compliance (NFR32–NFR40).** DPDP Act 2023 with CREDAI Pune as Data Fiduciary; explicit, purpose-bound, timestamped consent; data-subject access/correction/erasure; retention periods (active+7y / rejected 3y / audit 7y / payment 8y) enforced by automated lifecycle jobs; **India data residency**; no PII sharing beyond GST/PAN/payment processors without separate consent; UIDAI compliance; GST tax-invoice format (CGST/SGST/HSN-SAC); breach-notification procedure.
- **Accessibility (NFR41–NFR47).** WCAG 2.1 AA; keyboard-only completion of the entire 12-step wizard; semantic HTML + ARIA; NVDA + VoiceOver smoke tests; ≥ 4.5 : 1 contrast (≥ 3 : 1 large / UI); 200 % zoom without loss; focus management on step navigation; error summary announced via `role="alert"`.
- **Scalability (NFR48–NFR50).** Default sizing ≤ 200 concurrent applicant + ≤ 50 concurrent staff sessions; renewal-season spikes absorbed without breaching performance NFRs; vault scales to 5+ years × 50–100 documents per active member without retrieval-time degradation.
- **Integration & Interoperability (NFR51–NFR55).** GST/PAN with documented backoff and non-blocking submit; gateway-replaceable payment ledger schema; replaceable email service via configuration; future SMS/WhatsApp + MahaRERA + ERP all behind internal service interfaces.
- **Observability & Operability (NFR56–NFR61).** Structured logs with trace ID (no PII); distributed tracing on the wizard → submit → workflow chain; RUM for Core Web Vitals; synthetic uptime checks; alert routing on availability / latency / error-rate / verification or gateway failure / vault retrieval; runbooks for outage, certificate rotation, President update, DSAR, breach.
- **Auditability (NFR62–NFR65).** Append-only and tamper-evident; entries cannot be modified/deleted by any role; covers all state changes, staff actions with reason, document accesses, Aadhaar reads, certificate issuance/supersession/revocation, offline payment entries + reversals, President changes, every login (success and failure); searchable + exportable; PDF certificates carry portal-applied document-signing certificate (tamper-evidence visible in PDF readers).

### Scale & Complexity

- **Primary domain:** full-stack web application (dual-surface SPA + REST API + relational DB + object/file store + durable queue + worker tier + signing service + PDF rendering + observability stack)
- **Complexity level:** medium-high
- **Tenancy:** single-tenant (CREDAI Pune chapter only); per-tenant key pattern recommended now to ease future multi-chapter expansion (Phase 3)
- **Concurrent load (default planning):** ≤ 200 applicant sessions, ≤ 50 staff sessions (NFR48 — pending client baseline)
- **Estimated architectural components (preview, will be detailed in later steps):** SPA front-end · REST API service · Relational DB · Object/file store · Durable job/queue + workers · Identity service (incl. TOTP) · Email service · Payment-gateway adapter · GST verification adapter · PAN verification adapter · PDF generation + document-signing service · Public verification edge endpoint · RUM + tracing + logs · Feature-flag service · Backup + DR + audit-log archival

### Technical Constraints & Dependencies

**Constraints (non-negotiable):**

- **India data residency** for all PII and document-vault data (NFR36, DPDP Act spirit) — drives hosting selection.
- **No use of Aadhaar for authentication; no biometric capture; no eKYC integration in MVP** (NFR38) — Aadhaar is KYC-document data only.
- **No card / CVV / bank credentials stored on the portal** (NFR25) — payment-gateway tokenization mandatory.
- **Tamper-evident PDFs via a portal-held document-signing certificate** (FR63, NFR65) — not per-certificate manual DSC; external CA-issued document-signing cert lifecycle (rotation, secure private-key storage in HSM/secrets-manager) is part of the architecture.
- **Append-only audit log not mutable by any role, including System Admin** (NFR62) — write path must architecturally exclude update/delete operations.
- **No PII in URLs / history / logs / error messages** (NFR23) — applies to logs, error reporting, and analytics.
- **OWASP Top 10 mitigations** (NFR28); pre-launch + annual VAPT (NFR29).

**Frontend stack (constrained by the UX specification, treated here as input):**

- Next.js (React) App Router; TailwindCSS + shadcn/ui; React Hook Form + Zod; framer-motion (conditional reveals); Sonner (toasts); Inter via `next/font`; `@axe-core/react` in dev; Lighthouse CI ≥ 90 a11y. The architecture will validate this stack choice; deviations would require revisiting the UX spec.

**Backend / infra dependencies (open — to be decided in subsequent steps):**

- Hosting (PRD Open Decision #6 — on-prem / managed / cloud, India data-residency-bound)
- Payment gateway (Open Decision #2 — Razorpay / PayU / CCAvenue / BillDesk / Cashfree)
- GST verification provider (GSTN public API or licensed reseller)
- PAN verification provider (NSDL / Protean / RBI-authorized)
- Email service (SES / SendGrid / SMTP relay)
- MahaRERA live API verification (Open Decision #3 — MVP candidate or Phase 2)
- GST e-invoicing IRP integration (Open Decision #1 — only if turnover ≥ ₹5 cr)
- Document-signing certificate provider (CA selection + private-key custody — HSM vs. cloud KMS)
- TOTP MFA implementation (in-app vs. third-party identity service)
- Existing-member data migration source format and quality (Open Decision #7)

### Cross-Cutting Concerns Identified

These concerns span every capability group and must be designed once at the architecture layer rather than re-implemented per feature:

1. **Authentication & Identity.** Two flows (email + OTP for applicants/members; email + password + TOTP for staff) sharing one identity store, server-rendered session/cookie semantics, brute-force/abuse protection on OTP-resend and staff login.
2. **Authorization (RBAC).** 7 roles with server-side enforcement on every API endpoint; client-side hiding is augmentation only; staff role separation including the unique Scrutiniser-only edit privilege.
3. **Audit logging.** Append-only, tamper-evident store written from a centralized middleware so no FR can bypass it; covers staff actions, Aadhaar reads, document accesses, certificate lifecycle, payment ledger changes, President-record changes, and all logins.
4. **PII handling and data minimization.** Field-level encryption-at-rest with envelope encryption; separate envelope key for Aadhaar; masking enforced at the response-serialization layer (not just UI); structured-log redaction; no-PII-in-URL invariants.
5. **External-integration resilience.** Queue-and-retry as the default pattern for GST, PAN, payment, email; idempotent webhook handling with signature verification; non-blocking submission paths with explicit "pending" status visible to staff.
6. **Background scheduling.** Durable job/queue + worker tier for renewal reminders (T-30, T-15), lapse transitions, GST/PAN re-verification, email dispatch, retention-policy enforcement, signing-cert rotation reminders.
7. **Observability.** Structured logs (no PII) with trace ID; distributed tracing across wizard → submit → workflow → notification; RUM for Core Web Vitals; synthetic uptime; alerting on availability / latency / error-rate / verification + gateway failures / vault retrieval; runbooks per scenario.
8. **Idempotency & uniqueness.** Idempotent payment-gateway callbacks; uniqueness on offline-payment receipt/reference numbers; idempotency on certificate issuance and renewal supersession.
9. **Rate limiting & abuse protection.** Per-IP token bucket + captcha on public verification; brute-force protection on staff login; abuse limits on OTP resend.
10. **Feature flags.** Runtime layer to gate Phase-2 capabilities (public directory, MahaRERA live, SMS/WhatsApp) without redeploys; also useful for staff-side staged rollouts.
11. **Retention & lifecycle automation.** Automated jobs enforcing active+7y / rejected 3y / audit 7y / payment 8y; legal-hold override; supersession not deletion for replaced documents.
12. **Internationalization (deferred).** English-only at MVP, but copy externalization patterns adopted now to ease Marathi/Hindi addition in Phase 3 without UI rewrites.
13. **Accessibility.** WCAG 2.1 AA enforced at the component-library and form-layer level (focus management, ARIA, contrast tokens), tested in CI (axe / Lighthouse) and manually with NVDA + VoiceOver.

### PRD Open Decisions Carrying Into Architecture

The following PRD §Open Decisions remain client-side and become architectural inputs as they resolve:

| # | Decision | PRD Default | Architectural Impact |
|---|---|---|---|
| 1 | GST e-invoicing applicability | Not applicable | If applicable, adds GST IRP integration + IRN flow on every fee receipt |
| 2 | Payment gateway selection | Defer | Selects webhook signature scheme, refund APIs, settlement reconciliation contract |
| 3 | MahaRERA live API verification | Phase 2 | If pulled into MVP, adds another queue-and-retry external service |
| 4 | Data retention periods | 7 / 3 / 7 / 8 years | Drives lifecycle-job schedule and storage sizing |
| 5 | MFA for CREDAI-side roles in MVP | Yes (TOTP) | If yes, identity service must include TOTP enrolment + verification + recovery |
| 6 | Hosting choice | Deferred | The single largest architectural decision pending |
| 7 | Existing-member data migration | TBD | Drives schema flexibility, migrated-vs-portal-native flag, certificate-issuance back-fill strategy |
| 8 | Membership Number format | `CPN/{ORD/ASC/RERA}/{YYYY}/{seq}` | Sequence-generator design (per-type yearly counter, gap-free vs. gap-tolerant) |
| 9 | Migrated members' certificate strategy | Reissue with current President | Either single-strategy or dual (historical-President capture) — affects President master-data shape |
| 10 | Staff training & go-live | Phased cutover with 30-day parallel paper period | Drives data-import surfaces, staff-data-entry-on-behalf-of-applicant flow |
| 11 | Internationalization | English-only | Deferral to Phase 3; copy externalization patterns still adopted now |

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web application — Next.js (React) + TypeScript with end-to-end
type safety to the database. The 12-step adaptive wizard, Zod-driven form
validation, RBAC-gated staff API, and shared schemas across client/server
make a unified TypeScript stack the strongest fit.

### Starter Options Considered

Three starters were evaluated against the requirements:

| Starter | Includes | Verdict |
|---|---|---|
| `create-next-app` | Next.js + TS only | Too bare — would need to manually wire Tailwind, shadcn, Prisma, tRPC, Auth.js, ESLint, env validation. ~1 week of setup. |
| `create-t3-app@7.40.0` | Next.js + TS + Tailwind + tRPC + Prisma + NextAuth + Zod + ESLint + env-var validation | Scaffolds 80% of the chosen stack in one command. **Selected.** |
| `create-t3-turbo` | Above + Turborepo monorepo + Expo (mobile) | Overkill for MVP — mobile native is Phase 3 (PRD §Vision); Turborepo overhead unjustified for a single app. |

### Selected Starter: create-t3-app

**Rationale for Selection:**

1. Scaffolds Next.js 15 + TypeScript + Tailwind + tRPC v11 + Prisma + NextAuth + ESLint + Zod env validation in a single command — exactly the chosen stack minus shadcn/ui (which has its own init).
2. App Router support is mature; tRPC v11 is server-component-native, eliminating the historic client-boundary friction.
3. Establishes the canonical T3 file layout (`src/server/api/routers`, `src/server/db.ts`, `src/env.js`) that the AI agent fleet implementing this app will recognize without explanation.
4. Built-in `t3-env` runtime validation of environment variables at boot — catches missing `DATABASE_URL`, `NEXTAUTH_SECRET`, etc. before the first request.
5. Battle-tested across hundreds of thousands of projects; current stable (v7.40.0, Nov 2025) targets Next.js 15 + tRPC v11 + Prisma 6 + Zod 3 + Tailwind 3.

**Initialization Command:**

```bash
pnpm create t3-app@latest credai \
  --CI \
  --nextAuth \
  --tailwind \
  --trpc \
  --prisma \
  --appRouter \
  --dbProvider postgres
```

Run from the parent of the desired project directory. Produces a `./credai` folder with the scaffolded app. Uses `pnpm` (recommended for Vercel deploys — fastest installs, smallest disk).

**Architectural Decisions Provided by Starter:**

| Decision | Choice locked by starter |
|---|---|
| Language | TypeScript (strict mode) |
| Framework | Next.js 15 with App Router |
| Styling | TailwindCSS (v3 — to be upgraded to v4 post-scaffold) |
| API layer | tRPC v11 |
| ORM | Prisma 6 (to be upgraded to v7 post-scaffold) |
| Database driver | `postgres` (Postgres-compatible) |
| Auth | NextAuth v4 (to be upgraded to Auth.js v5 beta post-scaffold) |
| Validation | Zod (v3 — to be upgraded to v4 post-scaffold) |
| Env-var validation | `@t3-oss/env-nextjs` (Zod-backed boot-time check) |
| Linting | ESLint with `@typescript-eslint` |
| Formatting | Prettier (default rules) |
| Package manager | pnpm |
| Project structure | `src/app` (App Router) · `src/server/api` (tRPC) · `src/server/db.ts` (Prisma client) · `src/env.js` (env schema) · `prisma/schema.prisma` |

**Post-Scaffold Additions Required (single dependency-install pass):**

After `create-t3-app` completes, the following are added to bring the project to the architectural baseline. These are all additive — none require restructuring the scaffolded code.

```bash
cd credai

# 1. shadcn/ui — UX spec mandates this component library
pnpm dlx shadcn@latest init

# 2. Upgrade Tailwind to v4, Zod to v4, Prisma to v7,
#    Next-auth to v5 beta (Auth.js)
pnpm up --latest tailwindcss zod
pnpm up --latest @prisma/client prisma
pnpm add next-auth@beta @auth/core@latest @auth/prisma-adapter@latest

# 3. Vercel Blob SDK for the document vault
pnpm add @vercel/blob

# 4. Postgres-backed job queue (workers run via Vercel Cron)
pnpm add pg-boss

# 5. PDF generation + signing for membership certificates
pnpm add @react-pdf/renderer @signpdf/signpdf @signpdf/signer-p12 qrcode

# 6. TOTP (staff MFA), bcrypt (staff password), nanoid (membership numbers)
pnpm add otplib bcrypt nanoid

# 7. Email (provider TBD — abstract behind interface; concrete adapter
#    selected in step 4)
pnpm add nodemailer

# 8. UI extras the UX spec calls for
pnpm add framer-motion sonner @hookform/resolvers next-intl

# 9. Server state + form handling
pnpm add @tanstack/react-query react-hook-form

# 10. Observability (errors + structured logs)
pnpm add @sentry/nextjs pino pino-pretty

# 11. Captcha for public verification page (Cloudflare Turnstile)
pnpm add @marsidev/react-turnstile

# 12. Testing + a11y
pnpm add -D vitest @vitejs/plugin-react @testing-library/react \
  @testing-library/jest-dom playwright @playwright/test \
  @axe-core/react @lhci/cli
```

### Project Structure (post-scaffold + additions)

```
credai/
├── prisma/
│   └── schema.prisma              # all domain models
├── src/
│   ├── app/                        # Next.js App Router routes
│   │   ├── (public)/               # login, signup, privacy, terms, /verify
│   │   ├── (applicant)/            # wizard, vault, dashboard, renewal
│   │   ├── (staff)/                # /admin/* — RBAC-gated layouts
│   │   ├── api/
│   │   │   ├── trpc/[trpc]/         # tRPC HTTP handler
│   │   │   ├── webhooks/payment/    # gateway callbacks (REST)
│   │   │   ├── upload/              # multipart upload to Vercel Blob
│   │   │   ├── verify/              # public certificate verification
│   │   │   └── cron/                # Vercel Cron entrypoints
│   │   └── layout.tsx
│   ├── server/
│   │   ├── api/
│   │   │   ├── routers/             # tRPC procedures, one file per domain
│   │   │   └── trpc.ts              # tRPC context, middleware (auth, RBAC, audit)
│   │   ├── db.ts                    # Prisma client (singleton)
│   │   ├── auth/                    # Auth.js config + custom providers
│   │   ├── jobs/                    # pg-boss queue + handlers
│   │   ├── pdf/                     # certificate generation + signing
│   │   ├── audit/                   # audit-log writer (centralized)
│   │   ├── encryption/              # envelope encryption helpers (Aadhaar)
│   │   └── integrations/            # GST, PAN, payment, email adapters
│   ├── components/
│   │   ├── ui/                      # shadcn/ui — copied components
│   │   └── wizard/                  # WizardStepRail, DocumentUploadCard, etc.
│   ├── lib/                         # client-side helpers
│   ├── styles/
│   │   └── globals.css              # Tailwind v4 @theme block (after upgrade)
│   ├── env.js                       # t3-env Zod-validated env schema
│   └── middleware.ts                # auth + locale + region pinning
├── tests/
│   ├── unit/                         # vitest
│   └── e2e/                          # playwright
├── .github/workflows/                # CI: typecheck, test, lint, lhci
├── .env                              # local secrets (gitignored)
├── .env.example                      # documented schema
├── vercel.json                       # regions: ["bom1"], cron schedules
├── next.config.js
├── package.json
└── tsconfig.json
```

### Vercel Blob Decision Note

Document vault is hosted on **Vercel Blob** (per user decision). Vercel Blob is built on Cloudflare R2 underneath; **its data residency is not user-pinnable to India**. This is a documented compliance tradeoff that must be reflected in:

1. The DPDP Act consent statement at signup (the user is informed that document storage is by a global object-storage processor)
2. The Data Protection Impact Assessment (DPIA) prepared before production launch
3. The vendor list disclosed to CREDAI Pune as Data Fiduciary

If a future compliance review requires India-pinned storage, the document vault layer is abstracted behind an internal `BlobStorage` interface so swapping to AWS S3 (`ap-south-1`) is a localized change, not a refactor.

### Region Pinning

`vercel.json` will pin all functions to `bom1` (Mumbai) to keep request processing and database access inside India:

```json
{
  "regions": ["bom1"],
  "functions": {
    "src/app/api/**": { "maxDuration": 60 }
  },
  "crons": [
    { "path": "/api/cron/process-jobs",      "schedule": "* * * * *" },
    { "path": "/api/cron/renewal-reminders", "schedule": "0 9 * * *" },
    { "path": "/api/cron/lapse-transitions", "schedule": "0 1 * * *" },
    { "path": "/api/cron/retention-purge",   "schedule": "0 2 * * 0" }
  ]
}
```

The `process-jobs` cron fires every minute and drains the `pg-boss` queue in Neon — handling email dispatch, PDF generation, GST/PAN re-verification retries, and audit-log archival.

**Note:** Project initialization using the command above should be the first implementation story (Epic 0 / Story 0.1).

## Core Architectural Decisions

### Decision Priority Analysis

**Critical decisions (block implementation):**

- Schema organization (1.1)
- Audit log shape and tamper-evidence (1.3)
- Field-level encryption strategy (1.5)
- Session storage model (2.1)
- RBAC enforcement layer (2.4)
- Webhook idempotency pattern (3.1)
- File upload pattern (3.5)
- Email provider (5.1)
- Document-signing key custody (5.2)

**Important decisions (shape architecture):**

- Cache layer policy (1.4)
- Rate limiting backend (2.3)
- API versioning policy (3.2)
- Server vs client state split (4.1, 4.2)
- RUM strategy (4.5)
- Secrets manager (5.3)
- Backup + DR strategy (5.6, 5.7)

**Deferred to post-MVP:**

- Cache layer (1.4) — add Upstash Redis only if Postgres becomes a bottleneck
- Feature flags runtime (5.8) — env-var toggles cover Phase 1; OpenFeature + Flagsmith arrive with Phase 2
- Sentry self-host (5.4) — EU residency tier acceptable until compliance review demands India

**Deferred to client decision (PRD §Open Decisions):**

- Payment gateway (5.9) — adapter shape locked, concrete implementation post-client-pick
- GST / PAN providers (5.10) — adapter shape locked, concrete implementation post-client-pick

### Data Architecture

| Decision | Choice | Version | Rationale |
|---|---|---|---|
| Database | PostgreSQL on **Neon** (Mumbai region `ap-south-1`) | Postgres 16 (Neon-managed) | Locked in Step 3. India-resident, 35-day PITR, branch-per-PR for previews. |
| ORM | **Prisma** | 7.8.0 | Locked in Step 3. `previewFeatures = ["multiSchema"]` enabled for domain-split. |
| Validation | **Zod** | 4.3.6 | Same schemas shared client and server via tRPC. |
| Schema organization | **Domain-split** — three Prisma schemas: `prisma/public.prisma` (app data), `prisma/audit.prisma` (append-only log), `prisma/auth.prisma` (Auth.js tables). Each owned by a separate Postgres role with appropriate grants. | — | Tamper-evident audit (NFR62) enforced at the DB role level — `audit_writer` role has INSERT only, no UPDATE/DELETE. The application's primary connection string uses a role with no audit-mutation grants. |
| Soft-delete policy | **Supersession only** — no `deletedAt` columns. Documents get `supersededAt` + `supersededBy`. Members never deleted; status transitions to Lapsed. Rejected applications retained 3 years then hard-purged by lifecycle job. | — | NFR35, NFR62, FR82, FR84. |
| Audit log shape | **Hash-chained rows** in `audit.event_log`. Each row stores `prev_hash` + `row_hash = SHA-256(canonical_json(row) ‖ prev_hash)`. Nightly verification job reconstructs the chain and alerts on any break. | — | Detects retroactive edits even if a DB compromise grants `audit.audit_writer` UPDATE. NFR62, NFR65. |
| Cache layer (MVP) | **None.** Rely on Neon's compute and Postgres query cache. | — | NFR1–NFR3 achievable on Neon Mumbai for ≤ 200 concurrent sessions per NFR48. Add Upstash Redis (Mumbai) only if a real perf problem surfaces post-launch. |
| Field-level encryption | **Envelope encryption** via Node WebCrypto (`crypto.subtle`). DEKs (data encryption keys) generated per-record, wrapped by a master key held in Vercel env vars (encrypted at Vercel's secret store). **Two separate master keys**: `MEK_AADHAAR` (envelope-wraps Aadhaar DEKs) and `MEK_PII` (envelope-wraps all other PII DEKs). Master keys are versioned (`v1`, `v2`); rotation supported via re-encryption job. | — | NFR19, NFR20. Vercel-native at MVP. Localized upgrade path to AWS KMS Mumbai if compliance review demands FIPS-grade key custody. |
| Migration tooling | **Prisma Migrate** with one migration per PR. Production migrations gated on staging-deploy success. | — | Stack-native. Neon branching enables per-PR migration verification. |

### Authentication & Security

| Decision | Choice | Version | Rationale |
|---|---|---|---|
| Auth library | **Auth.js v5** (`next-auth@beta`) + `@auth/prisma-adapter` | next-auth 5.0.0-beta.31, @auth/prisma-adapter 2.11.2 | App Router-native; required for the dual-flow shape. v5-beta accepted as production risk; mitigated by SLO monitoring and pinned version. |
| Applicant flow | **Email + 6-digit OTP** via custom `EmailOtpProvider`. OTP stored hashed (SHA-256), 2-min validity (FR2), unlimited resend (FR3). Resend rate-limited via Upstash. | — | FR1–FR4. |
| Staff flow | **Email + password (bcrypt cost 12) + TOTP** via `otplib`. TOTP enrollment surface: QR code at first staff login. Recovery codes generated at enrollment, stored hashed. | bcrypt 6.0.0, otplib 12.x | FR5, NFR24. |
| Session storage | **DB-backed sessions** via Auth.js Prisma adapter. | — | NFR26 server-controlled lifetime; immediate revocation on staff disable (FR93); audit log of every session creation; impossible with stateless JWTs. |
| Session lifetime | **Staff:** 30 min idle, 8 h absolute. **Applicant:** 24 h sliding (longer window for the multi-day wizard). Sliding renewal on activity. | — | NFR26 confirmed for staff. Applicants get a longer window to prevent multi-day-wizard data loss. |
| Captcha | **Cloudflare Turnstile** on public verification page, OTP-resend, and staff login (after 3 failed attempts). | @marsidev/react-turnstile latest | NFR30, NFR31. Free, privacy-respecting, no India region issue (stateless edge). |
| Rate limiting | **`@upstash/ratelimit` + `@upstash/redis`** with Upstash India region. Token-bucket on: OTP-resend (per email), public verification (per IP), staff login (per email + IP), payment webhook (per IP), file upload (per session). | @upstash/ratelimit 2.0.8, @upstash/redis 1.37.0 | NFR30, NFR31. Serverless-native. India-resident. |
| RBAC | **tRPC middleware**: `protectedProcedure`, `staffProcedure`, `roleProcedure(['Scrutiniser'])`. Server-side enforcement on every procedure. Client-side hiding is augmentation only. | — | NFR27. |
| Audit log writer | **Centralized helper** `auditLog.write({ actor, action, target, before, after, reason, requestId })` called from every mutation tRPC procedure. Aadhaar reads logged from a dedicated `revealAadhaar()` server function. **Prisma middleware fallback** logs UPDATE/DELETE on `@@audit`-tagged tables. | — | NFR62, NFR63. Centralization prevents per-feature drift; Prisma middleware is the safety net. |
| TLS | **Vercel auto-managed** (TLS 1.3 default). HSTS via `next.config.js` `headers()`. | — | NFR18. |
| Security headers | **Hand-rolled CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy** in `middleware.ts`. CSP whitelists: Vercel Blob, Resend (for in-email tracking pixel), Cloudflare Turnstile, Sentry. | — | NFR28. |
| Password reset | **System Admin–initiated only**. No self-serve "forgot password" for staff. Applicants don't have passwords (OTP-only). | — | FR93. Reduces phishing surface; staff compromise has higher blast radius. |
| Brute-force protection | Account lockout after 5 failed staff login attempts within 15 min; exponential backoff on OTP resend abuse (≥ 3 attempts in 5 min triggers Turnstile). | — | NFR31. |

### API & Communication Patterns

| Decision | Choice | Version | Rationale |
|---|---|---|---|
| Internal API | **tRPC v11** with Zod input validation; routers organized one-per-domain (`applicationRouter`, `memberRouter`, `paymentRouter`, etc.) under `src/server/api/routers/`. | @trpc/server 11.16.0 | End-to-end type safety; Zod schemas shared with React Hook Form. |
| External REST | **Next.js Route Handlers** for: payment-gateway webhooks (`/api/webhooks/payment`), public certificate verification (`/api/verify/v1/[number]`), file upload signed URL grant (`/api/upload/sign`), cron entrypoints (`/api/cron/*`). | — | Webhook signature schemes, public unauthenticated endpoints, multipart streaming, and cron triggers don't fit tRPC cleanly. |
| Error format | tRPC `TRPCError` with codes (`UNAUTHORIZED`, `FORBIDDEN`, `BAD_REQUEST`, `NOT_FOUND`, `CONFLICT`, `TOO_MANY_REQUESTS`, `INTERNAL_SERVER_ERROR`). REST handlers use `{ error: { code, message, details? } }` JSON shape, status codes match. | — | Predictable for client error-handling code; Sentry breadcrumb-friendly. |
| Webhook idempotency | **Postgres `webhook_idempotency` table** keyed on `(provider, event_id)`. Every webhook handler `INSERT … ON CONFLICT DO NOTHING` first; if conflict, return 200 without reprocessing. | — | NFR17. No Redis dependency. Works for any webhook provider. |
| API versioning | **Internal tRPC: no versioning** (single deployment, no external consumers). **Public verification: `/api/verify/v1/[membership-number]`** — stable URL for QR codes already in the wild. | — | YAGNI for internal; QR codes are durable artifacts demanding a stable contract. |
| OpenAPI for external endpoints | **Generated from Zod schemas** via `zod-to-openapi`; served at `/api/openapi.json`. Documents the public verification endpoint, webhooks, and (Phase 2) ERP integration surface. | — | Single source of truth; avoids hand-maintained spec drift. |
| Long-running operations | **Job-queue pattern via pg-boss.** PDF generation, GST/PAN re-verification, email dispatch, retention purge → enqueued; UI polls or subscribes for completion. | pg-boss 12.18.1 | Vercel function 60s limit; NFR16 retry semantics. |
| File upload | **Direct-to-Vercel-Blob via signed URL.** Client calls `getSignedUploadUrl()` (tRPC), gets a one-time URL + token, uploads directly to Blob. Server records the blob URL in DB after upload completes. | @vercel/blob 2.3.3 | Avoids 4.5 MB Vercel function body limit; better UX for the 10–15+ document uploads per applicant. |

### Frontend Architecture

| Decision | Choice | Version | Rationale |
|---|---|---|---|
| Framework | **Next.js** App Router | 16.2.4 (post-scaffold upgrade from create-t3-app's 15) | Locked in Step 3. Pinned to `bom1` via `vercel.json`. |
| Styling | **TailwindCSS v4** with CSS-first config (`@theme` block in `src/styles/globals.css`); CREDAI brand tokens defined as CSS custom properties. | tailwindcss 4.2.4 | Locked in Step 3. v4's CSS-first config replaces v3's `tailwind.config.ts`. |
| Components | **shadcn/ui** copied into `src/components/ui/`; CREDAI brand tokens applied via Tailwind theme. | shadcn 4.5.0 (CLI) | Locked in Step 3 + UX spec. |
| Forms | **React Hook Form** + **Zod** via `@hookform/resolvers/zod`; same Zod schemas drive client validation and tRPC input parsing. | react-hook-form 7.74.0 | UX spec; eliminates client/server schema drift. |
| Server state | **TanStack Query v5** wrapping tRPC client; default options: `staleTime: 30s`, `retry: 2`, `refetchOnWindowFocus: false`. | @tanstack/react-query 5.100.5 | Stack-standard pairing. tRPC v11 has first-class TanStack Query integration. |
| Client state | **Zustand v5** with `persist` middleware backed by `sessionStorage` for ephemeral UI state (current wizard step, autosave indicator, unsaved-changes flag). Server is the source of truth for application data via tRPC. | zustand 5.0.12 | UX spec calls for `useWizardState`. Minimal, no boilerplate. |
| Animations | **framer-motion** for `<ConditionalFieldGroup>` reveals only. No app-wide animation library. | latest | UX spec; fade + slide-down/up; reserved-space transitions to avoid layout shift. |
| Toasts | **Sonner** for autosave indicator, upload success, validation feedback. Position: top-right (per UX spec). | latest | UX spec. |
| i18n | **`next-intl`** with `en.json` from day one. All user-facing copy externalized. Marathi / Hindi added in Phase 3 as new locale files (no UI rewrites). | latest | NFR55 future-readiness; English-only at MVP. |
| Code splitting | **Route-segment level** (App Router default) + `dynamic(() => …)` for staff dashboard charts and bulk-export tables; applicant bundles never carry staff-only code. | — | NFR5: ≤ 250 KB initial / ≤ 100 KB per chunk. |
| Image strategy | `next/image` for all UI assets; `<img>` with signed Vercel Blob URLs for vault documents. WebP/AVIF served for static brand assets. | — | UX spec §Image strategy. |
| RUM | **`web-vitals` package** → custom `POST /api/rum` → pg-boss job → Postgres. Aggregate dashboards built later. **Not** Vercel Speed Insights (US-hosted control plane). | web-vitals latest | NFR58. India-resident. Zero new vendors. |
| Charts | **Recharts** for the four staff dashboards (Operational, Member, Payment, KPI). Lazy-loaded via `dynamic`. | latest | Mature, accessible (SVG with `aria-label`), minimal deps. |
| Wizard step rail | Custom `<WizardStepRail />` per UX spec; Direction C dark sidebar layout for applicant; Direction D 3-column for staff review. | — | UX spec §Design Direction Decision. |
| Accessibility tooling | **`@axe-core/react`** in dev console; **Lighthouse CI** gating PRs at a11y score ≥ 90. NVDA + VoiceOver smoke before each release that touches wizard or staff review. | latest | NFR41–NFR47. |

### Infrastructure & Deployment

| Decision | Choice | Version | Rationale |
|---|---|---|---|
| Hosting (frontend + API) | **Vercel** Pro tier, region-pinned to `bom1` (Mumbai) via `vercel.json`. | — | Locked in Step 3. India-resident compute. Documented residency tradeoff: Vercel control plane, build infra, and centralized logs flow through US — disclosed in DPDP consent + DPIA. |
| Database | **Neon Postgres** (Mumbai region `ap-south-1`), Pro tier for 35-day PITR. | — | Locked in Step 3. |
| Object storage | **Vercel Blob** for the document vault. Per-user decision; documented as cross-border data processor in DPDP consent + DPIA + vendor list. Abstracted behind internal `BlobStorage` interface for future S3-Mumbai swap if compliance demands. | @vercel/blob 2.3.3 | User decision (Step 3); operational simplicity vs. residency tradeoff acknowledged. |
| Cron + workers | **Vercel Cron** + **pg-boss** queue inside Neon. Cron fires `/api/cron/process-jobs` every minute to drain the queue (300 s function budget per tick). Other crons fire scheduled jobs directly: `renewal-reminders` (09:00 IST daily), `lapse-transitions` (01:00 IST daily), `retention-purge` (02:00 IST Sunday), `audit-chain-verify` (03:00 IST daily). | pg-boss 12.18.1 | Locked in Step 3. India-resident. No third-party orchestrator. |
| Email | **Resend** with `react-email` for templates. Free tier (3,000 emails/month) covers MVP scale; upgrade to Pro ($20/month, 50k emails) if volume requires. **Disclosed as cross-border data processor** in DPDP consent + DPIA. | resend 6.12.2, @react-email/components 1.0.12 | User cost constraint. React Email lets us author transactional emails as React components with shared design tokens. Sub-second OTP delivery to India per Resend docs. |
| Document-signing key custody | **AWS KMS (`ap-south-1`)** asymmetric key: RSA-3072 sign-only, key never leaves the HSM. PDF signing happens via `signpdf` calling KMS `Sign` API. CloudTrail records every signature. Key rotation via versioning. | @aws-sdk/client-kms 3.1037.0 | NFR65, NFR22. India-resident, HSM-backed, per-signature audit trail. ~₹100/month + ~₹0 for our volume. |
| Field-level encryption KEKs | **Phase 1: Vercel env vars** for `MEK_AADHAAR` and `MEK_PII` (separate keys). **Phase 2 upgrade path: AWS KMS Mumbai** with `GenerateDataKey` API (envelope-encryption-as-a-service). | — | Stays free at MVP; localized upgrade path. NFR19, NFR20. |
| Secrets manager | **AWS Secrets Manager (`ap-south-1`)** holds: KMS access keys, Resend API key, payment gateway secret, GST/PAN provider keys, Sentry DSN, Upstash Redis URL. Vercel env vars hold *only* the Secrets Manager IAM credentials. ~₹350/month for ~10 secrets. | @aws-sdk/client-secrets-manager 3.1037.0 | NFR22. Centralized rotation, audit trail. |
| Error tracking | **Sentry** with EU data residency tier (`*.de.sentry.io`) for MVP. Phase-2 candidate: self-hosted GlitchTip in Mumbai if compliance review demands. Disclosed as cross-border processor in DPIA. | @sentry/nextjs 10.50.0 | NFR60. EU residency is the closest Sentry option. |
| Structured logs | **`pino`** → custom `POST /api/logs` (batched, sampled) → Postgres `audit.application_log` table. Logs PII-scrubbed at the redaction layer (Aadhaar, PAN, OTP, document content). | pino latest | NFR23, NFR56. India-resident. |
| Synthetic monitoring | **Better Stack** (Better Uptime) — public-endpoint-only checks, no PII access. Free tier covers MVP. | — | NFR59. Public-surface-only checks side-step the residency question. |
| Backup — DB | **Neon PITR** (35 days, Pro tier) + **quarterly full-snapshot export** to private S3 (`ap-south-1`). | — | NFR12, NFR13. Defense in depth. |
| Backup — Vault | Vercel Blob versioning is *not* a backup. Add nightly pg-boss job that lists vault objects and writes a manifest to a separate Vercel Blob bucket; documents themselves are immutable post-upload. Quarterly: replicate to private S3 (`ap-south-1`). | — | NFR12. Vault is the most critical asset; 7+ years retention demands defense in depth. |
| DR | **MVP target met by Vercel + Neon defaults.** Vercel multi-region failover automatic. Neon PITR ≤ 1 min granularity meets RPO ≤ 1 h; Neon read-replica failover meets RTO ≤ 24 h. **Documented runbook** for full-region Mumbai outage: failover Neon to Singapore read-replica — accepts brief residency exception during DR per industry-standard force-majeure pattern. | — | NFR12. |
| Feature flags (MVP) | **Environment-variable toggles** (`MAHARERA_LIVE_VERIFICATION_ENABLED`, `BULK_STAFF_ACTIONS_ENABLED`, etc.) in Vercel env. OpenFeature + Flagsmith deferred to Phase 2 when runtime control becomes necessary. | — | YAGNI for Phase 1. |
| CI | **GitHub Actions** runs on every PR: typecheck (`tsc --noEmit`), unit tests (vitest), E2E smoke (playwright on a Neon preview branch), Lighthouse CI (a11y ≥ 90), Prisma migrate verify. | — | NFR41, NFR60. |
| Deployment | **Vercel auto-deploy.** `main` → production, `staging` branch → staging environment, every PR → preview URL with its own Neon branch. Production deploys gated on staging-deploy success + manual approval. | — | NFR12. Industry-standard release pipeline. |
| Environments | Production (`main`) · Staging (`staging`) · Preview (per-PR) · Local (`pnpm dev`). Staging mirrors production data shape with synthetic data only (PRD §Web Application Specific Requirements). | — | PRD constraint. |
| Payment gateway | **Adapter shape locked; concrete implementation deferred to client (PRD Open Decision #2).** Adapter interface: `initiatePayment()`, `verifyWebhookSignature()`, `parseWebhook()`, `refund()`. Implementations swappable across Razorpay / PayU / CCAvenue / BillDesk / Cashfree. | — | NFR53. PRD constraint. |
| GST / PAN providers | **Adapter shape locked; concrete implementation deferred to client.** Adapter interface: `verifyGSTIN()`, `verifyPAN()` returning a normalized result. Provider chosen during Epic 0 once sandbox credentials are available. | — | NFR51, NFR52, NFR55. |

### Decision Impact Analysis

**Implementation sequence (Epic 0 — foundation):**

1. `pnpm create t3-app@latest` (Step 3) — scaffold the app
2. Post-scaffold dependency upgrades + additions (Step 3 dependency list)
3. Provision Neon project (Mumbai region) + create `public`, `audit`, `auth` schemas with role grants
4. Provision Vercel project + link Neon + Vercel Blob
5. Provision AWS account (`ap-south-1`) + IAM users for KMS, Secrets Manager, S3
6. Implement `Context` + `protectedProcedure` + `staffProcedure` + `auditLog.write()` together — these three pieces interlock
7. Implement `EncryptionService` (envelope encryption with `MEK_AADHAAR` + `MEK_PII`)
8. Implement `BlobStorage` adapter (Vercel Blob behind interface)
9. Implement `PaymentGatewayAdapter` interface + mock implementation (concrete impl post-client-pick)
10. Implement `EmailService` adapter (Resend behind interface)
11. Implement `JobQueue` (pg-boss wrapper) + `/api/cron/process-jobs` cron handler
12. Implement `RateLimiter` (Upstash) + apply to OTP-resend, public verify, staff login, file upload
13. Wire CSP + HSTS + security headers in `middleware.ts`

**Cross-component dependencies:**

- `Context` (server) ← `protectedProcedure` ← `staffProcedure` ← `roleProcedure`. Every tRPC mutation depends on `Context` being correctly populated; therefore `Context` must be implemented first and stabilized before any feature router is written.
- `auditLog.write()` ← every mutation procedure. Failure to call it is a security regression; enforce via a unit test that walks every router and asserts presence.
- `EncryptionService` ← Aadhaar field setters/getters in Prisma. Cannot save Aadhaar to DB until envelope encryption is in place.
- `BlobStorage` ← document upload route + vault retrieval. Cannot accept document uploads until adapter is wired.
- `JobQueue` ← email dispatch, PDF generation, GST/PAN re-verification. All async paths depend on this.
- `RateLimiter` ← OTP-resend route + public verify route + staff login route + file upload route. All abuse-vector paths depend on this.

**Operational alerts (NFR60) added by these decisions:**

- `audit_log_chain_breaks > 0` — hash-chain verification job detects retroactive edits
- `kms_signing_failure_rate > 1%` — certificate issuance broken
- `resend_api_failure_rate > 5%` — OTP / notification delivery degraded
- `pg_boss_dead_letter_queue_size > 100` — job processing backed up
- `vercel_function_region_drift` — function executed outside `bom1`
- `aws_secrets_manager_iam_failure` — secret-fetch breaking new requests

### Cost Posture (MVP)

Approximate monthly cost at MVP scale (≤ 500 active members, ≤ 200 concurrent applicant sessions):

| Component | Cost (~INR / month) | Notes |
|---|---|---|
| Vercel Pro | ~₹1,700 | Required for `bom1` region pinning, longer function durations |
| Neon Pro | ~₹1,700 | 35-day PITR, scale-to-zero compute |
| Vercel Blob | ~₹400–800 | Pay-as-you-go; ~5 GB / 100k operations at MVP scale |
| Upstash Redis | Free tier | 10k commands/day covers MVP rate-limit volume |
| Resend | Free tier | 3,000 emails/month |
| AWS KMS | ~₹100 | 1 signing key + ~hundreds of operations/month |
| AWS Secrets Manager | ~₹350 | 10 secrets |
| AWS S3 (backup) | ~₹100 | Few GB, infrequent access |
| Sentry Team | ~₹2,200 | EU residency tier, error tracking |
| Better Stack | Free tier | Public-endpoint synthetic checks |
| **Total** | **~₹6,500–7,000 / month** | Scales linearly with member growth |

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

The chosen stack has approximately 30 decision points where AI agents could make divergent-but-defensible choices. Every such point is fixed below as a binding rule. Anything not listed is allowed to vary — but if it varies in ways that cause friction, it gets added here.

### Naming Patterns

#### Database (Postgres + Prisma)

| Element | Convention | Example |
|---|---|---|
| Table names | `snake_case`, **plural** | `applications`, `audit_events` |
| Column names | `snake_case` | `firm_name`, `submitted_at` |
| Foreign keys | `<referenced_table_singular>_id` | `application_id`, `member_id` |
| Indexes | `idx_<table>_<columns>` | `idx_applications_status_submitted_at` |
| Unique constraints | `uq_<table>_<columns>` | `uq_payments_provider_reference_number` |
| Enums | `<domain>_<thing>_enum` (DB), PascalCase (Prisma model) | DB: `application_status_enum`; TS: `ApplicationStatus` |
| Junction tables | `<a>_<b>` alphabetical | `applications_documents` |
| Schemas | Lowercase, single word | `public`, `audit`, `auth` |

Prisma models stay **PascalCase singular** (`Application`, `Member`); tables become snake_case plural via `@@map`. Columns become snake_case via `@map`. TypeScript-side stays camelCase; the Prisma client handles the translation.

#### tRPC Procedures

| Action | Verb prefix | Example |
|---|---|---|
| Read single | `get` | `member.getById` |
| Read list | `list` | `application.list` |
| Read derived/aggregated | `summarize` / `count` / `aggregate` | `dashboard.summarizeOperational` |
| Create | `create` | `application.create` |
| Update | `update` | `application.updateField` |
| Delete (rare — supersede instead) | `archive` / `revoke` | `member.revoke` |
| Workflow transitions | imperative verb | `application.approve`, `application.raiseObjection` |
| Side-effecting actions | imperative verb | `application.submit`, `payment.refund` |

Procedures are **camelCase**. Routers are **camelCase singular** + `Router` suffix in code (`applicationRouter`), but mounted at the camelCase singular namespace in the client (`api.application.list`).

#### REST Endpoints (Route Handlers)

REST routes are **kebab-case**, lowercase, plural where they represent collections:

- `/api/webhooks/payment` (provider-agnostic webhook receiver)
- `/api/verify/v1/[membership-number]` (path param kebab-case)
- `/api/upload/sign`
- `/api/cron/process-jobs`, `/api/cron/renewal-reminders`, etc.
- `/api/rum`, `/api/logs` (telemetry)
- `/api/openapi.json`

#### Files & Directories

| File type | Convention | Example |
|---|---|---|
| React components | `PascalCase.tsx` | `WizardStepRail.tsx`, `DocumentUploadCard.tsx` |
| Route segments (App Router) | `lowercase` | `app/(applicant)/wizard/page.tsx` |
| Route groups | `(parens)` | `(public)`, `(applicant)`, `(staff)` |
| Server-only modules | `kebab-case.ts` | `audit-log.ts`, `rate-limiter.ts`, `encryption-service.ts` |
| Tests | `<file>.test.ts` co-located, `<file>.spec.ts` for E2E | `audit-log.test.ts` (unit), `wizard.spec.ts` (e2e) |
| Hooks | `use<X>.ts` | `useWizardState.ts`, `useDebouncedAutoSave.ts` |
| Types | `<domain>.types.ts` | `application.types.ts` |
| Zod schemas | `<domain>.schema.ts` | `application.schema.ts` |
| Constants | `<domain>.constants.ts` | `application.constants.ts` |
| Index/barrel files | `index.ts` (only at directory roots that need a public surface) | |

#### Code-level naming

| Element | Convention | Example |
|---|---|---|
| Variables, functions | `camelCase` | `submitApplication`, `currentStep` |
| Constants (true constants, not config) | `SCREAMING_SNAKE` | `MAX_FILE_SIZE_BYTES`, `OTP_VALIDITY_MS` |
| React components | `PascalCase` | `<DocumentUploadCard />` |
| TypeScript types/interfaces | `PascalCase`, **no `I` prefix** | `Application`, `WorkflowAction` |
| Generic type parameters | Single capital letter or `T<Name>` | `T`, `TInput`, `TOutput` |
| Booleans | `is/has/can/should` prefix | `isSubmitting`, `hasUnsavedChanges`, `canEdit` |
| Event handlers (props) | `on<Event>` | `onSubmit`, `onStepChange` |
| Event handlers (impl) | `handle<Event>` | `handleSubmit`, `handleStepChange` |
| Async functions | Verb-led, no `Async` suffix | `fetchMember()` not `fetchMemberAsync()` |
| Boolean DB columns | `is_<state>` or `<state>_at` (timestamp) | `is_locked`, `submitted_at`, `approved_at` |

### Structure Patterns

#### Where things go (rules of thumb)

| If the code… | It lives in… |
|---|---|
| Renders to the client | `src/app/`, `src/components/`, `src/lib/`, `src/hooks/` |
| Touches the database | `src/server/` (Prisma client only imported here) |
| Wraps an external service | `src/server/integrations/<service>/` |
| Validates user input | `src/server/schemas/<domain>.schema.ts` (Zod) |
| Generates a tamper-evident artifact (PDF, signed URL) | `src/server/pdf/` or via `BlobStorage.getSignedUrl()` |
| Runs on a schedule / from a queue | `src/server/jobs/handlers/<job>.ts` |
| Is a Tailwind brand token | `src/styles/globals.css` `@theme` block |
| Is a route handler (REST) | `src/app/api/<route>/route.ts` |
| Is a tRPC procedure | `src/server/api/routers/<domain>.ts` |
| Is an email template | `emails/<event>.tsx` (react-email) |

#### Tests

- **Unit tests:** **co-located** as `<file>.test.ts` next to the file under test (closer = more likely to be updated). Vitest auto-discovers.
- **E2E tests:** centralized in `tests/e2e/` with one file per user journey (`tests/e2e/applicant-ordinary-membership.spec.ts`, etc.). Playwright. Run against a Neon preview branch.
- **Schema tests:** Zod schemas tested directly via Vitest property-based assertions; do not duplicate input validation tests at the tRPC router level.
- **Audit assertion test:** one centralized test walks `appRouter` and asserts every mutation procedure includes a call to `auditLog.write()`. Failing this test blocks the build.

### Format Patterns

#### API Response Shapes

**tRPC procedures return data directly** — no wrapper. Errors thrown as `TRPCError` with codes; the tRPC client surfaces them as `TRPCClientError` with `.data.code`, `.message`, `.data.zodError` (for `BAD_REQUEST` from Zod validation).

```typescript
// ✅ correct
return application;

// ❌ never
return { data: application, error: null };
```

**REST handlers** return:

```typescript
// success
return NextResponse.json(payload, { status: 200 });

// error
return NextResponse.json(
  { error: { code: "RATE_LIMITED", message: "Too many requests" } },
  { status: 429 },
);
```

**REST status code map (binding):**

- `200` — success with body
- `201` — created (POST that produced a new resource)
- `204` — success, no body
- `400` — Zod validation failed (`error.code = "VALIDATION_ERROR"`, `error.details` carries the Zod issues)
- `401` — unauthenticated
- `403` — authenticated but forbidden by RBAC
- `404` — resource not found
- `409` — idempotency conflict / state conflict
- `422` — semantic validation failure (e.g., GST verification failed)
- `429` — rate limit exceeded
- `500` — unexpected — Sentry alert fires

#### Data Formats

| Concept | Wire format | Storage | UI display |
|---|---|---|---|
| Date / timestamp | ISO 8601 UTC string (`2026-04-27T10:30:00.000Z`) via superjson | `timestamptz` in Postgres (UTC) | `DD/MM/YYYY` for dates, `DD/MM/YYYY HH:mm IST` for timestamps; relative ("3 days ago") on dashboards |
| Money (amount) | Integer **paise** | `BIGINT` paise | `₹1,29,800` (Indian grouping) via `Intl.NumberFormat('en-IN')` |
| Currency code | `"INR"` only | not stored (always INR) | omitted (₹ symbol implies INR) |
| GST rate | Integer percent (`18`) | `SMALLINT` | "18 %" |
| Phone | E.164 (`+919876543210`) | text | `+91 98765 43210` |
| PAN | Plain text uppercase (`ABCDE1234F`) | text | shown to authorized staff verbatim |
| Aadhaar | **Encrypted** at rest (envelope); accessed via `revealAadhaar()` | bytea | masked `XXXX-XXXX-1234` by default |
| Pincode | 6-digit string (preserves leading zero) | char(6) | as-is |
| Membership Number | `CPN/{ORD\|ASC\|RERA}/{YYYY}/{seq}` | text | as-is |
| Boolean | `true` / `false` | boolean | "Yes" / "No" or icon |
| Null vs undefined | Explicit `null` for unset | `NULL` | "—" or hidden |
| Enums | string literal union (`"DRAFT" \| "SUBMITTED" \| ...`) | enum type | localized via i18n |
| File size | bytes (number) | int | `2.4 MB` via custom formatter |
| Decimal precision | always integers (paise, basis points) — never floating point | numeric where unavoidable, otherwise integers | format at edge |

#### JSON field naming

- **API (tRPC + REST):** `camelCase` (`firmName`, `submittedAt`)
- **Database (via `@map`):** `snake_case` (`firm_name`, `submitted_at`)
- **Configuration files (`.json`, `vercel.json`):** as the tool requires

#### Zod schemas as the single source of truth

Every shape that crosses a boundary (form input, tRPC input, REST body, config file, env var) has a Zod schema in `src/server/schemas/`. The schema file exports both the Zod object and the inferred TypeScript type:

```typescript
// src/server/schemas/application.schema.ts
import { z } from "zod";

export const submitApplicationInput = z.object({
  membershipType: z.enum(["ORDINARY", "ASSOCIATE", "RERA_PROJECT"]),
  firmName: z.string().min(1).max(200),
  // ...
});

export type SubmitApplicationInput = z.infer<typeof submitApplicationInput>;
```

The same schema is imported by:
- The React Hook Form resolver on the client
- The tRPC procedure's `.input(submitApplicationInput)` on the server

Never duplicate.

### Communication Patterns

#### Domain events (audit log + future event bus)

Event names: **lowercase, dot-separated, past-tense verb**.

| Pattern | Example |
|---|---|
| `<aggregate>.<state-change>` | `application.submitted`, `application.approved`, `member.lapsed`, `payment.reversed`, `certificate.issued`, `certificate.revoked` |
| `<aggregate>.<sub>.<state-change>` (when scoped) | `application.document.uploaded`, `application.field.edited` |

Audit-log entries have a stable shape (`audit.event_log`):

```typescript
{
  id: string;             // cuid2
  occurredAt: Date;       // server clock
  actor: {
    type: "USER" | "SYSTEM" | "JOB" | "EXTERNAL";
    userId?: string;      // when type="USER"
    role?: string;        // when type="USER"
  };
  action: string;         // e.g. "application.approved"
  target: {
    type: string;         // e.g. "Application"
    id: string;
  };
  before?: unknown;       // present on update/edit events
  after?: unknown;        // present on update/edit events
  reason?: string;        // staff reason for objection / rejection / edit
  requestId?: string;     // links to application_log row
  prevHash: string;       // chain
  rowHash: string;        // SHA-256(canonical(this row sans rowHash) ‖ prevHash)
}
```

`auditLog.write()` is the **only** path to insert into `audit.event_log`. Direct Prisma `prisma.auditEvent.create({})` calls are a build-time lint error.

#### Logging

`pino` with a fixed structure:

```typescript
log.info({
  requestId,           // from tRPC context / Route Handler header
  userId,              // string | "anonymous"
  action,              // tRPC procedure name or REST route
  outcome: "success" | "validation_error" | "auth_error" | "server_error",
  latencyMs,
  // domain-specific fields ad-hoc, but NEVER PII
}, "human-readable summary");
```

**Levels:**
- `error` — unhandled exceptions, broken invariants, alert-worthy
- `warn` — handled-but-unexpected (rate-limit hit, external API soft-fail)
- `info` — normal request log (one per tRPC call / Route Handler hit)
- `debug` — local-only; never emitted in production
- `trace` — never emitted

**Forbidden in log payloads:** `aadhaar`, `pan`, `otp`, `password`, `tokens`, `document_content`, `card_*`, `cvv`. The pino redaction config strips these at serialization time as a defense-in-depth net.

#### State management

- **Server state** — TanStack Query keys are arrays starting with the tRPC procedure path: `['application.list', { status: 'SUBMITTED' }]`. Generated automatically by `@trpc/react-query`; do not hand-roll.
- **Client state** — Zustand store per concern (`useWizardStore`, `useStaffFiltersStore`). Stores are **flat** (no deep nesting); selectors used to derive views.
- **Form state** — owned by React Hook Form within the form scope. Not duplicated in Zustand. Submission triggers a tRPC mutation that updates server state, which TanStack Query invalidates as appropriate.
- **URL state** — filters, pagination, current step → URL search params via Next.js `useSearchParams`. Avoid duplicating in stores. Wizard step is in URL (`/apply/[step]`).
- **Cookie state** — only the auth session cookie (Auth.js-managed) and locale preference.

State updates are always **immutable** (Zustand uses Immer under the hood when needed; React state setters always copy).

### Process Patterns

#### Error handling

**Server (tRPC procedure):**

```typescript
// validation
throw new TRPCError({ code: "BAD_REQUEST", message, cause: zodError });

// auth
throw new TRPCError({ code: "UNAUTHORIZED" });
throw new TRPCError({ code: "FORBIDDEN", message: "Scrutiniser role required" });

// state conflict
throw new TRPCError({ code: "CONFLICT", message: "Application already submitted" });

// external dependency soft-fail
throw new TRPCError({ code: "PRECONDITION_FAILED", message: "GST verification pending — try again" });

// unexpected
throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", cause: err });
```

Every `INTERNAL_SERVER_ERROR` triggers a Sentry capture with the original cause. Errors handled via `cause:` chaining, not string concatenation.

**Server (REST Route Handler):**

Catch in a single `try/catch` per handler; convert to the standard error JSON shape (see Format Patterns). `catch` block is the only place that calls `Sentry.captureException`.

**Client (React component):**

- TanStack Query mutations: `useMutation({ onError: (err) => toast.error(...) })` — never silent.
- TanStack Query queries: `if (query.error) return <ErrorBoundary />` — render an error state, never crash.
- Form validation errors: surfaced inline via React Hook Form `formState.errors` — never as toast.
- Network errors during a tRPC mutation: distinct toast ("Connection lost — please retry") with explicit Retry button.

**App-level error boundary:** `src/app/global-error.tsx` (Next.js convention). Captures top-level renders that throw; logs to Sentry; presents a recover-or-go-home UI.

#### Loading states

| Surface | Loading affordance |
|---|---|
| Initial page load (server data) | shadcn `<Skeleton />` matched to final layout to avoid CLS |
| Inline mutation | Button enters disabled + spinner state; rest of UI stays interactive |
| Critical mutation (submit, approve) | Modal overlay or full-form disable until resolved |
| Background work (PDF generation, GST re-verify) | Status pill on the application row; no blocking UI |
| Wizard auto-save | `<AutoSaveIndicator />` micro-component (idle / saving / saved / error) |
| File upload | Per-document progress bar + status chip |

State naming on the client: TanStack Query's `isPending` (renamed from `isLoading` in v5) for queries; `isPending` for mutations. **Do not re-derive** as `loading` boolean — use the library's primitives.

#### Validation timing

- **On change** — never. Premature errors create anxiety (UX spec §Feedback Patterns).
- **On blur** — yes. Field-level inline error appears.
- **On submit (Next button)** — yes. All fields in current step validated; first invalid field receives focus.
- **On server (tRPC `.input(schema)`)** — always, even when the client validated. Defense in depth.

#### Idempotency

- **Webhooks** — `webhook_idempotency` table; `INSERT ON CONFLICT DO NOTHING` first.
- **Critical client mutations** (payment initiation, application submit) — client generates a UUID v4 mutation ID, sent as a header (`X-Idempotency-Key`); server stores in `mutation_idempotency` table with the response, returns cached response on retry.
- **Cron jobs** — guarded by `SELECT … FOR UPDATE SKIP LOCKED` on the queue row to prevent double-processing under concurrent worker invocation.
- **Email dispatch** — keyed on `(template, recipient_id, dedup_key)` so a retry of the same job doesn't send a second email.

#### Retry policy

| Operation | Retry policy |
|---|---|
| TanStack Query queries | 2 retries, exponential backoff (default) |
| TanStack Query mutations | **No auto-retry** (could double-write); user-explicit only |
| pg-boss jobs (default) | 5 retries, exponential backoff (1s, 4s, 16s, 64s, 256s) |
| pg-boss jobs (email) | 10 retries (renewal reminders are critical per NFR16) |
| External API calls (GST/PAN) | 3 retries with circuit breaker; on circuit open, return `PRECONDITION_FAILED` immediately |
| Webhook receivers (return 5xx) | Provider's own retry policy honored; idempotency table absorbs duplicates |

#### Authentication flow

- **Applicant signup/login:** `EmailOtpProvider` issues OTP via Resend; OTP hashed and stored with 2-min expiry; verification sets a server-side session row. Resend rate-limited via Upstash (5 OTPs / 15 min / email).
- **Staff login:** `CredentialsProvider` checks `email + bcrypt password`; on success, demands TOTP via `otplib`; both must verify in one transaction. Failed attempts → Upstash counter; lockout at 5/15min.
- **Session handling:** every request has `auth()` called by middleware; `Context` populated with `user` + `role`; tRPC `protectedProcedure`/`staffProcedure` reads from `ctx.user`.
- **Logout:** Auth.js's `signOut()` — deletes the DB session row and clears the cookie. `auditLog.write({ action: "session.terminated" })` always.

### Concurrency & ordering

- **Optimistic UI updates** — only on idempotent client mutations (toggle, mark-read). Never on payment, submission, approval. Defaults to pessimistic.
- **Database transactions** — wrapped via Prisma `$transaction([...])`. Workflow transitions (Approve / Raise Objection / Reject) MUST run inside a single transaction that updates the application + writes the audit log + enqueues the resulting job.
- **Job dependencies** — pg-boss `singleton: true` for jobs that must not run concurrently with themselves (e.g., `audit-chain-verify`).

### Enforcement Guidelines

#### What every AI agent MUST do

1. Use **Zod schemas from `src/server/schemas/`** as the single source of truth for any boundary-crossing shape. Never inline-define a parsing schema in a component or procedure.
2. Call **`auditLog.write()`** in every mutation tRPC procedure that changes domain state. The audit-coverage test will fail the build otherwise.
3. Use **`pino`** for any non-trivial logging. `console.log` in production code is a lint error.
4. Import the **Prisma client** only from `src/server/db.ts` — never instantiate elsewhere.
5. Use **TanStack Query's primitives** (`isPending`, `error`, `refetch`) — do not derive parallel `loading` booleans.
6. Use **shadcn/ui components** from `src/components/ui/` rather than introducing a second component library.
7. **Server-only modules** (anything in `src/server/`) must not be imported by client components. Enforced by `import/no-restricted-paths` ESLint rule.
8. **Aadhaar reads** go through `revealAadhaar()` only. Direct `prisma.applicant.findUnique({ select: { aadhaar: true } })` is forbidden.
9. All tRPC mutations use `protectedProcedure` or stricter. Only the public verification REST handler is anonymous, and only for `GET`.
10. Tests for any new feature: at least one Vitest unit covering the happy path + one Vitest covering an edge case + one Playwright E2E for any new user journey.

#### Lint rules (ESLint custom + plugins)

The following are enforced in CI (`pnpm lint` blocks PR merge):

- `@typescript-eslint/no-explicit-any` — error
- `@typescript-eslint/strict-boolean-expressions` — error
- `import/no-restricted-paths` — server modules can't be imported from client
- `no-console` — error (allow `console.error` only)
- `@typescript-eslint/no-floating-promises` — error
- Custom rule **`require-audit-on-mutation`** — every tRPC mutation procedure body must contain a call expression matching `auditLog.write(...)`. Implemented as a custom ESLint rule under `tools/eslint-rules/`.
- Custom rule **`no-direct-prisma-outside-server`** — `import { prisma } from …` is allowed only from `src/server/**`.
- Custom rule **`no-direct-aadhaar-access`** — direct field access on the encrypted Aadhaar column is flagged; only `revealAadhaar()` may read it.

#### Pre-commit / CI gates

- `pnpm typecheck` — `tsc --noEmit` strict mode
- `pnpm lint` — ESLint
- `pnpm format` — Prettier (auto-fix in pre-commit)
- `pnpm test` — Vitest, including the audit-coverage assertion test
- `pnpm test:e2e` — Playwright (against Neon preview branch)
- `pnpm lhci` — Lighthouse CI ≥ 90 a11y on critical paths

Husky pre-commit runs typecheck + lint + format. Full test suite gates the PR merge in GitHub Actions.

### Pattern Examples

#### Good: a tRPC mutation procedure

```typescript
// src/server/api/routers/application.ts
export const applicationRouter = createTRPCRouter({
  approve: scrutiniserProcedure
    .input(approveApplicationInput) // Zod from schemas/
    .mutation(async ({ ctx, input }) => {
      return ctx.db.$transaction(async (tx) => {
        const before = await tx.application.findUniqueOrThrow({ where: { id: input.applicationId } });
        if (before.status !== "UNDER_SCRUTINY") {
          throw new TRPCError({ code: "CONFLICT", message: "Wrong stage" });
        }
        const after = await tx.application.update({
          where: { id: input.applicationId },
          data: { status: "AT_CONVENOR", lastTransitionAt: new Date() },
        });
        await auditLog.write({
          actor: { type: "USER", userId: ctx.user.id, role: ctx.user.role },
          action: "application.approved",
          target: { type: "Application", id: input.applicationId },
          before,
          after,
          reason: input.notes,
          requestId: ctx.requestId,
        }, tx);
        await ctx.queue.send("notify-convenor", { applicationId: input.applicationId });
        return after;
      });
    }),
});
```

#### Anti-pattern (do not do this)

```typescript
// ❌ Inline Zod (use src/server/schemas/)
.input(z.object({ applicationId: z.string() }))

// ❌ No transaction wrapping the update + audit
await prisma.application.update({...});
await auditLog.write({...});  // could persist without the update on failure

// ❌ Direct prisma import outside src/server/
import { prisma } from "~/server/db"; // inside src/components/...

// ❌ Reading Aadhaar without going through revealAadhaar
const a = await prisma.applicant.findUnique({ select: { aadhaar: true }});

// ❌ Console-logging sensitive data
console.log("OTP for", email, "is", otp);

// ❌ Returning a wrapper object from tRPC
return { success: true, data: application };

// ❌ Auto-retrying a payment mutation
useMutation({ mutationFn: ..., retry: 3 }); // could double-charge

// ❌ Storing money as a float
const amount = 1298.00; // → integer paise, always
```

## Project Structure & Boundaries

### Complete Project Directory Structure

```
credai/
├── README.md                         # Project overview, setup, contributing
├── package.json                      # pnpm workspace, scripts, deps
├── pnpm-lock.yaml                    # locked dependency graph
├── tsconfig.json                     # strict mode, path aliases (@/, ~/)
├── next.config.js                    # security headers, image domains, sentry wrapper
├── postcss.config.js                 # tailwindcss v4 plugin
├── prettier.config.js                # 100-col, semi, double-quote-in-jsx
├── eslint.config.js                  # flat config; custom rules from tools/eslint-rules
├── playwright.config.ts              # E2E config; retries=2; trace on retry
├── vitest.config.ts                  # unit; jsdom; co-located *.test.ts discovery
├── lighthouserc.json                 # a11y ≥ 90 gate, perf ≥ 80
├── vercel.json                       # regions: ["bom1"], cron schedules
├── .env.example                      # documented schema; never has real values
├── .gitignore                        # standard + .env, .vercel, coverage, .next
├── .nvmrc                            # Node 22 LTS
├── .npmrc                            # save-exact, engine-strict
│
├── .github/
│   └── workflows/
│       ├── ci.yml                    # typecheck + lint + test + lhci on every PR
│       ├── e2e.yml                   # playwright against Neon preview branch
│       ├── deploy-staging.yml        # on merge to staging branch
│       └── audit-chain.yml           # nightly cron: full chain verification
│
├── tools/
│   └── eslint-rules/                 # custom ESLint rules
│       ├── require-audit-on-mutation.js
│       ├── no-direct-prisma-outside-server.js
│       └── no-direct-aadhaar-access.js
│
├── prisma/
│   ├── schema.prisma                 # generator + datasource + multiSchema preview
│   ├── public.prisma                 # app data models (Application, Member, …)
│   ├── audit.prisma                  # audit.event_log (hash-chained), application_log
│   ├── auth.prisma                   # Auth.js session/account tables
│   ├── seed.ts                       # local dev seed: roles, master data, test users
│   └── migrations/                   # Prisma-generated SQL migrations
│
├── emails/                           # react-email templates (one per event)
│   ├── otp.tsx
│   ├── application-submitted.tsx
│   ├── application-approved.tsx
│   ├── application-objection.tsx
│   ├── application-rejected.tsx
│   ├── payment-receipt.tsx
│   ├── renewal-reminder-30d.tsx
│   ├── renewal-reminder-15d.tsx
│   ├── renewal-confirmation.tsx
│   ├── certificate-issued.tsx
│   ├── certificate-revoked.tsx
│   ├── staff-invitation.tsx
│   └── components/                   # shared header/footer/buttons
│
├── public/
│   ├── credai-logo.svg
│   ├── credai-logo-mark.png
│   ├── og-image.png                  # OpenGraph for /signup, /verify
│   ├── robots.txt                    # disallow /admin, /apply
│   ├── sitemap.xml                   # public surfaces only
│   └── favicons/
│
├── src/
│   ├── env.js                        # @t3-oss/env-nextjs Zod boot-time validation
│   ├── middleware.ts                 # Auth.js + locale + region pinning + CSP
│   │
│   ├── app/                          # ──── Next.js App Router (pages only) ────
│   │   ├── layout.tsx                # root layout: <html>, <body>, providers
│   │   ├── globals.css               # Tailwind v4 @theme + base styles
│   │   ├── global-error.tsx          # app-level error boundary
│   │   ├── not-found.tsx             # 404
│   │   │
│   │   ├── (public)/                 # ─── unauth surfaces ───
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx              # marketing landing
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   ├── verify/[number]/page.tsx
│   │   │   ├── privacy/page.tsx
│   │   │   ├── terms/page.tsx
│   │   │   └── grievance/page.tsx
│   │   │
│   │   ├── (applicant)/              # ─── authenticated applicant ───
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── apply/
│   │   │   │   ├── layout.tsx        # WizardStepRail sidebar
│   │   │   │   ├── page.tsx          # pre-flight checklist + start
│   │   │   │   └── [step]/page.tsx   # 12 dynamic wizard steps
│   │   │   ├── renew/page.tsx
│   │   │   ├── vault/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [documentId]/page.tsx
│   │   │   ├── certificates/page.tsx
│   │   │   └── profile/page.tsx
│   │   │
│   │   ├── (staff)/                  # ─── authenticated staff ───
│   │   │   ├── layout.tsx
│   │   │   └── admin/
│   │   │       ├── inbox/page.tsx
│   │   │       ├── application/[id]/page.tsx
│   │   │       ├── members/page.tsx
│   │   │       ├── payments/
│   │   │       │   ├── page.tsx
│   │   │       │   └── record/[applicationId]/page.tsx
│   │   │       ├── dashboards/
│   │   │       │   ├── operational/page.tsx
│   │   │       │   ├── members/page.tsx
│   │   │       │   ├── payments/page.tsx
│   │   │       │   └── kpi/page.tsx
│   │   │       ├── users/page.tsx
│   │   │       ├── master-data/
│   │   │       │   ├── locations/page.tsx
│   │   │       │   ├── fees/page.tsx
│   │   │       │   └── president/page.tsx
│   │   │       ├── audit-log/page.tsx
│   │   │       └── settings/page.tsx
│   │   │
│   │   └── api/                      # ─── REST Route Handlers ───
│   │       ├── trpc/[trpc]/route.ts
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── webhooks/payment/route.ts
│   │       ├── upload/sign/route.ts
│   │       ├── verify/v1/[number]/route.ts
│   │       ├── cron/
│   │       │   ├── process-jobs/route.ts
│   │       │   ├── renewal-reminders/route.ts
│   │       │   ├── lapse-transitions/route.ts
│   │       │   ├── retention-purge/route.ts
│   │       │   └── audit-chain-verify/route.ts
│   │       ├── rum/route.ts
│   │       ├── logs/route.ts
│   │       ├── openapi.json/route.ts
│   │       └── healthz/route.ts
│   │
│   ├── server/                       # ──── Server-only modules ────
│   │   ├── api/
│   │   │   ├── trpc.ts               # context, procedures, middleware
│   │   │   ├── root.ts               # appRouter aggregation
│   │   │   └── routers/
│   │   │       ├── application.ts    # FR7–FR31 + FR45–FR59
│   │   │       ├── member.ts         # FR70–FR79
│   │   │       ├── document.ts       # FR80–FR84
│   │   │       ├── verification.ts   # FR32–FR35
│   │   │       ├── payment.ts        # FR36–FR44
│   │   │       ├── certificate.ts    # FR60–FR67
│   │   │       ├── dashboard.ts      # FR85–FR89
│   │   │       ├── notification.ts   # FR90–FR91
│   │   │       ├── user.ts           # FR92–FR94
│   │   │       ├── president.ts      # FR95–FR97
│   │   │       ├── audit.ts          # FR98–FR101
│   │   │       └── consent.ts        # FR100, NFR33
│   │   │
│   │   ├── db.ts                     # Prisma client singleton
│   │   │
│   │   ├── auth/
│   │   │   ├── config.ts
│   │   │   ├── providers/
│   │   │   │   ├── email-otp.ts
│   │   │   │   └── credentials.ts
│   │   │   ├── totp.ts
│   │   │   └── session.ts
│   │   │
│   │   ├── audit/
│   │   │   ├── audit-log.ts          # the only writer to audit.event_log
│   │   │   ├── chain.ts              # hash-chain construction + verification
│   │   │   └── reveal-aadhaar.ts     # the only Aadhaar reader
│   │   │
│   │   ├── encryption/
│   │   │   ├── encryption-service.ts # envelope encryption (DEK + KEK)
│   │   │   ├── keys.ts
│   │   │   └── rotate.ts
│   │   │
│   │   ├── integrations/
│   │   │   ├── payment/{adapter,mock,razorpay}.ts
│   │   │   ├── verification/{gst-adapter,pan-adapter,gst-mock,pan-mock}.ts
│   │   │   ├── email/{email-service,resend,render}.{ts,tsx}
│   │   │   ├── blob/{blob-storage,vercel-blob}.ts
│   │   │   ├── kms/{signer,client}.ts
│   │   │   ├── secrets/secrets-manager.ts
│   │   │   ├── captcha/turnstile.ts
│   │   │   └── observability/{sentry,logger}.ts
│   │   │
│   │   ├── jobs/
│   │   │   ├── queue.ts              # pg-boss wrapper
│   │   │   ├── handlers/
│   │   │   │   ├── send-email.ts
│   │   │   │   ├── generate-certificate.ts
│   │   │   │   ├── reverify-gst.ts
│   │   │   │   ├── reverify-pan.ts
│   │   │   │   ├── send-renewal-reminder.ts
│   │   │   │   ├── transition-to-lapsed.ts
│   │   │   │   ├── purge-rejected.ts
│   │   │   │   ├── archive-audit.ts
│   │   │   │   └── verify-audit-chain.ts
│   │   │   └── types.ts              # job-name → payload Zod schemas
│   │   │
│   │   ├── pdf/
│   │   │   ├── certificate.tsx       # @react-pdf/renderer Certificate component
│   │   │   ├── render.ts
│   │   │   ├── sign.ts               # apply KMS-backed document signature
│   │   │   └── qr.ts
│   │   │
│   │   ├── workflow/
│   │   │   ├── application-state-machine.ts
│   │   │   ├── transitions.ts
│   │   │   └── routing.ts            # bounce-back-to-Scrutiniser routing
│   │   │
│   │   ├── schemas/                  # ──── Zod single-source-of-truth ────
│   │   │   ├── application.schema.ts
│   │   │   ├── member.schema.ts
│   │   │   ├── document.schema.ts
│   │   │   ├── payment.schema.ts
│   │   │   ├── verification.schema.ts
│   │   │   ├── certificate.schema.ts
│   │   │   ├── consent.schema.ts
│   │   │   ├── webhook.schema.ts
│   │   │   ├── enums.ts              # MembershipType, FirmType, ApplicationStatus, Role
│   │   │   └── index.ts
│   │   │
│   │   ├── rate-limit.ts             # Upstash wrappers per endpoint class
│   │   ├── membership-number.ts      # FR62 generator
│   │   └── conditional-matrix.ts     # Membership × Firm Type matrix
│   │
│   ├── components/                   # ──── Client React components ────
│   │   ├── ui/                       # shadcn/ui (copied)
│   │   ├── wizard/
│   │   │   ├── WizardStepRail.tsx
│   │   │   ├── WizardLayout.tsx
│   │   │   ├── DocumentChecklistPanel.tsx
│   │   │   ├── DocumentUploadCard.tsx
│   │   │   ├── ConditionalFieldGroup.tsx
│   │   │   ├── AutoSaveIndicator.tsx
│   │   │   ├── ProposerSeconderSelect.tsx
│   │   │   ├── FeeSummaryCard.tsx
│   │   │   └── steps/
│   │   │       ├── Step01Form.tsx
│   │   │       ├── Step02Address.tsx
│   │   │       ├── Step03FirmDetails.tsx
│   │   │       ├── Step04ContactPerson.tsx
│   │   │       ├── Step05CompletedProjects.tsx
│   │   │       ├── Step06CommencementProjects.tsx
│   │   │       ├── Step07Members.tsx
│   │   │       ├── Step08ProposerSeconder.tsx
│   │   │       ├── Step09CodeOfConduct.tsx
│   │   │       ├── Step10SelfDeclaration.tsx
│   │   │       ├── Step11AdditionalDocs.tsx
│   │   │       └── Step12ReviewSubmit.tsx
│   │   ├── staff/
│   │   │   ├── ApplicationInbox.tsx
│   │   │   ├── ApplicationReviewLayout.tsx
│   │   │   ├── ReviewChecklistPanel.tsx
│   │   │   ├── ApplicationStatusTimeline.tsx
│   │   │   ├── QueryThread.tsx
│   │   │   ├── DecisionActions.tsx
│   │   │   ├── ScrutiniserEditField.tsx
│   │   │   ├── PaymentRecordForm.tsx
│   │   │   ├── DashboardCharts/
│   │   │   │   ├── OperationalCharts.tsx
│   │   │   │   ├── MemberCharts.tsx
│   │   │   │   ├── PaymentCharts.tsx
│   │   │   │   └── KpiCharts.tsx
│   │   │   ├── PresidentManagementForm.tsx
│   │   │   ├── UserManagementTable.tsx
│   │   │   └── AuditLogSearch.tsx
│   │   ├── certificate/
│   │   │   ├── MemberCertificateCard.tsx
│   │   │   └── PublicVerificationResult.tsx
│   │   └── shared/
│   │       ├── AadhaarMaskedField.tsx
│   │       ├── DocumentPreview.tsx
│   │       ├── AddressFields.tsx
│   │       ├── PageHeader.tsx
│   │       ├── EmptyState.tsx
│   │       ├── CaptchaWidget.tsx
│   │       └── ConsentStatement.tsx
│   │
│   ├── lib/                          # ──── Client-side utilities ────
│   │   ├── trpc/{client,server,shared}.ts
│   │   ├── format.ts                 # currency, dates, masks, file sizes
│   │   ├── conditional-matrix-client.ts
│   │   ├── i18n.ts
│   │   ├── analytics.ts
│   │   └── utils.ts
│   │
│   ├── hooks/
│   │   ├── useWizardState.ts
│   │   ├── useStaffFilters.ts
│   │   ├── useDebouncedAutoSave.ts
│   │   ├── useFileUpload.ts
│   │   └── useCurrentUser.ts
│   │
│   ├── styles/
│   │   └── globals.css               # Tailwind v4 @theme + base
│   │
│   └── types/
│       ├── auth.types.ts
│       ├── workflow.types.ts
│       └── env.d.ts
│
├── tests/
│   ├── unit/
│   │   ├── audit-coverage.test.ts    # walks appRouter; asserts auditLog.write present
│   │   └── conditional-matrix.test.ts
│   ├── e2e/
│   │   ├── applicant-ordinary-membership.spec.ts
│   │   ├── applicant-associate-membership.spec.ts
│   │   ├── applicant-rera-project-membership.spec.ts
│   │   ├── applicant-renewal.spec.ts
│   │   ├── applicant-resume-draft.spec.ts
│   │   ├── staff-scrutiniser-review.spec.ts
│   │   ├── staff-multi-stage-approval.spec.ts
│   │   ├── staff-raise-objection-bounceback.spec.ts
│   │   ├── staff-rejection-terminal.spec.ts
│   │   ├── payment-online.spec.ts
│   │   ├── payment-offline-record.spec.ts
│   │   ├── payment-bounced-cheque-reversal.spec.ts
│   │   ├── certificate-issuance.spec.ts
│   │   ├── certificate-public-verification.spec.ts
│   │   ├── system-admin-user-onboarding.spec.ts
│   │   ├── system-admin-president-management.spec.ts
│   │   └── auth/
│   │       ├── otp-login.spec.ts
│   │       ├── staff-mfa.spec.ts
│   │       └── session-timeout.spec.ts
│   ├── fixtures/
│   │   ├── members.ts                # synthetic personas
│   │   ├── documents/
│   │   └── seed-staff.ts
│   └── helpers/
│       ├── neon-branch.ts
│       ├── auth.ts
│       └── upload.ts
│
└── docs/
    ├── runbooks/
    │   ├── outage-vercel.md
    │   ├── outage-neon.md
    │   ├── outage-resend.md
    │   ├── kms-rotation.md
    │   ├── president-update.md
    │   ├── dsar-handling.md
    │   ├── breach-notification.md
    │   ├── audit-chain-break.md
    │   └── data-migration.md
    ├── adrs/
    │   ├── 0001-vercel-residency-tradeoff.md
    │   ├── 0002-vercel-blob-vs-s3.md
    │   ├── 0003-pg-boss-vs-inngest.md
    │   ├── 0004-resend-vs-ses.md
    │   ├── 0005-auth-js-v5-beta.md
    │   ├── 0006-hash-chained-audit-log.md
    │   └── 0007-domain-split-schemas.md
    └── compliance/
        ├── dpia.md                   # Data Protection Impact Assessment
        ├── consent-statement.md
        ├── privacy-policy.md
        ├── terms-of-service.md
        └── vendor-list.md
```

### Architectural Boundaries

#### API Boundaries

**Client → Server (internal):** Single boundary — **tRPC over HTTPS** at `/api/trpc/[trpc]`. Clients import the `appRouter` *type* (not implementation) for end-to-end type safety. All inputs validated by Zod at the server boundary.

**External → Server (untrusted):**

| Endpoint | Authentication | Rate limit | Purpose |
|---|---|---|---|
| `POST /api/webhooks/payment` | Provider HMAC signature in header | 100 req/min/IP | Receive gateway callbacks |
| `GET  /api/verify/v1/[number]` | None (public) | 30 req/min/IP + Turnstile after 5 | Public certificate verification |
| `POST /api/upload/sign` | Auth.js session | 20 req/min/user | Issue Vercel Blob signed URL |
| `POST /api/auth/[...nextauth]` | Auth.js-managed | 5 req/min/IP on failures | Login, OTP, callback |
| `POST /api/cron/*` | `Authorization: Bearer $CRON_SECRET` | n/a (Vercel-only callers) | Vercel Cron entrypoints |
| `POST /api/rum` | None | 1000 req/min/IP | web-vitals beacon |
| `POST /api/logs` | None (HMAC-signed batch) | 1000 req/min/IP | structured log ingestion |
| `GET  /api/openapi.json` | None | 60 req/min/IP | API documentation |
| `GET  /api/healthz` | None | n/a | Synthetic uptime probe |

**Server → External (we are the caller):**

| Service | Library | Failure mode |
|---|---|---|
| Resend | `resend` SDK | Job retry; on 5xx, retry per backoff schedule |
| AWS KMS | `@aws-sdk/client-kms` | Throw `INTERNAL_SERVER_ERROR`; alert |
| AWS Secrets Manager | `@aws-sdk/client-secrets-manager` | Cached values used; alert on refresh fail |
| Upstash Redis | `@upstash/redis` | Fail-open (allow request), alert |
| Vercel Blob | `@vercel/blob` | Upload retry on client; signed-URL cache server-side |
| GST verification | adapter-defined | Queue-and-retry; submission "pending" |
| PAN verification | adapter-defined | Queue-and-retry; submission "pending" |
| Payment gateway | adapter-defined | User-visible retry; idempotency table catches duplicates |
| Sentry | `@sentry/nextjs` | Fire-and-forget; never blocks request |
| Cloudflare Turnstile | `@marsidev/react-turnstile` | Token-verify failure → reject submit |

#### Component Boundaries (frontend)

- **Server Components (RSC)** are the **default** for every route under `(public)`, `(applicant)`, `(staff)`. They call tRPC via `lib/trpc/server.ts`. No `useState` / `useEffect`.
- **Client Components** declare `'use client'` and exist *only* where interaction or browser APIs require: form fields, wizard step controllers, modals, charts, the `<WizardStepRail />`. They consume tRPC via `lib/trpc/client.ts` (TanStack Query).
- **Cross-component communication** flows through:
  - **Props** (parent → child) — preferred, default
  - **TanStack Query cache** (sibling components reading the same server data)
  - **Zustand stores** (sibling components sharing transient UI state)
  - **URL search params** (filters, current step, pagination) — survives refresh, shareable
  - **No prop drilling > 3 levels** — extract a Zustand slice or use a context provider

#### Service Boundaries (server)

The server side is organized as a **modular monolith** with strict internal boundaries:

```
┌──────────────────────────────────────────────────────────────┐
│                    HTTP Surface (Next.js)                    │
│   app/api/trpc        app/api/<rest>     app/api/cron        │
└────────────┬───────────────┬─────────────────┬───────────────┘
             │               │                 │
             ▼               ▼                 ▼
┌──────────────────────────────────────────────────────────────┐
│                       tRPC Routers                           │
│ application │ member │ document │ verification │ payment …   │
└────────────┬───────────────┬─────────────────┬───────────────┘
             │               │                 │
   ┌─────────▼───────┐  ┌────▼─────────┐  ┌────▼──────────┐
   │ workflow/       │  │ pdf/         │  │ jobs/         │
   │ state-machine   │  │ render+sign  │  │ pg-boss       │
   └─────────┬───────┘  └────┬─────────┘  └────┬──────────┘
             │               │                 │
   ┌─────────▼─────────────────────────────────▼────────────┐
   │                    server/integrations/                │
   │  payment │ verification │ email │ blob │ kms │ secrets │
   └────────────────────────┬───────────────────────────────┘
                            │
                  ┌─────────▼────────┐         ┌──────────────┐
                  │  audit/          │ ◄──────►│  encryption/ │
                  │  log + chain     │         │  envelope    │
                  └─────────┬────────┘         └─────┬────────┘
                            │                        │
                            ▼                        ▼
                  ┌──────────────────────────────────────┐
                  │      Prisma + Postgres (Neon)        │
                  │   public │ audit │ auth schemas      │
                  └──────────────────────────────────────┘
```

**Hard boundary rules:**

- **`server/api/routers/`** is a thin orchestration layer: parse input, check authorization, call domain services, write audit, return result. No direct Prisma queries except through `server/db.ts`.
- **`server/integrations/`** modules export interfaces; implementations injected via factory functions reading from `server/integrations/secrets/`. No router imports a concrete implementation directly.
- **`server/audit/`** is the only writer to `audit.event_log`. Every other module calls `auditLog.write(...)`.
- **`server/encryption/`** is the only code that handles raw Aadhaar bytes. Every Aadhaar read goes through `revealAadhaar(applicantId, requestId)` which writes an audit entry.
- **`server/jobs/handlers/`** files import services freely but never the HTTP surface. Handlers must be idempotent (safe to retry).

#### Data Boundaries

- **Schema-per-domain (Postgres):** `public`, `audit`, `auth`. Each owned by a separate Postgres role.
  - Application's primary connection uses role `app_rw` with INSERT/UPDATE/SELECT on `public.*`, INSERT/SELECT on `audit.*`, all on `auth.*`.
  - No role has UPDATE or DELETE on `audit.*` — tamper-evidence enforced at the DB.
  - The audit-chain verification job uses a separate role `audit_verifier` with SELECT-only on `audit.*`.
- **Document vault data:** Vercel Blob accessed only through `server/integrations/blob/`. The DB stores the `blobUrl` + `sha256` + size + content-type metadata; Blob holds the bytes.
- **Encrypted fields:** Aadhaar (envelope-encrypted with `MEK_AADHAAR`); other PII fields per data classification (envelope-encrypted with `MEK_PII`). Encryption applied transparently in service layer; the schema column types are `bytea`.
- **Tenant key:** every primary table has a nullable `tenant_id` column reserved for Phase 3 multi-chapter expansion. MVP populates it with `'CREDAI_PUNE'` constant. Cross-tenant queries blocked by Postgres RLS policy from day one.

### Requirements to Structure Mapping

| FR Group | tRPC Router | Server Module | Components | E2E Test |
|---|---|---|---|---|
| FR1–FR6 (Authentication) | `auth.*` (mostly via Auth.js) | `server/auth/`, `server/auth/providers/` | `app/(public)/login`, `app/(public)/signup` | `tests/e2e/auth/otp-login.spec.ts`, `staff-mfa.spec.ts` |
| FR7–FR31 (Wizard) | `application.create/list/get/saveStep/submit` | `server/conditional-matrix.ts`, `server/workflow/` | `components/wizard/*`, `app/(applicant)/apply/[step]/page.tsx` | `applicant-ordinary-membership.spec.ts`, `applicant-associate-membership.spec.ts`, `applicant-rera-project-membership.spec.ts`, `applicant-resume-draft.spec.ts` |
| FR32–FR35 (GST/PAN verification) | `verification.verifyGst/verifyPan/retry` | `server/integrations/verification/` | inline status badges within `components/wizard/` | covered by membership E2E specs |
| FR36–FR44 (Payment) | `payment.initiate/recordOffline/markReversed/list` | `server/integrations/payment/`, `app/api/webhooks/payment/route.ts` | `components/staff/PaymentRecordForm.tsx`, fee summary in wizard | `payment-online.spec.ts`, `payment-offline-record.spec.ts`, `payment-bounced-cheque-reversal.spec.ts` |
| FR45–FR59 (Multi-stage approval) | `application.approve/raiseObjection/reject/listInbox/edit` | `server/workflow/` | `components/staff/ApplicationReviewLayout.tsx`, `DecisionActions.tsx`, `ScrutiniserEditField.tsx`, `ApplicationStatusTimeline.tsx`, `QueryThread.tsx`, `ReviewChecklistPanel.tsx` | `staff-scrutiniser-review.spec.ts`, `staff-multi-stage-approval.spec.ts`, `staff-raise-objection-bounceback.spec.ts`, `staff-rejection-terminal.spec.ts` |
| FR60–FR69 (Certificate + public verification) | `certificate.issue/list/revoke`, `verify.lookup` (REST) | `server/pdf/`, `server/integrations/kms/`, `app/api/verify/v1/[number]/route.ts` | `components/certificate/MemberCertificateCard.tsx`, `PublicVerificationResult.tsx`, `app/(public)/verify/[number]/page.tsx` | `certificate-issuance.spec.ts`, `certificate-public-verification.spec.ts` |
| FR70–FR79 (Member lifecycle + renewal) | `member.list/getCurrent/listLapsing/initiateRenewal/submitRenewal` | `server/workflow/`, `server/jobs/handlers/send-renewal-reminder.ts`, `transition-to-lapsed.ts` | `app/(applicant)/dashboard/page.tsx`, `app/(applicant)/renew/page.tsx` | `applicant-renewal.spec.ts` |
| FR80–FR84 (Document vault) | `document.list/getSignedUrl/upload/replace` | `server/integrations/blob/` | `app/(applicant)/vault/page.tsx`, `components/wizard/DocumentUploadCard.tsx`, `components/shared/DocumentPreview.tsx` | covered by membership E2E specs |
| FR85–FR89 (Dashboards) | `dashboard.summarizeOperational/summarizeMembers/summarizePayments/summarizeKpis/exportCsv` | (router-only; aggregations via Postgres) | `components/staff/DashboardCharts/*`, `app/(staff)/admin/dashboards/*/page.tsx` | smoke E2E for each dashboard |
| FR90–FR91 (Notifications) | `notification.listForUser` (read) — sends are job-driven | `server/jobs/handlers/send-email.ts`, `server/integrations/email/`, `emails/*.tsx` | inline within applicant dashboard | implicit in journey E2Es |
| FR92–FR94 (User management) | `user.invite/disable/reEnable/resetPassword/listMasterData/upsertMasterData` | `server/auth/` | `app/(staff)/admin/users/page.tsx`, `master-data/locations/page.tsx`, `master-data/fees/page.tsx`, `components/staff/UserManagementTable.tsx` | `system-admin-user-onboarding.spec.ts` |
| FR95–FR97 (President management) | `president.upsert/get/list` | `server/integrations/blob/`, `server/pdf/` | `app/(staff)/admin/master-data/president/page.tsx`, `components/staff/PresidentManagementForm.tsx` | `system-admin-president-management.spec.ts` |
| FR98–FR101 (Audit + DPDP) | `audit.search/export`, `consent.capture/list/revoke`, `dsar.requestAccess/requestErasure` | `server/audit/`, `server/jobs/handlers/archive-audit.ts`, `verify-audit-chain.ts` | `app/(staff)/admin/audit-log/page.tsx`, `components/staff/AuditLogSearch.tsx`, `app/(applicant)/profile/page.tsx`, `components/shared/ConsentStatement.tsx` | dedicated DSAR + audit-search E2Es |
| FR102 (Aadhaar masking) | within applicable read procedures | `server/audit/reveal-aadhaar.ts`, `server/encryption/` | `components/shared/AadhaarMaskedField.tsx` | dedicated unit tests on masking |

#### Cross-Cutting Concerns

| Concern | Lives in |
|---|---|
| Auth (Auth.js v5) | `src/server/auth/` + `src/middleware.ts` + `src/app/api/auth/[...nextauth]/route.ts` |
| RBAC (per-role tRPC procedures) | `src/server/api/trpc.ts` (`protectedProcedure`, `staffProcedure`, `roleProcedure`) |
| Audit logging | `src/server/audit/` + (enforced) every mutation router |
| PII encryption | `src/server/encryption/` + Prisma model `Bytes` columns |
| Rate limiting | `src/server/rate-limit.ts` + applied in `middleware.ts` (REST) and tRPC middleware (procedures) |
| Idempotency | `webhook_idempotency` + `mutation_idempotency` tables + middleware in REST handlers |
| Observability | `src/server/integrations/observability/` (Sentry + pino) + `src/middleware.ts` request-id assignment |
| Background jobs | `src/server/jobs/` + `src/app/api/cron/process-jobs/route.ts` |
| Internationalization | `src/lib/i18n.ts` + `messages/en.json` |
| Accessibility | enforced via Lighthouse CI + `@axe-core/react` in dev + manual NVDA / VoiceOver smoke |
| Region pinning | `vercel.json` `regions: ["bom1"]` + `src/middleware.ts` region check + Sentry `region` tag |
| DPDP consent | `src/server/api/routers/consent.ts` + `src/components/shared/ConsentStatement.tsx` + `src/app/(public)/signup/page.tsx` |
| DSAR (data-subject rights) | `src/server/api/routers/audit.ts` (DSAR sub-procedures) + `docs/runbooks/dsar-handling.md` |

### Integration Points

#### Internal Communication

```
Browser (Next.js client)
   │
   │ HTTPS · tRPC over fetch · superjson serializer
   │
   ▼
Next.js (Vercel · bom1)
   │
   ├── tRPC procedures ─────► server/api/routers/ ──► server/workflow/
   │                                            │
   │                                            ├──► server/integrations/
   │                                            │
   │                                            └──► server/audit/ ──► Postgres (audit schema)
   │
   ├── Route Handlers (REST) ─► server/integrations/ (webhooks)
   │
   └── Cron entrypoints ─────► server/jobs/queue.ts ──► pg-boss (Postgres) ──► server/jobs/handlers/
```

#### External Integrations Inventory

| Service | Direction | Auth | Region |
|---|---|---|---|
| Neon (Postgres) | Outbound | TLS + role/password | ap-south-1 |
| Vercel Blob | Outbound | Vercel-managed token | global edge |
| Upstash Redis | Outbound | TLS + auth token | ap-south-1 (Mumbai) |
| Resend | Outbound | API key | us-east (cross-border) |
| AWS KMS | Outbound | IAM role + AssumeRole | ap-south-1 |
| AWS Secrets Manager | Outbound | IAM role | ap-south-1 |
| AWS S3 (backups) | Outbound | IAM role | ap-south-1 |
| Sentry | Outbound | DSN | EU (cross-border) |
| Better Stack | Outbound | API key | EU/US (no PII flows) |
| Cloudflare Turnstile | Outbound | site/secret keys | global edge |
| Payment gateway (TBD) | Bidirectional | API key + HMAC webhook | India |
| GST provider (TBD) | Outbound | API key | India |
| PAN provider (TBD) | Outbound | API key | India |

#### Data Flow — Application Submission (representative end-to-end path)

```
1. User fills wizard step                              [client component]
2. RHF validates against Zod schema                    [src/server/schemas/]
3. tRPC mutation `application.saveStep`                [tRPC client]
4. ──HTTPS─► Vercel function (bom1)                    [region pinned]
5. middleware.ts: Auth.js session check                [auth/session.ts]
6. tRPC `protectedProcedure`: parses Zod, builds Context [trpc.ts]
7. router/application.ts: opens Prisma transaction
   a. Encrypts Aadhaar via EncryptionService           [encryption/]
   b. Updates Application row in `public` schema       [Prisma]
   c. Writes audit entry via auditLog.write(tx)        [audit/]
   d. Commits transaction
8. If GST/PAN added or edited:
   a. Enqueues `reverify-gst` or `reverify-pan` job    [jobs/queue.ts → pg-boss]
9. Returns updated Application to client
10. TanStack Query invalidates cached list
11. UI shows "Saved ✓" via Sonner toast
```

```
Cron (every 1 min) ─► /api/cron/process-jobs
    └─► pg-boss.fetch() ─► handler
         ├── send-email                ─► Resend
         ├── reverify-gst              ─► GST adapter
         ├── reverify-pan              ─► PAN adapter
         ├── generate-certificate      ─► PDF render → KMS sign → Blob upload → DB row
         └── send-renewal-reminder     ─► email + audit
```

### File Organization Patterns

#### Configuration files

- **Root-level only:** `package.json`, `tsconfig.json`, `next.config.js`, `vercel.json`, `prettier.config.js`, `eslint.config.js`, `playwright.config.ts`, `vitest.config.ts`, `lighthouserc.json`, `.env.example`, `.gitignore`, `.nvmrc`, `.npmrc`, `postcss.config.js`
- **No nested config files.** A single `tsconfig.json` with path aliases. A single ESLint config governing the whole repo.
- **Environment validation:** `src/env.js` with `@t3-oss/env-nextjs` Zod schema; no env-var read happens outside this module.

#### Source organization

- **`src/app/` is for routes only** — page components, layouts, and route handlers. Logic that could exist outside a route belongs in `src/components/` or `src/server/`.
- **Route groups** `(public)`, `(applicant)`, `(staff)` carry the auth boundary, not feature boundaries.
- **`src/server/` is the only place** with database access, secrets access, or signing-key access. Everything in `src/server/` is `import 'server-only'` or `import { unstable_cache } from 'next/cache'` capable.
- **`src/components/`** contains client-renderable React. Subdirectories `wizard/`, `staff/`, `certificate/`, `shared/`, and `ui/` (shadcn).
- **One file per concern.** A 500-line file is a refactor signal.

#### Test organization

- **Co-located unit tests** for any non-trivial server-side logic (encryption, audit-log, conditional-matrix, workflow state-machine). File: `<file>.test.ts` next to the file.
- **Playwright E2E tests** in `tests/e2e/`, one file per user journey (FR-mapped per the table above).
- **Fixtures** in `tests/fixtures/` — synthetic personas, test PDFs, role-seed scripts.
- **CI runs the audit-coverage assertion test on every PR** — fails the build if any tRPC mutation lacks an `auditLog.write()` call.

#### Asset organization

- **Static assets** in `public/`. Large brand assets compressed, served via Next.js's automatic immutable cache headers.
- **Document vault uploads** in Vercel Blob, never in `public/`. Access exclusively via signed URLs with TTL ≤ 5 min for downloads.
- **Email templates** as React components in `emails/` — rendered to HTML at send time via `react-email`.
- **PDF assets** (logo, signature image, certificate background) bundled within `src/server/pdf/` and inlined into rendered PDFs.

### Development Workflow Integration

#### Development Server

- `pnpm dev` boots Next.js dev server on `:3000`, Prisma against a local Neon branch (or local Postgres if offline), pg-boss in-process worker.
- Hot reload across `src/app/`, `src/components/`, `src/server/api/routers/`. Schema changes require `pnpm prisma migrate dev`.
- `pnpm prisma studio` opens the DB browser; **read-only role** by default to prevent accidental writes.
- `pnpm email:dev` runs react-email's local preview server on `:3001` for template iteration.

#### Build Process

- `pnpm build` runs:
  1. `prisma generate` — Prisma client typings
  2. `next build` — production bundle (turbopack)
  3. `next-intl` static-extract — pre-built locale messages
  4. Sentry source-map upload (server build only)
- Bundles split per route group; staff-only chunks excluded from applicant bundle.
- Bundle-size gate: CI fails if `app/(applicant)/**/*.js` exceeds NFR5 budget.

#### Deployment Structure

- **Production** — Vercel project linked to `main`. Promoted via GitHub Actions after staging smoke + manual approval.
- **Staging** — Vercel preview alias for `staging` branch; same env-var class as production except a dedicated Neon branch + sandbox keys for external services.
- **Preview** — every PR gets its own Vercel preview URL + a Neon branch auto-created via the Vercel-Neon integration. Migrations applied per branch on first deploy.
- **Local** — `pnpm dev` against either a developer's own Neon branch (recommended) or a Docker Postgres instance.

#### Operational Surfaces

- `/api/healthz` — synthetic-check probe (Better Stack)
- `/api/openapi.json` — OpenAPI spec for partners/regulators
- Vercel Cron logs — visible in the Vercel dashboard, ingested into pino → Postgres
- Neon console — query insights, branch management, PITR controls
- Sentry dashboard — error volumes, release tracking, alerts
- Better Stack — uptime SLO tracking

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**

All 25+ technology choices verified against the npm registry directly:

- `next@16.2.4` + `tRPC v11.16.0` (server-component-native) + `Prisma 7.8.0` + `Auth.js v5.0.0-beta.31` + `Tailwind v4.2.4` + `Zod v4.3.6` form a coherent, current TypeScript stack with no peer-dep conflicts.
- `pg-boss@12.18.1` runs inside the same Neon Postgres that holds the audit log, web-vitals telemetry, and idempotency tables — single-database simplicity throughout.
- `create-t3-app@7.40.0` scaffolds Next.js 15 + Auth.js v4 + Tailwind v3 + Zod v3 + Prisma 6; the documented `pnpm up --latest` step takes the project to current versions in one pass — no architectural surprises.
- All AWS services (KMS, Secrets Manager, S3) selected in `ap-south-1` (Mumbai) — single AWS account, single region, single IAM trust boundary.
- All India-resident services (Neon, Upstash, AWS Mumbai) live in `ap-south-1` (Mumbai). Vercel functions pinned to `bom1` (Mumbai). Cross-border services (Vercel control plane, Vercel Blob, Resend, Sentry) explicitly enumerated and covered by DPDP cross-border-processor disclosure.

**Pattern Consistency:**

- Naming conventions (snake_case in DB, camelCase in TS, kebab-case in REST routes, PascalCase in components) are mutually exclusive — no overlap, no ambiguity.
- The audit-log invariant (`auditLog.write()` on every mutation) is enforced at three layers: a custom ESLint rule, a centralized walker test that fails CI, and a Prisma middleware fallback. Triple-redundant by design.
- Server/client boundary enforced by `import/no-restricted-paths` ESLint rule + Next.js's own RSC mechanics + `import 'server-only'` markers in `src/server/`. Three independent enforcement mechanisms.
- Zod schemas as single-source-of-truth: same schema imported by React Hook Form (client validation), tRPC `.input(...)` (server validation), and OpenAPI generator (external API spec). Three consumers, one definition.

**Structure Alignment:**

- Modular-monolith service structure (HTTP surface → tRPC routers → workflow/integrations/jobs → audit/encryption → DB) matches the modular-monolith conceptual model. Each layer has exactly one downstream layer it can call.
- 21 conditional Membership × Firm Type wizard paths handled via a single `conditional-matrix.ts` module consumed by both client (for reveal logic) and server (for validation). One source of truth.
- The 4-stage approval workflow with bounce-back-to-Scrutiniser + chain-restart is encapsulated in `server/workflow/` as an explicit state machine — independently testable via property-based tests.

### Requirements Coverage Validation ✅

#### Functional Requirements Coverage (102 / 102)

| FR Range | Capability | Architectural Support | Status |
|---|---|---|---|
| FR1–FR6 | Auth & Identity | `server/auth/` + Auth.js v5 + `EmailOtpProvider` + `CredentialsProvider` + TOTP | ✅ |
| FR7–FR31 | Application Wizard | `application.*` router + `conditional-matrix.ts` + `components/wizard/*` | ✅ |
| FR32–FR35 | GST/PAN Verification | `verification.*` router + adapter interfaces + `pg-boss` retry queue | ✅ |
| FR36–FR44 | Payment | `payment.*` router + `webhook_idempotency` table + `PaymentGatewayAdapter` + offline ledger | ✅ |
| FR45–FR59 | Multi-Stage Approval | `application.approve/raiseObjection/reject` + `workflow/state-machine.ts` + chain-restart logic | ✅ |
| FR60–FR69 | Certificate + Verification | `certificate.*` router + `pdf/` + AWS KMS signing + `/api/verify/v1/*` + Turnstile | ✅ |
| FR70–FR79 | Member Lifecycle + Renewal | `member.*` router + scheduled jobs (`send-renewal-reminder`, `transition-to-lapsed`) | ✅ |
| FR80–FR84 | Document Vault | `document.*` router + `BlobStorage` adapter + Vercel Blob + retention purge job | ✅ |
| FR85–FR89 | Dashboards | `dashboard.*` router + `staff/DashboardCharts/*` + CSV export | ✅ |
| FR90–FR91 | Notifications | `send-email` pg-boss handler + `EmailService` (Resend) + `react-email` templates | ✅ |
| FR92–FR97 | User & President Mgmt | `user.*`, `president.*` routers + master-data CRUD + single-active enforcement | ✅ |
| FR98–FR101 | Audit & DPDP | `server/audit/` + hash-chained log + `consent.*` router + DSAR procedures | ✅ |
| FR102 | Aadhaar Masking | `AadhaarMaskedField` + `revealAadhaar()` + envelope encryption | ✅ |

**Coverage: 102 / 102 FRs (100%)**

#### Non-Functional Requirements Coverage (65 / 65)

| NFR Range | Driver | Architectural Support | Status |
|---|---|---|---|
| NFR1–NFR9 | Performance | Vercel `bom1` + Neon Mumbai + RSC defaults + code splitting per route group + bundle budget gate + lighthouse CI | ✅ |
| NFR10–NFR17 | Availability & Reliability | Vercel SLA + Neon Pro PITR (35d) + queue-and-retry on all integrations + idempotent webhooks + 10× retries on critical email | ✅ |
| NFR18–NFR31 | Security | TLS 1.3 + AES-256 envelope (separate `MEK_AADHAAR`) + AWS Secrets Manager + pino redaction + TOTP MFA + DB-backed sessions + tRPC RBAC middleware + Turnstile + Upstash brute-force | ✅ |
| NFR32–NFR40 | Privacy & Compliance | DPDP consent capture + DSAR procedures + retention enforcement jobs + India-resident core stack + UIDAI-compliant Aadhaar handling + breach runbook | ✅ (with documented cross-border processors) |
| NFR41–NFR47 | Accessibility | shadcn/ui (accessible primitives) + semantic HTML + ARIA conventions + Lighthouse CI ≥ 90 + manual NVDA/VoiceOver smoke + keyboard navigation tests | ✅ |
| NFR48–NFR50 | Scalability | Vercel auto-scale + Neon Pro auto-scale + Vercel Blob unbounded storage + per-route function isolation | ✅ (load-test baseline pending) |
| NFR51–NFR55 | Integration & Interoperability | All externals behind adapter interfaces; replaceable per `NFR55`; documented retry/circuit-breaker | ✅ |
| NFR56–NFR61 | Observability & Operability | pino structured logs + Sentry (errors) + web-vitals (RUM) + Better Stack (synthetic) + alert routing + runbooks per scenario | ✅ |
| NFR62–NFR65 | Auditability | Append-only `audit.event_log` enforced at DB-role level + hash-chained rows + nightly chain verifier + KMS-signed PDFs | ✅ |

**Coverage: 65 / 65 NFRs (100%)**

### Implementation Readiness Validation ✅

**Decision Completeness:**

- All 25+ versioned technology choices are pinned with verified npm versions (April 2026).
- All 5 decision categories (Data, Auth/Security, API, Frontend, Infrastructure) are completed end-to-end.
- All 11 PRD §Open Decisions are either decided architecturally (#1, #3, #4, #5, #6, #11) or scoped to client (#2, #7, #8, #9, #10) with adapter interfaces ready for swap-in.

**Structure Completeness:**

- Complete project tree generated — every directory has a stated purpose; every file path used in code has a defined home.
- All 13 capability groups from the FR map have explicit router files, server modules, components, and E2E specs.
- All 13 cross-cutting concerns map to specific module locations.
- Every external integration has a documented direction, auth shape, region, and failure mode.

**Pattern Completeness:**

- ~30 named conflict points each have an explicit binding rule with a concrete example.
- Naming conventions covered for: DB, tRPC, REST, files, code symbols, Boolean columns.
- Format patterns covered for: dates, money, currency codes, phones, PAN, Aadhaar, pincode, membership numbers, booleans, null/undefined, enums, file sizes, decimal precision.
- Process patterns covered for: error handling (server tRPC + REST + client), loading states (per-surface table), validation timing, idempotency (4 contexts), retry policy (6 contexts), authentication flow (per-role), concurrency.
- Enforcement covered: 10 mandatory rules + 8 ESLint rules (incl. 3 custom) + 6 CI gates + Husky pre-commit.

### Gap Analysis

#### Critical gaps (block implementation)

**None identified.** Every FR and NFR has explicit architectural support in modules, routers, components, or jobs. Epic 0 (foundation scaffolding) can begin.

#### Important gaps (do not block, but worth tracking)

1. **Cross-border processor list pending DPIA finalization (NFR36).** Vercel control plane, Vercel Blob, Resend, and Sentry are cross-border processors. Architecture is consistent — these are documented as DPDP cross-border processors that must appear in the consent statement and DPIA. **Action:** Legal/compliance team finalizes DPIA before production launch (not before scaffolding starts).

2. **Auth.js v5 is pre-1.0 (v5.0.0-beta.31).** Production risk acknowledged in Step 4. Mitigations: pinned version, version-specific tests, downgrade path to `next-auth@4.24.14` documented as ADR. **Action:** Monitor v5 release notes through implementation; reassess if v5 stable lands during build.

3. **Load-test baseline pending (NFR48–NFR49).** PRD's default planning numbers (≤ 200 concurrent applicant / ≤ 50 concurrent staff) are estimates, not measured. Architecture provides headroom via Vercel auto-scale + Neon Pro. **Action:** Run k6 / artillery load tests against staging during pre-launch validation phase, calibrate scaling configs.

4. **Six PRD Open Decisions remain client-side.** None block architecture; all have adapter interfaces ready:
   - #1 GST e-invoicing (only if turnover ≥ ₹5 cr) — adapter slot in `server/integrations/`
   - #2 Payment gateway — `PaymentGatewayAdapter` interface ready for Razorpay/PayU/CCAvenue/etc.
   - #3 MahaRERA live verification (Phase 2) — adapter slot ready
   - #7 Existing-member migration source format — `migrated_vs_portal_native` flag in schema; ETL scripts deferred until source format known
   - #8 Membership Number format — default `CPN/{ORD|ASC|RERA}/{YYYY}/{seq}` baked into `membership-number.ts`; client-confirmable
   - #9 Migrated members' certificate strategy — `presidentSnapshot` design supports both approaches
   - #10 Staff training & go-live — operational, not architectural

5. **Document-signing certificate provisioning.** AWS KMS asymmetric key chosen as the custody mechanism, but the *certificate* itself (issued by a CA, wrapping the public key) needs to be procured. **Action:** Epic 0 — provision RSA-3072 KMS key, generate CSR, obtain document-signing certificate from a recognized CA (Indian or international); ~1-2 weeks lead time.

#### Nice-to-have gaps (optional refinements)

6. **Upstash Redis cache layer** — deferred until performance demands surface. Architecture supports localized addition.
7. **AWS KMS for envelope-encryption KEKs** — currently in Vercel env vars; Phase-2 upgrade documented.
8. **Self-hosted Sentry / GlitchTip in Mumbai** — Phase-2 candidate if compliance review later requires.
9. **OpenFeature + Flagsmith** — env-var feature toggles cover Phase 1; runtime flag service deferred to Phase 2.
10. **Public Member Directory (Phase 2)** — distinct from the per-cert verification endpoint already in MVP.

### Validation Issues Addressed

No critical issues found during validation. All important gaps are either:

- Operational (DPIA finalization, load testing, certificate procurement) — handled in pre-launch phase
- Pending client decisions (PRD §Open Decisions) — adapter pattern absorbs these without architectural change
- Risk-mitigated (Auth.js v5 beta) — pinned version + downgrade path documented

### Architecture Completeness Checklist

**✅ Requirements Analysis**

- [x] Project context thoroughly analyzed — 102 FRs across 14 capability groups, 65 NFRs across 9 drivers
- [x] Scale and complexity assessed — medium-high, single-tenant web app
- [x] Technical constraints identified — India residency, no Aadhaar auth, no card storage, append-only audit, no PII in logs
- [x] Cross-cutting concerns mapped — 13 concerns identified

**✅ Architectural Decisions**

- [x] Critical decisions documented with versions — 25+ libraries pinned to verified npm versions
- [x] Technology stack fully specified — frontend (locked by UX), backend, infra all decided
- [x] Integration patterns defined — adapter pattern for all externals
- [x] Performance considerations addressed — Mumbai region pinning, code splitting, bundle budgets, p95 targets

**✅ Implementation Patterns**

- [x] Naming conventions established — DB, tRPC, REST, files, code symbols
- [x] Structure patterns defined — modular monolith with strict layer boundaries
- [x] Communication patterns specified — domain events, logging, state management
- [x] Process patterns documented — errors, loading, validation, idempotency, retry, concurrency

**✅ Project Structure**

- [x] Complete directory structure defined — every directory has a stated purpose
- [x] Component boundaries established — RSC default, client only where required
- [x] Integration points mapped — internal flows + external integrations inventory + data-flow diagrams
- [x] Requirements to structure mapping complete — every FR group → router + module + component + E2E test

### Architecture Readiness Assessment

**Overall Status: READY FOR IMPLEMENTATION**

**Confidence Level: High** — based on:

- Complete coverage of all 167 explicit requirements (102 FR + 65 NFR)
- All technology versions verified directly from npm registry (April 2026)
- All cross-cutting concerns have specific implementation locations
- All AI agent conflict points have binding rules with examples
- All architectural decisions have rationale tied to specific FRs/NFRs

**Key Strengths:**

1. **Tamper-evident audit log enforced at three independent layers** (DB role grants + hash chain + ESLint rule + walker test) — defense in depth for the most security-critical FR group.
2. **Single source of truth via Zod schemas** — eliminates client/server validation drift, the single most common bug class in form-heavy stacks.
3. **Adapter pattern for every external integration** — payment gateway, GST/PAN provider, email, blob storage, KMS, secrets manager all swappable without architectural change. Future-proof against vendor changes.
4. **Modular-monolith with clear layer boundaries** — fast to ship for MVP, splittable into microservices later if Phase 3 federation demands.
5. **India-resident core stack with documented cross-border processor disclosure** — DPDP-compliant by design rather than retrofitted.
6. **Cost-conscious infrastructure (~₹6.5–7k/month MVP)** — leverages free tiers (Resend, Upstash, Better Stack) where they meet residency + scale requirements; pays for managed services only where security or operational guarantees demand it.

**Areas for Future Enhancement (Phase 2+):**

1. Migration to AWS KMS for envelope-encryption KEKs (currently Vercel env vars)
2. Self-hosted observability stack (GlitchTip / Loki / OpenTelemetry) in Mumbai if compliance review demands
3. Inngest or Trigger.dev replacement for pg-boss if job scale outgrows Postgres
4. OpenFeature + Flagsmith runtime feature flags
5. Public member directory (browsable, indexed)
6. SMS / WhatsApp channel for OTP and reminders
7. Marathi / Hindi locale (next-intl already in place)
8. Multi-chapter expansion (`tenant_id` already reserved in schema)
9. Class 2 / Class 3 DSC layered over the system signature for stronger legal weight

### Implementation Handoff

**AI Agent Guidelines (binding):**

1. Follow the **Implementation Patterns & Consistency Rules** section exactly — naming, formats, error handling, idempotency, retry policies are not suggestions.
2. Treat the **Project Structure & Boundaries** section as canonical — every new file goes in the directory that matches its concern.
3. Use **Zod schemas in `src/server/schemas/`** as the single source of truth for any boundary-crossing shape — never inline-define a parsing schema.
4. Call **`auditLog.write()`** in every mutation tRPC procedure that changes domain state — the audit-coverage walker test will fail CI otherwise.
5. Refer to the **Requirements to Structure Mapping** table when implementing any FR — the mapping tells you exactly which router file, server module, components, and E2E test cover that FR.
6. When making any non-trivial decision not covered above, write an **ADR** in `docs/adrs/` and link it from the PR.

**First Implementation Priority — Epic 0 / Story 0.1:**

```bash
pnpm create t3-app@latest credai \
  --CI \
  --nextAuth \
  --tailwind \
  --trpc \
  --prisma \
  --appRouter \
  --dbProvider postgres
```

Followed by the post-scaffold dependency upgrades and additions documented in the **Starter Template Evaluation** section. Then proceed to:

- Epic 0 / Story 0.2: Provision Neon project, AWS account, Vercel project, Upstash, Resend
- Epic 0 / Story 0.3: Set up `prisma/public.prisma`, `prisma/audit.prisma`, `prisma/auth.prisma` with role grants
- Epic 0 / Story 0.4: Implement `Context` + `protectedProcedure` + `staffProcedure` + `auditLog.write()` together (these interlock)
- Epic 0 / Story 0.5: Implement `EncryptionService` + `BlobStorage` + `EmailService` + `JobQueue` + `RateLimiter` (parallelizable once Story 0.4 lands)
- Epic 0 / Story 0.6: Wire CSP/HSTS/security headers in `middleware.ts`; configure `vercel.json` with cron schedules

Once Epic 0 lands, the remaining capability epics (E1–E13) can be built in dependency order using the FR-to-structure mapping as the implementation guide.
