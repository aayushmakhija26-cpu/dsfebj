import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Server-side environment variables — never exposed to the browser.
   * Missing or invalid values at boot time will throw and block startup.
   */
  server: {
    // ---- Database ----
    DATABASE_URL: z
      .string()
      .url()
      .refine((v) => v.startsWith("postgresql://") || v.startsWith("postgres://"), {
        message: "DATABASE_URL must be a PostgreSQL connection string",
      }),

    // ---- NextAuth ----
    NEXTAUTH_SECRET: z.string().min(32, "NEXTAUTH_SECRET must be at least 32 characters"),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    // ---- Staff Auth Provider ----
    AUTH_GITHUB_ID: z.string().min(1).optional(),
    AUTH_GITHUB_SECRET: z.string().min(1).optional(),

    // ---- Vercel Blob (document vault) ----
    BLOB_READ_WRITE_TOKEN: z.string().min(1).optional(),

    // ---- Payment — Razorpay (primary) ----
    RAZORPAY_KEY_ID: z.string().min(1).optional(),
    RAZORPAY_KEY_SECRET: z.string().min(1).optional(),
    RAZORPAY_WEBHOOK_SECRET: z.string().min(1).optional(),

    // ---- Payment — Cashfree (fallback) ----
    CASHFREE_APP_ID: z.string().min(1).optional(),
    CASHFREE_SECRET_KEY: z.string().min(1).optional(),
    CASHFREE_WEBHOOK_SECRET: z.string().min(1).optional(),

    // ---- GST Verification ----
    GST_PROVIDER: z.enum(["mock", "gstn-public", "cdsl-licensed"]).default("mock"),
    GSTN_API_KEY: z.string().min(1).optional(),
    CDSL_GST_API_KEY: z.string().min(1).optional(),

    // ---- PAN Verification ----
    PAN_PROVIDER: z.enum(["mock", "protean"]).default("mock"),
    PROTEAN_PAN_API_KEY: z.string().min(1).optional(),

    // ---- Email ----
    EMAIL_PROVIDER: z.enum(["console", "ses", "sendgrid"]).default("console"),
    EMAIL_FROM: z.string().email().default("noreply@credaipune.org"),
    AWS_SES_REGION: z.string().min(1).optional(),
    AWS_SES_ACCESS_KEY_ID: z.string().min(1).optional(),
    AWS_SES_SECRET_ACCESS_KEY: z.string().min(1).optional(),

    // ---- AWS (KMS + general) ----
    AWS_REGION: z.string().default("ap-south-1"),
    AWS_ACCESS_KEY_ID: z.string().min(1).optional(),
    AWS_SECRET_ACCESS_KEY: z.string().min(1).optional(),
    KMS_KEY_ID: z.string().min(1).optional(),

    // ---- Cloudflare Turnstile ----
    CLOUDFLARE_TURNSTILE_SECRET_KEY: z.string().min(1).optional(),

    // ---- Rate Limiting ----
    PUBLIC_VERIFY_RATE_LIMIT: z
      .string()
      .regex(/^\d+$/, "Must be a positive integer")
      .default("100")
      .transform(Number),

    // ---- Sentry ----
    SENTRY_AUTH_TOKEN: z.string().min(1).optional(),
  },

  /**
   * Client-side environment variables — must be prefixed with NEXT_PUBLIC_.
   * These are bundled into the browser JS.
   */
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
    NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
    NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY: z.string().min(1).optional(),
  },

  /**
   * Destructure process.env here so Next.js can statically replace vars.
   */
  runtimeEnv: {
    // Server
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NODE_ENV: process.env.NODE_ENV,
    AUTH_GITHUB_ID: process.env.AUTH_GITHUB_ID,
    AUTH_GITHUB_SECRET: process.env.AUTH_GITHUB_SECRET,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
    RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,
    CASHFREE_APP_ID: process.env.CASHFREE_APP_ID,
    CASHFREE_SECRET_KEY: process.env.CASHFREE_SECRET_KEY,
    CASHFREE_WEBHOOK_SECRET: process.env.CASHFREE_WEBHOOK_SECRET,
    GST_PROVIDER: process.env.GST_PROVIDER,
    GSTN_API_KEY: process.env.GSTN_API_KEY,
    CDSL_GST_API_KEY: process.env.CDSL_GST_API_KEY,
    PAN_PROVIDER: process.env.PAN_PROVIDER,
    PROTEAN_PAN_API_KEY: process.env.PROTEAN_PAN_API_KEY,
    EMAIL_PROVIDER: process.env.EMAIL_PROVIDER,
    EMAIL_FROM: process.env.EMAIL_FROM,
    AWS_SES_REGION: process.env.AWS_SES_REGION,
    AWS_SES_ACCESS_KEY_ID: process.env.AWS_SES_ACCESS_KEY_ID,
    AWS_SES_SECRET_ACCESS_KEY: process.env.AWS_SES_SECRET_ACCESS_KEY,
    AWS_REGION: process.env.AWS_REGION,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    KMS_KEY_ID: process.env.KMS_KEY_ID,
    CLOUDFLARE_TURNSTILE_SECRET_KEY: process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY,
    PUBLIC_VERIFY_RATE_LIMIT: process.env.PUBLIC_VERIFY_RATE_LIMIT,
    SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
    // Client
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY:
      process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY,
  },

  /**
   * Allow optional values in non-production environments so developers
   * can spin up the project without every integration key configured.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
