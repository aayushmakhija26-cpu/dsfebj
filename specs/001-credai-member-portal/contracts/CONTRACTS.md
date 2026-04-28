# API Contracts: CREDAI Pune Digital Member Portal

**Date**: 2026-04-28 | **Status**: Phase 1 Design

## Overview

All user-facing and internal APIs are tRPC procedures with Zod-validated inputs and outputs. This document defines the core procedure contracts across the four primary user journeys:

1. **New Member Application** (12-step wizard)
2. **Staff Approval Workflow** (4-stage workflow)
3. **Payment Processing** (online + offline)
4. **Member Renewal** (pre-filled form + auto-approval)

---

## Core Procedure Groups

### 1. Authentication & Identity (tRPC Router: `auth`)

#### `auth.requestOtp()`
**Purpose:** Applicants / Members request OTP for login.

**Input (Zod):**
```typescript
z.object({
  email: z.string().email(),
  phone: z.string().regex(/^\+91[0-9]{10}$/), // E.164 format
  userType: z.enum(['Applicant', 'Member']),
})
```

**Output:**
```typescript
z.object({
  success: z.boolean(),
  sessionId: z.string().uuid(),
  expiresIn: z.number(), // seconds
  message: z.string(),
})
```

**Behavior:**
- Non-blocking; OTP queued in pg-boss email worker.
- Rate-limited: max 3 OTP requests per email per hour (brute-force protection).
- Returns session ID for OTP verification (not email/phone in response).

---

#### `auth.verifyOtp()`
**Purpose:** Verify OTP and create session cookie.

**Input:**
```typescript
z.object({
  sessionId: z.string().uuid(),
  otp: z.string().length(6).regex(/^[0-9]{6}$/),
})
```

**Output:**
```typescript
z.object({
  success: z.boolean(),
  userId: z.string().uuid(),
  userType: z.enum(['Applicant', 'Member']),
  redirectUrl: z.string().url(), // /apply or /member/dashboard
})
```

**Behavior:**
- OTP valid for 10 minutes.
- On success: creates `next-auth` session cookie (secure, httpOnly, sameSite='strict').
- Logs login attempt to AuditLog (success or failure).

---

#### `auth.staffLogin()`
**Purpose:** Staff password + email login (TOTP challenge on success).

**Input:**
```typescript
z.object({
  email: z.string().email(),
  password: z.string().min(8),
})
```

**Output:**
```typescript
z.object({
  success: z.boolean(),
  requiresTOTP: z.boolean(),
  sessionId: z.string().uuid(), // For TOTP challenge
  message: z.string(),
})
```

**Behavior:**
- Password hashed with bcrypt (12 rounds); never logged.
- On success: if TOTP enrolled, redirects to TOTP challenge; otherwise creates session.
- Rate-limited: max 5 failed attempts per IP per hour.

---

#### `auth.verifyTOTP()`
**Purpose:** Verify TOTP code for staff MFA.

**Input:**
```typescript
z.object({
  sessionId: z.string().uuid(),
  totpCode: z.string().length(6).regex(/^[0-9]{6}$/),
})
```

**Output:**
```typescript
z.object({
  success: z.boolean(),
  redirectUrl: z.string().url(), // /admin/review
})
```

**Behavior:**
- TOTP window: ±1 epoch (30-second tolerance).
- On success: creates authenticated session cookie.

---

### 2. Membership Application Wizard (tRPC Router: `wizard`)

#### `wizard.getApplicationDraft()`
**Purpose:** Load in-progress application (resume draft).

**Input:**
```typescript
z.object({
  applicationId: z.string().uuid(),
})
```

**Output:**
```typescript
z.object({
  applicationId: z.string().uuid(),
  membershipType: z.enum(['Ordinary', 'Associate', 'RERAProject']),
  firmType: z.enum(['Proprietorship', 'Partnership', 'PrivateLimited', 'LLP', 'PublicSector', 'AOP', 'CooperativeSociety']),
  currentStep: z.number().min(1).max(12),
  steps: z.record(z.number(), z.object({
    number: z.number(),
    isComplete: z.boolean(),
    data: z.record(z.any()), // Step-specific data
    validationStatus: z.enum(['Valid', 'Invalid']),
    validationErrors: z.array(z.object({
      field: z.string(),
      message: z.string(),
    })),
  })),
  documents: z.array(z.object({
    id: z.string().uuid(),
    type: z.string(),
    fileName: z.string(),
    status: z.enum(['Required', 'Uploading', 'Uploaded', 'Error']),
    size: z.number(),
  })),
  autoSavedAt: z.string().datetime(),
})
```

