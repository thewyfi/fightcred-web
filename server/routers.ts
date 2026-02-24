/**
 * Type-only stub for the FightCred AppRouter.
 *
 * This file provides the AppRouter type to the web client for full tRPC type safety
 * without bundling any server-side code (mysql2, drizzle-orm, express, etc.).
 *
 * The actual router runs on the FightCred backend server (port 3000).
 *
 * IMPORTANT: AppRouter is typed as AnyRouter which gives loose typing.
 * All tRPC calls will still work correctly at runtime — the API is type-safe
 * through the actual server. The tradeoff is no compile-time type checking
 * for procedure inputs/outputs on the client side.
 */

import type { AnyRouter } from "@trpc/server";

// Export AppRouter as AnyRouter — this allows all tRPC procedure calls
// to work without bundling the server code.
export type AppRouter = AnyRouter;
