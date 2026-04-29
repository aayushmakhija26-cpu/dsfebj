import { type NextRequest, NextResponse } from "next/server";
import { auth } from "./server/auth";

// Routes accessible without authentication
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/login/verify",
  "/public/verify",
  "/api/auth",
  "/api/webhooks",
];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );
}

export default auth((req: NextRequest & { auth?: unknown }) => {
  const { pathname } = req.nextUrl;

  // Allow public routes and static assets through
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  const session = (req as { auth?: { user?: { id: string; userType: string } } }).auth;

  // Unauthenticated access to protected route → redirect to login
  if (!session?.user?.id) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const userType = session.user.userType;

  // Staff routes require Staff user type
  if (pathname.startsWith("/admin") || pathname.startsWith("/(admin)")) {
    if (userType !== "Staff") {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  // Applicant/Member routes require Applicant or Member type
  if (
    (pathname.startsWith("/apply") || pathname.startsWith("/member")) &&
    userType === "Staff"
  ) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const response = NextResponse.next();

  // Propagate user context headers for downstream tRPC context extraction
  response.headers.set("x-user-id", session.user.id);
  response.headers.set("x-user-type", userType ?? "");

  return response;
});

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public/verify (public certificate verification — handled by its own rate limit)
     * - api/webhooks (payment webhook handlers with their own auth)
     */
    "/((?!_next/static|_next/image|favicon.ico|public/verify|api/webhooks).*)",
  ],
};
