"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { step3Schema, type Step3Data } from "@/schemas/wizard";
import { WizardStepShell } from "./WizardStepShell";
import { saveDraft, loadDraft } from "@/services/wizard/draftPersistence";

interface Props { applicationId?: string }

export function Step3_FirmDetails({ applicationId }: Props) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Step3Data>({ resolver: zodResolver(step3Schema) });

  // Load draft if applicationId provided
  useEffect(() => {
    if (!applicationId) return;
    loadDraft(applicationId)
      .then((steps) => {
        const step3Data = steps[3] as Partial<Step3Data> | undefined;
        if (step3Data) {
          Object.entries(step3Data).forEach(([key, value]) => {
            setValue(key as keyof Step3Data, value);
          });
        }
      })
      .catch(() => { /* draft loading is non-critical */ });
  }, [applicationId, setValue]);

  async function onSubmit(data: Step3Data) {
    const appId = await saveDraft({ step: 3, data, applicationId });
    router.push(`/4?applicationId=${appId}`);
  }

  return (
    <WizardStepShell
      step={3}
      title="Firm Details"
      description="Legal details of your firm. GSTIN and PAN will be automatically verified."
      applicationId={applicationId}
      onNext={handleSubmit(onSubmit)}
      isSubmitting={isSubmitting}
    >
      <Field label="Firm Name" id="firmName" error={errors.firmName?.message} required>
        <input id="firmName" type="text" style={{width:"100%",borderRadius:"6px",border:"1px solid #e2e8f0",backgroundColor:"#fff",padding:"10px 12px",fontSize:"14px",color:"#0f172a",outline:"none"}} aria-invalid={errors.firmName ? "true" : undefined} {...register("firmName")} />
      </Field>

      <Field label="Firm Address" id="firmAddress" error={errors.firmAddress?.message} required>
        <textarea id="firmAddress" rows={3} style={{width:"100%",borderRadius:"6px",border:"1px solid #e2e8f0",backgroundColor:"#fff",padding:"10px 12px",fontSize:"14px",color:"#0f172a",outline:"none"}} aria-invalid={errors.firmAddress ? "true" : undefined} {...register("firmAddress")} />
      </Field>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px"}}>
        <Field label="City" id="firmCity" error={errors.firmCity?.message} required>
          <input id="firmCity" type="text" style={{width:"100%",borderRadius:"6px",border:"1px solid #e2e8f0",backgroundColor:"#fff",padding:"10px 12px",fontSize:"14px",color:"#0f172a",outline:"none"}} aria-invalid={errors.firmCity ? "true" : undefined} {...register("firmCity")} />
        </Field>
        <Field label="PIN Code" id="firmPincode" error={errors.firmPincode?.message} required>
          <input id="firmPincode" type="text" maxLength={6} inputMode="numeric" style={{width:"100%",borderRadius:"6px",border:"1px solid #e2e8f0",backgroundColor:"#fff",padding:"10px 12px",fontSize:"14px",color:"#0f172a",outline:"none"}} aria-invalid={errors.firmPincode ? "true" : undefined} {...register("firmPincode")} />
        </Field>
      </div>

      <Field label="GSTIN" id="gstin" error={errors.gstin?.message} required>
        <input
          id="gstin"
          type="text"
          style={{width:"100%",borderRadius:"6px",border:"1px solid #e2e8f0",backgroundColor:"#fff",padding:"10px 12px",fontSize:"14px",color:"#0f172a",outline:"none"}}
          placeholder="22AAAAA0000A1Z5"
          aria-invalid={errors.gstin ? "true" : undefined}
          {...register("gstin")}
        />
      </Field>

      <Field label="PAN Number" id="panNumber" error={errors.panNumber?.message} required>
        <input
          id="panNumber"
          type="text"
          style={{width:"100%",borderRadius:"6px",border:"1px solid #e2e8f0",backgroundColor:"#fff",padding:"10px 12px",fontSize:"14px",color:"#0f172a",outline:"none"}}
          placeholder="ABCDE1234F"
          aria-invalid={errors.panNumber ? "true" : undefined}
          {...register("panNumber")}
        />
      </Field>

      <Field label="MahaRERA Registration Number" id="mahareraPan" error={errors.mahareraPan?.message}>
        <input
          id="mahareraPan"
          type="text"
          style={{width:"100%",borderRadius:"6px",border:"1px solid #e2e8f0",backgroundColor:"#fff",padding:"10px 12px",fontSize:"14px",color:"#0f172a",outline:"none"}}
          placeholder="P00000000000 (optional)"
          aria-invalid={errors.mahareraPan ? "true" : undefined}
          {...register("mahareraPan")}
        />
      </Field>

      <Field label="Year of Establishment" id="yearOfEstablishment" error={errors.yearOfEstablishment?.message} required>
        <input
          id="yearOfEstablishment"
          type="number"
          min={1900}
          max={new Date().getFullYear()}
          style={{width:"100%",borderRadius:"6px",border:"1px solid #e2e8f0",backgroundColor:"#fff",padding:"10px 12px",fontSize:"14px",color:"#0f172a",outline:"none"}}
          aria-invalid={errors.yearOfEstablishment ? "true" : undefined}
          {...register("yearOfEstablishment", { valueAsNumber: true })}
        />
      </Field>
    </WizardStepShell>
  );
}

function Field({ label, id, error, required, children }: { label: string; id: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:"4px"}}>
      <label htmlFor={id} style={{display:"block",fontSize:"14px",fontWeight:500,color:"#374151",marginBottom:"6px"}}>
        {label}{required && <span style={{marginLeft:"4px",color:"#ef4444"}}>*</span>}
      </label>
      {children}
      {error && <p role="alert" style={{fontSize:"12px",color:"#ef4444"}}>{error}</p>}
    </div>
  );
}
