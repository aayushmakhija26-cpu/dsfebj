import "server-only";

export interface GSTVerificationResult {
  verified: boolean;
  status: "Verified" | "Failed" | "Pending";
  legalName?: string;
  tradeName?: string;
  registrationDate?: string;
  errorMessage?: string;
}

export interface IGSTVerificationService {
  verify(gstin: string): Promise<GSTVerificationResult>;
}

// Public GSTN API adapter (primary)
export const gstnPublicAdapter: IGSTVerificationService = {
  async verify(gstin: string): Promise<GSTVerificationResult> {
    const apiKey = process.env.GSTN_API_KEY;
    if (!apiKey) {
      return { verified: false, status: "Pending", errorMessage: "GST API not configured" };
    }

    try {
      const url = `${process.env.GSTN_API_URL ?? "https://api.gstn.gov.in"}/v1.0/taxpayerDetails/${gstin}`;
      const res = await fetch(url, {
        headers: { "auth-token": apiKey },
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) {
        return { verified: false, status: "Failed", errorMessage: `API error: ${res.status}` };
      }

      const data = (await res.json()) as { legalName?: string; tradeName?: string; regDate?: string; status?: string };

      return {
        verified: data.status === "Active",
        status: data.status === "Active" ? "Verified" : "Failed",
        legalName: data.legalName,
        tradeName: data.tradeName,
        registrationDate: data.regDate,
      };
    } catch {
      return { verified: false, status: "Pending", errorMessage: "GST API timeout or network error" };
    }
  },
};

// CDSL licensed reseller adapter (fallback)
export const cdslLicensedAdapter: IGSTVerificationService = {
  async verify(gstin: string): Promise<GSTVerificationResult> {
    const apiKey = process.env.CDSL_GST_API_KEY;
    if (!apiKey) {
      return { verified: false, status: "Pending", errorMessage: "CDSL GST API not configured" };
    }

    try {
      const url = `${process.env.CDSL_GST_API_URL ?? "https://api.cdsl.in"}/gst/verify`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ gstin }),
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) {
        return { verified: false, status: "Failed", errorMessage: `CDSL API error: ${res.status}` };
      }

      const data = (await res.json()) as { active?: boolean; entityName?: string; error?: string };

      if (data.error) {
        return { verified: false, status: "Failed", errorMessage: data.error };
      }

      return {
        verified: data.active ?? false,
        status: data.active ? "Verified" : "Failed",
        legalName: data.entityName,
      };
    } catch {
      return { verified: false, status: "Pending", errorMessage: "CDSL API timeout or network error" };
    }
  },
};

// Primary with automatic fallback
export async function verifyGST(gstin: string): Promise<GSTVerificationResult> {
  const primary = await gstnPublicAdapter.verify(gstin);
  if (primary.status !== "Pending") return primary;
  return cdslLicensedAdapter.verify(gstin);
}
