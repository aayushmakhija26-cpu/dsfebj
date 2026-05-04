"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Application {
  id: string;
  email: string;
  currentStep: number;
  createdAt: string;
  updatedAt: string;
  membershipType?: string;
  firmName?: string;
  status?: "Draft" | "Submitted";
  isComplete?: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    if (!session?.user?.email) {
      setLoading(false);
      return;
    }

    void fetchApplications(session.user.email);
  }, [session, status, router]);

  async function fetchApplications(email: string) {
    try {
      const res = await fetch(`/api/applications?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = (await res.json()) as Application[];
        setApplications(data);
      }
    } catch (err) {
      console.error("Failed to fetch applications:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    await signOut({ redirectTo: "/login" });
  }

  if (status === "loading" || loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc" }}>
        <p style={{ color: "#64748b" }}>Loading…</p>
      </div>
    );
  }

  const inProgressApps = applications.filter((app) => !app.isComplete);
  const submittedApps = applications.filter((app) => app.isComplete);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Header */}
      <div style={{ backgroundColor: "#fff", borderBottom: "1px solid #e2e8f0", padding: "20px 32px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none", cursor: "pointer" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: "#E8601C", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, color: "#fff" }}>C</div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#0f172a", letterSpacing: "-0.01em" }}>CREDAI Pune</span>
          </Link>
          <button
            onClick={handleSignOut}
            style={{
              padding: "10px 18px",
              backgroundColor: "#f3f4f6",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: 500,
              color: "#374151",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#e5e7eb"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#f3f4f6"; }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "40px 32px" }}>
        {/* Welcome Section */}
        <div style={{ marginBottom: "56px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#0f172a", marginBottom: "4px", letterSpacing: "-0.02em" }}>
            Welcome back
          </h1>
          <p style={{ fontSize: "15px", color: "#64748b", marginBottom: "16px" }}>
            {session?.user?.email}
          </p>
          <p style={{ fontSize: "15px", color: "#64748b" }}>
            Manage your membership applications
          </p>
        </div>

        {applications.length > 0 ? (
          <>
            {/* In Progress Applications */}
            {inProgressApps.length > 0 && (
              <div style={{ marginBottom: "56px" }}>
                <div style={{ marginBottom: "20px" }}>
                  <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: "0 0 4px 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>In Progress</h2>
                  <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>{inProgressApps.length} application{inProgressApps.length !== 1 ? "s" : ""}</p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
                  {inProgressApps.map((app) => (
                    <div key={app.id} style={{ backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                      {/* Card Header */}
                      <div style={{ padding: "20px", borderBottom: "1px solid #f1f5f9", backgroundColor: "#f8fafc" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
                          <span style={{ fontSize: "12px", fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                            Step {app.currentStep} of 12
                          </span>
                          <span style={{ fontSize: "11px", fontWeight: 600, backgroundColor: "#fef08a", color: "#854d0e", padding: "4px 10px", borderRadius: "4px", textTransform: "uppercase" }}>
                            In Progress
                          </span>
                        </div>
                        <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#0f172a", margin: "0", lineHeight: 1.4 }}>
                          {app.firmName || app.membershipType || "Untitled Application"}
                        </h3>
                      </div>

                      {/* Progress Bar */}
                      <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
                        <div style={{ width: "100%", height: "6px", backgroundColor: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                          <div style={{ width: `${(app.currentStep / 12) * 100}%`, height: "100%", backgroundColor: "#1B3A6B", transition: "width 0.3s ease" }} />
                        </div>
                        <p style={{ fontSize: "12px", color: "#64748b", marginTop: "8px", margin: "8px 0 0 0" }}>
                          {Math.round((app.currentStep / 12) * 100)}% complete
                        </p>
                      </div>

                      {/* Card Body */}
                      <div style={{ padding: "16px 20px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 12px 0" }}>
                          Last updated {new Date(app.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                        <Link
                          href={`/1?applicationId=${app.id}`}
                          style={{
                            padding: "10px 16px",
                            backgroundColor: "#1B3A6B",
                            color: "#fff",
                            textDecoration: "none",
                            borderRadius: "6px",
                            fontSize: "14px",
                            fontWeight: 600,
                            textAlign: "center",
                            cursor: "pointer",
                            border: "none",
                            display: "block",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#162d56"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#1B3A6B"; }}
                        >
                          Resume Application
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submitted Applications */}
            {submittedApps.length > 0 && (
              <div style={{ marginBottom: "56px" }}>
                <div style={{ marginBottom: "20px" }}>
                  <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: "0 0 4px 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>Submitted Applications</h2>
                  <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>{submittedApps.length} application{submittedApps.length !== 1 ? "s" : ""}</p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
                  {submittedApps.map((app) => (
                    <div key={app.id} style={{ backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                      {/* Card Header */}
                      <div style={{ padding: "20px", borderBottom: "1px solid #f1f5f9", backgroundColor: "#f0fdf4" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
                          <span style={{ fontSize: "12px", fontWeight: 600, color: "#3f6212", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                            Completed
                          </span>
                          <span style={{ fontSize: "11px", fontWeight: 600, backgroundColor: "#dcfce7", color: "#166534", padding: "4px 10px", borderRadius: "4px", textTransform: "uppercase" }}>
                            Under Review
                          </span>
                        </div>
                        <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#0f172a", margin: "0", lineHeight: 1.4 }}>
                          {app.firmName || app.membershipType || "Untitled Application"}
                        </h3>
                      </div>

                      {/* Card Body */}
                      <div style={{ padding: "20px" }}>
                        <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 12px 0" }}>
                          Submitted {new Date(app.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                        <div style={{ padding: "12px", backgroundColor: "#f0fdf4", borderRadius: "6px", borderLeft: "3px solid #22c55e" }}>
                          <p style={{ fontSize: "13px", color: "#166534", margin: 0 }}>
                            ✓ Your application is under review. We&apos;ll notify you of any updates.
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "48px 32px", textAlign: "center", marginBottom: "40px" }}>
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>📋</div>
            </div>
            <p style={{ fontSize: "16px", fontWeight: 600, color: "#0f172a", marginBottom: "8px" }}>No applications yet</p>
            <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 24px 0" }}>Start your membership application journey</p>
          </div>
        )}

        {/* Start New Application CTA */}
        <div style={{ backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", margin: "0 0 6px 0" }}>Ready to apply?</h2>
            <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>Start a new membership application</p>
          </div>
          <Link
            href="/1"
            style={{
              padding: "12px 28px",
              backgroundColor: "#16a34a",
              color: "#fff",
              textDecoration: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              border: "none",
              whiteSpace: "nowrap",
              transition: "all 0.2s",
              marginLeft: "16px",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#15803d"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#16a34a"; }}
          >
            New Application
          </Link>
        </div>
      </div>
    </div>
  );
}
