"use client";
import { createTRPCReact } from "@trpc/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AnyRouter } from "@trpc/server";

// We cast trpc as `any` to bypass tRPC's ProtectedIntersection collision check.
// The actual type safety is enforced by the server at runtime.
// This avoids bundling any server-side code (mysql2, drizzle-orm, express, etc.)
// into the Next.js client bundle.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const trpc: any = createTRPCReact<AnyRouter>();

export function getApiBaseUrl(): string {
  // Server-side: use env var or default
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
  }
  // Client-side: use env var
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "");
  }
  // Derive from current hostname: 8090-sandbox -> 3000-sandbox
  const { protocol, hostname } = window.location;
  const apiHostname = hostname
    .replace(/^8090-/, "3000-")
    .replace(/^8091-/, "3000-")
    .replace(/^3001-/, "3000-");
  return `${protocol}//${apiHostname}`;
}

export function createTRPCClientConfig() {
  return createTRPCClient<AnyRouter>({
    links: [
      httpBatchLink({
        url: `${getApiBaseUrl()}/api/trpc`,
        transformer: superjson,
        fetch(url, options) {
          return fetch(url, { ...options, credentials: "include" });
        },
      }),
    ],
  });
}
