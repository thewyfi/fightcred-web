"use client";
import { useState, useCallback } from "react";
import { Share2, Download, Loader2, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Fight = {
  id: number;
  fighter1Name: string;
  fighter2Name: string;
  fighter1Record?: string | null;
  fighter2Record?: string | null;
  cardSection: string;
  isMainEvent: boolean;
  isTitleFight: boolean;
  weightClass?: string | null;
  status: string;
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

function rrect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
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
  ctx.font = `${bold ? "900" : "400"} ${size}px 'Arial Black', Arial, sans-serif`;
}

function drawCentered(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number) {
  ctx.fillText(text, cx - tw(ctx, text) / 2, y);
}

function drawRight(ctx: CanvasRenderingContext2D, text: string, rx: number, y: number) {
  ctx.fillText(text, rx - tw(ctx, text), y);
}

function methodShort(method?: string | null): string {
  if (method === "tko_ko")      return "TKO/KO";
  if (method === "submission")  return "SUB";
  if (method === "decision")    return "DEC";
  return method?.toUpperCase() ?? "DEC";
}

function methodDetail(method?: string | null, finishType?: string | null): string {
  if (finishType === "decision" || method == null) return "DECISION";
  if (method === "tko_ko")     return "TKO / KO";
  if (method === "submission") return "SUBMISSION";
  return "FINISH";
}

function lastName(name: string): string {
  return name.trim().split(" ").pop()!.toUpperCase();
}

function firstName(name: string): string {
  return name.trim().split(" ").slice(0, -1).join(" ").toUpperCase();
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
  const PAD     = 36;
  const HERO_H  = 420;
  const ROW_H   = 76;
  const ROW_GAP = 7;
  const SEC_H   = 52;
  const FOOT_H  = 90;
  const H       = HERO_H + SEC_H + (ROW_H + ROW_GAP) * fights.length + FOOT_H + 16;

  const GOLD     = "#C9A84C";
  const GOLD_DIM = "#786428";
  const RED      = "#D20A0A";
  const WHITE    = "#FFFFFF";
  const GREY     = "#464646";
  const MUTED    = "#6E6E6E";
  const DARK_ROW = "#0F0F0F";
  const MAIN_ROW = "#16120A";

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // ── Full background ──────────────────────────────────────────────────────────
  ctx.fillStyle = "#080808";
  ctx.fillRect(0, 0, W, H);

  // Diagonal texture
  ctx.strokeStyle = "rgba(255,255,255,0.018)";
  ctx.lineWidth = 1;
  for (let i = -H; i < W + H; i += 50) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + H, H); ctx.stroke();
  }

  // ── HERO gradient background ─────────────────────────────────────────────────
  const heroBg = ctx.createLinearGradient(0, 0, W, HERO_H);
  heroBg.addColorStop(0, "#160000");
  heroBg.addColorStop(0.5, "#0A0A0A");
  heroBg.addColorStop(1, "#001000");
  ctx.fillStyle = heroBg;
  ctx.fillRect(0, 0, W, HERO_H);

  // Red top bar
  ctx.fillStyle = RED;
  ctx.fillRect(0, 0, W, 8);

  // Gold side bars
  ctx.fillStyle = GOLD;
  ctx.fillRect(0, 8, 4, HERO_H);
  ctx.fillRect(W - 4, 8, 4, HERO_H);

  // ── Brand + Event header ──────────────────────────────────────────────────────
  setFont(ctx, 26, true);
  ctx.fillStyle = GOLD;
  ctx.textBaseline = "top";
  ctx.fillText("FIGHTCRED", PAD + 8, 20);

  // Event name (shortened)
  const shortEvent = eventName
    .replace("UFC Fight Night: ", "UFC FN: ")
    .replace(/^UFC /, "UFC ");
  setFont(ctx, 32, true);
  ctx.fillStyle = WHITE;
  drawCentered(ctx, shortEvent, W / 2, 18);

  setFont(ctx, 20, false);
  ctx.fillStyle = MUTED;
  try {
    const ds = new Date(eventDate).toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric",
    });
    drawCentered(ctx, ds, W / 2, 58);
  } catch { drawCentered(ctx, eventDate, W / 2, 58); }

  // ── Center divider ───────────────────────────────────────────────────────────
  ctx.strokeStyle = "rgba(120,0,0,0.7)";
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(W / 2, 90); ctx.lineTo(W / 2, HERO_H - 90); ctx.stroke();

  // ── VS badge ─────────────────────────────────────────────────────────────────
  const vsSz = 70;
  const vx = W / 2 - vsSz / 2;
  const vy = HERO_H / 2 - vsSz / 2 - 10;
  rrect(ctx, vx, vy, vsSz, vsSz, 10);
  ctx.fillStyle = RED; ctx.fill();
  setFont(ctx, 34, true);
  ctx.fillStyle = WHITE;
  ctx.textBaseline = "middle";
  drawCentered(ctx, "VS", W / 2, vy + vsSz / 2);
  ctx.textBaseline = "top";

  // ── Main event fighters ───────────────────────────────────────────────────────
  // Use fightsWithPreds as source of truth for hero section too
  const allFightsForHero = fightsWithPreds.length > 0 ? fightsWithPreds : fights.map(f => ({ ...f, userPrediction: null }));
  const mainFightWithPred = allFightsForHero.find(f => f.isMainEvent) ?? allFightsForHero[0];
  const mainFight = mainFightWithPred;
  const mainPred  = (mainFightWithPred as FightWithPred)?.userPrediction ?? null;

  const f1n = mainFight?.fighter1Name ?? "";
  const f2n = mainFight?.fighter2Name ?? "";
  const f1Picked = mainPred?.pickedWinner === f1n;
  const f2Picked = mainPred?.pickedWinner === f2n;
  const hasPick  = !!mainPred;

  const f1Col = f1Picked ? GOLD : hasPick ? GREY : WHITE;
  const f2Col = f2Picked ? GOLD : hasPick ? GREY : WHITE;

  const nameY = HERO_H - 130;

  // Last names — large
  setFont(ctx, 90, true);
  ctx.fillStyle = f1Col;
  ctx.textBaseline = "top";
  ctx.fillText(lastName(f1n), PAD + 8, nameY);

  ctx.fillStyle = f2Col;
  drawRight(ctx, lastName(f2n), W - PAD - 8, nameY);

  // First names
  setFont(ctx, 24, true);
  ctx.fillStyle = f1Picked ? GOLD : MUTED;
  ctx.fillText(firstName(f1n), PAD + 8, nameY + 98);
  ctx.fillStyle = f2Picked ? GOLD : MUTED;
  drawRight(ctx, firstName(f2n), W - PAD - 8, nameY + 98);

  // Records
  setFont(ctx, 20, false);
  ctx.fillStyle = GREY;
  ctx.fillText(mainFight?.fighter1Record ?? "", PAD + 8, nameY + 128);
  drawRight(ctx, mainFight?.fighter2Record ?? "", W - PAD - 8, nameY + 128);

  // Pick label + detail
  const pickY = nameY + 158;
  if (f1Picked && mainPred) {
    const detail = methodDetail(mainPred.pickedMethod, mainPred.pickedFinishType);
    setFont(ctx, 16, true);
    ctx.fillStyle = GOLD;
    ctx.fillText("▶ MY PICK", PAD + 8, pickY);
    setFont(ctx, 18, false);
    ctx.fillStyle = GOLD_DIM;
    ctx.fillText(detail, PAD + 8, pickY + 22);
  } else if (f2Picked && mainPred) {
    const detail = methodDetail(mainPred.pickedMethod, mainPred.pickedFinishType);
    setFont(ctx, 16, true);
    ctx.fillStyle = GOLD;
    drawRight(ctx, "MY PICK ◀", W - PAD - 8, pickY);
    setFont(ctx, 18, false);
    ctx.fillStyle = GOLD_DIM;
    drawRight(ctx, detail, W - PAD - 8, pickY + 22);
  }

  // Main event / weight class
  setFont(ctx, 16, true);
  ctx.fillStyle = RED;
  const meLabel = mainFight?.isTitleFight ? "◆ TITLE FIGHT ◆" : "◆ MAIN EVENT ◆";
  drawCentered(ctx, meLabel, W / 2, HERO_H - 52);

  setFont(ctx, 18, false);
  ctx.fillStyle = GREY;
  drawCentered(ctx, (mainFight?.weightClass ?? "").toUpperCase(), W / 2, HERO_H - 28);

  // Red X on loser side
  if (hasPick) {
    const xSide = f1Picked ? "right" : "left";
    ctx.strokeStyle = "rgba(180,0,0,0.35)";
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    const x0 = xSide === "right" ? W / 2 + 20 : 20;
    const x1 = xSide === "right" ? W - 20 : W / 2 - 20;
    ctx.beginPath(); ctx.moveTo(x0, 90); ctx.lineTo(x1, HERO_H - 80); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x1, 90); ctx.lineTo(x0, HERO_H - 80); ctx.stroke();
  }

  // Hero bottom fade
  const heroFade = ctx.createLinearGradient(0, HERO_H - 80, 0, HERO_H);
  heroFade.addColorStop(0, "rgba(8,8,8,0)");
  heroFade.addColorStop(1, "rgba(8,8,8,1)");
  ctx.fillStyle = heroFade;
  ctx.fillRect(0, HERO_H - 80, W, 80);

  // ── Section header ───────────────────────────────────────────────────────────
  const secY = HERO_H + 12;
  setFont(ctx, 18, true);
  ctx.fillStyle = MUTED;
  ctx.textBaseline = "top";
  ctx.fillText("FULL CARD PICKS", PAD, secY);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(PAD, secY + 26); ctx.lineTo(W - PAD, secY + 26); ctx.stroke();

  // ── Fight rows ───────────────────────────────────────────────────────────────
  let rowY = HERO_H + SEC_H;

  // Use fightsWithPreds as single source of truth — it contains all fight data + predictions
  const allFights = fightsWithPreds.length > 0 ? fightsWithPreds : fights.map(f => ({ ...f, userPrediction: null }));
  for (const fight of allFights) {
    const pred = (fight as FightWithPred).userPrediction ?? null;
    const pF1  = pred?.pickedWinner === fight.fighter1Name;
    const pF2  = pred?.pickedWinner === fight.fighter2Name;
    const hp   = !!pred;

    // Row bg
    rrect(ctx, PAD, rowY, W - PAD * 2, ROW_H, 12);
    ctx.fillStyle = fight.isMainEvent ? MAIN_ROW : DARK_ROW;
    ctx.fill();
    if (fight.isMainEvent) {
      rrect(ctx, PAD, rowY, W - PAD * 2, ROW_H, 12);
      ctx.strokeStyle = "rgba(80,65,20,0.6)"; ctx.lineWidth = 1; ctx.stroke();
    }

    const ix  = PAD + 16;
    const iw  = W - PAD * 2 - 32;
    const mid = rowY + ROW_H / 2;

    // Fighter 1
    const f1c = pF1 ? GOLD : hp ? GREY : "#D2D2D2";
    setFont(ctx, 22, true);
    ctx.fillStyle = f1c;
    ctx.textBaseline = "middle";

    let f1d = fight.fighter1Name;
    while (tw(ctx, f1d) > iw * 0.40 && f1d.length > 4) f1d = f1d.slice(0, -1);
    if (f1d !== fight.fighter1Name) f1d += "…";
    ctx.fillText(f1d, ix, mid - 10);

    setFont(ctx, 14, false);
    ctx.fillStyle = "#373737";
    ctx.fillText(fight.fighter1Record ?? "", ix, mid + 12);

    // F1 marker
    setFont(ctx, 22, true);
    const f1dw = tw(ctx, f1d);
    if (pF1) { ctx.fillStyle = GOLD; ctx.fillText("✓", ix + f1dw + 6, mid - 10); }
    else if (hp) { ctx.fillStyle = RED; ctx.fillText("✗", ix + f1dw + 6, mid - 10); }

    // Fighter 2
    const f2c = pF2 ? GOLD : hp ? GREY : "#D2D2D2";
    setFont(ctx, 22, true);
    ctx.fillStyle = f2c;

    let f2d = fight.fighter2Name;
    while (tw(ctx, f2d) > iw * 0.40 && f2d.length > 4) f2d = f2d.slice(0, -1);
    if (f2d !== fight.fighter2Name) f2d += "…";
    const f2dw = tw(ctx, f2d);
    ctx.fillText(f2d, ix + iw - f2dw, mid - 10);

    setFont(ctx, 14, false);
    ctx.fillStyle = "#373737";
    const recW = tw(ctx, fight.fighter2Record ?? "");
    ctx.fillText(fight.fighter2Record ?? "", ix + iw - recW, mid + 12);

    // F2 marker
    setFont(ctx, 22, true);
    if (pF2) { ctx.fillStyle = GOLD; ctx.fillText("✓", ix + iw - f2dw - tw(ctx, "✓") - 6, mid - 10); }
    else if (hp) { ctx.fillStyle = RED; ctx.fillText("✗", ix + iw - f2dw - tw(ctx, "✗") - 6, mid - 10); }

    // Center: method badge + round badge
    const cx = W / 2;
    if (hp && pred) {
      // Build label: method + finish type
      const isDecision = pred.pickedFinishType === "decision" || !pred.pickedMethod;
      const mShort = isDecision ? "DECISION" : methodShort(pred.pickedMethod);
      const finishLabel = isDecision ? "" : pred.pickedFinishType === "finish" ? "FINISH" : "";
      const badgeCol = pred.status === "correct" ? "#22C55E"
                     : pred.status === "wrong"   ? "#EF4444"
                     : GOLD;

      // Method badge (top)
      setFont(ctx, 13, true);
      const bw = tw(ctx, mShort) + 20;
      const bh = 24;
      const bx = cx - bw / 2;
      const by = mid - 22;
      rrect(ctx, bx, by, bw, bh, 6);
      ctx.fillStyle = "#141414"; ctx.fill();
      rrect(ctx, bx, by, bw, bh, 6);
      ctx.strokeStyle = badgeCol; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = badgeCol;
      ctx.textBaseline = "middle";
      drawCentered(ctx, mShort, cx, by + bh / 2);

      // Finish type badge (bottom, only for non-decision)
      if (!isDecision) {
        const ftText = "INSIDE DIST";
        setFont(ctx, 12, false);
        const rw = tw(ctx, ftText) + 16;
        const rh = 20;
        const rx = cx - rw / 2;
        const ry = mid + 4;
        rrect(ctx, rx, ry, rw, rh, 5);
        ctx.fillStyle = "#141414"; ctx.fill();
        rrect(ctx, rx, ry, rw, rh, 5);
        ctx.strokeStyle = "#3C3C3C"; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = "#787878";
        drawCentered(ctx, ftText, cx, ry + rh / 2);
      } else {
        setFont(ctx, 13, false);
        ctx.fillStyle = "#2D2D2D";
        ctx.textBaseline = "middle";
        drawCentered(ctx, "VS", cx, mid);
      }
    } else {
      setFont(ctx, 13, false);
      ctx.fillStyle = "#2D2D2D";
      ctx.textBaseline = "middle";
      drawCentered(ctx, "VS", cx, mid - 6);
      setFont(ctx, 12, false);
      ctx.fillStyle = "#262626";
      drawCentered(ctx, "— no pick —", cx, mid + 8);
    }

    ctx.textBaseline = "alphabetic";
    rowY += ROW_H + ROW_GAP;
  }

  // ── Footer ───────────────────────────────────────────────────────────────────
  const fy = rowY + 14;
  ctx.strokeStyle = "#1C1C1C"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(PAD, fy); ctx.lineTo(W - PAD, fy); ctx.stroke();

  setFont(ctx, 28, true);
  ctx.fillStyle = GOLD;
  ctx.textBaseline = "top";
  ctx.fillText(`@${username}`, PAD, fy + 18);

  const pickCount = fightsWithPreds.filter(f => f.userPrediction).length;
  const pcText = `${pickCount}/${fights.length} picks made`;
  setFont(ctx, 18, false);
  ctx.fillStyle = MUTED;
  drawCentered(ctx, pcText, W / 2, fy + 24);

  ctx.fillStyle = "#2D2D2D";
  drawRight(ctx, "fightcred.app", W - PAD, fy + 24);

  // Gold bottom bar
  ctx.fillStyle = GOLD;
  ctx.fillRect(0, H - 7, W, 7);

  return canvas.toDataURL("image/png");
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SharePicksButton({
  eventName,
  eventDate,
  fights,
  fightsWithPreds,
  username,
}: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageUrl, setImageUrl]         = useState<string | null>(null);
  const [showPreview, setShowPreview]   = useState(false);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    try {
      const preds = (fightsWithPreds ?? []) as FightWithPred[];
      const url = await generateShareImage(
        eventName, eventDate, fights, preds, username ?? "FightCred",
      );
      setImageUrl(url);
      setShowPreview(true);
    } catch (err) {
      console.error("Failed to generate share image:", err);
      alert("Failed to generate image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [eventName, eventDate, fights, fightsWithPreds, username]);

  const handleDownload = useCallback(() => {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `fightcred_${eventName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_picks.png`;
    a.click();
  }, [imageUrl, eventName]);

  const handleShare = useCallback(async () => {
    if (!imageUrl) return;
    if (typeof navigator.share === "function") {
      try {
        const blob = await (await fetch(imageUrl)).blob();
        const file = new File([blob], "fightcred_picks.png", { type: "image/png" });
        await navigator.share({ title: `My FightCred Picks — ${eventName}`, files: [file] });
        return;
      } catch { /* fall through */ }
    }
    handleDownload();
  }, [imageUrl, eventName, handleDownload]);

  return (
    <>
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className={cn(
          "flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all",
          "bg-[#C9A84C] hover:bg-[#b8973f] text-black",
          "disabled:opacity-60 disabled:cursor-not-allowed",
          "shadow-lg shadow-[#C9A84C]/20",
        )}
      >
        {isGenerating ? (
          <><Loader2 size={16} className="animate-spin" />Generating...</>
        ) : (
          <><ImageIcon size={16} />Share My Picks</>
        )}
      </button>

      {showPreview && imageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="bg-[#1A1A1A] border border-[#333] rounded-2xl overflow-hidden max-w-sm w-full max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-[#333] flex-shrink-0">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Share2 size={16} className="text-[#C9A84C]" />
                Your Picks Card
              </h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-[#9A9A9A] hover:text-white transition-colors text-xl leading-none"
              >×</button>
            </div>

            <div className="p-3 overflow-y-auto flex-1">
              <img src={imageUrl} alt="Your picks card" className="w-full rounded-xl border border-[#333]" />
            </div>

            <div className="flex gap-3 p-3 flex-shrink-0 border-t border-[#222]">
              <button
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#C9A84C] hover:bg-[#b8973f] text-black font-bold text-sm transition-colors"
              >
                <Download size={16} />Download
              </button>
              {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#D20A0A] hover:bg-[#b00808] text-white font-bold text-sm transition-colors"
                >
                  <Share2 size={16} />Share
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
