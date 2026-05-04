import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { WizardStepRail } from "@/components/wizard/WizardStepRail";
import { Step1_MembershipFirmType } from "@/components/wizard/Step1_MembershipFirmType";
import { Step2_ApplicantDetails } from "@/components/wizard/Step2_ApplicantDetails";
import { Step3_FirmDetails } from "@/components/wizard/Step3_FirmDetails";
import { Step4_DirectorsPartners } from "@/components/wizard/Step4_DirectorsPartners";
import { Step5_ProjectsExperience } from "@/components/wizard/Step5_ProjectsExperience";
import { Step6_Financials } from "@/components/wizard/Step6_Financials";
import { Step7_DocumentUpload } from "@/components/wizard/Step7_DocumentUpload";
import { Step8_Proposer_Seconder } from "@/components/wizard/Step8_Proposer_Seconder";
import { Step9_ComplianceDeclaration } from "@/components/wizard/Step9_ComplianceDeclaration";
import { Step10_PaymentFeeBreakdown } from "@/components/wizard/Step10_PaymentFeeBreakdown";
import { Step11_ReviewSubmit } from "@/components/wizard/Step11_ReviewSubmit";
import { Step12_SubmissionConfirmation } from "@/components/wizard/Step12_SubmissionConfirmation";
import { WIZARD_TOTAL_STEPS } from "@/lib/constants";
import { AutoSaveIndicator } from "@/components/wizard/AutoSaveIndicator";
import { loadDraft } from "@/services/wizard/draftPersistence";

const STEP_COMPONENTS: Record<number, React.ComponentType<{ applicationId?: string }>> = {
  1: Step1_MembershipFirmType,
  2: Step2_ApplicantDetails,
  3: Step3_FirmDetails,
  4: Step4_DirectorsPartners,
  5: Step5_ProjectsExperience,
  6: Step6_Financials,
  7: Step7_DocumentUpload,
  8: Step8_Proposer_Seconder,
  9: Step9_ComplianceDeclaration,
  10: Step10_PaymentFeeBreakdown,
  11: Step11_ReviewSubmit,
  12: Step12_SubmissionConfirmation,
};

interface Props {
  params: Promise<{ step: string }>;
  searchParams: Promise<{ applicationId?: string }>;
}

export default async function WizardStepPage({ params, searchParams }: Props) {
  const { step } = await params;
  const { applicationId } = await searchParams;

  const stepNumber = parseInt(step, 10);
  if (isNaN(stepNumber) || stepNumber < 1 || stepNumber > WIZARD_TOTAL_STEPS) {
    notFound();
  }

  // Check membership type to conditionally skip Step 8 (Proposer & Seconder) for non-Associate members
  if (stepNumber === 8 && applicationId) {
    try {
      const draftData = await loadDraft(applicationId);
      const step1Data = draftData[1] as { membershipType?: string } | undefined;
      const membershipType = step1Data?.membershipType;

      // Skip Step 8 for Ordinary and RERAProject membership
      if (membershipType && membershipType !== "Associate") {
        redirect(`/9?applicationId=${applicationId}`);
      }
    } catch {
      // If we can't load draft, allow Step 8 to show
    }
  }

  const StepComponent = STEP_COMPONENTS[stepNumber];
  if (!StepComponent) notFound();

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Top bar */}
      <div style={{ backgroundColor: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 32px", height: "56px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", cursor: "pointer" }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: "#E8601C", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: "#fff" }}>C</div>
          <span style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>CREDAI Pune</span>
          <span style={{ color: "#d1d5db", margin: "0 4px" }}>|</span>
          <span style={{ fontSize: 13, color: "#64748b" }}>Membership Application</span>
        </Link>
        <AutoSaveIndicator />
      </div>

      {/* Content */}
      <div style={{ maxWidth: "1024px", margin: "0 auto", padding: "32px 24px", display: "flex", gap: "32px" }}>
        {/* Sidebar */}
        <aside style={{ width: "200px", flexShrink: 0 }}>
          <div style={{ backgroundColor: "#fff", borderRadius: "10px", border: "1px solid #e2e8f0", padding: "16px" }}>
            <WizardStepRail currentStep={stepNumber} applicationId={applicationId} />
          </div>
        </aside>

        {/* Main form */}
        <main id="main-content" style={{ flex: 1, backgroundColor: "#fff", borderRadius: "10px", border: "1px solid #e2e8f0", padding: "32px" }}>
          <Suspense fallback={<div style={{ padding: "32px 0", textAlign: "center", color: "#64748b" }}>Loading…</div>}>
            <StepComponent applicationId={applicationId} />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export function generateStaticParams() {
  return Array.from({ length: WIZARD_TOTAL_STEPS }, (_, i) => ({ step: String(i + 1) }));
}
