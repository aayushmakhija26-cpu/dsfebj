<!--
SYNC IMPACT REPORT
Version change: (none) → 1.0.0
Modified principles: N/A (first edition)
Added sections:
  - Core Principles (I–VII)
  - Technology Stack & Constraints
  - Development Workflow & Quality Gates
  - Governance
Removed sections: N/A
Templates requiring updates:
  ✅ .specify/memory/constitution.md — this file
  ✅ .specify/templates/plan-template.md — Constitution Check gates replaced with
     principle-specific questions
  ✅ .specify/templates/spec-template.md — no structural changes needed; already aligned
  ✅ .specify/templates/tasks-template.md — no structural changes needed; phase model
     already aligns with workflow gate order
Follow-up TODOs:
  - Hosting selection (Open Decision #6 from architecture.md) remains pending;
    India data-residency constraint already encoded in Principle II applies to all choices.
  - Payment gateway selection (Open Decision #2) remains pending;
    resilience pattern mandated by Principle IV applies regardless of provider.
  - Document-signing CA selection and HSM/KMS custody decision (architecture Open Decision)
    must be resolved before the Certificate & Public Verification epic begins.
-->

# Credai Constitution

## Core Principles

### I. Type-Safe Full-Stack (T3 Stack)

The entire application MUST be implemented in TypeScript with strict mode enabled end-to-end.
All API boundaries MUST use tRPC v11 for type-safe procedure definitions shared across client
and server. All data validation — form inputs, API payloads, environment variables — MUST use
Zod schemas. Database access MUST go through Prisma ORM; raw SQL is permitted only for
operations Prisma cannot express and MUST be reviewed and documented.
Environment variables MUST be validated at boot time via `@t3-oss/env-nextjs`; a missing
required variable MUST cause a startup failure, not a runtime error.

### II. Security & Privacy by Design (NON-NEGOTIABLE)

All security and privacy controls are mandatory and not subject to deferral or exceptions:

- TLS 1.2+ with HSTS on all endpoints.
- Data at rest MUST be AES-256 encrypted; Aadhaar fields MUST use a separate envelope
  encryption key stored in a secrets manager — never in code, environment dumps, or logs.
- No PII in URLs, browser history, log lines, or error messages — enforced at the
  response-serialization layer, not only in the UI.
- RBAC MUST be enforced server-side on every tRPC procedure and REST endpoint;
  client-side hiding is supplementary only.
- All six CREDAI-side staff roles MUST require TOTP MFA; session timeout ≤ 30 min
  idle / 8 h absolute.
- OWASP Top 10 mitigations MUST be applied; pre-launch VAPT is required before go-live.
- India data residency: all PII and document-vault data MUST reside on India-region
  infrastructure (DPDP Act 2023 / NFR36).
- DPDP Act 2023 compliance: explicit, purpose-bound, timestamped consent capture;
  data-subject access / correction / erasure handlers; breach-notification procedure.
- No Aadhaar for authentication; no biometric capture; no eKYC integration in MVP.
- No card/CVV/bank credentials stored on the portal; payment-gateway tokenization mandatory.

### III. Compliance-by-Construction (NON-NEGOTIABLE)

All membership rules, regulatory constraints, and document requirements MUST be enforced
in code — not in documentation, staff training, or post-submission review.

- The 12-step adaptive wizard MUST be schema-driven: fields, uploads, conditional minimums
  (e.g., ≥ 2 partners, ≥ 2 directors, ≥ 1 completed project for Ordinary Membership), and
  cross-step dependencies (e.g., Associate Membership requires an approved Ordinary Member
  as proposer) MUST be declared in Zod schemas and enforced at each wizard step.
- An application that violates any mandatory constraint MUST NOT be submittable; validation
  MUST fire inline at each step, not only on final submission.
- GST and PAN verification status are first-class application fields; the Scrutiniser MUST
  be able to trigger re-verification from within the approval workflow.
- The multi-stage approval state machine (Scrutiniser → Convenor → DG → Secretary, with
  bounce-back and reject terminals) MUST be implemented as an explicit state machine;
  ad-hoc status strings are prohibited.

### IV. Resilient External Integrations

All integrations with external services (GST verification, PAN verification, payment
gateway, email) MUST use a queue-and-retry pattern with documented exponential backoff.

- Outages in any external service MUST NOT block application submission; the record MUST
  be persisted with the verification or payment status recorded as "pending."
- Payment-gateway webhook handlers MUST be idempotent; duplicate delivery, out-of-order
  delivery, and replay MUST NOT create duplicate ledger entries.
- All external-service adapters MUST sit behind internal interfaces so that a provider
  can be replaced by configuration without touching business logic.
- Uniqueness on offline payment receipt/reference numbers MUST be enforced at the
  database constraint level, not only in application code.

### V. Append-Only Audit Trail (NON-NEGOTIABLE)

The audit log is a write-only, tamper-evident record. No role — including System Admin —
may update or delete audit entries. This MUST be enforced architecturally: the audit-log
write path MUST exclude UPDATE and DELETE operations on the audit table.

The following events MUST each generate an audit entry: all application state transitions;
staff actions with reason field; document accesses; Aadhaar reads; certificate issuance,
supersession, and revocation; offline payment entries and reversals; President-record
changes; every login attempt (success and failure); data-subject requests and resolutions.

Audit entries MUST be searchable and exportable for compliance reporting (NFR62–NFR65).

### VI. Accessibility & Performance

Accessibility and performance are product requirements enforced in CI, not post-launch polish:

- WCAG 2.1 AA compliance is mandatory; the full 12-step wizard MUST be completable by
  keyboard alone, with correct focus management on every step transition.
- All UI components MUST use semantic HTML + ARIA; errors MUST be announced via
  `role="alert"`; contrast ratio ≥ 4.5:1 (3:1 for large text / UI components).
- axe-core MUST run in development; Lighthouse CI MUST score ≥ 90 accessibility;
  NVDA + VoiceOver smoke tests are required before each release.
- Core Web Vitals (p75 mobile): FCP ≤ 1.8 s, LCP ≤ 2.5 s, CLS ≤ 0.1, INP ≤ 200 ms.
- Cold page load ≤ 3 s on 4G / ≤ 1.5 s desktop (p95); warm SPA navigation ≤ 500 ms p95.
- Initial JS bundle MUST NOT exceed 250 KB gzipped; per-route chunk MUST NOT exceed 100 KB.

### VII. Observability-First

Every subsystem MUST be observable from the day it ships to production:

- All server-side code MUST emit structured logs with a trace ID; no PII in any log line.
- Distributed tracing MUST cover the wizard → submit → approval workflow → notification path.
- RUM MUST track Core Web Vitals in production; synthetic uptime checks MUST alert on
  availability / latency / error-rate breaches.
- Alerts MUST cover: external-service (GST/PAN/payment) failures, vault-retrieval
  degradation, certificate-signing failures, and job-queue backlogs.
- A runbook MUST exist for every defined failure mode before that feature ships to production.

## Technology Stack & Constraints

The following choices are locked by the PRD, UX specification, and architecture decision
document. Deviations require a Principle I constitution amendment.

| Layer | Choice |
|---|---|
| Language | TypeScript (strict mode) |
| Framework | Next.js 15 with App Router |
| API | tRPC v11 (server-component-native) |
| ORM | Prisma (latest stable) |
| Database | PostgreSQL |
| Auth | Auth.js v5 (NextAuth) + TOTP (staff MFA via otplib) |
| Validation | Zod (all data boundaries) |
| Styling | TailwindCSS + shadcn/ui |
| Forms | React Hook Form + Zod resolvers |
| Animations | framer-motion (wizard conditional reveals) |
| Toasts | Sonner |
| File storage | Vercel Blob (document vault) |
| Job queue | pg-boss (Postgres-backed, durable) |
| PDF + signing | @react-pdf/renderer + @signpdf/signpdf + qrcode |
| Email | nodemailer behind provider-agnostic adapter interface |
| Error tracking | Sentry |
| Structured logging | pino / pino-pretty |
| Captcha | Cloudflare Turnstile (@marsidev/react-turnstile) |
| Unit testing | Vitest |
| E2E testing | Playwright |
| A11y CI | axe-core + Lighthouse CI |
| Package manager | pnpm |
| Env validation | @t3-oss/env-nextjs (Zod-backed boot-time) |
| i18n | next-intl (English-only MVP; copy externalized for Phase 3 Marathi/Hindi) |

**Hard constraints — non-overridable without a MAJOR constitution amendment:**

- No Aadhaar for authentication; no biometric capture; no eKYC integration in MVP.
- No card/CVV/bank credentials stored on portal; gateway tokenization mandatory.
- Document-signing certificate MUST be a CA-issued cert managed via HSM or cloud KMS
  (portal-held, not per-certificate manual DSC).
- All hosting on India-region infrastructure (DPDP Act 2023).
- English-only UI in MVP; all copy MUST be externalized via next-intl.

## Development Workflow & Quality Gates

All feature work MUST follow the Spec Kit workflow in order:

1. **Specify** (`/speckit-specify`) — acceptance scenarios and requirements before any code.
2. **Plan** (`/speckit-plan`) — implementation plan with Constitution Check gate.
3. **Tasks** (`/speckit-tasks`) — dependency-ordered task list before coding.
4. **Implement** (`/speckit-implement`) — task-by-task execution.
5. **Analyze** (`/speckit-analyze`) — cross-artifact consistency check before shipping.

**Constitution Check gate** (required in every `plan.md`, before Phase 0 research):

Every plan MUST explicitly answer each applicable question:

- **Principle I:** Are all new API procedures defined as tRPC procedures with Zod-validated
  inputs and outputs? Is environment config validated at boot?
- **Principle II:** Does this feature touch PII, Aadhaar, payment data, or authentication?
  If yes, enumerate the controls applied (encryption, masking, RBAC enforcement, MFA gate).
- **Principle III:** Are all business rules and compliance constraints expressed as Zod
  schemas? Is the wizard step schema updated? Is the state machine updated?
- **Principle IV:** Does this feature call an external service? If yes, is queue-and-retry
  implemented with an internal adapter interface?
- **Principle V:** Are all new state transitions, staff actions, document accesses, and
  certificate events wired to the centralized audit-log writer?
- **Principle VI:** Does this feature add or modify UI? If yes, are axe-core and Lighthouse
  CI gates configured and passing? Is keyboard navigation verified?
- **Principle VII:** Are structured logs (no PII) and distributed tracing spans added for
  all new server-side code paths? Is a runbook written for any new failure mode?

**PR merge quality gates:**

- `tsc --noEmit` passes (zero type errors).
- ESLint passes with no suppressed errors.
- Vitest unit tests green.
- Playwright e2e tests green on affected flows.
- Lighthouse CI ≥ 90 accessibility (for UI changes).
- No new PII in log lines (structured-log review during PR).

## Governance

This constitution supersedes all other development practices and team conventions.
Where the constitution conflicts with a library default, framework convention, or
external guidance, the constitution takes precedence.

**Amendment procedure:**

1. Propose the amendment in writing: principle or section changed, rationale,
   version-bump type (MAJOR / MINOR / PATCH), propagation checklist.
2. Amendment MUST be reviewed and approved before the next feature spec begins.
3. Once approved, run `/speckit-constitution` to apply; version MUST be incremented.
4. All in-flight feature specs MUST be re-reviewed against amended principles before
   implementation continues.

**Versioning policy:**

- MAJOR: Backward-incompatible change — principle removal, NON-NEGOTIABLE redefinition,
  or hard-constraint removal.
- MINOR: New principle, new section, or materially expanded guidance.
- PATCH: Clarifications, wording refinements, typo fixes, non-semantic changes.

**Compliance review:** Every PR review MUST verify the changed code complies with all
applicable principles. Non-compliance blocks merge; exceptions require a MAJOR amendment.

**Version**: 1.0.0 | **Ratified**: 2026-04-27 | **Last Amended**: 2026-04-28
