"use client";

import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

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
      const result = await signIn("applicant-otp", {
        email,
        code: data.code,
        redirect: false,
      });
      if (result?.error) {
        setServerError("Invalid or expired passcode. Please try again.");
        return;
      }
      router.replace("/apply/1");
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
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
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="rounded-lg border border-border bg-card shadow-xl">
          {/* Header Section */}
          <div className="border-b border-border px-6 py-8 text-center sm:px-8">
            <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">C</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground">CredAI</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Verify your identity
            </p>
          </div>

          {/* Form Section */}
          <div className="px-6 py-8 sm:px-8">
            <div className="mb-6 space-y-2">
              <h2 className="text-xl font-semibold text-foreground">Enter your passcode</h2>
              <p className="text-sm text-muted-foreground">
                A 6-digit code was sent to <span className="font-medium text-foreground">{email}</span>
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="space-y-2">
                <label htmlFor="code" className="block text-sm font-medium text-foreground">
                  One-time passcode
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
                  className={`w-full rounded-lg border px-4 py-4 text-center text-2xl font-bold tracking-[0.5em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 transition-colors ${
                    errors.code
                      ? "border-destructive bg-background text-foreground focus-visible:ring-destructive focus-visible:ring-offset-background"
                      : "border-input bg-background text-foreground focus-visible:ring-primary focus-visible:ring-offset-background placeholder:text-muted-foreground"
                  }`}
                  {...register("code")}
                />
                {errors.code && (
                  <p id="code-error" role="alert" className="flex items-center text-xs font-medium text-destructive">
                    <span className="mr-1">⚠</span>
                    {errors.code.message}
                  </p>
                )}
              </div>

              {serverError && (
                <div role="alert" className="rounded-lg border border-destructive bg-background p-3 text-sm text-destructive">
                  <div className="flex">
                    <span className="mr-2">✕</span>
                    <span>{serverError}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-all hover:shadow-lg hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <span className="mr-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></span>
                    Verifying…
                  </span>
                ) : (
                  "Verify passcode"
                )}
              </button>
            </form>

            {/* Resend Button */}
            <div className="mt-6 space-y-3 border-t border-border pt-6">
              <p className="text-center text-sm text-muted-foreground">Didn't receive a code?</p>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || isResending}
                className="w-full rounded-lg border border-input px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : isResending
                    ? (
                      <span className="flex items-center justify-center">
                        <span className="mr-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-foreground border-t-transparent"></span>
                        Sending…
                      </span>
                    )
                    : "Resend passcode"}
              </button>
            </div>

            {/* Back Link */}
            <div className="mt-4 text-center">
              <a
                href="/login"
                className="text-sm text-muted-foreground hover:text-foreground hover:underline"
              >
                ← Use a different email
              </a>
            </div>
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
