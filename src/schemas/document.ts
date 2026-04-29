import { z } from "zod";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const DocumentTypeSchema = z.enum([
  "PAN",
  "GST",
  "ROC",
  "RERA",
  "CoC",
  "ProjectProof",
  "BankAccount",
  "ProposerForm",
  "SeconderForm",
  "IncomeProof",
  "OtherProof",
  "SignatureImage",
  "TaxInvoice",
]);

export const MimeTypeSchema = z.enum(["application/pdf", "image/jpeg", "image/png"]);

export const DocumentStatusSchema = z.enum(["Uploaded", "Verified", "Rejected"]);

export const documentUploadSchema = z.object({
  applicationId: z.string().uuid(),
  documentType: DocumentTypeSchema,
  fileName: z.string().min(1).max(255),
  fileSize: z
    .number()
    .int()
    .min(1)
    .max(MAX_FILE_SIZE_BYTES, `File must be ≤ 10 MB`),
  mimeType: MimeTypeSchema,
  storageKey: z.string().min(1),
});

export const documentMetaSchema = z.object({
  id: z.string().uuid(),
  applicationId: z.string().uuid(),
  documentType: DocumentTypeSchema,
  fileName: z.string(),
  fileSize: z.number().int(),
  mimeType: MimeTypeSchema,
  storageKey: z.string(),
  status: DocumentStatusSchema,
  uploadedAt: z.date(),
  expiresAt: z.date().optional(),
  versionNumber: z.number().int().min(1),
  isCurrent: z.boolean(),
});

export type DocumentType = z.infer<typeof DocumentTypeSchema>;
export type MimeType = z.infer<typeof MimeTypeSchema>;
export type DocumentUpload = z.infer<typeof documentUploadSchema>;
export type DocumentMeta = z.infer<typeof documentMetaSchema>;
