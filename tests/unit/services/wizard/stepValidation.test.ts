import { describe, it, expect } from "vitest";
import { validateStep } from "@/services/wizard/stepValidation";

describe("validateStep", () => {
  describe("Step 1 — Membership & Firm Type", () => {
    it("accepts valid data", async () => {
      const result = await validateStep(1, {
        membershipType: "Ordinary",
        firmType: "Partnership",
        documentsAcknowledged: true,
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it("rejects missing membershipType", async () => {
      const result = await validateStep(1, {
        firmType: "Partnership",
        documentsAcknowledged: true,
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveProperty("membershipType");
    });

    it("rejects unacknowledged documents", async () => {
      const result = await validateStep(1, {
        membershipType: "Ordinary",
        firmType: "Partnership",
        documentsAcknowledged: false,
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveProperty("documentsAcknowledged");
    });

    it("rejects invalid firmType", async () => {
      const result = await validateStep(1, {
        membershipType: "Ordinary",
        firmType: "InvalidType",
        documentsAcknowledged: true,
      });
      expect(result.valid).toBe(false);
    });
  });

  describe("Step 2 — Applicant Details", () => {
    const validStep2 = {
      applicantName: "Rajesh Kumar",
      designation: "Managing Partner",
      contactPhone: "+919876543210",
      contactEmail: "rajesh@example.com",
    };

    it("accepts valid data", async () => {
      const result = await validateStep(2, validStep2);
      expect(result.valid).toBe(true);
    });

    it("rejects invalid email", async () => {
      const result = await validateStep(2, { ...validStep2, contactEmail: "not-an-email" });
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveProperty("contactEmail");
    });

    it("rejects short applicant name", async () => {
      const result = await validateStep(2, { ...validStep2, applicantName: "R" });
      expect(result.valid).toBe(false);
    });
  });

  describe("Step 3 — Firm Details", () => {
    const validStep3 = {
      firmName: "Kumar Builders Pvt Ltd",
      firmAddress: "123 MG Road, Pune",
      firmCity: "Pune",
      firmPincode: "411001",
      gstin: "27AAPCS2489K1Z8",
      panNumber: "AAPCS2489K",
      yearOfEstablishment: 2010,
    };

    it("accepts valid data", async () => {
      const result = await validateStep(3, validStep3);
      expect(result.valid).toBe(true);
    });

    it("rejects invalid GSTIN", async () => {
      const result = await validateStep(3, { ...validStep3, gstin: "INVALID" });
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveProperty("gstin");
    });

    it("rejects invalid PAN", async () => {
      const result = await validateStep(3, { ...validStep3, panNumber: "INVALID" });
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveProperty("panNumber");
    });

    it("rejects 5-digit pincode", async () => {
      const result = await validateStep(3, { ...validStep3, firmPincode: "41100" });
      expect(result.valid).toBe(false);
    });
  });

  describe("Step 4 — Directors/Partners", () => {
    const validPrincipal = {
      name: "Jane Doe",
      designation: "Partner",
      email: "jane@example.com",
      phone: "+919876543211",
      address: "456 Baner Road, Pune",
      panNumber: "ABCDE1234F",
    };

    it("accepts valid data for Partnership (2 principals)", async () => {
      const result = await validateStep(
        4,
        { principals: [validPrincipal, { ...validPrincipal, name: "John Doe", email: "john@example.com" }] },
        { firmType: "Partnership" },
      );
      expect(result.valid).toBe(true);
    });

    it("rejects Partnership with only 1 principal", async () => {
      const result = await validateStep(
        4,
        { principals: [validPrincipal] },
        { firmType: "Partnership" },
      );
      expect(result.valid).toBe(false);
    });

    it("accepts Proprietorship with 1 principal", async () => {
      const result = await validateStep(
        4,
        { principals: [validPrincipal] },
        { firmType: "Proprietorship" },
      );
      expect(result.valid).toBe(true);
    });
  });

  describe("Step 9 — Compliance Declaration", () => {
    it("accepts both declarations accepted", async () => {
      const result = await validateStep(9, { declarationAccepted: true, dpdpConsentAccepted: true });
      expect(result.valid).toBe(true);
    });

    it("rejects if declaration not accepted", async () => {
      const result = await validateStep(9, { declarationAccepted: false, dpdpConsentAccepted: true });
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveProperty("declarationAccepted");
    });

    it("rejects if DPDP consent not given", async () => {
      const result = await validateStep(9, { declarationAccepted: true, dpdpConsentAccepted: false });
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveProperty("dpdpConsentAccepted");
    });
  });

  describe("Step 8 — Proposer & Seconder", () => {
    it("rejects same member as proposer and seconder", async () => {
      const id = "00000000-0000-0000-0000-000000000001";
      const result = await validateStep(8, { proposerId: id, seconderId: id });
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveProperty("seconderId");
    });

    it("accepts different proposer and seconder", async () => {
      const result = await validateStep(8, {
        proposerId: "00000000-0000-0000-0000-000000000001",
        seconderId: "00000000-0000-0000-0000-000000000002",
      });
      expect(result.valid).toBe(true);
    });
  });

  it("returns error for unknown step", async () => {
    const result = await validateStep(99, {});
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty("_");
  });
});
