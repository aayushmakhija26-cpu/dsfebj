"use client";

import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", fontFamily: "system-ui, -apple-system, sans-serif", padding: "32px 24px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <Link href="/login" style={{ fontSize: "13px", color: "#64748b", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px", marginBottom: "32px" }}>
          ← Back to login
        </Link>

        <div style={{ backgroundColor: "#fff", borderRadius: "10px", border: "1px solid #e2e8f0", padding: "40px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: 700, color: "#0f172a", marginBottom: "24px" }}>
            Privacy Policy
          </h1>

          <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "24px" }}>
            Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>

          <div style={{ fontSize: "14px", color: "#374151", lineHeight: "1.8" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#0f172a", marginTop: "32px", marginBottom: "12px" }}>
              Introduction
            </h2>
            <p style={{ marginBottom: "16px" }}>
              CREDAI Pune ("we," "us," "our," or "Company") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our membership portal website and use our services.
            </p>

            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#0f172a", marginTop: "32px", marginBottom: "12px" }}>
              Information We Collect
            </h2>
            <p style={{ marginBottom: "16px" }}>
              We collect information you voluntarily provide when:
            </p>
            <ul style={{ marginBottom: "16px", paddingLeft: "24px" }}>
              <li style={{ marginBottom: "8px" }}>Creating or updating your membership application</li>
              <li style={{ marginBottom: "8px" }}>Providing your personal, business, and financial information</li>
              <li style={{ marginBottom: "8px" }}>Uploading documents and supporting materials</li>
              <li style={{ marginBottom: "8px" }}>Contacting us with inquiries or feedback</li>
            </ul>

            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#0f172a", marginTop: "32px", marginBottom: "12px" }}>
              How We Use Your Information
            </h2>
            <p style={{ marginBottom: "16px" }}>
              We use the information we collect to:
            </p>
            <ul style={{ marginBottom: "16px", paddingLeft: "24px" }}>
              <li style={{ marginBottom: "8px" }}>Process your membership application</li>
              <li style={{ marginBottom: "8px" }}>Verify the accuracy of information provided</li>
              <li style={{ marginBottom: "8px" }}>Communicate with you regarding your application status</li>
              <li style={{ marginBottom: "8px" }}>Maintain and improve our membership portal</li>
              <li style={{ marginBottom: "8px" }}>Comply with legal obligations and regulations</li>
            </ul>

            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#0f172a", marginTop: "32px", marginBottom: "12px" }}>
              Data Protection and Security
            </h2>
            <p style={{ marginBottom: "16px" }}>
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is completely secure.
            </p>

            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#0f172a", marginTop: "32px", marginBottom: "12px" }}>
              Digital Personal Data Protection Act, 2023
            </h2>
            <p style={{ marginBottom: "16px" }}>
              In accordance with the Digital Personal Data Protection Act, 2023, we process your personal data only for legitimate purposes as outlined in this policy. You have the right to:
            </p>
            <ul style={{ marginBottom: "16px", paddingLeft: "24px" }}>
              <li style={{ marginBottom: "8px" }}>Access your personal data</li>
              <li style={{ marginBottom: "8px" }}>Correct inaccurate or incomplete data</li>
              <li style={{ marginBottom: "8px" }}>Request deletion of your data</li>
              <li style={{ marginBottom: "8px" }}>Withdraw your consent for data processing</li>
            </ul>

            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#0f172a", marginTop: "32px", marginBottom: "12px" }}>
              Contact Us
            </h2>
            <p style={{ marginBottom: "16px" }}>
              If you have questions about this Privacy Policy or our privacy practices, please contact us at:
            </p>
            <p style={{ marginBottom: "16px" }}>
              <strong>CREDAI Pune</strong><br />
              Pune, Maharashtra<br />
              Email: <a href="mailto:info@credaipune.org" style={{ color: "#1B3A6B", textDecoration: "underline" }}>info@credaipune.org</a>
            </p>

            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#0f172a", marginTop: "32px", marginBottom: "12px" }}>
              Policy Changes
            </h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant changes by updating the "Last updated" date at the top of this page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
