/**
 * Type-only declaration of the FightCred AppRouter.
 * This file is used by the web client to get full tRPC type safety
 * without bundling any server-side code.
 *
 * Keep this in sync with /home/ubuntu/fightcred/server/routers.ts
 */
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

// Re-export the actual AppRouter type from the server using type-only import
// The `import type` ensures no runtime code is included
export type { AppRouter } from "@server/routers";

export type RouterInputs = inferRouterInputs<import("@server/routers").AppRouter>;
export type RouterOutputs = inferRouterOutputs<import("@server/routers").AppRouter>;
