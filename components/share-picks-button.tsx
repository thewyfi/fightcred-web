"use client";
import { useState, useCallback } from "react";
import { Share2, Download, Loader2, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Fight = {
  id: number;
  fighter1Name: string;
  fighter2Name: string;
  fighter1Photo?: string | null;
  fighter2Photo?: string | null;
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
  fights: Fight[];
  fightsWithPreds?: FightWithPred[] | null;
  username?: string | null;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
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

async function generateShareImage(
  eventName: string,
  eventDate: string,
  fights: Fight[],
  fightsWithPreds: FightWithPred[],
  username: string,
): Promise<string> {
  const WIDTH = 1080;
  const HEADER_H = 200;
  const FIGHT_ROW_H = 72;
  const FOOTER_H = 100;
  const PADDING = 40;
  const GAP = 8;

  const totalFights = fights.length;
  const HEIGHT = HEADER_H + totalFights * (FIGHT_ROW_H + GAP) + FOOTER_H + PADDING;

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d")!;

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  bg.addColorStop(0, "#0A0A0A");
  bg.addColorStop(1, "#111111");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Gold border frame
  ctx.strokeStyle = "#C9A84C";
  ctx.lineWidth = 4;
  ctx.strokeRect(8, 8, WIDTH - 16, HEIGHT - 16);

  // Red accent top bar
  ctx.fillStyle = "#D20A0A";
  ctx.fillRect(8, 8, WIDTH - 16, 6);

  // Header section
  const headerY = 40;

  // UFC logo text / branding
  ctx.font = "bold 28px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillStyle = "#C9A84C";
  ctx.textAlign = "center";
  ctx.fillText("FIGHTCRED", WIDTH / 2, headerY + 30);

  // Event name
  ctx.font = "bold 42px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  // Truncate long event names
  let eventNameDisplay = eventName;
  if (ctx.measureText(eventNameDisplay).width > WIDTH - 80) {
    while (ctx.measureText(eventNameDisplay + "…").width > WIDTH - 80 && eventNameDisplay.length > 0) {
      eventNameDisplay = eventNameDisplay.slice(0, -1);
    }
    eventNameDisplay += "…";
  }
  ctx.fillText(eventNameDisplay, WIDTH / 2, headerY + 80);

  // Event date
  ctx.font = "500 26px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillStyle = "#9A9A9A";
  ctx.textAlign = "center";
  try {
    const dateStr = new Date(eventDate).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    ctx.fillText(dateStr, WIDTH / 2, headerY + 118);
  } catch {
    ctx.fillText(eventDate, WIDTH / 2, headerY + 118);
  }

  // Divider line
  ctx.strokeStyle = "#333333";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PADDING, HEADER_H);
  ctx.lineTo(WIDTH - PADDING, HEADER_H);
  ctx.stroke();

  // Fight rows
  let rowY = HEADER_H + PADDING / 2;

  for (const fight of fights) {
    const pred = fightsWithPreds.find((f) => f.id === fight.id)?.userPrediction;
    const hasPick = !!pred;
    const isCorrect = pred?.status === "correct";
    const isWrong = pred?.status === "wrong";

    // Row background
    const rowBg = fight.isMainEvent ? "#1E1A10" : "#141414";
    drawRoundedRect(ctx, PADDING, rowY, WIDTH - PADDING * 2, FIGHT_ROW_H, 10);
    ctx.fillStyle = rowBg;
    ctx.fill();

    // Main event gold border
    if (fight.isMainEvent) {
      ctx.strokeStyle = "#C9A84C40";
      ctx.lineWidth = 1.5;
      drawRoundedRect(ctx, PADDING, rowY, WIDTH - PADDING * 2, FIGHT_ROW_H, 10);
      ctx.stroke();
    }

    const rowCenterY = rowY + FIGHT_ROW_H / 2;
    const innerX = PADDING + 16;
    const innerW = WIDTH - PADDING * 2 - 32;

    // Fighter names
    const nameAreaW = innerW * 0.38;
    const vsAreaW = innerW * 0.12;
    const pickAreaW = innerW * 0.38;
    const statusAreaW = innerW * 0.12;

    // Fighter 1 name
    ctx.font = "bold 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.fillStyle = hasPick && pred?.pickedWinner === fight.fighter1Name ? "#FFFFFF" : "#AAAAAA";
    ctx.textAlign = "left";
    let f1Name = fight.fighter1Name;
    const f1MaxW = nameAreaW - 10;
    while (ctx.measureText(f1Name).width > f1MaxW && f1Name.length > 0) {
      f1Name = f1Name.slice(0, -1);
    }
    if (f1Name !== fight.fighter1Name) f1Name += "…";
    ctx.fillText(f1Name, innerX, rowCenterY - 6);

    // Fighter 1 last name (smaller)
    ctx.font = "500 18px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#666666";
    if (fight.weightClass) {
      ctx.fillText(fight.weightClass, innerX, rowCenterY + 16);
    }

    // VS
    ctx.font = "bold 18px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#555555";
    ctx.textAlign = "center";
    ctx.fillText("VS", innerX + nameAreaW + vsAreaW / 2, rowCenterY + 6);

    // Fighter 2 name
    ctx.font = "bold 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.fillStyle = hasPick && pred?.pickedWinner === fight.fighter2Name ? "#FFFFFF" : "#AAAAAA";
    ctx.textAlign = "right";
    let f2Name = fight.fighter2Name;
    const f2MaxW = nameAreaW - 10;
    while (ctx.measureText(f2Name).width > f2MaxW && f2Name.length > 0) {
      f2Name = f2Name.slice(0, -1);
    }
    if (f2Name !== fight.fighter2Name) f2Name += "…";
    ctx.fillText(f2Name, innerX + nameAreaW + vsAreaW + nameAreaW, rowCenterY - 6);

    // Pick indicator
    if (hasPick && pred) {
      const pickX = innerX + nameAreaW * 2 + vsAreaW + 8;
      const pickW = pickAreaW - 8;
      const pickH = 34;
      const pickY = rowCenterY - pickH / 2;

      // Pick background
      const pickBg = isCorrect ? "#14532d" : isWrong ? "#450a0a" : "#1C1C1C";
      const pickBorder = isCorrect ? "#22c55e" : isWrong ? "#ef4444" : "#C9A84C";
      drawRoundedRect(ctx, pickX, pickY, pickW, pickH, 6);
      ctx.fillStyle = pickBg;
      ctx.fill();
      ctx.strokeStyle = pickBorder;
      ctx.lineWidth = 1.5;
      drawRoundedRect(ctx, pickX, pickY, pickW, pickH, 6);
      ctx.stroke();

      // Pick text
      const pickLabel = isCorrect ? "✓ " : isWrong ? "✗ " : "→ ";
      ctx.font = "bold 17px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      ctx.fillStyle = isCorrect ? "#4ade80" : isWrong ? "#f87171" : "#C9A84C";
      ctx.textAlign = "center";

      let pickedName = pred.pickedWinner;
      // Shorten to last name
      const parts = pickedName.split(" ");
      if (parts.length > 1) pickedName = parts[parts.length - 1];

      const maxPickW = pickW - 16;
      while (ctx.measureText(pickLabel + pickedName).width > maxPickW && pickedName.length > 0) {
        pickedName = pickedName.slice(0, -1);
      }
      ctx.fillText(pickLabel + pickedName, pickX + pickW / 2, rowCenterY + 6);

      // Method badge
      if (pred.pickedMethod) {
        const methodLabel =
          pred.pickedMethod === "tko_ko" ? "TKO/KO" :
          pred.pickedMethod === "submission" ? "SUB" : "DEC";
        ctx.font = "500 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
        ctx.fillStyle = "#666666";
        ctx.textAlign = "center";
        ctx.fillText(methodLabel, pickX + pickW / 2, rowCenterY + 22);
      }
    } else {
      // No pick placeholder
      const pickX = innerX + nameAreaW * 2 + vsAreaW + 8;
      const pickW = pickAreaW - 8;
      ctx.font = "500 16px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      ctx.fillStyle = "#333333";
      ctx.textAlign = "center";
      ctx.fillText("No Pick", pickX + pickW / 2, rowCenterY + 6);
    }

    rowY += FIGHT_ROW_H + GAP;
  }

  // Footer
  const footerY = rowY + PADDING / 2;

  // Divider
  ctx.strokeStyle = "#333333";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PADDING, footerY);
  ctx.lineTo(WIDTH - PADDING, footerY);
  ctx.stroke();

  // Username
  ctx.font = "bold 28px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillStyle = "#C9A84C";
  ctx.textAlign = "left";
  ctx.fillText(`@${username || "FightCred"}`, PADDING, footerY + 44);

  // Branding
  ctx.font = "500 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillStyle = "#555555";
  ctx.textAlign = "right";
  ctx.fillText("fightcred.app", WIDTH - PADDING, footerY + 44);

  // Picks count
  const picksCount = fightsWithPreds.filter((f) => f.userPrediction).length;
  ctx.font = "500 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillStyle = "#9A9A9A";
  ctx.textAlign = "left";
  ctx.fillText(`${picksCount}/${fights.length} picks made`, PADDING, footerY + 76);

  return canvas.toDataURL("image/png");
}

export function SharePicksButton({ eventName, eventDate, fights, fightsWithPreds, username }: Props) {
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
      } catch {
        // Fall through to download
      }
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
            className="bg-[#1A1A1A] border border-[#333] rounded-2xl overflow-hidden max-w-lg w-full"
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
            <div className="p-4">
              <img
                src={imageUrl}
                alt="Your picks card"
                className="w-full rounded-xl border border-[#333]"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-4 pt-0">
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
