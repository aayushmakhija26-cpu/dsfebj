# Feature Specification: CREDAI Pune Digital Member Portal

**Feature Branch**: `001-credai-member-portal`
**Created**: 2026-04-28
**Status**: Draft
**Input**: PRD — `_bmad-output/planning-artifacts/prd.md`

---

## Clarifications

### Session 2026-04-28

- Q: What categories of renewal changes trigger the manual approval workflow (vs auto-approval)? → A: Changes to firm structure (directors/partners/members/firm type) or identity/KYC documents.
- Q: What are the expected data scale and peak concurrency assumptions? → A: 500–1000 total active members; 20–50 peak concurrent users.
- Q: What file formats and maximum size per upload should the portal enforce? → A: PDF, JPEG, PNG only; 10 MB per file.
- Q: What is the default grace period between membership expiry (Renewal Due) and automatic transition to Lapsed? → A: 60 days.
- Q: What is the target API response time for user-facing operations? → A: Under 3 seconds for 95% of user-facing requests.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — New Member Application: Ordinary Membership (Priority: P1)

A prospective real-estate developer firm registers, completes the multi-step membership wizard for Ordinary Membership, uploads all required documents, verifies GST and PAN, nominates a Proposer and Seconder from approved members, pays the entrance and subscription fee (online or in-person), and receives a submission acknowledgement. CREDAI Pune staff review and approve through the 4-stage workflow, and the firm receives an active membership certificate.

**Why this priority**: This is the primary end-to-end value delivery. Every other journey depends on at least one Ordinary Member existing in the system.

**Independent Test**: A test applicant firm can sign up, complete all wizard steps for Partnership firm type under Ordinary Membership, submit, pay online, and receive a confirmation email — end-to-end in a staging environment with no manual intervention beyond the approval workflow.

**Acceptance Scenarios**:

1. **Given** a new applicant registers with their firm email, **When** they complete OTP verification, **Then** they are authenticated and can start an application.
2. **Given** an applicant selects Ordinary Membership and Partnership firm type, **When** they advance through the wizard, **Then** only the fields and document uploads relevant to Partnership firms are shown; other firm-type-specific fields are hidden.
3. **Given** an applicant enters a GSTIN, **When** they submit the step, **Then** the portal validates it against the GST authority and shows Verified / Failed / Pending inline.
4. **Given** an applicant selects a Proposer from the dropdown, **When** they try to select the same member as Seconder, **Then** the system prevents the selection and shows an explanatory error.
5. **Given** an applicant has not met the minimum 2-partners rule for a Partnership firm, **When** they try to advance past the firm-details step, **Then** the wizard blocks progression with an inline validation message.
6. **Given** an applicant submits the application, **When** submission is confirmed, **Then** the application is locked against further editing and a confirmation email is sent within 5 minutes.
7. **Given** the online payment gateway is unavailable, **When** an applicant attempts payment, **Then** the system retries idempotently and never charges twice; a clear failure message and retry option are shown.

---

### User Story 2 — Staff Review: 4-Stage Approval Workflow (Priority: P1)

A Scrutiniser reviews a submitted application — inspecting all applicant data, uploaded documents, and GST/PAN verification status from a single screen — then either approves (advancing to the Convenor), raises an objection (returning to applicant for fixes), or rejects (terminating the application). Upper-stage roles (Convenor, Director General, Secretary) follow the same Approve / Raise Objection / Reject pattern; any Raise Objection from an upper stage routes back to the Scrutiniser rather than the applicant; Secretary's Approve triggers certificate issuance and active-member status.

**Why this priority**: No application can be approved or certificate issued without this workflow completing successfully. It is the operational core of the system for CREDAI Pune staff.

**Independent Test**: Using test accounts for each of the four roles, an application can be processed from Submitted to Approved through all four stages; a Raise Objection from the Director General correctly returns the application to the Scrutiniser, and the Scrutiniser's re-approval restarts the chain from the Convenor.

