"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { step6Schema, type Step6Data } from "@/schemas/wizard";
import { WizardStepShell } from "./WizardStepShell";
import { saveDraft } from "@/services/wizard/draftPersistence";

interface Props { applicationId?: string }

export function Step6_Financials({ applicationId }: Props) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Step6Data>({ resolver: zodResolver(step6Schema) });

  async function onSubmit(data: Step6Data) {
    const appId = await saveDraft({ step: 6, data, applicationId });
    router.push(`/apply/7?applicationId=${appId}`);
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
      <div className="grid grid-cols-2 gap-4">
        <Field label="Annual Turnover (₹)" id="annualTurnover" error={errors.annualTurnover?.message} required>
          <input id="annualTurnover" type="number" min={0} step={1} className="field-input" aria-invalid={errors.annualTurnover ? "true" : undefined} {...register("annualTurnover", { valueAsNumber: true })} />
        </Field>
        <Field label="Financial Year" id="financialYear" error={errors.financialYear?.message} required>
          <input id="financialYear" type="text" placeholder="2023-24" className="field-input" aria-invalid={errors.financialYear ? "true" : undefined} {...register("financialYear")} />
        </Field>
      </div>

      <Field label="Bank Account Number" id="bankAccountNumber" error={errors.bankAccountNumber?.message} required>
        <input id="bankAccountNumber" type="text" className="field-input font-mono" aria-invalid={errors.bankAccountNumber ? "true" : undefined} {...register("bankAccountNumber")} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Bank Name" id="bankName" error={errors.bankName?.message} required>
          <input id="bankName" type="text" className="field-input" aria-invalid={errors.bankName ? "true" : undefined} {...register("bankName")} />
        </Field>
        <Field label="IFSC Code" id="bankIFSC" error={errors.bankIFSC?.message} required>
          <input id="bankIFSC" type="text" className="field-input font-mono uppercase" placeholder="SBIN0000001" aria-invalid={errors.bankIFSC ? "true" : undefined} {...register("bankIFSC")} />
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
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium">{label}{required && <span className="ml-1 text-destructive">*</span>}</label>
      {children}
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
