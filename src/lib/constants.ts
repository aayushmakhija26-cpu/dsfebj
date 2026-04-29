// ─── Membership ───────────────────────────────────────────────────────────────

export const MEMBERSHIP_TYPES = ["Ordinary", "Associate", "RERAProject"] as const;

export const FIRM_TYPES = [
  "Proprietorship",
  "Partnership",
  "PrivateLimited",
  "LLP",
  "PublicSector",
  "AOP",
  "CooperativeSociety",
] as const;

// Minimum number of principals required per firm type
export const FIRM_PRINCIPAL_MINIMUMS: Record<string, number> = {
  Proprietorship: 1,
  Partnership: 2,
  PrivateLimited: 2,
  LLP: 2,
  PublicSector: 2,
  AOP: 2,
  CooperativeSociety: 2,
};

// ─── Roles ────────────────────────────────────────────────────────────────────

export const STAFF_ROLES = [
  "Scrutiniser",
  "Convenor",
  "DirectorGeneral",
  "Secretary",
  "PaymentOfficer",
  "Admin",
] as const;

// ─── Application Number Format ────────────────────────────────────────────────

export const APPLICATION_NUMBER_PREFIXES: Record<string, string> = {
  Ordinary: "ORD",
  Associate: "ASC",
  RERAProject: "RERA",
};

// ─── Document ─────────────────────────────────────────────────────────────────

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"] as const;

// ─── Auth & Sessions ──────────────────────────────────────────────────────────

export const OTP_LENGTH = 6;
export const OTP_EXPIRY_SECONDS = 120; // 2 minutes
export const OTP_MAX_ATTEMPTS = 3;
export const OTP_MAX_REQUESTS_PER_HOUR = 3; // per email address

export const STAFF_SESSION_IDLE_TIMEOUT_SECONDS = 30 * 60; // 30 min
export const STAFF_SESSION_ABSOLUTE_TIMEOUT_SECONDS = 8 * 60 * 60; // 8 h

// ─── Renewals ────────────────────────────────────────────────────────────────

export const RENEWAL_REMINDER_DAYS_T30 = 30;
export const RENEWAL_REMINDER_DAYS_T15 = 15;
export const MEMBERSHIP_GRACE_PERIOD_DAYS = 60;

// ─── Payment ─────────────────────────────────────────────────────────────────

export const PAYMENT_CURRENCY = "INR";
export const GST_RATE_PERCENT = 18;
export const CGST_RATE_PERCENT = 9;
export const SGST_RATE_PERCENT = 9;

// ─── Verification ────────────────────────────────────────────────────────────

export const EXTERNAL_VERIFICATION_MAX_RETRIES = 5;
export const EXTERNAL_VERIFICATION_BACKOFF_SECONDS = [1, 2, 4, 8, 16, 32];

// ─── Rate Limiting ────────────────────────────────────────────────────────────

export const PUBLIC_VERIFY_DEFAULT_RATE_LIMIT = 100; // requests per minute per IP

// ─── Application Workflow ────────────────────────────────────────────────────

export const APPLICATION_APPROVAL_STAGES = [
  "Scrutiniser",
  "Convenor",
  "DirectorGeneral",
  "Secretary",
] as const;

// Status transitions allowed from each state
export const APPLICATION_STATUS_TRANSITIONS: Record<string, string[]> = {
  Draft: ["Submitted"],
  Submitted: ["UnderScrutiny"],
  UnderScrutiny: ["AtConvenor", "Draft", "Rejected"],
  AtConvenor: ["AtDirectorGeneral", "UnderScrutiny", "Rejected"],
  AtDirectorGeneral: ["AtSecretary", "UnderScrutiny", "Rejected"],
  AtSecretary: ["Approved", "UnderScrutiny", "Rejected"],
  Approved: ["CertificateIssued"],
  CertificateIssued: [],
  Rejected: [],
};

// ─── Wizard ───────────────────────────────────────────────────────────────────

export const WIZARD_TOTAL_STEPS = 12;
export const WIZARD_AUTO_SAVE_INTERVAL_MS = 30_000; // 30 seconds

// Documents required per membership type
export const REQUIRED_DOCUMENTS_BY_MEMBERSHIP: Record<string, string[]> = {
  Ordinary: ["PAN", "GST", "ROC", "CoC", "BankAccount", "ProposerForm", "SeconderForm"],
  Associate: ["PAN", "GST", "ROC", "CoC", "BankAccount", "ProposerForm", "SeconderForm"],
  RERAProject: ["PAN", "RERA", "CoC", "BankAccount"],
};
