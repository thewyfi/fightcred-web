"use client";
export const runtime = "edge";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

export default function ProfileSetupPage() {
  const router = useRouter();
  const { data: user, isLoading: authLoading } = trpc.auth.me.useQuery();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");

  const setupProfile = trpc.profile.setup.useMutation({
    onSuccess: () => {
      router.replace("/profile");
    },
    onError: (e: { message: string }) => setError(e.message),
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center py-24 text-[#9A9A9A]">
        <Loader2 size={24} className="animate-spin mr-2" />
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) {
      setError("Username is required.");
      return;
    }
    if (!/^[a-zA-Z0-9_]{3,32}$/.test(trimmed)) {
      setError("Username must be 3–32 characters: letters, numbers, underscores only.");
      return;
    }
    setError("");
    setupProfile.mutate({ username: trimmed, displayName: displayName.trim() || undefined });
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#D20A0A] flex items-center justify-center font-black text-white text-2xl mx-auto mb-4">
            FC
          </div>
          <h1 className="text-2xl font-black text-white tracking-wide uppercase">Set Up Your Profile</h1>
          <p className="text-[#9A9A9A] text-sm mt-1">Choose your fighter identity to start earning cred</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-[#1A1A1A] border border-[#333] rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#9A9A9A] uppercase tracking-widest mb-1.5">
              Username <span className="text-[#D20A0A]">*</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. conor_fan99"
              maxLength={32}
              autoFocus
              className="w-full bg-[#0D0D0D] border border-[#333] rounded-xl px-4 py-3 text-white text-sm placeholder-[#555] focus:outline-none focus:border-[#D20A0A] transition-colors"
            />
            <p className="text-[10px] text-[#555] mt-1.5">Letters, numbers, underscores only. 3–32 characters.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#9A9A9A] uppercase tracking-widest mb-1.5">
              Display Name <span className="text-[#555]">(optional)</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. The Notorious"
              maxLength={64}
              className="w-full bg-[#0D0D0D] border border-[#333] rounded-xl px-4 py-3 text-white text-sm placeholder-[#555] focus:outline-none focus:border-[#D20A0A] transition-colors"
            />
          </div>

          {error && (
            <div className="bg-[#D20A0A]/10 border border-[#D20A0A]/30 rounded-lg px-3 py-2">
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={!username.trim() || setupProfile.isPending}
            className="w-full bg-[#D20A0A] text-white font-bold py-3 rounded-xl hover:bg-[#b00808] transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm uppercase tracking-wide"
          >
            {setupProfile.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Creating Profile...
              </span>
            ) : (
              "Create Profile"
            )}
          </button>
        </form>

        <p className="text-center text-[#555] text-xs mt-4">
          You can change your display name later from your profile settings.
        </p>
      </div>
    </div>
  );
}
