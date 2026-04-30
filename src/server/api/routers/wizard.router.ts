import "server-only";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { type Prisma } from "@prisma/client";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { validateStep } from "@/services/wizard/stepValidation";
import { logToAudit } from "./trpc-utils";
import { APPLICATION_NUMBER_PREFIXES } from "@/lib/constants";

function generateApplicationNumber(membershipType: string): string {
  const prefix = APPLICATION_NUMBER_PREFIXES[membershipType] ?? "APP";
  const ts = Date.now().toString(36).toUpperCase();
  return `${prefix}-${ts}`;
}

export const wizardRouter = createTRPCRouter({
  getApplicationDraft: protectedProcedure
    .input(z.object({ applicationId: z.string().uuid().optional() }))
    .query(async ({ input, ctx }) => {
      if (!input.applicationId) return null;

      const application = await ctx.db.application.findFirst({
        where: { id: input.applicationId, applicant: { userId: ctx.session.user.id } },
        include: { steps: true },
      });

      if (!application) return null;

      const stepData: Record<number, unknown> = {};
      for (const step of application.steps) {
        stepData[step.stepNumber] = step.data;
      }

      return {
        applicationId: application.id,
        membershipType: application.membershipType,
        firmType: application.firmType,
        status: application.status,
        steps: stepData,
      };
    }),

  submitStep: protectedProcedure
    .input(
      z.object({
        applicationId: z.string().uuid().optional(),
        stepNumber: z.number().int().min(1).max(12),
        data: z.record(z.unknown()),
        firmType: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const validation = await validateStep(input.stepNumber, input.data, {
        firmType: input.firmType,
      });

      if (!validation.valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Step validation failed",
          cause: validation.errors,
        });
      }

      const applicant = await ctx.db.applicant.findUnique({
        where: { userId: ctx.session.user.id },
      });
      if (!applicant) throw new TRPCError({ code: "NOT_FOUND", message: "Applicant profile not found" });

      let applicationId = input.applicationId;

      if (!applicationId) {
        // Create new application on first step submission
        const stepData = input.data as { membershipType?: string; firmType?: string };
        const application = await ctx.db.application.create({
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
        applicationId = application.id;
      }

      // Upsert step data
      const stepJson = input.data as Prisma.InputJsonValue;
      await ctx.db.applicationStep.upsert({
        where: { applicationId_stepNumber: { applicationId, stepNumber: input.stepNumber } },
        create: {
          applicationId,
          stepNumber: input.stepNumber,
          data: stepJson,
          isComplete: true,
          validationStatus: "Valid",
        },
        update: {
          data: stepJson,
          isComplete: true,
          validationStatus: "Valid",
          validationErrors: [],
        },
      });

      return { applicationId };
    }),

  getDocumentsYouNeed: protectedProcedure
    .input(z.object({ membershipType: z.string(), firmType: z.string() }))
    .query(async ({ input }) => {
      const { REQUIRED_DOCUMENTS_BY_MEMBERSHIP } = await import("@/lib/constants");
      return {
        documents: REQUIRED_DOCUMENTS_BY_MEMBERSHIP[input.membershipType] ?? [],
      };
    }),

  submitApplication: protectedProcedure
    .input(
      z.object({
        applicationId: z.string().uuid(),
        finalDeclarationAccepted: z.boolean().refine((v) => v, {
          message: "Declaration must be accepted",
        }),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const application = await ctx.db.application.findFirst({
        where: { id: input.applicationId, applicant: { userId: ctx.session.user.id } },
        include: { steps: true },
      });

      if (!application) throw new TRPCError({ code: "NOT_FOUND" });
      if (application.status !== "Draft") {
        throw new TRPCError({ code: "CONFLICT", message: "Application is already submitted." });
      }

      const updated = await ctx.db.application.update({
        where: { id: input.applicationId },
        data: { status: "Submitted", submittedAt: new Date() },
      });

      await logToAudit(ctx, {
        eventType: "ApplicationSubmitted",
        actorId: ctx.session.user.id,
        actorRole: "Applicant",
        resourceType: "Application",
        resourceId: input.applicationId,
        afterState: { status: "Submitted" },
        ipAddress: ctx.req.headers.get("x-forwarded-for") ?? undefined,
      });

      return { applicationNumber: updated.applicationNumber };
    }),
});