**Behavior:**
- Only applicant who created this application can retrieve it.
- All sensitive fields (firm name, email) returned encrypted; decrypted on client via session key.

---

#### `wizard.submitStep()`
**Purpose:** Validate and save a wizard step, auto-save data.

**Input:**
```typescript
z.object({
  applicationId: z.string().uuid(),
  stepNumber: z.number().min(1).max(12),
  data: z.record(z.any()), // Step-specific schema (vary per step)
  autoSaveOnly: z.boolean().optional().default(false), // If true, save without advancing
})
```

**Output:**
```typescript
z.object({
  success: z.boolean(),
  stepNumber: z.number(),
  isComplete: z.boolean(),
  errors: z.array(z.object({
    field: z.string(),
    message: z.string(),
  })),
  savedAt: z.string().datetime(),
})
```

**Behavior:**
- Validates `data` against step-specific Zod schema.
- On validation error: returns errors, does not advance.
- On success: saves to DB, returns saved timestamp.
- Auto-save: triggered every 30 seconds or on field blur (client-side debounce).
- Downstream-step reset: if field value changes and affects downstream conditional logic, clears dependent step data with warning.

---

#### `wizard.getDocumentsYouNeed()`
**Purpose:** Return pre-flight document checklist based on membership + firm type.

**Input:**
```typescript
z.object({
  membershipType: z.enum(['Ordinary', 'Associate', 'RERAProject']),
  firmType: z.enum(['Proprietorship', 'Partnership', 'PrivateLimited', 'LLP', 'PublicSector', 'AOP', 'CooperativeSociety']),
})
```

**Output:**
```typescript
z.object({
  documents: z.array(z.object({
    type: z.string(),
    name: z.string(),
    description: z.string(),
    required: z.boolean(),
    format: z.string(), // 'PDF, JPEG, PNG'
    maxSize: z.string(), // '10 MB'
  })),
})
```

---

#### `wizard.submitApplication()`
**Purpose:** Final submission of completed application (all 12 steps valid + declaration).

**Input:**
```typescript
z.object({
  applicationId: z.string().uuid(),
  declarationAccepted: z.boolean(),
})
```

**Output:**
```typescript
z.object({
  success: z.boolean(),
  applicationNumber: z.string(),
  submittedAt: z.string().datetime(),
  nextSteps: z.string(),
  supportContact: z.string(),
  confirmationPdfUrl: z.string().url(),
})
```

**Behavior:**
- Validates all 12 steps are complete + all required documents uploaded.
- Locks application from further editing (`status = 'Submitted'`).
- Sends confirmation email with application number + summary PDF.
- Returns confirmation page content.

---

### 3. Staff Approval Workflow (tRPC Router: `approval`)

#### `approval.getApplicationQueue()`
**Purpose:** Fetch paginated queue of applications for current staff member.

**Input:**
```typescript
z.object({
  staffRole: z.enum(['Scrutiniser', 'Convenor', 'DirectorGeneral', 'Secretary']),
  filters: z.object({
    status: z.enum(['Pending', 'InReview']).optional(),
    membershipType: z.enum(['Ordinary', 'Associate', 'RERAProject']).optional(),
    submittedDateFrom: z.string().datetime().optional(),
    submittedDateTo: z.string().datetime().optional(),
  }).optional(),
  page: z.number().min(1),
  pageSize: z.number().min(10).max(100),
})
```

