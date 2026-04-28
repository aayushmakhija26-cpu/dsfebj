# Phase 0 Research: CREDAI Pune Digital Member Portal

**Date**: 2026-04-28 | **Status**: Complete

## Open Decisions Resolved

### 1. Hosting Infrastructure (PRD Decision #6)

**Unknown:** Cloud (AWS / GCP / Azure) vs. managed platform vs. on-premises, given India data-residency constraint (DPDP Act 2023, NFR36).

**Decision: AWS India (Mumbai region, ap-south-1)** with option to move to other India-region providers.

**Rationale:**
- AWS Asia Pacific (Mumbai) guarantees India data residency for all PII, document vault, and audit logs.
- Mature India-region support (RDS PostgreSQL, S3 / S3 Object Lock for tamper-evident backup, KMS for secrets / envelope keys, Lambda for job scheduling).
- Compliance certification: AWS India compliance with DPDP Act 2023 (data fiduciary / processor frameworks).
- Cost: Competitive for MVP scale (200 concurrent applicant + 50 staff sessions). Pay-as-you-go.
- Alternatives considered:
  - **Google Cloud India (Delhi):** Slightly less mature; similar pricing.
  - **Azure India:** Pricing premium; less common in Indian startup ecosystem.
  - **On-premises:** CREDAI Pune unlikely to maintain DC; security ops burden; defeats agility. Rejected.

**Implementation:** 
- RDS PostgreSQL (Multi-AZ for ≥99.5% availability NFR10).
- S3 with versioning + Object Lock for append-only audit-log archival.
- Secrets Manager for NEXTAUTH_SECRET, payment-gateway keys, envelope keys (Aadhaar).
- KMS for EBS encryption (RDS at-rest) and key rotation (document-signing certificate).
- Lambda + EventBridge for pg-boss scheduled jobs (renewal reminders, status transitions, retention cleanup).
- CloudFront for public certificate-verification endpoint (edge caching, DDoS protection, rate-limiting).
- Costs: Estimated ₹40–60k/month baseline (dev + staging + prod), scaling linearly with concurrent users.

---

### 2. Payment Gateway Selection (PRD Decision #2)

**Unknown:** Provider (Razorpay, PayU, Instamojo, BillDesk, Cashfree), webhook contract, and settlement reconciliation.

**Decision: Razorpay** (primary) with Cashfree as fallback.

**Rationale:**
- **Razorpay:** Gold standard for Indian startups. Offers:
  - PCI-DSS Level 1 compliance; portal stores zero card data (gateway tokenization).
  - Webhook signature verification (RSA + SHA256); built-in idempotency headers.
  - Fast settlement (T+1 to T+2); transparent fee structure (2.99% + 30 Rs per txn for online).
  - Excellent developer experience (SDKs for Node.js, tRPC-friendly REST endpoints).
  - Supports online + offline payment recording (through Razorpay Intelligence / manual entry).
  - NEFT / IMPS / QR code payment for offline collection.
- **Cashfree as fallback:** Similar feature set; marginally lower fees (2.75% + 0 Rs); slightly less mature webhook handling.
- Alternatives considered:
  - **PayU:** Comparable but costlier (3.5%+ fees); historically less reliable webhook delivery.
  - **BillDesk / ICICI:** Corporate-oriented; higher minimum transaction volumes; overkill for MVP.

**Integration approach:**
- `src/services/external/payment/razorpay.ts` adapter (provider-agnostic interface `IPaymentGatewayService`).
- Webhook handler: idempotent verification via signature validation + database uniqueness constraint on order ID.
- Reconciliation: Daily pg-boss worker syncs RazorPay settlement report; marks receipts as Reconciled.
- Fallback: If Razorpay unavailable, queue payment as "Pending"; display offline payment option to applicant; staff can manually record receipt.

**Webhook contract:**
```
POST /api/webhooks/payment/razorpay
{
  "event": "payment.authorized" | "payment.failed" | "payment.captured",
  "payload": {
    "payment": { "id", "entity", "amount", "currency", "status", "method", "notes" }
  },
  "signature": "base64(HMAC-SHA256)"
}
```

