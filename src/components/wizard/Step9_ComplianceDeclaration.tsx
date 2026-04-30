"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { step9Schema, type Step9Data } from "@/schemas/wizard";
import { WizardStepShell } from "./WizardStepShell";
import { saveDraft } from "@/services/wizard/draftPersistence";

interface Props { applicationId?: string }

export function Step9_ComplianceDeclaration({ applicationId }: Props) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Step9Data>({ resolver: zodResolver(step9Schema) });

  async function onSubmit(data: Step9Data) {
    const appId = await saveDraft({ step: 9, data, applicationId });
    router.push(`/apply/10?applicationId=${appId}`);
  }

  return (
    <WizardStepShell
      step={9}
      title="Compliance & Declaration"
      description="Please read and accept the following declarations before proceeding."
      applicationId={applicationId}
      onNext={handleSubmit(onSubmit)}
      isSubmitting={isSubmitting}
    >
      <div className="rounded-md border border-muted bg-muted/20 p-4 text-sm leading-relaxed text-muted-foreground max-h-48 overflow-y-auto">
        <p className="font-medium text-foreground">Declaration</p>
        <p className="mt-2">
          I/We hereby declare that the information provided in this application is true, correct, and complete to the best of my/our knowledge and belief. I/We understand that any misrepresentation or omission of material facts may result in rejection of the application or cancellation of membership.
        </p>
        <p className="mt-2">
          I/We agree to abide by the Code of Conduct, Bye-laws, and Regulations of CREDAI Pune as in force from time to time, and to pay the prescribed fees within the stipulated period.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <input
            id="declarationAccepted"
            type="checkbox"
            aria-invalid={errors.declarationAccepted ? "true" : undefined}
            aria-describedby={errors.declarationAccepted ? "decl-error" : undefined}
            className="mt-0.5 h-4 w-4 rounded border-input"
            {...register("declarationAccepted")}
          />
          <label htmlFor="declarationAccepted" className="text-sm">
            I accept the declaration and Code of Conduct above <span className="text-destructive">*</span>
          </label>
        </div>
        {errors.declarationAccepted && (
          <p id="decl-error" role="alert" className="text-xs text-destructive">{errors.declarationAccepted.message}</p>
        )}

        <div className="flex items-start gap-2">
          <input
            id="dpdpConsentAccepted"
            type="checkbox"
            aria-invalid={errors.dpdpConsentAccepted ? "true" : undefined}
            aria-describedby={errors.dpdpConsentAccepted ? "dpdp-error" : undefined}
            className="mt-0.5 h-4 w-4 rounded border-input"
            {...register("dpdpConsentAccepted")}
          />
          <label htmlFor="dpdpConsentAccepted" className="text-sm">
            I consent to CREDAI Pune processing my personal data as described in the{" "}
            <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary underline">Privacy Policy</a>{" "}
            in compliance with the Digital Personal Data Protection Act, 2023 <span className="text-destructive">*</span>
          </label>
        </div>
        {errors.dpdpConsentAccepted && (
          <p id="dpdp-error" role="alert" className="text-xs text-destructive">{errors.dpdpConsentAccepted.message}</p>
        )}
      </div>
    </WizardStepShell>
  );
}
