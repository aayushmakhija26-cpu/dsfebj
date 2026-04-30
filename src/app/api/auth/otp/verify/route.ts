import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyOTP } from "@/services/auth/otp";
import { signIn } from "@/server/auth";

const bodySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6).regex(/^\d{6}$/),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email or code format" }, { status: 400 });
  }

  const { email, code } = parsed.data;

  // Verify OTP
  const result = await verifyOTP(email, code);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid or expired passcode" },
      { status: 401 },
    );
  }

  // OTP is valid, sign in the user
  const signInResult = await signIn("applicant-otp", {
    email,
    code,
    redirect: false,
  });

  if (!signInResult || signInResult.error) {
    return NextResponse.json(
      { error: "Failed to sign in" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
