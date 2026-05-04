"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadDraftWithStatus } from "@/services/wizard/draftPersistence";
import { WizardStepShell } from "./WizardStepShell";

interface Props { applicationId?: string }

interface DraftData {
  [key: number]: Record<string, unknown>;
}

export function Step11_ReviewSubmit({ applicationId }: Props) {
  const router = useRouter();
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftData, setDraftData] = useState<DraftData>({});
  const [loading, setLoading] = useState(true);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const isAlreadySubmitted = applicationStatus === "Submitted";

  useEffect(() => {
    if (!applicationId) {
      setLoading(false);
      return;
    }
    loadDraftWithStatus(applicationId)
      .then(({ steps, status }) => {
        setDraftData(steps);
        setApplicationStatus(status ?? null);
      })
      .catch(() => { /* draft loading is non-critical */ })
      .finally(() => setLoading(false));
  }, [applicationId]);

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
      router.push(`/12?applicationId=${applicationId}`);
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
      onNext={isAlreadySubmitted ? undefined : handleSubmit}
      isSubmitting={isSubmitting}
      nextLabel="Submit Application"
    >
      <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
        {loading ? (
          <div style={{borderRadius:"6px",border:"1px solid #e2e8f0",backgroundColor:"#f8fafc",padding:"16px"}}>
            <p style={{fontSize:"14px",color:"#64748b",margin:0}}>Loading application summary…</p>
          </div>
        ) : (
          <>
            {/* Membership Type & Firm Type */}
            {(draftData[1] || draftData[3]) && (
              <div style={{borderRadius:"6px",border:"1px solid #e2e8f0",padding:"16px"}}>
                <h3 style={{fontSize:"14px",fontWeight:600,color:"#0f172a",margin:"0 0 12px 0"}}>Membership & Firm Details</h3>
                <div style={{fontSize:"13px",color:"#374151",lineHeight:"1.8"}}>
                  {(draftData[1] as {membershipType?: string} | undefined)?.membershipType && (
                    <p style={{margin:"0 0 8px 0"}}><strong>Membership Type:</strong> {(draftData[1] as {membershipType?: string}).membershipType}</p>
                  )}
                  {(draftData[1] as {firmType?: string} | undefined)?.firmType && (
                    <p style={{margin:"0 0 8px 0"}}><strong>Firm Type:</strong> {(draftData[1] as {firmType?: string}).firmType}</p>
                  )}
                  {(draftData[3] as {firmName?: string; firmAddress?: string} | undefined)?.firmName && (
                    <p style={{margin:"0 0 8px 0"}}><strong>Firm Name:</strong> {(draftData[3] as {firmName?: string}).firmName}</p>
                  )}
                  {(draftData[3] as {firmName?: string; firmAddress?: string} | undefined)?.firmAddress && (
                    <p style={{margin:0}}><strong>Firm Address:</strong> {(draftData[3] as {firmAddress?: string}).firmAddress}</p>
                  )}
                </div>
              </div>
            )}

            {/* Applicant Details */}
            {draftData[2] && (
              <div style={{borderRadius:"6px",border:"1px solid #e2e8f0",padding:"16px"}}>
                <h3 style={{fontSize:"14px",fontWeight:600,color:"#0f172a",margin:"0 0 12px 0"}}>Applicant Details</h3>
                <div style={{fontSize:"13px",color:"#374151",lineHeight:"1.8"}}>
                  {(draftData[2] as {applicantName?: string; contactEmail?: string; contactPhone?: string; designation?: string} | undefined)?.applicantName && (
                    <p style={{margin:"0 0 8px 0"}}><strong>Name:</strong> {(draftData[2] as {applicantName?: string}).applicantName}</p>
                  )}
                  {(draftData[2] as {applicantName?: string; contactEmail?: string; contactPhone?: string; designation?: string} | undefined)?.designation && (
                    <p style={{margin:"0 0 8px 0"}}><strong>Designation:</strong> {(draftData[2] as {designation?: string}).designation}</p>
                  )}
                  {(draftData[2] as {applicantName?: string; contactEmail?: string; contactPhone?: string; designation?: string} | undefined)?.contactEmail && (
                    <p style={{margin:"0 0 8px 0"}}><strong>Email:</strong> {(draftData[2] as {contactEmail?: string}).contactEmail}</p>
                  )}
                  {(draftData[2] as {applicantName?: string; contactEmail?: string; contactPhone?: string; designation?: string} | undefined)?.contactPhone && (
                    <p style={{margin:0}}><strong>Phone:</strong> {(draftData[2] as {contactPhone?: string}).contactPhone}</p>
                  )}
                </div>
              </div>
            )}

            {/* Directors/Partners */}
            {draftData[4] && (
              <div style={{borderRadius:"6px",border:"1px solid #e2e8f0",padding:"16px"}}>
                <h3 style={{fontSize:"14px",fontWeight:600,color:"#0f172a",margin:"0 0 12px 0"}}>Directors / Partners</h3>
                {(draftData[4] as {principals?: Array<{name?: string}>} | undefined)?.principals && (draftData[4] as {principals?: Array<{name?: string}>}).principals!.length > 0 ? (
                  <div style={{fontSize:"13px",color:"#374151"}}>
                    {(draftData[4] as {principals?: Array<{name?: string}>}).principals!.map((p: {name?: string}, idx: number) => (
                      <p key={idx} style={{margin:"0 0 4px 0"}}>• {p.name || "Unnamed"}</p>
                    ))}
                  </div>
                ) : (
                  <p style={{fontSize:"13px",color:"#64748b",margin:0}}>No directors/partners added</p>
                )}
              </div>
            )}

            {/* Projects & Experience */}
            {draftData[5] && (
              <div style={{borderRadius:"6px",border:"1px solid #e2e8f0",padding:"16px"}}>
                <h3 style={{fontSize:"14px",fontWeight:600,color:"#0f172a",margin:"0 0 12px 0"}}>Projects & Experience</h3>
                <div style={{fontSize:"13px",color:"#374151"}}>
                  {(draftData[5] as {completedProjects?: Array<{projectName?: string}>} | undefined)?.completedProjects && (draftData[5] as {completedProjects?: Array<{projectName?: string}>}).completedProjects!.length > 0 && (
                    <p style={{margin:"0 0 8px 0"}}><strong>Completed Projects:</strong> {(draftData[5] as {completedProjects?: Array<{projectName?: string}>}).completedProjects!.length} project(s)</p>
                  )}
                  {(draftData[5] as {commencedProjects?: Array<{projectName?: string}>} | undefined)?.commencedProjects && (draftData[5] as {commencedProjects?: Array<{projectName?: string}>}).commencedProjects!.length > 0 && (
                    <p style={{margin:0}}><strong>Commenced Projects:</strong> {(draftData[5] as {commencedProjects?: Array<{projectName?: string}>}).commencedProjects!.length} project(s)</p>
                  )}
                </div>
              </div>
            )}

            {/* Financials */}
            {draftData[6] && (
              <div style={{borderRadius:"6px",border:"1px solid #e2e8f0",padding:"16px"}}>
                <h3 style={{fontSize:"14px",fontWeight:600,color:"#0f172a",margin:"0 0 12px 0"}}>Financials</h3>
                <div style={{fontSize:"13px",color:"#374151",lineHeight:"1.8"}}>
                  {(draftData[6] as {annualTurnover?: number; financialYear?: string; bankName?: string} | undefined)?.annualTurnover && (
                    <p style={{margin:"0 0 8px 0"}}><strong>Annual Turnover:</strong> ₹{((draftData[6] as {annualTurnover?: number}).annualTurnover ?? 0).toLocaleString('en-IN')}</p>
                  )}
                  {(draftData[6] as {annualTurnover?: number; financialYear?: string; bankName?: string} | undefined)?.financialYear && (
                    <p style={{margin:"0 0 8px 0"}}><strong>Financial Year:</strong> {(draftData[6] as {financialYear?: string}).financialYear}</p>
                  )}
                  {(draftData[6] as {annualTurnover?: number; financialYear?: string; bankName?: string} | undefined)?.bankName && (
                    <p style={{margin:0}}><strong>Bank:</strong> {(draftData[6] as {bankName?: string}).bankName}</p>
                  )}
                </div>
              </div>
            )}

            {/* Documents */}
            {draftData[7] && (
              <div style={{borderRadius:"6px",border:"1px solid #e2e8f0",padding:"16px"}}>
                <h3 style={{fontSize:"14px",fontWeight:600,color:"#0f172a",margin:"0 0 12px 0"}}>Documents</h3>
                {(draftData[7] as {documents?: Array<{fileName?: string}>} | undefined)?.documents && (draftData[7] as {documents?: Array<{fileName?: string}>}).documents!.length > 0 ? (
                  <p style={{fontSize:"13px",color:"#64748b",margin:0}}>
                    {(draftData[7] as {documents?: Array<{fileName?: string}>}).documents!.length} document(s) uploaded
                  </p>
                ) : (
                  <p style={{fontSize:"13px",color:"#64748b",margin:0}}>No documents uploaded</p>
                )}
              </div>
            )}

            {/* Proposer & Seconder (if applicable) */}
            {draftData[8] && ((draftData[8] as {proposerId?: string; seconderId?: string}).proposerId || (draftData[8] as {proposerId?: string; seconderId?: string}).seconderId) && (
              <div style={{borderRadius:"6px",border:"1px solid #e2e8f0",padding:"16px"}}>
                <h3 style={{fontSize:"14px",fontWeight:600,color:"#0f172a",margin:"0 0 12px 0"}}>Proposer & Seconder</h3>
                <p style={{fontSize:"13px",color:"#64748b",margin:0}}>Proposer and Seconder information provided</p>
              </div>
            )}

            {/* Payment Method */}
            {draftData[10] && (
              <div style={{borderRadius:"6px",border:"1px solid #e2e8f0",padding:"16px"}}>
                <h3 style={{fontSize:"14px",fontWeight:600,color:"#0f172a",margin:"0 0 12px 0"}}>Payment Method</h3>
                <p style={{fontSize:"13px",color:"#374151",margin:0}}>
                  {(draftData[10] as {paymentMethod?: string}).paymentMethod ? (
                    <>
                      <strong>Method:</strong> {(draftData[10] as {paymentMethod?: string}).paymentMethod} Payment
                    </>
                  ) : (
                    "Payment method selected"
                  )}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {isAlreadySubmitted ? (
        <div style={{borderRadius:"6px",backgroundColor:"#dcfce7",border:"1px solid #86efac",padding:"16px",marginTop:"16px"}}>
          <p style={{fontSize:"14px",fontWeight:600,color:"#166534",margin:"0 0 8px 0"}}>✓ Application Already Submitted</p>
          <p style={{fontSize:"13px",color:"#166534",margin:0}}>
            This application has already been submitted and is under review. You cannot resubmit it.
          </p>
        </div>
      ) : (
        <>
          {error && (
            <p role="alert" style={{fontSize:"14px",color:"#dc2626"}}>{error}</p>
          )}

          <div style={{display:"flex",alignItems:"flex-start",gap:"8px"}}>
            <input
              id="finalDeclaration"
              type="checkbox"
              checked={declarationAccepted}
              onChange={(e) => setDeclarationAccepted(e.target.checked)}
              style={{marginTop:"4px",width:"16px",height:"16px",borderRadius:"4px",border:"1px solid #e2e8f0",cursor:"pointer"}}
              aria-describedby={!declarationAccepted && error ? "final-decl-error" : undefined}
            />
            <label htmlFor="finalDeclaration" style={{fontSize:"14px",color:"#0f172a",cursor:"pointer"}}>
              I confirm that all information provided is accurate and I consent to the submission of this application. I understand this submission is final and the application will enter CREDAI Pune&apos;s review process.{" "}
              <span style={{color:"#dc2626"}}>*</span>
            </label>
          </div>
        </>
      )}
    </WizardStepShell>
  );
}
