"use client";

import { useEffect } from "react";

import { useForm, useFieldArray, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { step5Schema, type Step5Data } from "@/schemas/wizard";
import { WizardStepShell } from "./WizardStepShell";
import { saveDraft, loadDraft } from "@/services/wizard/draftPersistence";

type ProjectItem = NonNullable<Step5Data["completedProjects"]>[number];

interface Props { applicationId?: string }

export function Step5_ProjectsExperience({ applicationId }: Props) {
  const router = useRouter();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Step5Data>({ resolver: zodResolver(step5Schema), defaultValues: { completedProjects: [], commencedProjects: [] } });

  const { fields: completedFields, append: appendCompleted, remove: removeCompleted } = useFieldArray({ control, name: "completedProjects" });
  const { fields: commencedFields, append: appendCommenced, remove: removeCommenced } = useFieldArray({ control, name: "commencedProjects" });

  // Load draft if applicationId provided
  useEffect(() => {
    if (!applicationId) return;
    loadDraft(applicationId)
      .then((steps) => {
        const step5Data = steps[5] as Partial<Step5Data> | undefined;
        if (step5Data) {
          if (step5Data.completedProjects) setValue("completedProjects", step5Data.completedProjects);
          if (step5Data.commencedProjects) setValue("commencedProjects", step5Data.commencedProjects);
        }
      })
      .catch(() => { /* draft loading is non-critical */ });
  }, [applicationId, setValue]);

  async function onSubmit(data: Step5Data) {
    const appId = await saveDraft({ step: 5, data, applicationId });
    router.push(`/6?applicationId=${appId}`);
  }

  const emptyProject = { projectName: "", location: "", completionYear: new Date().getFullYear() };

  return (
    <WizardStepShell
      step={5}
      title="Projects & Experience"
      description="List completed and commenced real estate projects."
      applicationId={applicationId}
      onNext={handleSubmit(onSubmit)}
      isSubmitting={isSubmitting}
    >
      <section>
        <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#0f172a", margin: 0 }}>Completed Projects</h3>
          <button
            type="button"
            onClick={() => appendCompleted(emptyProject)}
            style={{
              fontSize: "13px",
              color: "#fff",
              background: "#1B3A6B",
              border: "none",
              padding: "6px 12px",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            + Add Project
          </button>
        </div>
        {completedFields.length === 0 && <p style={{ fontSize: "13px", color: "#64748b" }}>No completed projects added.</p>}
        {completedFields.map((field, index) => (
          <ProjectEntry key={field.id} index={index} prefix="completedProjects" register={register} onRemove={() => removeCompleted(index)} errors={errors.completedProjects?.[index]} />
        ))}
      </section>

      <section style={{ marginTop: "24px" }}>
        <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#0f172a", margin: 0 }}>Commenced Projects</h3>
          <button
            type="button"
            onClick={() => appendCommenced(emptyProject)}
            style={{
              fontSize: "13px",
              color: "#fff",
              background: "#1B3A6B",
              border: "none",
              padding: "6px 12px",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            + Add Project
          </button>
        </div>
        {commencedFields.length === 0 && <p style={{ fontSize: "13px", color: "#64748b" }}>No commenced projects added.</p>}
        {commencedFields.map((field, index) => (
          <ProjectEntry key={field.id} index={index} prefix="commencedProjects" register={register} onRemove={() => removeCommenced(index)} errors={errors.commencedProjects?.[index]} />
        ))}
      </section>
    </WizardStepShell>
  );
}

function ProjectEntry({ index, prefix, register, onRemove, errors }: { index: number; prefix: "completedProjects" | "commencedProjects"; register: ReturnType<typeof useForm<Step5Data>>["register"]; onRemove: () => void; errors?: FieldErrors<ProjectItem> }) {
  return (
    <div style={{ borderRadius: "10px", border: "2px solid #1B3A6B", overflow: "hidden", marginBottom: "16px", backgroundColor: "#fff" }}>
      {/* Header */}
      <div style={{ backgroundColor: "#1B3A6B", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "14px", fontWeight: 600, color: "#fff", margin: 0 }}>Project {index + 1}</span>
        <button
          type="button"
          onClick={onRemove}
          style={{
            fontSize: "12px",
            color: "#fff",
            background: "#dc2626",
            border: "none",
            padding: "4px 10px",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          Remove
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: "16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>Project Name *</label>
            <input
              type="text"
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
              {...register(`${prefix}.${index}.projectName`)}
            />
            {errors?.projectName && <p style={{ fontSize: "12px", color: "#ef4444", margin: 0 }}>{errors.projectName.message}</p>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>Location *</label>
            <input
              type="text"
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
              {...register(`${prefix}.${index}.location`)}
            />
            {errors?.location && <p style={{ fontSize: "12px", color: "#ef4444", margin: 0 }}>{errors.location.message}</p>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>Completion Year *</label>
            <input
              type="number"
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
              {...register(`${prefix}.${index}.completionYear`, { valueAsNumber: true })}
            />
            {errors?.completionYear && <p style={{ fontSize: "12px", color: "#ef4444", margin: 0 }}>{errors.completionYear.message}</p>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>RERA Number</label>
            <input
              type="text"
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
              {...register(`${prefix}.${index}.reraNumber`)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
