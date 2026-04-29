// Test fixtures — deterministic seed data for all user journeys.
// These are used by unit tests, integration tests, and E2E tests.

import { randomUUID } from "crypto";

// ─── Fixed IDs for deterministic tests ───────────────────────────────────────

export const FIXTURES = {
  users: {
    applicant1: {
      id: "aaaaaaaa-0001-0001-0001-000000000001",
      email: "testapplicant1@example.com",
      phoneNumber: "+919876543210",
      userType: "Applicant" as const,
      isActive: true,
    },
    applicant2: {
      id: "aaaaaaaa-0001-0001-0001-000000000002",
      email: "testapplicant2@example.com",
      phoneNumber: "+919876543211",
      userType: "Applicant" as const,
      isActive: true,
    },
    staffScrutiniser: {
      id: "aaaaaaaa-0002-0001-0001-000000000001",
      email: "scrutiniser@credaipune.org",
      phoneNumber: "+919999000001",
      userType: "Staff" as const,
      isActive: true,
    },
    staffConvenor: {
      id: "aaaaaaaa-0002-0001-0001-000000000002",
      email: "convenor@credaipune.org",
      phoneNumber: "+919999000002",
      userType: "Staff" as const,
      isActive: true,
    },
    staffDG: {
      id: "aaaaaaaa-0002-0001-0001-000000000003",
      email: "dg@credaipune.org",
      phoneNumber: "+919999000003",
      userType: "Staff" as const,
      isActive: true,
    },
    staffSecretary: {
      id: "aaaaaaaa-0002-0001-0001-000000000004",
      email: "secretary@credaipune.org",
      phoneNumber: "+919999000004",
      userType: "Staff" as const,
      isActive: true,
    },
    staffPaymentOfficer: {
      id: "aaaaaaaa-0002-0001-0001-000000000005",
      email: "payment@credaipune.org",
      phoneNumber: "+919999000005",
      userType: "Staff" as const,
      isActive: true,
    },
    staffAdmin: {
      id: "aaaaaaaa-0002-0001-0001-000000000006",
      email: "admin@credaipune.org",
      phoneNumber: "+919999000006",
      userType: "Staff" as const,
      isActive: true,
    },
  },

  staffUsers: {
    scrutiniser: {
      id: "bbbbbbbb-0001-0001-0001-000000000001",
      userId: "aaaaaaaa-0002-0001-0001-000000000001",
      role: "Scrutiniser" as const,
      fullName: "Test Scrutiniser",
      status: "Active" as const,
    },
    convenor: {
      id: "bbbbbbbb-0001-0001-0001-000000000002",
      userId: "aaaaaaaa-0002-0001-0001-000000000002",
      role: "Convenor" as const,
      fullName: "Test Convenor",
      status: "Active" as const,
    },
    directorGeneral: {
      id: "bbbbbbbb-0001-0001-0001-000000000003",
      userId: "aaaaaaaa-0002-0001-0001-000000000003",
      role: "DirectorGeneral" as const,
      fullName: "Test Director General",
      status: "Active" as const,
    },
    secretary: {
      id: "bbbbbbbb-0001-0001-0001-000000000004",
      userId: "aaaaaaaa-0002-0001-0001-000000000004",
      role: "Secretary" as const,
      fullName: "Test Secretary",
      status: "Active" as const,
    },
    paymentOfficer: {
      id: "bbbbbbbb-0001-0001-0001-000000000005",
      userId: "aaaaaaaa-0002-0001-0001-000000000005",
      role: "PaymentOfficer" as const,
      fullName: "Test Payment Officer",
      status: "Active" as const,
    },
    admin: {
      id: "bbbbbbbb-0001-0001-0001-000000000006",
      userId: "aaaaaaaa-0002-0001-0001-000000000006",
      role: "Admin" as const,
      fullName: "Test Admin",
      status: "Active" as const,
    },
  },

  applications: {
    draftOrdinaryPartnership: {
      id: "cccccccc-0001-0001-0001-000000000001",
      applicantId: "dddddddd-0001-0001-0001-000000000001",
      applicationNumber: "CPN/ORD/2026/0001",
      membershipType: "Ordinary" as const,
      firmType: "Partnership" as const,
      firmName: "Test Builders Partnership",
      firmAddress: "123 Test Street, Pune, Maharashtra",
      status: "Draft" as const,
      currentStepNumber: 1,
      isComplete: false,
    },
    submittedOrdinaryLLP: {
      id: "cccccccc-0001-0001-0001-000000000002",
      applicantId: "dddddddd-0001-0001-0001-000000000002",
      applicationNumber: "CPN/ORD/2026/0002",
      membershipType: "Ordinary" as const,
      firmType: "LLP" as const,
      firmName: "Test LLP Builders",
      firmAddress: "456 Demo Road, Pune, Maharashtra",
      status: "Submitted" as const,
      currentStepNumber: 12,
      isComplete: true,
    },
    underScrutinyAssociate: {
      id: "cccccccc-0001-0001-0001-000000000003",
      applicantId: "dddddddd-0001-0001-0001-000000000003",
      applicationNumber: "CPN/ASC/2026/0001",
      membershipType: "Associate" as const,
      firmType: "PrivateLimited" as const,
      firmName: "Test Pvt Ltd",
      firmAddress: "789 Sample Lane, Pune, Maharashtra",
      status: "UnderScrutiny" as const,
      currentStepNumber: 12,
      isComplete: true,
    },
  },

  payments: {
    onlinePending: {
      id: "eeeeeeee-0001-0001-0001-000000000001",
      applicationId: "cccccccc-0001-0001-0001-000000000001",
      paymentType: "Online" as const,
      amount: 50000,
      currency: "INR",
      status: "Pending" as const,
      gateway: "Razorpay" as const,
    },
    offlineCheque: {
      id: "eeeeeeee-0001-0001-0001-000000000002",
      applicationId: "cccccccc-0001-0001-0001-000000000002",
      paymentType: "Offline" as const,
      amount: 50000,
      currency: "INR",
      status: "Reconciled" as const,
      offlinePaymentMethod: "Cheque" as const,
      offlineReferenceNumber: "CHQ-TEST-001",
    },
  },

  president: {
    active: {
      id: "ffffffff-0001-0001-0001-000000000001",
      fullName: "Test President",
      emailAddress: "president@credaipune.org",
      phone: "+919888000001",
      signatureImageKey: "presidents/test-signature.png",
      startDate: new Date("2025-01-01"),
      status: "Active" as const,
    },
  },
} as const;

// Factory for creating unique test IDs when fixtures need fresh records
export function testId(): string {
  return randomUUID();
}
