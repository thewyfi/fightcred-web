"use client";
export const dynamic = "force-dynamic";

import { trpc } from "@/lib/trpc";
import Link from "next/link";
import { Trophy, Loader2 } from "lucide-react";
import { cn, getTierBadgeClass, getTierLabel } from "@/lib/utils";

const TIER_RANGES = [
  { tier: "goat",      label: "G.O.A.T.",   range: "80–100",  color: "#D20A0A" },
  { tier: "champion",  label: "Champion",   range: "60–79",   color: "#C9A84C" },
  { tier: "contender", label: "Contender",  range: "40–59",   color: "#C0C0C0" },
  { tier: "rookie",    label: "Rookie",     range: "0–39",    color: "#9A9A9A" },
];

function ScoreBar({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  const color =
    clamped >= 80 ? "#D20A0A" :
    clamped >= 60 ? "#C9A84C" :
    clamped >= 40 ? "#C0C0C0" :
    "#9A9A9A";

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-[#9A9A9A]">Cred Score</span>
        <span className="font-black text-base" style={{ color }}>{clamped}</span>
      </div>
      <div className="h-1.5 bg-[#252525] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${clamped}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

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
          Top predictors ranked by credibility score (0–100). Score is based on accuracy, pick volume, and the odds of each fight you predicted.
        </p>
      </div>

      {/* Tier legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {TIER_RANGES.map(({ tier, label, range, color }) => (
          <div key={tier} className="bg-[#1A1A1A] border border-[#333] rounded-xl p-3 text-center">
            <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", getTierBadgeClass(tier))}>
              {label}
            </span>
            <div className="text-[#9A9A9A] text-xs mt-1" style={{ color }}>{range}</div>
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
          <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-5 py-3 border-b border-[#333] text-xs font-bold text-[#9A9A9A] uppercase tracking-wide">
            <span>Rank</span>
            <span>Player</span>
            <span className="text-right hidden sm:block">Picks</span>
            <span className="text-right">Score</span>
          </div>
          {/* Rows */}
          <div className="divide-y divide-[#252525]">
            {(leaderboard as Array<{
              userId: number;
              username: string;
              displayName?: string | null;
              credibilityScore: number;
              tier: string;
              totalPicks: number;
              correctPicks: number;
              currentStreak: number;
            }>).map((entry, i) => {
              const rank = i + 1;
              const accuracy = entry.totalPicks > 0
                ? Math.round((entry.correctPicks / entry.totalPicks) * 100)
                : 0;
              const score = Math.max(0, Math.min(100, entry.credibilityScore));
              const scoreColor =
                score >= 80 ? "#D20A0A" :
                score >= 60 ? "#C9A84C" :
                score >= 40 ? "#C0C0C0" :
                "#9A9A9A";

              return (
                <Link
                  key={entry.userId}
                  href={`/player/${entry.username}`}
                  className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-5 py-4 hover:bg-[#252525] transition-colors items-center"
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
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[#9A9A9A] text-xs">{accuracy}% accuracy</span>
                      {entry.currentStreak > 1 && (
                        <span className="text-xs text-[#D20A0A]">🔥 {entry.currentStreak} streak</span>
                      )}
                    </div>
                    {/* Score progress bar */}
                    <div className="mt-2 w-full max-w-[200px]">
                      <div className="h-1.5 bg-[#252525] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${score}%`, backgroundColor: scoreColor }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Picks */}
                  <div className="text-right hidden sm:block">
                    <div className="text-white font-bold text-sm">{entry.correctPicks}/{entry.totalPicks}</div>
                    <div className="text-[#9A9A9A] text-xs">correct</div>
                  </div>

                  {/* Score */}
                  <div className="text-right min-w-[48px]">
                    <div className="font-black text-2xl" style={{ color: scoreColor }}>{score}</div>
                    <div className="text-[#9A9A9A] text-xs">/ 100</div>
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
