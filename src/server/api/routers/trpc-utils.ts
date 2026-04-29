import "server-only";
import { TRPCError } from "@trpc/server";
import type { Prisma } from "@prisma/client";
import { type TRPCContext } from "../trpc";
import { type AuditEventType, type ActorRole, type ResourceType } from "@/schemas/audit";
import { getCurrentTraceId } from "@/lib/tracing";

// ─── Auth helpers ─────────────────────────────────────────────────────────────

export function requireSession(ctx: TRPCContext) {
  if (!ctx.session?.user?.id) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return ctx.session.user;
}

export function requireStaff(ctx: TRPCContext) {
  const user = requireSession(ctx);
  if (user.userType !== "Staff") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Staff access required" });
  }
  return user;
}

// ─── Audit logging helper ─────────────────────────────────────────────────────

export interface AuditParams {
  eventType: AuditEventType;
  actorId: string;
  actorRole: ActorRole;
  resourceType: ResourceType;
  resourceId: string;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  reason?: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
}

export async function logToAudit(ctx: TRPCContext, params: AuditParams): Promise<void> {
  await ctx.db.auditLog.create({
    data: {
      traceId: getCurrentTraceId(),
      eventType: params.eventType,
      actorId: params.actorId,
      actorRole: params.actorRole,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      beforeState: params.beforeState
        ? (params.beforeState as Prisma.InputJsonValue)
        : undefined,
      afterState: params.afterState
        ? (params.afterState as Prisma.InputJsonValue)
        : undefined,
      reason: params.reason,
      ipAddress: params.ipAddress,
      metadata: params.metadata
        ? (params.metadata as Prisma.InputJsonValue)
        : undefined,
    },
  });
}

// ─── Pagination helper ────────────────────────────────────────────────────────

export function buildPaginationArgs(page: number, limit: number) {
  return {
    skip: (page - 1) * limit,
    take: limit,
  };
}
