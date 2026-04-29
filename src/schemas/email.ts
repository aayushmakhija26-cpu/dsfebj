import { z } from "zod";
import { emailSchema } from "./common";

export const NotificationEventTypeSchema = z.enum([
  "OTPRequest",
  "ApplicationConfirmation",
  "RenewalReminder",
  "QueryRaised",
  "ApprovalGranted",
  "RejectionNotice",
  "CertificateIssued",
  "PaymentReceived",
  "PaymentReversed",
  "StaffInvitation",
  "DSARConfirmation",
]);

export const EmailRecipientRoleSchema = z.enum(["Applicant", "Member", "Staff"]);

export const EmailStatusSchema = z.enum(["Queued", "Sending", "Sent", "Failed"]);

export const queueEmailSchema = z.object({
  eventType: NotificationEventTypeSchema,
  recipientEmail: emailSchema,
  recipientRole: EmailRecipientRoleSchema,
  templateVariables: z.record(z.string()),
});

export const emailEventSchema = z.object({
  id: z.string().uuid(),
  recipientEmail: emailSchema,
  recipientRole: EmailRecipientRoleSchema,
  status: EmailStatusSchema,
  renderedSubject: z.string(),
  sentAt: z.date().optional(),
  retriesRemaining: z.number().int().min(0),
  createdAt: z.date(),
});

export type NotificationEventType = z.infer<typeof NotificationEventTypeSchema>;
export type QueueEmail = z.infer<typeof queueEmailSchema>;
