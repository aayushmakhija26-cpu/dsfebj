import { type NextRequest, NextResponse } from "next/server";
import { type Prisma } from "@prisma/client";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { validateStep } from "@/services/wizard/stepValidation";
import { APPLICATION_NUMBER_PREFIXES } from "@/lib/constants";

function generateApplicationNumber(membershipType: string): string {
  const prefix = APPLICATION_NUMBER_PREFIXES[membershipType] ?? "APP";
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { step?: number; data?: Record<string, unknown>; applicationId?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { step, data, applicationId } = body;
  if (!step || !data) return NextResponse.json({ error: "step and data are required" }, { status: 400 });

  const validation = await validateStep(step, data);
  // Allow saving draft even if step is incomplete (partial data is ok)

  const applicant = await db.applicant.findUnique({ where: { userId: session.user.id } });
  if (!applicant) return NextResponse.json({ error: "Applicant profile not found" }, { status: 404 });

  let appId = applicationId;

  if (!appId) {
    const stepData = data as { membershipType?: string; firmType?: string };
    const app = await db.application.create({
      data: {
        applicationNumber: generateApplicationNumber(stepData.membershipType ?? "Ordinary"),
        membershipType: (stepData.membershipType as "Ordinary" | "Associate" | "RERAProject") ?? "Ordinary",
        firmType: (stepData.firmType as "Proprietorship" | "Partnership" | "PrivateLimited" | "LLP" | "PublicSector" | "AOP" | "CooperativeSociety") ?? "Proprietorship",
        firmName: "",
        firmAddress: "",
        status: "Draft",
        applicantId: applicant.id,
      },
    });
    appId = app.id;
  }

  const stepJson = data as Prisma.InputJsonValue;
  await db.applicationStep.upsert({
    where: { applicationId_stepNumber: { applicationId: appId, stepNumber: step } },
    create: {
      applicationId: appId,
      stepNumber: step,
      data: stepJson,
      isComplete: validation.valid,
      validationStatus: validation.valid ? "Valid" : "Invalid",
      validationErrors: validation.valid ? [] : Object.values(validation.errors).flat(),
    },
    update: {
      data: stepJson,
      isComplete: validation.valid,
      validationStatus: validation.valid ? "Valid" : "Invalid",
      validationErrors: validation.valid ? [] : Object.values(validation.errors).flat(),
    },
  });

  return NextResponse.json({ applicationId: appId });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const applicationId = req.nextUrl.searchParams.get("applicationId");
  if (!applicationId) return NextResponse.json({ error: "applicationId is required" }, { status: 400 });

  const application = await db.application.findFirst({
    where: { id: applicationId, applicant: { userId: session.user.id } },
    include: { steps: { orderBy: { stepNumber: "asc" } } },
  });

  if (!application) return NextResponse.json({ error: "Application not found" }, { status: 404 });

  const steps: Record<number, unknown> = {};
  for (const step of application.steps) {
    steps[step.stepNumber] = step.data;
  }

  return NextResponse.json({ applicationId, steps });
}
