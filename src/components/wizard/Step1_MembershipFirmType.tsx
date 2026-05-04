"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { step1Schema, type Step1Data } from "@/schemas/wizard";
import { WizardStepShell } from "./WizardStepShell";
import { REQUIRED_DOCUMENTS_BY_MEMBERSHIP } from "@/lib/constants";
import { MEMBERSHIP_TYPES, FIRM_TYPES } from "@/lib/constants";
import { saveDraft, loadDraft } from "@/services/wizard/draftPersistence";

interface Props { applicationId?: string }

export function Step1_MembershipFirmType({ applicationId }: Props) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: { documentsAcknowledged: false },
  });

  // Load draft if applicationId provided
  useEffect(() => {
    if (!applicationId) return;
    loadDraft(applicationId)
      .then((steps) => {
        const step1Data = steps[1] as Partial<Step1Data> | undefined;
        if (step1Data) {
          if (step1Data.membershipType) setValue("membershipType", step1Data.membershipType);
          if (step1Data.firmType) setValue("firmType", step1Data.firmType);
          if (step1Data.documentsAcknowledged) setValue("documentsAcknowledged", step1Data.documentsAcknowledged);
        }
      })
      .catch(() => { /* draft loading is non-critical */ });
  }, [applicationId, setValue]);

  const membershipType = watch("membershipType");
  const requiredDocs = membershipType ? REQUIRED_DOCUMENTS_BY_MEMBERSHIP[membershipType] : [];

  async function onSubmit(data: Step1Data) {
    const appId = await saveDraft({ step: 1, data, applicationId });
    router.push(`/2?applicationId=${appId}`);
  }

  return (
    <WizardStepShell
      step={1}
      title="Membership Type & Firm Type"
      description="CREDAI Pune offers membership for Individual builders, Proprietorships, Partnerships/LLPs, and Companies. Select your firm's legal structure to continue."
      applicationId={applicationId}
      onNext={handleSubmit(onSubmit)}
      isSubmitting={isSubmitting}
      hideBack
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <label htmlFor="membershipType" style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>
          Membership Type <span style={{ color: "#ef4444" }}>*</span>
        </label>
        <select
          id="membershipType"
          aria-invalid={errors.membershipType ? "true" : undefined}
          style={{
            width: "100%",
            borderRadius: "6px",
            border: errors.membershipType ? "1px solid #ef4444" : "1px solid #e2e8f0",
            backgroundColor: errors.membershipType ? "#fef2f2" : "#fff",
            padding: "10px 12px",
            fontSize: "14px",
            color: "#0f172a",
            outline: "none",
            cursor: "pointer",
          }}
          {...register("membershipType")}
        >
          <option value="">Select…</option>
          {MEMBERSHIP_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        {errors.membershipType && (
          <p role="alert" style={{ fontSize: "12px", color: "#ef4444", marginTop: "4px" }}>{errors.membershipType.message}</p>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <label htmlFor="firmType" style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>
          Firm Type <span style={{ color: "#ef4444" }}>*</span>
        </label>
        <select
          id="firmType"
          aria-invalid={errors.firmType ? "true" : undefined}
          style={{
            width: "100%",
            borderRadius: "6px",
            border: errors.firmType ? "1px solid #ef4444" : "1px solid #e2e8f0",
            backgroundColor: errors.firmType ? "#fef2f2" : "#fff",
            padding: "10px 12px",
            fontSize: "14px",
            color: "#0f172a",
            outline: "none",
            cursor: "pointer",
          }}
          {...register("firmType")}
        >
          <option value="">Select…</option>
          {FIRM_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        {errors.firmType && (
          <p role="alert" style={{ fontSize: "12px", color: "#ef4444", marginTop: "4px" }}>{errors.firmType.message}</p>
        )}
      </div>

      {requiredDocs && requiredDocs.length > 0 && (
        <div style={{ borderRadius: "6px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", padding: "16px" }}>
          <p style={{ marginBottom: "8px", fontSize: "14px", fontWeight: 500, color: "#0f172a" }}>Documents you will need:</p>
          <ul style={{ display: "flex", flexDirection: "column", gap: "4px", listStyle: "none", padding: 0, margin: 0 }}>
            {requiredDocs.map((doc) => (
              <li key={doc} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#64748b" }}>
                <span style={{ height: "6px", width: "6px", borderRadius: "50%", backgroundColor: "#1B3A6B", flexShrink: 0 }} aria-hidden="true" />
                {doc}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
        <input
          id="documentsAcknowledged"
          type="checkbox"
          aria-invalid={errors.documentsAcknowledged ? "true" : undefined}
          aria-describedby={errors.documentsAcknowledged ? "docs-ack-error" : undefined}
          style={{
            marginTop: "4px",
            height: "16px",
            width: "16px",
            borderRadius: "4px",
            border: "1px solid #e2e8f0",
            cursor: "pointer",
            accentColor: "#1B3A6B",
          }}
          {...register("documentsAcknowledged")}
        />
        <label htmlFor="documentsAcknowledged" style={{ fontSize: "14px", color: "#0f172a", cursor: "pointer" }}>
          I acknowledge the document requirements listed above
        </label>
      </div>
      {errors.documentsAcknowledged && (
        <p id="docs-ack-error" role="alert" style={{ fontSize: "12px", color: "#ef4444", marginTop: "4px" }}>
          {errors.documentsAcknowledged.message}
        </p>
      )}
    </WizardStepShell>
  );
}
