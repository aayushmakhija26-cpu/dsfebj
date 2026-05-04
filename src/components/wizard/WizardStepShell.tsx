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
    const url = applicationId ? `/${prev}?applicationId=${applicationId}` : `/${prev}`;
    router.push(url);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <p style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", marginBottom: "4px" }}>
          Step {step} of {WIZARD_TOTAL_STEPS}
        </p>
        <h2 style={{ fontSize: "20px", fontWeight: 600, color: "#0f172a", marginTop: "4px", marginBottom: "8px" }}>{title}</h2>
        {description && <p style={{ fontSize: "14px", color: "#475569", marginTop: 0, marginBottom: 0 }}>{description}</p>}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>{children}</div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "16px" }}>
        {!hideBack && step > 1 ? (
          <button
            type="button"
            onClick={goBack}
            disabled={isSubmitting}
            style={{
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
              padding: "10px 16px",
              fontSize: "14px",
              fontWeight: 500,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              backgroundColor: "#fff",
              color: "#0f172a",
              opacity: isSubmitting ? 0.5 : 1,
            }}
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
            style={{
              borderRadius: "6px",
              padding: "10px 24px",
              fontSize: "14px",
              fontWeight: 500,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              backgroundColor: isLastStep ? "#16a34a" : "#1B3A6B",
              color: "#fff",
              border: "none",
              opacity: isSubmitting ? 0.5 : 1,
            }}
          >
            {isSubmitting ? "Saving…" : (nextLabel ?? (isLastStep ? "Submit" : "Continue"))}
          </button>
        )}
      </div>
    </div>
  );
}
