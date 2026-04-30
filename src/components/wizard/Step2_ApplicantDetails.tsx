"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { step2Schema, type Step2Data } from "@/schemas/wizard";
import { WizardStepShell } from "./WizardStepShell";
import { saveDraft } from "@/services/wizard/draftPersistence";

interface Props { applicationId?: string }

export function Step2_ApplicantDetails({ applicationId }: Props) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Step2Data>({ resolver: zodResolver(step2Schema) });

  async function onSubmit(data: Step2Data) {
    const appId = await saveDraft({ step: 2, data, applicationId });
    router.push(`/apply/3?applicationId=${appId}`);
  }

  return (
    <WizardStepShell
      step={2}
      title="Applicant Details"
      description="Primary contact person for this application."
      applicationId={applicationId}
      onNext={handleSubmit(onSubmit)}
      isSubmitting={isSubmitting}
    >
      <Field label="Full Name" id="applicantName" error={errors.applicantName?.message} required>
        <input
          id="applicantName"
          type="text"
          autoComplete="name"
          aria-invalid={errors.applicantName ? "true" : undefined}
          className="field-input"
          {...register("applicantName")}
        />
      </Field>

      <Field label="Designation" id="designation" error={errors.designation?.message} required>
        <input
          id="designation"
          type="text"
          aria-invalid={errors.designation ? "true" : undefined}
          className="field-input"
          {...register("designation")}
        />
      </Field>

      <Field label="Mobile Number" id="contactPhone" error={errors.contactPhone?.message} required>
        <input
          id="contactPhone"
          type="tel"
          autoComplete="tel"
          placeholder="+91XXXXXXXXXX"
          aria-invalid={errors.contactPhone ? "true" : undefined}
          className="field-input"
          {...register("contactPhone")}
        />
      </Field>

      <Field label="Email Address" id="contactEmail" error={errors.contactEmail?.message} required>
        <input
          id="contactEmail"
          type="email"
          autoComplete="email"
          aria-invalid={errors.contactEmail ? "true" : undefined}
          className="field-input"
          {...register("contactEmail")}
        />
      </Field>
    </WizardStepShell>
  );
}

function Field({
  label,
  id,
  error,
  required,
  children,
}: {
  label: string;
  id: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </label>
      {children}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
