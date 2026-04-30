"use client";

import Link from "next/link";
import { clsx } from "clsx";

const STEP_LABELS: Record<number, string> = {
  1: "Membership Type",
  2: "Applicant Details",
  3: "Firm Details",
  4: "Directors / Partners",
  5: "Projects & Experience",
  6: "Financials",
  7: "Documents",
  8: "Proposer & Seconder",
  9: "Compliance",
  10: "Payment",
  11: "Review & Submit",
  12: "Confirmation",
};

interface Props {
  currentStep: number;
  applicationId?: string;
  completedSteps?: Set<number>;
}

export function WizardStepRail({ currentStep, applicationId, completedSteps = new Set() }: Props) {
  return (
    <nav aria-label="Application steps">
      <ol className="space-y-1">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((step) => {
          const isComplete = completedSteps.has(step);
          const isCurrent = step === currentStep;
          const isLocked = !isComplete && step > currentStep;

          const href = applicationId
            ? `/apply/${step}?applicationId=${applicationId}`
            : `/apply/${step}`;

          return (
            <li key={step}>
              {isLocked ? (
                <span
                  aria-disabled="true"
                  className={clsx(
                    "flex cursor-not-allowed items-center gap-2 rounded px-2 py-1.5 text-sm opacity-40",
                  )}
                >
                  <StepBadge step={step} isComplete={false} isCurrent={false} />
                  {STEP_LABELS[step]}
                </span>
              ) : (
                <Link
                  href={href}
                  aria-current={isCurrent ? "step" : undefined}
                  className={clsx(
                    "flex items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isCurrent && "bg-primary/10 font-medium text-primary",
                    !isCurrent && "text-foreground hover:bg-muted",
                  )}
                >
                  <StepBadge step={step} isComplete={isComplete} isCurrent={isCurrent} />
                  {STEP_LABELS[step]}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function StepBadge({
  step,
  isComplete,
  isCurrent,
}: {
  step: number;
  isComplete: boolean;
  isCurrent: boolean;
}) {
  return (
    <span
      className={clsx(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-medium",
        isComplete && "bg-green-600 text-white",
        isCurrent && !isComplete && "bg-primary text-primary-foreground",
        !isComplete && !isCurrent && "border border-muted-foreground/40 text-muted-foreground",
      )}
      aria-hidden="true"
    >
      {isComplete ? "✓" : step}
    </span>
  );
}
