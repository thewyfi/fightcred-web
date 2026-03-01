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
  ctx.font = `${bold ? "900" : "400"} ${size}px 'Arial Black', Arial, sans-serif`;
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
  const ROW_H   = 88;   // taller rows to fit odds + dual badges
  const ROW_GAP = 6;
  const SEC_H   = 52;
  const FOOT_H  = 90;
  const H       = HERO_H + SEC_H + (ROW_H + ROW_GAP) * fights.length + FOOT_H + 16;

  const GOLD     = "#C9A84C";
  const GOLD_DIM = "#786428";
  const RED      = "#D20A0A";
  const GREEN    = "#22C55E";
  const WHITE    = "#FFFFFF";
  const GREY     = "#464646";
  const MUTED    = "#6E6E6E";
  const DARK_ROW = "#0F0F0F";
  const MAIN_ROW = "#16120A";

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // ── Background ───────────────────────────────────────────────────────────────
  ctx.fillStyle = "#080808";
  ctx.fillRect(0, 0, W, H);

  // Diagonal texture
  ctx.strokeStyle = "rgba(255,255,255,0.018)";
  ctx.lineWidth = 1;
  for (let i = -H; i < W + H; i += 50) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + H, H); ctx.stroke();
  }

  // ── HERO gradient ────────────────────────────────────────────────────────────
  const heroBg = ctx.createLinearGradient(0, 0, W, HERO_H);
  heroBg.addColorStop(0, "#160000");
  heroBg.addColorStop(0.5, "#0A0A0A");
  heroBg.addColorStop(1, "#001000");
  ctx.fillStyle = heroBg;
  ctx.fillRect(0, 0, W, HERO_H);

  // Red top bar + gold side bars
  ctx.fillStyle = RED;
  ctx.fillRect(0, 0, W, 8);
  ctx.fillStyle = GOLD;
  ctx.fillRect(0, 8, 4, HERO_H);
  ctx.fillRect(W - 4, 8, 4, HERO_H);

  // ── Brand + Event header ──────────────────────────────────────────────────────
  setFont(ctx, 26, true);
  ctx.fillStyle = GOLD;
  ctx.textBaseline = "top";
  ctx.fillText("FIGHTCRED", PAD + 8, 20);

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

  // ── Center divider + VS badge ─────────────────────────────────────────────────
  ctx.strokeStyle = "rgba(120,0,0,0.7)";
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(W / 2, 90); ctx.lineTo(W / 2, HERO_H - 90); ctx.stroke();

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
  const allFightsForHero = fightsWithPreds.length > 0
    ? fightsWithPreds
    : fights.map(f => ({ ...f, userPrediction: null }));
  const mainFightWithPred = allFightsForHero.find(f => f.isMainEvent) ?? allFightsForHero[0];
  const mainFight = mainFightWithPred as FightWithPred;
  const mainPred  = mainFight?.userPrediction ?? null;

  const f1n = mainFight?.fighter1Name ?? "";
  const f2n = mainFight?.fighter2Name ?? "";
  const f1Picked = mainPred?.pickedWinner === f1n;
  const f2Picked = mainPred?.pickedWinner === f2n;
  const hasPick  = !!mainPred;

  const f1Col = f1Picked ? GOLD : hasPick ? GREY : WHITE;
  const f2Col = f2Picked ? GOLD : hasPick ? GREY : WHITE;

  const nameY = HERO_H - 140;

  setFont(ctx, 90, true);
  ctx.fillStyle = f1Col;
  ctx.textBaseline = "top";
  ctx.fillText(lastName(f1n), PAD + 8, nameY);

  ctx.fillStyle = f2Col;
  drawRight(ctx, lastName(f2n), W - PAD - 8, nameY);

  setFont(ctx, 24, true);
  ctx.fillStyle = f1Picked ? GOLD : MUTED;
  ctx.fillText(firstName(f1n), PAD + 8, nameY + 98);
  ctx.fillStyle = f2Picked ? GOLD : MUTED;
  drawRight(ctx, firstName(f2n), W - PAD - 8, nameY + 98);

  setFont(ctx, 20, false);
  ctx.fillStyle = GREY;
  ctx.fillText(mainFight?.fighter1Record ?? "", PAD + 8, nameY + 128);
  drawRight(ctx, mainFight?.fighter2Record ?? "", W - PAD - 8, nameY + 128);

  // Odds in hero
  const o1 = formatOddsStr(mainFight?.odds1);
  const o2 = formatOddsStr(mainFight?.odds2);
  if (o1) {
    setFont(ctx, 18, true);
    ctx.fillStyle = (mainFight?.odds1 ?? 0) < 0 ? GREEN : RED;
    ctx.fillText(o1, PAD + 8, nameY + 155);
  }
  if (o2) {
    setFont(ctx, 18, true);
    ctx.fillStyle = (mainFight?.odds2 ?? 0) < 0 ? GREEN : RED;
    drawRight(ctx, o2, W - PAD - 8, nameY + 155);
  }

  // Pick label
  const pickY = nameY + 180;
  if (f1Picked && mainPred) {
    const detail = methodLabel(mainPred.pickedMethod, mainPred.pickedFinishType);
    setFont(ctx, 16, true);
    ctx.fillStyle = GOLD;
    ctx.fillText("▶ MY PICK", PAD + 8, pickY);
    setFont(ctx, 18, false);
    ctx.fillStyle = GOLD_DIM;
    ctx.fillText(detail, PAD + 8, pickY + 22);
  } else if (f2Picked && mainPred) {
    const detail = methodLabel(mainPred.pickedMethod, mainPred.pickedFinishType);
    setFont(ctx, 16, true);
    ctx.fillStyle = GOLD;
    drawRight(ctx, "MY PICK ◀", W - PAD - 8, pickY);
    setFont(ctx, 18, false);
    ctx.fillStyle = GOLD_DIM;
    drawRight(ctx, detail, W - PAD - 8, pickY + 22);
  }

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

  const allFights = fightsWithPreds.length > 0
    ? fightsWithPreds
    : fights.map(f => ({ ...f, userPrediction: null }));

  for (const fight of allFights) {
    const pred    = (fight as FightWithPred).userPrediction ?? null;
    const pF1     = pred?.pickedWinner === fight.fighter1Name;
    const pF2     = pred?.pickedWinner === fight.fighter2Name;
    const hp      = !!pred;
    const resolved = fight.status === "completed" && !!fight.winner;

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

    // ── Fighter 1 ──────────────────────────────────────────────────────────────
    // Determine win/loss coloring for resolved fights
    const f1Won = resolved && fight.winner === fight.fighter1Name;
    const f2Won = resolved && fight.winner === fight.fighter2Name;
    const f1c = pF1 ? GOLD : hp ? GREY : "#D2D2D2";
    const f2c = pF2 ? GOLD : hp ? GREY : "#D2D2D2";

    const nameLineY = mid - 22;
    const oddsLineY = mid + 2;
    const recLineY  = mid + 20;

    setFont(ctx, 20, true);
    ctx.fillStyle = f1c;
    ctx.textBaseline = "middle";

    let f1d = fight.fighter1Name;
    while (tw(ctx, f1d) > iw * 0.38 && f1d.length > 4) f1d = f1d.slice(0, -1);
    if (f1d !== fight.fighter1Name) f1d += "…";
    ctx.fillText(f1d, ix, nameLineY);

    // F1 checkmark / X
    setFont(ctx, 20, true);
    const f1dw = tw(ctx, f1d);
    if (pF1) { ctx.fillStyle = GOLD; ctx.fillText("✓", ix + f1dw + 6, nameLineY); }
    else if (hp) { ctx.fillStyle = RED; ctx.fillText("✗", ix + f1dw + 6, nameLineY); }

    // F1 odds
    const odds1Str = formatOddsStr(fight.odds1);
    if (odds1Str) {
      setFont(ctx, 14, true);
      ctx.fillStyle = (fight.odds1 ?? 0) < 0 ? "#4ADE80" : "#F87171";
      ctx.fillText(odds1Str, ix, oddsLineY);
    }

    // F1 record
    setFont(ctx, 13, false);
    ctx.fillStyle = "#373737";
    ctx.fillText(fight.fighter1Record ?? "", ix, recLineY);

    // ── Fighter 2 ──────────────────────────────────────────────────────────────
    setFont(ctx, 20, true);
    ctx.fillStyle = f2c;

    let f2d = fight.fighter2Name;
    while (tw(ctx, f2d) > iw * 0.38 && f2d.length > 4) f2d = f2d.slice(0, -1);
    if (f2d !== fight.fighter2Name) f2d += "…";
    const f2dw = tw(ctx, f2d);
    ctx.fillText(f2d, ix + iw - f2dw, nameLineY);

    // F2 checkmark / X
    setFont(ctx, 20, true);
    if (pF2) { ctx.fillStyle = GOLD; ctx.fillText("✓", ix + iw - f2dw - tw(ctx, "✓") - 6, nameLineY); }
    else if (hp) { ctx.fillStyle = RED; ctx.fillText("✗", ix + iw - f2dw - tw(ctx, "✗") - 6, nameLineY); }

    // F2 odds
    const odds2Str = formatOddsStr(fight.odds2);
    if (odds2Str) {
      setFont(ctx, 14, true);
      ctx.fillStyle = (fight.odds2 ?? 0) < 0 ? "#4ADE80" : "#F87171";
      const oddsW = tw(ctx, odds2Str);
      ctx.fillText(odds2Str, ix + iw - oddsW, oddsLineY);
    }

    // F2 record
    setFont(ctx, 13, false);
    ctx.fillStyle = "#373737";
    const recW = tw(ctx, fight.fighter2Record ?? "");
    ctx.fillText(fight.fighter2Record ?? "", ix + iw - recW, recLineY);

    // ── Center badges ──────────────────────────────────────────────────────────
    const cx = W / 2;

    if (hp && pred) {
      const predMethodLabel = methodLabel(pred.pickedMethod, pred.pickedFinishType);
      const badgeCol = pred.status === "correct" ? GREEN
                     : pred.status === "wrong"   ? RED
                     : GOLD;

      if (resolved && fight.method) {
        // ── Resolved: show PREDICTED vs RESULT side by side ──────────────────
        const actualLabel = methodLabel(fight.method, fight.finishType);

        // "PRED" label + badge on left of center
        const predText = predMethodLabel;
        const actText  = actualLabel;

        setFont(ctx, 11, true);
        const halfW = iw * 0.18;
        const bh = 22;

        // Predicted badge (left of center)
        const pbw = Math.max(tw(ctx, predText) + 16, 70);
        const pbx = cx - pbw - 6;
        const pby = mid - 24;
        rrect(ctx, pbx, pby, pbw, bh, 5);
        ctx.fillStyle = "#141414"; ctx.fill();
        rrect(ctx, pbx, pby, pbw, bh, 5);
        ctx.strokeStyle = badgeCol; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = badgeCol;
        ctx.textBaseline = "middle";
        drawCentered(ctx, predText, pbx + pbw / 2, pby + bh / 2);

        // "PRED" micro label above
        setFont(ctx, 10, false);
        ctx.fillStyle = "#555555";
        ctx.textBaseline = "middle";
        drawCentered(ctx, "PRED", pbx + pbw / 2, pby - 8);

        // Actual result badge (right of center)
        setFont(ctx, 11, true);
        const abw = Math.max(tw(ctx, actText) + 16, 70);
        const abx = cx + 6;
        const aby = mid - 24;
        rrect(ctx, abx, aby, abw, bh, 5);
        ctx.fillStyle = "#141414"; ctx.fill();
        rrect(ctx, abx, aby, abw, bh, 5);
        ctx.strokeStyle = "#555555"; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = "#AAAAAA";
        ctx.textBaseline = "middle";
        drawCentered(ctx, actText, abx + abw / 2, aby + bh / 2);

        // "RESULT" micro label above
        setFont(ctx, 10, false);
        ctx.fillStyle = "#555555";
        drawCentered(ctx, "RESULT", abx + abw / 2, aby - 8);

        // Winner label below badges
        if (fight.winner) {
          const winnerShort = fight.winner.split(" ").pop()!.toUpperCase();
          setFont(ctx, 11, true);
          ctx.fillStyle = f1Won ? "#4ADE80" : f2Won ? "#4ADE80" : "#555555";
          ctx.textBaseline = "middle";
          drawCentered(ctx, `W: ${winnerShort}`, cx, mid + 8);
        }

      } else {
        // ── Pending: show single method badge ────────────────────────────────
        const isDecision = pred.pickedFinishType === "decision" || !pred.pickedMethod;
        const mShort = predMethodLabel;

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

        // Finish type sub-badge
        if (!isDecision) {
          setFont(ctx, 12, false);
          const ftText = "INSIDE DIST";
          const rw = tw(ctx, ftText) + 16;
          const rh = 20;
          const rx = cx - rw / 2;
          const ry = mid + 4;
          rrect(ctx, rx, ry, rw, rh, 5);
          ctx.fillStyle = "#141414"; ctx.fill();
          rrect(ctx, rx, ry, rw, rh, 5);
          ctx.strokeStyle = "#3C3C3C"; ctx.lineWidth = 1; ctx.stroke();
          ctx.fillStyle = "#787878";
          ctx.textBaseline = "middle";
          drawCentered(ctx, ftText, cx, ry + rh / 2);
        } else {
          setFont(ctx, 13, false);
          ctx.fillStyle = "#2D2D2D";
          ctx.textBaseline = "middle";
          drawCentered(ctx, "VS", cx, mid + 8);
        }
      }
    } else {
      // No pick
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

  const picksCount = allFights.filter(f => (f as FightWithPred).userPrediction).length;

  setFont(ctx, 22, true);
  ctx.fillStyle = GOLD;
  ctx.textBaseline = "top";
  ctx.fillText(`@${username}`, PAD, fy + 18);

  setFont(ctx, 18, false);
  ctx.fillStyle = MUTED;
  drawCentered(ctx, `${picksCount}/${allFights.length} picks made`, W / 2, fy + 22);

  setFont(ctx, 18, false);
  ctx.fillStyle = GREY;
  drawRight(ctx, "fightcred.app", W - PAD, fy + 22);

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

  // Get username from profile if not passed as prop
  const { data: profile } = trpc.profile.get.useQuery(undefined, {
    enabled: !usernameProp,
  });
  const username = usernameProp ?? profile?.username ?? "FightCred";

  const generate = useCallback(async () => {
    setLoading(true);
    try {
      const preds = fightsWithPreds ?? [];
      const url = await generateShareImage(
        eventName,
        eventDate,
        fights,
        preds,
        username,
      );
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
