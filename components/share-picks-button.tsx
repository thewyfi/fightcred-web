"use client";
import { useState, useCallback } from "react";
import { Share2, Download, Loader2, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Fight = {
  id: number;
  fighter1Name: string;
  fighter2Name: string;
  fighter1ImageUrl?: string | null;
  fighter2ImageUrl?: string | null;
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

function proxyUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return `/api/img-proxy?url=${encodeURIComponent(url)}`;
}

async function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
    // Timeout after 6s
    setTimeout(() => resolve(null), 6000);
  });
}

function drawRoundedRect(
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

function truncate(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 0 && ctx.measureText(t + "…").width > maxW) t = t.slice(0, -1);
  return t + "…";
}

// ─── Main generator ───────────────────────────────────────────────────────────

async function generateShareImage(
  eventName: string,
  eventDate: string,
  fights: Fight[],
  fightsWithPreds: FightWithPred[],
  username: string,
  eventImageUrl: string | null | undefined,
): Promise<string> {
  // Canvas dimensions — Instagram portrait 4:5
  const W = 1080;
  const HERO_H = 540;   // top half: main event fighter photos
  const CARD_H = 720;   // bottom half: fight list
  const H = HERO_H + CARD_H;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // ── Background ──────────────────────────────────────────────────────────────
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, "#0A0A0A");
  bgGrad.addColorStop(0.5, "#111111");
  bgGrad.addColorStop(1, "#0D0D0D");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // ── Hero section: main event fighter photos ──────────────────────────────────
  const mainFight = fights.find((f) => f.isMainEvent) ?? fights[0];
  const mainPred = mainFight
    ? fightsWithPreds.find((f) => f.id === mainFight.id)?.userPrediction
    : null;

  // Load fighter images via proxy
  const [img1, img2] = await Promise.all([
    mainFight?.fighter1ImageUrl ? loadImage(proxyUrl(mainFight.fighter1ImageUrl)!) : Promise.resolve(null),
    mainFight?.fighter2ImageUrl ? loadImage(proxyUrl(mainFight.fighter2ImageUrl)!) : Promise.resolve(null),
  ]);

  // Left fighter (fighter1) — mirrored to face right
  if (img1) {
    const imgW = W / 2 + 60;
    const imgH = HERO_H + 40;
    const scale = Math.max(imgW / img1.naturalWidth, imgH / img1.naturalHeight);
    const dw = img1.naturalWidth * scale;
    const dh = img1.naturalHeight * scale;
    const dx = (W / 2 - dw) / 2;
    const dy = HERO_H - dh + 20;

    // Clip to left half
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W / 2, HERO_H);
    ctx.clip();

    // Mirror horizontally so fighter faces right (toward center)
    ctx.save();
    ctx.translate(W / 2, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(img1, dx - W / 2 + W / 2, dy, dw, dh);
    ctx.restore();

    // Gold outline if picked winner
    if (mainPred?.pickedWinner === mainFight?.fighter1Name) {
      const grad = ctx.createLinearGradient(0, 0, W / 2, 0);
      grad.addColorStop(0, "rgba(201,168,76,0)");
      grad.addColorStop(0.7, "rgba(201,168,76,0.15)");
      grad.addColorStop(1, "rgba(201,168,76,0.35)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W / 2, HERO_H);
    }
    // Red X overlay if picked loser
    if (mainPred && mainPred.pickedWinner !== mainFight?.fighter1Name) {
      ctx.fillStyle = "rgba(210,10,10,0.18)";
      ctx.fillRect(0, 0, W / 2, HERO_H);
      // Draw X
      ctx.strokeStyle = "rgba(210,10,10,0.5)";
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(20, 20);
      ctx.lineTo(W / 2 - 20, HERO_H - 20);
      ctx.moveTo(W / 2 - 20, 20);
      ctx.lineTo(20, HERO_H - 20);
      ctx.stroke();
    }

    ctx.restore();
  }

  // Right fighter (fighter2) — faces left (natural)
  if (img2) {
    const imgW = W / 2 + 60;
    const imgH = HERO_H + 40;
    const scale = Math.max(imgW / img2.naturalWidth, imgH / img2.naturalHeight);
    const dw = img2.naturalWidth * scale;
    const dh = img2.naturalHeight * scale;
    const dx = W / 2 + (W / 2 - dw) / 2;
    const dy = HERO_H - dh + 20;

    ctx.save();
    ctx.beginPath();
    ctx.rect(W / 2, 0, W / 2, HERO_H);
    ctx.clip();
    ctx.drawImage(img2, dx, dy, dw, dh);

    // Gold outline if picked winner
    if (mainPred?.pickedWinner === mainFight?.fighter2Name) {
      const grad = ctx.createLinearGradient(W / 2, 0, W, 0);
      grad.addColorStop(0, "rgba(201,168,76,0.35)");
      grad.addColorStop(0.3, "rgba(201,168,76,0.15)");
      grad.addColorStop(1, "rgba(201,168,76,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(W / 2, 0, W / 2, HERO_H);
    }
    // Red X overlay if picked loser
    if (mainPred && mainPred.pickedWinner !== mainFight?.fighter2Name) {
      ctx.fillStyle = "rgba(210,10,10,0.18)";
      ctx.fillRect(W / 2, 0, W / 2, HERO_H);
      ctx.strokeStyle = "rgba(210,10,10,0.5)";
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(W / 2 + 20, 20);
      ctx.lineTo(W - 20, HERO_H - 20);
      ctx.moveTo(W - 20, 20);
      ctx.lineTo(W / 2 + 20, HERO_H - 20);
      ctx.stroke();
    }

    ctx.restore();
  }

  // Center divider line
  ctx.strokeStyle = "#D20A0A";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(W / 2, 0);
  ctx.lineTo(W / 2, HERO_H - 60);
  ctx.stroke();

  // VS badge in center
  const vsSize = 64;
  const vsX = W / 2 - vsSize / 2;
  const vsY = HERO_H / 2 - vsSize / 2;
  drawRoundedRect(ctx, vsX, vsY, vsSize, vsSize, 8);
  ctx.fillStyle = "#D20A0A";
  ctx.fill();
  ctx.font = "bold 28px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("VS", W / 2, vsY + vsSize / 2);
  ctx.textBaseline = "alphabetic";

  // Hero gradient overlay (bottom fade into card section)
  const heroFade = ctx.createLinearGradient(0, HERO_H - 120, 0, HERO_H);
  heroFade.addColorStop(0, "rgba(10,10,10,0)");
  heroFade.addColorStop(1, "rgba(10,10,10,1)");
  ctx.fillStyle = heroFade;
  ctx.fillRect(0, HERO_H - 120, W, 120);

  // Top gradient overlay (for text readability)
  const topFade = ctx.createLinearGradient(0, 0, 0, 100);
  topFade.addColorStop(0, "rgba(0,0,0,0.7)");
  topFade.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = topFade;
  ctx.fillRect(0, 0, W, 100);

  // ── Hero text overlay ────────────────────────────────────────────────────────
  // FightCred logo text top-left
  ctx.font = "bold 26px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillStyle = "#C9A84C";
  ctx.textAlign = "left";
  ctx.fillText("FIGHTCRED", 32, 44);

  // Event name top-center
  ctx.font = "bold 30px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  const shortName = eventName.replace("UFC Fight Night: ", "UFC FN: ").replace("UFC ", "UFC ");
  ctx.fillText(truncate(ctx, shortName, W - 80), W / 2, 44);

  // Event date
  ctx.font = "500 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillStyle = "#9A9A9A";
  ctx.textAlign = "center";
  try {
    const ds = new Date(eventDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    ctx.fillText(ds, W / 2, 72);
  } catch { /* ignore */ }

  // Fighter names at bottom of hero
  if (mainFight) {
    // Fighter 1 name (left)
    ctx.font = "bold 36px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.textAlign = "left";
    const f1Color = mainPred?.pickedWinner === mainFight.fighter1Name ? "#C9A84C" : "#FFFFFF";
    ctx.fillStyle = f1Color;
    const f1Parts = mainFight.fighter1Name.split(" ");
    const f1Last = f1Parts[f1Parts.length - 1].toUpperCase();
    ctx.fillText(truncate(ctx, f1Last, W / 2 - 40), 28, HERO_H - 24);

    // Fighter 2 name (right)
    ctx.textAlign = "right";
    const f2Color = mainPred?.pickedWinner === mainFight.fighter2Name ? "#C9A84C" : "#FFFFFF";
    ctx.fillStyle = f2Color;
    const f2Parts = mainFight.fighter2Name.split(" ");
    const f2Last = f2Parts[f2Parts.length - 1].toUpperCase();
    ctx.fillText(truncate(ctx, f2Last, W / 2 - 40), W - 28, HERO_H - 24);

    // Pick indicator under names
    if (mainPred) {
      ctx.font = "600 18px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#C9A84C";
      const pickedLast = mainPred.pickedWinner.split(" ").pop()?.toUpperCase() ?? "";
      const methodLabel = mainPred.pickedMethod === "tko_ko" ? " · TKO/KO" :
        mainPred.pickedMethod === "submission" ? " · SUB" :
        mainPred.pickedMethod === "decision" ? " · DEC" : "";
      ctx.fillText(`MY PICK: ${pickedLast}${methodLabel}`, W / 2, HERO_H - 24);
    }
  }

  // ── Card section: fight list ─────────────────────────────────────────────────
  const cardY = HERO_H;
  const PAD = 28;
  const ROW_H = 62;
  const ROW_GAP = 6;

  // Section header
  ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillStyle = "#9A9A9A";
  ctx.textAlign = "left";
  ctx.fillText("MY PICKS", PAD, cardY + 36);

  // Divider
  ctx.strokeStyle = "#333333";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, cardY + 46);
  ctx.lineTo(W - PAD, cardY + 46);
  ctx.stroke();

  let rowY = cardY + 56;
  const maxRows = Math.floor((CARD_H - 100) / (ROW_H + ROW_GAP));
  const displayFights = fights.slice(0, maxRows);

  for (const fight of displayFights) {
    const pred = fightsWithPreds.find((f) => f.id === fight.id)?.userPrediction;
    const isCorrect = pred?.status === "correct";
    const isWrong = pred?.status === "wrong";
    const hasPick = !!pred;

    // Row background
    drawRoundedRect(ctx, PAD, rowY, W - PAD * 2, ROW_H, 10);
    ctx.fillStyle = fight.isMainEvent ? "#1C1810" : "#141414";
    ctx.fill();

    // Main event gold border
    if (fight.isMainEvent) {
      ctx.strokeStyle = "rgba(201,168,76,0.3)";
      ctx.lineWidth = 1.5;
      drawRoundedRect(ctx, PAD, rowY, W - PAD * 2, ROW_H, 10);
      ctx.stroke();
    }

    const innerX = PAD + 16;
    const innerW = W - PAD * 2 - 32;
    const rowMid = rowY + ROW_H / 2;

    // ── Fighter 1 (left) ──
    const f1Picked = hasPick && pred?.pickedWinner === fight.fighter1Name;
    const f1Loser = hasPick && pred?.pickedWinner !== fight.fighter1Name;

    ctx.font = `${f1Picked ? "bold" : "500"} 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
    ctx.fillStyle = f1Picked ? "#C9A84C" : f1Loser ? "#555555" : "#CCCCCC";
    ctx.textAlign = "left";
    const f1Name = truncate(ctx, fight.fighter1Name, innerW * 0.35);
    ctx.fillText(f1Name, innerX, rowMid - 4);

    // Record
    if ((fight as Fight & { fighter1Record?: string }).fighter1Record) {
      ctx.font = "400 14px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      ctx.fillStyle = "#555555";
      ctx.fillText((fight as Fight & { fighter1Record?: string }).fighter1Record!, innerX, rowMid + 16);
    }

    // Gold winner tick
    if (f1Picked) {
      ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      ctx.fillStyle = "#C9A84C";
      ctx.fillText("✓", innerX + ctx.measureText(f1Name).width + 8, rowMid - 4);
    }
    // Red X for loser
    if (f1Loser && hasPick) {
      ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      ctx.fillStyle = "#D20A0A";
      ctx.fillText("✗", innerX + ctx.measureText(f1Name).width + 8, rowMid - 4);
    }

    // ── VS center ──
    ctx.font = "bold 16px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#444444";
    ctx.textAlign = "center";
    ctx.fillText("VS", W / 2, rowMid + 6);

    // ── Fighter 2 (right) ──
    const f2Picked = hasPick && pred?.pickedWinner === fight.fighter2Name;
    const f2Loser = hasPick && pred?.pickedWinner !== fight.fighter2Name;

    ctx.font = `${f2Picked ? "bold" : "500"} 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
    ctx.fillStyle = f2Picked ? "#C9A84C" : f2Loser ? "#555555" : "#CCCCCC";
    ctx.textAlign = "right";
    const f2Name = truncate(ctx, fight.fighter2Name, innerW * 0.35);
    ctx.fillText(f2Name, innerX + innerW, rowMid - 4);

    // Gold winner tick
    if (f2Picked) {
      ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      ctx.fillStyle = "#C9A84C";
      ctx.textAlign = "right";
      ctx.fillText("✓", innerX + innerW - ctx.measureText(f2Name).width - 8, rowMid - 4);
    }
    // Red X for loser
    if (f2Loser && hasPick) {
      ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      ctx.fillStyle = "#D20A0A";
      ctx.textAlign = "right";
      ctx.fillText("✗", innerX + innerW - ctx.measureText(f2Name).width - 8, rowMid - 4);
    }

    // ── Method badge (right edge) ──
    if (hasPick && pred?.pickedMethod) {
      const methodLabel =
        pred.pickedMethod === "tko_ko" ? "TKO/KO" :
        pred.pickedMethod === "submission" ? "SUB" : "DEC";
      const badgeColor = isCorrect ? "#22c55e" : isWrong ? "#ef4444" : "#C9A84C";
      const badgeBg = isCorrect ? "rgba(34,197,94,0.12)" : isWrong ? "rgba(239,68,68,0.12)" : "rgba(201,168,76,0.12)";
      ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      const bw = ctx.measureText(methodLabel).width + 16;
      const bh = 24;
      const bx = W - PAD - 16 - bw;
      const by = rowMid - bh / 2;
      drawRoundedRect(ctx, bx, by, bw, bh, 5);
      ctx.fillStyle = badgeBg;
      ctx.fill();
      ctx.strokeStyle = badgeColor;
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, bx, by, bw, bh, 5);
      ctx.stroke();
      ctx.fillStyle = badgeColor;
      ctx.textAlign = "center";
      ctx.fillText(methodLabel, bx + bw / 2, by + bh / 2 + 5);
    }

    // No pick placeholder
    if (!hasPick) {
      ctx.font = "500 14px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      ctx.fillStyle = "#333333";
      ctx.textAlign = "center";
      ctx.fillText("— no pick —", W / 2, rowMid + 6);
    }

    rowY += ROW_H + ROW_GAP;
  }

  // ── Footer ───────────────────────────────────────────────────────────────────
  const footerY = H - 60;

  // Divider
  ctx.strokeStyle = "#222222";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, footerY);
  ctx.lineTo(W - PAD, footerY);
  ctx.stroke();

  // Username
  ctx.font = "bold 26px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillStyle = "#C9A84C";
  ctx.textAlign = "left";
  ctx.fillText(`@${username}`, PAD, footerY + 36);

  // Picks summary
  const pickCount = fightsWithPreds.filter((f) => f.userPrediction).length;
  ctx.font = "500 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillStyle = "#555555";
  ctx.textAlign = "center";
  ctx.fillText(`${pickCount}/${fights.length} picks`, W / 2, footerY + 36);

  // Domain
  ctx.font = "500 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillStyle = "#444444";
  ctx.textAlign = "right";
  ctx.fillText("fightcred.app", W - PAD, footerY + 36);

  // Gold bottom bar
  ctx.fillStyle = "#C9A84C";
  ctx.fillRect(0, H - 6, W, 6);

  // Red top bar
  ctx.fillStyle = "#D20A0A";
  ctx.fillRect(0, 0, W, 6);

  return canvas.toDataURL("image/png");
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SharePicksButton({
  eventName,
  eventDate,
  eventImageUrl,
  fights,
  fightsWithPreds,
  username,
}: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    try {
      const preds: FightWithPred[] = (fightsWithPreds ?? []) as FightWithPred[];
      const url = await generateShareImage(
        eventName,
        eventDate,
        fights,
        preds,
        username ?? "FightCred",
        eventImageUrl,
      );
      setImageUrl(url);
      setShowPreview(true);
    } catch (err) {
      console.error("Failed to generate share image:", err);
      alert("Failed to generate image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [eventName, eventDate, eventImageUrl, fights, fightsWithPreds, username]);

  const handleDownload = useCallback(() => {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    const safeName = eventName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    a.download = `fightcred_${safeName}_picks.png`;
    a.click();
  }, [imageUrl, eventName]);

  const handleShare = useCallback(async () => {
    if (!imageUrl) return;
    if (typeof navigator.share === "function") {
      try {
        const blob = await (await fetch(imageUrl)).blob();
        const file = new File([blob], "fightcred_picks.png", { type: "image/png" });
        await navigator.share({
          title: `My FightCred Picks — ${eventName}`,
          files: [file],
        });
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
          <>
            <Loader2 size={16} className="animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <ImageIcon size={16} />
            Share My Picks
          </>
        )}
      </button>

      {/* Preview Modal */}
      {showPreview && imageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="bg-[#1A1A1A] border border-[#333] rounded-2xl overflow-hidden max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#333]">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Share2 size={16} className="text-[#C9A84C]" />
                Your Picks Card
              </h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-[#9A9A9A] hover:text-white transition-colors text-xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Image preview */}
            <div className="p-3">
              <img
                src={imageUrl}
                alt="Your picks card"
                className="w-full rounded-xl border border-[#333]"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-3 pt-0">
              <button
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#C9A84C] hover:bg-[#b8973f] text-black font-bold text-sm transition-colors"
              >
                <Download size={16} />
                Download
              </button>
              {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#D20A0A] hover:bg-[#b00808] text-white font-bold text-sm transition-colors"
                >
                  <Share2 size={16} />
                  Share
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
