import { describe, it, expect } from "vitest";
import {
  MembershipTypeSchema,
  FirmTypeSchema,
  ApplicationStatusSchema,
  createApplicationSchema,
} from "@/schemas/application";

describe("MembershipTypeSchema", () => {
  it("accepts valid membership types", () => {
    expect(MembershipTypeSchema.parse("Ordinary")).toBe("Ordinary");
    expect(MembershipTypeSchema.parse("Associate")).toBe("Associate");
    expect(MembershipTypeSchema.parse("RERAProject")).toBe("RERAProject");
  });

  it("rejects invalid types", () => {
    expect(() => MembershipTypeSchema.parse("Gold")).toThrow();
    expect(() => MembershipTypeSchema.parse("Verification")).toThrow();
  });
});

describe("ApplicationStatusSchema", () => {
  it("accepts all valid status values (spec.md names)", () => {
    const validStatuses = [
      "Draft",
      "Submitted",
      "UnderScrutiny",
      "AtConvenor",
      "AtDirectorGeneral",
      "AtSecretary",
      "Approved",
      "CertificateIssued",
      "Rejected",
    ];
    for (const status of validStatuses) {
      expect(ApplicationStatusSchema.parse(status)).toBe(status);
    }
  });

  it("rejects deprecated plan.md shorthand names", () => {
    expect(() => ApplicationStatusSchema.parse("Verification")).toThrow();
    expect(() => ApplicationStatusSchema.parse("Convenor")).toThrow();
    expect(() => ApplicationStatusSchema.parse("DG")).toThrow();
    expect(() => ApplicationStatusSchema.parse("Secretary")).toThrow();
  });
});

describe("FirmTypeSchema", () => {
  it("accepts all 7 firm types", () => {
    const types = [
      "Proprietorship",
      "Partnership",
      "PrivateLimited",
      "LLP",
      "PublicSector",
      "AOP",
      "CooperativeSociety",
    ];
    for (const t of types) {
      expect(FirmTypeSchema.parse(t)).toBe(t);
    }
  });
});

describe("createApplicationSchema", () => {
  it("accepts valid application data", () => {
    const data = {
      membershipType: "Ordinary",
      firmType: "Partnership",
      firmName: "ABC Builders",
      firmAddress: "123 Test St, Pune",
    };
    expect(createApplicationSchema.parse(data)).toMatchObject(data);
  });

  it("rejects empty firm name", () => {
    expect(() =>
      createApplicationSchema.parse({
        membershipType: "Ordinary",
        firmType: "Partnership",
        firmName: "",
        firmAddress: "123 Test St",
      }),
    ).toThrow();
  });

  it("rejects firm name exceeding 200 characters", () => {
    expect(() =>
      createApplicationSchema.parse({
        membershipType: "Ordinary",
        firmType: "LLP",
        firmName: "A".repeat(201),
        firmAddress: "123 Test St",
      }),
    ).toThrow();
  });
});