**Output:**
```typescript
z.object({
  applications: z.array(z.object({
    id: z.string().uuid(),
    applicationNumber: z.string(),
    firmName: z.string(),
    membershipType: z.enum(['Ordinary', 'Associate', 'RERAProject']),
    submittedAt: z.string().datetime(),
    gstStatus: z.enum(['Verified', 'Pending', 'Failed']),
    panStatus: z.enum(['Verified', 'Pending', 'Failed']),
    paymentStatus: z.enum(['Pending', 'Reconciled']),
    applicantSummary: z.object({
      name: z.string(),
      email: z.string().email(),
      phone: z.string(),
    }),
  })),
  totalCount: z.number(),
  page: z.number(),
  pageSize: z.number(),
  hasMore: z.boolean(),
})
```

---

#### `approval.getApplicationDetail()`
**Purpose:** Load full application detail for review.

**Input:**
```typescript
z.object({
  applicationId: z.string().uuid(),
  staffRole: z.enum(['Scrutiniser', 'Convenor', 'DirectorGeneral', 'Secretary']),
})
```

**Output:**
```typescript
z.object({
  application: z.object({
    id: z.string().uuid(),
    applicationNumber: z.string(),
    status: z.enum(['Verification', 'Convenor', 'DG', 'Secretary']),
    membershipType: z.enum(['Ordinary', 'Associate', 'RERAProject']),
    firmType: z.enum(['Proprietorship', 'Partnership', 'PrivateLimited', 'LLP', 'PublicSector', 'AOP', 'CooperativeSociety']),
    applicantDetails: z.object({
      name: z.string(),
      email: z.string().email(),
      phone: z.string(),
      designation: z.string(),
    }),
    firmDetails: z.object({
      name: z.string(),
      address: z.string(),
      cin: z.string().optional(),
      gst: z.string(),
      pan: z.string(),
    }),
    documents: z.array(z.object({
      id: z.string().uuid(),
      type: z.string(),
      fileName: z.string(),
      uploadedAt: z.string().datetime(),
      previewUrl: z.string().url(),
    })),
    verifications: z.object({
      gst: z.enum(['Verified', 'Pending', 'Failed']),
      pan: z.enum(['Verified', 'Pending', 'Failed']),
      gstVerifiedAt: z.string().datetime().optional(),
      panVerifiedAt: z.string().datetime().optional(),
    }),
    payment: z.object({
      status: z.enum(['Pending', 'Reconciled']),
      amount: z.number(),
      method: z.string().optional(),
    }),
    workflow: z.object({
      currentStage: z.string(),
      previousDecisions: z.array(z.object({
        stage: z.string(),
        approvedBy: z.string(),
        approvedAt: z.string().datetime(),
      })),
      pendingObjections: z.array(z.object({
        raisedAt: z.string().datetime(),
        raisedBy: z.string(),
        reason: z.string(),
      })).optional(),
    }),
  }),
  checklist: z.array(z.object({
    id: z.string().uuid(),
    category: z.string(), // 'Firm Details', 'Documents', 'Financial', 'Declarations'
    items: z.array(z.object({
      id: z.string().uuid(),
      label: z.string(),
      required: z.boolean(),
      status: z.enum(['Unchecked', 'Passed', 'Flagged', 'Failed']),
      relatedDocumentId: z.string().uuid().optional(),
      note: z.string().optional(),
    })),
  })),
})
```

---

#### `approval.submitDecision()`
**Purpose:** Staff member (Scrutiniser, Convenor, DG, Secretary) submits approval/objection/rejection.

**Input:**
```typescript
z.object({
  applicationId: z.string().uuid(),
  staffId: z.string().uuid(),
  staffRole: z.enum(['Scrutiniser', 'Convenor', 'DirectorGeneral', 'Secretary']),
  decision: z.enum(['Approve', 'RaiseObjection', 'Reject']),
  reason: z.string().optional(), // Required for objection / rejection
  editedFields: z.record(z.string(), z.any()).optional(), // Scrutiniser-only inline edits
})
```

**Output:**
```typescript
z.object({
  success: z.boolean(),
  message: z.string(),
  nextStage: z.string().optional(), // Next stage if Approve; omitted if Reject
  notificationSent: z.boolean(), // Email to applicant / next stage staff
})
```

