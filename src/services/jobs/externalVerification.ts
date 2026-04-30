import "server-only";
import { type Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { verifyGST } from "@/services/external/gst/index";
import { verifyPAN } from "@/services/external/pan/index";
import { EXTERNAL_VERIFICATION_MAX_RETRIES, EXTERNAL_VERIFICATION_BACKOFF_SECONDS } from "@/lib/constants";
import { logger } from "@/lib/logging";

export interface VerificationJobPayload {
  applicationId: string;
  verificationType: "GST" | "PAN";
  value: string; // GSTIN or PAN number
}

export async function processVerificationJob(payload: VerificationJobPayload): Promise<void> {
  const { applicationId, verificationType, value } = payload;

  const existing = await db.externalVerification.findFirst({
    where: { applicationId, verificationType },
  });

  // retriesRemaining starts at 5 and decrements on each retry
  const retriesRemaining = existing?.retriesRemaining ?? EXTERNAL_VERIFICATION_MAX_RETRIES;

  if (retriesRemaining <= 0) {
    logger.warn({ applicationId, verificationType }, "Max retries exceeded for external verification");
    if (existing) {
      await db.externalVerification.update({
        where: { id: existing.id },
        data: { status: "Failed" },
      });
    }
    return;
  }

  let result: { verified: boolean; status: "Verified" | "Failed" | "Pending"; errorMessage?: string; rawResponse?: unknown };

  if (verificationType === "GST") {
    result = await verifyGST(value);
  } else {
    result = await verifyPAN(value);
  }

  const rawJson = result as unknown as Prisma.InputJsonValue;
  const retryIndex = EXTERNAL_VERIFICATION_MAX_RETRIES - retriesRemaining;
  const backoffDelay = EXTERNAL_VERIFICATION_BACKOFF_SECONDS[retryIndex] ?? 32;

  if (result.status === "Pending") {
    logger.info({ applicationId, verificationType, retriesRemaining, backoffDelay }, "Verification pending — will retry");
    if (existing) {
      await db.externalVerification.update({
        where: { id: existing.id },
        data: { retriesRemaining: retriesRemaining - 1, rawResponse: rawJson, lastAttemptAt: new Date() },
      });
    } else {
      await db.externalVerification.create({
        data: {
          applicationId,
          verificationType,
          referenceValue: value,
          status: "Pending",
          retriesRemaining: retriesRemaining - 1,
          rawResponse: rawJson,
          lastAttemptAt: new Date(),
        },
      });
    }
    throw new Error(`Retry needed after ${backoffDelay}s`);
  }

  if (existing) {
    await db.externalVerification.update({
      where: { id: existing.id },
      data: { status: result.status, rawResponse: rawJson, verifiedAt: result.status === "Verified" ? new Date() : undefined, lastAttemptAt: new Date() },
    });
  } else {
    await db.externalVerification.create({
      data: {
        applicationId,
        verificationType,
        referenceValue: value,
        status: result.status,
        rawResponse: rawJson,
        verifiedAt: result.status === "Verified" ? new Date() : undefined,
        lastAttemptAt: new Date(),
      },
    });
  }

  logger.info({ applicationId, verificationType, status: result.status }, "External verification complete");
}

export async function enqueueVerification(payload: VerificationJobPayload): Promise<void> {
  logger.info({ ...payload }, "Enqueuing external verification job");
  void processVerificationJob(payload).catch((err: unknown) => {
    logger.error({ ...payload, error: String(err) }, "Verification job failed");
  });
}
