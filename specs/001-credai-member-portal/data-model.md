# Phase 1: Data Model — CREDAI Pune Digital Member Portal

**Date**: 2026-04-28 | **Status**: Complete

## Entity Relationship Diagram (Conceptual)

```
┌─────────────────────────────────────────────────────────────────────┐
│ Core Domain                                                         │
├─────────────────────────────────────────────────────────────────────┤

User (Identity) ──┬── Applicant (OTP-based)
                  └── Staff (Password + TOTP, 6 roles)

Applicant ──── Application (12-step wizard state)
                   │
                   ├── ApplicationStep (per-step data + validation status)
                   │
                   ├── Document (uploaded file + versioning)
                   │
                   ├── ExternalVerification (GST status + PAN status)
                   │
                   ├── Payment (online + offline ledger entry)
                   │
                   └── ApprovalDecision (4-stage workflow: Scrutiniser → Convenor → DG → Secretary)

Member (Active status) ──┬── MembershipCertificate (1+ per member, versioned)
                         │   └── CertificatePresidentSnapshot (historical President)
                         │
                         ├── MemberRenewal (T-30 reminder, renewal form, auto-approval)
                         │
                         ├── DocumentVault (40–100 docs over 5 years, versioning + supersession)
                         │
                         └── MembershipLedger (annual fee payment record)

Staff ──── ApprovalDecision (per-member role assignment: Scrutiniser, Convenor, DG, Secretary)
           │
           └── StaffAction (inline edit on review, raise objection, reject reason, audit trail)

AuditLog (append-only) ───── events: state transitions, staff actions, document accesses, logins, DSAR

President (Master Data) ───── MembershipCertificate.president (historical snapshot on issuance)

ExternalIntegration
  ├── GST Verification Status
  ├── PAN Verification Status
  ├── Payment Gateway Webhook Log
  └── Email Dispatch Log
```

---

## Core Entities

### 1. User (Identity Layer)

**Attributes:**
- `id` (UUID, primary key)
- `email` (unique, verified)
- `phoneNumber` (unique, E.164 format)
- `userType` (enum: 'Applicant', 'Staff')
- `createdAt` (timestamp)
- `lastLoginAt` (timestamp, nullable)
- `isActive` (boolean, soft-delete via status field)

**Invariants:**
- Unique constraint on `email`.
- `userType` determines authentication flow (OTP vs. Password + TOTP).

---

### 2. Applicant

**Attributes:**
- `id` (UUID, primary key, foreign key to User)
- `userId` (foreign key to User)
- `createdAt` (timestamp)

**Purpose:** Join table to associate User with applicant-specific context. Applicant is any User with `userType = 'Applicant'` who initiates an Application.

---

### 3. Application (Core Entity — Membership Application)

**Attributes:**
- `id` (UUID, primary key)
- `applicantId` (foreign key to Applicant)
- `applicationNumber` (unique, format: `CPN/{ORD|ASC|RERA}/{YYYY}/{seq}`)
- `membershipType` (enum: 'Ordinary', 'Associate', 'RERAProject')
- `firmType` (enum: 'Proprietorship', 'Partnership', 'PrivateLimited', 'LLP', 'PublicSector', 'AOP', 'CooperativeSociety')
- `firmName` (text, encrypted at rest)
- `firmAddress` (text, encrypted)
- `status` (enum: 'Draft', 'Submitted', 'Verification', 'Convenor', 'DG', 'Secretary', 'Approved', 'Rejected', 'CertificateIssued')
  - Maps to state machine: Submitted → Verification (Scrutiniser) → Convenor → DG → Secretary → Approved → CertificateIssued | Terminal: Rejected
- `currentStepNumber` (int 1–12, for resume draft)
- `isComplete` (boolean, true when all 12 steps filled + declaration accepted)
- `submittedAt` (timestamp, nullable; set when status = 'Submitted')
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

**Invariants:**
- `status = 'Submitted'` and beyond → immutable (no further editing by applicant; Scrutiniser can re-edit in Verification stage).
- Unique `applicationNumber` per application.

---

### 4. ApplicationStep

