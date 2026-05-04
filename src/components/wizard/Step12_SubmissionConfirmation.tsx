interface Props { applicationId?: string }

export function Step12_SubmissionConfirmation({ applicationId }: Props) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:"24px",padding:"32px 0",textAlign:"center"}}>
      <div style={{margin:"0 auto",display:"flex",width:"64px",height:"64px",alignItems:"center",justifyContent:"center",borderRadius:"50%",backgroundColor:"#dcfce7"}}>
        <svg
          style={{width:"32px",height:"32px",color:"#16a34a"}}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:"4px"}}>
        <h2 style={{fontSize:"24px",fontWeight:700,color:"#0f172a",margin:0}}>Application Submitted!</h2>
        <p style={{color:"#64748b",margin:0}}>
          Your CREDAI Pune membership application has been received and is under review.
        </p>
        {applicationId && (
          <p style={{fontSize:"14px",color:"#0f172a",margin:0}}>
            Application Reference:{" "}
            <span style={{fontFamily:"monospace",fontWeight:600}}>{applicationId}</span>
          </p>
        )}
      </div>

      <div style={{margin:"0 auto",maxWidth:"480px",borderRadius:"6px",border:"1px solid #e2e8f0",backgroundColor:"#f8fafc",padding:"16px",textAlign:"left",fontSize:"14px"}}>
        <p style={{fontWeight:600,color:"#0f172a",margin:"0 0 12px 0"}}>What happens next?</p>
        <ol style={{margin:"0 0 12px 0",paddingLeft:"20px",color:"#64748b",listStyleType:"decimal"}}>
          <li style={{marginBottom:"4px"}}>Scrutiniser reviews your documents and firm details</li>
          <li style={{marginBottom:"4px"}}>Convenor and Director General review and approve</li>
          <li style={{marginBottom:"4px"}}>Secretary gives final approval</li>
          <li>Your membership certificate is generated and emailed</li>
        </ol>
        <p style={{fontSize:"12px",color:"#64748b",margin:"12px 0 0 0"}}>
          Expected processing time: 7–14 business days. You will receive email updates at each stage.
        </p>
      </div>

      <div style={{fontSize:"14px"}}>
        <p style={{color:"#64748b",margin:0}}>
          Questions? Contact CREDAI Pune at{" "}
          <a href="mailto:membership@credaipune.org" style={{color:"#1B3A6B",textDecoration:"underline"}}>
            membership@credaipune.org
          </a>
        </p>
      </div>
    </div>
  );
}
