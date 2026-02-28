"use client";
export const runtime = "edge";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getApiBaseUrl } from "@/lib/trpc";

const SESSION_COOKIE_NAME = "manus_session";

function setCookie(name: string, value: string, days: number) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"processing" | "error">("processing");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      setErrorMsg(`OAuth error: ${error}`);
      setStatus("error");
      return;
    }

    if (!code || !state) {
      setErrorMsg("Missing code or state parameter.");
      setStatus("error");
      return;
    }

    const exchangeCode = async () => {
      try {
        const apiBase = getApiBaseUrl();
        const params = new URLSearchParams({ code, state });
        const res = await fetch(`${apiBase}/api/oauth/mobile?${params.toString()}`, {
          credentials: "include",
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Server error: ${res.status}`);
        }

        const data = await res.json();
        const sessionToken = data.app_session_id;

        if (!sessionToken) {
          throw new Error("No session token returned from server.");
        }

        // Store session token in cookie for cross-request auth
        setCookie(SESSION_COOKIE_NAME, sessionToken, 365);

        // Check if the user has a profile — new users need to set one up
        try {
          const profileRes = await fetch(`${apiBase}/api/trpc/profile.get?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%7D%7D`, {
            credentials: "include",
            headers: { Authorization: `Bearer ${sessionToken}` },
          });
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            // tRPC batch response is an array
            const result = Array.isArray(profileData) ? profileData[0] : profileData;
            const hasProfile = result?.result?.data?.json?.username != null;
            if (!hasProfile) {
              router.replace("/profile/setup");
              return;
            }
          }
        } catch {
          // If profile check fails, still redirect to home
        }

        // Existing user — go to home
        router.replace("/");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Authentication failed. Please try again.";
        console.error("[OAuth Callback] Failed:", err);
        setErrorMsg(message);
        setStatus("error");
      }
    };

    exchangeCode();
  }, [searchParams, router]);

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D]">
        <div className="text-center max-w-sm px-4">
          <div className="w-16 h-16 rounded-2xl bg-[#D20A0A]/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Sign In Failed</h1>
          <p className="text-[#9A9A9A] text-sm mb-6">{errorMsg}</p>
          <button
            onClick={() => router.push("/login")}
            className="px-6 py-3 bg-[#D20A0A] text-white rounded-xl font-semibold text-sm hover:bg-[#b00808] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D]">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#D20A0A] flex items-center justify-center font-black text-white text-2xl mx-auto mb-4">
          FC
        </div>
        <p className="text-white font-semibold mb-2">Signing you in...</p>
        <div className="flex justify-center gap-1 mt-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-[#D20A0A] animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
