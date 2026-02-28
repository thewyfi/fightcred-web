"use client";
export const runtime = "edge";
export const dynamic = "force-dynamic";
import { trpc } from "@/lib/trpc";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getApiBaseUrl } from "@/lib/trpc";

export default function SignupPage() {
  const router = useRouter();
  const { data: user, isLoading } = trpc.auth.me.useQuery();
  const [email, setEmail] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // If already logged in, redirect to profile setup or home
  useEffect(() => {
    if (user) router.push("/profile/setup");
  }, [user, router]);

  const handleSocialSignup = (provider: "google" | "twitter" | "facebook") => {
    const apiBase = getApiBaseUrl();
    // Always redirect to profile/setup after OAuth for new users
    const redirectTo = encodeURIComponent(`${window.location.origin}/profile/setup`);
    window.location.href = `${apiBase}/api/auth/${provider}?redirectTo=${redirectTo}`;
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || magicLinkLoading) return;
    setMagicLinkLoading(true);
    setErrorMsg(null);
    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/auth/magic-link/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          redirectTo: `${window.location.origin}/profile/setup`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send magic link");
      setMagicLinkSent(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to send magic link. Please try again.");
    } finally {
      setMagicLinkLoading(false);
    }
  };

  if (isLoading) return null;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#D20A0A] flex items-center justify-center font-black text-white text-2xl mx-auto mb-4 shadow-lg shadow-[#D20A0A]/30">
            FC
          </div>
          <h1 className="text-2xl font-black text-white">Create Your Account</h1>
          <p className="text-[#9A9A9A] text-sm mt-1">Join FightCred and start predicting fights</p>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mb-4 px-4 py-3 bg-red-900/30 border border-red-700/50 rounded-xl text-red-400 text-sm text-center">
            {errorMsg}
          </div>
        )}

        {/* Auth options */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 space-y-3">
          {/* Google */}
          <button
            onClick={() => handleSocialSignup("google")}
            className="w-full py-3 rounded-xl bg-white hover:bg-gray-100 text-[#1A1A1A] font-semibold text-sm transition-colors flex items-center justify-center gap-3"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign up with Google
          </button>

          {/* X / Twitter */}
          <button
            onClick={() => handleSocialSignup("twitter")}
            className="w-full py-3 rounded-xl bg-black hover:bg-[#111] border border-[#333] text-white font-semibold text-sm transition-colors flex items-center justify-center gap-3"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/>
            </svg>
            Sign up with X
          </button>

          {/* Facebook */}
          <button
            onClick={() => handleSocialSignup("facebook")}
            className="w-full py-3 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] text-white font-semibold text-sm transition-colors flex items-center justify-center gap-3"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Sign up with Facebook
          </button>

          {/* Divider */}
          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#2A2A2A]" />
            </div>
            <div className="relative flex justify-center text-xs text-[#555]">
              <span className="bg-[#1A1A1A] px-3">or sign up with email</span>
            </div>
          </div>

          {/* Magic Link */}
          {magicLinkSent ? (
            <div className="text-center py-4">
              <div className="text-2xl mb-2">📬</div>
              <p className="text-white font-semibold text-sm">Check your inbox!</p>
              <p className="text-[#9A9A9A] text-xs mt-1">
                We sent a sign-up link to <span className="text-white">{email}</span>
              </p>
              <button
                onClick={() => { setMagicLinkSent(false); setEmail(""); }}
                className="mt-3 text-[#D20A0A] text-xs hover:underline"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleMagicLink} className="space-y-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full px-4 py-3 rounded-xl bg-[#111] border border-[#2A2A2A] text-white placeholder-[#555] text-sm focus:outline-none focus:border-[#D20A0A] transition-colors"
              />
              <button
                type="submit"
                disabled={magicLinkLoading || !email}
                className="w-full py-3 rounded-xl bg-[#D20A0A] hover:bg-[#b00808] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
              >
                {magicLinkLoading ? "Sending..." : "Send Sign-Up Link"}
              </button>
            </form>
          )}
        </div>

        {/* What you get */}
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          {[
            { icon: "🥊", label: "Predict fights" },
            { icon: "📈", label: "Earn credibility" },
            { icon: "🏆", label: "Top the leaderboard" },
          ].map(({ icon, label }) => (
            <div key={label} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3">
              <div className="text-xl mb-1">{icon}</div>
              <div className="text-[#9A9A9A] text-xs">{label}</div>
            </div>
          ))}
        </div>

        {/* Already have account */}
        <p className="text-center text-[#555] text-sm mt-5">
          Already have an account?{" "}
          <a href="/login" className="text-[#D20A0A] hover:underline font-medium">
            Sign in
          </a>
        </p>

        <p className="text-center text-[#444] text-xs mt-3">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
