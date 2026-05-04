"use client";

import { useEffect } from "react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { step8Schema, type Step8Data } from "@/schemas/wizard";
import { WizardStepShell } from "./WizardStepShell";
import { saveDraft, loadDraft } from "@/services/wizard/draftPersistence";

interface Props { applicationId?: string }

// Placeholder member type — would be populated from API in production
interface OrdinaryMember { id: string; firmName: string; membershipNumber: string }

export function Step8_Proposer_Seconder({ applicationId }: Props) {
  const router = useRouter();

  const {
    register,
    watch,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Step8Data>({ resolver: zodResolver(step8Schema) });

  const proposerId = watch("proposerId");

  // Load draft if applicationId provided
  useEffect(() => {
    if (!applicationId) return;
    loadDraft(applicationId)
      .then((steps) => {
        const step8Data = steps[8] as Partial<Step8Data> | undefined;
        if (step8Data) {
          if (step8Data.proposerId) setValue("proposerId", step8Data.proposerId);
          if (step8Data.seconderId) setValue("seconderId", step8Data.seconderId);
        }
      })
      .catch(() => { /* draft loading is non-critical */ });
  }, [applicationId, setValue]);

  async function onSubmit(data: Step8Data) {
    const appId = await saveDraft({ step: 8, data, applicationId });
    router.push(`/9?applicationId=${appId}`);
  }

  // Members would be fetched from tRPC in a real implementation
  const members: OrdinaryMember[] = [];

  return (
    <WizardStepShell
      step={8}
      title="Proposer & Seconder"
      description="For Associate Membership, two existing Ordinary Members must propose and second your application."
      applicationId={applicationId}
      onNext={handleSubmit(onSubmit)}
      isSubmitting={isSubmitting}
    >
      <div style={{borderRadius:"6px",border:"1px solid #fcd34d",backgroundColor:"#fffbeb",padding:"12px",fontSize:"14px",color:"#92400e"}}>
        This step is required only for <strong>Associate Membership</strong>. Skip if applying for Ordinary or RERA Project membership.
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:"4px"}}>
        <label htmlFor="proposerId" style={{display:"block",fontSize:"14px",fontWeight:500,color:"#374151",marginBottom:"6px"}}>Proposer (Ordinary Member)</label>
        <select
          id="proposerId"
          aria-invalid={errors.proposerId ? "true" : undefined}
          style={{width:"100%",borderRadius:"6px",border:"1px solid #e2e8f0",backgroundColor:"#fff",padding:"10px 12px",fontSize:"14px",color:"#0f172a",outline:"none"}}
          {...register("proposerId")}
        >
          <option value="">Select proposer…</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.firmName} ({m.membershipNumber})</option>
          ))}
        </select>
        {errors.proposerId && <p role="alert" style={{fontSize:"12px",color:"#ef4444"}}>{errors.proposerId.message}</p>}
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:"4px"}}>
        <label htmlFor="seconderId" style={{display:"block",fontSize:"14px",fontWeight:500,color:"#374151",marginBottom:"6px"}}>Seconder (Ordinary Member)</label>
        <select
          id="seconderId"
          aria-invalid={errors.seconderId ? "true" : undefined}
          style={{width:"100%",borderRadius:"6px",border:"1px solid #e2e8f0",backgroundColor:"#fff",padding:"10px 12px",fontSize:"14px",color:"#0f172a",outline:"none"}}
          {...register("seconderId")}
        >
          <option value="">Select seconder…</option>
          {members
            .filter((m) => m.id !== proposerId)
            .map((m) => (
              <option key={m.id} value={m.id}>{m.firmName} ({m.membershipNumber})</option>
            ))}
        </select>
        {errors.seconderId && <p role="alert" style={{fontSize:"12px",color:"#ef4444"}}>{errors.seconderId.message}</p>}
      </div>
    </WizardStepShell>
  );
}