**Attributes:**
- `id` (UUID)
- `applicationId` (foreign key to Application)
- `stepNumber` (int 1–12)
- `data` (JSON, schema-validated by Zod per step)
- `isComplete` (boolean, true when all mandatory fields for this step are filled)
- `validationStatus` (enum: 'Valid', 'Invalid')
- `validationErrors` (JSON array, populated on validation failure)
- `completedAt` (timestamp, nullable)
- `lastModifiedAt` (timestamp)

**Validation per step:**
- Step 1: Membership Type + Firm Type selection; Documents You'll Need panel
- Step 2–3: Applicant contact details, firm details, directors/partners, projects, financials (vary by firm type)
- Step 9: Mandatory documents per membership+firm type (validated via DocumentStatus)
- Step 10: Declaration (checkbox + OTP verification)
- Step 11: Payment status confirmation
- Step 12: Review + submit

---

### 5. Document (File Upload + Versioning)

**Attributes:**
- `id` (UUID)
- `applicationId` (foreign key to Application)
- `documentType` (enum: 'PAN', 'GST', 'ROC', 'RERA', 'CoC', 'ProjectProof', 'BankAccount', 'ProposerForm', 'SeconderForm', 'IncomeProof', 'OtherProof', etc.)
- `fileName` (text)
- `fileSize` (int, bytes)
- `mimeType` (enum: 'application/pdf', 'image/jpeg', 'image/png')
- `storageKey` (text, path in Vercel Blob)
- `status` (enum: 'Uploaded', 'Verified', 'Rejected')
- `uploadedAt` (timestamp)
- `expiresAt` (timestamp, nullable; for time-sensitive docs like GST cert)
- `versionNumber` (int, 1 for original, 2+ for replacements on renewal)
- `isCurrent` (boolean, true for latest version)
- `replacedBy` (foreign key to Document, nullable; if superseded on renewal)

**Invariants:**
- File size ≤ 10 MB (NFR34).
- Format: PDF, JPEG, PNG only (NFR34).
- Per-application, per-document-type: only one `isCurrent = true`.

---

### 6. ExternalVerification

**Attributes:**
- `id` (UUID)
- `applicationId` (foreign key to Application)
- `verificationType` (enum: 'GST', 'PAN')
- `referenceValue` (text: GSTIN or PAN, encrypted)
- `status` (enum: 'Pending', 'Verified', 'Failed')
- `verifiedAt` (timestamp, nullable)
- `failureReason` (text, nullable)
- `rawResponse` (JSON, external API response, truncated for brevity)
- `retriesRemaining` (int, decremented on each pg-boss worker attempt)
- `nextRetryAt` (timestamp, null if all retries exhausted)
- `lastAttemptAt` (timestamp)

**Invariants:**
- Non-blocking submission: even if `status = 'Pending'`, application can be submitted.
- Scrutiniser can manually re-trigger verification (sets `status = 'Pending'`, `nextRetryAt = now()`).

---

### 7. Payment

**Attributes:**
- `id` (UUID)
- `applicationId` (foreign key to Application, nullable; null for renewal or standalone entry)
- `membershipRenewalId` (foreign key to MembershipRenewal, nullable)
- `paymentType` (enum: 'Online', 'Offline')
- `amount` (decimal, in ₹)
- `currency` (enum: 'INR')
- `status` (enum: 'Pending', 'Initiated', 'Success', 'Failed', 'Reconciled')
- `gateway` (enum: 'Razorpay', 'Cashfree', 'Manual', nullable if offline)
- `gatewayOrderId` (text, nullable, unique if provided)
- `gatewayTransactionId` (text, nullable, unique if provided)
- `offlinePaymentMethod` (enum: 'Cheque', 'NEFT', 'IMPS', 'DD', nullable if online)
- `offlineReferenceNumber` (text, nullable, unique per offline payment)
- `offlineReceivedDate` (date, nullable)
- `recordedBy` (foreign key to Staff, nullable; Payment Officer who recorded manual payment)
- `notes` (text, nullable; cheque number, bank name, etc.)
- `createdAt` (timestamp)
- `completedAt` (timestamp, nullable; when payment confirmed)

**Invariants:**
- Unique constraint on `gatewayOrderId` (if provided).
- Unique constraint on `offlineReferenceNumber` (prevents duplicate cheque/NEFT entry).
- `status = 'Reconciled'` when verified by payment processor or Payment Officer.

---

### 8. ApprovalDecision (4-Stage Workflow)

