"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { step2Schema, type Step2Data } from "@/schemas/wizard";
import { WizardStepShell } from "./WizardStepShell";
import { saveDraft, loadDraft } from "@/services/wizard/draftPersistence";

interface Props { applicationId?: string }

export function Step2_ApplicantDetails({ applicationId }: Props) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Step2Data>({ resolver: zodResolver(step2Schema) });

  // Load draft if applicationId provided
  useEffect(() => {
    if (!applicationId) return;
    loadDraft(applicationId)
      .then((steps) => {
        const step2Data = steps[2] as Partial<Step2Data> | undefined;
        if (step2Data) {
          Object.entries(step2Data).forEach(([key, value]) => {
            setValue(key as keyof Step2Data, value);
          });
        }
      })
      .catch(() => { /* draft loading is non-critical */ });
  }, [applicationId, setValue]);

  async function onSubmit(data: Step2Data) {
    const appId = await saveDraft({ step: 2, data, applicationId });
    router.push(`/3?applicationId=${appId}`);
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
          style={{
            width: "100%",
            borderRadius: "6px",
            border: "1px solid #e2e8f0",
            backgroundColor: "#fff",
            padding: "10px 12px",
            fontSize: "14px",
            color: "#0f172a",
            outline: "none",
          }}
          {...register("applicantName")}
        />
      </Field>

      <Field label="Designation" id="designation" error={errors.designation?.message} required>
        <input
          id="designation"
          type="text"
          aria-invalid={errors.designation ? "true" : undefined}
          style={{
            width: "100%",
            borderRadius: "6px",
            border: "1px solid #e2e8f0",
            backgroundColor: "#fff",
            padding: "10px 12px",
            fontSize: "14px",
            color: "#0f172a",
            outline: "none",
          }}
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
          style={{
            width: "100%",
            borderRadius: "6px",
            border: "1px solid #e2e8f0",
            backgroundColor: "#fff",
            padding: "10px 12px",
            fontSize: "14px",
            color: "#0f172a",
            outline: "none",
          }}
          {...register("contactPhone")}
        />
      </Field>

      <Field label="Email Address" id="contactEmail" error={errors.contactEmail?.message} required>
        <input
          id="contactEmail"
          type="email"
          autoComplete="email"
          aria-invalid={errors.contactEmail ? "true" : undefined}
          style={{
            width: "100%",
            borderRadius: "6px",
            border: "1px solid #e2e8f0",
            backgroundColor: "#fff",
            padding: "10px 12px",
            fontSize: "14px",
            color: "#0f172a",
            outline: "none",
          }}
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
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <label htmlFor={id} style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>
        {label}
        {required && <span style={{ marginLeft: "4px", color: "#ef4444" }}>*</span>}
      </label>
      {children}
      {error && (
        <p role="alert" style={{ fontSize: "12px", color: "#ef4444" }}>
          {error}
        </p>
      )}
    </div>
  );
}