**Acceptance Scenarios**:

1. **Given** an application is submitted, **When** a Scrutiniser opens their inbox, **Then** the application appears with sortable columns (status, membership type, firm type, submitted date, applicant name) and filter controls.
2. **Given** a Scrutiniser opens an application, **When** they view the review screen, **Then** all applicant data, uploaded documents (viewable inline), GST/PAN verification pills, and payment status are visible on one screen.
3. **Given** a Scrutiniser edits an applicant's GSTIN on the review screen, **When** the edit is saved, **Then** the system automatically re-triggers GST verification and logs the before/after change with a timestamp and the Scrutiniser's identity.
4. **Given** a Director General raises an objection, **When** the Scrutiniser next opens their inbox, **Then** the application appears with the Director General's objection note prominently displayed; the Scrutiniser can edit data or bounce to the applicant.
5. **Given** a Scrutiniser re-approves a bounced application, **When** the application re-enters the workflow, **Then** it restarts from the Convenor stage (not the Director General where it was bounced).
6. **Given** any role rejects an application, **When** the rejection is confirmed, **Then** the applicant receives an email with the rejection reason and the application becomes immutable; the applicant must start a fresh application.
7. **Given** the Secretary approves an application, **When** approval is recorded, **Then** a PDF membership certificate is automatically generated, the applicant receives an approval and certificate-issuance email, and the firm appears in the member directory.

---

### User Story 3 — Annual Renewal (Priority: P2)

An existing Active Member receives an automated reminder 30 days before expiry, logs in, reviews a pre-filled renewal form (populated from their prior application and document vault), updates any changed information, submits, and pays the annual subscription. The system auto-approves renewals with no material changes or routes renewals with material changes through the approval workflow; a new certificate is issued on approval.

**Why this priority**: Renewals are the primary recurring interaction for existing members; failure here means the portal cannot replace the paper-based annual renewal process.

**Independent Test**: An existing test member account receives the T-30 reminder email, follows the link to the renewal screen, confirms all fields as unchanged in one step per section, submits, and receives a renewed-membership confirmation and new certificate — completing in under 10 minutes.

**Acceptance Scenarios**:

1. **Given** a member's expiry date is 30 days away, **When** the daily reminder job runs, **Then** the system sends a renewal-reminder email to the member's registered address; a second reminder is sent at T-15 days.
2. **Given** a member opens the renewal flow, **When** the renewal screen loads, **Then** all fields are pre-filled from the prior application and the document vault; the member can confirm unchanged fields with a single action per section.
3. **Given** a member updates a document in the renewal flow (e.g., a refreshed GST certificate), **When** they upload the new version, **Then** the vault retains the prior version marked Superseded and stores the new version as Current.
4. **Given** a member submits a renewal with no material changes, **When** the renewal is processed, **Then** it is auto-approved without manual review; the member's expiry extends by one year and a new certificate is issued.
5. **Given** a member ignores both the T-30 and T-15 reminders, **When** the membership expiry date passes, **Then** the status transitions to Renewal Due; after the configured grace period elapses, it transitions to Lapsed; the member retains read-only access to their vault.

---

### User Story 4 — Offline Payment Recording by Payment Officer (Priority: P2)

A Payment Officer records a cash, cheque, NEFT, or DD payment received in person, linking it to the applicant's pending fees. The ledger updates immediately, a receipt email is sent to the applicant, and the application's payment status turns Reconciled.

**Why this priority**: A meaningful share of CREDAI Pune applicants prefer in-person payment. Without this, the system cannot replace the paper process for those applicants.

**Independent Test**: Using a test Payment Officer account, a cheque payment is recorded for a test application; the payment dashboard updates; the applicant's review screen shows payment as Reconciled; entering the same cheque number a second time is blocked with a duplicate-reference error.

**Acceptance Scenarios**:

