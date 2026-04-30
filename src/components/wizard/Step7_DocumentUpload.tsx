"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { step7Schema, type Step7Data } from "@/schemas/wizard";
import { WizardStepShell } from "./WizardStepShell";
import { DocumentUploadCard } from "./DocumentUploadCard";
import { saveDraft } from "@/services/wizard/draftPersistence";

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

  async function onSubmit(data: Step7Data) {
    const appId = await saveDraft({ step: 7, data, applicationId });
    router.push(`/apply/8?applicationId=${appId}`);
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
      <div className="space-y-4">
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
        <p role="alert" className="text-xs text-destructive">{errors.documents.message}</p>
      )}

      <div className="rounded-md border border-muted p-3">
        <p className="text-xs font-medium">Download templates:</p>
        <div className="mt-1 flex gap-4">
          <a href="/templates/proposer-form.pdf" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Proposer Form</a>
          <a href="/templates/seconder-form.pdf" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Seconder Form</a>
          <a href="/templates/code-of-conduct.pdf" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Code of Conduct</a>
        </div>
      </div>
    </WizardStepShell>
  );
}
