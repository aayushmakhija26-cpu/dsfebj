"use client";

import { useForm, useFieldArray, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { step5Schema, type Step5Data } from "@/schemas/wizard";
import { WizardStepShell } from "./WizardStepShell";
import { saveDraft } from "@/services/wizard/draftPersistence";

type ProjectItem = NonNullable<Step5Data["completedProjects"]>[number];

interface Props { applicationId?: string }

export function Step5_ProjectsExperience({ applicationId }: Props) {
  const router = useRouter();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Step5Data>({ resolver: zodResolver(step5Schema), defaultValues: { completedProjects: [], commencedProjects: [] } });

  const { fields: completedFields, append: appendCompleted, remove: removeCompleted } = useFieldArray({ control, name: "completedProjects" });
  const { fields: commencedFields, append: appendCommenced, remove: removeCommenced } = useFieldArray({ control, name: "commencedProjects" });

  async function onSubmit(data: Step5Data) {
    const appId = await saveDraft({ step: 5, data, applicationId });
    router.push(`/apply/6?applicationId=${appId}`);
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
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Completed Projects</h3>
          <button type="button" onClick={() => appendCompleted(emptyProject)} className="text-xs text-primary hover:underline">+ Add Project</button>
        </div>
        {completedFields.length === 0 && <p className="text-xs text-muted-foreground">No completed projects added.</p>}
        {completedFields.map((field, index) => (
          <ProjectEntry key={field.id} index={index} prefix="completedProjects" register={register} onRemove={() => removeCompleted(index)} errors={errors.completedProjects?.[index]} />
        ))}
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Commenced Projects</h3>
          <button type="button" onClick={() => appendCommenced(emptyProject)} className="text-xs text-primary hover:underline">+ Add Project</button>
        </div>
        {commencedFields.length === 0 && <p className="text-xs text-muted-foreground">No commenced projects added.</p>}
        {commencedFields.map((field, index) => (
          <ProjectEntry key={field.id} index={index} prefix="commencedProjects" register={register} onRemove={() => removeCommenced(index)} errors={errors.commencedProjects?.[index]} />
        ))}
      </section>
    </WizardStepShell>
  );
}

function ProjectEntry({ index, prefix, register, onRemove, errors }: { index: number; prefix: "completedProjects" | "commencedProjects"; register: ReturnType<typeof useForm<Step5Data>>["register"]; onRemove: () => void; errors?: FieldErrors<ProjectItem> }) {
  return (
    <div className="mb-3 rounded-md border border-muted p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">Project {index + 1}</span>
        <button type="button" onClick={onRemove} className="text-xs text-destructive hover:underline">Remove</button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="block text-xs font-medium">Project Name *</label>
          <input type="text" className="field-input" {...register(`${prefix}.${index}.projectName`)} />
          {errors?.projectName && <p className="text-xs text-destructive">{errors.projectName.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium">Location *</label>
          <input type="text" className="field-input" {...register(`${prefix}.${index}.location`)} />
          {errors?.location && <p className="text-xs text-destructive">{errors.location.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium">Completion Year *</label>
          <input type="number" className="field-input" {...register(`${prefix}.${index}.completionYear`, { valueAsNumber: true })} />
          {errors?.completionYear && <p className="text-xs text-destructive">{errors.completionYear.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium">RERA Number</label>
          <input type="text" className="field-input font-mono" {...register(`${prefix}.${index}.reraNumber`)} />
        </div>
      </div>
    </div>
  );
}
