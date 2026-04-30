import { notFound } from "next/navigation";
import { Suspense } from "react";
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

  const StepComponent = STEP_COMPONENTS[stepNumber];
  if (!StepComponent) notFound();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold">CREDAI Pune — Membership Application</h1>
          <AutoSaveIndicator />
        </div>

        <div className="flex gap-8">
          <aside className="hidden w-56 shrink-0 lg:block">
            <WizardStepRail currentStep={stepNumber} applicationId={applicationId} />
          </aside>

          <main id="main-content" className="flex-1">
            <Suspense fallback={<div className="py-8 text-center text-muted-foreground">Loading…</div>}>
              <StepComponent applicationId={applicationId} />
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
}

export function generateStaticParams() {
  return Array.from({ length: WIZARD_TOTAL_STEPS }, (_, i) => ({ step: String(i + 1) }));
}
