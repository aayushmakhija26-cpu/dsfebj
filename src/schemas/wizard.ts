import { z } from "zod";
import { emailSchema, phoneSchema } from "./common";
import { FirmTypeSchema, MembershipTypeSchema } from "./application";
import { DocumentTypeSchema, MimeTypeSchema } from "./document";

// ─── Shared sub-schemas ───────────────────────────────────────────────────────

const gstinSchema = z
  .string()
  .regex(
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    "Invalid GSTIN format",
  );

const panSchema = z
  .string()
  .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format");

const mahareraPanSchema = z
  .string()
  .regex(/^P\d{11}$/, "MahaRERA registration number format: P followed by 11 digits")
  .optional();

const dinSchema = z.string().length(8, "DIN must be 8 digits").regex(/^\d+$/);

const principalSchema = z.object({
  name: z.string().min(2).max(100),
  designation: z.string().min(2).max(50),
  din: dinSchema.optional(),
  email: emailSchema,
  phone: phoneSchema,
  address: z.string().min(5).max(300),
  panNumber: panSchema,
});

const projectSchema = z.object({
  projectName: z.string().min(2).max(200),
  location: z.string().min(2).max(200),
  completionYear: z.number().int().min(1980).max(new Date().getFullYear() + 5),
  totalUnits: z.number().int().positive().optional(),
  reraNumber: z.string().optional(),
  certificateStorageKey: z.string().optional(),
});

// ─── Step 1: Membership Type + Firm Type ─────────────────────────────────────

export const step1Schema = z.object({
  membershipType: MembershipTypeSchema,
  firmType: FirmTypeSchema,
  documentsAcknowledged: z.boolean().refine((v) => v, {
    message: "You must acknowledge the document checklist",
  }),
});

// ─── Step 2: Applicant Contact Details ───────────────────────────────────────

export const step2Schema = z.object({
  applicantName: z.string().min(2).max(100),
  designation: z.string().min(2).max(50),
  contactPhone: phoneSchema,
  contactEmail: emailSchema,
});

// ─── Step 3: Firm Details ─────────────────────────────────────────────────────

export const step3Schema = z.object({
  firmName: z.string().min(2).max(200),
  firmAddress: z.string().min(5).max(500),
  firmCity: z.string().min(2).max(100),
  firmPincode: z.string().length(6).regex(/^\d{6}$/, "Invalid PIN code"),
  gstin: gstinSchema,
  panNumber: panSchema,
  mahareraPan: mahareraPanSchema,
  yearOfEstablishment: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear()),
});

// ─── Step 4: Directors / Partners ────────────────────────────────────────────

export const step4BaseSchema = z.object({
  principals: z.array(principalSchema).min(1),
});

// Firm-type specific refinements
export const step4Schema = step4BaseSchema.superRefine((val, ctx) => {
  // Proprietary firm needs at least 1 proprietor
  // Partnership / LLP needs at least 2 partners
  // PrivateLimited / PublicSector needs at least 2 directors
  // AOP / CooperativeSociety needs at least 2 members
  // The actual minimum is passed via context; refine to 1 generically here
  if (val.principals.length < 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_small,
      minimum: 1,
      type: "array",
      inclusive: true,
      message: "At least one principal is required",
      path: ["principals"],
    });
  }
});

// Helper to create firm-type-specific step 4 schema
export function createStep4Schema(firmType: string) {
  const min =
    firmType === "Proprietorship" ? 1 : 2;
  return step4BaseSchema.superRefine((val, ctx) => {
    if (val.principals.length < min) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_small,
        minimum: min,
        type: "array",
        inclusive: true,
        message: `${firmType} requires at least ${min} principal(s)`,
        path: ["principals"],
      });
    }
  });
}

// ─── Step 5: Projects & Experience ───────────────────────────────────────────

export const step5Schema = z.object({
  completedProjects: z.array(projectSchema).optional(),
  commencedProjects: z.array(projectSchema).optional(),
});

// ─── Step 6: Financials ──────────────────────────────────────────────────────

