import { describe, it, expect, vi, beforeEach } from "vitest";
import { proteanAdapter } from "@/services/external/pan/index";

const validPAN = "AAPCS2489K";

describe("PAN Verification — Protean Adapter", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns Pending when API key not configured", async () => {
    const original = process.env.PROTEAN_API_KEY;
    delete process.env.PROTEAN_API_KEY;
    const result = await proteanAdapter.verify(validPAN);
    expect(result.status).toBe("Pending");
    expect(result.errorMessage).toContain("not configured");
    process.env.PROTEAN_API_KEY = original;
  });

  it("returns Verified on successful response", async () => {
    process.env.PROTEAN_API_KEY = "test-key";
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ valid: true, name: "Kumar Builders Pvt Ltd", panStatus: "Active" }),
    } as Response);

    const result = await proteanAdapter.verify(validPAN);
    expect(result.status).toBe("Verified");
    expect(result.verified).toBe(true);
    expect(result.name).toBe("Kumar Builders Pvt Ltd");
  });

  it("returns Failed on invalid PAN", async () => {
    process.env.PROTEAN_API_KEY = "test-key";
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ valid: false, panStatus: "Invalid" }),
    } as Response);

    const result = await proteanAdapter.verify("XXXXX0000X");
    expect(result.status).toBe("Failed");
    expect(result.verified).toBe(false);
  });

  it("returns Pending on network timeout", async () => {
    process.env.PROTEAN_API_KEY = "test-key";
    global.fetch = vi.fn().mockRejectedValueOnce(new Error("Timeout"));

    const result = await proteanAdapter.verify(validPAN);
    expect(result.status).toBe("Pending");
    expect(result.errorMessage).toContain("timeout");
  });
});
