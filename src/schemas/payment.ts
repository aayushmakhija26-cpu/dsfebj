import { z } from "zod";

export const PaymentTypeSchema = z.enum(["Online", "Offline"]);

export const PaymentStatusSchema = z.enum([
  "Pending",
  "Initiated",
  "Success",
  "Failed",
  "Reconciled",
  "Reversed",
]);

export const PaymentGatewaySchema = z.enum(["Razorpay", "Cashfree", "Manual"]);

// FR-024: Cash, Cheque, NEFT, DD — IMPS is NOT an accepted offline mode
export const OfflinePaymentMethodSchema = z.enum(["Cash", "Cheque", "NEFT", "DD"]);

export const initiateOnlinePaymentSchema = z.object({
  applicationId: z.string().uuid().optional(),
  membershipRenewalId: z.string().uuid().optional(),
  amount: z.number().positive("Amount must be positive"),
  gateway: PaymentGatewaySchema,
}).refine(
  (val) => val.applicationId ?? val.membershipRenewalId,
  { message: "Either applicationId or membershipRenewalId must be provided" },
);

export const recordOfflinePaymentSchema = z.object({
  applicationId: z.string().uuid().optional(),
  membershipRenewalId: z.string().uuid().optional(),
  amount: z.number().positive("Amount must be positive"),
  paymentMethod: OfflinePaymentMethodSchema,
  referenceNumber: z
    .string()
    .min(1)
    .max(100, "Reference number must be ≤ 100 characters"),
  receivedDate: z.coerce.date(),
  bankName: z.string().min(1).max(100).optional(),
  notes: z.string().max(500).optional(),
}).refine(
  (val) => val.applicationId ?? val.membershipRenewalId,
  { message: "Either applicationId or membershipRenewalId must be provided" },
);

export const paymentSummarySchema = z.object({
  id: z.string().uuid(),
  paymentType: PaymentTypeSchema,
  amount: z.number(),
  currency: z.string(),
  status: PaymentStatusSchema,
  gateway: PaymentGatewaySchema.optional(),
  offlinePaymentMethod: OfflinePaymentMethodSchema.optional(),
  offlineReferenceNumber: z.string().optional(),
  createdAt: z.date(),
  completedAt: z.date().optional(),
});

export type PaymentType = z.infer<typeof PaymentTypeSchema>;
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;
export type OfflinePaymentMethod = z.infer<typeof OfflinePaymentMethodSchema>;
export type InitiateOnlinePayment = z.infer<typeof initiateOnlinePaymentSchema>;
export type RecordOfflinePayment = z.infer<typeof recordOfflinePaymentSchema>;
