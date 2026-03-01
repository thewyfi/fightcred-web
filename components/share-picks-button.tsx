"use client";
import { useState, useCallback } from "react";
import { Share2, Download, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

type Fight = {
  id: number;
  fighter1Name: string;
  fighter2Name: string;
  fighter1Record?: string | null;
  fighter2Record?: string | null;
  weightClass?: string | null;
  cardSection: string;
  isMainEvent: boolean;
  isTitleFight: boolean;
  status: string;
  odds1?: number | null;
  odds2?: number | null;
  winner?: string | null;
  method?: string | null;
  finishType?: string | null;
  round?: number | null;
};

type Prediction = {
  pickedWinner: string;
  pickedFinishType?: string | null;
  pickedMethod?: string | null;
  status: string;
};

type FightWithPred = Fight & { userPrediction?: Prediction | null };

interface Props {
  eventName: string;
  eventDate: string;
  eventImageUrl?: string | null;
  fights: Fight[];
  fightsWithPreds?: FightWithPred[] | null;
  username?: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function tw(ctx: CanvasRenderingContext2D, text: string): number {
  return ctx.measureText(text).width;
}

function setFont(ctx: CanvasRenderingContext2D, size: number, bold = false) {
  ctx.font = `${bold ? "700" : "400"} ${size}px Arial, sans-serif`;
}

function drawCentered(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number) {
  ctx.fillText(text, cx - tw(ctx, text) / 2, y);
}

function drawRight(ctx: CanvasRenderingContext2D, text: string, rx: number, y: number) {
  ctx.fillText(text, rx - tw(ctx, text), y);
}

function methodLabel(method?: string | null, finishType?: string | null): string {
  if (!method || finishType === "decision") return "DECISION";
  if (method === "tko_ko")     return "TKO/KO";
  if (method === "submission") return "SUB";
  if (method === "decision")   return "DECISION";
  if (method === "draw")       return "DRAW";
  if (method === "nc")         return "NC";
  return method.toUpperCase();
}

function formatOddsStr(odds: number | null | undefined): string {
  if (odds == null) return "";
  return odds > 0 ? `+${odds}` : `${odds}`;
}

// ─── Badge drawing helper ─────────────────────────────────────────────────────

function drawBadge(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  borderColor: string,
  textColor: string,
  fontSize = 12,
) {
  setFont(ctx, fontSize, true);
  const bw = tw(ctx, text) + 18;
  const bh = 22;
  const bx = cx - bw / 2;
  const by = cy - bh / 2;
  rrect(ctx, bx, by, bw, bh, 5);
  ctx.fillStyle = "#111111"; ctx.fill();
  rrect(ctx, bx, by, bw, bh, 5);
  ctx.strokeStyle = borderColor; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = textColor;
  ctx.textBaseline = "middle";
  drawCentered(ctx, text, cx, cy);
  return bw;
}

// ─── Main generator ───────────────────────────────────────────────────────────

async function generateShareImage(
  eventName: string,
  eventDate: string,
  fights: Fight[],
  fightsWithPreds: FightWithPred[],
  username: string,
): Promise<string> {
  const W       = 1080;
  const PAD     = 28;
  const HDR_H   = 80;   // compact header
  const ROW_H   = 86;   // fight row height
  const ROW_GAP = 5;
  const FOOT_H  = 72;
  const H       = HDR_H + (ROW_H + ROW_GAP) * fights.length + FOOT_H;

  const GOLD  = "#C9A84C";
  const RED   = "#EF4444";
  const GREEN = "#22C55E";
  const WHITE = "#F0F0F0";
  const MUTED = "#666666";
  const DIM   = "#3A3A3A";
  const BG    = "#0A0A0A";
  const ROW_BG = "#111111";
  const ROW_MAIN = "#14100A";

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // ── Background ───────────────────────────────────────────────────────────────
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // Gold top bar
  ctx.fillStyle = GOLD;
  ctx.fillRect(0, 0, W, 4);

  // ── Header ───────────────────────────────────────────────────────────────────
  // Brand
  setFont(ctx, 18, true);
  ctx.fillStyle = GOLD;
  ctx.textBaseline = "middle";
  ctx.fillText("FIGHTCRED", PAD, HDR_H / 2 - 10);

  // Event name — centered, single line
  const shortEvent = eventName
    .replace("UFC Fight Night: ", "UFC FN: ")
    .replace("UFC Fight Night ", "UFC FN: ");
  setFont(ctx, 26, true);
  ctx.fillStyle = WHITE;
  drawCentered(ctx, shortEvent, W / 2, HDR_H / 2 - 10);

  // Date — centered below
  setFont(ctx, 16, false);
  ctx.fillStyle = MUTED;
  try {
    const ds = new Date(eventDate).toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric", year: "numeric",
    });
    drawCentered(ctx, ds, W / 2, HDR_H / 2 + 16);
  } catch {
    drawCentered(ctx, eventDate, W / 2, HDR_H / 2 + 16);
  }

  // Header bottom divider
  ctx.strokeStyle = "#222222";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(PAD, HDR_H - 1); ctx.lineTo(W - PAD, HDR_H - 1); ctx.stroke();

  // ── Fight rows ───────────────────────────────────────────────────────────────
  const allFights = fightsWithPreds.length > 0
    ? fightsWithPreds
    : fights.map(f => ({ ...f, userPrediction: null }));

  let rowY = HDR_H;

  for (const fight of allFights) {
    const pred     = (fight as FightWithPred).userPrediction ?? null;
    const pF1      = pred?.pickedWinner === fight.fighter1Name;
    const pF2      = pred?.pickedWinner === fight.fighter2Name;
    const hp       = !!pred;
    const resolved = fight.status === "completed" && !!fight.winner;
    const f1Won    = resolved && fight.winner === fight.fighter1Name;
    const f2Won    = resolved && fight.winner === fight.fighter2Name;

    // Row background
    rrect(ctx, PAD, rowY + 2, W - PAD * 2, ROW_H - 2, 8);
    ctx.fillStyle = fight.isMainEvent ? ROW_MAIN : ROW_BG;
    ctx.fill();

    // Main event gold border
    if (fight.isMainEvent) {
      rrect(ctx, PAD, rowY + 2, W - PAD * 2, ROW_H - 2, 8);
      ctx.strokeStyle = "rgba(201,168,76,0.25)"; ctx.lineWidth = 1; ctx.stroke();
    }

    const ix  = PAD + 14;
    const iw  = W - PAD * 2 - 28;
    const mid = rowY + ROW_H / 2;
    const cx  = W / 2;

    // ── Fighter name colors ───────────────────────────────────────────────────
    // Winner of resolved fight gets white, loser gets dim
    let f1NameCol: string, f2NameCol: string;
    if (resolved) {
      f1NameCol = f1Won ? WHITE : DIM;
      f2NameCol = f2Won ? WHITE : DIM;
    } else {
      f1NameCol = pF1 ? GOLD : hp ? "#888888" : WHITE;
      f2NameCol = pF2 ? GOLD : hp ? "#888888" : WHITE;
    }

    // ── Fighter 1 ─────────────────────────────────────────────────────────────
    const nameY  = mid - 20;
    const oddsY  = mid + 2;
    const recY   = mid + 20;

    setFont(ctx, 19, true);
    ctx.fillStyle = f1NameCol;
    ctx.textBaseline = "middle";

    let f1d = fight.fighter1Name;
    while (tw(ctx, f1d) > iw * 0.36 && f1d.length > 4) f1d = f1d.slice(0, -1);
    if (f1d !== fight.fighter1Name) f1d += "…";
    ctx.fillText(f1d, ix, nameY);

    // Checkmark / X after name
    const f1dw = tw(ctx, f1d);
    setFont(ctx, 17, true);
    if (pF1) { ctx.fillStyle = GOLD; ctx.fillText(" ✓", ix + f1dw, nameY); }
    else if (hp) { ctx.fillStyle = RED; ctx.fillText(" ✗", ix + f1dw, nameY); }

    // Odds
    const o1 = formatOddsStr(fight.odds1);
    if (o1) {
      setFont(ctx, 13, true);
      ctx.fillStyle = (fight.odds1 ?? 0) < 0 ? "#4ADE80" : "#F87171";
      ctx.fillText(o1, ix, oddsY);
    }

    // Record
    setFont(ctx, 12, false);
    ctx.fillStyle = "#404040";
    ctx.fillText(fight.fighter1Record ?? "", ix, recY);

    // ── Fighter 2 ─────────────────────────────────────────────────────────────
    setFont(ctx, 19, true);
    ctx.fillStyle = f2NameCol;

    let f2d = fight.fighter2Name;
    while (tw(ctx, f2d) > iw * 0.36 && f2d.length > 4) f2d = f2d.slice(0, -1);
    if (f2d !== fight.fighter2Name) f2d += "…";
    const f2dw = tw(ctx, f2d);
    ctx.fillText(f2d, ix + iw - f2dw, nameY);

    // Checkmark / X before name
    setFont(ctx, 17, true);
    if (pF2) { ctx.fillStyle = GOLD; ctx.fillText("✓ ", ix + iw - f2dw - tw(ctx, "✓ "), nameY); }
    else if (hp) { ctx.fillStyle = RED; ctx.fillText("✗ ", ix + iw - f2dw - tw(ctx, "✗ "), nameY); }

    // Odds
    const o2 = formatOddsStr(fight.odds2);
    if (o2) {
      setFont(ctx, 13, true);
      ctx.fillStyle = (fight.odds2 ?? 0) < 0 ? "#4ADE80" : "#F87171";
      drawRight(ctx, o2, ix + iw, oddsY);
    }

    // Record
    setFont(ctx, 12, false);
    ctx.fillStyle = "#404040";
    drawRight(ctx, fight.fighter2Record ?? "", ix + iw, recY);

    // ── Center badges ─────────────────────────────────────────────────────────
    if (hp && pred) {
      const predMethod = methodLabel(pred.pickedMethod, pred.pickedFinishType);
      const badgeCol   = pred.status === "correct" ? GREEN
                       : pred.status === "wrong"   ? RED
                       : GOLD;

      if (resolved && fight.method) {
        // Two badges side by side: PRED | RESULT
        const actualMethod = methodLabel(fight.method, fight.finishType);

        // Micro labels
        setFont(ctx, 10, false);
        ctx.fillStyle = "#555555";
        ctx.textBaseline = "middle";
        drawCentered(ctx, "PRED", cx - 44, mid - 18);
        drawCentered(ctx, "RESULT", cx + 44, mid - 18);

        // Predicted badge
        drawBadge(ctx, predMethod, cx - 44, mid, badgeCol, badgeCol, 11);

        // Actual result badge
        drawBadge(ctx, actualMethod, cx + 44, mid, "#444444", "#AAAAAA", 11);

        // Winner name micro label
        if (fight.winner) {
          const winnerShort = fight.winner.split(" ").pop()!.toUpperCase();
          setFont(ctx, 10, false);
          ctx.fillStyle = "#4ADE80";
          ctx.textBaseline = "middle";
          drawCentered(ctx, `W: ${winnerShort}`, cx, mid + 18);
        }

      } else {
        // Single method badge (pending fight)
        const isDecision = pred.pickedFinishType === "decision" || !pred.pickedMethod;
        drawBadge(ctx, predMethod, cx, mid - 8, badgeCol, badgeCol, 12);

        if (!isDecision) {
          // INSIDE DIST sub-badge
          setFont(ctx, 10, false);
          ctx.fillStyle = "#555555";
          ctx.textBaseline = "middle";
          drawCentered(ctx, "INSIDE DIST", cx, mid + 12);
        }
      }
    } else {
      // No pick — just VS
      setFont(ctx, 12, false);
      ctx.fillStyle = "#2A2A2A";
      ctx.textBaseline = "middle";
      drawCentered(ctx, "VS", cx, mid - 4);
      setFont(ctx, 11, false);
      ctx.fillStyle = "#222222";
      drawCentered(ctx, "no pick", cx, mid + 10);
    }

    // Row bottom divider
    ctx.strokeStyle = "#1A1A1A";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD + 14, rowY + ROW_H - 1);
    ctx.lineTo(W - PAD - 14, rowY + ROW_H - 1);
    ctx.stroke();

    rowY += ROW_H + ROW_GAP;
  }

  // ── Footer ───────────────────────────────────────────────────────────────────
  const fy = rowY + 10;

  // Gold bottom bar
  ctx.fillStyle = GOLD;
  ctx.fillRect(0, H - 4, W, 4);

  const picksCount = allFights.filter(f => (f as FightWithPred).userPrediction).length;

  setFont(ctx, 20, true);
  ctx.fillStyle = GOLD;
  ctx.textBaseline = "middle";
  ctx.fillText(`@${username}`, PAD, fy + 20);

  setFont(ctx, 15, false);
  ctx.fillStyle = MUTED;
  drawCentered(ctx, `${picksCount}/${allFights.length} picks made`, W / 2, fy + 20);

  setFont(ctx, 15, false);
  ctx.fillStyle = DIM;
  drawRight(ctx, "fightcred.app", W - PAD, fy + 20);

  return canvas.toDataURL("image/png");
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SharePicksButton({
  eventName,
  eventDate,
  fights,
  fightsWithPreds,
  username: usernameProp,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const { data: profile } = trpc.profile.get.useQuery(undefined, {
    enabled: !usernameProp,
  });
  const username = usernameProp ?? profile?.username ?? "FightCred";

  const generate = useCallback(async () => {
    setLoading(true);
    try {
      const preds = fightsWithPreds ?? [];
      const url = await generateShareImage(eventName, eventDate, fights, preds, username);
      setImageUrl(url);
    } catch (err) {
      console.error("Share card generation failed:", err);
    } finally {
      setLoading(false);
    }
  }, [eventName, eventDate, fights, fightsWithPreds, username]);

  const download = useCallback(() => {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `fightcred_${eventName.replace(/\s+/g, "_").toLowerCase()}_picks.png`;
    a.click();
  }, [imageUrl, eventName]);

  const share = useCallback(async () => {
    if (!imageUrl) return;
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const file = new File([blob], "fightcred_picks.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "My FightCred Picks" });
        return;
      }
    } catch { /* fall through */ }
    download();
  }, [imageUrl, download]);

  if (imageUrl) {
    return (
      <div className="flex flex-col items-center gap-3 w-full max-w-sm">
        <img src={imageUrl} alt="Your picks" className="w-full rounded-xl border border-white/10 shadow-xl" />
        <div className="flex gap-2 w-full">
          <button
            onClick={share}
            className="flex-1 flex items-center justify-center gap-2 bg-[#C9A84C] hover:bg-[#b8963e] text-black font-bold py-2.5 px-4 rounded-lg text-sm transition-colors"
          >
            <Share2 size={16} /> Share
          </button>
          <button
            onClick={download}
            className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold py-2.5 px-4 rounded-lg text-sm transition-colors"
          >
            <Download size={16} /> Save
          </button>
          <button
            onClick={() => setImageUrl(null)}
            className="flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/60 py-2.5 px-3 rounded-lg text-sm transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={generate}
      disabled={loading}
      className={cn(
        "flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all",
        "bg-[#C9A84C]/10 border border-[#C9A84C]/40 text-[#C9A84C]",
        "hover:bg-[#C9A84C]/20 hover:border-[#C9A84C]/70",
        loading && "opacity-60 cursor-not-allowed",
      )}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />}
      {loading ? "Generating…" : "Share My Picks"}
    </button>
  );
}
