import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requestOTP, getStoredOTPCode } from "@/services/auth/otp";
import { logger } from "@/lib/logging";

const bodySchema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }

  const { email } = parsed.data;
  const result = await requestOTP(email);

  if (!result.success) {
    if (result.error === "rate_limited") {
      return NextResponse.json(
        { error: "Too many requests. Please wait before requesting another OTP." },
        { status: 429 },
      );
    }
    return NextResponse.json({ error: "Failed to generate OTP." }, { status: 500 });
  }

  // In production, enqueue an email with the OTP code.
  // For development, log the OTP so it can be retrieved without email setup.
  if (process.env.NODE_ENV === "development") {
    const code = await getStoredOTPCode(email);
    logger.info({ email, otp: code }, "DEV: OTP generated — check logs");
  }

  return NextResponse.json({ sent: true });
}
