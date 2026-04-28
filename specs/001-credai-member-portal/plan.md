# Implementation Plan: CREDAI Pune Digital Member Portal

**Branch**: `001-credai-member-portal` | **Date**: 2026-04-28 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-credai-member-portal/spec.md`; Architecture document; UX Design Specification

## Summary

CREDAI Pune Digital Member Portal is a full-stack web application that replaces a paper-heavy, manually-verified membership process with a self-serve lifecycle platform. It serves two distinct user groups: (1) applicant firms (real-estate builders seeking CREDAI Pune certification) completing a guided 12-step adaptive membership wizard across 3 membership types × 7 firm structures, and (2) CREDAI Pune staff (Scrutinisers, Convenors, Director General, Secretary) managing a 4-stage approval workflow with compliance verification.

**Core delivery scope:**
- Multi-step adaptive wizard with conditional field logic, draft auto-save, and document upload
- 4-stage staff approval workflow with Scrutiniser-only edit privilege and bounce-back logic
- GST/PAN external verification with queue-and-retry resilience
- Payment ledger (online + offline) with idempotent webhook handling and receipt uniqueness
- Member renewal with pre-filled data and auto-approval for no-change cases
- Tamper-evident PDF certificates with portal-held document-signing certificate
- Audit-log append-only store covering all state transitions, staff actions, and access events
- WCAG 2.1 AA accessibility and Core Web Vitals performance targets

**Technical approach:** Schema-driven form layer (Zod) enables conditional wizard paths; centralized state machine and audit middleware ensure compliance-by-construction; queue-and-retry pattern (pg-boss) handles external integrations; database-enforced append-only audit log; envelope encryption with separate Aadhaar key; server-side RBAC on every endpoint.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), Node.js 20 LTS  
**Framework & Runtime**: Next.js 15 (App Router), Node.js backend via tRPC v11  
**Primary Dependencies**: 
- API: tRPC v11 (type-safe procedures)
- ORM: Prisma v7 (database abstraction)
- Forms: React Hook Form + Zod (validation)
- UI: React 19 + shadcn/ui + TailwindCSS v4
- Auth: Auth.js v5 (NextAuth) + otplib (TOTP MFA)
- Jobs: pg-boss (Postgres-backed queue)
- PDF: @react-pdf/renderer + @signpdf/signpdf
- File storage: Vercel Blob (document vault)
- Logging: pino + structured traces
- Error tracking: Sentry

**Storage**: PostgreSQL (primary relational DB); Vercel Blob (document vault); Postgres WAL for job queue  
**Testing**: Vitest (unit), Playwright (e2e), axe-core (a11y), Lighthouse CI  
**Target Platform**: Web browser (desktop/laptop primary; tablet-functional; mobile-graceful); server-side rendering (Next.js App Router)  
**Project Type**: Full-stack web application (SPA + REST API + relational DB + background jobs + signing service)  
**Performance Goals**: 
- Cold page load ≤ 3 s on 4G (p95) / ≤ 1.5 s desktop
- Warm SPA navigation ≤ 500 ms (p95)
- Wizard step render ≤ 2 s (p95)
- Core Web Vitals: FCP ≤ 1.8 s, LCP ≤ 2.5 s, CLS ≤ 0.1, INP ≤ 200 ms (p75 mobile)
- JS bundle ≤ 250 KB gzipped initial, ≤ 100 KB per route chunk
- OTP delivery ≤ 30 s; file upload (10 MB) ≤ 10 s on 4 Mbps
- Public certificate verification ≤ 1 s cached / ≤ 3 s cold

**Constraints**: 
- India data residency (DPDP Act 2023) — all PII and document vault on India-region infrastructure
- No Aadhaar for authentication; no biometric; no eKYC in MVP
- No card/CVV/bank credentials stored — payment-gateway tokenization mandatory
- Tamper-evident PDF via portal-held document-signing certificate (CA-issued, HSM-stored)
- Append-only audit log, not mutable by any role
- No PII in URLs, history, logs, or error messages
- OWASP Top 10 mitigations; pre-launch VAPT required
- WCAG 2.1 AA accessibility mandatory

**Scale/Scope**: 
- User base: 500–1000 active members, 20–50 peak concurrent sessions
- Membership types: 3 (Ordinary, Associate, RERA Project)
- Firm types: 7 (Proprietorship, Partnership, Private Limited, LLP, Public Sector, AOP, Co-operative)
- Wizard steps: 12 (with conditional fields per membership+firm combination)
- Staff roles: 6 (Scrutiniser, Convenor, Director General, Secretary, Payment Officer, Admin)
- Document vault: 50–100 documents per active member over 5+ years
- External integrations: GST verification, PAN verification, payment gateway, email service

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Answer each applicable question before proceeding. "N/A — [reason]" is a valid answer.

### **I (Type-Safe Full-Stack)**
**Q: Are all new API procedures tRPC with Zod-validated inputs/outputs? Is any new env config added to `src/env.js`?**

**A:** YES — fully type-safe end-to-end.
- All 12 wizard steps expose tRPC procedures with step-specific Zod input/output schemas (membership + firm type conditional branching encoded in Zod)
- Staff approval workflow procedures (approve/raise-objection/reject) with tRPC + Zod
- External integrations (GST verify, PAN verify, payment confirm) wrapped in tRPC procedures with typed request/response
- Environment config: `src/env.js` includes `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `AUTH_GITHUB_ID/SECRET` (staff MFA provider), `SENTRY_DSN`, `STORAGE_URL` (Blob vault), `PAYMENT_GATEWAY_KEY`, `GST_VERIFY_API_KEY`, `PAN_VERIFY_API_KEY`, `EMAIL_PROVIDER_KEY`, etc. All validated at boot via `@t3-oss/env-nextjs`.

