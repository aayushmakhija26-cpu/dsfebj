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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="rounded-lg border border-slate-200 bg-white shadow-xl">
          {/* Header Section */}
          <div className="border-b border-slate-200 px-6 py-8 text-center sm:px-8">
            <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
              <span className="text-lg font-bold text-white">C</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900">CredAI</h1>
            <p className="mt-2 text-sm text-slate-600">
              Member Portal
            </p>
          </div>

          {/* Form Section */}
          <div className="px-6 py-8 sm:px-8">
            <div className="mb-6 space-y-2">
              <h2 className="text-xl font-semibold text-slate-900">Welcome back</h2>
              <p className="text-sm text-slate-500">
                Enter your email address and we'll send you a one-time passcode to sign in
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-slate-900">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  placeholder="you@example.com"
                  aria-invalid={errors.email ? "true" : undefined}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className={`w-full rounded-lg border px-4 py-3 text-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 ${
                    errors.email
                      ? "border-red-300 bg-red-50 text-slate-900 focus-visible:ring-red-500 focus-visible:ring-offset-red-50"
                      : "border-slate-300 bg-white text-slate-900 focus-visible:ring-blue-500 focus-visible:ring-offset-slate-50"
                  }`}
                  {...register("email")}
                />
                {errors.email && (
                  <p id="email-error" role="alert" className="flex items-center text-xs font-medium text-red-600">
                    <span className="mr-1">⚠</span>
                    {errors.email.message}
                  </p>
                )}
              </div>

              {serverError && (
                <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <div className="flex">
                    <span className="mr-2">✕</span>
                    <span>{serverError}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <span className="mr-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                    Sending…
                  </span>
                ) : (
                  "Send passcode"
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-500">
              Don't have an account?{" "}
              <a href="/signup" className="font-medium text-blue-600 hover:text-blue-700 hover:underline">
                Create one
              </a>
            </p>
          </div>
        </div>

        {/* Footer Info */}
        <p className="mt-6 text-center text-xs text-slate-500">
          By signing in, you agree to our{" "}
          <a href="#" className="text-blue-600 hover:underline">
            Terms of Service
          </a>
        </p>
      </div>
    </div>
  );
}
