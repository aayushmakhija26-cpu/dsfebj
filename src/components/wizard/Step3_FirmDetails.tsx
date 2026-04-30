"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { step3Schema, type Step3Data } from "@/schemas/wizard";
import { WizardStepShell } from "./WizardStepShell";
import { saveDraft } from "@/services/wizard/draftPersistence";

interface Props { applicationId?: string }

export function Step3_FirmDetails({ applicationId }: Props) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Step3Data>({ resolver: zodResolver(step3Schema) });

  async function onSubmit(data: Step3Data) {
    const appId = await saveDraft({ step: 3, data, applicationId });
    router.push(`/apply/4?applicationId=${appId}`);
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
        <input id="firmName" type="text" className="field-input" aria-invalid={errors.firmName ? "true" : undefined} {...register("firmName")} />
      </Field>

      <Field label="Firm Address" id="firmAddress" error={errors.firmAddress?.message} required>
        <textarea id="firmAddress" rows={3} className="field-input" aria-invalid={errors.firmAddress ? "true" : undefined} {...register("firmAddress")} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="City" id="firmCity" error={errors.firmCity?.message} required>
          <input id="firmCity" type="text" className="field-input" aria-invalid={errors.firmCity ? "true" : undefined} {...register("firmCity")} />
        </Field>
        <Field label="PIN Code" id="firmPincode" error={errors.firmPincode?.message} required>
          <input id="firmPincode" type="text" maxLength={6} inputMode="numeric" className="field-input" aria-invalid={errors.firmPincode ? "true" : undefined} {...register("firmPincode")} />
        </Field>
      </div>

      <Field label="GSTIN" id="gstin" error={errors.gstin?.message} required>
        <input
          id="gstin"
          type="text"
          className="field-input font-mono uppercase"
          placeholder="22AAAAA0000A1Z5"
          aria-invalid={errors.gstin ? "true" : undefined}
          {...register("gstin")}
        />
      </Field>

      <Field label="PAN Number" id="panNumber" error={errors.panNumber?.message} required>
        <input
          id="panNumber"
          type="text"
          className="field-input font-mono uppercase"
          placeholder="ABCDE1234F"
          aria-invalid={errors.panNumber ? "true" : undefined}
          {...register("panNumber")}
        />
      </Field>

      <Field label="MahaRERA Registration Number" id="mahareraPan" error={errors.mahareraPan?.message}>
        <input
          id="mahareraPan"
          type="text"
          className="field-input font-mono"
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
          className="field-input"
          aria-invalid={errors.yearOfEstablishment ? "true" : undefined}
          {...register("yearOfEstablishment", { valueAsNumber: true })}
        />
      </Field>
    </WizardStepShell>
  );
}

function Field({ label, id, error, required, children }: { label: string; id: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}{required && <span className="ml-1 text-destructive">*</span>}
      </label>
      {children}
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