1. **Given** a Payment Officer records a cheque payment with the cheque number, bank, date, and amount, **When** they save the entry, **Then** the application's payment status becomes Reconciled and the applicant receives a receipt email.
2. **Given** a Payment Officer attempts to record a payment using a cheque number already in the ledger, **When** they try to save, **Then** the system rejects the entry with a duplicate-reference error.
3. **Given** a cheque is later returned by the bank, **When** the Payment Officer marks the entry as Reversed with a reason, **Then** the application's payment status reverts to Unpaid and the applicant receives a notification.
4. **Given** the Payment Officer opens the Payment Dashboard, **When** they view the current period, **Then** they see total collected (split by online vs offline), pending fees, and any reconciliation mismatches.

---

### User Story 5 — Membership Certificate Issuance & Public Verification (Priority: P2)

When a membership application is approved, the system automatically generates a tamper-evident PDF certificate embedding the President's name and signature image as they are at the moment of issue. The certificate carries a QR code. Members can download it. Any third party (home buyer, bank, regulator) can scan the QR code or enter the Membership Number on a public verification page to confirm the membership is genuine.

**Why this priority**: The certificate is the primary deliverable that applicants are seeking. Public verifiability gives it legal and commercial credibility.

**Independent Test**: After a test application is approved, a PDF certificate is present in the member's vault with the correct data and a valid server-side digital signature; scanning the QR code on the certificate opens the public verification page and returns the correct firm name, membership type, validity date, and status without exposing any PII.

**Acceptance Scenarios**:

1. **Given** a Secretary approves an application, **When** the approval is recorded, **Then** a PDF certificate is generated and stored in the member's vault within 2 minutes.
2. **Given** a certificate is generated, **When** it is opened in a standard PDF reader, **Then** the reader displays "Signed by CREDAI Pune Membership Portal" with a valid signature; any subsequent tampering invalidates the signature.
3. **Given** a President record changes after a certificate is issued, **When** the prior certificate is viewed, **Then** it still shows the President's name and signature as they were at the original issue date.
4. **Given** a third party visits the public verification page and enters a valid Membership Number, **When** the lookup completes, **Then** the page returns Firm Name, Membership Type, Valid Until Date, and Status — and no other information.
5. **Given** a single IP address submits more than the configured number of lookups, **When** another lookup is attempted, **Then** the system presents a captcha challenge before responding.

---

### User Story 6 — System Admin: User Management & President Record (Priority: P3)

The System Admin onboards new CREDAI staff by sending email invitations with role assignments, manages account lifecycle (disable, re-enable, remove), and maintains the President record — ensuring exactly one active President is recorded at any time with an uploaded signature image, so that certificates issued during that President's tenure bear the correct name and signature.

**Why this priority**: Required before any staff workflow can function, but typically a one-time setup activity; lower urgency once the initial configuration is complete.

**Independent Test**: A new Scrutiniser receives an invitation email, follows the one-time link, sets up their account with TOTP-based MFA, and can log in to their (initially empty) inbox; the System Admin can disable the account and the former Scrutiniser can no longer authenticate.

**Acceptance Scenarios**:

1. **Given** the System Admin invites a new staff user by email with a role assignment, **When** the invitation is sent, **Then** the user receives an email with a one-time setup link; after completing setup the user can log in with MFA.
2. **Given** the System Admin disables a staff account, **When** the disabled user attempts to log in, **Then** authentication fails and a clear account-disabled message is shown.
3. **Given** the System Admin creates a new President record and marks it Active, **When** a prior President record still exists, **Then** the system either prevents the action or automatically marks the prior record Inactive — only one Active President record exists at any moment.
4. **Given** a new President record is activated mid-month, **When** certificates are issued after that date, **Then** they bear the new President's name and signature; certificates issued before that date remain unchanged.

---

### Edge Cases

