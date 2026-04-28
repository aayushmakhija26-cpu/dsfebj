# Tasks: CREDAI Pune Digital Member Portal

**Feature**: CREDAI Pune Digital Member Portal  
**Generated**: 2026-04-28  
**Status**: Ready for Implementation  
**Branch**: `001-credai-member-portal`

---

## Implementation Strategy

This portal replaces a paper-heavy membership process with a self-serve lifecycle platform. The implementation follows a **user-story-first approach** with independent testability for each story.

### MVP Scope

**Phase 1–2**: Project setup + foundational infrastructure  
**Phase 3–4**: User Stories 1–2 (P1) — Core applicant + staff workflows  
**Phase 5–8**: User Stories 3–6 (P2, P3) — Renewals, payments, certificates, admin  
**Phase 9**: Polish & observability gates  

### Success Metrics

- **First-time-right submissions**: ≥80% of applicants complete without document rejections
- **Median completion time**: ≤30 minutes for Ordinary Membership applications
- **Staff review time**: ≤30 minutes per application
- **OTP delivery**: ≤30 seconds (95% of requests)
- **Page response time**: ≤3 seconds (p95) for user-facing endpoints
- **Availability**: ≥99.5% monthly

---

## Dependencies & Execution Order

### Critical Path

1. **Phase 1 & 2** must complete before any user story work begins
2. **US1 & US2** (P1) are independent and can be implemented in parallel
3. **US3, US4, US5** (P2) depend on US1 + US2 completion
4. **US6** (P3) can begin in Phase 3 but is not blocking any user story

### Parallel Opportunities

- **US1 & US2**: Wizard implementation and staff-review UI can proceed in parallel after Phase 2 (different routers, different components)
- **Certificate generation (US5)** and **renewal (US3)** backend logic can proceed in parallel once US1 + US2 complete

---

## Phase 1: Setup & Project Initialization

### Story Goal
Initialize a production-ready Next.js 15 App Router project with environment validation, TypeScript strict mode, and foundational configuration.

### Independent Test Criteria
- Project starts without errors: `npm run dev` serves on localhost:3000
- TypeScript strict mode passes: `npx tsc --noEmit`
- Environment variables validated at boot (missing/invalid vars block startup)
- All critical dependencies pinned (package.json lock file committed)

### Phase 1 Tasks

- [x] T001 Create Next.js 15 App Router project with TypeScript 5.x strict mode
- [x] T002 Set up package.json with all core dependencies (tRPC, Prisma, React Hook Form, shadcn/ui, Zod, Auth.js, pg-boss, Sentry, pino, etc.)
- [x] T003 Create `src/env.js` environment variable validation using @t3-oss/env-nextjs with all required vars (DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, payment gateway keys, external verification API keys, Blob storage URL, KMS key ID, CLOUDFLARE_TURNSTILE_SITE_KEY, CLOUDFLARE_TURNSTILE_SECRET_KEY, PUBLIC_VERIFY_RATE_LIMIT, etc.)
- [x] T004 [P] Create `.env.local.example` as reference for all required environment variables with secure defaults
- [x] T005 Set up `.gitignore` to exclude `.env.local`, `node_modules`, `dist`, `build`, `.next`, and other sensitive paths
- [x] T006 Create `tsconfig.json` with strict mode enabled, path aliases (`@/*` → `src/*`), and target ES2020
- [x] T007 Create base ESLint configuration (`eslint.config.js`) with TypeScript + React rules
- [x] T008 Configure Tailwind v4 (`tailwind.config.ts`) with shadcn/ui color tokens and custom theme extensions (CREDAI branding colors)
- [x] T008b Set up `next-intl` internationalization (`pnpm add next-intl`): create `src/i18n/request.ts` config, `messages/en.json` message file, and wrap `src/app/layout.tsx` with `NextIntlClientProvider`; all static UI strings (labels, error messages, button text, email subjects) MUST be added to en.json and imported via `useTranslations()` — no hardcoded string literals in any component or template file (constitution hard constraint)
- [x] T009 Set up Next.js App Router folder structure: `src/app`, `src/components`, `src/server`, `src/schemas`, `src/lib`, `src/middleware.ts`
- [x] T010 [P] Create `public/` folder with CREDAI Pune logo, favicon, and static assets
- [x] T011 Create `vitest.config.ts` for unit test setup and coverage configuration
- [x] T012 Create `playwright.config.ts` for E2E test setup (browser context, base URL, parallel workers)
- [x] T013 Create a README.md with setup instructions, development commands (dev, build, test, e2e, lint), and deployment guide
- [x] T014 Initialize GitHub Actions CI/CD workflow (`.github/workflows/ci.yml`) with: lint, type check, unit tests, e2e tests, Lighthouse CI gates (accessibility ≥90)
- [x] T015 Create LICENSE file and basic project governance documentation
- [x] T016 Commit initial setup with message "chore: initialize Next.js project structure and environment configuration"

---

## Phase 2: Foundational Infrastructure

### Story Goal
Establish core backend infrastructure: database schema, authentication framework, validation schemas, and middleware layer for RBAC + audit logging.

### Independent Test Criteria
- Database migrations run without errors: `npm run prisma migrate deploy`
- Prisma schema generates without warnings: `npm run prisma generate`
- Auth.js session works with test credentials
- All Zod schemas parse valid test data and reject invalid data
- Audit middleware logs all test events to append-only table
- Middleware chain (auth → RBAC → audit) enforces permissions correctly on test tRPC calls

### Phase 2 Tasks

