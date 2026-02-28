"use client";
export const runtime = "edge";
export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveSessionToken } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

/**
 * /auth/callback
 *
 * After any OAuth sign-in, Railway redirects here with:
 *   ?token=<session_token>            — for existing users (has profile)
 *   ?token=<session_token>&setup=1    — for new users (no profile yet)
 *
 * This page:
 * 1. Reads the token from the URL
 * 2. Saves it to localStorage (cross-origin cookie workaround)
 * 3. Redirects to /profile/setup (new users) or / (existing users)
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const setup = searchParams.get("setup");

    if (token) {
      saveSessionToken(token);
    }

    // Small delay to ensure localStorage write completes before navigation
    setTimeout(() => {
      if (setup === "1") {
        router.replace("/profile/setup");
      } else {
        router.replace("/");
      }
    }, 100);
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader2 size={32} className="animate-spin text-[#D20A0A]" />
        <p className="text-[#9A9A9A] text-sm">Signing you in...</p>
      </div>
    </div>
  );
}
