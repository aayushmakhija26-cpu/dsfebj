import "server-only";
import { initTRPC, TRPCError } from "@trpc/server";
import { type NextRequest } from "next/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { auth } from "../auth";
import { db } from "../db";
import { logger } from "@/lib/logging";
import { getCurrentTraceId } from "@/lib/tracing";
import { type AppRole } from "@/lib/rbac";

// ─── Context ──────────────────────────────────────────────────────────────────

export interface TRPCContext {
  req: NextRequest;
  db: typeof db;
  session: {
    user: {
      id: string;
      email: string;
      userType: "Applicant" | "Staff";
      role?: string;
    };
  } | null;
  traceId: string;
}

export async function createTRPCContext(req: NextRequest): Promise<TRPCContext> {
  const session = await auth();
  const traceId = getCurrentTraceId();

  return {
    req,
    db,
    session: session?.user?.id
      ? {
          user: {
            id: session.user.id,
            email: session.user.email ?? "",
            userType: session.user.userType,
            role: session.user.role,
          },
        }
      : null,
    traceId,
  };
}

// ─── tRPC initialization ──────────────────────────────────────────────────────

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

// ─── Router & procedure helpers ───────────────────────────────────────────────

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

// Public procedure — no auth required
export const publicProcedure = t.procedure.use(({ ctx, next }) => {
  logger.debug({ traceId: ctx.traceId }, "tRPC public procedure");
  return next({ ctx });
});

// Authenticated procedure — any logged-in user
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user?.id) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, session: ctx.session } });
});

// Staff-only procedure — requires Staff user type
export const staffProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user?.id) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  if (ctx.session.user.userType !== "Staff") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Staff access required" });
  }
  return next({ ctx: { ...ctx, session: ctx.session } });
});

// Role-gated procedure factory — use for procedures requiring a specific staff role
export function roleProcedure(...allowedRoles: AppRole[]) {
  return t.procedure.use(({ ctx, next }) => {
    if (!ctx.session?.user?.id) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    const role = ctx.session.user.role as AppRole | undefined;
    if (!role || !allowedRoles.includes(role)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Requires one of: ${allowedRoles.join(", ")}`,
      });
    }
    return next({ ctx: { ...ctx, session: ctx.session } });
  });
}