- [ ] T017 [P] Create Prisma schema (`prisma/schema.prisma`) with all 16 entities: User, Applicant, Application, ApplicationStep, Document, ExternalVerification, Payment, ApprovalDecision, Member, MembershipRenewal, MembershipCertificate, DocumentVault, StaffUser, AuditLog, President, NotificationTemplate/EmailEvent
- [ ] T018 [P] Create Prisma migration for User identity table (email unique, phoneNumber unique, userType enum, timestamps)
- [ ] T019 [P] Create Prisma migration for Applicant join table (userId FK, timestamps)
- [ ] T020 [P] Create Prisma migration for Application table with membershipType, firmType, status state machine, encrypted fields (firmName, firmAddress), step tracking, timestamps
- [ ] T021 Create Prisma migration for ApplicationStep table with step number, JSON data, isComplete flag, validation status + errors JSON, timestamps
- [ ] T022 Create Prisma migration for Document table with documentType, fileSize, MIME type, Vercel Blob storageKey, version tracking (isCurrent, replacedBy), status enum, timestamps
- [ ] T023 Create Prisma migration for ExternalVerification table (GST + PAN status, reference value encrypted, retry tracking, raw response JSON, timestamps)
- [ ] T024 Create Prisma migration for Payment table with amount, status, gateway/offline tracking, unique constraints on gatewayOrderId and offlineReferenceNumber, timestamps
- [ ] T025 Create Prisma migration for ApprovalDecision table (4 stages, status enum, reviewedBy FK, decision reason, timestamps) with unique constraint on (applicationId, stage)
- [ ] T026 Create Prisma migration for Member table with membershipNumber unique, status enum, expiry date, timestamps
- [ ] T027 Create Prisma migration for MembershipRenewal table with previousData + renewalData JSON, changeDetection, auto-approval logic tracking, timestamps
- [ ] T028 Create Prisma migration for MembershipCertificate table with certificateNumber unique, president snapshot fields (name, signature image key), cert hash for tamper-evidence, validity dates, status enum, timestamps
- [ ] T029 Create Prisma migration for DocumentVault table (member archive) with versioning + supersession tracking, timestamps
- [ ] T030 Create Prisma migration for StaffUser table with role enum, TOTP secret (encrypted), recovery codes (hashed), session timeout config, timestamps
- [ ] T031 Create Prisma migration for AuditLog table (append-only) with: timestamp (indexed), eventType enum, actorId + actorRole, resourceType + resourceId, beforeState/afterState JSON, reason, ipAddress (hashed), metadata JSON; add database constraint preventing UPDATE/DELETE
- [ ] T032 Create Prisma migration for President table with fullName (encrypted), signature image key, tenure start/end dates, status enum (Active/Historical), unique constraint on status='Active'; add trigger to enforce single Active President
- [ ] T033 Create Prisma migration for NotificationTemplate table (eventType enum, templateKey, subject + bodyHtml with placeholders, isActive flag)
- [ ] T034 Create Prisma migration for EmailEvent table with templateId FK, recipientEmail (encrypted), status enum, rendered subject/body, retries tracking, timestamps
- [ ] T035 Run all migrations to database: `npm run prisma migrate deploy`
- [ ] T036 Create `src/server/db.ts` exporting Prisma client singleton with connection pooling and error handling
- [ ] T037 [P] Create `src/schemas/common.ts` with reusable Zod validators: email, phone (E.164 format), UUID, encrypted-field marker, date range
- [ ] T038 [P] Create `src/schemas/user.ts` with User identity schemas (email, phone, userType)
- [ ] T039 Create `src/schemas/application.ts` with Application + ApplicationStep schemas (membershipType, firmType, status enum, step data structure)
- [ ] T040 Create `src/schemas/document.ts` with Document schema (documentType enum, MIME type, size validation ≤10MB, format enum [PDF, JPEG, PNG])
- [ ] T041 Create `src/schemas/payment.ts` with Payment schema (online + offline variants, amount, status enum, gateway/offline method enum, reference uniqueness)
- [ ] T042 Create `src/schemas/audit.ts` with AuditLog schema (eventType enum, resource type/ID, beforeState/afterState JSON, reason text)
- [ ] T043 Create `src/schemas/email.ts` with EmailEvent schema (eventType enum, recipientEmail, templateVariables JSON)
- [ ] T044 Create master `src/schemas/wizard.ts` with 12-step conditional Zod schemas for all membership type + firm type combinations (e.g., Partnership ≥2 partners, Associate requires Ordinary proposer)
- [ ] T045 Create `src/server/auth.ts` configuring Auth.js v5 with NextAuth email provider (OTP for applicants) + credentials provider (password for staff), session strategy (JWT or database), secrets management
- [ ] T046 [P] Create `src/lib/encryption.ts` with AES-256 encryption/decryption utilities for at-rest field encryption; separate key management for Aadhaar envelope encryption
- [ ] T047 Create `src/lib/rbac.ts` with role definitions (7 roles: Applicant, Member, Scrutiniser, Convenor, Director General, Secretary, Payment Officer, Admin) and permission matrix (which roles can access which endpoints)
- [ ] T048 Create `src/lib/logging.ts` with structured pino logger configured for JSON output + PII redaction middleware (masks firm names, emails, PAN, Aadhaar before emission)
- [ ] T049 Create `src/lib/tracing.ts` with OpenTelemetry trace initialization, trace ID propagation utilities, span creation helpers
- [ ] T050 Create `src/lib/constants.ts` exporting membership types, firm types, role names, document types, and configurable values (grace period, grace period days, OTP expiry, session timeouts)
- [ ] T051 [P] Create `src/middleware.ts` with Auth.js session middleware + RBAC permission check + AuditLog append middleware; enforce on all non-public routes
- [ ] T052 Create `src/server/api/trpc.ts` tRPC initialization with Zod input validator + Auth context provider
- [ ] T053 Create `src/server/api/root.ts` tRPC root router mounting all sub-routers (auth, wizard, approval, payment, renewal, vault, member, admin)
- [ ] T054 Create `src/server/api/routers/trpc-utils.ts` with helper procedures for common patterns (isAuthenticated, hasRole, logToAudit)
- [ ] T055 [P] Create Sentry initialization (`src/lib/sentry.ts`) with environment-based configuration, error tracking, and performance monitoring setup (avoid PII in error messages)
- [ ] T056 Create `tests/fixtures/` with seed data: test applicant accounts, test staff accounts (one per role), test applications at various workflow stages, test payments (online + offline), test documents
- [ ] T057 Create unit test file `tests/unit/schemas/` covering Zod validation for all schemas (valid data accepts, invalid data rejects)
- [ ] T058 Create integration test file `tests/integration/` for auth middleware, RBAC enforcement, audit logging with test data
- [ ] T059 Commit foundational infrastructure with message "feat: initialize database schema, auth framework, validation schemas, and middleware infrastructure"

---

## Phase 3: User Story 1 — New Member Application: Ordinary Membership (P1)

### Story Goal
Enable prospective real-estate developer firms to register, complete a 12-step adaptive membership wizard for Ordinary Membership, upload documents, verify GST/PAN, pay fees, and submit a complete application.

### Independent Test Criteria
- Test applicant can register via email + OTP
- Applicant can complete all 12 wizard steps for Partnership firm type (Ordinary Membership)
- All mandatory documents can be uploaded (validates format, size, duplicate prevention)
- GST/PAN verification status displays correctly (Verified/Pending/Failed)
- Application saves as draft and resumes correctly
- Application locks after submission (no further edits by applicant)
- Confirmation email sent within 5 minutes of submission
- Payment status shown on submission screen

### Story-Specific Entities & Dependencies
- **Entities**: User, Applicant, Application, ApplicationStep, Document, ExternalVerification, Payment
- **Schemas**: Zod for 12 wizard steps + firm/membership type conditionals
- **API Contracts**: `auth.requestOtp()`, `auth.verifyOtp()`, `wizard.getApplicationDraft()`, `wizard.submitStep()`, `wizard.getDocumentsYouNeed()`, `wizard.submitApplication()`
- **Data Models**: Applicant profile, application state machine, step validation rules, document vault, external verification queue

### Phase 3 Tasks