**Behavior:**
- Only applicable role can submit decision for their stage.
- `Approve`: creates next-stage decision OR triggers certificate issuance if Secretary.
- `RaiseObjection`: bounces back to Scrutiniser (if from Convenor/DG) or to applicant (if from Scrutiniser).
- `Reject`: immutable terminal state; applicant notified; previous decisions archived.
- Scrutiniser edits (`editedFields`): stored with before/after in AuditLog; re-triggers verification if GST/PAN edited.
- All decisions logged to AuditLog.

---

### 4. Payment (tRPC Router: `payment`)

#### `payment.initiateOnlinePayment()`
**Purpose:** Initialize online payment via Razorpay.

**Input:**
```typescript
z.object({
  applicationId: z.string().uuid().optional(), // For new application
  membershipRenewalId: z.string().uuid().optional(), // For renewal
  amount: z.number().positive(),
  feeBreakdown: z.object({
    baseFee: z.number(),
    lateFee: z.number().optional(),
    gst: z.number(),
  }),
})
```

**Output:**
```typescript
z.object({
  orderId: z.string().uuid(),
  razorpayOrderId: z.string(),
  amount: z.number(),
  currency: z.string(),
  keyId: z.string(), // Razorpay public key for client-side checkout
  notes: z.object({
    applicationId: z.string().optional(),
    membershipRenewalId: z.string().optional(),
  }),
})
```

---

#### `payment.handleRazorpayWebhook()` (REST endpoint)
**Purpose:** Razorpay webhook for payment confirmation.

**Input (raw JSON from Razorpay):**
```typescript
z.object({
  event: z.enum(['payment.authorized', 'payment.failed', 'payment.captured']),
  payload: z.object({
    payment: z.object({
      id: z.string(),
      entity: z.string(),
      amount: z.number(),
      currency: z.string(),
      status: z.string(),
      method: z.string(),
      notes: z.record(z.any()),
    }),
  }),
  signature: z.string(), // HMAC-SHA256 verification
})
```

**Output:**
```typescript
z.object({
  success: z.boolean(),
})
```

**Behavior:**
- Verify signature with Razorpay key (stored in secrets manager).
- Idempotent: check if payment already recorded (via unique constraint on `gatewayOrderId`).
- On success: update Payment status to 'Reconciled'; queue confirmation email; unlock next step.
- On failure: update Payment status to 'Failed'; allow retry.
- All events logged to AuditLog.

---

#### `payment.recordOfflinePayment()`
**Purpose:** Payment Officer records cash/cheque/NEFT/DD payment.

**Input:**
```typescript
z.object({
  applicationId: z.string().uuid().optional(),
  membershipRenewalId: z.string().uuid().optional(),
  paymentMethod: z.enum(['Cheque', 'NEFT', 'IMPS', 'DD']),
  amount: z.number().positive(),
  referenceNumber: z.string(), // Cheque#, NEFT ref, etc.
  receivedDate: z.string().date(),
  bankName: z.string().optional(),
  notes: z.string().optional(),
})
```

**Output:**
```typescript
z.object({
  success: z.boolean(),
  paymentId: z.string().uuid(),
  receiptNumber: z.string(),
  confirmationEmail: z.boolean(),
})
```

**Behavior:**
- Unique constraint on `referenceNumber` (prevents duplicate cheque entries).
- On success: Payment status → 'Reconciled'; queue confirmation email to applicant / member.
- Payment Officer role required (enforced by RBAC middleware).
- Logged to AuditLog with Payment Officer ID.

---

### 5. Member Renewal (tRPC Router: `renewal`)

#### `renewal.getRenewalForm()`
**Purpose:** Load pre-filled renewal form for member.

**Input:**
```typescript
z.object({
  memberId: z.string().uuid(),
})
```

**Output:**
```typescript
z.object({
  renewal: z.object({
    renewalId: z.string().uuid(),
    membershipNumber: z.string(),
    membershipType: z.enum(['Ordinary', 'Associate', 'RERAProject']),
    previousData: z.object({
      firmName: z.string(),
      firmAddress: z.string(),
      gst: z.string(),
      pan: z.string(),
      directors: z.array(z.object({
        name: z.string(),
        din: z.string(),
      })).optional(),
    }),
    documentVault: z.array(z.object({
      id: z.string().uuid(),
      type: z.string(),
      fileName: z.string(),
      uploadedAt: z.string().datetime(),
      isCurrent: z.boolean(),
      expiresAt: z.string().date().optional(),
    })),
    expiryDate: z.string().date(),
    requiredSteps: z.number(), // 1–3 based on complexity
  }),
})
```

