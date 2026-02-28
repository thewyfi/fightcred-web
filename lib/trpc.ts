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

const SESSION_TOKEN_KEY = "fightcred_session_token";

/** Store the session token in localStorage (used when cookie can't cross origins) */
export function saveSessionToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(SESSION_TOKEN_KEY, token);
  }
}

/** Retrieve the stored session token */
export function getSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_TOKEN_KEY);
}

/** Clear the stored session token (on logout) */
export function clearSessionToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_TOKEN_KEY);
  }
}

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
          const token = getSessionToken();
          const headers = new Headers((options?.headers as HeadersInit) ?? {});
          if (token) {
            headers.set("Authorization", `Bearer ${token}`);
          }
          return fetch(url, { ...options, headers, credentials: "include" });
        },
      }),
    ],
  });
}
