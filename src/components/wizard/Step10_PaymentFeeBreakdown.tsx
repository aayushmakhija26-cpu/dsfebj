"use client";

import { useEffect } from "react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { step10Schema, type Step10Data } from "@/schemas/wizard";
import { WizardStepShell } from "./WizardStepShell";
import { saveDraft, loadDraft } from "@/services/wizard/draftPersistence";
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

  // Load draft if applicationId provided
  useEffect(() => {
    if (!applicationId) return;
    loadDraft(applicationId)
      .then((steps) => {
        const step10Data = steps[10] as Partial<Step10Data> | undefined;
        if (step10Data) {
          if (step10Data.paymentMethod) setValue("paymentMethod", step10Data.paymentMethod);
          if (step10Data.paymentInitiated !== undefined) setValue("paymentInitiated", step10Data.paymentInitiated);
        }
      })
      .catch(() => { /* draft loading is non-critical */ });
  }, [applicationId, setValue]);

  async function handleOnlinePayment() {
    // Online payment integration implemented in Phase 6 (T140)
    // For Phase 3, mark as initiated and proceed
    setValue("paymentInitiated", true);
    setValue("paymentMethod", "Online");
    const data = { paymentMethod: "Online" as const, paymentInitiated: true };
    const appId = await saveDraft({ step: 10, data, applicationId });
    router.push(`/11?applicationId=${appId}`);
  }

  async function handleOfflinePayment() {
    setValue("paymentInitiated", true);
    setValue("paymentMethod", "Offline");
    const data = { paymentMethod: "Offline" as const, paymentInitiated: true };
    const appId = await saveDraft({ step: 10, data, applicationId });
    router.push(`/11?applicationId=${appId}`);
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
      <div style={{borderRadius:"6px",border:"1px solid #e2e8f0"}}>
        <table style={{width:"100%",fontSize:"14px"}}>
          <thead>
            <tr style={{borderBottom:"1px solid #e2e8f0",backgroundColor:"#f1f5f9"}}>
              <th style={{padding:"8px 16px",textAlign:"left",fontWeight:600}}>Fee Component</th>
              <th style={{padding:"8px 16px",textAlign:"right",fontWeight:600}}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{borderBottom:"1px solid #e2e8f0"}}>
              <td style={{padding:"8px 16px"}}>Entrance Fee</td>
              <td style={{padding:"8px 16px",textAlign:"right"}}>{formatAmount(fees.entrance)}</td>
            </tr>
            <tr style={{borderBottom:"1px solid #e2e8f0"}}>
              <td style={{padding:"8px 16px"}}>Annual Subscription</td>
              <td style={{padding:"8px 16px",textAlign:"right"}}>{formatAmount(fees.annual)}</td>
            </tr>
            <tr style={{borderBottom:"1px solid #e2e8f0"}}>
              <td style={{padding:"8px 16px",color:"#64748b"}}>CGST ({CGST_RATE_PERCENT}%)</td>
              <td style={{padding:"8px 16px",textAlign:"right",color:"#64748b"}}>{formatAmount(cgst)}</td>
            </tr>
            <tr style={{borderBottom:"1px solid #e2e8f0"}}>
              <td style={{padding:"8px 16px",color:"#64748b"}}>SGST ({SGST_RATE_PERCENT}%)</td>
              <td style={{padding:"8px 16px",textAlign:"right",color:"#64748b"}}>{formatAmount(sgst)}</td>
            </tr>
            <tr>
              <td style={{padding:"12px 16px",fontWeight:600}}>Total</td>
              <td style={{padding:"12px 16px",textAlign:"right",fontWeight:600}}>{formatAmount(total)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px"}}>
        <button
          type="button"
          onClick={handleOnlinePayment}
          disabled={isSubmitting}
          style={{borderRadius:"6px",backgroundColor:"#1B3A6B",color:"#fff",padding:"12px 16px",fontSize:"14px",fontWeight:600,border:"none",cursor:isSubmitting?"not-allowed":"pointer",opacity:isSubmitting?0.5:1}}
        >
          Pay Online
          <span style={{display:"block",fontSize:"12px",fontWeight:400,opacity:0.8}}>Razorpay / Cashfree</span>
        </button>
        <button
          type="button"
          onClick={handleOfflinePayment}
          disabled={isSubmitting}
          style={{borderRadius:"6px",border:"1px solid #e2e8f0",backgroundColor:"#fff",color:"#0f172a",padding:"12px 16px",fontSize:"14px",fontWeight:600,cursor:isSubmitting?"not-allowed":"pointer",opacity:isSubmitting?0.5:1}}
        >
          Pay Offline
          <span style={{display:"block",fontSize:"12px",fontWeight:400,color:"#64748b"}}>Cheque / DD / NEFT / Cash</span>
        </button>
      </div>

      {paymentMethod === "Offline" && (
        <div style={{borderRadius:"6px",border:"1px solid #e2e8f0",backgroundColor:"#f8fafc",padding:"12px",fontSize:"14px"}}>
          <p style={{fontWeight:600,color:"#0f172a",margin:"0 0 8px 0"}}>Offline Payment Instructions</p>
          <p style={{color:"#64748b",margin:"8px 0"}}>
            Please submit your payment (Cheque / DD / NEFT / Cash) to the CREDAI Pune office. A Payment Officer will record and reconcile your payment. Your application will be processed once payment is confirmed.
          </p>
        </div>
      )}
    </WizardStepShell>
  );
}