- [ ] T060 [US1] Create `src/app/(auth)/` folder structure for applicant authentication (OTP flow)
- [ ] T061 [US1] Create `src/app/(auth)/login/page.tsx` with email input, OTP request button, and error display
- [ ] T062 [US1] Create `src/app/(auth)/login/verify/page.tsx` with OTP code input, verify button, and resend logic
- [ ] T063 [US1] Create `src/server/api/routers/auth.router.ts` implementing auth procedures: `requestOtp()`, `verifyOtp()`, `staffLogin()`, `verifyTOTP()` with rate limiting and OTP expiry enforcement
- [ ] T064 [US1] [P] Create `src/services/auth/otp.ts` with OTP generation (6 digits), expiry tracking (2 min), brute-force protection (max 3 requests per hour per email)
- [ ] T065 [US1] [P] Create `src/services/auth/sessions.ts` with session creation, timeout enforcement (30 min idle / 8 h absolute for staff), and revocation logic
- [ ] T066 [US1] Create `src/app/(apply)/` folder structure for applicant wizard UI
- [ ] T067 [US1] Create `src/app/(apply)/[step]/page.tsx` dynamic route handling steps 1–12 with step component resolution
- [ ] T068 [US1] Create wizard step components in `src/components/wizard/`:
  - [ ] T069 `WizardStepRail.tsx` showing step 1–12 progress, current step highlight, clickable navigation (with validation block if step incomplete)
  - [ ] T070 `Step1_MembershipFirmType.tsx` (Membership Type + Firm Type selection with Documents You'll Need checklist)
  - [ ] T071 `Step2_ApplicantDetails.tsx` (Applicant name, designation, contact, email verification)
  - [ ] T072 `Step3_FirmDetails.tsx` (Firm name, address, GSTIN, PAN, MahaRERA#; triggers GST/PAN verification on blur)
  - [ ] T073 `Step4_DirectorsPartners.tsx` (Dynamic firm-type-specific principal list: ≥1 for Proprietor, ≥2 for Partnership/LLP, etc.; DIN/address per principal)
  - [ ] T074 `Step5_ProjectsExperience.tsx` (Completed Projects for Ordinary; Commencement Projects for Ordinary/Associate; project details + certificate upload)
  - [ ] T075 `Step6_Financials.tsx` (Audited financials, bank account details, revenue turnover; conditional based on firm type)
  - [ ] T076 `Step7_DocumentUpload.tsx` (Proposer/Seconder Recommendation Form, Code of Conduct, Self Declaration; templates downloadable + upload with validation)
  - [ ] T077 `Step8_Proposer_Seconder.tsx` (For Associate: dropdown list of approved Ordinary Members; same member cannot be Proposer + Seconder)
  - [ ] T078 `Step9_ComplianceDeclaration.tsx` (Declaration checkbox, DPDP consent checkboxes, OTP verification of email)
  - [ ] T079 `Step10_PaymentFeeBreakdown.tsx` (Display entrance + annual subscription + GST, online/offline payment buttons)
  - [ ] T080 `Step11_ReviewSubmit.tsx` (Read-only summary of all entered data, final submission button with declaration acceptance)
  - [ ] T081 `Step12_SubmissionConfirmation.tsx` (Confirmation page with application number, next steps, support contact)
- [ ] T082 [US1] [P] Create `src/components/wizard/AutoSaveIndicator.tsx` showing draft save status (Saving... → Saved) with timestamp
- [ ] T083 [US1] [P] Create `src/components/wizard/ConditionalFieldGroup.tsx` for rendering fields based on membership + firm type logic
- [ ] T084 [US1] Create `src/components/wizard/DocumentUploadCard.tsx` for file upload with drag-drop, format/size validation, preview, and version tracking
- [ ] T085 [US1] Create `src/server/api/routers/wizard.router.ts` implementing wizard procedures: `getApplicationDraft()`, `submitStep()`, `getDocumentsYouNeed()`, `submitApplication()`
- [ ] T086 [US1] [P] Create `src/services/wizard/draftPersistence.ts` with auto-save logic (every 30s or on field blur), draft loading, and resume from step
- [ ] T087 [US1] [P] Create `src/services/wizard/stepValidation.ts` with per-step validation logic using Zod schemas; return validation errors with field paths
- [ ] T088 [US1] Create `src/services/external/gst/index.ts` adapter interface `IGSTVerificationService` with provider implementations: `gstn-public.ts` (GSTN free API), `cdsl-licensed.ts` (licensed reseller, fallback)
- [ ] T089 [US1] Create `src/services/external/pan/index.ts` adapter interface `IPANVerificationService` with `protean.ts` (Protean API)
- [ ] T090 [US1] [P] Create `src/services/jobs/externalVerification.ts` pg-boss worker for GST/PAN verification with exponential backoff (1s, 2s, 4s, 8s, 16s, 32s), max 5 retries, non-blocking submission
- [ ] T091 [US1] Create `src/services/vault/documentUpload.ts` with file validation (format [PDF, JPEG, PNG], size ≤10MB), Vercel Blob storage, versioning, and metadata tracking
- [ ] T092 [US1] [P] Create `src/server/api/routers/vault.router.ts` implementing vault procedures: document upload, retrieval, versioning, supersession tracking
- [ ] T093 [US1] Create `src/services/workflow/stateMachine.ts` implementing explicit state machine for application status transitions; state enum values MUST match spec.md entity definitions exactly: Draft → Submitted → UnderScrutiny → AtConvenor → AtDirectorGeneral → AtSecretary → Approved → CertificateIssued | Rejected (do NOT use plan.md shorthand names: "Verification", "Convenor Approval", "DG Approval", "Secretary Approval")
- [ ] T094 [US1] Create unit tests `tests/unit/services/wizard/stepValidation.test.ts` validating all 12 wizard steps with valid/invalid data
- [ ] T095 [US1] Create unit tests `tests/unit/services/external/` for GST/PAN verification mocks with success/failure/timeout scenarios
- [ ] T096 [US1] Create E2E test `tests/e2e/wizard.spec.ts`: register → complete 12 steps for Partnership Ordinary → upload documents → submit application → verify confirmation email
- [ ] T097 [US1] Create E2E test `tests/e2e/wizard-draft.spec.ts`: start wizard → save draft → logout → login → resume from step 5 → complete application
- [ ] T098 [US1] Commit new member wizard with message "feat(US1): implement 12-step adaptive membership wizard for Ordinary Membership with auto-save and draft resumption"

---

## Phase 4: User Story 2 — Staff Review: 4-Stage Approval Workflow (P1)

### Story Goal
Enable CREDAI Pune staff (Scrutiniser, Convenor, Director General, Secretary) to review submitted applications through a 4-stage approval workflow, inspect data + documents inline, edit data (Scrutiniser only), and make decisions (Approve/Raise Objection/Reject).

### Independent Test Criteria
- Staff can log in with email + password + TOTP MFA
- Scrutiniser sees application queue with sortable/filterable columns
- All applicant data + documents visible on review screen
- Scrutiniser can inline-edit GSTIN and re-trigger GST verification
- Decision (Approve → next stage, Objection → Scrutiniser bounce, Reject → terminal)
- Upper-stage objections route to Scrutiniser (not applicant)
- Secretary approval triggers certificate generation + active member status
- Audit timeline visible showing all approvals/edits/decisions

### Story-Specific Entities & Dependencies
- **Entities**: StaffUser, ApprovalDecision, Application, AuditLog, Document
- **Schemas**: Zod for approval decision input (decision enum, reason for objection/rejection, optional edited fields)
- **API Contracts**: `approval.getApplicationQueue()`, `approval.getApplicationDetail()`, `approval.submitDecision()`
- **Data Models**: Application state machine with approval workflow, Scrutiniser edit audit trail

### Phase 4 Tasks

- [ ] T099 [US2] Create `src/app/(admin)/` folder structure for staff dashboard
- [ ] T100 [US2] Create `src/app/(admin)/login/page.tsx` with email + password fields and login button
- [ ] T101 [US2] Create `src/app/(admin)/login/mfa/page.tsx` with TOTP code input, recovery code fallback, and submit button
- [ ] T102 [US2] [P] Create `src/services/auth/totp.ts` implementing TOTP enrolment (QR code generation with secret), verification (30-sec window tolerance), and recovery code generation/hashing
- [ ] T103 [US2] Create staff onboarding flow: `src/app/(admin)/setup/page.tsx` (one-time setup after email invitation: password creation → TOTP enrolment → confirm MFA recovery codes)
- [ ] T104 [US2] Create `src/app/(admin)/review/page.tsx` (application queue dashboard with filters + sorting)
- [ ] T105 [US2] Create `src/components/staff/ApplicationQueue.tsx` displaying paginated application list with columns: Application Number, Firm Name, Membership Type, Submitted Date, GST Status, PAN Status, Payment Status; filter controls for status/type/date range
- [ ] T106 [US2] Create `src/components/staff/ReviewPanel.tsx` (detailed application review with all applicant data, documents inline, verification status pills, workflow history)
- [ ] T107 [US2] Create `src/components/staff/ReviewChecklistPanel.tsx` showing dynamic checklist per workflow stage (Firm Details, Documents, Financial, Declarations) with pass/flag/fail status per item
- [ ] T108 [US2] [P] Create `src/components/staff/ApplicationStatusTimeline.tsx` showing chronological audit events: submitted → scrutiniser decisions → objections → approvals → certificate issued; with actor name + timestamp
- [ ] T109 [US2] Create `src/components/staff/ApprovalActionButtons.tsx` with three buttons (Approve, Raise Objection, Reject) + conditional reason input; Scrutiniser-only edit form for GSTIN/PAN
- [ ] T110 [US2] Create `src/server/api/routers/approval.router.ts` implementing approval procedures: `getApplicationQueue()`, `getApplicationDetail()`, `submitDecision()`
- [ ] T111 [US2] [P] Create `src/services/workflow/roleBasedActions.ts` with action matrices per role/stage: which actions allowed (Approve, RaiseObjection, Reject), where bounce goes (applicant vs Scrutiniser), next stage logic
- [ ] T112 [US2] Create Scrutiniser inline-edit feature: capture before/after values of GSTIN/PAN edits → trigger GST/PAN re-verification → log to AuditLog with edit timestamp and Scrutiniser ID
- [ ] T113 [US2] Create decision routing logic: Approve (advance to next stage) / RaiseObjection (bounce logic) / Reject (terminal, notify applicant)
- [ ] T114 [US2] [P] Create `src/services/notifications/emailQueue.ts` queueing approval/objection/rejection emails to applicants + next-stage staff
- [ ] T115 [US2] Create email templates in `src/services/notifications/templates/`: approval-granted, rejection-notice, objection-raised, scrutiniser-re-review-reminder
- [ ] T116 [US2] Create pg-boss job for email dispatch with retry logic (max 3 retries, exponential backoff); log sent/failed status to AuditLog
- [ ] T117 [US2] Create unit tests `tests/unit/services/workflow/` testing state machine transitions (all valid + invalid transitions)
- [ ] T118 [US2] Create integration tests `tests/integration/approval-workflow.ts` testing 4-stage flow: submitted → approved by scrutiniser → approved by convenor → DG objection → back to scrutiniser → re-approve → convenor → DG → secretary
- [ ] T119 [US2] Create E2E test `tests/e2e/approval.spec.ts`: staff login (all 4 roles) → queue loading → application detail review → decision submission (all 3 decision types) → email verification
- [ ] T120 [US2] Create E2E test for Scrutiniser inline-edit: open application → edit GSTIN → re-trigger verification → verify before/after in audit log
- [ ] T121 [US2] Commit staff approval workflow with message "feat(US2): implement 4-stage approval workflow with inline edits, decision routing, and audit trail"
- [ ] T121b Create `src/app/(admin)/dashboard/page.tsx` (Operational Dashboard entry point; accessible by Scrutiniser, Convenor, Director General, Secretary, Admin roles)
- [ ] T121c Create `src/components/staff/OperationalDashboard.tsx` displaying: live application counts grouped by status (Draft, Submitted, UnderScrutiny, AtConvenor, AtDirectorGeneral, AtSecretary, Approved, Rejected); aging buckets (0–2 days, 3–5 days, 6–10 days, 10+ days); rejection-reason breakdown by category; filterable by date range, Membership Type, Firm Type; CSV/Excel export (FR-059, FR-063)
- [ ] T121d Create `src/server/api/routers/admin.router.ts` with procedures `getOperationalStats()`, `getMemberStats()`, and `getKPIStats()` (RBAC per FR-059/060/062); mount as `admin` in `src/server/api/root.ts` — this router is extended in Phase 8 (T170) with staff management procedures
- [ ] T121e Create `src/app/(admin)/dashboard/members/page.tsx` (Member Dashboard entry point)
- [ ] T121f Create `src/components/staff/MemberDashboard.tsx` displaying: active members by Membership Type, members with renewals due in 30/60/90 days buckets, Lapsed member count; filterable by Membership Type and Firm Type; CSV/Excel export (FR-060, FR-063)
- [ ] T121g Wire `MemberDashboard.tsx` to consume `getMemberStats()` from `admin.router.ts` (created in T121d); verify RBAC restriction to Secretary and Admin roles
- [ ] T121h Create `src/components/staff/KPIDashboard.tsx` displaying: total applications submitted (by period), median and p95 approval cycle time (submission-to-decision), first-time-right submission rate (% passing Scrutiniser review without a "missing/invalid document" objection); filterable by date range and Membership Type; CSV/Excel export (FR-062, FR-063)
- [ ] T121i Wire `KPIDashboard.tsx` to consume `getKPIStats()` from `admin.router.ts` (created in T121d); verify RBAC restriction to Secretary and Admin roles

---

## Phase 5: User Story 3 — Annual Renewal (P2)

### Story Goal
Enable existing members to receive renewal reminders (T-30, T-15), initiate renewal, review pre-filled form with vault documents, submit with material-change detection, auto-approve no-change renewals, and route material changes through expedited approval.

### Independent Test Criteria
- Active member receives renewal reminder email 30 days before expiry
- Member logs in, opens renewal form with pre-filled data from vault
- Member can mark fields as unchanged (single action per section) or modify changed fields
- Renewal with no material changes auto-approves immediately + extends expiry + issues new certificate
- Renewal with material changes (firm structure, KYC docs) routes to 4-stage approval (faster than new application)
- New certificate issued with updated validity date, prior certificate marked Superseded
- Status transitions (Active → Renewal Due → Lapsed) work correctly per configured grace period

### Story-Specific Entities & Dependencies
- **Entities**: Member, MembershipRenewal, Document, DocumentVault, MembershipCertificate, ApprovalDecision
- **Schemas**: Zod for renewal form with material-change detection refinements
- **API Contracts**: `renewal.getRenewalForm()`, `renewal.submitRenewal()`
- **Data Models**: Renewal state machine (Draft → Submitted → AutoApproved | ManualReview → Approved), document versioning + supersession

### Phase 5 Tasks

- [ ] T122 [US3] Create renewal reminder job: `src/services/jobs/renewalReminders.ts` running daily, identifying members with expiry in 30 days, queueing reminder emails (T-30 and T-15)
- [ ] T123 [US3] Create `src/services/jobs/membershipStatus.ts` daily job transitioning member status: Active → RenewalDue (at expiry), RenewalDue → Lapsed (after 60-day grace period)
- [ ] T124 [US3] [P] Create `src/services/renewal/autoApprove.ts` with material-change detection logic: firm structure changes (directors, partners, firm type) or identity/KYC doc changes = manual review; otherwise auto-approve
- [ ] T125 [US3] Create `src/app/(member)/renew/page.tsx` (renewal form entrypoint; pre-fill from Member + Application)
- [ ] T126 [US3] Create `src/components/renewal/RenewalForm.tsx` with sections: firm details, directors/partners, documents, confirmation; sections collapsible with per-section "Mark Unchanged" action
- [ ] T127 [US3] Create `src/components/renewal/DocumentReplacement.tsx` handling document uploads during renewal with versioning (Current vs Superseded tracking)
- [ ] T128 [US3] Create `src/server/api/routers/renewal.router.ts` implementing renewal procedures: `getRenewalForm()`, `submitRenewal()`
- [ ] T129 [US3] [P] Create `src/services/renewal/renewalSubmit.ts` detecting material changes, triggering auto-approval or manual review queue, issuing new certificate on auto-approval
- [ ] T130 [US3] Create certificate issuance for renewals: `src/services/certificate/generator.ts` (enhance to support renewal use case: reuse membership number, update validity date, mark prior cert as Superseded)
- [ ] T131 [US3] Create unit tests `tests/unit/services/renewal/` testing material-change detection and auto-approval logic
- [ ] T132 [US3] Create E2E test `tests/e2e/renewal.spec.ts`: trigger renewal reminder job → member logs in → opens renewal → confirms all unchanged → auto-approve → new certificate issued → prior cert marked Superseded
- [ ] T133 [US3] Create E2E test for renewal with material changes: member updates director info → submit → routed to manual review → staff approves → new certificate issued
- [ ] T134 [US3] Commit renewal workflow with message "feat(US3): implement annual renewal with material-change detection and auto-approval for no-change renewals"

---

## Phase 6: User Story 4 — Offline Payment Recording by Payment Officer (P2)

### Story Goal
Enable Payment Officers to record cash, cheque, NEFT, or DD payments against pending applications/renewals, with duplicate prevention, idempotent receipt generation, and applicant notification.

### Independent Test Criteria
- Payment Officer can record cheque payment with cheque number, bank, amount, date
- Payment status updates to Reconciled; applicant receives receipt email
- Duplicate cheque number rejected with clear error message
- Cheque reversal marks payment as Reversed, notifies applicant
- Payment dashboard shows total collected (online vs offline split), pending fees, reconciliation status
- All payment entries logged to AuditLog with Payment Officer ID

### Story-Specific Entities & Dependencies
- **Entities**: Payment, StaffUser (Payment Officer role), AuditLog
- **Schemas**: Zod for offline payment input (method enum, reference uniqueness, amount, date)
- **API Contracts**: `payment.recordOfflinePayment()`
- **Data Models**: Payment state machine with offline-specific fields + reconciliation logic

### Phase 6 Tasks

- [ ] T135 [US4] Create `src/app/(admin)/payment/record-offline/page.tsx` (offline payment entry form)
- [ ] T136 [US4] Create `src/components/staff/OfflinePaymentForm.tsx` with fields: payment method (Cash/Cheque/NEFT/DD — matching FR-024 exactly; IMPS is not an accepted offline mode), reference number, amount, received date, bank name, notes, receipt image upload
- [ ] T137 [US4] Create `src/app/(admin)/payment/dashboard/page.tsx` (payment analytics dashboard)
- [ ] T138 [US4] Create `src/components/staff/PaymentDashboard.tsx` showing: total collected (by period, online vs offline split), pending fees by status, reconciliation mismatches, export to CSV/Excel
- [ ] T139 [US4] Create `src/server/api/routers/payment.router.ts` implementing payment procedures: `initiateOnlinePayment()`, `recordOfflinePayment()`, (webhook handler in Phase 4)
- [ ] T140 [US4] [P] Create `src/services/external/payment/razorpay.ts` adapter (primary) implementing `IPaymentGatewayService` interface for Razorpay integration: order creation, webhook signature verification, idempotent handling
- [ ] T141 [US4] [P] Create `src/services/external/payment/cashfree.ts` adapter (fallback) implementing same interface for Cashfree
- [ ] T142 [US4] [P] Create `src/services/payment/offlineRecording.ts` with unique reference validation (prevents duplicate cheques), Payment Officer audit trail, notification queuing
- [ ] T143 [US4] Create `src/services/payment/reconciliation.ts` daily pg-boss job syncing payment status from gateway, marking receipts as Reconciled
- [ ] T143b Create `src/services/payment/taxInvoice.ts` generating a GST-compliant PDF invoice per payment: CREDAI Pune GSTIN, applicant GSTIN, invoice date, sequential invoice number (per financial year), taxable amount, CGST + SGST breakdown at 9% each (18% total), and total amount; store PDF in member document vault alongside the payment record (FR-028)
- [ ] T143c Create email template `src/services/notifications/templates/tax-invoice.ts` attaching the invoice PDF to the payment receipt email; extend `emailQueue.ts` to attach the invoice on every successful payment posting (online and offline)
- [ ] T143d Add `generateTaxInvoice()` procedure to `src/server/api/routers/payment.router.ts` (triggered on payment Reconciliation) and `downloadTaxInvoice()` procedure allowing members to re-download historical invoices from their vault
- [ ] T144 [US4] Create `src/app/api/webhooks/payment/razorpay/route.ts` (REST endpoint) handling Razorpay webhook with signature verification, idempotency check, ledger update
- [ ] T144b [US4] Create `src/app/api/webhooks/payment/cashfree/route.ts` handling Cashfree webhook with signature verification, idempotency check, and ledger update — same idempotent pattern as T144; required because Cashfree is a runtime fallback gateway (FR-023)
- [ ] T145 [US4] Create unit tests `tests/unit/services/payment/` for offline recording (duplicate prevention, audit logging) and webhook idempotency
- [ ] T146 [US4] Create E2E test `tests/e2e/payment-offline.spec.ts`: Payment Officer records cheque payment → payment status updates → applicant receives receipt email
- [ ] T147 [US4] Create E2E test for payment reversal: record cheque → mark reversed → payment status reverts to Pending → applicant notified
- [ ] T148 [US4] Commit offline payment recording with message "feat(US4): implement offline payment recording with duplicate prevention and reconciliation"

---

## Phase 7: User Story 5 — Membership Certificate Issuance & Public Verification (P2)

### Story Goal
Automatically generate tamper-evident PDF membership certificates with President snapshot at issuance time, support certificate supersession on renewal, enable public verification via QR code or membership number, and enforce rate-limiting on public endpoint.

### Independent Test Criteria
- Secretary approval triggers certificate generation within 2 minutes (async job)
- Certificate PDF includes firm name, membership type, issue/validity dates, President name + signature, QR code, Membership Number
- Certificate cryptographically signed; PDF reader shows "Signed by CREDAI Pune Membership Portal"
- Member downloads certificate from vault; public user scans QR code → public verification page shows Firm Name, Membership Type, Valid Until, Status (no PII)
- President change does not alter previously issued certificates
- Renewal issues new certificate, marks prior as Superseded (retained in vault)
- Public verification rate-limited per IP (100 req/min), CAPTCHA challenged on excess

### Story-Specific Entities & Dependencies
- **Entities**: MembershipCertificate, President, Member, DocumentVault, AuditLog
- **Schemas**: Zod for public verification input (membership number or QR decode)
- **API Contracts**: (implicit certificate generation on secretary approval), `public.verifyCertificate()` (REST endpoint)
- **Data Models**: Certificate versioning, President snapshot capture, public verification state

### Phase 7 Tasks

- [ ] T149 [US5] Create `src/services/certificate/generator.ts` implementing PDF generation (@react-pdf/renderer) with: firm name, membership type, validity dates, President snapshot, QR code (public verification URL), Membership Number
- [ ] T150 [US5] [P] Create `src/services/certificate/signer.ts` using AWS KMS (@aws-sdk/client-kms) to sign PDFs (@signpdf/signpdf) with document-signing certificate; never load private key into memory
- [ ] T151 [US5] Create `src/services/certificate/storage.ts` handling certificate upload to Vercel Blob + S3 archival, versioning, and retrieval
- [ ] T152 [US5] [P] Create `src/services/jobs/certificateGeneration.ts` pg-boss worker triggered on Secretary approval: generate PDF, capture President snapshot, calculate hash, store in vault, log to AuditLog, queue issuance email
- [ ] T153 [US5] Create `src/app/public/verify/page.tsx` (public certificate verification page with Membership Number input + QR scanner)
- [ ] T154 [US5] Create `src/app/api/public/verify/route.ts` (REST endpoint) handling membership number/QR decode lookup: (a) enforce edge rate-limit per IP at `PUBLIC_VERIFY_RATE_LIMIT` req/min (default 100, configurable via env); on breach return 429 with `captcha_required: true`; (b) on the client side (`public/verify/page.tsx`) render Cloudflare Turnstile (`@marsidev/react-turnstile`) when captcha is required and resubmit with token; (c) verify Turnstile token server-side before responding; return only Firm Name, Membership Type, Valid Until Date, and Status — no PII (FR-047, FR-048, constitution captcha: Cloudflare Turnstile)
- [ ] T155 [US5] [P] Create `src/components/public/VerificationResult.tsx` displaying verification result (Active/Lapsed/Revoked/Superseded) with styling for each status
- [ ] T156 [US5] Create Secretaries can revoke membership: `src/app/(admin)/member/revoke/page.tsx` interface with membership number input, revocation reason, confirm button
- [ ] T157 [US5] Create `src/server/api/routers/member.router.ts` with procedure `revokeMembership()` (Secretary-only) updating Member.status, creating new revoked Certificate entry, notifying member
- [ ] T158 [US5] Create unit tests `tests/unit/services/certificate/` for PDF generation, signing, hash verification, President snapshot capture
- [ ] T159 [US5] Create E2E test `tests/e2e/certificate.spec.ts`: Secretary approves application → certificate generated → member can download from vault → public user scans QR → verification returns correct data
- [ ] T160 [US5] Create E2E test for certificate supersession on renewal: issue initial cert → auto-approve renewal → new cert issued → prior cert marked Superseded → both in vault
- [ ] T161 [US5] Create E2E test for public verification rate limiting: 100 successful requests → 101st hits CAPTCHA → CAPTCHA solved → continues
- [ ] T162 [US5] Commit certificate issuance with message "feat(US5): implement tamper-evident certificate generation with public verification and rate-limiting"

---

## Phase 8: User Story 6 — System Admin: User Management & President Record (P3)

### Story Goal
Enable System Admin to onboard new CREDAI staff via email invitations with role assignments, manage staff account lifecycle (enable/disable/remove), and maintain the President record (exactly one Active President at any time).

### Independent Test Criteria
- Admin sends invitation email to new staff member with role assignment
- Invited user clicks one-time link, sets password, enrolls TOTP MFA, logs in successfully
- Admin disables staff account; disabled user cannot authenticate
- Admin creates new President record; prior Active President automatically marked Inactive
- Staff account TOTP recovery codes work correctly
- All account lifecycle actions logged to AuditLog

### Story-Specific Entities & Dependencies
- **Entities**: StaffUser, User (identity), President, AuditLog
- **Schemas**: Zod for staff invitation input (email, role enum), President record (name, signature image, tenure dates)
- **API Contracts**: (implicit via admin router)
- **Data Models**: Staff account status machine, President status enforcement (single Active)

### Phase 8 Tasks

- [ ] T163 [US6] Create `src/app/(admin)/settings/staff/page.tsx` (staff management interface)
- [ ] T164 [US6] Create `src/components/admin/StaffManagement.tsx` displaying list of staff with: name, email, role, status (Active/Suspended), last login, actions (edit, disable, remove)
- [ ] T165 [US6] Create `src/components/admin/StaffInviteForm.tsx` with fields: email, role enum (6 roles), send button
- [ ] T166 [US6] Create `src/app/(admin)/settings/president/page.tsx` (President record management)
- [ ] T167 [US6] Create `src/components/admin/PresidentManagement.tsx` displaying current Active President, historical records, form to create new President (name, signature image upload, tenure start date)
- [ ] T168 [US6] Create invitation email template with one-time setup link (JWT token, 24-hour expiry, role info)
- [ ] T169 [US6] Create `src/app/(admin)/invite/[token]/page.tsx` (one-time invitation acceptance page: password creation, TOTP enrolment, confirm MFA codes, submit)
- [ ] T170 [US6] Extend `src/server/api/routers/admin.router.ts` (created in T121d) adding staff management procedures: `inviteStaff()`, `updateStaffStatus()`, `removeStaff()`, `createPresident()`, `updatePresident()`, `viewAuditLog()`, `getDSARRequests()`
- [ ] T170b Create `src/app/(admin)/settings/audit/page.tsx` (audit log viewer; Admin-only)
- [ ] T170c Create `src/components/admin/AuditLogViewer.tsx` with paginated, filterable audit log table: filters by actor, action type, resource type, application/member ID, and date range; CSV/Excel export; strictly read-only (FR-071)
- [ ] T170d Add `viewAuditLog()` tRPC procedure to `admin.router.ts` (Admin-only RBAC) returning paginated AuditLog entries with filter parameters; enforce that this procedure never exposes UPDATE or DELETE paths on the audit table
- [ ] T171 [US6] [P] Create `src/services/admin/staffInvitation.ts` generating invitation tokens, queuing invitation emails, tracking invitation status
- [ ] T172 [US6] [P] Create `src/services/admin/presidentManagement.ts` enforcing single Active President constraint (mark prior as Inactive on new activation), President snapshot capture for existing certificates
- [ ] T173 [US6] Create unit tests `tests/unit/services/admin/` for President status enforcement, invitation token validation
- [ ] T174 [US6] Create E2E test `tests/e2e/staff-onboarding.spec.ts`: Admin invites new Scrutiniser → Scrutiniser receives email → clicks link → sets password → enrolls TOTP → logs in successfully
- [ ] T175 [US6] Create E2E test for President record lifecycle: create new President → old becomes Historical → create another → verify single Active
- [ ] T175b Create `src/app/(member)/data-rights/page.tsx` (DPDP data rights self-service page) allowing logged-in members to: view a summary of all personal data held, submit a correction request, submit an erasure request (with statutory retention disclaimer per FR-058) (FR-073)
- [ ] T175c Add tRPC procedures to `src/server/api/routers/member.router.ts`: `getMyPersonalData()`, `submitCorrectionRequest()`, `submitErasureRequest()` — each request logged to AuditLog as a DSAR event per constitution Principle V
- [ ] T175d Create staff-side DSAR resolution view `src/app/(admin)/settings/dsar/page.tsx` (Admin-only): list open DSAR requests, mark resolved with a mandatory resolution note; resolution logged to AuditLog
- [ ] T176 [US6] Commit staff management with message "feat(US6): implement staff onboarding, account lifecycle, and President record management"

---

## Phase 9: Polish & Cross-Cutting Concerns

### Story Goal
Implement accessibility gates (WCAG 2.1 AA, axe-core integration, keyboard navigation), performance monitoring (Core Web Vitals, Lighthouse CI), comprehensive observability (structured logging, distributed tracing, runbooks), and security hardening (VAPT remediation, CSP, secrets rotation).

### Independent Test Criteria
- Accessibility audit passes: axe-core ≥90 score (dev server warnings), Lighthouse CI ≥90 accessibility gate
- Keyboard navigation verified: entire wizard + staff dashboard navigable via Tab alone
- Core Web Vitals pass: FCP ≤1.8s, LCP ≤2.5s, CLS ≤0.1, INP ≤200ms (p75 mobile)
- JS bundle ≤250 KB gzipped initial, ≤100 KB per route chunk
- All new tRPC procedures log structured traces with trace ID, request ID, duration, outcome
- Runbooks documented for 10 critical failure modes (GST down, payment gateway down, cert signing failure, Aadhaar key rotation, audit log degradation, etc.)
- Security review completed: OWASP Top 10 mitigations confirmed, secrets never in logs/errors/URLs, PII masked everywhere
- All secrets rotated (NEXTAUTH_SECRET, payment keys, envelope key for Aadhaar, document-signing cert renewed)

### Phase 9 Tasks

- [ ] T177 Add axe-core integration to Next.js dev server: `npm install --save-dev @axe-core/react` + middleware warning on accessibility violations
- [ ] T178 Configure Lighthouse CI (`.lighthouserc.json`): accessibility ≥90, performance ≥80, PWA ≥80; run in CI/CD on every PR
- [ ] T179 Implement keyboard navigation audits: test Tab order in wizard (all steps, skip links), test staff dashboard review screen, test public verification page
- [ ] T180 [P] Create WCAG 2.1 AA compliance checklist: color contrast (≥4.5:1 body, ≥3:1 large), ARIA labels on all form fields, semantic HTML, error message linking via aria-describedby
- [ ] T181 Add Core Web Vitals tracking: Vercel Web Analytics (FCP, LCP, CLS, INP) in production; alert on threshold breach (FCP >1.8s, LCP >2.5s)
- [ ] T182 [P] Implement route code-splitting: lazy-load admin pages, renewal pages, public verification; measure per-route bundle size
- [ ] T183 Add Sentry performance monitoring: configure distributed tracing (OpenTelemetry), sample 10% of requests in production, alert on error-rate >1% or latency p95 >3s (applicant) / >5s (staff)
- [ ] T184 [P] Create structured logging audit: review all pino calls, ensure no PII in log message (firm names, emails, PAN, Aadhaar only via redaction middleware), test redaction on sample events
- [ ] T185 [P] Create runbooks for critical failure modes:
  - [ ] T186 `GST API Down`: queue-and-retry, manual re-trigger from staff UI, continue with Pending status
  - [ ] T187 `PAN API Down`: same as GST
  - [ ] T188 `Payment Gateway Webhook Failure`: idempotent retry, reconciliation job, manual re-trigger from Payment Officer UI
  - [ ] T189 `Aadhaar Encryption Key Rotation`: HSM/KMS key rotation procedure, migration of existing encrypted records, rollback plan
  - [ ] T190 `Audit Log Query Degradation`: archival job (move old records to S3), analytics-DB sync, performance restoration plan
  - [ ] T191 `Certificate Signing Service Unavailable`: queue-and-retry (pg-boss), hold approval in "Certificate Pending" state, notify member when available
  - [ ] T192 `OTP Delivery Timeout`: fallback SMS (if configured), manual password reset for staff, escalation to support
  - [ ] T193 `Email Dispatch Failure`: pg-boss retry (3 attempts, exponential backoff), escalation to staff for manual outreach on final failure
  - [ ] T194 `Renewal Reminder Dispatch Failure`: log both T-30 and T-15 failures, escalate to staff, recommend manual email send
  - [ ] T195 `Applicant SLA Aging`: alert on applications >7 days in review without action, staff dashboard SLA flag, escalation trigger
- [ ] T196 [P] Create security review checklist:
  - [ ] T197 OWASP Top 10 mitigations: injection (tRPC Zod validation), broken auth (Auth.js + TOTP), sensitive-data exposure (encryption at rest, HTTPS, no PII in URLs/logs), broken access control (RBAC middleware), security misconfiguration (CSP, CORS, secrets manager)
  - [ ] T198 Secrets rotation policy: NEXTAUTH_SECRET (quarterly), payment gateway keys (per provider SLA), envelope key (annual via KMS), document-signing cert (60 days pre-expiry)
  - [ ] T199 PII handling audit: Aadhaar field-level encryption, firm name/email encrypted at rest, no PII in URLs/history/error messages, masking in UI (Aadhaar last 4 digits only), staff reveal action logged
  - [ ] T200 CSP policy: strict, no inline scripts, only trusted CDNs, report-only mode first, then enforce after validation
  - [ ] T201 CORS policy: origin validation (only CREDAI domain + localhost:3000 for dev), credentials=same-origin, explicit allowed methods
- [ ] T202 Create database performance tuning: index on AuditLog (timestamp, eventType, actorId, resourceId), index on Application (applicantId, status), index on Payment (applicationId, status, createdAt)
- [ ] T203 [P] Create E2E test suite for accessibility: screen reader navigation (NVDA + Chrome Windows, VoiceOver + Safari Mac), keyboard-only wizard completion, color contrast verification
- [ ] T204 Create performance E2E test: measure cold page load (≤3s p95 on 4G), wizard step render (≤2s p95), SPA navigation (≤500ms p95), PDF download (≤2s for 100 KB cert)
- [ ] T205 Create security E2E test: verify no PII in URLs, verify no password in logs/errors, verify HTTPS enforcement, verify CSRF token validation
- [ ] T206 Create comprehensive test coverage report: unit tests ≥80% coverage, integration tests covering all tRPC routers + workflows, E2E tests covering all user journeys
- [ ] T207 [P] Create deployment runbook: environment setup, database migration, secrets manager configuration, Vercel/CloudFront cache invalidation, health check verification
- [ ] T208 [P] Create incident response playbook: who to notify (on-call engineer, CREDAI contact), how to check logs (Sentry, pino aggregation, AuditLog), how to communicate status (status page, email to members)
- [ ] T209 Commit polish and cross-cutting concerns with message "feat: implement accessibility gates, performance monitoring, observability, and security hardening per WCAG 2.1 AA and OWASP standards"

---

## Phase 10: Final Pre-Launch Validation & Optimization

### Story Goal
Complete final testing, security validation (VAPT), performance optimization, documentation, and go-live preparation.

### Independent Test Criteria
- All user journeys pass end-to-end (wizard → payment → approval → certificate → renewal)
- VAPT completed, all high/critical vulnerabilities remediated
- Performance targets met: p95 response time ≤3s applicant, ≤5s staff; Core Web Vitals all green
- Database backups working, restore procedure tested
- Monitoring + alerting active (Sentry, Datadog, CloudWatch)
- Runbooks accessible to ops team, tested with dry-run scenarios
- Legal review completed (DPDP consent, T&Cs, privacy policy)
- Data migration plan ready (for legacy members in Phase 2)

### Phase 10 Tasks

- [ ] T210 Conduct internal QA: complete wizard → submit → payment → approval → certificate issuance in staging
- [ ] T211 Conduct VAPT (Vulnerability Assessment & Penetration Testing): hire external firm, remediate all high/critical findings, retest
- [ ] T212 Optimize images: compress logos, optimize PDFs, ensure next-gen formats (WebP where supported)
- [ ] T213 Optimize bundle: identify unused dependencies, lazy-load heavy libraries, tree-shake unused code, measure final bundle size ≤250 KB
- [ ] T214 Test database backups: automated daily snapshots, restore procedure documented + tested, RPO/RTO verified
- [ ] T215 Test failover: Razorpay → Cashfree payment fallback, GST API → licensed reseller, primary email provider → secondary
- [ ] T216 [P] Create pre-launch checklist: all tasks complete, all tests passing, all documentation reviewed, all secrets rotated, all monitoring active, all runbooks tested
- [ ] T217 Create go-live runbook: deployment steps, health check procedures, rollback plan, communication plan (notify CREDAI staff + applicants)
- [ ] T218 Dry-run go-live: deploy to staging identical to production, run end-to-end test, verify all monitoring + alerts
- [ ] T219 Schedule launch date, coordinate with CREDAI Pune management for announcement
- [ ] T220 Commit pre-launch validation with message "feat: complete security, performance, and operational validation before go-live"

---

## Summary: Task Count & Execution Timeline

| Phase | Title | Task Count | Dependencies |
|-------|-------|-----------|--------------|
| **1** | Setup & Initialization | 17 | None (start here) |
| **2** | Foundational Infrastructure | 43 | Phase 1 ✓ |
| **3** | US1: New Member Wizard (P1) | 39 | Phases 1–2 ✓ |
| **4** | US2: Staff Approval (P1) | 31 | Phases 1–2 ✓ (can run parallel to Phase 3) |
| **5** | US3: Annual Renewal (P2) | 13 | Phases 1–2 + US1 + US2 ✓ |
| **6** | US4: Offline Payment (P2) | 18 | Phases 1–2 + US1 ✓ |
| **7** | US5: Certificate & Verification (P2) | 14 | Phases 1–2 + US1 + US2 ✓ |
| **8** | US6: Admin & President (P3) | 20 | Phases 1–2 ✓ (can run anytime) |
| **9** | Polish & Cross-Cutting | 34 | All user stories ✓ |
| **10** | Pre-Launch Validation | 11 | Phase 9 ✓ |
| | **TOTAL** | **240 tasks** | ~8–12 weeks (sprint-based) |

---

## Parallel Execution Examples

### Week 1–2 (Phase 1 & 2: Setup + Infrastructure)
- Single developer or small team: complete Phases 1–2 sequentially (16 + 43 = 59 tasks)

### Week 3 (Phase 3 & 4: Parallel Wizard + Approval)
- **Team A** (2 devs): Phase 3 (US1 wizard) — T060–T098
- **Team B** (1–2 devs): Phase 4 (US2 approval) — T099–T121
- Both teams use shared tRPC routers + middleware from Phase 2; minimal merge conflicts expected

### Week 4 (Phase 5–8: Renewals, Payments, Certificates, Admin)
- **Team A** continues: Phase 5 (US3 renewal) + Phase 7 (US5 certificates) — can parallelize document versioning + certificate generation
- **Team B** continues: Phase 6 (US4 payments) + Phase 8 (US6 admin)

### Week 5 (Phase 9: Polish)
- Entire team: accessibility, performance, observability (runbooks, monitoring setup)

### Week 6 (Phase 10: VAPT, Go-Live)
- Dedicated QA + ops team; development team on standby for remediation

---

## Success Metrics & Acceptance

Each phase/story is **complete** when:
1. All tasks marked as ✓ completed
2. All unit tests pass (≥80% coverage per story)
3. All E2E tests pass (happy path + error scenarios)
4. Code review approved (OWASP compliance, accessibility, performance)
5. Runbooks documented (if applicable)
6. Committed to branch with clear commit message