- What happens when the GST or PAN verification service is unavailable at submission time? → The application is accepted with status "verification pending"; staff are informed on the review screen and can manually re-trigger verification.
- What happens when a member's renewal reminder emails fail to deliver? → Both failures are logged; if both T-30 and T-15 reminders fail, the system escalates to staff for manual outreach.
- What happens when a payment gateway callback arrives multiple times (webhook replay)? → The callback is idempotent; duplicate signals are detected by a unique payment ID and ignored without creating a second credit.
- What happens when an applicant selects Associate Membership but no approved Ordinary Members exist yet? → The Associate Membership option is disabled or the Ordinary-Member dropdown shows empty with explanatory text; the applicant cannot proceed until an eligible Ordinary Member is in the directory.
- What happens when a Scrutiniser bounces an application back to the applicant and the applicant does not respond within the grace period? → The system sends an automated reminder to the applicant; if still unresolved, the Scrutiniser's dashboard shows an SLA-aging alert.
- What happens when a member applies for a second membership type (e.g., RERA Project) after already holding an Ordinary Membership? → The system permits this; each membership type has its own independent application, fee, and certificate lifecycle.
- What happens when the PDF certificate generation fails after Secretary approval? → The approval state is recorded; certificate generation is retried asynchronously; the member is notified once the certificate is available rather than leaving them with a broken download link.

---

## Requirements *(mandatory)*

### Functional Requirements

**Authentication & Identity**

- **FR-001**: Members and applicants MUST be able to sign up and log in using their email address verified by a one-time password (OTP).
- **FR-002**: OTPs MUST expire after 2 minutes; applicants MUST be able to request a new OTP at any time without restriction.
- **FR-003**: Applicants MUST be able to correct their email address before OTP verification is complete.
- **FR-004**: CREDAI staff (all six roles) MUST authenticate with email, password, and a time-based multi-factor code; MFA is mandatory and cannot be bypassed.
- **FR-005**: Staff sessions MUST time out after a configurable period of inactivity.

**Membership Application Wizard**

- **FR-006**: Applicants MUST be able to start a new application and select from Ordinary, Associate, or RERA Project Membership types, subject to eligibility rules.
- **FR-007**: First-time applicants MUST be restricted to Ordinary Membership; Associate Membership requires an existing approved Ordinary Membership held by the same firm.
- **FR-008**: The wizard MUST dynamically show only the fields, document uploads, and steps that apply to the chosen Membership Type and Firm Type combination; irrelevant fields and steps MUST NOT appear.
- **FR-009**: Applicants MUST be able to save an in-progress application as a draft and resume from the same point on a later session.
- **FR-010**: The wizard MUST display a visible progress indicator showing the current step out of the total.
- **FR-011**: Applicants MUST be able to navigate forward, backward, and cancel within the wizard.
- **FR-012**: The wizard MUST enforce firm-type-specific minimum entity counts (≥ 1 Proprietor; ≥ 2 Partners for Partnership / LLP; ≥ 2 Directors for Pvt Ltd / Public Sector; ≥ 2 Members for AOP / Co-operative Society) before allowing progression.
- **FR-013**: Applicants applying for Associate Membership MUST select an existing approved Ordinary Member firm from a system-maintained dropdown; the same member cannot be both Proposer and Seconder on a single application.
- **FR-014**: Applicants MUST be able to download, sign, and upload the Proposer/Seconder Recommendation Form, the Code of Conduct, and the Self Declaration templates; these uploads are mandatory for Ordinary and Associate Membership.
- **FR-015**: Applicants MUST be able to view, replace, and remove any uploaded document before final submission.
- **FR-016**: Applicants MUST be able to add multiple Completed Projects (Ordinary Membership) and Commencement Projects (Ordinary and Associate Membership), each with a corresponding certificate upload.
- **FR-017**: Applicants MUST review a complete, read-only summary of all entered data, accept a declaration checkbox, and then submit; submission MUST lock the application against further applicant edits.
- **FR-018**: Applicants MUST be able to view the current status of their submitted application at any time after login.