### **II (Security & Privacy by Design)**
**Q: Does this feature touch PII, Aadhaar, payment, or auth? If yes, list controls applied: encryption keys, RBAC enforcement, MFA gate, log masking.**

**A:** YES — comprehensive security-by-construction required.
- **PII handling:** Firm name, contact person, directors/partners (names, DIN, contact). GST and PAN (unmasked for external verification, masked in UI/logs). Aadhaar (read-only in vault, field-level envelope encryption with separate key).
- **Encryption at rest:** AES-256 on all database columns storing name, email, phone, PAN, Aadhaar; separate envelope key for Aadhaar (stored in secrets manager, never in code/env-dumps).
- **No PII in URLs:** Pagination, filtering use opaque IDs; no firm-name / email in query strings. Session state server-side.
- **Auth:** Applicants: email + OTP (no password). Staff: email + password + TOTP MFA (mandatory for all 6 roles; ≤ 30 min idle timeout / 8 h absolute).
- **RBAC:** 8 roles (Applicant, Member, Scrutiniser, Convenor, Director General, Secretary, Payment Officer, Admin) enforced server-side on every tRPC procedure and REST endpoint. Client-side role-based UI hiding is supplementary only. Scrutiniser-only edit privilege enforced in middleware.
- **Secrets manager:** `NEXTAUTH_SECRET`, payment gateway keys, API credentials for GST/PAN/email stored externally; never in `.env.local` or git.
- **Logging:** pino with redaction middleware to mask PII (firm names, contact info, PAN, Aadhaar) before structured-log emission. Sentry error reporting also redacted.
- **Payment data:** No card / CVV / bank credentials stored on portal. Payment gateway tokenization mandatory (gateway-specific tokens only).

### **III (Compliance-by-Construction)**
**Q: Are all business rules encoded as Zod schemas? Is the wizard step schema updated? Is the approval state machine updated?**

**A:** YES — all rules enforced in code via Zod schemas and state machine.
- **Wizard schema:** Master schema in `src/schemas/wizard.ts` defines 12 steps, each with conditional fields per Membership Type + Firm Type.
  - Example: Partnership firm type requires ≥ 2 partners (enforced via `minPartners: 2` Zod validation on Step 6).
  - Associate Membership requires an approved Ordinary Member as Proposer (enforced via `proposerStatus: 'Active'` Zod refinement).
  - GST/PAN verification status is first-class field (not computed on-the-fly; stored and updateable by Scrutiniser).
- **State machine:** Explicit state machine in `src/services/workflow/stateMachine.ts` (TypeScript union type or state-machine library like `xstate`).
  - States: Draft → Submitted → UnderScrutiny → AtConvenor → AtDirectorGeneral → AtSecretary → Approved → CertificateIssued (names match spec.md entity definitions exactly)
  - Terminal: Rejected (no inheritance to next stage)
  - Bounce: Objection from any stage → back to Scrutiniser (not applicant)
  - Scrutiniser re-approval → restart from Convenor (full chain re-run)
- **All constraints enforced inline:** Wizard Next button disabled until step is fully valid; Submit button disabled until all steps complete + declaration accepted.
- **Auto-approval for renewals:** `src/services/renewal/autoApprove.ts` encodes "no material changes" logic (all renewed fields unchanged + vault docs superseded, not replaced) as Zod refinement.

### **IV (Resilient External Integrations)**
**Q: Does this feature call GST/PAN/payment/email? If yes, confirm queue-and-retry and provider-agnostic adapter interface are in place.**

