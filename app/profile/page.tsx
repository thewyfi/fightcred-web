"use client"
export const runtime = 'edge';
export const dynamic = "force-dynamic";


import { trpc } from "@/lib/trpc";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Trophy, Swords, Loader2, Share2, Copy, CheckCircle } from "lucide-react";
import { cn, getTierBadgeClass, getTierLabel } from "@/lib/utils";

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-[#1A1A1A] border border-[#333] rounded-xl p-4 text-center">
      <div className="text-2xl font-black text-white">{value}</div>
      {sub && <div className="text-xs text-[#C9A84C] font-medium mt-0.5">{sub}</div>}
      <div className="text-xs text-[#9A9A9A] mt-0.5">{label}</div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { data: user, isLoading: authLoading } = trpc.auth.me.useQuery();
  const { data: profile, isLoading: profileLoading } = trpc.profile.get.useQuery(undefined, { enabled: !!user });
  const { data: fighterStats } = trpc.profile.fighterStats.useQuery(undefined, { enabled: !!user });
  const { data: credLog } = trpc.profile.credibilityLog.useQuery(undefined, { enabled: !!user });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const shareUrl = profile ? `${window.location.origin}/player/${profile.username}` : "";

  const handleCopy = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-[#9A9A9A]">
        <Loader2 size={24} className="animate-spin mr-2" />
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="text-center py-24 text-[#9A9A9A]">
        <p>Profile not found.</p>
        <Link href="/login" className="text-[#D20A0A] hover:underline mt-2 block">Sign in →</Link>
      </div>
    );
  }

  const accuracy = profile.totalPicks > 0
    ? Math.round((profile.correctPicks / profile.totalPicks) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#D20A0A] flex items-center justify-center font-black text-white text-2xl">
              {profile.username?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">{profile.username}</h1>
              {profile.displayName && (
                <p className="text-[#9A9A9A] text-sm">{profile.displayName}</p>
              )}
              <div className="mt-1.5">
                <span className={cn("text-xs px-2.5 py-1 rounded-full font-bold", getTierBadgeClass(profile.tier))}>
                  {getTierLabel(profile.tier)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#333] hover:border-[#555] text-[#9A9A9A] hover:text-white text-sm transition-colors"
            >
              {copied ? <CheckCircle size={14} className="text-green-400" /> : <Copy size={14} />}
              {copied ? "Copied!" : "Share Profile"}
            </button>
            <Link
              href={`/player/${profile.username}`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#333] hover:border-[#555] text-[#9A9A9A] hover:text-white text-sm transition-colors"
            >
              <Share2 size={14} />
              Public View
            </Link>
          </div>
        </div>

        {/* Credibility score */}
        <div className="mt-5 p-4 rounded-xl bg-[#252525] border border-[#333]">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-4xl font-black text-[#C9A84C]">{profile.credibilityScore.toLocaleString()}</div>
              <div className="text-[#9A9A9A] text-sm mt-0.5">Credibility Score</div>
            </div>
            <div className="text-right">
              {profile.currentStreak > 1 && (
                <div className="text-[#D20A0A] font-bold">🔥 {profile.currentStreak} streak</div>
              )}
              {profile.bestStreak > 0 && (
                <div className="text-[#9A9A9A] text-xs">Best: {profile.bestStreak}</div>
              )}
            </div>
          </div>

          {/* Tier progress */}
          <div className="mt-3">
            {profile.tier !== "goat" && (
              <div>
                <div className="flex justify-between text-xs text-[#9A9A9A] mb-1">
                  <span>{getTierLabel(profile.tier)}</span>
                  <span>
                    {profile.tier === "rookie" ? "1,000" :
                     profile.tier === "contender" ? "5,000" : "15,000"} pts to next tier
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-[#333] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#D20A0A] transition-all"
                    style={{
                      width: `${Math.min(100, profile.tier === "rookie"
                        ? (profile.credibilityScore / 1000) * 100
                        : profile.tier === "contender"
                        ? ((profile.credibilityScore - 1000) / 4000) * 100
                        : ((profile.credibilityScore - 5000) / 10000) * 100
                      )}%`
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Picks" value={profile.totalPicks} />
        <StatCard label="Accuracy" value={`${accuracy}%`} sub={`${profile.correctPicks} correct`} />
        <StatCard label="Finish Accuracy" value={profile.totalFinishPicks > 0 ? `${Math.round((profile.correctFinishPicks / profile.totalFinishPicks) * 100)}%` : "—"} sub={profile.totalFinishPicks > 0 ? `${profile.correctFinishPicks}/${profile.totalFinishPicks}` : undefined} />
        <StatCard label="Underdog Picks" value={profile.totalUnderdogPicks > 0 ? `${Math.round((profile.correctUnderdogPicks / profile.totalUnderdogPicks) * 100)}%` : "—"} sub={profile.totalUnderdogPicks > 0 ? `${profile.correctUnderdogPicks}/${profile.totalUnderdogPicks}` : undefined} />
      </div>

      {/* Fighter stats */}
      {fighterStats && fighterStats.length > 0 && (
        <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#333]">
            <h2 className="font-bold text-white flex items-center gap-2">
              <Swords size={16} className="text-[#D20A0A]" />
              Fighter Accuracy
            </h2>
          </div>
          <div className="divide-y divide-[#252525]">
            {(fighterStats as Array<{ id: number; fighterName: string; totalPicks: number; correctPicks: number }>).slice(0, 10).map((stat) => {
              const acc = stat.totalPicks > 0 ? Math.round((stat.correctPicks / stat.totalPicks) * 100) : 0;
              return (
                <div key={stat.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white text-sm truncate">{stat.fighterName}</div>
                    <div className="text-[#9A9A9A] text-xs">{stat.correctPicks}/{stat.totalPicks} correct</div>
                  </div>
                  <div className="text-right">
                    <div className={cn(
                      "font-bold text-sm",
                      acc >= 70 ? "text-green-400" : acc >= 50 ? "text-yellow-400" : "text-red-400"
                    )}>
                      {acc}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Credibility log */}
      {credLog && credLog.length > 0 && (
        <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#333]">
            <h2 className="font-bold text-white flex items-center gap-2">
              <Trophy size={16} className="text-[#C9A84C]" />
              Recent Credibility Earned
            </h2>
          </div>
          <div className="divide-y divide-[#252525]">
            {(credLog as Array<{ id: number; fightId: number; breakdown?: string | null; totalPoints: number }>).slice(0, 10).map((log) => (
              <div key={log.id} className="flex items-center gap-4 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <div className="text-[#9A9A9A] text-xs">
                    {log.breakdown ?? `Fight #${log.fightId}`}
                  </div>
                </div>
                <div className="text-[#C9A84C] font-bold text-sm">+{log.totalPoints}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
