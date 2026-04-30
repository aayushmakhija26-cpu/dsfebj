"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { step8Schema, type Step8Data } from "@/schemas/wizard";
import { WizardStepShell } from "./WizardStepShell";
import { saveDraft } from "@/services/wizard/draftPersistence";

interface Props { applicationId?: string }

// Placeholder member type — would be populated from API in production
interface OrdinaryMember { id: string; firmName: string; membershipNumber: string }

export function Step8_Proposer_Seconder({ applicationId }: Props) {
  const router = useRouter();

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Step8Data>({ resolver: zodResolver(step8Schema) });

  const proposerId = watch("proposerId");

  async function onSubmit(data: Step8Data) {
    const appId = await saveDraft({ step: 8, data, applicationId });
    router.push(`/apply/9?applicationId=${appId}`);
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
      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        This step is required only for <strong>Associate Membership</strong>. Skip if applying for Ordinary or RERA Project membership.
      </div>

      <div className="space-y-1">
        <label htmlFor="proposerId" className="block text-sm font-medium">Proposer (Ordinary Member)</label>
        <select
          id="proposerId"
          aria-invalid={errors.proposerId ? "true" : undefined}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          {...register("proposerId")}
        >
          <option value="">Select proposer…</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.firmName} ({m.membershipNumber})</option>
          ))}
        </select>
        {errors.proposerId && <p role="alert" className="text-xs text-destructive">{errors.proposerId.message}</p>}
      </div>

      <div className="space-y-1">
        <label htmlFor="seconderId" className="block text-sm font-medium">Seconder (Ordinary Member)</label>
        <select
          id="seconderId"
          aria-invalid={errors.seconderId ? "true" : undefined}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          {...register("seconderId")}
        >
          <option value="">Select seconder…</option>
          {members
            .filter((m) => m.id !== proposerId)
            .map((m) => (
              <option key={m.id} value={m.id}>{m.firmName} ({m.membershipNumber})</option>
            ))}
        </select>
        {errors.seconderId && <p role="alert" className="text-xs text-destructive">{errors.seconderId.message}</p>}
      </div>
    </WizardStepShell>
  );
}
