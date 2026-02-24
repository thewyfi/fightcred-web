"use client"
export const runtime = 'edge';
export const dynamic = "force-dynamic";


import { trpc } from "@/lib/trpc";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Swords, Loader2, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { cn, getMethodLabel } from "@/lib/utils";

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "correct": return <CheckCircle size={16} className="text-green-400" />;
    case "wrong": return <XCircle size={16} className="text-red-400" />;
    case "partial": return <AlertCircle size={16} className="text-yellow-400" />;
    default: return <Clock size={16} className="text-[#9A9A9A]" />;
  }
}

function StatusBadge({ status, points }: { status: string; points: number }) {
  const base = "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold";
  switch (status) {
    case "correct":
      return <span className={cn(base, "bg-green-900/30 text-green-400")}>✓ Correct +{points} pts</span>;
    case "wrong":
      return <span className={cn(base, "bg-red-900/30 text-red-400")}>✗ Wrong</span>;
    case "partial":
      return <span className={cn(base, "bg-yellow-900/30 text-yellow-400")}>~ Partial +{points} pts</span>;
    default:
      return <span className={cn(base, "bg-[#252525] text-[#9A9A9A]")}>Pending</span>;
  }
}

export default function PicksPage() {
  const router = useRouter();
  const { data: user, isLoading: authLoading } = trpc.auth.me.useQuery();
  const { data: predictions, isLoading } = trpc.predictions.myPredictions.useQuery(undefined, {
    enabled: !!user,
  });

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center py-24 text-[#9A9A9A]">
        <Loader2 size={24} className="animate-spin mr-2" />
      </div>
    );
  }

  type PredEntry = { prediction: { id: number; pickedWinner: string; pickedFinishType: string | null; pickedMethod: string | null; status: string; totalPoints: number; winnerPoints: number; finishTypePoints: number; methodPoints: number; bonusPoints: number }; fight: { id: number; fighter1Name: string; fighter2Name: string }; event: { name: string } };
  const predList = predictions as PredEntry[] | undefined;
  const pending = predList?.filter(p => p.prediction.status === "pending") ?? [];
  const resolved = predList?.filter(p => p.prediction.status !== "pending") ?? [];
  const totalPoints = predList?.reduce((sum, p) => sum + (p.prediction.totalPoints ?? 0), 0) ?? 0;
  const correct = predList?.filter(p => p.prediction.status === "correct").length ?? 0;
  const total = predList?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <Swords size={24} className="text-[#D20A0A]" />
          <h1 className="text-2xl font-black text-white">My Picks</h1>
        </div>
        <p className="text-[#9A9A9A] text-sm">All your fight predictions in one place.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#1A1A1A] border border-[#333] rounded-xl p-4 text-center">
          <div className="text-2xl font-black text-white">{total}</div>
          <div className="text-xs text-[#9A9A9A] mt-0.5">Total Picks</div>
        </div>
        <div className="bg-[#1A1A1A] border border-[#333] rounded-xl p-4 text-center">
          <div className="text-2xl font-black text-white">
            {total > 0 ? Math.round((correct / total) * 100) : 0}%
          </div>
          <div className="text-xs text-[#9A9A9A] mt-0.5">Accuracy</div>
        </div>
        <div className="bg-[#1A1A1A] border border-[#333] rounded-xl p-4 text-center">
          <div className="text-2xl font-black text-[#C9A84C]">{totalPoints.toLocaleString()}</div>
          <div className="text-xs text-[#9A9A9A] mt-0.5">Points Earned</div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-[#9A9A9A]">
          <Loader2 size={24} className="animate-spin mr-2" />
          Loading picks...
        </div>
      ) : !predictions || predictions.length === 0 ? (
        <div className="text-center py-16 text-[#9A9A9A]">
          <Swords size={40} className="mx-auto mb-3 opacity-30" />
          <p className="mb-3">No picks yet.</p>
          <Link href="/" className="px-4 py-2 bg-[#D20A0A] hover:bg-[#b00808] text-white text-sm font-bold rounded-xl transition-colors">
            Browse Events →
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pending picks */}
          {pending.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-[#9A9A9A] uppercase tracking-wide mb-3">
                Pending ({pending.length})
              </h2>
              <div className="space-y-2">
                {pending.map((entry) => (
                  <div key={entry.prediction.id} className="bg-[#1A1A1A] border border-[#333] rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-[#9A9A9A] text-xs mb-1">{entry.fight.fighter1Name} vs {entry.fight.fighter2Name} · {entry.event.name}</div>
                        <div className="flex items-center gap-2 mb-1">
                          <StatusIcon status={entry.prediction.status} />
                          <span className="font-bold text-white text-sm">{entry.prediction.pickedWinner}</span>
                        </div>
                        <div className="text-[#9A9A9A] text-xs">
                          {entry.prediction.pickedFinishType === "finish" ? "Finish" : entry.prediction.pickedFinishType === "decision" ? "Decision" : "Any result"}
                          {entry.prediction.pickedMethod ? ` · ${getMethodLabel(entry.prediction.pickedMethod)}` : ""}
                        </div>
                      </div>
                      <StatusBadge status={entry.prediction.status} points={entry.prediction.totalPoints ?? 0} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resolved picks */}
          {resolved.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-[#9A9A9A] uppercase tracking-wide mb-3">
                Resolved ({resolved.length})
              </h2>
              <div className="space-y-2">
                {resolved.map((entry) => (
                  <div key={entry.prediction.id} className={cn(
                    "bg-[#1A1A1A] border rounded-xl p-4",
                    entry.prediction.status === "correct" ? "border-green-900/50" :
                    entry.prediction.status === "wrong" ? "border-red-900/30" :
                    "border-[#333]"
                  )}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-[#9A9A9A] text-xs mb-1">{entry.fight.fighter1Name} vs {entry.fight.fighter2Name} · {entry.event.name}</div>
                        <div className="flex items-center gap-2 mb-1">
                          <StatusIcon status={entry.prediction.status} />
                          <span className="font-bold text-white text-sm">{entry.prediction.pickedWinner}</span>
                        </div>
                        <div className="text-[#9A9A9A] text-xs">
                          {entry.prediction.pickedFinishType === "finish" ? "Finish" : entry.prediction.pickedFinishType === "decision" ? "Decision" : "Any result"}
                          {entry.prediction.pickedMethod ? ` · ${getMethodLabel(entry.prediction.pickedMethod)}` : ""}
                        </div>
                        {entry.prediction.status === "correct" && (
                          <div className="mt-1.5 text-xs text-[#9A9A9A]">
                            Winner: {entry.prediction.winnerPoints}pts
                            {entry.prediction.finishTypePoints > 0 && ` · Finish: +${entry.prediction.finishTypePoints}pts`}
                            {entry.prediction.methodPoints > 0 && ` · Method: +${entry.prediction.methodPoints}pts`}
                            {entry.prediction.bonusPoints > 0 && ` · Bonus: +${entry.prediction.bonusPoints}pts`}
                          </div>
                        )}
                      </div>
                      <StatusBadge status={entry.prediction.status} points={entry.prediction.totalPoints ?? 0} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
