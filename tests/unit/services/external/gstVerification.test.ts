import { describe, it, expect, vi, beforeEach } from "vitest";
import { gstnPublicAdapter, cdslLicensedAdapter } from "@/services/external/gst/index";

const validGSTIN = "27AAPCS2489K1Z8";
const invalidGSTIN = "INVALID_GSTIN";

describe("GST Verification Adapters", () => {
  describe("gstnPublicAdapter", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it("returns Pending when API key not configured", async () => {
      const original = process.env.GSTN_API_KEY;
      delete process.env.GSTN_API_KEY;
      const result = await gstnPublicAdapter.verify(validGSTIN);
      expect(result.status).toBe("Pending");
      expect(result.errorMessage).toContain("not configured");
      process.env.GSTN_API_KEY = original;
    });

    it("returns Verified on successful API response", async () => {
      process.env.GSTN_API_KEY = "test-key";
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ legalName: "Kumar Builders", status: "Active", regDate: "2010-01-01" }),
      } as Response);

      const result = await gstnPublicAdapter.verify(validGSTIN);
      expect(result.status).toBe("Verified");
      expect(result.verified).toBe(true);
      expect(result.legalName).toBe("Kumar Builders");
    });

    it("returns Failed on non-Active GSTN status", async () => {
      process.env.GSTN_API_KEY = "test-key";
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ legalName: "Old Firm", status: "Cancelled" }),
      } as Response);

      const result = await gstnPublicAdapter.verify(invalidGSTIN);
      expect(result.status).toBe("Failed");
      expect(result.verified).toBe(false);
    });

    it("returns Pending on network timeout", async () => {
      process.env.GSTN_API_KEY = "test-key";
      global.fetch = vi.fn().mockRejectedValueOnce(new Error("AbortError"));

      const result = await gstnPublicAdapter.verify(validGSTIN);
      expect(result.status).toBe("Pending");
      expect(result.errorMessage).toContain("timeout");
    });

    it("returns Failed on 4xx HTTP error", async () => {
      process.env.GSTN_API_KEY = "test-key";
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: "Not found" }),
      } as unknown as Response);

      const result = await gstnPublicAdapter.verify(invalidGSTIN);
      expect(result.status).toBe("Failed");
    });
  });

  describe("cdslLicensedAdapter", () => {
    it("returns Pending when API key not configured", async () => {
      const original = process.env.CDSL_GST_API_KEY;
      delete process.env.CDSL_GST_API_KEY;
      const result = await cdslLicensedAdapter.verify(validGSTIN);
      expect(result.status).toBe("Pending");
      process.env.CDSL_GST_API_KEY = original;
    });

    it("returns Verified on active entity", async () => {
      process.env.CDSL_GST_API_KEY = "test-key";
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ active: true, entityName: "Test Firm Ltd" }),
      } as Response);

      const result = await cdslLicensedAdapter.verify(validGSTIN);
      expect(result.status).toBe("Verified");
      expect(result.legalName).toBe("Test Firm Ltd");
    });
  });
});