**External Verification**

- **FR-019**: The system MUST validate GSTIN and PAN numbers (firm and individual) against government-authorized verification services and display the result (Verified / Failed / Pending) inline.
- **FR-020**: External verification failures or service outages MUST NOT block application submission; the application proceeds with "verification pending" status and staff are informed.
- **FR-021**: Scrutinisers MUST be able to manually re-trigger GST or PAN verification on any application under their review.

**Payment & Fee Collection**

- **FR-022**: Applicants MUST be shown the full fee breakdown (Entrance Fee + Annual or Project Subscription + GST at 18%) for their chosen Membership Type before payment.
- **FR-023**: Applicants MUST be able to pay fees online via a payment gateway supporting cards, UPI, and net banking; gateway callbacks MUST be processed idempotently.
- **FR-024**: Payment Officers MUST be able to record offline payments (cash / cheque / NEFT / DD) against a pending application, capturing payment mode, reference number, amount, and an optional receipt image; reference numbers MUST be unique within the ledger.
- **FR-025**: The system MUST send a payment receipt email to the applicant on any successful payment posting (online or offline).
- **FR-026**: Payment Officers MUST be able to reverse an offline payment entry (e.g., bounced cheque) with a mandatory reason; the reversal MUST revert the application's payment status and notify the applicant.
- **FR-027**: Final approval at the Secretary stage MUST be gated on the application's payment status being Reconciled.
- **FR-028**: The system MUST generate a GST-compliant tax invoice for each fee payment, carrying CREDAI Pune's GSTIN, the applicant's GSTIN, taxable value, and the applicable GST breakdown.

**Multi-Stage Approval Workflow**

- **FR-029**: Submitted applications MUST pass through four sequential review stages: Scrutiniser → Convenor → Director General → Secretary; each stage has a dedicated inbox visible only to the role(s) assigned to it.
- **FR-030**: Each role MUST have exactly three actions on any application in their inbox: Approve (advance), Raise Objection (recoverable, with mandatory reason), and Reject (terminal, with mandatory reason).
- **FR-031**: Raise Objection from the Scrutiniser MUST return the application to the applicant; Raise Objection from any upper stage (Convenor, Director General, Secretary) MUST route the application back to the Scrutiniser, not the applicant.
- **FR-032**: When the Scrutiniser re-approves a bounced application, the approval chain MUST restart from the Convenor stage; the Convenor, Director General, and Secretary each review again.
- **FR-033**: Reject from any stage MUST terminate the application irreversibly; the applicant MUST be notified with the reason; if the rejection is from an upper stage the Scrutiniser MUST also be notified for awareness; no data from a rejected application carries forward.
- **FR-034**: The Scrutiniser MUST be the only role that can edit applicant-entered data; every such edit MUST be captured in the audit timeline with before/after values, a reason, and a timestamp.
- **FR-035**: Editing a GSTIN or PAN number MUST automatically re-trigger the corresponding external verification.
- **FR-036**: Every application MUST display an audit timeline visible to all CREDAI-side roles, showing all approvals, edits, raise-objection events, rejections, and resolution notes in chronological order.
- **FR-037**: Each role's inbox MUST display SLA-aging indicators, flagging applications that have exceeded configurable thresholds without action.
- **FR-038**: When an application is bounced back to the applicant, the system MUST send an automated reminder if the applicant has not responded within a configurable grace period.

**Membership Certificate & Public Verification**