**Attributes:**
- `id` (UUID)
- `applicationId` (foreign key to Application)
- `stage` (enum: 'Scrutiniser', 'Convenor', 'DG', 'Secretary')
- `status` (enum: 'Pending', 'Approved', 'RaisedObjection', 'Rejected')
- `reviewedBy` (foreign key to Staff)
- `reviewedAt` (timestamp, nullable)
- `decision` (text, nullable; reason for objection or rejection)
- `completedAt` (timestamp, nullable)

**Workflow semantics:**
1. New application → `stage = 'Scrutiniser', status = 'Pending'`
2. Scrutiniser approves → `status = 'Approved'` → creates next-stage decision (`stage = 'Convenor'`).
3. Scrutiniser raises objection → `status = 'RaisedObjection'` → bounces back to applicant OR internal note (TBD: applicant-facing vs. staff-only).
4. Upper stage (Convenor, DG) raises objection → bounces back to `stage = 'Scrutiniser'` (not applicant).
5. Secretary approves → `status = 'Approved'` → triggers certificate issuance.
6. Any stage rejects → terminal state, application immutable, applicant notified.
7. Scrutiniser re-approval after bounce → restarts from `stage = 'Convenor'` (skips already-approved stages).

**Invariants:**
- One record per stage per application (unique constraint on `applicationId, stage`).
- Only `reviewedBy` role matching `stage` can update status.

---

### 9. Member (Active Membership)

**Attributes:**
- `id` (UUID)
- `applicationId` (foreign key to Application)
- `membershipNumber` (unique, same as `Application.applicationNumber` once approved)
- `membershipType` (enum: 'Ordinary', 'Associate', 'RERAProject')
- `firmName` (text, encrypted)
- `contactEmail` (text, encrypted)
- `contactPhone` (text, encrypted)
- `status` (enum: 'Active', 'RenewalDue', 'Lapsed')
- `approvedAt` (timestamp; when Secretary approved the application)
- `expiryDate` (date; `approvedAt + 1 year` for first membership)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

**Status transitions:**
- `Active`: Member in good standing (membership not yet expired).
- `RenewalDue`: Current date > `expiryDate` (30-day grace period grace period starts).
- `Lapsed`: Current date > `expiryDate + 60 days` (grace period elapsed). Member retains read-only vault access.

**Invariants:**
- Unique `membershipNumber`.
- Immutable once created (edits via renewal).

---

### 10. MembershipRenewal

**Attributes:**
- `id` (UUID)
- `memberId` (foreign key to Member)
- `renewalNumber` (text, format: `CPN/{member-type}/{YYYY}-R/{seq}`)
- `status` (enum: 'Draft', 'Submitted', 'AutoApproved', 'ManualReview', 'Approved', 'Rejected')
- `previousData` (JSON; pre-filled from Member + last Application)
- `renewalData` (JSON; updated fields by member)
- `changesDetected` (boolean; true if any material field changed)
- `materialChanges` (JSON array; list of fields changed)
- `requiredSteps` (int; number of renewal form steps, usually 1–3 based on changes)
- `currentStep` (int)
- `submittedAt` (timestamp, nullable)
- `approvedAt` (timestamp, nullable)
- `autoApprovedAt` (timestamp, nullable)
- `newExpiryDate` (date; `approvedAt + 1 year`)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

**Auto-approval logic:**
- Material changes = changes to firm structure (directors, partners), identity/KYC documents, or firm type.
- No changes + documents superseded (not replaced) → auto-approve, extend expiry by 1 year, issue new certificate.
- Material changes → manual review queue (same 4-stage workflow as new application, but faster path).

---

### 11. MembershipCertificate

**Attributes:**
- `id` (UUID)
- `memberId` (foreign key to Member)
- `certificateNumber` (unique, format: `MEM/{member-id}/{YYYY}/{seq}`)
- `membershipType` (enum: 'Ordinary', 'Associate', 'RERAProject')
- `firmName` (text, encrypted)
- `presidentName` (text, encrypted; snapshot of President master data at issuance)
- `presidentSignatureImageKey` (text, path to image in Blob; snapshot)
- `certHash` (text, SHA-256 of signed PDF; tamper-evidence)
- `issuedAt` (timestamp)
- `validityStartDate` (date)
- `validityEndDate` (date; same as Member.expiryDate)
- `status` (enum: 'Active', 'Superseded', 'Revoked')
- `supersededBy` (foreign key to MembershipCertificate, nullable; if renewed)
- `revokedAt` (timestamp, nullable)
- `revokedReason` (text, nullable)
- `pdfStorageKey` (text, path in Vercel Blob + S3 archive)
- `qrCodeData` (text, verification URL encoded in QR)
- `createdAt` (timestamp)

