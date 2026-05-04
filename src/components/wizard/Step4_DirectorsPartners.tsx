"use client";

import { useEffect } from "react";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { step4BaseSchema } from "@/schemas/wizard";
import { WizardStepShell } from "./WizardStepShell";
import { saveDraft, loadDraft } from "@/services/wizard/draftPersistence";
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
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Step4Data>({
    resolver: zodResolver(step4BaseSchema),
    defaultValues: { principals: Array.from({ length: minPrincipals }, () => ({ name: "", designation: "", email: "", phone: "", address: "", panNumber: "" })) },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "principals" });

  // Load draft if applicationId provided
  useEffect(() => {
    if (!applicationId) return;
    loadDraft(applicationId)
      .then((steps) => {
        const step4Data = steps[4] as Partial<Step4Data> | undefined;
        if (step4Data?.principals) {
          setValue("principals", step4Data.principals);
        }
      })
      .catch(() => { /* draft loading is non-critical */ });
  }, [applicationId, setValue]);

  async function onSubmit(data: Step4Data) {
    const appId = await saveDraft({ step: 4, data, applicationId });
    router.push(`/5?applicationId=${appId}`);
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
        <div key={field.id} style={{ borderRadius: "10px", border: "2px solid #1B3A6B", overflow: "hidden", marginBottom: "20px", backgroundColor: "#fff" }}>
          {/* Header bar with color */}
          <div style={{ backgroundColor: "#1B3A6B", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#fff", margin: 0 }}>{principalLabel} {index + 1}</h3>
            <button
              type="button"
              onClick={() => remove(index)}
              disabled={fields.length <= minPrincipals}
              style={{
                fontSize: "12px",
                color: "#fff",
                cursor: fields.length <= minPrincipals ? "not-allowed" : "pointer",
                background: fields.length <= minPrincipals ? "#9ca3af" : "#dc2626",
                border: "none",
                padding: "4px 12px",
                borderRadius: "4px",
                fontWeight: 500,
                opacity: fields.length <= minPrincipals ? 0.6 : 1,
              }}
            >
              Remove
            </button>
          </div>

          {/* Content area */}
          <div style={{ padding: "20px" }}>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div style={{display:"flex",flexDirection:"column",gap:"4px"}}>
              <label htmlFor={`principals.${index}.name`} className="block text-xs font-medium">Full Name *</label>
              <input id={`principals.${index}.name`} type="text" style={{width:"100%",borderRadius:"6px",border:"1px solid #e2e8f0",backgroundColor:"#fff",padding:"10px 12px",fontSize:"14px",color:"#0f172a",outline:"none"}} {...register(`principals.${index}.name`)} />
              {errors.principals?.[index]?.name && <p style={{fontSize:"12px",color:"#ef4444"}}>{errors.principals[index]?.name?.message}</p>}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"4px"}}>
              <label htmlFor={`principals.${index}.designation`} className="block text-xs font-medium">Designation *</label>
              <input id={`principals.${index}.designation`} type="text" style={{width:"100%",borderRadius:"6px",border:"1px solid #e2e8f0",backgroundColor:"#fff",padding:"10px 12px",fontSize:"14px",color:"#0f172a",outline:"none"}} {...register(`principals.${index}.designation`)} />
              {errors.principals?.[index]?.designation && <p style={{fontSize:"12px",color:"#ef4444"}}>{errors.principals[index]?.designation?.message}</p>}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"4px"}}>
              <label htmlFor={`principals.${index}.email`} className="block text-xs font-medium">Email *</label>
              <input id={`principals.${index}.email`} type="email" style={{width:"100%",borderRadius:"6px",border:"1px solid #e2e8f0",backgroundColor:"#fff",padding:"10px 12px",fontSize:"14px",color:"#0f172a",outline:"none"}} {...register(`principals.${index}.email`)} />
              {errors.principals?.[index]?.email && <p style={{fontSize:"12px",color:"#ef4444"}}>{errors.principals[index]?.email?.message}</p>}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"4px"}}>
              <label htmlFor={`principals.${index}.phone`} className="block text-xs font-medium">Phone *</label>
              <input id={`principals.${index}.phone`} type="tel" placeholder="+91XXXXXXXXXX" style={{width:"100%",borderRadius:"6px",border:"1px solid #e2e8f0",backgroundColor:"#fff",padding:"10px 12px",fontSize:"14px",color:"#0f172a",outline:"none"}} {...register(`principals.${index}.phone`)} />
              {errors.principals?.[index]?.phone && <p style={{fontSize:"12px",color:"#ef4444"}}>{errors.principals[index]?.phone?.message}</p>}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"4px"}}>
              <label htmlFor={`principals.${index}.panNumber`} className="block text-xs font-medium">PAN Number *</label>
              <input id={`principals.${index}.panNumber`} type="text" style={{width:"100%",borderRadius:"6px",border:"1px solid #e2e8f0",backgroundColor:"#fff",padding:"10px 12px",fontSize:"14px",color:"#0f172a",outline:"none"}} placeholder="ABCDE1234F" {...register(`principals.${index}.panNumber`)} />
              {errors.principals?.[index]?.panNumber && <p style={{fontSize:"12px",color:"#ef4444"}}>{errors.principals[index]?.panNumber?.message}</p>}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"4px"}}>
              <label htmlFor={`principals.${index}.din`} className="block text-xs font-medium">DIN (if applicable)</label>
              <input id={`principals.${index}.din`} type="text" style={{width:"100%",borderRadius:"6px",border:"1px solid #e2e8f0",backgroundColor:"#fff",padding:"10px 12px",fontSize:"14px",color:"#0f172a",outline:"none"}} maxLength={8} {...register(`principals.${index}.din`)} />
            </div>
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:"4px"}}>
            <label htmlFor={`principals.${index}.address`} className="block text-xs font-medium">Residential Address *</label>
            <textarea id={`principals.${index}.address`} rows={2} style={{width:"100%",borderRadius:"6px",border:"1px solid #e2e8f0",backgroundColor:"#fff",padding:"10px 12px",fontSize:"14px",color:"#0f172a",outline:"none"}} {...register(`principals.${index}.address`)} />
            {errors.principals?.[index]?.address && <p style={{fontSize:"12px",color:"#ef4444"}}>{errors.principals[index]?.address?.message}</p>}
          </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => append({ name: "", designation: "", email: "", phone: "", address: "", panNumber: "" })}
        style={{
          width: "100%",
          borderRadius: "8px",
          border: "2px dashed #cbd5e1",
          backgroundColor: "transparent",
          padding: "12px",
          fontSize: "14px",
          color: "#64748b",
          cursor: "pointer",
          fontWeight: 500,
        }}
      >
        + Add {principalLabel}
      </button>
    </WizardStepShell>
  );
}
