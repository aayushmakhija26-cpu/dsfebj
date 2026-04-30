"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { step1Schema, type Step1Data } from "@/schemas/wizard";
import { WizardStepShell } from "./WizardStepShell";
import { REQUIRED_DOCUMENTS_BY_MEMBERSHIP } from "@/lib/constants";
import { MEMBERSHIP_TYPES, FIRM_TYPES } from "@/lib/constants";
import { saveDraft } from "@/services/wizard/draftPersistence";

interface Props { applicationId?: string }

export function Step1_MembershipFirmType({ applicationId }: Props) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: { documentsAcknowledged: false },
  });

  const membershipType = watch("membershipType");
  const requiredDocs = membershipType ? REQUIRED_DOCUMENTS_BY_MEMBERSHIP[membershipType] : [];

  async function onSubmit(data: Step1Data) {
    const appId = await saveDraft({ step: 1, data, applicationId });
    router.push(`/apply/2?applicationId=${appId}`);
  }

  return (
    <WizardStepShell
      step={1}
      title="Membership Type & Firm Type"
      description="Select the membership category and your firm's legal structure."
      applicationId={applicationId}
      onNext={handleSubmit(onSubmit)}
      isSubmitting={isSubmitting}
      hideBack
    >
      <div className="space-y-1">
        <label htmlFor="membershipType" className="block text-sm font-medium">
          Membership Type <span className="text-destructive">*</span>
        </label>
        <select
          id="membershipType"
          aria-invalid={errors.membershipType ? "true" : undefined}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          {...register("membershipType")}
        >
          <option value="">Select…</option>
          {MEMBERSHIP_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        {errors.membershipType && (
          <p role="alert" className="text-xs text-destructive">{errors.membershipType.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="firmType" className="block text-sm font-medium">
          Firm Type <span className="text-destructive">*</span>
        </label>
        <select
          id="firmType"
          aria-invalid={errors.firmType ? "true" : undefined}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          {...register("firmType")}
        >
          <option value="">Select…</option>
          {FIRM_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        {errors.firmType && (
          <p role="alert" className="text-xs text-destructive">{errors.firmType.message}</p>
        )}
      </div>

      {requiredDocs && requiredDocs.length > 0 && (
        <div className="rounded-md border border-muted bg-muted/30 p-4">
          <p className="mb-2 text-sm font-medium">Documents you will need:</p>
          <ul className="space-y-1">
            {requiredDocs.map((doc) => (
              <li key={doc} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
                {doc}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-start gap-2">
        <input
          id="documentsAcknowledged"
          type="checkbox"
          aria-invalid={errors.documentsAcknowledged ? "true" : undefined}
          aria-describedby={errors.documentsAcknowledged ? "docs-ack-error" : undefined}
          className="mt-0.5 h-4 w-4 rounded border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          {...register("documentsAcknowledged")}
        />
        <label htmlFor="documentsAcknowledged" className="text-sm">
          I acknowledge the document requirements listed above
        </label>
      </div>
      {errors.documentsAcknowledged && (
        <p id="docs-ack-error" role="alert" className="text-xs text-destructive">
          {errors.documentsAcknowledged.message}
        </p>
      )}
    </WizardStepShell>
  );
}
