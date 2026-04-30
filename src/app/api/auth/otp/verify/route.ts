import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyOTP } from "@/services/auth/otp";

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

  // Verify OTP — this creates/upserts the user in the database
  const result = await verifyOTP(email, code);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid or expired passcode" },
      { status: 401 },
    );
  }

  // OTP is valid and user exists — client will handle sign-in via NextAuth
  return NextResponse.json({ success: true, userId: result.userId });
}
