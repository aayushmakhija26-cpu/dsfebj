"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { step4BaseSchema } from "@/schemas/wizard";
import { WizardStepShell } from "./WizardStepShell";
import { saveDraft } from "@/services/wizard/draftPersistence";
import { FIRM_PRINCIPAL_MINIMUMS } from "@/lib/constants";

type Step4Data = z.infer<typeof step4BaseSchema>;

interface Props { applicationId?: string; firmType?: string }

export function Step4_DirectorsPartners({ applicationId, firmType = "Partnership" }: Props) {
  const router = useRouter();
  const minPrincipals = FIRM_PRINCIPAL_MINIMUMS[firmType] ?? 2;

  const principalLabel =
    firmType === "Proprietorship"
      ? "Proprietor"
      : firmType === "Partnership" || firmType === "LLP"
        ? "Partner"
        : "Director";

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Step4Data>({
    resolver: zodResolver(step4BaseSchema),
    defaultValues: { principals: Array.from({ length: minPrincipals }, () => ({ name: "", designation: "", email: "", phone: "", address: "", panNumber: "" })) },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "principals" });

  async function onSubmit(data: Step4Data) {
    const appId = await saveDraft({ step: 4, data, applicationId });
    router.push(`/apply/5?applicationId=${appId}`);
  }

  return (
    <WizardStepShell
      step={4}
      title={`${principalLabel}s / Partners`}
      description={`Add all ${principalLabel.toLowerCase()}s. Minimum ${minPrincipals} required for ${firmType}.`}
      applicationId={applicationId}
      onNext={handleSubmit(onSubmit)}
      isSubmitting={isSubmitting}
    >
      {fields.map((field, index) => (
        <div key={field.id} className="rounded-md border border-muted p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">{principalLabel} {index + 1}</h3>
            {fields.length > minPrincipals && (
              <button type="button" onClick={() => remove(index)} className="text-xs text-destructive hover:underline">
                Remove
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor={`principals.${index}.name`} className="block text-xs font-medium">Full Name *</label>
              <input id={`principals.${index}.name`} type="text" className="field-input" {...register(`principals.${index}.name`)} />
              {errors.principals?.[index]?.name && <p className="text-xs text-destructive">{errors.principals[index]?.name?.message}</p>}
            </div>
            <div className="space-y-1">
              <label htmlFor={`principals.${index}.designation`} className="block text-xs font-medium">Designation *</label>
              <input id={`principals.${index}.designation`} type="text" className="field-input" {...register(`principals.${index}.designation`)} />
              {errors.principals?.[index]?.designation && <p className="text-xs text-destructive">{errors.principals[index]?.designation?.message}</p>}
            </div>
            <div className="space-y-1">
              <label htmlFor={`principals.${index}.email`} className="block text-xs font-medium">Email *</label>
              <input id={`principals.${index}.email`} type="email" className="field-input" {...register(`principals.${index}.email`)} />
              {errors.principals?.[index]?.email && <p className="text-xs text-destructive">{errors.principals[index]?.email?.message}</p>}
            </div>
            <div className="space-y-1">
              <label htmlFor={`principals.${index}.phone`} className="block text-xs font-medium">Phone *</label>
              <input id={`principals.${index}.phone`} type="tel" placeholder="+91XXXXXXXXXX" className="field-input" {...register(`principals.${index}.phone`)} />
              {errors.principals?.[index]?.phone && <p className="text-xs text-destructive">{errors.principals[index]?.phone?.message}</p>}
            </div>
            <div className="space-y-1">
              <label htmlFor={`principals.${index}.panNumber`} className="block text-xs font-medium">PAN Number *</label>
              <input id={`principals.${index}.panNumber`} type="text" className="field-input font-mono uppercase" placeholder="ABCDE1234F" {...register(`principals.${index}.panNumber`)} />
              {errors.principals?.[index]?.panNumber && <p className="text-xs text-destructive">{errors.principals[index]?.panNumber?.message}</p>}
            </div>
            <div className="space-y-1">
              <label htmlFor={`principals.${index}.din`} className="block text-xs font-medium">DIN (if applicable)</label>
              <input id={`principals.${index}.din`} type="text" className="field-input font-mono" maxLength={8} {...register(`principals.${index}.din`)} />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor={`principals.${index}.address`} className="block text-xs font-medium">Residential Address *</label>
            <textarea id={`principals.${index}.address`} rows={2} className="field-input" {...register(`principals.${index}.address`)} />
            {errors.principals?.[index]?.address && <p className="text-xs text-destructive">{errors.principals[index]?.address?.message}</p>}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => append({ name: "", designation: "", email: "", phone: "", address: "", panNumber: "" })}
        className="w-full rounded-md border border-dashed border-muted-foreground/40 py-2 text-sm text-muted-foreground hover:border-muted-foreground"
      >
        + Add {principalLabel}
      </button>
    </WizardStepShell>
  );
}