**A:** YES — all external integrations use queue-and-retry with internal adapter interfaces.
- **GST verification:** Non-blocking; initiated via tRPC, stored as "Pending" status in application. pg-boss worker with exponential backoff (1s, 2s, 4s, 8s, … up to 5 retries). On outage, user can submit with "Pending" status visible to Scrutiniser (who can re-trigger verification later).
- **PAN verification:** Same pattern as GST.
- **Payment gateway:** Webhooks idempotent (idempotency key checked before ledger write). Out-of-order, duplicate, and replay-safe. pg-boss worker reconciles failed payments with retries.
- **Email service:** All transactional emails (OTP, application confirmation, renewal reminder, rejection notice, certificate issued, query thread, etc.) queued in pg-boss. Provider-agnostic adapter (`src/services/email/index.ts` exports interface, implementations for SendGrid / SES / SMTP switchable via `EMAIL_PROVIDER` env var).
- **Adapter interface pattern:** Each integration sits behind a service interface (e.g., `IGSTVerificationService`, `IPaymentGatewayService`, `IEmailService`), allowing provider swap by configuration without touching business logic.

### **V (Append-Only Audit Trail)**
**Q: Are all new state transitions, staff actions, document accesses, and certificate events wired to the centralized audit-log writer?**

**A:** YES — append-only audit log captures every material action.
- **Centralized writer:** `src/services/audit/writer.ts` (write-only, no update/delete operations possible on the audit table at the DB constraint level).
- **Capture scope:** All application state transitions (Submitted → Verification → Approved → Certificate Issued), all staff actions (Approve / Raise Objection / Reject with reason), Scrutiniser inline edits (before/after comparison + timestamp), document uploads + vault replacements, Aadhaar reads, certificate issuance + supersession on renewal + revocation, offline payment entries + reversals, President-record changes, every login attempt (success and failure), DSAR requests and resolutions, GST/PAN re-verification triggers.
- **Immutability:** Audit table enforces `ONLY INSERT` at the database layer (PostgreSQL trigger or constraint); UPDATE/DELETE are architecturally impossible.
- **Fields:** Timestamp (UTC), actor ID + role, event type, resource ID, before/after state (if applicable), change reason (staff actions), trace ID (linked to app logs).

### **VI (Accessibility & Performance)**
**Q: Does this feature add or modify UI? If yes, confirm axe-core and Lighthouse CI ≥ 90 gates pass, keyboard navigation verified.**

**A:** YES — dual surface (applicant wizard + staff review dashboard) with WCAG 2.1 AA enforcement.
- **UI components:** shadcn/ui library with Tailwind tokens (all color values semantic, contrast ≥ 4.5:1 body / ≥ 3:1 large text/UI verified via DevTools contrast checker).
- **Keyboard navigation:** Full 12-step wizard navigable by keyboard alone (Tab order follows visual reading order; no use of Skip Links redundant — top bar has explicit skip link). WizardStepRail steps navigable via arrow keys. Form field focus management on step transitions (focus moved to first field of new step).
- **ARIA & semantic HTML:** Wizard: `<main role="main">`, step rail `<nav aria-label="Application steps">`, form sections `<fieldset>` + `<legend>`. Staff review: `<table role="grid">` with ARIA headers. All error messages linked via `aria-describedby`. Required fields `aria-required="true"`.
- **a11y CI gates:** axe-core integrated into Next.js dev server (console warnings for AA violations). Lighthouse CI ≥ 90 accessibility gate in CI/CD pipeline.
- **Testing:** Smoke tests on NVDA + Chrome (Windows, primary user base) and VoiceOver + Safari (secondary); test path: OTP login → wizard completion → document upload → approval confirmation.

### **VII (Observability-First)**
**Q: Are structured logs (no PII) and tracing spans added for all new server-side paths? Is a runbook written for any new failure mode?**

**A:** YES — structured logging, distributed tracing, and runbooks.
- **Structured logging:** pino configured with redaction middleware; every tRPC procedure and background job emits structured logs with trace ID, request ID, actor ID/role, duration, outcome. No PII (all sensitive fields redacted by schema before emission).
- **Distributed tracing:** OpenTelemetry spans cover: OTP → auth → wizard step submission → document upload → external verification → payment → approval workflow → certificate signing → notification. Trace ID propagated through all logs and errors.
- **RUM (Real User Monitoring):** Core Web Vitals tracked in production (FCP, LCP, CLS, INP). Synthetic uptime checks on public certificate-verification endpoint.
- **Alerts:** Pagerduty / Datadog routing on: external service failures (GST/PAN/payment/email), vault retrieval degradation, certificate-signing failures, job-queue backlog, error-rate > 1%, latency p95 > 3s applicant / > 5s staff.
- **Runbooks:** Documented per failure mode before production deploy:
  - GST API down → queue-and-retry, manual re-trigger from staff UI
  - Payment gateway webhook failure → idempotent retry, reconciliation job
  - Aadhaar encryption key rotation → HSM rotation procedure, migration of existing Aadhaar records
  - Audit log query performance degradation → archival job + analytics-DB sync
  - Certificate-signing service unavailable → queue-and-retry, approval held in "Certificate Pending" state
  - OTP delivery timeout → fallback SMS, manual password reset for staff