**Invariants:**
- Certificates are never deleted; superseded or revoked instead (audit trail).
- `status = 'Active'` means valid for directory + verification.
- Public verification endpoint decodes QR, fetches cert by ID, validates hash.

---

### 12. DocumentVault (Member Document Archive)

**Attributes:**
- `id` (UUID)
- `memberId` (foreign key to Member)
- `documentType` (enum: same as Document)
- `fileName` (text)
- `storageKey` (text, Vercel Blob path)
- `fileSize` (int)
- `mimeType` (enum)
- `uploadedAt` (timestamp)
- `expiresAt` (date, nullable; for time-sensitive docs)
- `status` (enum: 'Current', 'Superseded', 'Archived')
- `supersededAt` (timestamp, nullable)
- `supersededBy` (foreign key to DocumentVault, nullable)
- `isSearchable` (boolean; if member is Lapsed, only read-only access, no download for some doc types)

**Relationship to Application.Document:**
- When application approved → documents copied to DocumentVault with `status = 'Current'`.
- On renewal → new version uploaded with `status = 'Current'`; old version marked `status = 'Superseded'`.

---

### 13. StaffUser

**Attributes:**
- `id` (UUID)
- `userId` (foreign key to User)
- `role` (enum: 'Scrutiniser', 'Convenor', 'DirectorGeneral', 'Secretary', 'PaymentOfficer', 'Admin')
- `fullName` (text, encrypted)
- `status` (enum: 'Active', 'Suspended', 'Archived')
- `totpSecret` (text, encrypted; null until TOTP enrolled)
- `totpEnrolledAt` (timestamp, nullable)
- `totpVerifiedAt` (timestamp, nullable; first successful verification)
- `recoveryCodes` (text array, hashed; for account recovery)
- `lastPasswordChangedAt` (timestamp)
- `sessionTimeout` (int, seconds; default 30 min idle / 8 h absolute)
- `createdAt` (timestamp)
- `createdBy` (foreign key to StaffUser, admin who invited)

**Invariants:**
- `role` determines approval stage assignment (Scrutiniser → Verification stage only).
- TOTP mandatory before first staff session.

---

### 14. AuditLog (Append-Only, Write-Only)