---

### 3. External Verification Providers (GST & PAN)

**Unknown:** GSTN public API vs. licensed reseller for GST; NSDL / Protean / other provider for PAN.

**Decision:**
- **GST:** GSTN public API (free tier, rate-limited ~50 req/min per IP); escalate to licensed reseller (NIC / CDSL) on production if volume exceeds limits.
- **PAN:** Protean (by NSDL) — industry standard, REST API, per-verification fee (~₹1–2).

**Rationale:**
- **GST (public API):** GSTN provides free tier with 100k+ txn/year capacity (sufficient for Pune chapter MVP). Switch to licensed reseller if rate-limit exceeded in production (scalability path documented).
- **PAN (Protean):** NSDL's Protean service is most reliable; REST endpoint; sub-100ms verification; per-verification cost is minimal (~₹1–2) relative to membership fee (~₹5–50k).

**Implementation:**
- `src/services/external/gst/index.ts` → adapter interface `IGSTVerificationService` → provider implementations:
  - `gstn-public.ts` (primary, free)
  - `cdsl-licensed.ts` (fallback, paid)
- `src/services/external/pan/index.ts` → adapter interface `IPANVerificationService` → `protean.ts`
- Both wrapped in pg-boss worker with exponential backoff (1s, 2s, 4s, 8s, 16s, 32s).
- Non-blocking submission (verification status as first-class application field, "Pending" until resolved).
- Scrutiniser can re-trigger verification from approval panel (useful for stale data).

**Cost estimate:** ₹1–2 per PAN verification; ~500–1000 active members × renewal + new applicants = ~2000–3000 verifications/year = ₹2–6k annually.

---

### 4. Document-Signing Certificate Provider & HSM Custody (PRD Decision on signing infrastructure)

**Unknown:** Certificate provider (CA) and private-key custody (HSM vs. cloud KMS).

**Decision: Amazon Web Services Certificate Manager (ACM) + AWS KMS** for document-signing certificate lifecycle.

**Rationale:**
- **Certificate:** AWS ACM managed certificate (or external CA cert uploaded to ACM).
  - Automatic renewal (60 days pre-expiry).
  - Private key never exposed (stored in KMS, never downloadable).
- **Key custody:** AWS KMS (Hardware Security Module equivalent).
  - FIPS 140-2 Level 2 certified.
  - Key rotation policy (annual).
  - Audit trail of all key operations (who accessed, when, why).
  - Regional (ap-south-1 Mumbai) for data-residency compliance.
- **Alternative considered:** External Hardware Security Module (Thales Luna / Utimaco) — overkill for MVP; ~₹500k+ CAPEX + ₹100k/year opex. Rejected.

**Implementation:**
- `src/services/certificate/signer.ts` uses AWS SDK (`@aws-sdk/client-kms`) to call KMS for signing operations (never loads private key into memory).
- PDF generation: `@react-pdf/renderer` + `@signpdf/signpdf` with KMS-backed signing.
- Audit: Every signing operation logged with trace ID, actor ID, certificate fingerprint.
- Rotation: Annual KMS key rotation scheduled via `pg-boss` + CloudWatch; runbook for rotation procedure.

**Cost estimate:** KMS ~₹0.30 per 10k API calls (requests to sign ~5k certificates/year = ~₹15/month); ACM ~free (managed, no per-certificate cost).

---

### 5. Existing-Member Data Migration (PRD Decision #7)

**Unknown:** Source data format, quality, and back-fill strategy for existing members.

**Decision: Deferred to Phase 2 (not MVP scope), but schema prepared now.**

**Rationale:**
- MVP focus: New applicant onboarding + staff approval + renewal for new members.
- Existing members (~100–200) can continue with paper-based renewals in Y1 while MVP stabilizes.
- Phase 2 will import existing member data (one-time); reissue certificates with current President.
- Schema flexibility: `membership.migratedFrom` nullable field; `certificate.historicalPresident` field to preserve certificate attribution on later President changes.

**Preparation:** None for MVP. Documented as Phase 2 epic with TBD input format from CREDAI office.

