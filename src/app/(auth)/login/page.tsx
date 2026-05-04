"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";

const schema = z.object({
  email: z.string().email("Please enter a valid email address"),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setServerError(json.error ?? "Failed to send OTP. Please try again.");
        return;
      }
      router.push(`/login/verify?email=${encodeURIComponent(data.email)}`);
    } catch {
      setServerError("Network error. Please check your connection.");
    } finally {
      setIsSubmitting(false);
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
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: "#E8601C",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: 18,
              }}
            >
              C
            </div>
            <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: "0.02em" }}>CREDAI Pune</span>
          </div>
        </div>

        <div>
          <p style={{ fontSize: 13, color: "#94a8c0", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Member Portal
          </p>
          <h2 style={{ fontSize: 36, fontWeight: 800, lineHeight: 1.15, marginBottom: 16 }}>
            Your membership,<br />managed simply.
          </h2>
          <p style={{ fontSize: 15, color: "#94a8c0", lineHeight: 1.6 }}>
            Apply for membership, track your application status, and manage your profile — all in one place.
          </p>
        </div>

        <div style={{ fontSize: 12, color: "#6b829e" }}>
          © {new Date().getFullYear()} CREDAI Pune Metro. All rights reserved.
        </div>
      </div>

      {/* Right panel — form */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8fafc",
          padding: "48px 24px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 400 }}>
          {/* Mobile logo */}
          <div className="lg:hidden" style={{ marginBottom: 32, textAlign: "center" }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                backgroundColor: "#1B3A6B",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: 20,
                color: "#fff",
                marginBottom: 8,
              }}
            >
              C
            </div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#0f2544" }}>CREDAI Pune</div>
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
            Sign in
          </h1>
          <p style={{ fontSize: 14, color: "#64748b", marginBottom: 32 }}>
            We'll send a one-time code to your email.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div style={{ marginBottom: 20 }}>
              <label
                htmlFor="email"
                style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="you@company.com"
                aria-invalid={errors.email ? "true" : undefined}
                aria-describedby={errors.email ? "email-error" : undefined}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "11px 14px",
                  fontSize: 14,
                  borderRadius: 8,
                  border: errors.email ? "1.5px solid #ef4444" : "1.5px solid #d1d5db",
                  backgroundColor: errors.email ? "#fef2f2" : "#fff",
                  color: "#111827",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s",
                }}
                {...register("email")}
              />
              {errors.email && (
                <p id="email-error" role="alert" style={{ marginTop: 5, fontSize: 12, color: "#ef4444" }}>
                  {errors.email.message}
                </p>
              )}
            </div>

            {serverError && (
              <div
                role="alert"
                style={{
                  marginBottom: 16,
                  padding: "10px 14px",
                  borderRadius: 8,
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                  fontSize: 13,
                  color: "#b91c1c",
                }}
              >
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
                transition: "background-color 0.15s",
                letterSpacing: "0.01em",
              }}
              onMouseEnter={(e) => { if (!isSubmitting) e.currentTarget.style.backgroundColor = "#163260"; }}
              onMouseLeave={(e) => { if (!isSubmitting) e.currentTarget.style.backgroundColor = "#1B3A6B"; }}
            >
              {isSubmitting ? "Sending code…" : "Continue with email"}
            </button>
          </form>

          <p style={{ marginTop: 24, fontSize: 12, color: "#94a3b8", textAlign: "center" }}>
            For member access only. Contact your chapter coordinator if you need help.
          </p>
        </div>
      </div>
    </div>
  );
}
