"use client";

import { useEffect } from "react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { step7Schema, type Step7Data } from "@/schemas/wizard";
import { WizardStepShell } from "./WizardStepShell";
import { DocumentUploadCard } from "./DocumentUploadCard";
import { saveDraft, loadDraft } from "@/services/wizard/draftPersistence";

interface Props { applicationId?: string }

const REQUIRED_DOCUMENTS = [
  { type: "PAN", label: "PAN Card", required: true },
  { type: "GST", label: "GST Registration Certificate", required: true },
  { type: "ROC", label: "ROC / Partnership Deed / MOA", required: true },
  { type: "CoC", label: "Code of Conduct (Signed)", required: true },
  { type: "BankAccount", label: "Cancelled Cheque / Bank Statement", required: true },
  { type: "ProposerForm", label: "Proposer Recommendation Form", required: false },
  { type: "SeconderForm", label: "Seconder Recommendation Form", required: false },
] as const;

export function Step7_DocumentUpload({ applicationId }: Props) {
  const router = useRouter();

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Step7Data>({
    resolver: zodResolver(step7Schema),
    defaultValues: { documents: [] },
  });

  const documents = watch("documents");

  // Load draft if applicationId provided
  useEffect(() => {
    if (!applicationId) return;
    loadDraft(applicationId)
      .then((steps) => {
        const step7Data = steps[7] as Partial<Step7Data> | undefined;
        if (step7Data?.documents) {
          setValue("documents", step7Data.documents);
        }
      })
      .catch(() => { /* draft loading is non-critical */ });
  }, [applicationId, setValue]);

  async function onSubmit(data: Step7Data) {
    const appId = await saveDraft({ step: 7, data, applicationId });

    // Check membership type to skip Step 8 for non-Associate members
    let nextStep = 8;
    try {
      const draftData = await loadDraft(appId);
      const step1Data = draftData[1] as { membershipType?: string } | undefined;
      const membershipType = step1Data?.membershipType;

      // Skip Step 8 (Proposer & Seconder) for Ordinary and RERAProject membership
      if (membershipType && membershipType !== "Associate") {
        nextStep = 9;
      }
    } catch {
      // If we can't load draft, default to Step 8
    }

    router.push(`/${nextStep}?applicationId=${appId}`);
  }

  return (
    <WizardStepShell
      step={7}
      title="Document Upload"
      description="Upload all required supporting documents. Max 10 MB per file (PDF, JPEG, PNG)."
      applicationId={applicationId}
      onNext={handleSubmit(onSubmit)}
      isSubmitting={isSubmitting}
    >
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(300px, 1fr))",gap:"16px"}}>
        {REQUIRED_DOCUMENTS.map((doc) => {
          const existing = documents.find((d) => d.documentType === doc.type);
          return (
            <DocumentUploadCard
              key={doc.type}
              label={doc.label}
              documentType={doc.type}
              required={doc.required}
              value={existing}
              onChange={(file) => {
                const updated = documents.filter((d) => d.documentType !== doc.type);
                if (file) {
                  setValue("documents", [
                    ...updated,
                    {
                      documentType: doc.type as Step7Data["documents"][number]["documentType"],
                      storageKey: file.storageKey,
                      fileName: file.fileName,
                      fileSize: file.fileSize,
                      mimeType: file.mimeType as Step7Data["documents"][number]["mimeType"],
                    },
                  ]);
                } else {
                  setValue("documents", updated);
                }
              }}
            />
          );
        })}
      </div>
      {errors.documents && (
        <p role="alert" style={{fontSize:"12px",color:"#ef4444"}}>{errors.documents.message}</p>
      )}

      <div style={{borderRadius:"8px",border:"1px solid #e2e8f0",backgroundColor:"#fffbeb",padding:"12px 16px"}}>
        <p style={{fontSize:"12px",color:"#92400e",margin:0}}>
          📋 Templates for Proposer Form, Seconder Form, and Code of Conduct will be made available in the CREDAI Pune member portal. Contact support for manual forms if needed.
        </p>
      </div>
    </WizardStepShell>
  );
}
