import "server-only";
import { createTRPCRouter } from "./trpc";

/**
 * Root tRPC router.
 * Sub-routers are added in later phases:
 *   - auth   (Phase 3: T063)
 *   - wizard (Phase 3: T085)
 *   - vault  (Phase 3: T092)
 *   - approval (Phase 4: T110)
 *   - payment  (Phase 6: T139)
 *   - renewal  (Phase 5: T128)
 *   - member   (Phase 7: T157)
 *   - admin    (Phase 4: T121d, extended Phase 8: T170)
 */
export const appRouter = createTRPCRouter({});

export type AppRouter = typeof appRouter;
