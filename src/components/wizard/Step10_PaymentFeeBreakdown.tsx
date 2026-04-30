"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { step10Schema, type Step10Data } from "@/schemas/wizard";
import { WizardStepShell } from "./WizardStepShell";
import { saveDraft } from "@/services/wizard/draftPersistence";
import { CGST_RATE_PERCENT, SGST_RATE_PERCENT, PAYMENT_CURRENCY } from "@/lib/constants";

interface Props { applicationId?: string; membershipType?: string }

// Fee structure — would be fetched from config/API in production
const FEES: Record<string, { entrance: number; annual: number }> = {
  Ordinary: { entrance: 25000, annual: 15000 },
  Associate: { entrance: 10000, annual: 8000 },
  RERAProject: { entrance: 5000, annual: 3000 },
};

export function Step10_PaymentFeeBreakdown({ applicationId, membershipType = "Ordinary" }: Props) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Step10Data>({
    resolver: zodResolver(step10Schema),
    defaultValues: { paymentMethod: "Online", paymentInitiated: false },
  });

  const paymentMethod = watch("paymentMethod");
  const fees = FEES[membershipType] ?? FEES.Ordinary!;
  const subtotal = fees.entrance + fees.annual;
  const cgst = Math.round(subtotal * CGST_RATE_PERCENT / 100);
  const sgst = Math.round(subtotal * SGST_RATE_PERCENT / 100);
  const total = subtotal + cgst + sgst;

  async function handleOnlinePayment() {
    // Online payment integration implemented in Phase 6 (T140)
    // For Phase 3, mark as initiated and proceed
    setValue("paymentInitiated", true);
    setValue("paymentMethod", "Online");
    const data = { paymentMethod: "Online" as const, paymentInitiated: true };
    const appId = await saveDraft({ step: 10, data, applicationId });
    router.push(`/apply/11?applicationId=${appId}`);
  }

  async function handleOfflinePayment() {
    setValue("paymentInitiated", true);
    setValue("paymentMethod", "Offline");
    const data = { paymentMethod: "Offline" as const, paymentInitiated: true };
    const appId = await saveDraft({ step: 10, data, applicationId });
    router.push(`/apply/11?applicationId=${appId}`);
  }

  function formatAmount(amount: number) {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: PAYMENT_CURRENCY, minimumFractionDigits: 0 }).format(amount);
  }

  return (
    <WizardStepShell
      step={10}
      title="Payment"
      description="Review your fee breakdown and choose a payment method."
      applicationId={applicationId}
      isSubmitting={isSubmitting}
    >
      <div className="rounded-md border border-muted">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="px-4 py-2 text-left font-medium">Fee Component</th>
              <th className="px-4 py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="px-4 py-2">Entrance Fee</td>
              <td className="px-4 py-2 text-right">{formatAmount(fees.entrance)}</td>
            </tr>
            <tr className="border-b">
              <td className="px-4 py-2">Annual Subscription</td>
              <td className="px-4 py-2 text-right">{formatAmount(fees.annual)}</td>
            </tr>
            <tr className="border-b">
              <td className="px-4 py-2 text-muted-foreground">CGST ({CGST_RATE_PERCENT}%)</td>
              <td className="px-4 py-2 text-right text-muted-foreground">{formatAmount(cgst)}</td>
            </tr>
            <tr className="border-b">
              <td className="px-4 py-2 text-muted-foreground">SGST ({SGST_RATE_PERCENT}%)</td>
              <td className="px-4 py-2 text-right text-muted-foreground">{formatAmount(sgst)}</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-semibold">Total</td>
              <td className="px-4 py-3 text-right font-semibold">{formatAmount(total)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={handleOnlinePayment}
          disabled={isSubmitting}
          className="rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          Pay Online
          <span className="block text-xs font-normal opacity-80">Razorpay / Cashfree</span>
        </button>
        <button
          type="button"
          onClick={handleOfflinePayment}
          disabled={isSubmitting}
          className="rounded-md border border-input px-4 py-3 text-sm font-medium hover:bg-muted disabled:opacity-50"
        >
          Pay Offline
          <span className="block text-xs font-normal text-muted-foreground">Cheque / DD / NEFT / Cash</span>
        </button>
      </div>

      {paymentMethod === "Offline" && (
        <div className="rounded-md border border-muted bg-muted/20 p-3 text-sm">
          <p className="font-medium">Offline Payment Instructions</p>
          <p className="mt-1 text-muted-foreground">
            Please submit your payment (Cheque / DD / NEFT / Cash) to the CREDAI Pune office. A Payment Officer will record and reconcile your payment. Your application will be processed once payment is confirmed.
          </p>
        </div>
      )}
    </WizardStepShell>
  );
}
