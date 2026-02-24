"use client"

export const dynamic = "force-dynamic";;

import { use } from "react";
import { trpc } from "@/lib/trpc";
import Link from "next/link";
import { ArrowLeft, Loader2, Trophy, Swords, Share2 } from "lucide-react";
import { cn, getTierBadgeClass, getTierLabel } from "@/lib/utils";

export default function PublicPlayerPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const { data: profile, isLoading } = trpc.profile.getByUsername.useQuery({ username });
  const { data: fighterStats } = trpc.profile.fighterStatsById.useQuery(
    { userId: profile?.userId ?? 0 },
    { enabled: !!profile }
  );
  const { data: credLog } = trpc.profile.credibilityLogById.useQuery(
    { userId: profile?.userId ?? 0 },
    { enabled: !!profile }
  );

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${username}'s FightCred Profile`,
        text: `Check out ${username}'s UFC prediction stats on FightCred!`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-[#9A9A9A]">
        <Loader2 size={24} className="animate-spin mr-2" />
        Loading profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-24 text-[#9A9A9A]">
        <p>Player not found.</p>
        <Link href="/leaderboard" className="text-[#D20A0A] hover:underline mt-2 block">← Leaderboard</Link>
      </div>
    );
  }

  const accuracy = profile.totalPicks > 0
    ? Math.round((profile.correctPicks / profile.totalPicks) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link href="/leaderboard" className="flex items-center gap-1.5 text-[#9A9A9A] hover:text-white transition-colors text-sm w-fit">
        <ArrowLeft size={16} />
        Leaderboard
      </Link>

      {/* Profile card */}
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
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#333] hover:border-[#555] text-[#9A9A9A] hover:text-white text-sm transition-colors"
          >
            <Share2 size={14} />
            Share
          </button>
        </div>

        {/* Score */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="col-span-2 sm:col-span-1 bg-[#252525] rounded-xl p-4 text-center">
            <div className="text-3xl font-black text-[#C9A84C]">{profile.credibilityScore.toLocaleString()}</div>
            <div className="text-xs text-[#9A9A9A] mt-0.5">Credibility</div>
          </div>
          <div className="bg-[#252525] rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-white">{accuracy}%</div>
            <div className="text-xs text-[#9A9A9A] mt-0.5">Accuracy</div>
          </div>
          <div className="bg-[#252525] rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-white">{profile.correctPicks}/{profile.totalPicks}</div>
            <div className="text-xs text-[#9A9A9A] mt-0.5">Correct Picks</div>
          </div>
          <div className="bg-[#252525] rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-white">{profile.currentStreak}</div>
            <div className="text-xs text-[#9A9A9A] mt-0.5">
              {profile.currentStreak > 1 ? "🔥 Streak" : "Streak"}
            </div>
          </div>
        </div>
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
                  <div className={cn(
                    "font-bold text-sm",
                    acc >= 70 ? "text-green-400" : acc >= 50 ? "text-yellow-400" : "text-red-400"
                  )}>
                    {acc}%
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
                <div className="flex-1 min-w-0 text-[#9A9A9A] text-xs">
                  {log.breakdown ?? `Fight #${log.fightId}`}
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
