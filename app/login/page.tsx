"use client"
export const runtime = 'edge';
export const dynamic = "force-dynamic";


import { trpc } from "@/lib/trpc";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Shield, Swords } from "lucide-react";
import { getApiBaseUrl } from "@/lib/trpc";

export default function LoginPage() {
  const router = useRouter();
  const { data: user, isLoading } = trpc.auth.me.useQuery();

  useEffect(() => {
    if (user) router.push("/");
  }, [user, router]);

  const handleLogin = () => {
    const apiBase = getApiBaseUrl();
    // Redirect to the backend OAuth flow
    window.location.href = `${apiBase}/api/oauth/login?redirectTo=${encodeURIComponent(window.location.origin)}`;
  };

  const handleDevLogin = async () => {
    const apiBase = getApiBaseUrl();
    try {
      const res = await fetch(`${apiBase}/api/auth/dev-login`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        window.location.href = "/";
      } else {
        alert("Dev login failed. Make sure the server is running in development mode.");
      }
    } catch {
      alert("Could not connect to the server.");
    }
  };

  if (isLoading) return null;

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#D20A0A] flex items-center justify-center font-black text-white text-2xl mx-auto mb-4">
            FC
          </div>
          <h1 className="text-2xl font-black text-white">Welcome to FightCred</h1>
          <p className="text-[#9A9A9A] text-sm mt-1">Sign in to make predictions and earn credibility</p>
        </div>

        {/* Card */}
        <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl p-6 space-y-4">
          <button
            onClick={handleLogin}
            className="w-full py-3.5 rounded-xl bg-[#D20A0A] hover:bg-[#b00808] text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <Shield size={16} />
            Sign In with Manus
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#333]" />
            </div>
            <div className="relative flex justify-center text-xs text-[#9A9A9A]">
              <span className="bg-[#1A1A1A] px-2">or</span>
            </div>
          </div>

          <button
            onClick={handleDevLogin}
            className="w-full py-3 rounded-xl border border-dashed border-[#C9A84C]/50 text-[#C9A84C] text-sm font-medium hover:bg-[#C9A84C]/10 transition-colors flex items-center justify-center gap-2"
          >
            <Swords size={14} />
            Dev Preview (no login)
          </button>

          <p className="text-[#555] text-xs text-center">
            Dev Preview is for testing only. Not available in production.
          </p>
        </div>

        {/* Features */}
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          {[
            { icon: "🥊", label: "Predict fights" },
            { icon: "📈", label: "Earn credibility" },
            { icon: "🏆", label: "Top the leaderboard" },
          ].map(({ icon, label }) => (
            <div key={label} className="bg-[#1A1A1A] border border-[#333] rounded-xl p-3">
              <div className="text-xl mb-1">{icon}</div>
              <div className="text-[#9A9A9A] text-xs">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
