"use client"

export const dynamic = "force-dynamic";;

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useSearchParams } from "next/navigation";
import { Loader2, Shield, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Suspense } from "react";

function AdminContent() {
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") ?? "";

  const { data: events } = trpc.events.list.useQuery(undefined, { enabled: !!token });
  const { data: fights } = trpc.admin.fights.useQuery({ token }, { enabled: !!token });

  const [selectedFight, setSelectedFight] = useState<number | null>(null);
  const [winner, setWinner] = useState("");
  const [finishType, setFinishType] = useState<"finish" | "decision">("decision");
  const [method, setMethod] = useState<"tko_ko" | "submission" | "decision" | "draw" | "nc">("decision");
  const [round, setRound] = useState<number>(3);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const resolveMutation = trpc.admin.resolveFight.useMutation({
    onSuccess: () => {
      setMessage({ type: "success", text: "Fight resolved and credibility scores updated!" });
      setSelectedFight(null);
      setWinner("");
    },
    onError: (err: { message: string }) => {
      setMessage({ type: "error", text: err.message });
    },
  });

  const seedMutation = trpc.admin.triggerPoll.useMutation({
    onSuccess: () => setMessage({ type: "success", text: "Events seeded successfully!" }),
    onError: (err: { message: string }) => setMessage({ type: "error", text: err.message }),
  });

  const lockMutation = trpc.admin.lockFight.useMutation({
    onSuccess: () => setMessage({ type: "success", text: "Predictions locked!" }),
    onError: (err: { message: string }) => setMessage({ type: "error", text: err.message }),
  });

  if (!token) {
    return (
      <div className="text-center py-24 text-[#9A9A9A]">
        <Shield size={40} className="mx-auto mb-3 opacity-30" />
        <p>Access denied. Provide <code className="text-[#D20A0A]">?token=YOUR_ADMIN_TOKEN</code> in the URL.</p>
      </div>
    );
  }

  type AdminFight = { fight: { id: number; fighter1Name: string; fighter2Name: string; weightClass: string | null; status: string }; event: { name: string }; predictionCount: number };
  const adminFights = fights as AdminFight[] | undefined;
  const pendingFights = adminFights?.filter(f => f.fight.status === "upcoming" || f.fight.status === "live") ?? [];
  const selectedFightData = adminFights?.find(f => f.fight.id === selectedFight)?.fight;

  return (
    <div className="space-y-6">
      <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <Shield size={24} className="text-[#D20A0A]" />
          <h1 className="text-2xl font-black text-white">Admin Panel</h1>
        </div>
        <p className="text-[#9A9A9A] text-sm">Manage events, resolve fights, and update credibility scores.</p>
      </div>

      {/* Message */}
      {message && (
        <div className={cn(
          "flex items-center gap-2 p-4 rounded-xl border text-sm font-medium",
          message.type === "success"
            ? "bg-green-900/20 border-green-900/50 text-green-400"
            : "bg-red-900/20 border-red-900/50 text-red-400"
        )}>
          {message.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-auto text-xs opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => seedMutation.mutate({ token })}
          disabled={seedMutation.isPending}
          className="py-3 px-4 bg-[#1A1A1A] border border-[#333] hover:border-[#555] rounded-xl text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2"
        >
          {seedMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : "🌱"}
          Seed Events
        </button>
        <button
          onClick={() => {
            if (!selectedFight) { setMessage({ type: 'error', text: 'Select a fight first' }); return; }
            lockMutation.mutate({ token, fightId: selectedFight });
          }}
          disabled={lockMutation.isPending}
          className="py-3 px-4 bg-[#1A1A1A] border border-[#333] hover:border-[#555] rounded-xl text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2"
        >
          {lockMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : "🔒"}
          Lock Selected Fight
        </button>
      </div>

      {/* Resolve fight */}
      <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#333]">
          <h2 className="font-bold text-white">Resolve Fight Result</h2>
          <p className="text-[#9A9A9A] text-xs mt-0.5">Select a fight and enter the result to update credibility scores.</p>
        </div>
        <div className="p-5 space-y-4">
          {/* Fight selector */}
          <div>
            <label className="text-xs font-semibold text-[#9A9A9A] uppercase tracking-wide block mb-2">
              Select Fight
            </label>
            <select
              value={selectedFight ?? ""}
              onChange={(e) => {
                const id = parseInt(e.target.value);
                setSelectedFight(id || null);
                const fight = adminFights?.find(f => f.fight.id === id)?.fight;
                if (fight) setWinner(fight.fighter1Name);
              }}
              className="w-full bg-[#252525] border border-[#333] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D20A0A]"
            >
              <option value="">-- Select a fight --</option>
              {pendingFights.map(f => (
                <option key={f.fight.id} value={f.fight.id}>
                  {f.fight.fighter1Name} vs {f.fight.fighter2Name} {f.fight.weightClass ? `(${f.fight.weightClass})` : ""} — {f.event.name}
                </option>
              ))}
            </select>
          </div>

          {selectedFightData && (
            <>
              {/* Winner */}
              <div>
                <label className="text-xs font-semibold text-[#9A9A9A] uppercase tracking-wide block mb-2">Winner</label>
                <div className="grid grid-cols-2 gap-2">
                  {[selectedFightData.fighter1Name, selectedFightData.fighter2Name].map((name) => (
                    <button
                      key={name}
                      onClick={() => setWinner(name)}
                      className={cn(
                        "py-2.5 px-3 rounded-xl border text-sm font-medium transition-all",
                        winner === name
                          ? "border-[#D20A0A] bg-[#D20A0A]/15 text-white"
                          : "border-[#333] bg-[#252525] text-[#9A9A9A] hover:border-[#555]"
                      )}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Method */}
              <div>
                <label className="text-xs font-semibold text-[#9A9A9A] uppercase tracking-wide block mb-2">Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["tko_ko", "submission", "decision"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        setMethod(m);
                        setFinishType(m === "decision" ? "decision" : "finish");
                      }}
                      className={cn(
                        "py-2 rounded-xl border text-xs font-semibold transition-all",
                        method === m
                          ? "border-[#C9A84C] bg-[#C9A84C]/15 text-[#C9A84C]"
                          : "border-[#333] bg-[#252525] text-[#9A9A9A] hover:border-[#555]"
                      )}
                    >
                      {m === "tko_ko" ? "TKO/KO" : m === "submission" ? "SUB" : "DEC"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Round */}
              {method !== "decision" && (
                <div>
                  <label className="text-xs font-semibold text-[#9A9A9A] uppercase tracking-wide block mb-2">Round</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((r) => (
                      <button
                        key={r}
                        onClick={() => setRound(r)}
                        className={cn(
                          "w-10 h-10 rounded-xl border text-sm font-bold transition-all",
                          round === r
                            ? "border-[#D20A0A] bg-[#D20A0A]/15 text-white"
                            : "border-[#333] bg-[#252525] text-[#9A9A9A] hover:border-[#555]"
                        )}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  if (!winner || !selectedFight) return;
                  resolveMutation.mutate({
                    token,
                    fightId: selectedFight,
                    winner,
                    finishType,
                    method,
                    round: method !== "decision" ? round : undefined,
                  });
                }}
                disabled={!winner || resolveMutation.isPending}
                className={cn(
                  "w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors",
                  winner
                    ? "bg-[#D20A0A] hover:bg-[#b00808] text-white"
                    : "bg-[#333] text-[#555] cursor-not-allowed"
                )}
              >
                {resolveMutation.isPending ? (
                  <><Loader2 size={16} className="animate-spin" /> Resolving...</>
                ) : (
                  "Resolve & Update Scores"
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Events list */}
      {events && events.length > 0 && (
        <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#333]">
            <h2 className="font-bold text-white">All Events ({events.length})</h2>
          </div>
          <div className="divide-y divide-[#252525]">
            {(events as Array<{ id: number; name: string; eventDate: string | Date; status: string }>).map((event) => (
              <div key={event.id} className="flex items-center gap-4 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white text-sm truncate">{event.name}</div>
                  <div className="text-[#9A9A9A] text-xs">{new Date(event.eventDate).toLocaleDateString()}</div>
                </div>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-semibold",
                  event.status === "live" ? "bg-red-900/30 text-red-400" :
                  event.status === "completed" ? "bg-[#333] text-[#9A9A9A]" :
                  "bg-[#252525] text-[#9A9A9A]"
                )}>
                  {event.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-24 text-[#9A9A9A]"><Loader2 size={24} className="animate-spin" /></div>}>
      <AdminContent />
    </Suspense>
  );
}
