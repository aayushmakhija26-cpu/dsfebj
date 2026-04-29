import { type NextRequest, NextResponse } from "next/server";

/**
 * Middleware — authentication, RBAC, and audit hooks.
 *
 * Phase 1 skeleton: passes all requests through.
 * Phase 2 will add Auth.js session checks, role-based access control,
 * and AuditLog append middleware on all non-public routes.
 */
export function middleware(_request: NextRequest): NextResponse {
  // TODO (Phase 2): verify Auth.js session cookie
  // TODO (Phase 2): enforce RBAC per route group
  // TODO (Phase 2): append audit event for sensitive routes
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT static files and API routes that
     * handle their own auth (webhooks, public verification).
     */
    "/((?!_next/static|_next/image|favicon.ico|public/verify|api/webhooks).*)",
  ],
};
