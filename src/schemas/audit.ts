import { z } from "zod";

export const AuditEventTypeSchema = z.enum([
  "ApplicationSubmitted",
  "ApplicationApproved",
  "ApplicationRejected",
  "ApplicationObjectionRaised",
  "StaffEdited",
  "DocumentUploaded",
  "DocumentAccessed",
  "AadhaarAccessed",
  "CertificateIssued",
  "CertificateRevoked",
  "PaymentRecorded",
  "PaymentReversed",
  "LoginSuccess",
  "LoginFailure",
  "MFAEnrolled",
  "MFAVerified",
  "StaffInvited",
  "StaffDisabled",
  "StaffRemoved",
  "DSARRequested",
  "DSARResolved",
  "PresidentUpdated",
  "RenewalSubmitted",
  "RenewalApproved",
  "RenewalAutoApproved",
  "MemberStatusChanged",
]);

export const ActorRoleSchema = z.enum([
  "Applicant",
  "Member",
  "Scrutiniser",
  "Convenor",
  "DirectorGeneral",
  "Secretary",
  "PaymentOfficer",
  "Admin",
  "System",
]);

export const ResourceTypeSchema = z.enum([
  "Application",
  "Member",
  "Certificate",
  "Payment",
  "User",
  "Staff",
  "Document",
  "Renewal",
  "President",
]);

export const createAuditLogSchema = z.object({
  eventType: AuditEventTypeSchema,
  actorId: z.string().uuid(),
  actorRole: ActorRoleSchema,
  resourceType: ResourceTypeSchema,
  resourceId: z.string().uuid(),
  beforeState: z.record(z.unknown()).optional(),
  afterState: z.record(z.unknown()).optional(),
  reason: z.string().max(1000).optional(),
  ipAddress: z.string().optional(), // will be hashed before storage
  metadata: z.record(z.unknown()).optional(),
  traceId: z.string().uuid().optional(),
});

export const auditLogFilterSchema = z.object({
  eventType: AuditEventTypeSchema.optional(),
  actorId: z.string().uuid().optional(),
  resourceType: ResourceTypeSchema.optional(),
  resourceId: z.string().uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(50),
});

export type AuditEventType = z.infer<typeof AuditEventTypeSchema>;
export type ActorRole = z.infer<typeof ActorRoleSchema>;
export type ResourceType = z.infer<typeof ResourceTypeSchema>;
export type CreateAuditLog = z.infer<typeof createAuditLogSchema>;
