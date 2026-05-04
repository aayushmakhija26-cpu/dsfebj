"use client";

import { useEffect } from "react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { step6Schema, type Step6Data } from "@/schemas/wizard";
import { WizardStepShell } from "./WizardStepShell";
import { saveDraft, loadDraft } from "@/services/wizard/draftPersistence";

interface Props { applicationId?: string }

export function Step6_Financials({ applicationId }: Props) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Step6Data>({ resolver: zodResolver(step6Schema) });

  // Load draft if applicationId provided
  useEffect(() => {
    if (!applicationId) return;
    loadDraft(applicationId)
      .then((steps) => {
        const step6Data = steps[6] as Partial<Step6Data> | undefined;
        if (step6Data) {
          Object.entries(step6Data).forEach(([key, value]) => {
            setValue(key as keyof Step6Data, value);
          });
        }
      })
      .catch(() => { /* draft loading is non-critical */ });
  }, [applicationId, setValue]);

  async function onSubmit(data: Step6Data) {
    const appId = await saveDraft({ step: 6, data, applicationId });
    router.push(`/7?applicationId=${appId}`);
  }

  return (
    <WizardStepShell
      step={6}
      title="Financials"
      description="Annual turnover and bank account details from your latest audited financials."
      applicationId={applicationId}
      onNext={handleSubmit(onSubmit)}
      isSubmitting={isSubmitting}
    >
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px"}}>
        <Field label="Annual Turnover (₹)" id="annualTurnover" error={errors.annualTurnover?.message} required>
          <input id="annualTurnover" type="number" min={0} step={1} style={{width:"100%",borderRadius:"6px",border:"1px solid #e2e8f0",backgroundColor:"#fff",padding:"10px 12px",fontSize:"14px",color:"#0f172a",outline:"none"}} aria-invalid={errors.annualTurnover ? "true" : undefined} {...register("annualTurnover", { valueAsNumber: true })} />
        </Field>
        <Field label="Financial Year" id="financialYear" error={errors.financialYear?.message} required>
          <input id="financialYear" type="text" placeholder="2023-24" style={{width:"100%",borderRadius:"6px",border:"1px solid #e2e8f0",backgroundColor:"#fff",padding:"10px 12px",fontSize:"14px",color:"#0f172a",outline:"none"}} aria-invalid={errors.financialYear ? "true" : undefined} {...register("financialYear")} />
        </Field>
      </div>

      <Field label="Bank Account Number" id="bankAccountNumber" error={errors.bankAccountNumber?.message} required>
        <input id="bankAccountNumber" type="text" style={{width:"100%",borderRadius:"6px",border:"1px solid #e2e8f0",backgroundColor:"#fff",padding:"10px 12px",fontSize:"14px",color:"#0f172a",outline:"none"}} aria-invalid={errors.bankAccountNumber ? "true" : undefined} {...register("bankAccountNumber")} />
      </Field>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px"}}>
        <Field label="Bank Name" id="bankName" error={errors.bankName?.message} required>
          <input id="bankName" type="text" style={{width:"100%",borderRadius:"6px",border:"1px solid #e2e8f0",backgroundColor:"#fff",padding:"10px 12px",fontSize:"14px",color:"#0f172a",outline:"none"}} aria-invalid={errors.bankName ? "true" : undefined} {...register("bankName")} />
        </Field>
        <Field label="IFSC Code" id="bankIFSC" error={errors.bankIFSC?.message} required>
          <input id="bankIFSC" type="text" style={{width:"100%",borderRadius:"6px",border:"1px solid #e2e8f0",backgroundColor:"#fff",padding:"10px 12px",fontSize:"14px",color:"#0f172a",outline:"none"}} placeholder="SBIN0000001" aria-invalid={errors.bankIFSC ? "true" : undefined} {...register("bankIFSC")} />
        </Field>
      </div>

      <p className="text-xs text-muted-foreground">
        Please upload the audited balance sheet in Step 7 (Documents).
      </p>
    </WizardStepShell>
  );
}

function Field({ label, id, error, required, children }: { label: string; id: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:"4px"}}>
      <label htmlFor={id} style={{display:"block",fontSize:"14px",fontWeight:500,color:"#374151",marginBottom:"6px"}}>{label}{required && <span style={{marginLeft:"4px",color:"#ef4444"}}>*</span>}</label>
      {children}
      {error && <p role="alert" style={{fontSize:"12px",color:"#ef4444"}}>{error}</p>}
    </div>
  );
}
