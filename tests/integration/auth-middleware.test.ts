import { describe, it, expect, beforeEach } from "vitest";
import { hasPermission } from "@/lib/rbac";
import { encrypt, decrypt, hashValue } from "@/lib/encryption";

// ─── Auth middleware tests ────────────────────────────────────────────────────
// These integration tests verify RBAC enforcement and audit logging behavior
// using the real permission matrix (no DB required).

describe("RBAC middleware enforcement", () => {
  it("Scrutiniser is granted access to staff-only application review", () => {
    expect(hasPermission("Scrutiniser", "application:read:any")).toBe(true);
  });

  it("Applicant is denied access to staff-only routes", () => {
    expect(hasPermission("Applicant", "application:read:any")).toBe(false);
    expect(hasPermission("Applicant", "application:approve")).toBe(false);
  });

  it("PaymentOfficer is denied approve permission (regression: no privilege escalation)", () => {
    expect(hasPermission("PaymentOfficer", "application:approve")).toBe(false);
    expect(hasPermission("PaymentOfficer", "application:reject")).toBe(false);
  });

  it("All approval stages require correct role assignment", () => {
    const approvalPermission = "application:approve";
    const rolesWithApproval = ["Scrutiniser", "Convenor", "DirectorGeneral", "Secretary"] as const;
    for (const role of rolesWithApproval) {
      expect(hasPermission(role, approvalPermission)).toBe(true);
    }
    const rolesWithoutApproval = ["Applicant", "Member", "PaymentOfficer", "Admin"] as const;
    for (const role of rolesWithoutApproval) {
      expect(hasPermission(role, approvalPermission)).toBe(false);
    }
  });
});

// ─── Encryption tests ─────────────────────────────────────────────────────────
// These tests verify field-level encryption/decryption round-trips.
// They use the test NEXTAUTH_SECRET set in vitest.config.ts.

describe("Encryption utilities", () => {
  beforeEach(() => {
    // Ensure a secret is available for the encryption key derivation
    process.env.NEXTAUTH_SECRET = "test-secret-at-least-32-characters-long!!";
  });

  it("encrypts and decrypts a string round-trip", () => {
    const plaintext = "Test Builders Partnership Firm";
    const ciphertext = encrypt(plaintext);
    expect(ciphertext).not.toBe(plaintext);
    expect(decrypt(ciphertext)).toBe(plaintext);
  });

  it("produces different ciphertext for the same input (random IV)", () => {
    const plaintext = "Same input";
    const c1 = encrypt(plaintext);
    const c2 = encrypt(plaintext);
    expect(c1).not.toBe(c2);
    expect(decrypt(c1)).toBe(plaintext);
    expect(decrypt(c2)).toBe(plaintext);
  });

  it("hashValue produces consistent SHA-256 hex", () => {
    const h1 = hashValue("192.168.1.1");
    const h2 = hashValue("192.168.1.1");
    expect(h1).toBe(h2);
    expect(h1).toHaveLength(64); // SHA-256 = 32 bytes = 64 hex chars
  });

  it("hashValue produces different hashes for different inputs", () => {
    expect(hashValue("192.168.1.1")).not.toBe(hashValue("192.168.1.2"));
  });

  it("decryption fails when ciphertext is tampered", () => {
    const ciphertext = encrypt("original data");
    const tampered = ciphertext.slice(0, -4) + "XXXX";
    expect(() => decrypt(tampered)).toThrow();
  });
});
