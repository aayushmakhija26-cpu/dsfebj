"use client";

import { useEffect } from "react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { step9Schema, type Step9Data } from "@/schemas/wizard";
import { WizardStepShell } from "./WizardStepShell";
import { saveDraft, loadDraft } from "@/services/wizard/draftPersistence";

interface Props { applicationId?: string }

export function Step9_ComplianceDeclaration({ applicationId }: Props) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Step9Data>({ resolver: zodResolver(step9Schema) });

  // Load draft if applicationId provided
  useEffect(() => {
    if (!applicationId) return;
    loadDraft(applicationId)
      .then((steps) => {
        const step9Data = steps[9] as Partial<Step9Data> | undefined;
        if (step9Data) {
          if (step9Data.declarationAccepted !== undefined) setValue("declarationAccepted", step9Data.declarationAccepted);
          if (step9Data.dpdpConsentAccepted !== undefined) setValue("dpdpConsentAccepted", step9Data.dpdpConsentAccepted);
        }
      })
      .catch(() => { /* draft loading is non-critical */ });
  }, [applicationId, setValue]);

  async function onSubmit(data: Step9Data) {
    const appId = await saveDraft({ step: 9, data, applicationId });
    router.push(`/10?applicationId=${appId}`);
  }

  async function goBack() {
    // Check membership type to skip Step 8 for non-Associate members
    let prevStep = 8;
    if (applicationId) {
      try {
        const draftData = await loadDraft(applicationId);
        const step1Data = draftData[1] as { membershipType?: string } | undefined;
        const membershipType = step1Data?.membershipType;

        // Skip Step 8 for Ordinary and RERAProject membership
        if (membershipType && membershipType !== "Associate") {
          prevStep = 7;
        }
      } catch {
        // If we can't load draft, default to Step 8
      }
    }

    router.push(`/${prevStep}?applicationId=${applicationId}`);
  }

  return (
    <WizardStepShell
      step={9}
      title="Compliance & Declaration"
      description="Please read and accept the following declarations before proceeding."
      applicationId={applicationId}
      onNext={handleSubmit(onSubmit)}
      onBack={goBack}
      isSubmitting={isSubmitting}
    >
      <div style={{borderRadius:"6px",border:"1px solid #e2e8f0",backgroundColor:"#f8fafc",padding:"16px",fontSize:"14px",lineHeight:"1.6",color:"#64748b",maxHeight:"200px",overflowY:"auto"}}>
        <p style={{fontWeight:600,color:"#0f172a",margin:"0 0 8px 0"}}>Declaration</p>
        <p style={{margin:"8px 0"}}>
          I/We hereby declare that the information provided in this application is true, correct, and complete to the best of my/our knowledge and belief. I/We understand that any misrepresentation or omission of material facts may result in rejection of the application or cancellation of membership.
        </p>
        <p style={{margin:"8px 0"}}>
          I/We agree to abide by the Code of Conduct, Bye-laws, and Regulations of CREDAI Pune as in force from time to time, and to pay the prescribed fees within the stipulated period.
        </p>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
        <div style={{display:"flex",alignItems:"flex-start",gap:"8px"}}>
          <input
            id="declarationAccepted"
            type="checkbox"
            aria-invalid={errors.declarationAccepted ? "true" : undefined}
            aria-describedby={errors.declarationAccepted ? "decl-error" : undefined}
            style={{marginTop:"4px",width:"16px",height:"16px",borderRadius:"4px",border:"1px solid #e2e8f0",cursor:"pointer"}}
            {...register("declarationAccepted")}
          />
          <label htmlFor="declarationAccepted" style={{fontSize:"14px",color:"#0f172a",cursor:"pointer"}}>
            I accept the declaration and Code of Conduct above <span style={{color:"#dc2626"}}>*</span>
          </label>
        </div>
        {errors.declarationAccepted && (
          <p id="decl-error" role="alert" style={{fontSize:"12px",color:"#ef4444"}}>{errors.declarationAccepted.message}</p>
        )}

        <div style={{display:"flex",alignItems:"flex-start",gap:"8px"}}>
          <input
            id="dpdpConsentAccepted"
            type="checkbox"
            aria-invalid={errors.dpdpConsentAccepted ? "true" : undefined}
            aria-describedby={errors.dpdpConsentAccepted ? "dpdp-error" : undefined}
            style={{marginTop:"4px",width:"16px",height:"16px",borderRadius:"4px",border:"1px solid #e2e8f0",cursor:"pointer"}}
            {...register("dpdpConsentAccepted")}
          />
          <label htmlFor="dpdpConsentAccepted" style={{fontSize:"14px",color:"#0f172a",cursor:"pointer"}}>
            I consent to CREDAI Pune processing my personal data as described in the{" "}
            <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" style={{color:"#1B3A6B",textDecoration:"underline"}}>Privacy Policy</a>{" "}
            in compliance with the Digital Personal Data Protection Act, 2023 <span style={{color:"#dc2626"}}>*</span>
          </label>
        </div>
        {errors.dpdpConsentAccepted && (
          <p id="dpdp-error" role="alert" style={{fontSize:"12px",color:"#ef4444"}}>{errors.dpdpConsentAccepted.message}</p>
        )}
      </div>
    </WizardStepShell>
  );
}