export const step6Schema = z.object({
  annualTurnover: z.number().positive("Turnover must be positive"),
  financialYear: z.string().regex(/^\d{4}-\d{2}$/, "Format: YYYY-YY"),
  bankAccountNumber: z.string().min(8).max(20),
  bankName: z.string().min(2).max(100),
  bankIFSC: z
    .string()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code"),
  auditedBalanceSheetKey: z.string().optional(),
});

// ─── Step 7: Document Uploads ────────────────────────────────────────────────

export const uploadedDocSchema = z.object({
  documentType: DocumentTypeSchema,
  storageKey: z.string().min(1),
  fileName: z.string().min(1),
  fileSize: z.number().int().min(1).max(10 * 1024 * 1024),
  mimeType: MimeTypeSchema,
});

export const step7Schema = z.object({
  documents: z.array(uploadedDocSchema).min(1, "At least one document is required"),
});

// ─── Step 8: Proposer & Seconder (Associate only) ────────────────────────────

export const step8Schema = z
  .object({
    proposerId: z.string().uuid().optional(),
    seconderId: z.string().uuid().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.proposerId && val.seconderId && val.proposerId === val.seconderId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Proposer and Seconder must be different members",
        path: ["seconderId"],
      });
    }
  });

// ─── Step 9: Compliance & Declaration ────────────────────────────────────────

export const step9Schema = z.object({
  declarationAccepted: z.boolean().refine((v) => v, {
    message: "Declaration must be accepted to proceed",
  }),
  dpdpConsentAccepted: z.boolean().refine((v) => v, {
    message: "DPDP consent must be accepted",
  }),
});

// ─── Step 10: Payment ────────────────────────────────────────────────────────

export const step10Schema = z
  .object({
    paymentMethod: z.enum(["Online", "Offline"]),
    paymentInitiated: z.boolean().refine((v) => v, {
      message: "Payment must be initiated",
    }),
    gatewayOrderId: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.paymentMethod === "Online" && !val.gatewayOrderId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Gateway order ID is required for online payments",
        path: ["gatewayOrderId"],
      });
    }
    if (val.paymentMethod === "Offline" && val.gatewayOrderId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Gateway order ID must not be set for offline payments",
        path: ["gatewayOrderId"],
      });
    }
  });

// ─── Step 11: Review & Submit ────────────────────────────────────────────────

export const step11Schema = z.object({
  finalDeclarationAccepted: z.boolean().refine((v) => v, {
    message: "Final declaration must be accepted before submission",
  }),
  captchaToken: z.string().optional(),
});

// ─── Step 12: Confirmation (read-only) ──────────────────────────────────────

export const step12Schema = z.object({
  applicationNumber: z.string(),
  submittedAt: z.coerce.date(),
});

// ─── Step dispatch map ────────────────────────────────────────────────────────

// NOTE: For step 4 validation, use createStep4Schema(firmType) instead of WIZARD_STEP_SCHEMAS[4]
// to enforce firm-type-specific principal minimums. The generic step4Schema here accepts
// any number >= 1 principal and is suitable for schema type inference only.
export const WIZARD_STEP_SCHEMAS = {
  1: step1Schema,
  2: step2Schema,
  3: step3Schema,
  4: step4Schema,
  5: step5Schema,
  6: step6Schema,
  7: step7Schema,
  8: step8Schema,
  9: step9Schema,
  10: step10Schema,
  11: step11Schema,
  12: step12Schema,
} as const;

export type WizardStep = keyof typeof WIZARD_STEP_SCHEMAS;

export type Step1Data = z.infer<typeof step1Schema>;
export type Step2Data = z.infer<typeof step2Schema>;
export type Step3Data = z.infer<typeof step3Schema>;
export type Step4Data = z.infer<typeof step4Schema>;
export type Step5Data = z.infer<typeof step5Schema>;
export type Step6Data = z.infer<typeof step6Schema>;
export type Step7Data = z.infer<typeof step7Schema>;
export type Step8Data = z.infer<typeof step8Schema>;
export type Step9Data = z.infer<typeof step9Schema>;
export type Step10Data = z.infer<typeof step10Schema>;
export type Step11Data = z.infer<typeof step11Schema>;
