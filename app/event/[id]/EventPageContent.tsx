"use client"


import { use } from "react";
import { trpc } from "@/lib/trpc";
import Link from "next/link";
import { format } from "date-fns";
import { MapPin, ArrowLeft, Loader2, Trophy } from "lucide-react";
import { formatOdds, cn, getCardSectionLabel } from "@/lib/utils";
import { PredictionModal } from "@/components/prediction-modal";
import { SharePicksButton } from "@/components/share-picks-button";
import { useState } from "react";

type Fight = {
  id: number;
  fighter1Name: string;
  fighter2Name: string;
  fighter1Record?: string | null;
  fighter2Record?: string | null;
  fighter1Nickname?: string | null;
  fighter2Nickname?: string | null;
  fighter1Ranking?: string | null;
  fighter2Ranking?: string | null;
  weightClass?: string | null;
  cardSection: string;
  isTitleFight: boolean;
  isMainEvent: boolean;
  odds1?: number | null;
  odds2?: number | null;
  status: string;
  winner?: string | null;
  method?: string | null;
  round?: number | null;
};

function OddsBadge({ odds }: { odds: number | null | undefined }) {
  if (odds == null) return null;
  const isFav = odds < 0;
  return (
    <span className={cn(
      "px-1.5 py-0.5 rounded text-xs font-bold",
      isFav ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"
    )}>
      {formatOdds(odds)}
    </span>
  );
}

