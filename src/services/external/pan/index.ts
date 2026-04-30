import "server-only";

export interface PANVerificationResult {
  verified: boolean;
  status: "Verified" | "Failed" | "Pending";
  name?: string;
  panStatus?: string;
  errorMessage?: string;
}

export interface IPANVerificationService {
  verify(pan: string): Promise<PANVerificationResult>;
}

// Protean (NSDL) PAN verification adapter
export const proteanAdapter: IPANVerificationService = {
  async verify(pan: string): Promise<PANVerificationResult> {
    const apiKey = process.env.PROTEAN_API_KEY;
    const apiUrl = process.env.PROTEAN_API_URL ?? "https://api.protean.in";

    if (!apiKey) {
      return { verified: false, status: "Pending", errorMessage: "PAN API not configured" };
    }

    try {
      const res = await fetch(`${apiUrl}/v1/pan/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({ pan }),
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) {
        return { verified: false, status: "Failed", errorMessage: `PAN API error: ${res.status}` };
      }

      const data = (await res.json()) as { valid?: boolean; name?: string; panStatus?: string; error?: string };

      if (data.error) {
        return { verified: false, status: "Failed", errorMessage: data.error };
      }

      return {
        verified: data.valid ?? false,
        status: data.valid ? "Verified" : "Failed",
        name: data.name,
        panStatus: data.panStatus,
      };
    } catch {
      return { verified: false, status: "Pending", errorMessage: "PAN API timeout or network error" };
    }
  },
};

export async function verifyPAN(pan: string): Promise<PANVerificationResult> {
  return proteanAdapter.verify(pan);
}
