import { redirect } from "next/navigation";

/**
 * Root page — redirect to the appropriate portal entry point.
 * Unauthenticated users go to login; authenticated users are handled
 * by the middleware (src/middleware.ts) before reaching here.
 */
export default function RootPage() {
  redirect("/login");
}
