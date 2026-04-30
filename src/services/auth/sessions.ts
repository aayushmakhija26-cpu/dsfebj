import "server-only";
import { db } from "@/server/db";
import { logger } from "@/lib/logging";
import {
  STAFF_SESSION_IDLE_TIMEOUT_SECONDS,
  STAFF_SESSION_ABSOLUTE_TIMEOUT_SECONDS,
} from "@/lib/constants";

export async function revokeSession(sessionToken: string): Promise<void> {
  try {
    await db.session.delete({ where: { sessionToken } });
    logger.info({ sessionToken: "[redacted]" }, "Session revoked");
  } catch {
    // Session may already be gone — not an error
  }
}

export async function isSessionValid(sessionToken: string): Promise<boolean> {
  const session = await db.session.findUnique({
    where: { sessionToken },
    select: { expires: true },
  });
  if (!session) return false;
  return session.expires > new Date();
}

export async function enforceStaffIdleTimeout(
  sessionToken: string,
  lastActivity: Date,
): Promise<boolean> {
  const idleSeconds = (Date.now() - lastActivity.getTime()) / 1000;
  if (idleSeconds > STAFF_SESSION_IDLE_TIMEOUT_SECONDS) {
    await revokeSession(sessionToken);
    logger.info({ idle: Math.round(idleSeconds) }, "Staff session expired: idle timeout");
    return false;
  }
  return true;
}

export async function enforceAbsoluteTimeout(
  sessionCreatedAt: Date,
): Promise<boolean> {
  const ageSeconds = (Date.now() - sessionCreatedAt.getTime()) / 1000;
  return ageSeconds <= STAFF_SESSION_ABSOLUTE_TIMEOUT_SECONDS;
}