---

### 6. TOTP MFA for Staff Roles

**Unknown:** In-app TOTP implementation or third-party identity service (Clerk, Auth0, Stytch).

**Decision: In-app TOTP (otplib)** integrated with Auth.js v5.

**Rationale:**
- CREDAI Pune staff unlikely to have existing Clerk / Auth0 / Stytch tenants.
- In-app TOTP is lightweight, fully customizable, and complies with Principle II (TOTP MFA required for all 6 staff roles).
- otplib provides TOTP enrolment (QR code generation) + verification (30-second window tolerance).
- Recovery codes stored in DB (hashed) for account recovery.

**Implementation:**
- `src/server/services/auth/totp.ts` exports `enrollTotp()`, `verifyTotp()`, `generateRecoveryCodes()`.
- Auth.js middleware enforces TOTP on staff routes; redirects to TOTP challenge on login.
- Staff enrolment flow: Settings → Enable MFA → Scan QR code with Authenticator app → Enter code → Save recovery codes.

**Cost estimate:** Zero (open-source library).

---

### 7. Feature Flags for Phase 2 Capabilities

**Unknown:** Feature-flag service to gate Phase 2 features (public member directory, MahaRERA live verification, SMS/WhatsApp notifications).

**Decision: LaunchDarkly** (or open-source alternative Unleash).

**Rationale:**
- LaunchDarkly: Industry standard, excellent SDK support (Node.js), fine-grained targeting (staff role, member status, feature percentage), real-time config updates.
- Alternatively: Unleash (open-source, self-hosted on K8s / EC2) if cost-conscious.
- Prevents code-branching for Phase 2 features; rollout can be staged per role / tenant.

**Phase 2 flags:**
- `publicMemberDirectory` (public, staff-configurable visibility)
- `mahaReraLiveVerification` (staff-gated, requires RERA API integration)
- `smsNotifications` (staff-gated, SMS service adapter)
- `whatsappNotifications` (staff-gated, WhatsApp service adapter)

**Cost estimate:** LaunchDarkly ~$50/month (generous free tier); Unleash self-hosted ~₹5–10k/month (EC2 t3.small + traffic).

---

## Summary Table

| Decision | Chosen | Rationale | Cost |
|---|---|---|---|
| **Hosting** | AWS Mumbai (ap-south-1) | India data-residency compliance, mature Postgres/KMS support | ₹40–60k/mo |
| **Payment gateway** | Razorpay (primary) + Cashfree (fallback) | Mature, IDempt webhooks, tokenization, settlement support | 2.99% + ₹30/txn |
| **GST verification** | GSTN public API + CDSL licensed (escalation) | Free tier sufficient for MVP; scalable fallback | ₹0–10k/year |
| **PAN verification** | Protean (NSDL) | Industry standard, REST, fast | ₹1–2 per verification |
| **Signing certificate** | AWS ACM + KMS | Auto-rotation, FIPS-certified key custody, audit trail | ₹0.30 per 10k calls |
| **Staff MFA** | In-app TOTP (otplib) | Lightweight, Auth.js-integrated, fully controlled | Free |
| **Feature flags** | LaunchDarkly | Staged rollout, real-time config, no redeploys | $50–100/mo |
| **Existing-member migration** | Deferred to Phase 2 | MVP focus on new applicants; 100–200 existing members continue paper | TBD |

---

## Next Steps

1. **Confirm with CREDAI Pune:**
   - AWS hosting (data residency, cost approval).
   - Razorpay integration (existing relationship, API access).
   - GST/PAN verification providers (approval to use GSTN + Protean APIs).

2. **Phase 1 (Data Model & Contracts):**
   - Detailed Prisma schema for all 14 capability groups.
   - tRPC procedure contracts (wizard steps, approval workflow, payment, renewal, vault, staff dashboards).
   - Email event taxonomy.
   - Audit log schema.

3. **Phase 2 (Task Generation):**
   - Implementation tasks ordered by dependency.
   - Testing strategy per user journey (wizard flow, approval workflow, renewal, payment).
   - Accessibility & performance CI gates.
