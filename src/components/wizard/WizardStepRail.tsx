"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadDraft } from "@/services/wizard/draftPersistence";

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
  const [membershipType, setMembershipType] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!applicationId) {
      setLoaded(true);
      return;
    }

    loadDraft(applicationId)
      .then((steps) => {
        const step1Data = steps[1] as { membershipType?: string } | undefined;
        setMembershipType(step1Data?.membershipType ?? null);
      })
      .catch(() => {
        // If draft loading fails, show all steps
      })
      .finally(() => {
        setLoaded(true);
      });
  }, [applicationId]);

  return (
    <nav aria-label="Application steps">
      <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
        {Array.from({ length: 12 }, (_, i) => i + 1).map((step) => {
          const isComplete = completedSteps.has(step);
          const isCurrent = step === currentStep;
          const isLocked = !isComplete && step > currentStep;
          const isStep8Skipped = step === 8 && loaded && membershipType && membershipType !== "Associate";

          const href = applicationId ? `/${step}?applicationId=${applicationId}` : `/${step}`;

          const itemStyle: React.CSSProperties = {
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "8px 10px",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: isCurrent ? 600 : 400,
            textDecoration: isStep8Skipped ? "line-through" : "none",
            cursor: isLocked || isStep8Skipped ? "not-allowed" : "pointer",
            opacity: isLocked || isStep8Skipped ? 0.5 : 1,
            backgroundColor: isCurrent ? "#EFF4FF" : "transparent",
            color: isCurrent ? "#1B3A6B" : "#374151",
            title: isStep8Skipped ? "Not required for your membership type" : undefined,
          };

          const badgeStyle: React.CSSProperties = {
            display: "flex",
            height: "20px",
            width: "20px",
            flexShrink: 0,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            fontSize: "11px",
            fontWeight: 600,
            backgroundColor: isComplete ? "#16a34a" : isCurrent ? "#1B3A6B" : isStep8Skipped ? "#d1d5db" : "transparent",
            color: isComplete || isCurrent ? "#fff" : isStep8Skipped ? "#9ca3af" : "#9ca3af",
            border: isComplete || isCurrent ? "none" : "1.5px solid #d1d5db",
          };

          return (
            <li key={step}>
              {isLocked || isStep8Skipped ? (
                <span aria-disabled="true" style={itemStyle}>
                  <span style={badgeStyle} aria-hidden="true">{isStep8Skipped ? "–" : (isComplete ? "✓" : step)}</span>
                  {STEP_LABELS[step]}
                </span>
              ) : (
                <Link href={href} aria-current={isCurrent ? "step" : undefined} style={itemStyle}>
                  <span style={badgeStyle} aria-hidden="true">{isComplete ? "✓" : step}</span>
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
