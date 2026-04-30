import "server-only";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { logToAudit } from "./trpc-utils";

export const vaultRouter = createTRPCRouter({
  listDocuments: protectedProcedure
    .input(z.object({ applicationId: z.string().uuid().optional() }))
    .query(async ({ input, ctx }) => {
      if (!input.applicationId) return { documents: [] };

      const docs = await ctx.db.document.findMany({
        where: { applicationId: input.applicationId, isCurrent: true },
        orderBy: { uploadedAt: "desc" },
      });

      return { documents: docs };
    }),

  getDocument: protectedProcedure
    .input(z.object({ documentId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const doc = await ctx.db.document.findUnique({ where: { id: input.documentId } });
      if (!doc) throw new TRPCError({ code: "NOT_FOUND" });

      await logToAudit(ctx, {
        eventType: "DocumentAccessed",
        actorId: ctx.session.user.id,
        actorRole: "Applicant",
        resourceType: "Document",
        resourceId: input.documentId,
        ipAddress: ctx.req.headers.get("x-forwarded-for") ?? undefined,
      });

      return { document: doc };
    }),

  supersede: protectedProcedure
    .input(
      z.object({
        documentId: z.string().uuid(),
        newStorageKey: z.string().min(1),
        newFileName: z.string().min(1),
        newFileSize: z.number().int().positive(),
        newMimeType: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const existing = await ctx.db.document.findUnique({ where: { id: input.documentId } });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      const [, newDoc] = await ctx.db.$transaction([
        ctx.db.document.update({
          where: { id: input.documentId },
          data: { isCurrent: false, status: "Rejected" },
        }),
        ctx.db.document.create({
          data: {
            applicationId: existing.applicationId,
            documentType: existing.documentType,
            storageKey: input.newStorageKey,
            fileName: input.newFileName,
            fileSize: input.newFileSize,
            mimeType: existing.mimeType,
            isCurrent: true,
            status: "Uploaded",
            replacedById: existing.id,
          },
        }),
      ]);

      return { documentId: newDoc.id };
    }),
});
