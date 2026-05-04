import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requestOTP, getStoredOTPCode } from "@/services/auth/otp";

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
  let result;
  try {
    result = await requestOTP(email);
  } catch (error) {
    console.error("OTP generation error:", error);
    return NextResponse.json({ error: "Failed to generate OTP." }, { status: 500 });
  }

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
  // For development, log a non-sensitive debug message.
  if (process.env.NODE_ENV === "development") {
    try {
      await getStoredOTPCode(email);
      console.info(`🔐 OTP generated for ${email}`);
    } catch (error) {
      console.error("Failed to retrieve OTP code for debugging:", error instanceof Error ? error.message : "Unknown error");
    }
  }

  return NextResponse.json({ sent: true });
}
