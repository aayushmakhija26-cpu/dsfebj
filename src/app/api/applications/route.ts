import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const applicant = await db.applicant.findUnique({
      where: { userId: session.user.id },
    });

    if (!applicant) {
      return NextResponse.json([]);
    }

    const applications = await db.application.findMany({
      where: {
        applicantId: applicant.id,
      },
      include: {
        steps: {
          orderBy: { stepNumber: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const result = applications.map((app) => {
      const maxStep = app.steps[0]?.stepNumber ?? 0;
      const isSubmitted = app.status === "Submitted";

      return {
        id: app.id,
        email: session.user.email,
        currentStep: (maxStep + 1),
        createdAt: app.createdAt.toISOString(),
        updatedAt: app.updatedAt.toISOString(),
        membershipType: app.membershipType,
        firmName: app.firmName,
        status: isSubmitted ? "Submitted" : "Draft",
        isComplete: isSubmitted,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}