- **FR-039**: The system MUST automatically generate a PDF membership certificate when the Secretary approves an application, without requiring any manual action.
- **FR-040**: Each certificate MUST include the Membership Number, Firm Name, Membership Type, Firm Type, Issue Date, Valid Until Date, CREDAI Pune branding, a QR code linking to the public verification endpoint, and the active President's name and signature image as they were at the moment of issue.
- **FR-041**: Each certificate MUST be assigned a unique Membership Number following the format `CPN/{ORD|ASC|RERA}/{YYYY}/{seq}` (configurable to client convention).
- **FR-042**: The system MUST cryptographically sign each issued PDF with a portal-held document-signing certificate, making any post-issuance tampering detectable in standard PDF readers.
- **FR-043**: The President's name and signature MUST be captured into the certificate at issue time; changing the President record after issuance MUST NOT alter previously issued certificates.
- **FR-044**: Members MUST be able to download their current and historical certificates from the portal at any time.
- **FR-045**: On renewal approval, the system MUST issue a new certificate with updated validity dates, mark the prior certificate as Superseded (retained in the vault), and reuse the same Membership Number.
- **FR-046**: Secretaries MUST be able to revoke a membership; revocation MUST be reflected on the public verification endpoint.
- **FR-047**: The public certificate verification page MUST accept a Membership Number or QR-code scan and return only Firm Name, Membership Type, Valid Until Date, and Status (Active / Lapsed / Revoked / Superseded); no other data is exposed.
- **FR-048**: The public verification page MUST rate-limit requests per source IP and present a captcha challenge for repeated lookups.

**Member Lifecycle & Renewal**

- **FR-049**: Secretary-approved applicants MUST automatically become Active Members; their firm MUST be added to the member directory immediately; Ordinary Members MUST become available in the Proposer/Seconder dropdowns.
- **FR-050**: Members MUST be able to log in, view their membership status, issued certificates, and stored documents.
- **FR-051**: The system MUST send automated renewal reminder emails at T-30 days and T-15 days before membership expiry.
- **FR-052**: Members MUST be able to initiate renewal from the portal; the renewal form MUST be pre-filled from prior application data and vaulted documents; members MUST be able to update changed information.
- **FR-053**: Renewals with no material changes MUST be auto-approved; renewals with material changes — defined as any change to firm structure (directors, partners, members, or firm type) or identity/KYC documents — MUST be routed through the approval workflow.
- **FR-054**: Membership status MUST transition to Renewal Due at expiry and to Lapsed after the configurable grace period elapses (default: 60 days); Lapsed members MUST retain read-only access to their vault and certificate history.

**Document Vault & Management**

- **FR-055**: The system MUST enforce file-format and size limits at upload time, providing clear inline guidance on failures. Accepted formats: PDF, JPEG, PNG. Maximum size: 10 MB per file.
- **FR-056**: Every uploaded document MUST be stored in the member's document vault, versioned by upload date; prior versions MUST be marked Superseded and retained.
- **FR-057**: Authorized CREDAI-side roles MUST be able to view a member's vault documents inline within review screens, subject to their RBAC permissions.
- **FR-058**: The system MUST retain documents per configurable retention periods: 7 years post-membership-end for active members; 3 years post-rejection for rejected applications; longer for legal-hold cases.

**Staff Dashboards & Analytics**

- **FR-059**: Authorized staff MUST have access to an Operational Dashboard showing live application counts by status, aging buckets, and rejection-reason breakdowns.
- **FR-060**: Authorized staff MUST have access to a Member Dashboard showing active members by Membership Type and renewals due within 30 / 60 / 90 days.
- **FR-061**: Payment Officers and authorized staff MUST have access to a Payment Dashboard showing fee collection by period (online vs offline split), pending fees, and reconciliation status.
- **FR-062**: Authorized staff MUST have access to KPI views covering applications submitted, median and p95 approval cycle time, and first-time-right submission rate.
- **FR-063**: All dashboards MUST support filtering by date range, Membership Type, and Firm Type, and exporting the visible data to CSV or Excel.

**Notifications & Communications**

- **FR-064**: The system MUST send email notifications for all key lifecycle events: OTP delivery, submission acknowledgement, status changes (Approved / Rejected / Raise Objection), payment receipt, renewal reminders (T-30 and T-15), renewal confirmation, certificate issuance, and certificate revocation.
- **FR-065**: Notification send-success and send-failure MUST be logged for audit and escalation purposes.

