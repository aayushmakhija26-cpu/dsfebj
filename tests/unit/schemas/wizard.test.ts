import { describe, it, expect } from "vitest";
import {
  step1Schema,
  step2Schema,
  step3Schema,
  step8Schema,
  step9Schema,
  createStep4Schema,
} from "@/schemas/wizard";

describe("step1Schema", () => {
  it("accepts valid membership + firm type selection", () => {
    const data = {
      membershipType: "Ordinary",
      firmType: "Partnership",
      documentsAcknowledged: true,
    };
    expect(step1Schema.parse(data)).toMatchObject(data);
  });

  it("rejects if documentsAcknowledged is false", () => {
    expect(() =>
      step1Schema.parse({
        membershipType: "Ordinary",
        firmType: "LLP",
        documentsAcknowledged: false,
      }),
    ).toThrow();
  });
});

describe("step2Schema", () => {
  it("accepts valid applicant details", () => {
    const data = {
      applicantName: "John Doe",
      designation: "Director",
      contactPhone: "+919876543210",
      contactEmail: "john@example.com",
      emailVerified: true,
    };
    expect(step2Schema.parse(data)).toBeTruthy();
  });

  it("rejects unverified email", () => {
    expect(() =>
      step2Schema.parse({
        applicantName: "John",
        designation: "MD",
        contactPhone: "+919876543210",
        contactEmail: "john@example.com",
        emailVerified: false,
      }),
    ).toThrow();
  });
});

describe("step3Schema", () => {
  it("accepts valid firm details with correct GSTIN and PAN", () => {
    expect(() =>
      step3Schema.parse({
        firmName: "Test Builders Pvt Ltd",
        firmAddress: "123 MG Road",
        firmCity: "Pune",
        firmPincode: "411001",
        gstin: "27AABCU9603R1ZX",
        panNumber: "AABCU9603R",
        yearOfEstablishment: 2010,
      }),
    ).not.toThrow();
  });

  it("rejects invalid GSTIN format", () => {
    expect(() =>
      step3Schema.parse({
        firmName: "Test",
        firmAddress: "123 Road",
        firmCity: "Pune",
        firmPincode: "411001",
        gstin: "INVALID_GSTIN",
        panNumber: "AABCU9603R",
        yearOfEstablishment: 2010,
      }),
    ).toThrow(/GSTIN/);
  });

  it("rejects invalid PIN code", () => {
    expect(() =>
      step3Schema.parse({
        firmName: "Test",
        firmAddress: "123 Road",
        firmCity: "Pune",
        firmPincode: "12345", // 5 digits, not 6
        gstin: "27AABCU9603R1ZX",
        panNumber: "AABCU9603R",
        yearOfEstablishment: 2010,
      }),
    ).toThrow();
  });
});

describe("createStep4Schema — firm type principal minimums", () => {
  const principal = {
    name: "Test Person",
    designation: "Partner",
    email: "partner@test.com",
    phone: "+919876543210",
    address: "123 Address Street",
    panNumber: "ABCDE1234F",
  };

  it("Proprietorship accepts 1 principal", () => {
    const schema = createStep4Schema("Proprietorship");
    expect(() => schema.parse({ principals: [principal] })).not.toThrow();
  });

  it("Partnership requires at least 2 principals", () => {
    const schema = createStep4Schema("Partnership");
    expect(() => schema.parse({ principals: [principal] })).toThrow();
    expect(() => schema.parse({ principals: [principal, principal] })).not.toThrow();
  });

  it("LLP requires at least 2 principals", () => {
    const schema = createStep4Schema("LLP");
    expect(() => schema.parse({ principals: [principal] })).toThrow();
  });

  it("PrivateLimited requires at least 2 directors", () => {
    const schema = createStep4Schema("PrivateLimited");
    expect(() => schema.parse({ principals: [principal] })).toThrow();
  });
});

describe("step8Schema — Proposer/Seconder uniqueness", () => {
  const memberId1 = "550e8400-e29b-41d4-a716-446655440001";
  const memberId2 = "550e8400-e29b-41d4-a716-446655440002";

  it("accepts different proposer and seconder", () => {
    expect(() =>
      step8Schema.parse({ proposerId: memberId1, seconderId: memberId2 }),
    ).not.toThrow();
  });

  it("rejects same member as proposer and seconder", () => {
    expect(() =>
      step8Schema.parse({ proposerId: memberId1, seconderId: memberId1 }),
    ).toThrow(/different/i);
  });

  it("accepts empty (non-Associate membership types skip this step)", () => {
    expect(() => step8Schema.parse({})).not.toThrow();
  });
});

describe("step9Schema — declarations", () => {
  const valid = {
    declarationAccepted: true,
    dpdpConsentAccepted: true,
    emailOtpVerified: true,
  };

  it("accepts all accepted", () => {
    expect(() => step9Schema.parse(valid)).not.toThrow();
  });

  it("rejects if declaration not accepted", () => {
    expect(() =>
      step9Schema.parse({ ...valid, declarationAccepted: false }),
    ).toThrow();
  });

  it("rejects if DPDP consent not accepted", () => {
    expect(() =>
      step9Schema.parse({ ...valid, dpdpConsentAccepted: false }),
    ).toThrow();
  });

  it("rejects if email OTP not verified", () => {
    expect(() =>
      step9Schema.parse({ ...valid, emailOtpVerified: false }),
    ).toThrow();
  });
});
