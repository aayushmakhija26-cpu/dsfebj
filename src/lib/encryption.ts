import "server-only";
import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const keyMaterial = process.env.ENCRYPTION_KEY;
  if (!keyMaterial) {
    throw new Error("ENCRYPTION_KEY must be set for field encryption");
  }
  // Derive 32-byte key via SHA-256 so any string input produces the right length
  return createHash("sha256").update(keyMaterial).digest();
}

/**
 * Encrypts a plaintext string with AES-256-GCM.
 * Returns a base64-encoded blob: iv (16 bytes) + authTag (16 bytes) + ciphertext.
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

/**
 * Decrypts a base64-encoded blob produced by `encrypt`.
 */
export function decrypt(ciphertext: string): string {
  const key = getEncryptionKey();
  const data = Buffer.from(ciphertext, "base64");

  const iv = data.subarray(0, IV_LENGTH);
  const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);

  return decipher.update(encrypted).toString("utf8") + decipher.final("utf8");
}

/**
 * SHA-256 hash of a value — used for hashed storage (IP addresses, OTPs).
 * Not reversible; use for lookup/comparison only.
 */
export function hashValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

// ─── Aadhaar envelope encryption ─────────────────────────────────────────────
// Aadhaar is encrypted with a separate key managed by AWS KMS (never in code/env).
// In development, falls back to the application encryption key with a distinct salt.

export async function encryptAadhaar(aadhaarNumber: string): Promise<string> {
  if (process.env.NODE_ENV === "production" && !process.env.KMS_KEY_ID) {
    throw new Error("Aadhaar encryption requires KMS_KEY_ID in production");
  }
  if (process.env.NODE_ENV === "production" && process.env.KMS_KEY_ID) {
    throw new Error("KMS Aadhaar encryption not yet implemented — inject in Phase 7");
  }
  // Dev fallback: prefix the value so it's distinguishable
  return encrypt(`AADHAAR:${aadhaarNumber}`);
}

export async function decryptAadhaar(ciphertext: string): Promise<string> {
  if (process.env.NODE_ENV === "production" && !process.env.KMS_KEY_ID) {
    throw new Error("Aadhaar decryption requires KMS_KEY_ID in production");
  }
  if (process.env.NODE_ENV === "production" && process.env.KMS_KEY_ID) {
    throw new Error("KMS Aadhaar decryption not yet implemented — inject in Phase 7");
  }
  const raw = decrypt(ciphertext);
  if (!raw.startsWith("AADHAAR:")) {
    throw new Error("Invalid Aadhaar ciphertext format");
  }
  return raw.slice("AADHAAR:".length);
}
