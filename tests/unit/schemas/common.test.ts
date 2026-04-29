import { describe, it, expect } from "vitest";
import { phoneSchema, emailSchema, uuidSchema, dateRangeSchema } from "@/schemas/common";

describe("phoneSchema", () => {
  it("accepts valid E.164 numbers", () => {
    expect(phoneSchema.parse("+919876543210")).toBe("+919876543210");
    expect(phoneSchema.parse("+12025550173")).toBe("+12025550173");
  });

  it("rejects numbers without country code", () => {
    expect(() => phoneSchema.parse("9876543210")).toThrow();
    expect(() => phoneSchema.parse("09876543210")).toThrow();
  });

  it("rejects empty string", () => {
    expect(() => phoneSchema.parse("")).toThrow();
  });
});

describe("emailSchema", () => {
  it("accepts valid emails and lowercases them", () => {
    expect(emailSchema.parse("Test@Example.COM")).toBe("test@example.com");
  });

  it("rejects invalid emails", () => {
    expect(() => emailSchema.parse("notanemail")).toThrow();
    expect(() => emailSchema.parse("@nodomain.com")).toThrow();
    expect(() => emailSchema.parse("")).toThrow();
  });
});

describe("uuidSchema", () => {
  it("accepts valid UUIDs", () => {
    expect(uuidSchema.parse("550e8400-e29b-41d4-a716-446655440000")).toBeTruthy();
  });

  it("rejects non-UUID strings", () => {
    expect(() => uuidSchema.parse("not-a-uuid")).toThrow();
    expect(() => uuidSchema.parse("")).toThrow();
  });
});

describe("dateRangeSchema", () => {
  it("accepts valid date ranges", () => {
    const result = dateRangeSchema.parse({
      from: "2026-01-01",
      to: "2026-12-31",
    });
    expect(result.from).toBeInstanceOf(Date);
    expect(result.to).toBeInstanceOf(Date);
  });

  it("rejects when from > to", () => {
    expect(() =>
      dateRangeSchema.parse({ from: "2026-12-31", to: "2026-01-01" }),
    ).toThrow();
  });

  it("accepts same-day range (from === to)", () => {
    expect(() =>
      dateRangeSchema.parse({ from: "2026-06-15", to: "2026-06-15" }),
    ).not.toThrow();
  });
});