**User, Role & President Management**

- **FR-066**: System Admins MUST be able to invite new staff users by email with a role assignment from the six CREDAI-side roles; invited users receive a one-time account-setup link.
- **FR-067**: System Admins MUST be able to disable, re-enable, and remove staff accounts.
- **FR-068**: System Admins MUST be able to create and maintain the President record (name, designation label, signature image, tenure start/end dates, active flag).
- **FR-069**: The system MUST enforce that exactly one President record is Active at any moment; activating a new President MUST mark any prior Active record as Inactive.

**Audit, Compliance & Data Rights**

- **FR-070**: The system MUST maintain an immutable audit log of every state change, staff action, document access, certificate event, payment entry, and Aadhaar-field read, capturing who, what, and when.
- **FR-071**: System Admins MUST be able to view the audit log filtered by user, action type, application, member, and date range.
- **FR-072**: The system MUST capture and store timestamped, purpose-bound consent at signup for personal data processing, external verification, vault storage, and communications, per the Digital Personal Data Protection Act 2023.
- **FR-073**: Members MUST be able to view all personal data the system holds about them, request correction of inaccuracies, and submit erasure requests (subject to statutory retention obligations).
- **FR-074**: Aadhaar numbers MUST be masked by default in all UI surfaces (showing only the last 4 digits); full display MUST only be available to the data subject via an explicit reveal action; Aadhaar numbers MUST never be visible to any CREDAI staff role unless the member authorizes it.

---

### Key Entities

- **Firm**: Represents an applicant or member organization. Key attributes: firm name, firm type (Proprietorship, Partnership, Pvt Ltd, LLP, Public Sector, AOP, Co-operative Society), address (within PMC / PCMC / PMRDA), GSTIN, MahaRERA number, and a list of individual principals (Proprietors / Partners / Directors / Members).
- **Individual Principal**: A natural person associated with a Firm. Key attributes: name, designation, Aadhaar (masked), PAN, contact details, education, real-estate experience, and uploads of Aadhaar scan, PAN scan, signature, and photo.
- **Application**: Tracks one membership application lifecycle. Key attributes: membership type, firm type, status (Draft → Submitted → Under Scrutiny → At Convenor → At Director General → At Secretary → Approved / Rejected), payment status, and a complete audit timeline. Immutable after submission except via audited Scrutiniser edits.
- **Membership**: Created on approval of an Application. Key attributes: membership number, membership type, issue date, valid-until date, status (Active / Renewal Due / Lapsed / Revoked), and a link to all issued certificates.
- **Document**: Any file uploaded by an applicant or member. Key attributes: document type, upload date, version sequence, status (Current / Superseded), file reference, and the associated application or vault record.
- **Payment**: A ledger entry for a fee transaction. Key attributes: amount, GST breakdown, mode (Online / Cash / Cheque / NEFT / DD), reference number, status (Pending / Reconciled / Reversed), and an optional receipt image for offline entries.
- **Certificate**: A PDF artefact issued on membership approval or renewal. Key attributes: membership number, issue date, valid-until date, embedded President snapshot (name, signature image), cryptographic signature, status (Active / Superseded / Revoked), and the vault location of the PDF.
- **President Record**: A master-data entry maintained by the System Admin. Key attributes: name, designation label, signature image, tenure start date, tenure end date, active flag. Exactly one record is Active at any moment; historical records are retained.
- **User / Staff Account**: Represents any authenticated user. Applicants/Members use email+OTP; CREDAI staff use email+password+TOTP-MFA. Staff accounts carry exactly one of the six CREDAI-side roles.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 80% of submitted applications pass the Scrutiniser's first review without a "missing or invalid document" rejection (first-time-right submission rate).
- **SC-002**: At least 60% of new applicants complete and submit their application in a single session.
- **SC-003**: The median time from starting the wizard to submitting a typical Ordinary Membership / Partnership application is 30 minutes or less for applicants who have all required documents at hand.
- **SC-004**: At least 90% of applicants complete their application without any phone or email support contact to the CREDAI Pune office.
- **SC-005**: Membership renewal takes 10 minutes or less (median) for an existing member with no material changes, starting from the renewal reminder link.
- **SC-006**: The median time from application submission to Approve/Reject decision is 3 business days or fewer, measured across all complete and fully-verified applications.
- **SC-007**: Staff spend 30 minutes or fewer of hands-on review time per application, including all verification cross-checks and decision recording.
- **SC-008**: Within 3 months of launch, at least 90% of new membership applications are submitted via the portal; paper submission is accepted only as an exception.
- **SC-009**: Within 6 months of launch, 100% of in-cycle renewals are processed through the portal.
- **SC-010**: At least 99% of submitted applications have a fully reconciled fee status (online or offline) before final approval.
- **SC-011**: Any member's complete document set is retrievable from the vault in under 1 minute for audit or legal requests.
- **SC-012**: Renewal retention is at least 95% — meaning at least 95% of members eligible for renewal complete it before their expiry date.
- **SC-013**: Portal availability is at least 99.5% measured monthly; applicants never encounter a total outage lasting more than a few minutes during any single session.
- **SC-014**: OTP delivery succeeds within 30 seconds for at least 95% of requests.
- **SC-015**: At least 99% of document upload attempts succeed for files that meet the configured format and size requirements.
- **SC-016**: At least 95% of user-facing page and API responses complete within 3 seconds under normal operating load.

