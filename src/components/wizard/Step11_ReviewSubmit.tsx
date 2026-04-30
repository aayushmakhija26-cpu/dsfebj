"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WizardStepShell } from "./WizardStepShell";

interface Props { applicationId?: string }

export function Step11_ReviewSubmit({ applicationId }: Props) {
  const router = useRouter();
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!declarationAccepted) {
      setError("You must accept the final declaration before submitting.");
      return;
    }
    if (!applicationId) {
      setError("Application ID is missing. Please restart your application.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/trpc/wizard.submitApplication", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json: { applicationId, finalDeclarationAccepted: true } }),
      });
      if (!res.ok) {
        setError("Failed to submit application. Please try again.");
        return;
      }
      router.push(`/apply/12?applicationId=${applicationId}`);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <WizardStepShell
      step={11}
      title="Review & Submit"
      description="Review your application summary before final submission. Once submitted, the application cannot be edited."
      applicationId={applicationId}
      onNext={handleSubmit}
      isSubmitting={isSubmitting}
      nextLabel="Submit Application"
    >
      <div className="rounded-md border border-muted bg-muted/10 p-4">
        <p className="text-sm text-muted-foreground">
          A read-only summary of your entered data would be displayed here, drawn from the saved draft steps.
          In full implementation, each section (Firm Details, Directors, Documents, etc.) is shown in collapsed accordions for final review.
        </p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">{error}</p>
      )}

      <div className="flex items-start gap-2">
        <input
          id="finalDeclaration"
          type="checkbox"
          checked={declarationAccepted}
          onChange={(e) => setDeclarationAccepted(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-input"
          aria-describedby={!declarationAccepted && error ? "final-decl-error" : undefined}
        />
        <label htmlFor="finalDeclaration" className="text-sm">
          I confirm that all information provided is accurate and I consent to the submission of this application. I understand this submission is final and the application will enter CREDAI Pune&apos;s review process.{" "}
          <span className="text-destructive">*</span>
        </label>
      </div>
    </WizardStepShell>
  );
}
