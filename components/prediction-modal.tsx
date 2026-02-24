"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatOdds, cn } from "@/lib/utils";
import { X, Loader2, CheckCircle } from "lucide-react";

type Fight = {
  id: number;
  fighter1Name: string;
  fighter2Name: string;
  fighter1Record?: string | null;
  fighter2Record?: string | null;
  odds1?: number | null;
  odds2?: number | null;
  weightClass?: string | null;
  isTitleFight: boolean;
};

type Props = {
  fight: Fight;
  onClose: () => void;
};

export function PredictionModal({ fight, onClose }: Props) {
  const { data: user } = trpc.auth.me.useQuery();
  const [pickedWinner, setPickedWinner] = useState<string | null>(null);
  const [pickedFinishType, setPickedFinishType] = useState<"finish" | "decision" | null>(null);
  const [pickedMethod, setPickedMethod] = useState<"tko_ko" | "submission" | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const utils = trpc.useUtils();
  const submitMutation = trpc.predictions.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      utils.fights.byEventWithPredictions.invalidate();
      setTimeout(() => {
        onClose();
      }, 1500);
    },
  });

  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl p-6 max-w-sm w-full text-center">
          <h3 className="text-white font-bold text-lg mb-2">Sign In Required</h3>
          <p className="text-[#9A9A9A] text-sm mb-4">You need to sign in to make predictions.</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[#333] text-[#9A9A9A] text-sm font-medium hover:border-[#555] transition-colors">
              Cancel
            </button>
            <a href="/login" className="flex-1 py-2.5 rounded-xl bg-[#D20A0A] text-white text-sm font-bold text-center hover:bg-[#b00808] transition-colors">
              Sign In
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl p-8 max-w-sm w-full text-center">
          <CheckCircle size={48} className="text-green-400 mx-auto mb-3" />
          <h3 className="text-white font-bold text-xl mb-1">Pick Submitted!</h3>
          <p className="text-[#9A9A9A] text-sm">Your prediction has been recorded.</p>
        </div>
      </div>
    );
  }

  const canSubmit = pickedWinner !== null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#333]">
          <div>
            <h3 className="text-white font-bold text-lg">Make Your Pick</h3>
            {fight.weightClass && (
              <p className="text-[#9A9A9A] text-xs mt-0.5">{fight.weightClass}{fight.isTitleFight ? " · Title Fight" : ""}</p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#9A9A9A] hover:text-white hover:bg-[#252525] transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Pick winner */}
          <div>
            <p className="text-[#9A9A9A] text-xs font-semibold uppercase tracking-wide mb-3">Who wins?</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: fight.fighter1Name, record: fight.fighter1Record, odds: fight.odds1 },
                { name: fight.fighter2Name, record: fight.fighter2Record, odds: fight.odds2 },
              ].map(({ name, record, odds }) => (
                <button
                  key={name}
                  onClick={() => setPickedWinner(name)}
                  className={cn(
                    "p-4 rounded-xl border text-left transition-all",
                    pickedWinner === name
                      ? "border-[#D20A0A] bg-[#D20A0A]/15 ring-1 ring-[#D20A0A]/30"
                      : "border-[#333] bg-[#252525] hover:border-[#555]"
                  )}
                >
                  <div className="font-bold text-white text-sm leading-tight">{name}</div>
                  {record && <div className="text-[#9A9A9A] text-xs mt-0.5">{record}</div>}
                  {odds != null && (
                    <div className={cn(
                      "mt-2 text-xs font-bold",
                      odds < 0 ? "text-green-400" : "text-red-400"
                    )}>
                      {formatOdds(odds)}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Finish type (optional) */}
          <div>
            <p className="text-[#9A9A9A] text-xs font-semibold uppercase tracking-wide mb-3">
              How does it end? <span className="text-[#555] font-normal normal-case">(optional, earns bonus points)</span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(["finish", "decision"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setPickedFinishType(pickedFinishType === type ? null : type)}
                  className={cn(
                    "py-2.5 rounded-xl border text-sm font-semibold transition-all",
                    pickedFinishType === type
                      ? "border-[#C9A84C] bg-[#C9A84C]/15 text-[#C9A84C]"
                      : "border-[#333] bg-[#252525] text-[#9A9A9A] hover:border-[#555]"
                  )}
                >
                  {type === "finish" ? "Finish (TKO/Sub)" : "Decision"}
                </button>
              ))}
            </div>
          </div>

          {/* Method (only if finish selected) */}
          {pickedFinishType === "finish" && (
            <div>
              <p className="text-[#9A9A9A] text-xs font-semibold uppercase tracking-wide mb-3">
                Finish method? <span className="text-[#555] font-normal normal-case">(optional)</span>
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(["tko_ko", "submission"] as const).map((method) => (
                  <button
                    key={method}
                    onClick={() => setPickedMethod(pickedMethod === method ? null : method)}
                    className={cn(
                      "py-2.5 rounded-xl border text-sm font-semibold transition-all",
                      pickedMethod === method
                        ? "border-[#C9A84C] bg-[#C9A84C]/15 text-[#C9A84C]"
                        : "border-[#333] bg-[#252525] text-[#9A9A9A] hover:border-[#555]"
                    )}
                  >
                    {method === "tko_ko" ? "TKO / KO" : "Submission"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Odds info */}
          {pickedWinner && (
            <div className="bg-[#252525] rounded-xl p-3 text-xs text-[#9A9A9A]">
              <span className="text-white font-medium">Picking {pickedWinner}</span>
              {pickedWinner === fight.fighter1Name && fight.odds1 != null && fight.odds1 > 0 && (
                <span className="text-[#C9A84C] ml-1">· Underdog pick earns bonus points!</span>
              )}
              {pickedWinner === fight.fighter2Name && fight.odds2 != null && fight.odds2 > 0 && (
                <span className="text-[#C9A84C] ml-1">· Underdog pick earns bonus points!</span>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 pt-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-[#333] text-[#9A9A9A] text-sm font-semibold hover:border-[#555] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (!pickedWinner) return;
              submitMutation.mutate({
                fightId: fight.id,
                pickedWinner,
                pickedFinishType: pickedFinishType ?? undefined,
                pickedMethod: pickedMethod ?? undefined,
              });
            }}
            disabled={!canSubmit || submitMutation.isPending}
            className={cn(
              "flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors",
              canSubmit
                ? "bg-[#D20A0A] hover:bg-[#b00808] text-white"
                : "bg-[#333] text-[#555] cursor-not-allowed"
            )}
          >
            {submitMutation.isPending ? (
              <><Loader2 size={16} className="animate-spin" /> Submitting...</>
            ) : (
              "Lock In Pick"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
