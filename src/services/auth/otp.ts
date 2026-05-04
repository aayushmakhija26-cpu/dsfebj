import "server-only";
import { db } from "@/server/db";
import {
  OTP_LENGTH,
  OTP_EXPIRY_SECONDS,
  OTP_MAX_ATTEMPTS,
  OTP_MAX_REQUESTS_PER_HOUR,
} from "@/lib/constants";

function generateOTP(): string {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < OTP_LENGTH; i++) {
    // Use crypto.getRandomValues for secure random generation
    const array = new Uint8Array(1);
    crypto.getRandomValues(array);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    otp += digits[array[0]! % 10];
  }
  return otp;
}

export interface OTPRequestResult {
  success: boolean;
  error?: "rate_limited" | "internal";
}

export interface OTPVerifyResult {
  success: boolean;
  userId?: string;
  error?: "invalid" | "expired" | "max_attempts";
}

export async function requestOTP(email: string): Promise<OTPRequestResult> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  // Count requests in the last hour for this email
  const recentCount = await db.verificationToken.count({
    where: {
      identifier: `otp:${email}`,
      expires: { gt: oneHourAgo },
    },
  });

  if (recentCount >= OTP_MAX_REQUESTS_PER_HOUR) {
    console.warn(`OTP rate limit exceeded for ${email}`);
    return { success: false, error: "rate_limited" };
  }

  // Invalidate any existing OTPs for this email
  await db.verificationToken.deleteMany({
    where: { identifier: `otp:${email}` },
  });

  const code = generateOTP();
  const expires = new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000);

  // Store OTP with attempt counter encoded in token: "code:attempts"
  await db.verificationToken.create({
    data: {
      identifier: `otp:${email}`,
      token: `${code}:0`,
      expires,
    },
  });

  console.info(`OTP generated for ${email}`);
  return { success: true };
}

export async function verifyOTP(email: string, code: string): Promise<OTPVerifyResult> {
  const record = await db.verificationToken.findFirst({
    where: {
      identifier: `otp:${email}`,
      expires: { gt: new Date() },
    },
  });

  if (!record) {
    return { success: false, error: "expired" };
  }

  const [storedCode, attemptsStr] = record.token.split(":") as [string, string];
  const attempts = parseInt(attemptsStr, 10);

  if (attempts >= OTP_MAX_ATTEMPTS) {
    await db.verificationToken.delete({ where: { identifier_token: { identifier: record.identifier, token: record.token } } });
    return { success: false, error: "max_attempts" };
  }

  if (storedCode !== code) {
    // Increment attempt counter
    await db.verificationToken.update({
      where: { identifier_token: { identifier: record.identifier, token: record.token } },
      data: { token: `${storedCode}:${attempts + 1}` },
    });
    return { success: false, error: "invalid" };
  }

  // Valid OTP — atomically upsert user and consume OTP in transaction to prevent replay
  const [user] = await db.$transaction([
    db.user.upsert({
      where: { email },
      create: {
        email,
        userType: "Applicant",
        applicant: { create: {} },
      },
      update: {},
      select: { id: true },
    }),
    // Consume OTP by deleting it atomically with user upsert
    db.verificationToken.delete({
      where: { identifier_token: { identifier: record.identifier, token: record.token } },
    }),
  ]);

  console.info(`OTP verified for ${email} (user ${user.id})`);
  return { success: true, userId: user.id };
}

// Retrieve OTP code for sending via email (called by email queue)
export async function getStoredOTPCode(email: string): Promise<string | null> {
  const record = await db.verificationToken.findFirst({
    where: {
      identifier: `otp:${email}`,
      expires: { gt: new Date() },
    },
  });
  if (!record) return null;
  const [code] = record.token.split(":") as [string];
  return code;
}
