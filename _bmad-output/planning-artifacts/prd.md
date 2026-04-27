---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation-skipped', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
status: 'complete'
completedAt: '2026-04-22'
inputDocuments:
  - credai_srs/CredAi_SRS.md
  - credai_srs/images/ (28 UI mockup PNGs referenced inline by SRS)
workflowType: 'prd'
documentCounts:
  briefs: 0
  research: 0
  brainstorming: 0
  projectDocs: 1
  srs: 1
  uiMockupImages: 28
projectType: 'greenfield-with-srs'
classification:
  projectType: web_app
  domain: trade-association-membership-management
  industryServed: real-estate-construction
  crossCuttingConcerns:
    - fintech-style (INR payments, GST/PAN KYC verification)
    - govtech-style (RERA / regulatory compliance)
  complexity: medium-high
  projectContext: greenfield
  tenancyScope: single-tenant (CREDAI Pune chapter only — PMC, PCMC, PMRDA)
  nationalContextOutOfScope: true
---

# Product Requirements Document - Credai

**Author:** Aayush Makhija
**Date:** 2026-04-22

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Project Classification](#project-classification)
3. [Success Criteria](#success-criteria)
4. [Product Scope](#product-scope)
5. [User Journeys](#user-journeys)
6. [Domain-Specific Requirements](#domain-specific-requirements)
7. [Web Application Specific Requirements](#web-application-specific-requirements)
8. [Project Scoping & Phased Development](#project-scoping--phased-development)
9. [Functional Requirements](#functional-requirements) (FR1–FR102)
10. [Non-Functional Requirements](#non-functional-requirements) (NFR1–NFR65)

## Document Conventions

This PRD uses three inline markers to indicate the source / status of each
statement, so downstream readers (UX, Architecture, Epics) can quickly trace
provenance:

- ***(SRS)*** — derived directly from the existing Software Requirements
  Specification at [credai_srs/CredAi_SRS.md](credai_srs/CredAi_SRS.md).
- ***(scope-extended)*** — confirmed during PRD discovery; extends beyond
  the SRS.
- ***Subject to client confirmation*** — a sensible default proposed by
  this PRD; the client should confirm or override before architecture
  begins. The full open-decisions list is captured in **§ Project
  Scoping & Phased Development → Open Decisions Required Before / During
  Architecture Phase**.

References to specific FRs and NFRs use the form `FRn` / `NFRn`. Cross-
references to other PRD sections use the section name in italics.

## Executive Summary

**Credai** is a digital member portal for **CREDAI Pune** — the local chapter of the
Confederation of Real Estate Developers' Associations of India — that replaces today's
paper-heavy, manually-verified membership process with a self-serve, lifecycle
web application. It serves two primary customers: **applicant firms** (real-estate
builders / developers seeking certification) and **CREDAI Pune office staff** (who
review, verify, and govern membership). Scope spans the **full member lifecycle**:
new-member application (Ordinary, Associate, RERA Project), member renewals, document
vault, and ongoing access for existing members, geographically scoped to Pune district
(PMC, PCMC, PMRDA jurisdictions).

The problem being solved is operational friction at both ends of the membership process:
applicants today navigate a fragmented, paper-form intake where required documents vary
by membership type and firm structure (Proprietorship, Partnership, Pvt Ltd, LLP,
Public Sector, AOP, Co-operative Society) — leading to incomplete submissions and
repeated back-and-forth. Office staff today manually cross-check identity (PAN, Aadhaar),
tax (GST), regulatory (RERA), and association-specific (Code of Conduct, Self
Declaration, Proposer / Seconder) documents — a slow, error-prone review burden that
scales poorly as the chapter grows.

### What Makes This Special

1. **Adaptive wizard by Membership Type × Firm Type.** The application form dynamically
   reveals only the fields and document uploads relevant to the applicant's selected
   membership and firm structure, eliminating the cognitive load of generic paper forms
   and removing whole categories of "wrong document submitted" errors.
2. **Compliance-by-construction.** Mandatory fields, mandatory uploads, conditional
   minimums (e.g., ≥ 2 partners, ≥ 2 directors, ≥ 1 completed project for Ordinary
   Membership), and cross-step dependencies (e.g., Associate Membership requires an
   approved Ordinary Member as proposer) are enforced inline. An incomplete or
   non-compliant application cannot be submitted.
3. **Inline identity and tax verification.** GST and PAN numbers are validated against
   external verification services at submission time, replacing manual staff
   cross-checking.
4. **Digitized social-proof workflow.** The traditional Proposer / Seconder model — a
   trust-based norm of trade associations — is preserved but enforced through dropdowns
   restricted to approved Ordinary Members and a mandatory signed-recommendation upload,
   preventing common errors such as same-person Proposer/Seconder or invalid
   recommenders.
5. **Lifecycle product, not a one-shot form.** The same portal serves new applicants,
   existing members renewing their membership, and members managing their document
   vault — making the system a durable member-management platform rather than a single
   intake utility.

The intended outcome: builders complete accurate, complete certifications in a single
sitting, and CREDAI Pune staff review pre-verified, well-formed packages — a measurable
reduction in cycle time and review effort for both sides.

## Project Classification

- **Project Type:** Web application (multi-step applicant wizard with implied
  staff / admin review surface)
- **Primary Domain:** Trade-association membership management for the real-estate /
  construction industry
- **Cross-cutting Concerns:**
  - *Fintech-style:* INR fee collection (per-membership-type Entrance Fee + Annual
    Subscription + GST @ 18 %), GST/PAN KYC verification
  - *Govtech / RegTech-style:* RERA / MahaRERA regulatory documents, Code of Conduct
    and Self Declaration compliance
- **Domain Complexity:** Medium–High — driven by the conditional matrix of
  3 Membership Types × 7 Firm Types, multi-role workflows (applicant, proposer,
  seconder, staff reviewer), external verification integrations, and document-heavy
  compliance enforcement.
- **Project Context:** Greenfield build with a reference Software Requirements
  Specification ([credai_srs/CredAi_SRS.md](credai_srs/CredAi_SRS.md), 1,566 lines
  + 28 UI mockup images) covering the new-applicant intake wizard. Renewals,
  document vault, existing-member access, staff/admin review workflow, and payment
  collection extend beyond the SRS and are confirmed in scope for this PRD.
- **Tenancy Scope:** Single-tenant — CREDAI Pune chapter only. CREDAI's national
  multi-chapter architecture is explicitly out of scope.
- **Reference Inputs Loaded:** SRS (1 doc, 1,566 lines), UI mockups (28 PNGs).
  No product brief, market research, or brainstorming artifacts provided.

## Success Criteria

### User Success — Applicant Firms (Builders)

- **First-time-right submission rate ≥ 80%** of submitted applications pass
  Scrutiniser review without "missing/invalid document" rejection.
- **Single-session completion ≥ 60%** of applicants finish and submit in one
  sitting (with optional draft-save support to resume).
- **Time-to-submit (median) ≤ 30 minutes** from "Send OTP" to "Submit", for a
  typical Ordinary Membership / Partnership-firm application with required
  documents at hand.
- **Self-serve resolution ≥ 90%** of applications complete without any phone or
  email support contact to CREDAI Pune office.
- **OTP success rate ≥ 98%** of OTP attempts succeed within the 2-minute
  validity window (SRS-defined constraint).
- **Renewal completion ≤ 10 minutes** for an existing member completing annual
  renewal (most data pre-filled from previous application + document vault).

### User Success — CREDAI Pune Office Staff

- **Review cycle time (median) ≤ 3 business days** from application submission
  to approve / reject decision, for a complete and verified application.
- **Effort per application ≤ 30 minutes of staff time** for review,
  verification cross-checks, and decision (vs. estimated multi-hour manual
  handling today; baseline TBD with client).
- **Zero re-keying.** Staff never need to re-enter applicant data into another
  system to record approvals, fees, or member directory entries.
- **One-click verification visibility.** GST and PAN verification status (pass
  / fail / pending) is visible inline on the review screen — no manual lookup.
- **Offline payment posting latency ≤ 1 business day** from cash / cheque
  receipt at office to portal status update.

### Business Success — CREDAI Pune Chapter

- **3-month post-launch:** ≥ 90% of new membership applications submitted via
  the portal (vs. paper). Paper accepted only as exception.
- **6-month post-launch:** 100% of in-cycle renewals processed via the portal.
- **12-month post-launch:** Full historical member directory of CREDAI Pune is
  digitized in the system; document vault holds compliance documents for all
  active members.
- **Fee collection (online + offline reconciled):** ≥ 99% of submitted
  applications have a fully reconciled fee status before approval.
- **Audit-readiness:** Any member's complete document set (Code of Conduct,
  Self Declaration, identity proofs, regulatory certificates) retrievable in
  < 1 minute for any audit / legal request.
- **Renewal retention ≥ 95%** of members eligible for renewal complete renewal
  by membership expiry date (driven by T-30 and T-15 reminder cadence).

### Technical Success

- **Availability ≥ 99.5% monthly uptime** for the applicant-facing portal.
- **Page-to-page navigation latency ≤ 2 seconds (p95)** within the application
  wizard, including conditional field/upload reveals on Membership-Type and
  Firm-Type changes.
- **External verification SLAs honored:** GST and PAN verification calls
  succeed within their provider-published SLA; the wizard handles
  verification-service outages gracefully (queue-and-retry, never silently
  lose an application).
- **Document upload reliability:** ≥ 99% of upload attempts succeed for files
  within the configured size / format limits; failed uploads provide clear
  retry guidance.
- **Data integrity:** Zero data loss for submitted applications; submitted
  applications are immutable except via explicit, audited staff actions.
- **Payment idempotency:** online payment gateway callbacks are idempotent
  (no double-charge / double-credit on retries); offline payment entries are
  uniquely keyed by receipt / reference number to prevent duplicate posting.
- **Audit trail:** every offline payment entry captures *who* (Payment
  Officer user), *when*, *amount*, *mode* (cash / cheque / NEFT / DD),
  *reference number*, and an optional uploaded receipt scan; every state
  change and document access logged immutably.
- **Security baseline:** All PII (Aadhaar, PAN, signed documents, photos)
  encrypted at rest and in transit; role-based access restricts each of the
  7 roles to its assigned scope.
- **Accessibility:** WCAG 2.1 AA for both applicant wizard and CREDAI staff
  screens.
- **Mobile responsiveness:** Wizard fully usable on a modern smartphone
  browser.

### Measurable Outcomes (rolled up)

| Outcome | Target | Source of Truth |
|---|---|---|
| Paper applications eliminated | ≥ 90% by month 3, 100% by month 6 | Office intake log |
| Median review cycle | ≤ 3 business days | Application status timestamps |
| Median applicant time-to-submit | ≤ 30 min (Ordinary), ≤ 10 min (renewal) | Wizard analytics |
| First-time-right submission | ≥ 80% | Review reject reasons |
| Applicant self-serve resolution | ≥ 90% (no support contact) | Support ticket cross-reference |
| Fees collected and reconciled (online + offline) | ≥ 99% | Payment ledger |
| Renewal retention | ≥ 95% by expiry date | Renewal cohort analytics |
| Audit document retrieval | < 1 minute | Manual spot check |
| Portal availability | ≥ 99.5% monthly | Uptime monitoring |

## Product Scope

### Roles in Scope (7 total)

**User side:**
1. **Applicant** — prospective member firm submitting a new membership
   application; becomes a Member upon approval.

**CREDAI Pune side (6 roles):**
2. **Scrutiniser** — application review and verification.
3. **Convenor** — membership committee functions.
4. **Director General** — chapter executive functions.
5. **Secretary** — chapter secretary functions.
6. **System Admin** — user and system administration.
7. **Payment Officer** — records and reconciles offline payments;
   views payment dashboard.

(Detailed responsibilities and permissions per role are defined in the
Personas section and the RBAC matrix in subsequent sections.)

### MVP — Minimum Viable Product (Launch v1)

The MVP delivers an end-to-end member lifecycle for CREDAI Pune. Shipping
intake-only would leave the portal operationally incomplete; therefore MVP
includes intake, payment, review/approval, member directory, document vault,
existing-member access, renewals (with reminders), and staff dashboards.

**Applicant side (per SRS):**
- Email + OTP signup / login (FR-1; OTP 2-min validity, unlimited resend).
- Full 12-step Membership Application wizard for all 3 Membership Types
  (Ordinary, Associate, RERA Project) and all 7 Firm Types.
- Conditional fields, conditional documents, conditional steps per
  Membership Type × Firm Type matrix.
- All mandatory uploads with file-format / size validation, view / cancel
  / replace controls.
- Inline GST and PAN verification via external services (with graceful
  fallback on outage).
- Proposer / Seconder dropdown gated to approved Ordinary Members; same
  member cannot be both; signed recommendation form upload mandatory.
- Code of Conduct and Self Declaration steps with download templates +
  signed upload.
- Additional Documents step (optional uploads).
- Review & Submit step with declaration checkbox; submission locks the
  application for editing.
- Submission confirmation + applicant-facing status view.

**CREDAI staff side (extends beyond SRS — confirmed in scope):**
- Application inbox per role (Scrutiniser, Convenor, Director General,
  Secretary) with filter / sort / search by status, Membership Type,
  Firm Type, date, applicant name.
- Review screen showing all applicant data + uploaded documents inline +
  GST / PAN verification status + payment status.
- Approve / Reject / Request-clarification actions with required reason
  + audit trail; multi-stage approval workflow if applicable to CREDAI's
  process (TBD in Personas / Workflow steps).
- Membership lifecycle: Applicant → Submitted → Awaiting Payment →
  Under Review (multi-stage) → Approved → Active Member → Renewal Due →
  (renewed | lapsed); Rejected as terminal alternate.
- Member directory (auto-populated from approved Ordinary Members; powers
  Proposer / Seconder dropdowns and Associate-Membership eligibility).
- **Staff dashboards & analytics (MVP):**
  - *Operational dashboard* — live counts by status, aging buckets
    (e.g., > 3 days in review), rejection-reasons breakdown.
  - *Member dashboard* — active members by Membership Type, renewals
    due in next 30 / 60 / 90 days, lapsed members.
  - *Payment dashboard* — fees collected this period (online vs offline
    split), pending fees, receipt-vs-portal reconciliation status.
  - *KPI views* — applications submitted, approval cycle median + p95,
    first-time-right rate.
  - *Filterable + exportable* — all dashboards filterable by date range,
    Membership Type, Firm Type; exportable to CSV / Excel.

**Payment (MVP):**
- **Dual-mode fee collection:**
  - *Online payment* via integrated payment gateway, with automatic
    ledger posting and receipt issuance.
  - *Offline payment recording* — Payment Officer screen to record
    cash / cheque / NEFT / DD against an applicant's pending fees,
    with mandatory receipt number, optional receipt scan upload, and
    automatic ledger posting.
- **Application gating on payment** — applications can be submitted
  before payment, but staff approval is gated by payment status
  (default: payment must be reconciled before final approval).
- Fee structure per Membership Type per the SRS (Entrance Fee +
  Annual Subscription / Project Subscription + GST 18%).

**Renewals (MVP):**
- Annual renewal flow for Ordinary, Associate, and RERA Project
  memberships; pre-fills from prior application and vault.
- **Automated renewal reminders at T-30 days and T-15 days** before
  membership expiry, sent via email (and configurable for future
  channels).
- Lapsed-member handling (configurable grace period before status
  changes to lapsed).

**Cross-cutting MVP:**
- Document vault: every uploaded document stored, viewable by the
  member and authorized staff, retrievable for audit; versioned by
  upload date.
- Existing-member access (login, view membership status, view their
  documents, initiate renewal).
- Email notifications: OTP, submission acknowledgment, status updates
  (clarification requested / approved / rejected), payment receipt,
  renewal reminders (T-30, T-15), renewal confirmation.
- **Role-based access** for all 7 roles (Applicant + Scrutiniser,
  Convenor, Director General, Secretary, System Admin, Payment Officer).
- Audit log of all state changes and document accesses.
- WCAG 2.1 AA accessibility, mobile-responsive UI.

**Membership Certificate Issuance (MVP):**
- **Automatic certificate generation on Secretary approval** — at the
  moment the application reaches Approved state, a PDF membership
  certificate is issued, stored in the document vault, and made
  available to the member for download from the portal.
- **Certificate content** — CREDAI Pune branding, system-generated
  Membership Number (default format `CPN/{ORD|ASC|RERA}/{YYYY}/{seq}`,
  subject to client convention), Firm Name, Membership Type, Firm
  Type, Issue Date, Valid Until Date (one-year validity), the
  President's name and uploaded signature image, and a QR code.
- **President record** managed by the System Admin — exactly one
  President is active at any moment; the System Admin uploads the
  President's signature image and tenure dates; the system enforces
  the single-active constraint.
- **Historical fidelity** — every issued certificate embeds the
  President's name and signature *as they were at the moment of
  issue*; later President changes do not retroactively alter earlier
  certificates.
- **Tamper-evidence** — every issued PDF is server-side
  cryptographically signed using a single document-signing
  certificate held by the portal (no per-certificate manual signing
  by any official, no Class 2 / Class 3 DSC requirement in MVP).
  Standard PDF readers display "Signed by CREDAI Pune Membership
  Portal" with a valid signature checkmark; any tampering invalidates
  the signature.
- **Renewal re-issuance** — on renewal approval, a fresh certificate
  is issued with updated validity dates. Membership Number stays the
  same across renewals; previous certificate is preserved in the
  vault as Superseded.
- **Revocation** — Secretary-initiated cancellation marks the
  certificate as Revoked; public verification reflects this status.

**Public Certificate Verification Endpoint (MVP):**
- An **unauthenticated, rate-limited verification page** that accepts
  a Membership Number (or QR-code scan from a certificate) and
  returns minimal, sufficient information for a third party (home
  buyer, bank, regulator) to confirm a CREDAI Pune membership is
  genuine: **Firm Name, Membership Type, Valid Until Date, Status
  (Active / Lapsed / Revoked / Superseded)** — and nothing more.
- No PII (Aadhaar, PAN, contact details, proposer/seconder, document
  vault contents) is exposed.
- Per-IP rate limits and captcha for repeated lookups to protect
  against scraping.
- This is distinct from a full **Public Member Directory** (Growth
  feature) which would offer a browsable list of all members.

### Growth Features (Post-MVP)

- Bulk operations for staff (bulk-approve straightforward renewals,
  bulk notices to members).
- In-app member-to-member messaging or networking.
- SMS / WhatsApp channel for OTP and reminders (in addition to email).
- Public-facing directory of approved members.
- Integration with CREDAI Pune's accounting / ERP system for automatic
  GL posting (offline payments + online gateway settlements).
- Configurable fee structures (rate revisions without code changes).
- Self-service for members: update firm contact details, replace expired
  identity documents.

### Vision (Future)

- Event registration and management for CREDAI Pune events.
- Member voting / governance workflows.
- Grievance and dispute resolution module.
- Multi-chapter expansion (CREDAI national federation): tenant model,
  cross-chapter member portability, federated directory.
- Mobile native apps (iOS / Android) for members and staff.
- Upgraded certificate signing with Class 2 / Class 3 Digital Signature
  Certificates (DSC) of the President or Secretary, layered over the
  MVP system-signature, for stronger legal weight if required.

## User Journeys

The journeys below cover the seven roles defined in Product Scope. Names and
firm names are illustrative personas. Steps drawn directly from the SRS are
marked *(SRS)*; steps that extend beyond the SRS are marked *(scope-extended)*.

### Application Lifecycle State Machine

```
Draft → Submitted → Under Scrutiny → At Convenor → At Director General → At Secretary → Approved (Active Member)
                       ↑↓ Raise Objection      ↑↓ RO              ↑↓ RO              ↑↓ RO
                       (back to Applicant)     (all back to Scrutiniser, who either edits-and-re-approves
                                                or bounces to Applicant; Scrutiniser re-approval restarts
                                                the chain from Convenor)

Rejected (terminal)  ← any stage's Reject action
                        → applicant notified with rejection reason
                        → applicant must create a new application from scratch (no inheritance)
```

**Routing rules at a glance:**

| Action | From Scrutiniser | From Convenor / Director General / Secretary |
|---|---|---|
| Approve | → next stage (Convenor) | → next stage (DG → Secretary → Active Member) |
| Raise Objection | → Applicant (fix and resubmit) | → Scrutiniser (edit or bounce to applicant); chain restarts on Scrutiniser re-approval |
| Reject | → Terminates application; applicant must start fresh | → Terminates application; applicant must start fresh; Scrutiniser notified for record |

### Journey 1 — Applicant: New Ordinary Membership (Happy Path)

**Persona — Ravi Deshmukh, Partner at "Saket Constructions LLP"**

Ravi is a partner in a 12-year-old Pune-based construction firm. The firm has
delivered 14 completed residential projects across PMC and PCMC and currently
has 3 ongoing. Ravi has been told by a peer that joining CREDAI Pune as an
Ordinary Member opens up industry forums, advocacy on builder issues, and
credibility with home-buyers. Today the firm has every required document (RERA
certificate, Partnership Deed, PAN, GST, completion certificates) but Ravi is
travelling between project sites and cannot keep dropping by the CREDAI office.

**Opening:** Ravi opens the portal on his laptop in the evening, enters his
work email, and clicks **Send OTP** *(SRS FR-1)*. The OTP arrives in 30 seconds;
he enters it and is logged in.

**Wizard:** He selects **Membership Type = Ordinary**, enters firm name
"Saket Constructions LLP" *(SRS Step 1)*, sees the entrance-fee and document
checklist for Ordinary Membership clearly stated upfront, and proceeds to fill
Address (PMC, Pune, Maharashtra) *(Step 2)*. He selects **Firm Type = LLP** and
the wizard reveals exactly the LLP-specific fields and the **LLP Agreement**
upload *(Step 3)*. He nominates the office partner as the Authorized Contact
Person *(Step 4)*, adds 14 completed projects with their commencement and
completion dates and uploads each completion certificate *(Step 5)*, then adds
3 commencement projects *(Step 6)*. He adds details for both partners with
Aadhaar, PAN, signature, and photo uploads — the wizard enforces the
minimum-2-partners rule for LLPs *(Step 7 SRS)*.

**Climax:** At Step 8, Ravi opens the **Proposer** dropdown and selects an
existing Ordinary Member he knows; the firm name auto-populates. He repeats
for **Seconder** — the wizard prevents him from picking the same member twice.
He downloads the recommendation form, gets it signed offline by both, and
uploads the signed copy *(SRS Step 8)*. He downloads, signs, stamps, and
uploads the Code of Conduct *(Step 9)* and the Self Declaration on firm
letterhead *(Step 10)*. He skips Additional Documents *(Step 11)*. At Step 12,
he reviews everything in a clean, read-only summary, ticks the declaration
checkbox, and clicks **Submit** *(SRS Step 12)*. Status shows "Submitted /
Under Review"; the application is now locked.

**Payment & Resolution:** Within minutes Ravi receives a submission
acknowledgement email with the fee breakup (₹1,29,800 total inc. 18% GST). He
chooses **Pay Online** *(scope-extended)*, completes the gateway transaction,
and receives a payment receipt. Two business days later, after the application
clears the Scrutiniser → Convenor → Director General → Secretary chain, he
gets an "Approved — Welcome to CREDAI Pune" email. He logs back into the
portal and sees his firm in the **Active Members** list, with all his uploaded
documents preserved in the **document vault** *(scope-extended)*.

**What could go wrong (handled):** OTP delay → he uses Resend OTP
*(SRS)*; missing document at Step 7 → wizard blocks Next with a clear inline
error *(SRS)*; payment gateway failure → idempotent retry, no double-charge
*(scope-extended)*; GST verification service down → wizard queues the call and
allows submission with "GST verification pending — staff will retry"
*(scope-extended).*

**Capabilities revealed:** Email/OTP auth, conditional wizard logic by
Membership × Firm Type, document upload + view/replace, external GST/PAN
verification with graceful fallback, member directory backing the
Proposer/Seconder dropdowns, file-format/size validation, application locking
on submit, dual-mode payment, status notifications, document vault, member
directory listing.

### Journey 2 — Applicant: Associate Membership (Eligibility-Gated Edge Case)

**Persona — Priya Joshi, Director of "Joshi Architects Pvt Ltd"**

Priya's firm is an architectural consultancy that wants to associate with an
established Ordinary Member firm to participate in CREDAI Pune's professional
network.

**Opening:** Priya signs up via OTP *(SRS FR-1)*, lands in the wizard, and
selects **Membership Type = Associate**. The wizard immediately shows the
associate-specific fee structure (₹8,260 total inc. GST) and reveals an
additional field: **Select Ordinary Member** *(SRS)*.

**Climax:** The dropdown lists only **approved** Ordinary Members of CREDAI
Pune *(SRS business rule)*. Priya picks "Saket Constructions LLP". The wizard
guides her through the same Address / Firm Details (Pvt Ltd specific) /
Contact Person / Directors (minimum 2) / Proposer-Seconder / Code of Conduct
/ Self Declaration steps *(SRS)*. Note: per the SRS, **Step 5 (Completed
Projects) is shown only for Ordinary Membership**, so Priya skips it; **Step 6
(Commencement Projects)** is mandatory for Ordinary & Associate per SRS.

**Resolution:** Priya submits, pays, and is approved. Her firm now appears as
an Associate member affiliated with the Ordinary Member she selected.

**What could go wrong:** Priya tries to apply for Associate Membership without
an existing approved Ordinary Member to associate with — the wizard shows
the field as empty/disabled with explanatory text *(SRS business rule:
"system should disable or restrict the Associate Membership option")*.

**Capabilities revealed:** Cross-membership-type eligibility enforcement,
membership-type-aware wizard step visibility, member-directory-as-data-source
for downstream selections.

### Journey 3 — Existing Member: Annual Renewal

**Persona — Ramesh Patil, Director of "Patil Builders Pvt Ltd"**

Ramesh's firm has been an Ordinary Member of CREDAI Pune for 5 years.
Membership expires every year on a fixed date.

**Opening (T-30 days):** Ramesh receives an automated email — *"Your CREDAI
Pune Ordinary Membership expires in 30 days. Click here to renew."*
*(scope-extended; cadence per success-criteria.)* He clicks the link, logs in,
lands on a **Renewal** screen pre-filled with last year's data plus all his
vaulted documents.

**Climax:** Ramesh confirms each section is unchanged (one click per step), or
edits the few fields that have changed (added 2 new completed projects,
updated GST certificate). He clicks **Submit Renewal** in well under
10 minutes. He pays the annual subscription online (no entrance fee on
renewal). The renewal is auto-processed if no material changes are detected,
or routed to staff review if changes (e.g., new directors, updated PAN)
require verification.

**Resolution:** Ramesh receives a renewal confirmation; his membership expiry
extends by one year. Document vault retains both the prior and new versions
of any updated document.

**What could go wrong:** Ramesh ignores the T-30 reminder. At T-15, a second
reminder lands. If he still doesn't renew by expiry, the membership status
moves to **Renewal Due** (configurable grace period), then **Lapsed**.

**Capabilities revealed:** Pre-filling from prior application + vault,
material-change detection routing, scheduled reminder engine with T-30 and
T-15 cadence, document versioning, lifecycle state machine
(Active → Renewal Due → Lapsed).

### Journey 4 — Scrutiniser: Application Review & First-Line Decision

**Persona — Anjali Kulkarni, CREDAI Pune Scrutiniser**

Anjali is the only CREDAI-side role with permission to **edit the applicant's
data**. She is the gatekeeper who shapes every application before it reaches
the upper approval chain — and the recipient of every Raise-Objection
bounce-back from the upper stages.

**Inbox composition:** Her inbox holds two types of items:
1. **New applications** — fresh submissions from applicants.
2. **Returned applications** — applications previously approved by her and
   bounced back (Raise Objection) by the Convenor, Director General, or
   Secretary, with the upper-stage objection note attached.

**Available actions on any application:**
- **Approve** → forwards to the Convenor.
- **Raise Objection** → returns to the **applicant** with a specific fix
  request; application stays open and resumes in Anjali's inbox after the
  applicant resubmits.
- **Reject** → **terminates the application**; applicant is notified with
  the rejection reason and must submit a fresh new application from scratch.
  This is the "fundamentally not eligible / not acceptable" outcome.
- **Edit applicant data** → Anjali corrects minor data errors herself
  (the only role with this privilege) instead of bouncing to the applicant.
  Every edit is captured in the audit log with before/after values and a
  reason.

**Climax — handling a Raise Objection bounce-back from the Director General:**

Anjali opens a returned application. The system shows the **objection note
from the Director General** prominently at the top: *"Director identification
documents look mismatched — please re-verify Director 2 Aadhaar against the
uploaded copy."* She inspects the Director 2 Aadhaar upload, agrees there's a
typo in the entered Aadhaar number, **edits the field herself** (logged), and
re-approves the application. **The full chain restarts** — the application
goes back to the Convenor, then to the Director General, then to the
Secretary. Each stage sees the prior objection note + Anjali's resolution
note in the audit timeline.

If the issue requires *the applicant* to upload a new document (not just a
data fix), Anjali instead clicks **Raise Objection → return to applicant**.
The applicant gets an email with the objection reason; once they upload the
fix and resubmit, the application returns to Anjali's inbox.

**Resolution:** Across her 12 inbox items today, Anjali approves 7 outright,
fixes data issues herself on 3, and bounces 2 back to applicants for fresh
documents.

**What could go wrong:** Anjali edits a field and forgets to re-verify GST
after a GSTIN correction → the system auto-triggers GST re-verification on
any GSTIN edit *(scope-extended)*. Bounced application sits in applicant's
court too long → automated reminder to applicant after a configurable grace
period *(scope-extended)*.

**Capabilities revealed:** Per-role inbox with filter/sort/SLA-aging,
application review screen with inline data + documents + verification status,
Scrutiniser-only inline edit on applicant data with full audit trail,
auto-revalidation of external checks (GST, PAN) on relevant data edits,
visible bounce-back history with upper-stage objection notes, applicant
notification triggers, application status state machine, reminder to
applicant on overdue clarifications.

### Journey 5 — Convenor → Director General → Secretary: Multi-Stage Approval

**Workflow shape:** Sequential 4-stage approval (Scrutiniser → Convenor →
Director General → Secretary) with bounce-back-to-Scrutiniser on Raise
Objection at any upper stage. Reject from any stage is terminal — applicant
must submit a fresh application.

Only the Scrutiniser can edit applicant data; every other role can only
Approve, Raise Objection, or Reject — Approve advances to the next stage,
Raise Objection routes back to the Scrutiniser (not the applicant), and
Reject terminates the application.

**Stage flow:**

```
                ┌────────────────────────────────────────────────────┐
                │                                                    │
                ▼                                                    │
Applicant ──submit──> Scrutiniser ──approve──> Convenor              │
   ▲                       │                       │                 │
   │                       │ approve               │ raise objection │
   │ raise objection       ▼                       │ (back to        │
   │ (back to              │                       │  Scrutiniser)   │
   │  applicant)           │                       │                 │
   │                       ▼                       ▼                 │
   └─────────── Scrutiniser <─── raise objection — Director General  │
                       │                                │            │
                       │ approve                        │ approve    │
                       │                                │            │
                       ▼                                ▼            │
                  (continues chain)                 Secretary ───────┘
                                                        │
                                                        │ approve
                                                        ▼
                                                Active Member
                                             (membership issued,
                                              directory updated,
                                              confirmation emailed)

Reject (any stage) → application terminated → applicant notified with reason →
                     applicant must start a new application from scratch
```

**Personas:**
- **Vikram Chitnis**, Convenor of the CREDAI Pune Membership Committee.
- **Anand Kothari**, Director General of CREDAI Pune.
- **Meera Iyer**, Secretary of CREDAI Pune.

**Stage 2 — Convenor (Vikram):**

Vikram receives a daily digest email of applications awaiting his approval.
He logs in to his **Convenor inbox** *(scope-extended)*, opens an application,
and sees the full applicant data, all uploaded documents, the GST/PAN
verification pills, payment status, and the Scrutiniser's approval notes.

Available actions:
- **Approve** → application moves to the Director General's queue.
- **Raise Objection** → application returns to the Scrutiniser with Vikram's
  mandatory reason. The applicant is *not* directly notified; this is an
  internal back-and-forth between Convenor and Scrutiniser.
- **Reject** → application is terminated; applicant is notified with
  Vikram's mandatory rejection reason; applicant must submit a fresh
  application. Scrutiniser is notified for record purposes only.

**Stage 3 — Director General (Anand):**

Same screen, same three actions. Anand's view also shows that Vikram
already approved this application — providing visible upstream context.

- **Approve** → moves to the Secretary's queue.
- **Raise Objection** → returns to the Scrutiniser. The full chain restarts
  when the Scrutiniser re-approves: Convenor → DG → Secretary all see the
  application again, with the prior objection trail visible.
- **Reject** → terminal; applicant must submit a fresh application.

**Stage 4 — Secretary (Meera):**

Final stage. Same screen and three actions. Meera's view shows the prior
approvals from Vikram and Anand.

- **Approve** → application is **Approved**. Membership is officially issued:
  applicant becomes an Active Member, firm appears in the member directory,
  approval confirmation emailed to the applicant, and (if Ordinary
  Membership) the firm now appears in the Proposer/Seconder dropdowns for
  future applicants.
- **Raise Objection** → returns to the Scrutiniser; chain restarts on
  Scrutiniser re-approval.
- **Reject** → terminal; applicant must submit a fresh application.

**Resubmission behavior (Raise Objection path):** When the Scrutiniser
re-approves a bounced application, **the full chain restarts from the
Convenor**. (This is by design — every committee role gets to re-evaluate
after any change.) The audit timeline preserves every prior approval,
objection, edit, and re-approval, in chronological order, with timestamps
and the acting user.

**Termination behavior (Reject path):** A rejected application is closed
and immutable. The applicant receives an email containing the rejection
reason. There is **no data inheritance** — if the applicant chooses to
re-apply, they start a fresh application from scratch (this is by design,
to ensure any rejection-driven changes are intentionally re-entered).

**What could go wrong (handled):**

- A bounced application sits with the Scrutiniser too long → SLA-aging
  visible on the Scrutiniser dashboard *(scope-extended)*; configurable
  alert to System Admin if it stalls beyond N business days.
- An upper-stage approver wants to add a comment but not block the
  application → use **Raise Objection** with the note as the message;
  Scrutiniser triages whether to edit-and-re-approve quickly or bounce
  to applicant.

**Capabilities revealed:**

- Sequential approval workflow engine with explicit per-stage roles
  (Scrutiniser → Convenor → Director General → Secretary).
- Bounce-back routing rules: from Scrutiniser → applicant; from any
  upper stage → Scrutiniser only.
- Three distinct actions per upper stage: Approve, Raise Objection,
  Reject — all with mandatory reason fields where applicable.
- Reject (terminal) vs Raise Objection (recoverable) as distinct
  outcomes with distinct notification routing.
- No data inheritance from rejected applications.
- Per-role inboxes and dashboards (Convenor, DG, Secretary) showing
  only applications at their stage.
- Daily digest notifications to upper-stage approvers.
- Application audit timeline visible to every stage, showing all prior
  approvals, objections, rejections, edits, and Scrutiniser resolutions.
- Full-chain restart on Scrutiniser re-approval after any upper-stage
  Raise Objection.
- Member directory auto-update on Secretary approval; downstream
  Proposer/Seconder dropdown refresh.

### Journey 6 — Payment Officer: Offline Payment Recording

**Persona — Mahesh Pawar, CREDAI Pune Payment Officer**

Some applicants prefer to pay in person — by cash, cheque, NEFT, or DD —
either because of comfort or because their finance team requires a stamped
office receipt. Mahesh handles all such collections.

**Opening:** A Partnership-firm partner walks into the office with a cheque
for ₹1,29,800. Mahesh logs in and pulls up the firm's pending application by
firm name or application ID.

**Climax:** He clicks **Record Offline Payment**, selects **Mode = Cheque**,
enters the cheque number (mandatory reference), bank, date, amount,
optionally uploads a scan of the cheque or stamped receipt, and saves
*(scope-extended)*. The portal posts the entry to the payment ledger,
updates payment status to **Reconciled**, and triggers a payment receipt
email to the applicant. The application's review-screen "Payment" pill turns
green within seconds.

**Resolution:** Mahesh hands the applicant a stamped paper receipt as well.
End of day, he opens the **Payment Dashboard** *(scope-extended)* — total
collected today (online + offline split), pending fees, any
receipt-vs-portal mismatches.

**What could go wrong:** Cheque bounces a week later — Mahesh marks the
ledger entry as **Reversed** with reason; payment status reverts to
**Unpaid**; applicant is notified *(scope-extended)*. Duplicate entry
attempt with the same cheque number is blocked by uniqueness constraint.

**Capabilities revealed:** Offline payment entry screen with mode-specific
fields, payment ledger with reconciliation status, payment dashboard with
online/offline split, payment-status webhook into application workflow,
reversal workflow for bounced cheques / failed transfers, uniqueness
constraints on receipt/reference numbers.

### Journey 7 — System Admin: Onboarding a New Staff User

**Persona — Deepak Shah, CREDAI Pune System Admin**

A new junior Scrutiniser, Sneha, joins the CREDAI Pune office. Deepak needs
to give her access.

**Opening:** Deepak logs in to the **Admin Console** *(scope-extended)*. He
opens **Users → Add User**, enters Sneha's email and name, and assigns her
the **Scrutiniser** role.

**Climax:** Sneha receives an invitation email with a one-time login link.
She sets her password and logs in to her empty Scrutiniser inbox.

**Resolution:** Deepak periodically reviews the **Audit Log** to confirm no
unauthorized access; rotates passwords / disables accounts when staff
members leave; manages master-data lookups (e.g., adding a new district code
if CREDAI Pune jurisdiction expands).

**President management (additional System Admin responsibility):**
Deepak also maintains the **Current President** record — a master-data
entry containing the President's name, designation label, signature
image, and tenure dates. The President is *not* a user of the system
(no login, no role, no application access); the record exists solely
to render the President's name and signature on issued membership
certificates. When a new President is appointed, Deepak marks the
outgoing one inactive (with end date) and adds the incoming one (with
start date). The system enforces that **exactly one President is
active at any moment**. The change takes effect on certificates issued
after the update; previously-issued certificates retain the President's
name and signature as they were at the moment of original issue.

**Capabilities revealed:** RBAC user management, role assignment, audit log
read access, master-data administration, account lifecycle (invite, active,
disable), President record management with single-active enforcement and
historical fidelity.

### Journey Requirements Summary

The seven journeys above collectively reveal the following capability areas
that the system must deliver:

| Capability Area | Driven By Journeys |
|---|---|
| Email + OTP authentication | 1, 2, 3, 4, 5, 6, 7 |
| Conditional wizard engine (Membership Type × Firm Type) | 1, 2 |
| Document upload, view, replace, version | 1, 2, 3 |
| External verification (GST, PAN) with graceful fallback | 1, 2, 4 |
| Member directory as live data source | 1, 2, 5 |
| Application state machine with locking on submit | 1, 2, 4, 5 |
| Dual-mode payment (online gateway + offline entry) with reconciliation | 1, 2, 3, 6 |
| Renewal pre-fill, scheduled reminders (T-30, T-15), grace, lapse | 3 |
| Per-role inboxes / dashboards with filter, sort, SLA-aging, export | 4, 5, 6 |
| Scrutiniser-only inline edit on applicant data with full audit trail | 4 |
| Auto-revalidation of GST/PAN on relevant Scrutiniser edits | 4 |
| 4-stage sequential approval workflow with bounce-back routing | 4, 5 |
| Distinct Reject (terminal) and Raise Objection (recoverable) actions per stage | 4, 5 |
| Reject notifications: applicant always notified with reason; Scrutiniser notified for upper-stage rejects (awareness only) | 4, 5 |
| No data inheritance from rejected applications — fresh application required from scratch | 4, 5 |
| Application audit timeline visible at every stage | 4, 5 |
| Full-chain restart on Scrutiniser re-approval after upper-stage Raise Objection | 4, 5 |
| Reminder to applicant on overdue clarifications | 4 |
| Notifications (email; SMS/WhatsApp future) per state transition | 1, 3, 4, 5, 6 |
| Document vault (per-member, versioned, audit-searchable) | 1, 3, 4, 7 |
| RBAC for 7 roles; user lifecycle; master-data admin | 7 |
| President record management (single-active enforcement, historical fidelity) | 7 |
| Membership certificate generation (PDF, Membership Number, embedded President signature, QR code) | 5, 7 |
| Server-side document-signing certificate for tamper-evident certificate PDFs | 5, 7 |
| Public certificate verification endpoint (unauthenticated, rate-limited, minimal info) | 5 |
| Audit log (state changes, document accesses, payment entries, edits, certificate issuances) | 4, 6, 7 |

## Domain-Specific Requirements

### Compliance & Regulatory

**Indian data privacy (Digital Personal Data Protection Act, 2023):**
- The portal collects, stores, and processes personal data of natural persons
  (Proprietors, Partners, Directors, Members, Authorized Contact Persons).
  CREDAI Pune is the **Data Fiduciary** under the DPDP Act; the system
  vendor is the **Data Processor**.
- **Consent capture** — explicit consent statement displayed at signup and
  at Review & Submit, capturing purpose-bound consent for: (a) processing
  the membership application, (b) external verification (GST, PAN), (c)
  storage in the document vault, (d) communication via email and (future)
  SMS / WhatsApp. Consent record is timestamped and immutable.
- **Purpose limitation** — personal data used only for membership
  administration; no third-party sharing without separate consent.
- **Right of access** — members can view all personal data the system
  holds about them at any time via the document vault and profile screens.
- **Right of correction** — members may update contact details and
  re-upload identity documents (replaces stale doc; old version retained
  in vault for audit, marked superseded).
- **Right of erasure** — request handling procedure documented; subject
  to retention obligations (see *Data Retention* below).
- **Breach notification** — incident response procedure with reporting
  to the Data Protection Board within statutorily mandated timelines.

**Aadhaar handling (UIDAI Aadhaar Act 2016 + UIDAI regulations):**
- Aadhaar number is collected as a 12-digit identifier *(SRS)* and an
  Aadhaar card scan is uploaded *(SRS)*.
- **Storage:** Aadhaar number stored in encrypted form at rest using a
  separate encryption key from other PII (envelope encryption).
- **Display:** Aadhaar number must be **masked** in all UI surfaces
  except the upload-replace flow (e.g., shown as `XXXX-XXXX-1234`).
  Full Aadhaar visible only on explicit reveal action by the holder; not
  visible to any CREDAI staff role unless the user explicitly authorizes.
  *(This goes beyond SRS, which is silent on masking.)*
- **No use of Aadhaar for authentication** — Aadhaar is captured as a KYC
  document only. Login is email + OTP per SRS. The system is **not** an
  Aadhaar-authentication-using-entity (AUA / KUA).
- **No biometric capture or eKYC integration** in MVP.
- Aadhaar-linked information must not be published or shared externally;
  proposer/seconder dropdowns expose firm name only, never Aadhaar of
  any member.

**PAN (Income Tax Act):**
- PAN collected for the firm and for each Proprietor / Partner / Director
  / Member *(SRS)*.
- PAN verification via NSDL / Protean (or RBI-approved equivalent) API.
- PAN displayed in plain text to authorized staff (Scrutiniser, upper
  approval chain) since it is required for identity verification.

**GST (CGST/SGST Acts, GST e-invoicing):**
- GSTIN of the applicant firm collected and verified via the GSTN public
  API *(SRS)*.
- All membership fees attract **GST @ 18%** *(SRS-confirmed)*.
- Payment receipts and invoices issued by CREDAI Pune (the supplier of
  the membership service) must be **GST-compliant tax invoices** carrying
  CREDAI Pune's own GSTIN, the recipient's GSTIN, taxable value, CGST /
  SGST / IGST split, and HSN/SAC code.
- *Open item — subject to client confirmation:* If CREDAI Pune's annual
  aggregate turnover crosses the GST e-invoicing threshold (currently
  ₹5 crore), the system must integrate with the GST IRP for IRN
  generation.

**Real-estate regulatory (RERA / MahaRERA):**
- MahaRERA project registration number captured at firm-level *(SRS)* and
  project-level for RERA Project Membership *(SRS)*.
- N.A. Order, Commencement Certificate, Completion Certificate uploads
  per SRS.
- **MVP:** MahaRERA registration captured as data + uploaded certificate;
  no live API verification.
- **Growth:** integration with the public MahaRERA portal
  (maharera.maharashtra.gov.in) to verify the project number is currently
  valid and registered to the applicant firm. *Subject to client
  confirmation whether to pull into MVP.*

**IT Act 2000 + Information Technology (Reasonable Security Practices)
Rules 2011:**
- "Sensitive personal data" handling — passwords, financial information,
  biometric (none in MVP), payment card numbers (none stored — gateway
  tokenization), health (none): all handled per Rule 8 reasonable
  security practices.
- Designate Grievance Officer (typically the Secretary) with contact
  published on the portal.
- Privacy Policy and Terms of Service published before signup; consent
  to both required at signup.

**Code of Conduct & Self Declaration (CREDAI association policy):**
- Per SRS, applicants must download, sign, stamp, and upload the
  CREDAI Code of Conduct and a Self Declaration on firm letterhead.
  These are association compliance instruments, not statutory ones, but
  are equally enforced as mandatory uploads.

**Membership certificate signing (IT Act 2000):**
- Issued certificates are signed in MVP using a **single document-signing
  certificate held by the portal** (system-applied), providing tamper-
  evidence without requiring any individual official to operate a
  Class 2 / Class 3 Digital Signature Certificate (DSC) per certificate.
- The **President's signature on the certificate is an image** of the
  handwritten signature, not a cryptographic signature. The cryptographic
  trust is provided by the portal's system signature on the PDF and by
  the QR-code-driven public verification endpoint.
- Phase 2 (Growth) may add an upgrade path to layer a Class 2 / Class 3
  DSC of the President or Secretary if stronger legal weight is later
  required by CREDAI Pune or external regulators.

### Technical Constraints

**Security:**
- All PII (Aadhaar, PAN, signed documents, photos) encrypted at rest
  with per-tenant keys (this single-tenant build still benefits from
  the pattern for future multi-chapter expansion).
- All traffic over TLS 1.2+; HSTS enforced.
- Secrets (API keys for GST/PAN providers, payment gateway, email
  service) managed via a secrets manager; never in source control.
- Periodic third-party VAPT (Vulnerability Assessment and Penetration
  Testing) before launch and annually thereafter.
- **MFA for CREDAI-side roles** (Scrutiniser, Convenor, Director General,
  Secretary, System Admin, Payment Officer) — TOTP-based MFA mandatory
  in MVP. Applicant accounts use email + OTP per SRS. *Subject to client
  confirmation; recommendation is to keep MFA in MVP for security
  hygiene.*

**Privacy by design:**
- PII collection limited to SRS-defined fields plus what's strictly
  required for staff workflow.
- Aadhaar masked by default (see above).
- Audit log captures every read of an Aadhaar field by any staff user.
- No PII in URL parameters, error messages, or logs.

**Data retention (subject to client confirmation):**
- **Active member data and documents:** retained for the duration of
  membership + 7 years after lapse / cancellation.
- **Rejected applications:** retained for 3 years from rejection date
  (for audit / regulatory reference), then automatically purged unless
  legal hold.
- **Audit log:** retained for 7 years (immutable).
- **Payment records:** retained for 8 years (Income Tax / GST audit
  window).

**Payment compliance (RBI / payment gateway requirements):**
- No card numbers, CVV, or bank credentials stored on the portal —
  payment gateway handles all card / netbanking / UPI flows
  (PCI-DSS scope reduction).
- Gateway selection: integration agnostic; client to choose among RBI-
  authorized payment aggregators (Razorpay / PayU / CCAvenue / BillDesk
  / Cashfree). *Subject to client confirmation.*
- Gateway callbacks idempotent and signature-verified per provider spec.
- Refund workflow supported (Payment Officer-initiated; reversed-cheque
  case from Journey 6 is one example).

**Performance & availability:**
- Per success criteria: ≥ 99.5 % monthly uptime; p95 page latency ≤ 2 s.
- Daily backups with point-in-time recovery for at least 35 days.
- Disaster recovery RTO ≤ 24 hours, RPO ≤ 1 hour for application + vault
  data.

**Accessibility (Rights of Persons with Disabilities Act 2016 + WCAG 2.1 AA):**
- Per success criteria: WCAG 2.1 AA for the applicant wizard and staff
  screens.
- Keyboard navigation throughout the wizard; screen-reader labels for
  every form field.
- Adequate colour contrast; text resizable to 200 % without loss of
  function.

### Integration Requirements

| Integration | Purpose | Provider Class | MVP / Growth |
|---|---|---|---|
| Email service | OTP, notifications, payment receipts, renewal reminders | SES / SendGrid / SMTP relay | MVP |
| GST verification API | Validate GSTIN + fetch firm name match | GSTN public API or licensed reseller | MVP |
| PAN verification API | Validate PAN format + fetch name | NSDL / Protean / RBI-authorized provider | MVP |
| Payment gateway | Online fee collection (cards, UPI, netbanking) | Razorpay / PayU / CCAvenue / equivalent | MVP — *client to choose* |
| GST e-invoicing (IRP) | Generate IRN for tax invoices | GST IRP API | *Conditional — only if turnover ≥ threshold* |
| MahaRERA portal | Live verification of project registration | maharera.maharashtra.gov.in | Growth (MVP candidate — *client to confirm*) |
| SMS / WhatsApp gateway | OTP and reminders alternate channel | TextLocal / MSG91 / Gupshup | Growth |
| ERP / accounting system | GL posting, period-end reconciliation | TBD by CREDAI Pune | Growth |

### Risk Mitigations

| Risk | Mitigation |
|---|---|
| External verification API outage (GST / PAN) blocks submissions | Queue-and-retry pattern; submission allowed with status "verification pending"; staff manually retry / accept on review |
| Aadhaar data breach exposes 12-digit numbers | Envelope encryption with separate keys; masked display; access audit trail; periodic VAPT; per UIDAI guidance |
| Payment gateway double-charge or webhook replay | Idempotent payment IDs; signature verification; ledger uniqueness constraints |
| Bounced cheque post-approval | Reversal workflow updates payment status; configurable: revoke approval or flag for committee re-review |
| Forged uploaded documents (Code of Conduct, Self Declaration, identity) | Scrutiniser visual review; future enhancement: compare uploaded photo with Aadhaar photo via vision AI |
| Member directory leak (firm names + status) | Restricted to authenticated staff and applicants in MVP; public directory only as a Growth feature with explicit committee approval |
| Renewal reminder failure (T-30, T-15) → member lapses unintentionally | Reminder send-success logged; if both reminders fail, escalate to staff for manual outreach; configurable grace period |
| Staff user account compromise | MFA enforced for all CREDAI-side roles in MVP; session timeouts; audit log review |
| Long-running multi-stage approval stalls | SLA-aging visible per stage; configurable alert escalation to System Admin |
| Loss of vault documents | Daily encrypted backups + cross-region replica; document hash stored to detect tampering |

## Web Application Specific Requirements

This section captures requirements specific to the *web_app* project type.
Domain compliance, security, performance, and accessibility targets that
already appear in **Success Criteria** and **Domain-Specific Requirements**
are not repeated — only web-application-specific extensions and
architectural decisions are captured here.

### Application Architecture

- **Single-Page Application (SPA)** for the authenticated portal — applicant
  wizard, document vault, member dashboard, and all CREDAI staff screens.
  The SRS-defined 12-step wizard is heavily stateful with conditional reveals
  driven by Membership Type × Firm Type, Save-and-Resume, inline file uploads,
  and inline GST/PAN verification — characteristics that benefit from
  client-side state management without per-step round trips.
- **Server-rendered (SSR or static) public surfaces** — login, signup,
  privacy policy, terms of service, contact / grievance officer page. These
  may need basic SEO (organic discovery of "CREDAI Pune membership" by
  prospective applicants).
- **API backend** — RESTful HTTPS API behind the SPA, backed by a relational
  database (Postgres or equivalent) and an object / file store for
  document vault uploads.
- **Asynchronous workers** — for scheduled jobs (renewal reminders at T-30
  and T-15, lapse-status transitions, payment-status reconciliation,
  GST/PAN re-verification queue, email dispatch).

### Browser Matrix

- **Tier 1 (full support, all features tested):**
  - Chrome (last 2 major versions)
  - Edge (last 2 major versions)
  - Safari (last 2 major versions, macOS + iOS)
  - Firefox (last 2 major versions)
  - Chrome on Android (last 2 major versions)
- **Tier 2 (supported with graceful degradation):**
  - Samsung Internet (last 2 major versions)
- **Not supported:** Internet Explorer (any version), browsers older than
  Tier 1's "last 2" window. Users on unsupported browsers get a clear
  upgrade-prompt page rather than a broken experience.

### Responsive Design

- **Breakpoints (target):**
  - Mobile (≥ 360 px) — applicant wizard fully usable; staff inbox usable but
    optimized for desktop / tablet.
  - Tablet (≥ 768 px) — full applicant + staff experience usable.
  - Desktop (≥ 1280 px) — primary CREDAI staff experience; dashboards
    optimized for this viewport.
- **Wizard on mobile:** the 12 SRS steps remain identical in content; layout
  collapses to single-column with sticky progress indicator and sticky
  primary action button (Next / Submit).
- **Document upload on mobile:** native file-picker invocation; camera
  capture supported for ID and photo documents.
- **Dashboards on mobile:** read-only summary tiles + drill-down list views;
  full-width data tables collapse to card layouts.

### Performance Targets

(Extending the Success Criteria targets with web-app-specific budgets.)

- **Initial page load (cold):** ≤ 3 s on 4G mobile, ≤ 1.5 s on broadband
  desktop (p95).
- **Subsequent navigation (warm SPA route change):** ≤ 500 ms (p95).
- **First Contentful Paint (FCP):** ≤ 1.8 s (p75 mobile).
- **Largest Contentful Paint (LCP):** ≤ 2.5 s (p75 mobile).
- **Cumulative Layout Shift (CLS):** ≤ 0.1.
- **Interaction to Next Paint (INP):** ≤ 200 ms (p75).
- **Bundle size budget:** initial JS ≤ 250 KB gzipped; route-split additional
  chunks ≤ 100 KB each.
- **Image strategy:** lazy-load all UI mockup-style images; serve WebP/AVIF
  with PNG fallback; cache-friendly delivery.

### SEO Strategy

- **Authenticated portal:** **explicitly excluded from indexing** —
  `noindex, nofollow` headers on all authenticated routes; no PII or
  application data in URLs.
- **Public surfaces (login, signup, privacy, terms, grievance contact,
  marketing landing if applicable):** indexed; standard SEO hygiene
  (semantic HTML, descriptive titles, OpenGraph metadata, sitemap.xml,
  structured data for organization details). Goal: a Pune real-estate
  builder searching "CREDAI Pune membership" lands on the portal's
  signup page.
- **Future Public Directory (Growth feature):** if launched, member
  directory pages indexed with structured data (`Organization`,
  `LocalBusiness`) for member firms.

### Real-Time Requirements

- **No hard real-time requirements** in MVP. The 12-step wizard, payment
  flows, and staff review screens are request/response sufficient.
- **Pseudo-real-time updates** via short-poll or server-sent events:
  - Staff inbox auto-refresh on new submissions (every ~30 s polling
    sufficient for MVP; SSE / WebSocket as Growth optimisation).
  - Applicant submission status change reflected on next page load /
    refresh; an in-app notification badge updates within ~30 s.
- **Webhook-driven updates** for payment gateway callbacks (idempotent).
- **OTP delivery latency:** sub-30-second email delivery target;
  Resend OTP available immediately *(SRS)*.

### Accessibility

(Targets stated in Success Criteria and Domain-Specific Requirements
sections; web-app-specific implementation notes captured here.)

- **Standard:** WCAG 2.1 Level AA across the applicant wizard and CREDAI
  staff screens.
- **Implementation:**
  - Semantic HTML (`<form>`, `<fieldset>`, `<legend>`, `<label>`, etc.)
    throughout — no `<div>`-as-button anti-patterns.
  - Each form input has an associated `<label>` and an aria-describedby
    pointing to inline error / helper text.
  - Wizard step indicator exposes current/total to screen readers
    (`aria-current="step"` and an off-screen "Step N of 12" label).
  - Focus management: on step navigation, focus moves to the new step's
    first heading; on validation error, focus moves to the first invalid
    field.
  - Keyboard-only completion of the entire 12-step wizard is testable.
  - Colour contrast ≥ 4.5:1 for text; status indicators
    (verification pass/fail, payment status pills) do not rely on
    colour alone — pair with iconography and text labels.
  - Document upload affordance accessible: file-input is keyboard-
    focusable with a visible focus ring; drag-and-drop is an
    enhancement, not the only path.
  - Error summaries at the top of each step (announced via
    `role="alert"`).
- **Testing:** automated axe / Lighthouse runs in CI; manual screen-reader
  smoke test (NVDA on Windows, VoiceOver on macOS / iOS) before each
  release that touches the wizard or staff review screens.

### Internationalization

- **MVP:** English-only UI. The SRS is in English; CREDAI Pune
  documentation and Code of Conduct templates are in English.
- **Locale formatting:** all currency in INR with Indian-style grouping
  (₹1,29,800), all dates in `DD/MM/YYYY` per SRS Step 6 RERA Project
  Membership format.
- **Future (out of scope for MVP):** Marathi and Hindi language toggles
  if CREDAI Pune later requires regional-language access for applicants.

### Deployment & Hosting Considerations

- **Hosting:** infrastructure choice (on-premises, dedicated server,
  managed hosting, or cloud) is deferred to the architecture step. The
  PRD remains hosting-agnostic.
- **Data residency:** all PII and document-vault data must be stored on
  infrastructure physically located in India, in line with the DPDP Act
  spirit. This constrains hosting selection but does not mandate cloud.
- **Environments:** at minimum **dev**, **staging**, **production**;
  staging mirrors production data shape with synthetic data only (no
  production PII in lower environments).
- **CI/CD:** automated build, test, accessibility check, security scan,
  and deploy-to-staging pipeline; production deploys gated on staging
  smoke tests + manual approval.
- **Static-asset delivery:** static assets and document-vault read URLs
  served via a caching / edge layer where available; signed, short-TTL
  URLs for vault downloads. Implementation specifics deferred to the
  architecture step.

### Implementation Considerations

- **Framework choice:** modern SPA framework with mature ecosystem,
  TypeScript, server-rendering capability for public surfaces, and
  strong forms / validation story (e.g., React + Next.js, Vue + Nuxt,
  or equivalent). *Final selection deferred to the architecture step;
  the PRD is implementation-agnostic.*
- **Forms layer:** use a structured form library with declarative
  validation (Zod / Yup / equivalent) — the conditional Membership ×
  Firm Type matrix is far easier to maintain declaratively than
  imperatively.
- **Document storage:** an object / file store with server-side
  encryption-at-rest (per Domain-Specific Requirements); presigned or
  time-limited URLs for client uploads and downloads. Implementation
  (self-hosted MinIO, on-prem NAS with app-mediated access, or any
  equivalent) deferred to the architecture step.
- **Background jobs:** a durable queue + worker tier for renewal
  reminders, lapse transitions, GST/PAN re-verification, email dispatch.
  Implementation (self-hosted message broker, in-process scheduler with
  durable storage, or equivalent) deferred to the architecture step.
- **Observability:** structured application logs (no PII), distributed
  tracing for the wizard → submit → workflow chain, real-user monitoring
  (RUM) for performance budgets above, uptime monitoring for the
  Success Criteria 99.5 % target.
- **Feature flags:** runtime feature-flag layer for gradual rollout of
  Growth-bucket capabilities (public directory, MahaRERA integration,
  SMS channel) without redeploys.

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

This is a **problem-solving MVP**, not an experience MVP, platform MVP, or
revenue MVP. The objective at launch is to **end-to-end replace the existing
paper-based CREDAI Pune membership lifecycle** for both applicant firms and
CREDAI Pune office staff — including the issuance of the membership
certificate, which is the actual artefact applicants are applying for.

**Why problem-solving MVP and not a thinner slice:**

- Shipping intake-only (the SRS-defined wizard) without staff review,
  payment, approval, and certificate issuance would leave the manual
  paper process intact downstream — staff would receive a digital
  application but still process it manually, and applicants would still
  receive a paper certificate. That's not a usable end state; it's a
  half-cut that delivers no operational benefit.
- Shipping without renewals would force CREDAI Pune to maintain a parallel
  paper renewals process for existing members for the first year —
  fragmented data, double work for staff, and member confusion.
- Shipping without payment integration would break the SRS-defined fee
  flow (Entrance Fee + Annual Subscription + 18 % GST) at the most
  visible step, and would block the success-criteria target of online
  fee collection.
- Shipping without staff dashboards would leave the "easy reviewing for
  staff" success criterion unmet from day one.
- Shipping without certificate issuance would mean the system never
  actually delivers the thing applicants are applying for.

**MVP success test:** within the first 90 days post-launch, CREDAI Pune
should be able to **stop accepting paper applications entirely** and
process all new applications, all renewals, all payments, all approvals,
all certificate issuances, and all dashboard reporting through this
portal.

### MVP Boundary (referenced from Product Scope §MVP)

The complete MVP feature inventory is in the **Product Scope → MVP** section
above. At a strategic level, the MVP boundary is defined as:

**In MVP:**
- Full applicant intake wizard for all 3 Membership Types × 7 Firm Types
  per the SRS.
- 4-stage sequential approval workflow (Scrutiniser → Convenor → Director
  General → Secretary) with Scrutiniser-only edit, bounce-back-to-Scrutiniser
  on Raise Objection, and terminal Reject.
- All 7 RBAC roles with MFA for the 6 CREDAI-side roles.
- Dual-mode payment (online gateway + offline Payment Officer entry) with
  reconciled ledger.
- Renewals with T-30 / T-15 reminder cadence.
- Document vault with versioning.
- Existing-member access.
- Staff dashboards (operational, member, payment, KPI).
- Email notifications.
- Audit log.
- **Membership certificate generation, issuance, renewal re-issuance,
  and revocation.**
- **President record management by System Admin (single-active record
  with uploaded signature image and tenure dates).**
- **Public certificate verification endpoint (minimal info, rate-limited).**

**Explicitly out of MVP** (deferred to Growth or Vision per Product Scope):

- SMS / WhatsApp channel.
- Bulk staff operations.
- Public-facing browsable member directory (distinct from the per-cert
  verification endpoint, which IS in MVP).
- ERP / accounting integration.
- MahaRERA live API verification *(MVP candidate — pending client decision)*.
- Member-to-member messaging.
- Events, voting, grievances.
- Multi-chapter expansion.
- Mobile native apps.
- Upgraded certificate signing with Class 2 / Class 3 DSCs of the
  President or Secretary.

### Phased Development Roadmap

**Phase 1 — MVP (Launch v1):** as defined above and in Product Scope §MVP.
Single integrated release; staged-internally before public cutover.

**Phase 2 — Growth (post-launch, target: 6–12 months after MVP):**
- Bulk staff operations.
- SMS / WhatsApp channel for OTP and reminders.
- Public-facing browsable member directory.
- ERP / accounting integration for automatic GL posting.
- MahaRERA live API verification (if not pulled into MVP).
- Configurable fee structures (rate revisions without code changes).
- Member self-service for routine updates (firm contact details,
  refreshed identity documents).
- Real-time staff inbox updates (SSE / WebSocket replacing polling).
- Upgraded certificate signing with Class 2 / Class 3 DSC of the
  President or Secretary, layered over the MVP system signature.

**Phase 3 — Vision (target: 12+ months after MVP, contingent on
client appetite):**
- Event registration and management.
- Member voting / governance workflows.
- Grievance and dispute resolution module.
- Multi-chapter expansion (CREDAI national federation): tenant model,
  cross-chapter member portability, federated directory.
- Mobile native apps (iOS / Android).
- Marathi / Hindi UI.

### Risk-Based Scoping Analysis

**Technical risks:**

| Risk | Severity | Mitigation |
|---|---|---|
| Conditional Membership × Firm Type wizard logic is the most intricate part of the SRS; mistakes cascade | High | Declarative form/validation library; comprehensive test matrix covering all 3 × 7 = 21 path combinations; staged rollout with visible "report a problem" channel during the first 60 days |
| 4-stage approval workflow with bounce-back-to-Scrutiniser + chain-restart is an unusual state machine; off-the-shelf workflow libraries may not fit cleanly | Medium-High | Build the state machine explicitly with property-based tests on every legal transition; full audit timeline as a verification surface |
| External GST / PAN verification provider outages block submissions | Medium | Queue-and-retry with "verification pending" status; documented manual override path for staff; SLA monitoring on providers |
| Aadhaar handling — masking, encryption, and audit trail requirements are easy to get subtly wrong (UIDAI compliance) | High (regulatory) | Aadhaar treated as a tagged data type from schema upward; masking enforced at the response-serialization layer (not just UI); periodic VAPT specifically scopes Aadhaar paths |
| Dual-mode payment reconciliation drift (online vs offline ledger) | Medium | Single ledger with mode-tagged entries; nightly reconciliation report; uniqueness constraints on receipt / reference numbers; refund / reversal workflows audited |
| Document vault scale — versioned, encrypted, indexed for fast retrieval (success target: < 1 minute audit retrieval) | Low-Medium | Indexed by member + document-type + version; tested with synthetic load equivalent to 5 years of CREDAI Pune membership volume |
| Certificate generation must embed the President's name and signature *as of the moment of issue*, surviving later President changes | Medium | Snapshot the President record into the certificate metadata at issue time; never re-render certificates from live President data; regression tests for the snapshot invariant |
| Public certificate verification endpoint is an unauthenticated surface; potential for abuse (scraping, enumeration) | Medium | Per-IP rate limits, captcha for repeated lookups, no PII in responses, monitoring for anomalous traffic |

**Operational / market risks:**

| Risk | Severity | Mitigation |
|---|---|---|
| Staff resistance — long-time CREDAI Pune staff who've reviewed paper applications for years may resist the digital workflow | Medium-High | Training programme; on-site go-live support for first 2 weeks; "shadow" period where paper continues for 30 days alongside digital before cutover |
| Applicant adoption — some builders prefer paper / office visits | Medium | Allow applicants to walk in with documents and have a Scrutiniser fill the form on their behalf using the same applicant flow (same forms, same workflow — just data-entered by staff); paper-only mode is *not* offered as an alternative |
| Migration of existing member data — CREDAI Pune already has a member roster; how does it land in the system? | High | **Data-migration mini-project as part of MVP delivery**: extract existing member list from current source (Excel? legacy system?), transform to portal schema, load with a flag distinguishing migrated vs portal-native records; *requires explicit client decision on source format and quality* |
| Migrated members need certificates retroactively issued in the new format, including a President signature for a date when a different President may have been in office | Medium | Either (a) issue all migrated members a fresh certificate with the *current* President's signature dated on the migration date, OR (b) capture historical Presidents in the President record and issue retroactive certificates per-tenure; client decision required |
| Scope creep during build — committee sees the working portal and wants events / voting added before launch | Medium | Documented MVP boundary and phased roadmap signed by client at PRD acceptance; change requests routed to a Phase-2 backlog without disturbing MVP delivery |

**Resource risks:** This is a client project, so the engagement model and
team size are governed by the client contract rather than by this PRD.
The PRD assumes a mixed team (frontend, backend, integrations, QA,
project management, accessibility specialist for AA compliance audit).

### Open Decisions Required Before / During Architecture Phase

These decisions emerged during PRD discovery and are pending client input.
They do not block PRD finalization but must be resolved before the
architecture step is complete.

| # | Decision | Default Assumed | Owner |
|---|---|---|---|
| 1 | GST e-invoicing applicability (depends on CREDAI Pune annual turnover ≥ ₹5 cr) | Not applicable — standard tax invoice only | Client |
| 2 | Payment gateway selection (Razorpay / PayU / CCAvenue / BillDesk / Cashfree) | Defer to client | Client |
| 3 | MahaRERA live API verification — MVP or Growth? | Growth | Client |
| 4 | Data retention periods (active member, rejected, audit log, payment) | 7 / 3 / 7 / 8 years | Client |
| 5 | MFA for CREDAI-side roles in MVP | Yes (TOTP-based) | Client |
| 6 | Hosting choice (on-prem / managed / cloud) under India data-residency constraint | Deferred to architecture | Architect + Client |
| 7 | Existing-member data migration source format and quality | TBD | Client |
| 8 | Membership Number format (does CREDAI Pune have an existing convention?) | `CPN/{ORD|ASC|RERA}/{YYYY}/{seq}` | Client |
| 9 | Treatment of migrated members' certificates (current-President reissue vs historical-President capture) | Current-President reissue dated on migration date | Client |
| 10 | Staff training and go-live support model | Phased cutover with 30-day parallel paper period | Client + delivery team |
| 11 | Internationalization — English-only at MVP confirmed? | English-only | Client |

## Functional Requirements

This list is the **capability contract** for Credai. Every feature in
the final product must map to an FR here; any feature not listed will
not exist unless explicitly added to this PRD. FRs are
implementation-agnostic — they state WHAT capabilities exist, not HOW
they are built.

### Authentication & Identity

- **FR1:** Applicants and Members can sign up and log in using their
  email address with OTP verification (no password).
- **FR2:** The System sends a one-time password (OTP) to the user's
  verified email upon request, valid for 2 minutes *(SRS FR-1)*.
- **FR3:** Applicants and Members can request OTP resend an unlimited
  number of times *(SRS)*.
- **FR4:** Applicants and Members can change the email address used
  for OTP before verification *(SRS)*.
- **FR5:** CREDAI staff users (Scrutiniser, Convenor, Director General,
  Secretary, System Admin, Payment Officer) can log in with email and
  password protected by TOTP-based multi-factor authentication.
- **FR6:** The System enforces session timeouts and terminates inactive
  staff sessions after a configurable period.

### Membership Application Wizard

- **FR7:** Applicants can start a new membership application after
  authentication.
- **FR8:** Applicants can choose their Membership Type from Ordinary,
  Associate, or RERA Project Membership *(SRS)*.
- **FR9:** The System restricts a new applicant's first application to
  Ordinary Membership only *(SRS business rule)*.
- **FR10:** Applicants can choose Associate Membership only after their
  firm holds an approved Ordinary Membership *(SRS business rule)*.
- **FR11:** Applicants applying for Associate Membership can select an
  existing approved Ordinary Member firm to associate with from a
  dropdown *(SRS)*.
- **FR12:** The System dynamically reveals form fields, document upload
  requirements, and conditional steps based on the selected Membership
  Type and Firm Type combination *(SRS)*.
- **FR13:** Applicants can navigate the wizard via Next, Previous, and
  Cancel actions, with a visible progress indicator showing the active
  step *(SRS)*.
- **FR14:** Applicants can save an in-progress application as a draft
  and resume later from where they left off.
- **FR15:** Applicants can enter firm details including Firm Name, Firm
  Type (Proprietorship / Partnership / Pvt Ltd / LLP / Public Sector /
  AOP / Co-operative Society), MahaRERA Number, completed-projects
  count, ongoing-projects count, and N.A. Order date *(SRS)*.
- **FR16:** Applicants can enter address details including Address
  Line 1, Address Line 2, District (Pune), State (Maharashtra),
  Pincode (6 digits), and Location (PMC / PCMC / PMRDA) *(SRS)*.
- **FR17:** Applicants can enter Authorized Contact Person details
  including Name, Designation, Address, Email, Mobile (10 digits), and
  Landline *(SRS)*.
- **FR18:** Applicants applying for Ordinary Membership can add one or
  more Completed Projects (Name of Scheme, Address, Number of Flats,
  Construction Commenced On, Construction Completed On, Amenities, and
  a Completion Certificate upload per project) *(SRS)*.
- **FR19:** Applicants applying for Ordinary or Associate Membership
  can add one or more Commencement Projects (Name of Scheme, Address,
  Number of Flats, Construction Proposed On, and a Commencement
  Certificate upload per project) *(SRS)*.
- **FR20:** Applicants applying for RERA Project Membership can enter
  project details including Name of Project, Location, Proposed
  Completion Date, Project Type (multi-select: Residential /
  Commercial / Plotting), and Number of Units per selected Project
  Type *(SRS)*.
- **FR21:** Applicants can enter details of all Proprietors / Partners
  / Directors / Members per Firm Type — each with Name, Address,
  Mobile, Email, Education, Degree, Real Estate Experience, Aadhaar,
  Designation, PAN, and uploads of Aadhaar, PAN, Signature, and Self
  Photo *(SRS)*.
- **FR22:** The System enforces firm-type-specific minimum-entity rules
  (≥ 1 Proprietor, ≥ 2 Partners for Partnership / LLP, ≥ 2 Directors
  for Pvt Ltd / Public Sector, ≥ 2 Members for AOP / Co-operative
  Society) *(SRS)*.
- **FR23:** Applicants applying for Ordinary or Associate Membership
  can select a Proposer and a Seconder from a dropdown restricted to
  currently-approved Ordinary Members *(SRS)*.
- **FR24:** The System prevents the same Ordinary Member from being
  selected as both Proposer and Seconder on a single application
  *(SRS)*.
- **FR25:** Applicants can download the Proposer / Seconder
  Recommendation Form template and upload the signed copy *(SRS)*.
- **FR26:** Applicants can download the Code of Conduct template and
  upload the signed and stamped copy *(SRS)*.
- **FR27:** Applicants can download the Self Declaration template and
  upload the signed copy on firm letterhead *(SRS)*.
- **FR28:** Applicants can optionally add and upload Additional
  Documents with a free-text Document Name *(SRS)*.
- **FR29:** Applicants can review all entered information in a
  read-only summary, accept the declaration checkbox, and submit the
  application *(SRS)*.
- **FR30:** The System locks the application against further applicant
  editing once submitted *(SRS)*.
- **FR31:** Applicants can view the live status of their submitted
  application at any time.

### External Verification (GST / PAN)

- **FR32:** Applicants can submit GST and PAN numbers for the firm
  (and PAN for each Proprietor / Partner / Director / Member), which
  the System validates against external verification providers *(SRS)*.
- **FR33:** The System displays the verification status (Verified /
  Failed / Pending) for GST and PAN inline within the wizard and on
  the staff review screen.
- **FR34:** The System queues verification requests for retry on
  external-provider outage and allows application submission with a
  "verification pending" status.
- **FR35:** Scrutinisers can manually re-trigger GST or PAN
  verification on an application.

### Payment & Fee Collection

- **FR36:** Applicants can view the fee structure (Entrance Fee +
  Annual Subscription / Project Subscription + GST 18 %) for the
  selected Membership Type before paying *(SRS)*.
- **FR37:** Applicants can pay membership fees online via an
  integrated payment gateway supporting cards, UPI, and netbanking.
- **FR38:** The System reconciles online payments to the application
  via signed, idempotent gateway callbacks.
- **FR39:** Payment Officers can record an offline payment (cash /
  cheque / NEFT / DD) against an applicant's pending fees, with
  mandatory mode, reference number, amount, and an optional
  receipt-scan upload.
- **FR40:** The System enforces uniqueness on receipt / reference
  numbers within the offline payment ledger.
- **FR41:** The System sends a payment receipt email to the applicant
  on successful online or offline payment posting.
- **FR42:** Payment Officers can mark an offline payment entry as
  Reversed (e.g., bounced cheque) with a mandatory reason; the System
  reverts the linked application's payment status accordingly and
  notifies the applicant.
- **FR43:** The System gates final approval (Secretary stage) on
  payment status being Reconciled.
- **FR44:** The System generates a GST-compliant tax invoice for each
  successful fee payment, carrying CREDAI Pune's GSTIN, the
  applicant's GSTIN, taxable value, GST split, and HSN/SAC code.

### Multi-Stage Approval Workflow

- **FR45:** Scrutinisers can view a per-role inbox of applications at
  the Scrutiniser stage with filters by status, Membership Type, Firm
  Type, date, and applicant name.
- **FR46:** Scrutinisers can review an application's full data, all
  uploaded documents inline, GST / PAN verification status, and
  payment status from a single review screen.
- **FR47:** Scrutinisers can edit applicant-entered data on an
  application, with every edit captured in the audit trail (before /
  after values + reason). No other CREDAI-side role can edit
  applicant data.
- **FR48:** Scrutinisers can Approve an application, which advances it
  to the Convenor stage.
- **FR49:** Scrutinisers can Raise Objection on an application with a
  mandatory reason, which returns the application to the applicant for
  fix and resubmission.
- **FR50:** Scrutinisers can Reject an application with a mandatory
  reason, which terminates the application; the System notifies the
  applicant and the application becomes immutable.
- **FR51:** Convenors, Directors General, and Secretaries can view
  per-role inboxes of applications at their respective stages.
- **FR52:** Convenors, Directors General, and Secretaries can Approve
  an application, which advances it to the next stage (or, at
  Secretary, finalizes approval).
- **FR53:** Convenors, Directors General, and Secretaries can Raise
  Objection on an application with a mandatory reason, which returns
  the application to the Scrutiniser stage with the objection note.
  The applicant is not directly notified.
- **FR54:** Convenors, Directors General, and Secretaries can Reject
  an application with a mandatory reason, which terminates the
  application; the System notifies the applicant (with reason) and
  the Scrutiniser (for record), and the application becomes immutable.
- **FR55:** When a Scrutiniser re-approves an application that was
  bounced back via Raise Objection from any upper stage, the System
  restarts the approval chain from the Convenor stage.
- **FR56:** The System maintains and displays an audit timeline on
  every application showing all approvals, edits, raise-objection
  events, rejection events, and resolution notes in chronological
  order, visible to all CREDAI-side roles handling that application.
- **FR57:** The System auto-revalidates GST and PAN when a Scrutiniser
  edits the corresponding number on an application.
- **FR58:** The System surfaces SLA-aging information (e.g.,
  applications older than configurable thresholds) on per-role
  inboxes / dashboards.
- **FR59:** When an application is bounced back to the applicant via
  Raise Objection, the System sends a configurable reminder if the
  applicant has not responded within a grace period.

### Membership Certificate & Public Verification

- **FR60:** The System automatically generates a PDF membership
  certificate when an application reaches Secretary-Approved status.
- **FR61:** The certificate includes Membership Number, Firm Name,
  Membership Type, Firm Type, Issue Date, Valid Until Date, the active
  President's name and uploaded signature image, CREDAI Pune branding,
  and a QR code linking to the public verification endpoint.
- **FR62:** The System assigns each certificate a Membership Number
  (default format `CPN/{ORD|ASC|RERA}/{YYYY}/{seq}`, configurable to
  client convention).
- **FR63:** The System cryptographically signs each issued PDF using
  a portal-held document-signing certificate, providing tamper-
  evidence visible in standard PDF readers.
- **FR64:** The System embeds the President's name and signature into
  each certificate as they were at the moment of issue, and never
  re-renders the certificate from live President data.
- **FR65:** Members can download their current and historical
  certificates at any time from the portal.
- **FR66:** On membership renewal approval, the System issues a fresh
  certificate with updated Issue Date and Valid Until Date, marks the
  prior certificate as Superseded, retains the prior certificate in
  the document vault, and reuses the same Membership Number.
- **FR67:** Secretaries can revoke a membership; the System marks the
  certificate as Revoked and surfaces this on the public verification
  endpoint.
- **FR68:** Public visitors can submit a Membership Number (or scan a
  certificate QR code) on an unauthenticated, rate-limited verification
  page, and the System returns Firm Name, Membership Type, Valid Until
  Date, and Status (Active / Lapsed / Revoked / Superseded). No PII is
  exposed.
- **FR69:** The System rate-limits public verification lookups per
  source IP and presents a captcha for repeated lookups.

### Member Lifecycle & Renewal

- **FR70:** Approved applicants automatically become Members with
  status Active; their firm is added to the Member Directory.
- **FR71:** Approved Ordinary Members appear in the Proposer / Seconder
  dropdown for subsequent applications.
- **FR72:** Members can log in to the portal, view their membership
  status, view their issued certificates, and view their stored
  documents in the vault.
- **FR73:** Members can initiate an annual renewal application from
  the portal.
- **FR74:** The renewal flow pre-fills the renewal application from
  the member's prior application data and vaulted documents.
- **FR75:** Members can update changed information (e.g., new
  completed projects, refreshed identity documents) within the renewal
  flow.
- **FR76:** Renewals with no material changes can be auto-processed by
  the System; renewals with material changes are routed to the
  multi-stage approval workflow.
- **FR77:** The System sends automated renewal reminders to Members at
  T-30 days and T-15 days before membership expiry.
- **FR78:** The System transitions a Member's status to Renewal Due at
  expiry if renewal is not completed, and to Lapsed after a configurable
  grace period.
- **FR79:** Members in Lapsed status retain read-only access to view
  their historical documents and certificates from the vault.

### Document Management & Vault

- **FR80:** Applicants and Members can upload documents in supported
  file formats and within configured size limits, with the System
  enforcing format and size validation at upload time *(SRS)*.
- **FR81:** Applicants can view, replace, and remove uploaded
  documents within the wizard prior to submission; uploaded files
  display name, view action, and remove action *(SRS)*.
- **FR82:** The System retains every uploaded document in the
  Member's document vault, versioned by upload date, with prior
  versions marked Superseded.
- **FR83:** Authorized CREDAI-side roles can view any Member's vault
  contents inline within review screens, subject to RBAC.
- **FR84:** The System retains documents per the configured retention
  policy (default 7 years post-membership-end; 3 years for rejected
  applications; longer for legal-hold cases).

### Staff Dashboards & Analytics

- **FR85:** Scrutinisers, Convenors, Directors General, and Secretaries
  can view an Operational Dashboard showing live application counts by
  status, aging buckets, and rejection-reason breakdowns.
- **FR86:** Authorized CREDAI-side roles can view a Member Dashboard
  showing active members by Membership Type, renewals due in next
  30 / 60 / 90 days, and lapsed members.
- **FR87:** Payment Officers and authorized CREDAI-side roles can
  view a Payment Dashboard showing fees collected by period (online
  vs offline split), pending fees, and reconciliation status.
- **FR88:** Authorized CREDAI-side roles can view KPI rollups
  including applications submitted, approval cycle median + p95, and
  first-time-right rate.
- **FR89:** All staff dashboards support filtering by date range,
  Membership Type, and Firm Type, and exporting visible data to
  CSV / Excel.

### Notifications & Communications

- **FR90:** The System sends email notifications for key events:
  OTP, submission acknowledgement, status updates (Approved /
  Rejected / Raise-Objection / Clarification-Requested), payment
  receipt, renewal reminders (T-30, T-15), renewal confirmation,
  certificate issuance, and certificate revocation.
- **FR91:** The System logs notification send-success and -failure for
  audit purposes.

### User, Role & President Management

- **FR92:** System Admins can invite a new staff user by email,
  assign one of the six CREDAI-side roles (Scrutiniser, Convenor,
  Director General, Secretary, System Admin, Payment Officer), and the
  System sends a one-time setup link.
- **FR93:** System Admins can disable, re-enable, and remove staff
  users, and rotate / reset their credentials.
- **FR94:** System Admins can manage master-data lookups (e.g.,
  district codes, location codes within Pune jurisdiction).
- **FR95:** System Admins can create and maintain the President record
  (Name, Designation Label, Signature image, Tenure From / To dates,
  Active flag).
- **FR96:** The System enforces that exactly one President record is
  in Active status at any moment.
- **FR97:** Replacing the active President takes effect on certificates
  issued after the change; previously-issued certificates retain the
  President's name and signature as they were at issue time.

### Audit & Compliance

- **FR98:** The System maintains an immutable audit log of every state
  change, every staff action (approve / reject / raise objection /
  edit), every document access by staff, every certificate issuance
  and revocation, and every Aadhaar-field read.
- **FR99:** System Admins can view the audit log filtered by user,
  action type, application, member, and date range.
- **FR100:** The System captures and stores explicit, timestamped
  consent at signup for personal data processing, external
  verification, vault storage, and communications, per the DPDP Act.
- **FR101:** Members can request access to all personal data the
  System holds about them, request correction of inaccuracies, and
  (subject to retention obligations) request erasure.
- **FR102:** The System masks Aadhaar numbers in all UI surfaces by
  default (showing only the last 4 digits); full reveal is available
  only to the holder via explicit reveal action.

## Non-Functional Requirements

These NFRs specify *how well* the system must perform; they complement
the Functional Requirements (which specify *what* the system does). NFRs
are numbered for traceability. Targets that already appear in Success
Criteria, Domain-Specific Requirements, or Web Application Specific
Requirements are restated here to make the catalog the canonical
reference.

### Performance

- **NFR1:** Initial page load (cold cache) ≤ 3 s on 4G mobile and ≤ 1.5 s
  on broadband desktop, p95.
- **NFR2:** Subsequent SPA route navigation (warm) ≤ 500 ms p95.
- **NFR3:** Page-to-page navigation within the application wizard,
  including conditional field/upload reveals on Membership-Type and
  Firm-Type changes, ≤ 2 s p95.
- **NFR4:** Core Web Vitals on the applicant wizard meet Google's "Good"
  thresholds at p75 mobile: FCP ≤ 1.8 s, LCP ≤ 2.5 s, CLS ≤ 0.1,
  INP ≤ 200 ms.
- **NFR5:** Initial JavaScript bundle ≤ 250 KB gzipped; route-split
  additional chunks ≤ 100 KB each gzipped.
- **NFR6:** OTP email delivery latency ≤ 30 s for 95 % of OTP requests.
- **NFR7:** Document upload throughput supports the configured maximum
  file size with ≤ 10 s upload completion on a 4 Mbps uplink.
- **NFR8:** Audit document retrieval (vault search → display) completes
  in < 1 minute end-to-end for any single member.
- **NFR9:** Public certificate verification endpoint responds in
  ≤ 1 s p95 (cached lookups), ≤ 3 s p95 (cold).

### Availability & Reliability

- **NFR10:** Applicant-facing portal availability ≥ 99.5 % monthly
  uptime, measured by external synthetic checks.
- **NFR11:** CREDAI staff portal availability ≥ 99.5 % monthly uptime
  during business hours (Mon–Sat, 09:00–20:00 IST), and ≥ 99.0 %
  outside business hours.
- **NFR12:** Recovery Time Objective (RTO) ≤ 24 hours; Recovery Point
  Objective (RPO) ≤ 1 hour, for application data and document vault.
- **NFR13:** Daily encrypted backups with point-in-time recovery
  available for at least 35 days.
- **NFR14:** External verification service outages (GST, PAN) and
  payment-gateway outages do not block applicant submissions; the
  System queues and retries with explicit "verification pending" /
  "payment pending" status.
- **NFR15:** Document upload reliability ≥ 99 % of upload attempts
  succeed for files within configured size / format limits; failed
  uploads provide clear retry guidance.
- **NFR16:** Renewal reminder dispatch (T-30 and T-15 emails) succeeds
  for ≥ 99 % of eligible members; send failures are logged and
  escalated to staff for manual outreach if both reminders fail.
- **NFR17:** Online payment-gateway callback processing is idempotent
  and signature-verified; no double-credit or double-charge under
  webhook retry, replay, or out-of-order delivery.

### Security

- **NFR18:** All network traffic over TLS 1.2 or higher; HSTS enforced;
  no mixed content.
- **NFR19:** All PII (Aadhaar, PAN, signed documents, photos, signatures)
  encrypted at rest using industry-standard algorithms (e.g., AES-256).
- **NFR20:** Aadhaar numbers encrypted with a separate envelope-key
  distinct from the rest of PII (defense in depth).
- **NFR21:** Aadhaar numbers masked by default in every UI surface
  (showing only the last 4 digits); full reveal available only to the
  holder via explicit reveal action; every staff read of an Aadhaar
  field is captured in the audit log.
- **NFR22:** Secrets (third-party API keys, gateway credentials,
  signing-certificate private key) stored in a secrets manager, never
  in source control, never in environment dumps, never in logs.
- **NFR23:** No PII appears in URL parameters, browser history entries,
  application logs, or error messages.
- **NFR24:** TOTP-based multi-factor authentication mandatory for all
  six CREDAI-side roles; applicants and members authenticate via
  email + OTP per FR1.
- **NFR25:** Payment card data is never stored on the portal; all card
  / UPI / netbanking flows are handled by an RBI-authorized payment
  aggregator with PCI-DSS scope reduction by tokenization.
- **NFR26:** Authenticated session timeout ≤ 30 minutes of inactivity
  for staff sessions; absolute session lifetime ≤ 8 hours; configurable.
- **NFR27:** Role-based access enforced server-side on every API
  endpoint; client-side hiding is augmentation only, never the sole
  control.
- **NFR28:** Common web-application vulnerabilities (OWASP Top 10) are
  mitigated by design (input validation, output encoding, CSRF tokens,
  CSP headers, parameterized queries, etc.).
- **NFR29:** Pre-launch and annual third-party VAPT (Vulnerability
  Assessment and Penetration Testing) with critical and high findings
  remediated before each release that touches PII paths.
- **NFR30:** Public certificate-verification endpoint rate-limited to
  prevent enumeration / scraping (e.g., per-IP token bucket); captcha
  required after configurable repeated lookups.
- **NFR31:** Brute-force protection on staff login (account lockout
  after configurable failed attempts; exponential backoff on OTP
  resend abuse).

### Privacy & Compliance

- **NFR32:** System operates in compliance with the Digital Personal
  Data Protection Act 2023 (India), with CREDAI Pune as the Data
  Fiduciary and the system vendor as the Data Processor.
- **NFR33:** Explicit, purpose-bound, timestamped consent captured at
  signup and at submission, covering: application processing, external
  verification (GST/PAN), document-vault storage, and communications.
  Consent records are immutable.
- **NFR34:** Data subject rights handled per DPDP Act: access (members
  can view all data the System holds about them), correction (members
  can update or replace their data), erasure (subject to retention
  obligations).
- **NFR35:** Data retention enforced by automated lifecycle jobs:
  - Active member data and documents: duration of membership + 7 years
  - Rejected applications: 3 years from rejection
  - Audit log: 7 years (immutable)
  - Payment records: 8 years (Income Tax / GST audit window)
  *(Subject to client confirmation.)*
- **NFR36:** Data residency: all PII and document-vault data stored on
  infrastructure physically located in India.
- **NFR37:** Personal data of natural persons is never shared with
  third parties beyond the disclosed external verification (GST, PAN)
  and payment processing services, without separate consent.
- **NFR38:** Aadhaar handling complies with UIDAI Aadhaar Act 2016 and
  UIDAI regulations: no use of Aadhaar for authentication; no
  biometric capture; no eKYC integration; storage encrypted; display
  masked.
- **NFR39:** Issued GST tax invoices comply with CGST/SGST Act format
  requirements (supplier GSTIN, recipient GSTIN, taxable value, tax
  split, HSN/SAC code, invoice number, date).
- **NFR40:** Breach notification procedure is documented; security
  incidents involving personal data are reportable to the Data
  Protection Board within statutorily mandated timelines.

### Accessibility

- **NFR41:** WCAG 2.1 Level AA conformance for all applicant wizard
  screens and CREDAI staff screens; tested by automated tools (axe /
  Lighthouse) in CI on every release.
- **NFR42:** Keyboard-only completion of the entire 12-step applicant
  wizard is verifiable end-to-end (no mouse required).
- **NFR43:** All interactive elements are screen-reader-accessible
  (semantic HTML, labeled controls, aria-describedby for inline
  errors); manually verified with NVDA (Windows) and VoiceOver (macOS
  / iOS) before each release that touches wizard or staff review
  screens.
- **NFR44:** Color contrast ≥ 4.5 : 1 for normal text, ≥ 3 : 1 for
  large text and graphic UI components.
- **NFR45:** Status indicators (verification pass/fail, payment pills,
  application status) do not rely on color alone — pair with text
  labels and iconography.
- **NFR46:** Text resizable to 200 % without loss of content or
  function.
- **NFR47:** Focus management on wizard step navigation moves to the
  new step's first heading; on validation error, focus moves to the
  first invalid field; an error summary at the top of each step is
  announced via `role="alert"`.

### Scalability

- **NFR48:** System sized for projected CREDAI Pune membership volume
  (current Pune-chapter member base + expected 5-year growth + annual
  renewals + new-application volume); peak concurrent applicant
  sessions sustainable without performance degradation. *Specific
  numeric targets pending client baseline data; default planning
  assumption: ≤ 200 concurrent applicant sessions, ≤ 50 concurrent
  staff sessions.*
- **NFR49:** Renewal-season traffic spikes (e.g., the month preceding
  the bulk membership-expiry date) absorbed without breaching
  performance NFRs (NFR1–NFR9); horizontal scaling capacity is part of
  the architecture.
- **NFR50:** Document vault scales to retain 5+ years of CREDAI Pune
  membership documents (estimated 50–100 documents per active member
  including history) without retrieval-time degradation beyond NFR8.

### Integration & Interoperability

- **NFR51:** GST verification API integration handles provider SLAs;
  failed calls are retried per a documented backoff schedule;
  applicant submissions are not blocked by transient provider failures
  (per NFR14).
- **NFR52:** PAN verification API integration handles provider SLAs
  with the same retry / non-blocking behavior as GST.
- **NFR53:** Online payment gateway integration uses signed,
  idempotent callbacks; gateway provider is replaceable without
  redesigning the payment ledger schema.
- **NFR54:** Email delivery service is replaceable (SES / SendGrid /
  SMTP relay) without code changes beyond configuration.
- **NFR55:** External integrations are abstracted behind internal
  service interfaces, so a future SMS / WhatsApp gateway (Phase 2),
  MahaRERA portal verifier (Phase 2), or ERP/accounting system
  (Phase 2) can be added without disrupting existing FRs.

### Observability & Operability

- **NFR56:** Structured application logs capture every request with
  trace ID, user ID (or "anonymous"), action, outcome, and timing.
  Logs contain no PII (no Aadhaar, no PAN, no document content, no
  payment details).
- **NFR57:** Distributed tracing captures the wizard → submit →
  verification → workflow → notification chain for end-to-end
  diagnosis.
- **NFR58:** Real-User Monitoring (RUM) reports Core Web Vitals
  (NFR4) per page in production.
- **NFR59:** Synthetic uptime monitoring covers the applicant portal,
  staff portal, and public verification endpoint (per NFR10–NFR11).
- **NFR60:** Alerts route to on-call channel for: availability drops
  below NFR targets, p95 latency exceeds NFR targets, error rate
  > 1 % over a 5-minute window, external verification or payment
  gateway error rate > 5 %, document vault read latency > NFR8.
- **NFR61:** Runbooks documented for: external provider outage,
  payment gateway outage, signing-certificate rotation, President-record
  update, data-subject access / erasure request handling, breach
  notification.

### Auditability

- **NFR62:** Audit log is append-only and tamper-evident; entries
  cannot be modified or deleted by any user role, including System
  Admin (System Admin can read but not write/edit/delete audit
  entries).
- **NFR63:** Audit log captures: every state change on every
  application; every staff action (Approve / Reject / Raise Objection
  / Edit) with actor, timestamp, target, and reason; every document
  access by staff; every certificate issuance, supersession, revocation;
  every Aadhaar-field read; every offline payment entry and reversal;
  every President record change; every login (success and failure).
- **NFR64:** Audit log is searchable by System Admin per FR99 and
  exportable for external audit on demand.
- **NFR65:** Issued PDF certificates are tamper-evident via the
  portal-applied document-signing certificate (per FR63); standard
  PDF readers display "Signed by CREDAI Pune Membership Portal" with
  a valid signature checkmark, and any change to the PDF invalidates
  the signature.