function FightCard({ fight, onPredict, userPrediction }: {
  fight: Fight;
  onPredict: (fight: Fight) => void;
  userPrediction?: { pickedWinner: string; pickedFinishType?: string | null; pickedMethod?: string | null; status: string } | null;
}) {
  const isCompleted = fight.status === "completed";
  const isLive = fight.status === "live";

  return (
    <div className={cn(
      "bg-[#1A1A1A] border rounded-xl p-4 transition-all",
      isLive ? "border-[#D20A0A]/50" : "border-[#333]",
      fight.isMainEvent ? "ring-1 ring-[#C9A84C]/30" : ""
    )}>
      {/* Header badges */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {fight.isMainEvent && (
          <span className="px-2 py-0.5 rounded-full bg-[#C9A84C]/20 text-[#C9A84C] text-xs font-bold uppercase tracking-wide">
            ⭐ Main Event
          </span>
        )}
        {fight.isTitleFight && (
          <span className="px-2 py-0.5 rounded-full bg-[#C9A84C]/20 text-[#C9A84C] text-xs font-bold uppercase tracking-wide">
            🏆 Title Fight
          </span>
        )}
        {fight.weightClass && (
          <span className="px-2 py-0.5 rounded bg-[#252525] text-[#9A9A9A] text-xs font-medium">
            {fight.weightClass}
          </span>
        )}
        {isLive && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-900/30 text-red-400 text-xs font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            LIVE
          </span>
        )}
        {isCompleted && (
          <span className="px-2 py-0.5 rounded-full bg-[#333] text-[#9A9A9A] text-xs font-semibold">FINAL</span>
        )}
      </div>

      {/* Fighters */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
        {/* Fighter 1 */}
        <div className={cn(
          "text-left",
          isCompleted && fight.winner === fight.fighter1Name ? "opacity-100" : isCompleted ? "opacity-40" : ""
        )}>
          {fight.fighter1Ranking && (
            <div className="text-[#9A9A9A] text-xs mb-0.5">#{fight.fighter1Ranking}</div>
          )}
          <div className="font-bold text-white text-base leading-tight">{fight.fighter1Name}</div>
          {fight.fighter1Nickname && (
            <div className="text-[#9A9A9A] text-xs italic">&ldquo;{fight.fighter1Nickname}&rdquo;</div>
          )}
          <div className="text-[#9A9A9A] text-xs mt-0.5">{fight.fighter1Record ?? ""}</div>
          <div className="mt-1.5">
            <OddsBadge odds={fight.odds1} />
          </div>
          {isCompleted && fight.winner === fight.fighter1Name && (
            <div className="mt-1 text-green-400 text-xs font-bold">✓ WINNER</div>
          )}
        </div>

        {/* VS */}
        <div className="text-center">
          <div className="text-[#9A9A9A] text-xs font-bold">VS</div>
        </div>

        {/* Fighter 2 */}
        <div className={cn(
          "text-right",
          isCompleted && fight.winner === fight.fighter2Name ? "opacity-100" : isCompleted ? "opacity-40" : ""
        )}>
          {fight.fighter2Ranking && (
            <div className="text-[#9A9A9A] text-xs mb-0.5">#{fight.fighter2Ranking}</div>
          )}
          <div className="font-bold text-white text-base leading-tight">{fight.fighter2Name}</div>
          {fight.fighter2Nickname && (
            <div className="text-[#9A9A9A] text-xs italic">&ldquo;{fight.fighter2Nickname}&rdquo;</div>
          )}
          <div className="text-[#9A9A9A] text-xs mt-0.5">{fight.fighter2Record ?? ""}</div>
          <div className="mt-1.5 flex justify-end">
            <OddsBadge odds={fight.odds2} />
          </div>
          {isCompleted && fight.winner === fight.fighter2Name && (
            <div className="mt-1 text-green-400 text-xs font-bold">✓ WINNER</div>
          )}
        </div>
      </div>

      {/* Result */}
      {isCompleted && fight.method && (
        <div className="mt-3 pt-3 border-t border-[#333] text-center">
          <span className="text-[#9A9A9A] text-xs">
            {fight.method === "tko_ko" ? "TKO/KO" : fight.method === "submission" ? "Submission" : "Decision"}
            {fight.round ? ` · Round ${fight.round}` : ""}
          </span>
        </div>
      )}

      {/* Prediction area */}
      {!isCompleted && (
        <div className="mt-3 pt-3 border-t border-[#333]">
          {userPrediction ? (
            <div className={cn(
              "flex items-center justify-between px-3 py-2 rounded-lg text-sm",
              userPrediction.status === "correct" ? "bg-green-900/20 text-green-400" :
              userPrediction.status === "wrong" ? "bg-red-900/20 text-red-400" :
              "bg-[#252525] text-[#9A9A9A]"
            )}>
              <span className="font-medium">Your pick: {userPrediction.pickedWinner}</span>
              {userPrediction.status !== "pending" && (
                <span className="font-bold capitalize">{userPrediction.status}</span>
              )}
            </div>
          ) : (
            <button
              onClick={() => onPredict(fight)}
              className="w-full py-2 rounded-lg bg-[#D20A0A]/15 hover:bg-[#D20A0A]/25 text-[#D20A0A] text-sm font-bold transition-colors border border-[#D20A0A]/30 hover:border-[#D20A0A]/60"
            >
              Make Your Pick →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const eventId = parseInt(id);
  const [selectedFight, setSelectedFight] = useState<Fight | null>(null);

  const { data: event, isLoading: eventLoading } = trpc.events.getById.useQuery({ id: eventId });
  const { data: fights, isLoading: fightsLoading } = trpc.fights.byEvent.useQuery({ eventId });
  const { data: fightsWithPreds } = trpc.fights.byEventWithPredictions.useQuery({ eventId });
  const { data: leaderboard } = trpc.leaderboard.byEvent.useQuery({ eventId, limit: 5 });
  const { data: user } = trpc.auth.me.useQuery();

  const isLoading = eventLoading || fightsLoading;

  // Group fights by card section
  const grouped = fights?.reduce((acc: Record<string, Fight[]>, fight: Fight) => {
    const section = fight.cardSection ?? "main";
    if (!acc[section]) acc[section] = [];
    acc[section].push(fight);
    return acc;
  }, {} as Record<string, typeof fights>) ?? {};

  const sectionOrder = ["main", "prelim", "early_prelim"];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-[#9A9A9A]">
        <Loader2 size={24} className="animate-spin mr-2" />
        Loading fight card...
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-24 text-[#9A9A9A]">
        <p>Event not found.</p>
        <Link href="/" className="text-[#D20A0A] hover:underline mt-2 block">← Back to Events</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link href="/" className="flex items-center gap-1.5 text-[#9A9A9A] hover:text-white transition-colors text-sm w-fit">
        <ArrowLeft size={16} />
        All Events
      </Link>

      {/* Event header */}
      <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={cn(
                "px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide",
                event.status === "live" ? "bg-red-900/30 text-red-400" :
                event.status === "completed" ? "bg-[#333] text-[#9A9A9A]" :
                "bg-[#252525] border border-[#333] text-[#9A9A9A]"
              )}>
                {event.status === "live" ? "🔴 LIVE" : event.status === "completed" ? "FINAL" : "UPCOMING"}
              </span>
              <span className="text-[#9A9A9A] text-sm">
                {format(new Date(event.eventDate), "EEEE, MMMM d, yyyy")}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">{event.name}</h1>
            {event.venue && (
              <div className="flex items-center gap-1 mt-2 text-[#9A9A9A] text-sm">
                <MapPin size={14} />
                {event.venue}{event.location ? `, ${event.location}` : ""}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-white">{fights?.length ?? 0}</div>
            <div className="text-xs text-[#9A9A9A]">Fights</div>
          </div>
        </div>
      </div>

      {/* Share My Picks — always visible when fights exist */}
      {fights && fights.length > 0 && (
        <div className="flex justify-center">
          <SharePicksButton
            eventName={event.name}
            eventDate={event.eventDate instanceof Date ? event.eventDate.toISOString() : String(event.eventDate)}
            fights={fights}
            fightsWithPreds={fightsWithPreds}
            username={(user as { username?: string } | null | undefined)?.username}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fight card */}
        <div className="lg:col-span-2 space-y-6">
          {sectionOrder.map((section) => {
            const sectionFights = grouped[section];
            if (!sectionFights?.length) return null;
            return (
              <div key={section}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px flex-1 bg-[#333]" />
                  <span className="text-xs font-bold text-[#9A9A9A] uppercase tracking-widest">
                    {getCardSectionLabel(section)}
                  </span>
                  <div className="h-px flex-1 bg-[#333]" />
                </div>
                <div className="space-y-3">
                  {sectionFights.map((fight: Fight) => {
                    const pred = fightsWithPreds?.find((f: { id: number; userPrediction?: unknown }) => f.id === fight.id)?.userPrediction as { pickedWinner: string; pickedFinishType?: string | null; pickedMethod?: string | null; status: string } | null | undefined;
                    return (
                      <FightCard
                        key={fight.id}
                        fight={fight}
                        onPredict={setSelectedFight}
                        userPrediction={pred}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sidebar: Top Predictors */}
        <div className="space-y-4">
          <div className="bg-[#1A1A1A] border border-[#333] rounded-xl p-4">
            <h3 className="font-bold text-white mb-3 flex items-center gap-2">
              <Trophy size={16} className="text-[#C9A84C]" />
              Top Predictors
            </h3>
            {leaderboard && leaderboard.length > 0 ? (
              <div className="space-y-2">
                {(leaderboard as Array<{ userId: number; username: string; eventCredibilityEarned?: number }>).map((entry, i) => (
                  <Link
                    key={entry.userId}
                    href={`/player/${entry.username}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#252525] transition-colors"
                  >
                    <span className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-xs font-black",
                      i === 0 ? "bg-[#C9A84C] text-black" :
                      i === 1 ? "bg-gray-400 text-black" :
                      i === 2 ? "bg-amber-700 text-white" :
                      "bg-[#333] text-[#9A9A9A]"
                    )}>
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm text-white font-medium truncate">{entry.username}</span>
                    <span className="text-xs text-[#C9A84C] font-bold">{entry.eventCredibilityEarned ?? 0}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-[#9A9A9A] text-sm">No predictions yet. Be the first!</p>
            )}
            <Link
              href="/leaderboard"
              className="mt-3 block text-center text-xs text-[#D20A0A] hover:underline"
            >
              Full Leaderboard →
            </Link>
          </div>
        </div>
      </div>

      {/* Prediction modal */}
      {selectedFight && (
        <PredictionModal
          fight={selectedFight}
          onClose={() => setSelectedFight(null)}
        />
      )}
    </div>
  );
}
