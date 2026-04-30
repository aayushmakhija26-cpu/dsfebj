interface Props { applicationId?: string }

export function Step12_SubmissionConfirmation({ applicationId }: Props) {
  return (
    <div className="space-y-6 py-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <svg
          className="h-8 w-8 text-green-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Application Submitted!</h2>
        <p className="text-muted-foreground">
          Your CREDAI Pune membership application has been received and is under review.
        </p>
        {applicationId && (
          <p className="text-sm">
            Application Reference:{" "}
            <span className="font-mono font-medium">{applicationId}</span>
          </p>
        )}
      </div>

      <div className="mx-auto max-w-sm rounded-md border border-muted bg-muted/20 p-4 text-left text-sm">
        <p className="font-medium">What happens next?</p>
        <ol className="mt-2 space-y-1 text-muted-foreground list-decimal list-inside">
          <li>Scrutiniser reviews your documents and firm details</li>
          <li>Convenor and Director General review and approve</li>
          <li>Secretary gives final approval</li>
          <li>Your membership certificate is generated and emailed</li>
        </ol>
        <p className="mt-3 text-xs">
          Expected processing time: 7–14 business days. You will receive email updates at each stage.
        </p>
      </div>

      <div className="text-sm">
        <p className="text-muted-foreground">
          Questions? Contact CREDAI Pune at{" "}
          <a href="mailto:membership@credaipune.org" className="text-primary underline">
            membership@credaipune.org
          </a>
        </p>
      </div>
    </div>
  );
}