**Attributes:**
- `id` (UUID, auto-increment or ULID for ordering)
- `timestamp` (timestamp UTC, index for time-range queries)
- `traceId` (UUID, linked to app logs and distributed traces)
- `eventType` (enum: 'ApplicationSubmitted', 'ApplicationApproved', 'ApplicationRejected', 'StaffEdited', 'DocumentUploaded', 'AadhaarAccessed', 'CertificateIssued', 'CertificateRevoked', 'PaymentRecorded', 'PaymentReversed', 'LoginSuccess', 'LoginFailure', 'MFAEnrolled', 'DSARRequested', 'DSARResolved', 'PresidentUpdated', etc.)
- `actorId` (UUID, foreign key to User or Staff; who performed the action)
- `actorRole` (enum, snapshot of actor's role at event time)
- `resourceType` (enum: 'Application', 'Member', 'Certificate', 'Payment', 'User', etc.)
- `resourceId` (UUID)
- `beforeState` (JSON, nullable; before-image for state transitions)
- `afterState` (JSON, nullable; after-image for state transitions)
- `reason` (text, nullable; why staff took action, e.g. rejection reason)
- `ipAddress` (text, hashed via SHA-256; for abuse detection without storing raw IPs)
- `metadata` (JSON; additional context, e.g. { "gateway": "Razorpay", "retries": 3 })

**Database constraints:**
- No UPDATE, DELETE operations allowed (enforced at DB level via trigger or role-based security).
- Only INSERT permitted.
- Indexed on: `timestamp`, `actorId`, `eventType`, `resourceId`, `traceId`.

**Immutability enforcement (PostgreSQL example):**
```sql
CREATE POLICY audit_log_insert_only ON audit_log
    FOR ALL
    USING (FALSE)  -- No reads in normal flow (read via audit endpoint)
    WITH CHECK (operation = 'INSERT');
```

---

### 15. President (Master Data)

**Attributes:**
- `id` (UUID)
- `fullName` (text, encrypted)
- `emailAddress` (text, encrypted)
- `phone` (text, encrypted)
- `signatureImageKey` (text, path in Blob)
- `startDate` (date; when assumed presidency)
- `endDate` (date, nullable; if stepped down)
- `status` (enum: 'Active', 'Historical')
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

**Invariants:**
- Only one `status = 'Active'` at a time (enforced by unique constraint).
- On status change: old President → `status = 'Historical'`, new President → `status = 'Active'`.
- Certificates issued capture President snapshot; later President changes do not retroactively update certificates (immutability).
- Every President change logged to AuditLog.

---

### 16. NotificationTemplate & EmailEvent (for notifications)

**NotificationTemplate Attributes:**
- `id` (UUID)
- `eventType` (enum: 'OTPRequest', 'ApplicationConfirmation', 'RenewalReminder', 'QueryRaised', 'ApprovalGranted', 'RejectionNotice', 'CertificateIssued', etc.)
- `templateKey` (text, e.g., 'otp-request-applicant', 'approval-granted-member')
- `subject` (text, with `{{variable}}` placeholders)
- `bodyHtml` (text, with placeholders)
- `isActive` (boolean)

**EmailEvent Attributes:**
- `id` (UUID)
- `templateId` (foreign key to NotificationTemplate)
- `recipientEmail` (text, encrypted)
- `recipientRole` (enum: 'Applicant', 'Member', 'Staff')
- `status` (enum: 'Queued', 'Sending', 'Sent', 'Failed')
- `renderedSubject` (text)
- `renderedBody` (text)
- `failureReason` (text, nullable)
- `sentAt` (timestamp, nullable)
- `retriesRemaining` (int)
- `nextRetryAt` (timestamp, nullable)
- `createdAt` (timestamp)

**Invariants:**
- Email dispatch queued in pg-boss worker; retries on failure.
- Sent emails logged to AuditLog.

---

## Constraints & Validations

### Data Encryption at Rest

- **Fields encrypted with AES-256:** firmName, applicantName, email, phone, PAN, GSTIN, Aadhaar (all).
- **Envelope encryption for Aadhaar:** Separate key managed by AWS KMS, rotated annually.
- **Encryption key storage:** AWS Secrets Manager (credentials) + KMS (master keys).

### Field-Level Validations (Zod Schemas)

All mandatory fields enforce type and format validation:

```typescript
// Example: Partnership firm requires ≥ 2 partners
const partnershipSchema = z.object({
  firmType: z.literal('Partnership'),
  partners: z.array(partnerSchema).min(2), // Enforced
  // ...
});

// Example: Proposer must be an Active Ordinary Member
const proposerSchema = z.object({
  proposerId: z.string().uuid(),
  // Refined validation in tRPC procedure:
  // proposer.status === 'Active' && proposer.membershipType === 'Ordinary'
});
```

### State Machine Invariants

- Applications are locked from editing once `status >= 'Submitted'`.
- Only Scrutiniser can edit application data during Verification stage.
- Once approved by Secretary → immutable, certificate issuance path begins.
- Rejected applications cannot be re-opened; new application must be submitted.

### Audit Integrity

- Every state transition, staff action, document access, payment, login logged.
- Audit entries cannot be modified or deleted (database-enforced).
- Tamper-detection: AuditLog indexed by timestamp for sequential scan; gaps indicate tampering.

---

## Next Steps (Implementation)

1. **Prisma schema generation** (`prisma/schema.prisma`): Translate entities above into models, relations, and constraints.
2. **Zod schemas** (`src/schemas/`): Define validation rules per entity and per wizard step.
3. **Database migration** (`prisma/migrations/`): Create tables, indexes, foreign keys, triggers (append-only audit log).
4. **tRPC contracts** (Phase 1, next document): Input/output schemas for all procedures.
5. **E2E test data** (`tests/fixtures/`): Seed test data for all user journeys (new application, renewal, approval, payment, etc.).