---

#### `renewal.submitRenewal()`
**Purpose:** Submit renewal form (auto-approves if no changes, routes to manual review if changes detected).

**Input:**
```typescript
z.object({
  renewalId: z.string().uuid(),
  renewalData: z.object({
    firmName: z.string().optional(),
    firmAddress: z.string().optional(),
    gst: z.string().optional(),
    pan: z.string().optional(),
    directors: z.array(z.object({
      name: z.string(),
      din: z.string(),
    })).optional(),
  }),
  updatedDocuments: z.array(z.object({
    type: z.string(),
    fileId: z.string().uuid(), // newly uploaded document
  })).optional(),
})
```

**Output:**
```typescript
z.object({
  success: z.boolean(),
  renewalId: z.string().uuid(),
  status: z.enum(['AutoApproved', 'ManualReview']),
  newExpiryDate: z.string().date().optional(), // If auto-approved
  message: z.string(),
})
```

**Behavior:**
- Auto-approval logic: no material changes + documents superseded (not replaced) → auto-approve immediately.
- Material changes: route to 4-stage approval workflow (faster than new application).
- Material changes = firm structure (directors, partners, firm type) or identity/KYC docs changed.
- Confirmation email sent; member retains read-only vault access during review.

---

## Event Contracts (Email, Notifications, Audit)

### Email Events (tRPC Router: `email`, notification system)

All email events follow this schema:

```typescript
z.object({
  eventType: z.enum([
    'OTPRequest',
    'ApplicationConfirmation',
    'RenewalReminder30',
    'RenewalReminder15',
    'QueryRaised',
    'ApprovalGranted',
    'RejectionNotice',
    'CertificateIssued',
    'PaymentReceived',
    'MembershipLapsed',
    'PresidentUpdated',
  ]),
  recipientEmail: z.string().email(),
  recipientRole: z.enum(['Applicant', 'Member', 'Staff']),
  templateVariables: z.record(z.any()), // Event-specific data
  sendAt: z.string().datetime().optional(), // Scheduled send; null = immediate
})
```

All emails queued in `pg-boss` with retry logic. Sent emails logged to AuditLog.

---

## Error Handling & HTTP Status Codes

All tRPC procedures return standard error format on failure:

```typescript
{
  code: z.enum([
    'UNAUTHORIZED',           // 401 — user not authenticated
    'FORBIDDEN',              // 403 — user lacks permission
    'BAD_REQUEST',            // 400 — invalid input
    'CONFLICT',               // 409 — unique constraint / business logic violation
    'INTERNAL_SERVER_ERROR',  // 500 — server error (no PII in message)
  ]),
  message: z.string(),        // Human-readable message (no PII)
  traceId: z.string().uuid(), // For support debugging
}
```

---

## Rate Limiting & Abuse Protection

- **OTP request:** Max 3 per email per hour.
- **Staff login:** Max 5 failed attempts per IP per hour.
- **Public certificate verification:** Max 100 requests per IP per minute (Cloudfront rate-limit).
- **Renewal reminder dispatch:** Retry up to 3 times over 24 hours; escalate to manual outreach on final failure.

---

## Authentication & RBAC Middleware

All procedures require authentication context:

```typescript
middleware.auth((ctx) => {
  return {
    userId: string,        // From session
    userType: 'Applicant' | 'Member' | 'Staff',
    staffRole?: string,    // Only for staff procedures
  }
});
```

RBAC enforcement: each procedure declares required roles; middleware blocks if user lacks permission. Blocks are logged to AuditLog.

---

## Next Steps

1. **Implement tRPC routers** matching procedure names above.
2. **Define Zod input/output schemas** per procedure.
3. **Wire to database** (Prisma queries).
4. **E2E tests** covering all happy-path and error scenarios per user journey.
5. **API documentation** (autogenerated from tRPC schemas via `trpc-openapi`).