## Project Structure

### Documentation (this feature)

```text
specs/001-credai-member-portal/
├── spec.md              # Feature specification (input)
├── plan.md              # This file (implementation plan)
├── research.md          # Phase 0: decisions on open architecture items
├── data-model.md        # Phase 1: entity definitions and relationships
├── contracts/           # Phase 1: tRPC procedure contracts, email event schemas
│   ├── wizard-steps.schema.ts
│   ├── approval-workflow.schema.ts
│   ├── payment-ledger.schema.ts
│   ├── email-events.schema.ts
│   └── audit-events.schema.ts
├── quickstart.md        # Phase 1: developer onboarding for this feature
└── tasks.md             # Phase 2: (/speckit-tasks command)
```

### Source Code (Repository root — Next.js App Router)

```text
credai/
├── src/
│   ├── app/                          # Next.js App Router pages
│   │   ├── (auth)/                   # Applicant auth (OTP)
│   │   │   └── login/
│   │   ├── (apply)/                  # Applicant wizard (12 steps)
│   │   │   ├── [step]/
│   │   │   └── submit/
│   │   ├── (member)/                 # Applicant member dashboard / renewal
│   │   │   ├── dashboard/
│   │   │   ├── renew/
│   │   │   └── vault/
│   │   ├── (admin)/                  # Staff application (requires MFA)
│   │   │   ├── login/
│   │   │   ├── review/               # Approval workflow queue
│   │   │   ├── dashboard/            # Operational dashboards
│   │   │   ├── payment/
│   │   │   └── settings/
│   │   ├── public/                   # Public endpoints
│   │   │   └── verify/               # Public certificate verification
│   │   └── api/
│   │       └── webhooks/             # Payment gateway webhooks
│   │
│   ├── components/                   # React components (shadcn/ui based)
│   │   ├── wizard/
│   │   │   ├── WizardStepRail.tsx
│   │   │   ├── ConditionalFieldGroup.tsx
│   │   │   ├── DocumentUploadCard.tsx
│   │   │   ├── AutoSaveIndicator.tsx
│   │   │   └── [12 step components]
│   │   ├── staff/
│   │   │   ├── ApplicationQueue.tsx
│   │   │   ├── ReviewPanel.tsx
│   │   │   ├── ReviewChecklistPanel.tsx
│   │   │   ├── QueryThread.tsx
│   │   │   └── ApplicationStatusTimeline.tsx
│   │   ├── common/
│   │   │   └── [shared components]
│   │   └── ui/
│   │       └── [shadcn/ui exports]
│   │
│   ├── server/
│   │   ├── api/
│   │   │   ├── routers/
│   │   │   │   ├── wizard.router.ts     # 12 step procedures + submit
│   │   │   │   ├── approval.router.ts   # 4-stage workflow procedures
│   │   │   │   ├── payment.router.ts    # Online + offline ledger
│   │   │   │   ├── renewal.router.ts    # Renewal form + submit
│   │   │   │   ├── vault.router.ts      # Document access
│   │   │   │   ├── member.router.ts     # Member directory (public) + dashboard (member)
│   │   │   │   └── admin.router.ts      # Staff dashboards + user management
│   │   │   └── root.ts                  # tRPC root router
│   │   ├── db.ts                        # Prisma client
│   │   ├── auth.ts                      # Auth.js config
│   │   └── services/
│   │       ├── wizard/
│   │       │   ├── schema.ts            # Master Zod schemas for all 12 steps
│   │       │   ├── stepValidation.ts    # Per-step validation logic
│   │       │   └── draftPersistence.ts  # Draft save/resume
│   │       ├── workflow/
│   │       │   ├── stateMachine.ts      # 4-stage approval state machine
│   │       │   ├── roleBasedActions.ts  # Approval actions per role
│   │       │   └── autoApproval.ts      # Renewal auto-approval logic
│   │       ├── external/
│   │       │   ├── gst/                 # GST verification adapter
│   │       │   ├── pan/                 # PAN verification adapter
│   │       │   ├── payment/             # Payment gateway adapter (provider-agnostic)
│   │       │   └── email/               # Email service adapter (provider-agnostic)
│   │       ├── vault/
│   │       │   ├── documentUpload.ts    # File validation + Blob storage
│   │       │   ├── documentRetrieval.ts # Versioning + supersession
│   │       │   └── retentionPolicy.ts   # Automated lifecycle enforcement
│   │       ├── certificate/
│   │       │   ├── generator.ts         # PDF rendering + signing
│   │       │   ├── storage.ts           # Vault + archive
│   │       │   └── verification.ts      # Public endpoint + QR validation
│   │       ├── audit/
│   │       │   └── writer.ts            # Append-only audit log (write-only middleware)
│   │       ├── notifications/
│   │       │   ├── emailQueue.ts        # Event-driven email dispatch
│   │       │   └── templates/           # Email templates
│   │       ├── jobs/
│   │       │   ├── renewalReminders.ts  # T-30 / T-15 jobs
│   │       │   ├── membershipStatus.ts  # Status transitions (Active → Renewal Due → Lapsed)
│   │       │   ├── retentionCleanup.ts  # Lifecycle enforcement
│   │       │   └── externalReverify.ts  # GST/PAN re-verification
│   │       └── auth/
│   │           ├── totp.ts              # TOTP MFA for staff
│   │           └── sessions.ts          # Session timeout enforcement
│   │
│   ├── schemas/
│   │   ├── wizard.ts                    # Master wizard step schemas (Zod)
│   │   ├── application.ts               # Application data model schema
│   │   ├── payment.ts                   # Payment ledger schema
│   │   ├── audit.ts                     # Audit event schema
│   │   └── email.ts                     # Email event schema
│   │
│   ├── lib/
│   │   ├── auth.ts                      # Auth utilities
│   │   ├── rbac.ts                      # RBAC enforcement helpers
│   │   ├── encryption.ts                # AES-256 encryption utilities (envelope + field-level)
│   │   ├── logging.ts                   # Structured logging + redaction
│   │   ├── tracing.ts                   # Distributed tracing (OpenTelemetry)
│   │   └── constants.ts                 # Membership types, firm types, role names
│   │
│   ├── env.js                           # Environment variable validation (Zod)
│   └── middleware.ts                    # Auth + RBAC + audit middleware
│
├── prisma/
│   ├── schema.prisma                    # Data model (entities + relationships)
│   └── migrations/                      # Database migrations
│
├── public/
│   └── [static assets]
│
├── tests/
│   ├── e2e/
│   │   ├── wizard.spec.ts               # 12-step wizard flow
│   │   ├── approval.spec.ts             # 4-stage approval workflow
│   │   ├── renewal.spec.ts              # Renewal flow
│   │   └── payment.spec.ts              # Online + offline payment
│   ├── unit/
│   │   ├── schemas/                     # Zod schema validation tests
│   │   ├── services/                    # Business logic unit tests
│   │   └── [routers]/                   # tRPC procedure tests
│   └── integration/
│       ├── wizard-integration.ts
│       ├── workflow-integration.ts
│       └── external-integrations.ts     # Mock GST/PAN/payment for testing
│
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── eslint.config.js
├── vitest.config.ts
├── playwright.config.ts
└── .env.example
```

**Structure Decision:** Single Next.js App Router project (no monorepo). 
- **Rationale:** MVP scope does not justify Turborepo or separate backend/frontend packages. A cohesive Next.js App Router project with tRPC co-location maximizes type safety and developer velocity. All 14 capability groups (auth, wizard, verification, payment, approval, certificates, renewal, vault, dashboards, notifications, user-mgmt, audit, accessibility, observability) fit cleanly into the layered structure above.
- **Scalability:** Per-tenant key pattern adopted in auth/db schemas (not yet needed for MVP but enables Phase 3 multi-chapter expansion without redesign).

## Complexity Tracking

**No Constitution Check violations.** All principles satisfied by design:
- **Principle I:** tRPC + Zod throughout; env-var validation at boot.
- **Principle II:** Encryption, RBAC, MFA, audit logging all designed in.
- **Principle III:** Zod schemas encode all business rules; state machine for approval workflow.
- **Principle IV:** Queue-and-retry (pg-boss) for all external services; provider-agnostic adapters.
- **Principle V:** Append-only audit log middleware on every state-changing endpoint.
- **Principle VI:** shadcn/ui + ARIA + accessibility CI gates; keyboard navigation verified.
- **Principle VII:** Structured logging + distributed tracing + runbooks before production.
