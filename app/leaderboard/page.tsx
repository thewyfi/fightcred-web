"use client"

export const dynamic = "force-dynamic";;

import { trpc } from "@/lib/trpc";
import Link from "next/link";
import { Trophy, Loader2 } from "lucide-react";
import { cn, getTierBadgeClass, getTierLabel } from "@/lib/utils";

export default function LeaderboardPage() {
  const { data: leaderboard, isLoading } = trpc.leaderboard.global.useQuery({ limit: 100 });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <Trophy size={24} className="text-[#C9A84C]" />
          <h1 className="text-2xl font-black text-white">Global Leaderboard</h1>
        </div>
        <p className="text-[#9A9A9A] text-sm">
          Top predictors ranked by credibility score. Earn more by picking underdogs correctly.
        </p>
      </div>

      {/* Tier legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { tier: "goat", label: "G.O.A.T.", threshold: "15,000+" },
          { tier: "champion", label: "Champion", threshold: "5,000+" },
          { tier: "contender", label: "Contender", threshold: "1,000+" },
          { tier: "rookie", label: "Rookie", threshold: "0+" },
        ].map(({ tier, label, threshold }) => (
          <div key={tier} className="bg-[#1A1A1A] border border-[#333] rounded-xl p-3 text-center">
            <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", getTierBadgeClass(tier))}>
              {label}
            </span>
            <div className="text-[#9A9A9A] text-xs mt-1">{threshold} pts</div>
          </div>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-[#9A9A9A]">
          <Loader2 size={24} className="animate-spin mr-2" />
          Loading rankings...
        </div>
      ) : !leaderboard || leaderboard.length === 0 ? (
        <div className="text-center py-16 text-[#9A9A9A]">
          <Trophy size={40} className="mx-auto mb-3 opacity-30" />
          <p>No rankings yet. Make some predictions!</p>
        </div>
      ) : (
        <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-[#333] text-xs font-bold text-[#9A9A9A] uppercase tracking-wide">
            <span>Rank</span>
            <span>Player</span>
            <span className="text-right hidden sm:block">Accuracy</span>
            <span className="text-right hidden sm:block">Picks</span>
            <span className="text-right">Score</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-[#252525]">
            {(leaderboard as Array<{ userId: number; username: string; displayName?: string | null; credibilityScore: number; tier: string; totalPicks: number; correctPicks: number; currentStreak: number }>).map((entry, i) => {
              const rank = i + 1;
              const accuracy = entry.totalPicks > 0
                ? Math.round((entry.correctPicks / entry.totalPicks) * 100)
                : 0;

              return (
                <Link
                  key={entry.userId}
                  href={`/player/${entry.username}`}
                  className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-5 py-4 hover:bg-[#252525] transition-colors items-center"
                >
                  {/* Rank */}
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-black",
                    rank === 1 ? "bg-[#C9A84C] text-black" :
                    rank === 2 ? "bg-gray-400 text-black" :
                    rank === 3 ? "bg-amber-700 text-white" :
                    "bg-[#252525] text-[#9A9A9A]"
                  )}>
                    {rank <= 3 ? (
                      rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"
                    ) : rank}
                  </div>

                  {/* Player */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white truncate">{entry.username}</span>
                      <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-semibold", getTierBadgeClass(entry.tier))}>
                        {getTierLabel(entry.tier)}
                      </span>
                    </div>
                    {entry.currentStreak > 1 && (
                      <div className="text-xs text-[#D20A0A] mt-0.5">🔥 {entry.currentStreak} streak</div>
                    )}
                  </div>

                  {/* Accuracy */}
                  <div className="text-right hidden sm:block">
                    <div className="text-white font-bold text-sm">{accuracy}%</div>
                    <div className="text-[#9A9A9A] text-xs">accuracy</div>
                  </div>

                  {/* Picks */}
                  <div className="text-right hidden sm:block">
                    <div className="text-white font-bold text-sm">{entry.correctPicks}/{entry.totalPicks}</div>
                    <div className="text-[#9A9A9A] text-xs">correct</div>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <div className="text-[#C9A84C] font-black text-lg">{entry.credibilityScore.toLocaleString()}</div>
                    <div className="text-[#9A9A9A] text-xs">pts</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
