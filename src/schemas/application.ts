import { z } from "zod";

export const MembershipTypeSchema = z.enum(["Ordinary", "Associate", "RERAProject"]);

export const FirmTypeSchema = z.enum([
  "Proprietorship",
  "Partnership",
  "PrivateLimited",
  "LLP",
  "PublicSector",
  "AOP",
  "CooperativeSociety",
]);

// Status enum MUST match spec.md exactly (T093)
export const ApplicationStatusSchema = z.enum([
  "Draft",
  "Submitted",
  "UnderScrutiny",
  "AtConvenor",
  "AtDirectorGeneral",
  "AtSecretary",
  "Approved",
  "CertificateIssued",
  "Rejected",
]);

export const ValidationStatusSchema = z.enum(["Valid", "Invalid"]);

export const applicationSummarySchema = z.object({
  id: z.string().uuid(),
  applicationNumber: z.string(),
  membershipType: MembershipTypeSchema,
  firmType: FirmTypeSchema,
  firmName: z.string().min(1),
  status: ApplicationStatusSchema,
  submittedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const applicationStepDataSchema = z.object({
  applicationId: z.string().uuid(),
  stepNumber: z.number().int().min(1).max(12),
  data: z.record(z.unknown()),
  isComplete: z.boolean(),
  validationStatus: ValidationStatusSchema,
  validationErrors: z.array(z.string()).default([]),
});

export const submitStepSchema = z.object({
  applicationId: z.string().uuid(),
  stepNumber: z.number().int().min(1).max(12),
  data: z.record(z.unknown()),
});

export const createApplicationSchema = z.object({
  membershipType: MembershipTypeSchema,
  firmType: FirmTypeSchema,
  firmName: z.string().min(1).max(200),
  firmAddress: z.string().min(1).max(500),
});

export const applicationFilterSchema = z.object({
  status: ApplicationStatusSchema.optional(),
  membershipType: MembershipTypeSchema.optional(),
  firmType: FirmTypeSchema.optional(),
  submittedFrom: z.coerce.date().optional(),
  submittedTo: z.coerce.date().optional(),
});

export type MembershipType = z.infer<typeof MembershipTypeSchema>;
export type FirmType = z.infer<typeof FirmTypeSchema>;
export type ApplicationStatus = z.infer<typeof ApplicationStatusSchema>;
export type ApplicationSummary = z.infer<typeof applicationSummarySchema>;
export type SubmitStep = z.infer<typeof submitStepSchema>;
export type CreateApplication = z.infer<typeof createApplicationSchema>;
