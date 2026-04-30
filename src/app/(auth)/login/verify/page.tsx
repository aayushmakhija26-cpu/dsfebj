"use client";

import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";

const schema = z.object({
  code: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must be digits only"),
});
type FormData = z.infer<typeof schema>;

function VerifyPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";

  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [isResending, setIsResending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  async function onSubmit(data: FormData) {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code: data.code,
        }),
      });

      const json = (await res.json()) as { error?: string; success?: boolean };

      if (!res.ok) {
        setServerError(json.error ?? "Invalid or expired passcode. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // Success — navigate to wizard
      router.replace("/apply/1");
    } catch (err) {
      console.error("Verify error:", err);
      setServerError("Network error. Please try again.");
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setServerError(null);
    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setServerError(json.error ?? "Failed to resend OTP.");
        return;
      }
      setResendCooldown(60);
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Left panel — brand */}
      <div
        style={{
          flex: "0 0 45%",
          background: "linear-gradient(160deg, #0f2544 0%, #1B3A6B 60%, #1e4d8c 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "48px",
          color: "#fff",
        }}
        className="hidden lg:flex"
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: "#E8601C", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18 }}>
            C
          </div>
          <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: "0.02em" }}>CREDAI Pune</span>
        </div>
        <div>
          <p style={{ fontSize: 13, color: "#94a8c0", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>Member Portal</p>
          <h2 style={{ fontSize: 36, fontWeight: 800, lineHeight: 1.15, marginBottom: 16 }}>Your membership,<br />managed simply.</h2>
          <p style={{ fontSize: 15, color: "#94a8c0", lineHeight: 1.6 }}>Apply for membership, track your application status, and manage your profile — all in one place.</p>
        </div>
        <div style={{ fontSize: 12, color: "#6b829e" }}>© {new Date().getFullYear()} CREDAI Pune Metro. All rights reserved.</div>
      </div>

      {/* Right panel — form */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc", padding: "48px 24px" }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          <div className="lg:hidden" style={{ marginBottom: 32, textAlign: "center" }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: "#1B3A6B", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 20, color: "#fff", marginBottom: 8 }}>C</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#0f2544" }}>CREDAI Pune</div>
          </div>

          <div style={{ marginBottom: 8 }}>
            <a href="/login" style={{ fontSize: 13, color: "#64748b", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
              ← Back
            </a>
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", marginBottom: 6, marginTop: 16 }}>
            Check your email
          </h1>
          <p style={{ fontSize: 14, color: "#64748b", marginBottom: 8 }}>
            We sent a 6-digit code to
          </p>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 32 }}>
            {email}
          </p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div style={{ marginBottom: 20 }}>
              <label htmlFor="code" style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
                One-time code
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                autoFocus
                placeholder="000000"
                aria-invalid={errors.code ? "true" : undefined}
                aria-describedby={errors.code ? "code-error" : undefined}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "14px",
                  fontSize: 28,
                  fontWeight: 700,
                  letterSpacing: "0.4em",
                  textAlign: "center",
                  borderRadius: 8,
                  border: errors.code ? "1.5px solid #ef4444" : "1.5px solid #d1d5db",
                  backgroundColor: errors.code ? "#fef2f2" : "#fff",
                  color: "#111827",
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => { if (!errors.code) e.currentTarget.style.borderColor = "#1B3A6B"; }}
                onBlur={(e) => { if (!errors.code) e.currentTarget.style.borderColor = "#d1d5db"; }}
                {...register("code")}
              />
              {errors.code && (
                <p id="code-error" role="alert" style={{ marginTop: 5, fontSize: 12, color: "#ef4444" }}>
                  {errors.code.message}
                </p>
              )}
            </div>

            {serverError && (
              <div role="alert" style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 8, backgroundColor: "#fef2f2", border: "1px solid #fecaca", fontSize: 13, color: "#b91c1c" }}>
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                display: "block",
                width: "100%",
                padding: "12px",
                borderRadius: 8,
                border: "none",
                backgroundColor: isSubmitting ? "#3d6eb5" : "#1B3A6B",
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                cursor: isSubmitting ? "not-allowed" : "pointer",
                letterSpacing: "0.01em",
              }}
              onMouseEnter={(e) => { if (!isSubmitting) e.currentTarget.style.backgroundColor = "#163260"; }}
              onMouseLeave={(e) => { if (!isSubmitting) e.currentTarget.style.backgroundColor = "#1B3A6B"; }}
            >
              {isSubmitting ? "Verifying…" : "Verify code"}
            </button>
          </form>

          <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid #e2e8f0", textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>Didn't receive a code?</p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || isResending}
              style={{
                background: "none",
                border: "none",
                fontSize: 13,
                fontWeight: 600,
                color: resendCooldown > 0 || isResending ? "#94a3b8" : "#1B3A6B",
                cursor: resendCooldown > 0 || isResending ? "not-allowed" : "pointer",
                textDecoration: resendCooldown > 0 || isResending ? "none" : "underline",
              }}
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : isResending ? "Sending…" : "Resend code"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyPageInner />
    </Suspense>
  );
}
