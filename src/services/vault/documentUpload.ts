import "server-only";
import { MAX_FILE_SIZE_BYTES, ALLOWED_MIME_TYPES } from "@/lib/constants";
import { logger } from "@/lib/logging";

export interface UploadResult {
  success: boolean;
  storageKey?: string;
  error?: string;
}

export interface UploadParams {
  file: File;
  documentType: string;
  applicationId?: string;
  userId: string;
}

// Generate a unique storage key for Vercel Blob
function generateStorageKey(userId: string, documentType: string, fileName: string): string {
  const ext = fileName.split(".").pop() ?? "bin";
  const ts = Date.now();
  return `docs/${userId}/${documentType}/${ts}.${ext}`;
}

export async function uploadDocument(params: UploadParams): Promise<UploadResult> {
  const { file, documentType, userId } = params;

  // Validate size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { success: false, error: "File exceeds 10 MB limit" };
  }

  // Validate MIME type
  const allowedTypes = ALLOWED_MIME_TYPES as readonly string[];
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: "Only PDF, JPEG, and PNG files are accepted" };
  }

  const storageKey = generateStorageKey(userId, documentType, file.name);

  // In production: use Vercel Blob SDK to upload
  // import { put } from "@vercel/blob";
  // const blob = await put(storageKey, file, { access: "private" });
  // return { success: true, storageKey: blob.url };

  // For Phase 3, return the generated key (Vercel Blob integration in later phase)
  if (process.env.NODE_ENV === "development") {
    logger.info({ storageKey, documentType, size: file.size }, "DEV: document upload simulated");
    return { success: true, storageKey };
  }

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken) {
    logger.error("BLOB_READ_WRITE_TOKEN not set — uploads disabled");
    return { success: false, error: "File storage is not configured" };
  }

  try {
    // Vercel Blob upload
    const { put } = await import("@vercel/blob");
    const arrayBuffer = await file.arrayBuffer();
    const blob = await put(storageKey, arrayBuffer, {
      access: "private",
      token: blobToken,
      contentType: file.type,
    });

    return { success: true, storageKey: blob.url };
  } catch (err) {
    logger.error({ error: String(err) }, "Blob upload failed");
    return { success: false, error: "Upload failed. Please try again." };
  }
}
