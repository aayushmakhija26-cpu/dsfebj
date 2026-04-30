"use client";

import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { WIZARD_TOTAL_STEPS } from "@/lib/constants";

interface Props {
  step: number;
  title: string;
  description?: string;
  applicationId?: string;
  onNext?: () => void;
  onBack?: () => void;
  isSubmitting?: boolean;
  nextLabel?: string;
  hideBack?: boolean;
  children: React.ReactNode;
}

export function WizardStepShell({
  step,
  title,
  description,
  applicationId,
  onNext,
  onBack,
  isSubmitting,
  nextLabel,
  hideBack,
  children,
}: Props) {
  const router = useRouter();
  const isLastStep = step === WIZARD_TOTAL_STEPS;

  function goBack() {
    if (onBack) { onBack(); return; }
    const prev = step - 1;
    if (prev < 1) return;
    const url = applicationId ? `/apply/${prev}?applicationId=${applicationId}` : `/apply/${prev}`;
    router.push(url);
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Step {step} of {WIZARD_TOTAL_STEPS}
        </p>
        <h2 className="mt-1 text-xl font-semibold">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>

      <div className="space-y-4">{children}</div>

      <div className="flex items-center justify-between pt-4">
        {!hideBack && step > 1 ? (
          <button
            type="button"
            onClick={goBack}
            disabled={isSubmitting}
            className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          >
            Back
          </button>
        ) : (
          <div />
        )}

        {onNext && (
          <button
            type="button"
            onClick={onNext}
            disabled={isSubmitting}
            className={clsx(
              "rounded-md px-6 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
              isLastStep
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
          >
            {isSubmitting ? "Saving…" : (nextLabel ?? (isLastStep ? "Submit" : "Continue"))}
          </button>
        )}
      </div>
    </div>
  );
}
