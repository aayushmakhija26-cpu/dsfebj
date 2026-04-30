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
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ backgroundColor: "#f0f4f8" }}
    >
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-2xl">
          {/* Navy header band */}
          <div
            className="px-8 py-10 text-center"
            style={{ backgroundColor: "#1B3A6B" }}
          >
            <div
              className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full"
              style={{ backgroundColor: "#E8601C" }}
            >
              <span className="text-xl font-extrabold text-white">C</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              CREDAI
            </h1>
            <p className="mt-1 text-sm" style={{ color: "#b8cce4" }}>
              Pune Member Portal
            </p>
          </div>

          {/* Form body */}
          <div className="px-8 py-8">
            <h2 className="mb-1 text-xl font-semibold text-gray-900">
              Sign in
            </h2>
            <p className="mb-6 text-sm text-gray-500">
              Enter your email to receive a one-time passcode
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="space-y-1">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
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
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50"
                  style={errors.email ? { borderColor: "#ef4444", backgroundColor: "#fef2f2" } : {}}
                  {...register("email")}
                />
                {errors.email && (
                  <p id="email-error" role="alert" className="text-xs text-red-600">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {serverError && (
                <div
                  role="alert"
                  className="rounded-lg p-3 text-sm text-red-700"
                  style={{ backgroundColor: "#fef2f2", border: "1px solid #fca5a5" }}
                >
                  {serverError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 w-full rounded-lg px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#1B3A6B" }}
              >
                {isSubmitting ? "Sending…" : "Send passcode"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
