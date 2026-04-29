import { describe, it, expect } from "vitest";
import {
  OfflinePaymentMethodSchema,
  recordOfflinePaymentSchema,
} from "@/schemas/payment";

describe("OfflinePaymentMethodSchema", () => {
  it("accepts FR-024 approved offline methods", () => {
    expect(OfflinePaymentMethodSchema.parse("Cash")).toBe("Cash");
    expect(OfflinePaymentMethodSchema.parse("Cheque")).toBe("Cheque");
    expect(OfflinePaymentMethodSchema.parse("NEFT")).toBe("NEFT");
    expect(OfflinePaymentMethodSchema.parse("DD")).toBe("DD");
  });

  it("rejects IMPS (not an accepted offline mode per FR-024)", () => {
    expect(() => OfflinePaymentMethodSchema.parse("IMPS")).toThrow();
  });

  it("rejects online methods", () => {
    expect(() => OfflinePaymentMethodSchema.parse("UPI")).toThrow();
    expect(() => OfflinePaymentMethodSchema.parse("CreditCard")).toThrow();
  });
});

describe("recordOfflinePaymentSchema", () => {
  const valid = {
    applicationId: "550e8400-e29b-41d4-a716-446655440000",
    amount: 50000,
    paymentMethod: "Cheque",
    referenceNumber: "CHQ-001",
    receivedDate: "2026-01-15",
  };

  it("accepts valid offline payment data", () => {
    expect(recordOfflinePaymentSchema.parse(valid)).toMatchObject({
      applicationId: valid.applicationId,
      amount: 50000,
      paymentMethod: "Cheque",
    });
  });

  it("rejects zero or negative amounts", () => {
    expect(() => recordOfflinePaymentSchema.parse({ ...valid, amount: 0 })).toThrow();
    expect(() => recordOfflinePaymentSchema.parse({ ...valid, amount: -100 })).toThrow();
  });

  it("rejects reference number longer than 100 characters", () => {
    expect(() =>
      recordOfflinePaymentSchema.parse({ ...valid, referenceNumber: "X".repeat(101) }),
    ).toThrow();
  });

  it("rejects when neither applicationId nor membershipRenewalId is provided", () => {
    const { applicationId: _omit, ...withoutApp } = valid;
    expect(() => recordOfflinePaymentSchema.parse(withoutApp)).toThrow();
  });
});