---

## Assumptions

- CREDAI Pune is the single organizational customer ("single-tenant"); multi-chapter or national-federation functionality is out of scope for this specification.
- Expected scale at launch: 500–1,000 active members; 20–50 peak concurrent users. Infrastructure and DB sizing should be validated against these figures; horizontal scaling headroom is desirable but not required at MVP.
- The portal is English-only at launch; Marathi and Hindi language support may be considered in future phases.
- Applicants have access to a modern smartphone or desktop browser and a stable internet connection sufficient for document uploads.
- CREDAI Pune will supply an existing member roster (in a negotiated format) for initial data migration; migrated members are flagged distinctly from portal-native records.
- The payment gateway selection (Razorpay / PayU / CCAvenue / BillDesk / Cashfree) is a client decision deferred to the architecture phase; the spec assumes a standard RBI-authorized payment aggregator.
- MahaRERA project number is captured as data and as an uploaded certificate at MVP; live API verification against the MahaRERA portal is a Growth-phase feature, pending client confirmation.
- GST e-invoicing (IRN generation via the GST IRP) is not required at MVP, as CREDAI Pune's annual aggregate turnover is assumed to be below the ₹5-crore e-invoicing threshold; this assumption requires client confirmation.
- Data retention defaults are: active member data and documents retained for 7 years post-lapse/cancellation; rejected applications retained for 3 years; audit log retained for 7 years; payment records retained for 8 years. These periods are subject to client confirmation.
- Staff MFA (TOTP-based) is mandatory in MVP for all six CREDAI-side roles; subject to client confirmation.
- Aadhaar is collected as a KYC document only (number + card scan); no biometric capture, no Aadhaar-based authentication, and no eKYC integration is included.
- Payment card numbers and banking credentials are never stored by the portal; the payment gateway handles all card/UPI/netbanking flows.
- All personal data and document vault content is hosted on infrastructure physically located in India, in line with the DPDP Act requirements.
- The President's signature on the certificate is a scanned image of the handwritten signature; cryptographic trust is provided by the portal's system-level PDF signing certificate, not a personal digital signature certificate.
- Treatment of certificates for migrated legacy members (current-President re-issuance dated on migration date vs historical-President capture) requires client decision before the data-migration mini-project begins.
