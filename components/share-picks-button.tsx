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

function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxW: number,
  maxSize: number,
  minSize = 14,
): number {
  let size = maxSize;
  ctx.font = `900 ${size}px 'Arial Black', Arial, sans-serif`;
  while (ctx.measureText(text).width > maxW && size > minSize) {
    size -= 2;
    ctx.font = `900 ${size}px 'Arial Black', Arial, sans-serif`;
  }
  return size;
}

function lastName(name: string): string {
  const parts = name.trim().split(" ");
  return parts[parts.length - 1].toUpperCase();
}

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
    setTimeout(() => resolve(null), 5000);
  });
}

// ─── Main generator ───────────────────────────────────────────────────────────

async function generateShareImage(
  eventName: string,
  eventDate: string,
  fights: Fight[],
  fightsWithPreds: FightWithPred[],
  username: string,
): Promise<string> {
  const W = 1080;
  const HERO_H = 480;
  const ROW_H = 66;
  const ROW_GAP = 8;
  const PAD = 32;
  const FOOTER_H = 80;
  const SECTION_HEADER_H = 48;

  const maxFights = fights.length;
  const H = HERO_H + SECTION_HEADER_H + (ROW_H + ROW_GAP) * maxFights + FOOTER_H + 20;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // ── Full background ──────────────────────────────────────────────────────────
  ctx.fillStyle = "#0A0A0A";
  ctx.fillRect(0, 0, W, H);

  // Subtle diagonal texture lines
  ctx.strokeStyle = "rgba(255,255,255,0.015)";
  ctx.lineWidth = 1;
  for (let i = -H; i < W + H; i += 40) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + H, H);
    ctx.stroke();
  }

  // ── HERO SECTION ─────────────────────────────────────────────────────────────
  // Try to load fighter images from proxy
  const mainFight = fights.find((f) => f.isMainEvent) ?? fights[0];
  const mainPred = mainFight
    ? fightsWithPreds.find((f) => f.id === mainFight.id)?.userPrediction
    : null;

  const [img1, img2] = await Promise.all([
    mainFight?.fighter1ImageUrl ? loadImage(proxyUrl(mainFight.fighter1ImageUrl)!) : Promise.resolve(null),
    mainFight?.fighter2ImageUrl ? loadImage(proxyUrl(mainFight.fighter2ImageUrl)!) : Promise.resolve(null),
  ]);

  // Hero background gradient
  const heroBg = ctx.createLinearGradient(0, 0, W, HERO_H);
  heroBg.addColorStop(0, "#1A0000");
  heroBg.addColorStop(0.5, "#0D0D0D");
  heroBg.addColorStop(1, "#001A00");
  ctx.fillStyle = heroBg;
  ctx.fillRect(0, 0, W, HERO_H);

  // Draw fighter images if available
  const hasImages = img1 || img2;

  if (hasImages) {
    // Left fighter
    if (img1) {
      const scale = Math.max((W / 2 + 80) / img1.naturalWidth, (HERO_H + 40) / img1.naturalHeight);
      const dw = img1.naturalWidth * scale;
      const dh = img1.naturalHeight * scale;
      const dx = (W / 2 - dw) / 2;
      const dy = HERO_H - dh + 10;

      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, W / 2, HERO_H);
      ctx.clip();
      // Mirror to face right
      ctx.save();
      ctx.translate(W / 2, 0);
      ctx.scale(-1, 1);
      ctx.globalAlpha = 0.85;
      ctx.drawImage(img1, dx - W / 2 + W / 2, dy, dw, dh);
      ctx.restore();
      // Gold overlay if picked winner
      if (mainPred?.pickedWinner === mainFight?.fighter1Name) {
        const g = ctx.createLinearGradient(0, 0, W / 2, 0);
        g.addColorStop(0, "rgba(201,168,76,0)");
        g.addColorStop(1, "rgba(201,168,76,0.2)");
        ctx.globalAlpha = 1;
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W / 2, HERO_H);
      } else if (mainPred) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = "rgba(180,0,0,0.2)";
        ctx.fillRect(0, 0, W / 2, HERO_H);
        // Red X
        ctx.strokeStyle = "rgba(210,10,10,0.55)";
        ctx.lineWidth = 14;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(30, 30); ctx.lineTo(W / 2 - 30, HERO_H - 80);
        ctx.moveTo(W / 2 - 30, 30); ctx.lineTo(30, HERO_H - 80);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Right fighter
    if (img2) {
      const scale = Math.max((W / 2 + 80) / img2.naturalWidth, (HERO_H + 40) / img2.naturalHeight);
      const dw = img2.naturalWidth * scale;
      const dh = img2.naturalHeight * scale;
      const dx = W / 2 + (W / 2 - dw) / 2;
      const dy = HERO_H - dh + 10;

      ctx.save();
      ctx.beginPath();
      ctx.rect(W / 2, 0, W / 2, HERO_H);
      ctx.clip();
      ctx.globalAlpha = 0.85;
      ctx.drawImage(img2, dx, dy, dw, dh);
      // Gold overlay if picked winner
      if (mainPred?.pickedWinner === mainFight?.fighter2Name) {
        const g = ctx.createLinearGradient(W / 2, 0, W, 0);
        g.addColorStop(0, "rgba(201,168,76,0.2)");
        g.addColorStop(1, "rgba(201,168,76,0)");
        ctx.globalAlpha = 1;
        ctx.fillStyle = g;
        ctx.fillRect(W / 2, 0, W / 2, HERO_H);
      } else if (mainPred) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = "rgba(180,0,0,0.2)";
        ctx.fillRect(W / 2, 0, W / 2, HERO_H);
        ctx.strokeStyle = "rgba(210,10,10,0.55)";
        ctx.lineWidth = 14;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(W / 2 + 30, 30); ctx.lineTo(W - 30, HERO_H - 80);
        ctx.moveTo(W - 30, 30); ctx.lineTo(W / 2 + 30, HERO_H - 80);
        ctx.stroke();
      }
      ctx.restore();
    }
  } else {
    // No images — draw stylized name blocks
    if (mainFight) {
      const f1Picked = mainPred?.pickedWinner === mainFight.fighter1Name;
      const f2Picked = mainPred?.pickedWinner === mainFight.fighter2Name;

      // Left fighter block
      const leftGrad = ctx.createLinearGradient(0, 0, W / 2, HERO_H);
      leftGrad.addColorStop(0, f1Picked ? "rgba(201,168,76,0.15)" : "rgba(180,0,0,0.08)");
      leftGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = leftGrad;
      ctx.fillRect(0, 0, W / 2, HERO_H);

      // Right fighter block
      const rightGrad = ctx.createLinearGradient(W / 2, 0, W, HERO_H);
      rightGrad.addColorStop(0, "rgba(0,0,0,0)");
      rightGrad.addColorStop(1, f2Picked ? "rgba(201,168,76,0.15)" : "rgba(180,0,0,0.08)");
      ctx.fillStyle = rightGrad;
      ctx.fillRect(W / 2, 0, W / 2, HERO_H);

      // Large fighter last names as background art
      ctx.save();
      ctx.globalAlpha = 0.06;
      ctx.font = `900 180px 'Arial Black', Arial, sans-serif`;
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(lastName(mainFight.fighter1Name), W / 4, HERO_H / 2);
      ctx.fillText(lastName(mainFight.fighter2Name), (W / 4) * 3, HERO_H / 2);
      ctx.restore();

      // Red X on loser side
      if (mainPred && !f1Picked) {
        ctx.strokeStyle = "rgba(210,10,10,0.4)";
        ctx.lineWidth = 12;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(40, 60); ctx.lineTo(W / 2 - 40, HERO_H - 100);
        ctx.moveTo(W / 2 - 40, 60); ctx.lineTo(40, HERO_H - 100);
        ctx.stroke();
      }
      if (mainPred && !f2Picked) {
        ctx.strokeStyle = "rgba(210,10,10,0.4)";
        ctx.lineWidth = 12;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(W / 2 + 40, 60); ctx.lineTo(W - 40, HERO_H - 100);
        ctx.moveTo(W - 40, 60); ctx.lineTo(W / 2 + 40, HERO_H - 100);
        ctx.stroke();
      }
    }
  }

  // Hero bottom gradient fade
  const heroFade = ctx.createLinearGradient(0, HERO_H - 160, 0, HERO_H);
  heroFade.addColorStop(0, "rgba(10,10,10,0)");
  heroFade.addColorStop(1, "rgba(10,10,10,1)");
  ctx.fillStyle = heroFade;
  ctx.fillRect(0, HERO_H - 160, W, 160);

  // Hero top gradient
  const topFade = ctx.createLinearGradient(0, 0, 0, 120);
  topFade.addColorStop(0, "rgba(0,0,0,0.85)");
  topFade.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = topFade;
  ctx.fillRect(0, 0, W, 120);

  // ── Red top bar ──────────────────────────────────────────────────────────────
  ctx.fillStyle = "#D20A0A";
  ctx.fillRect(0, 0, W, 7);

  // ── FIGHTCRED logo ───────────────────────────────────────────────────────────
  ctx.font = `bold 28px 'Arial Black', Arial, sans-serif`;
  ctx.fillStyle = "#C9A84C";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("FIGHTCRED", PAD, 52);

  // ── Event name ───────────────────────────────────────────────────────────────
  ctx.font = `bold 34px 'Arial Black', Arial, sans-serif`;
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  // Shorten "UFC Fight Night:" to "UFC FN:"
  const shortEvent = eventName
    .replace("UFC Fight Night: ", "UFC FN: ")
    .replace("UFC ", "UFC ");
  ctx.fillText(shortEvent, W / 2, 52);

  // Event date
  ctx.font = `500 22px Arial, sans-serif`;
  ctx.fillStyle = "#888888";
  ctx.textAlign = "center";
  try {
    const ds = new Date(eventDate).toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric",
    });
    ctx.fillText(ds, W / 2, 80);
  } catch { /* ignore */ }

  // ── Center divider ───────────────────────────────────────────────────────────
  ctx.strokeStyle = "#D20A0A";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(W / 2, 100);
  ctx.lineTo(W / 2, HERO_H - 120);
  ctx.stroke();

  // ── VS badge ─────────────────────────────────────────────────────────────────
  const vsY = HERO_H / 2 - 36;
  drawRoundedRect(ctx, W / 2 - 36, vsY, 72, 72, 10);
  ctx.fillStyle = "#D20A0A";
  ctx.fill();
  ctx.font = `900 30px 'Arial Black', Arial, sans-serif`;
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("VS", W / 2, vsY + 36);
  ctx.textBaseline = "alphabetic";

  // ── Main event fighter names ──────────────────────────────────────────────────
  if (mainFight) {
    const f1Picked = mainPred?.pickedWinner === mainFight.fighter1Name;
    const f2Picked = mainPred?.pickedWinner === mainFight.fighter2Name;

    // Fighter 1 — last name large, left aligned
    const f1Last = lastName(mainFight.fighter1Name);
    const f1Size = fitText(ctx, f1Last, W / 2 - 60, 88, 40);
    ctx.font = `900 ${f1Size}px 'Arial Black', Arial, sans-serif`;
    ctx.fillStyle = f1Picked ? "#C9A84C" : mainPred ? "#555555" : "#FFFFFF";
    ctx.textAlign = "left";
    ctx.fillText(f1Last, PAD, HERO_H - 90);

    // Fighter 1 first name
    const f1First = mainFight.fighter1Name.split(" ").slice(0, -1).join(" ").toUpperCase();
    ctx.font = `600 22px Arial, sans-serif`;
    ctx.fillStyle = f1Picked ? "#C9A84C" : mainPred ? "#444444" : "#888888";
    ctx.textAlign = "left";
    ctx.fillText(f1First, PAD, HERO_H - 58);

    // Fighter 1 pick indicator
    if (f1Picked) {
      ctx.font = `bold 20px Arial, sans-serif`;
      ctx.fillStyle = "#C9A84C";
      ctx.fillText("✓ MY PICK", PAD, HERO_H - 30);
    }

    // Fighter 2 — last name large, right aligned
    const f2Last = lastName(mainFight.fighter2Name);
    const f2Size = fitText(ctx, f2Last, W / 2 - 60, 88, 40);
    ctx.font = `900 ${f2Size}px 'Arial Black', Arial, sans-serif`;
    ctx.fillStyle = f2Picked ? "#C9A84C" : mainPred ? "#555555" : "#FFFFFF";
    ctx.textAlign = "right";
    ctx.fillText(f2Last, W - PAD, HERO_H - 90);

    // Fighter 2 first name
    const f2First = mainFight.fighter2Name.split(" ").slice(0, -1).join(" ").toUpperCase();
    ctx.font = `600 22px Arial, sans-serif`;
    ctx.fillStyle = f2Picked ? "#C9A84C" : mainPred ? "#444444" : "#888888";
    ctx.textAlign = "right";
    ctx.fillText(f2First, W - PAD, HERO_H - 58);

    // Fighter 2 pick indicator
    if (f2Picked) {
      ctx.font = `bold 20px Arial, sans-serif`;
      ctx.fillStyle = "#C9A84C";
      ctx.textAlign = "right";
      ctx.fillText("MY PICK ✓", W - PAD, HERO_H - 30);
    }

    // Main event label
    const mainLabel = mainFight.isTitleFight ? "TITLE FIGHT" : "MAIN EVENT";
    ctx.font = `bold 16px Arial, sans-serif`;
    ctx.fillStyle = "#D20A0A";
    ctx.textAlign = "center";
    ctx.fillText(`◆ ${mainLabel} ◆`, W / 2, HERO_H - 30);

    // Weight class
    if (mainFight.weightClass) {
      ctx.font = `500 18px Arial, sans-serif`;
      ctx.fillStyle = "#666666";
      ctx.textAlign = "center";
      ctx.fillText(mainFight.weightClass.toUpperCase(), W / 2, HERO_H - 8);
    }
  }

  // ── FIGHT CARD SECTION ───────────────────────────────────────────────────────
  let rowY = HERO_H + SECTION_HEADER_H;

  // Section header
  ctx.font = `bold 20px Arial, sans-serif`;
  ctx.fillStyle = "#666666";
  ctx.textAlign = "left";
  ctx.fillText("FULL CARD PICKS", PAD, HERO_H + 34);

  // Thin gold divider
  ctx.strokeStyle = "#C9A84C";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, HERO_H + 40);
  ctx.lineTo(W - PAD, HERO_H + 40);
  ctx.stroke();

  for (const fight of fights) {
    const pred = fightsWithPreds.find((f) => f.id === fight.id)?.userPrediction;
    const f1Picked = !!pred && pred.pickedWinner === fight.fighter1Name;
    const f2Picked = !!pred && pred.pickedWinner === fight.fighter2Name;
    const isCorrect = pred?.status === "correct";
    const isWrong = pred?.status === "wrong";

    // Row background
    drawRoundedRect(ctx, PAD, rowY, W - PAD * 2, ROW_H, 12);
    ctx.fillStyle = fight.isMainEvent ? "#1C1810" : "#111111";
    ctx.fill();

    // Main event gold border
    if (fight.isMainEvent) {
      ctx.strokeStyle = "rgba(201,168,76,0.25)";
      ctx.lineWidth = 1.5;
      drawRoundedRect(ctx, PAD, rowY, W - PAD * 2, ROW_H, 12);
      ctx.stroke();
    }

    const innerX = PAD + 18;
    const innerW = W - PAD * 2 - 36;
    const rowMid = rowY + ROW_H / 2;

    // ── Fighter 1 (left) ──
    ctx.font = `${f1Picked ? "900" : "600"} 24px 'Arial Black', Arial, sans-serif`;
    ctx.fillStyle = f1Picked ? "#C9A84C" : (pred && !f1Picked) ? "#444444" : "#BBBBBB";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    // Truncate name to fit
    let f1Display = fight.fighter1Name;
    while (ctx.measureText(f1Display).width > innerW * 0.38 && f1Display.length > 4) {
      f1Display = f1Display.slice(0, -1);
    }
    if (f1Display !== fight.fighter1Name) f1Display += "…";
    ctx.fillText(f1Display, innerX, rowMid - 6);

    // Record
    if (fight.fighter1Record) {
      ctx.font = `400 14px Arial, sans-serif`;
      ctx.fillStyle = "#444444";
      ctx.fillText(fight.fighter1Record, innerX, rowMid + 14);
    }

    // Pick marker
    if (f1Picked) {
      ctx.font = `bold 18px Arial, sans-serif`;
      ctx.fillStyle = "#C9A84C";
      ctx.fillText("✓", innerX + ctx.measureText(f1Display).width + 8, rowMid - 6);
    } else if (pred && !f1Picked) {
      ctx.font = `bold 18px Arial, sans-serif`;
      ctx.fillStyle = "#D20A0A";
      ctx.fillText("✗", innerX + ctx.measureText(f1Display).width + 8, rowMid - 6);
    }

    // ── VS center ──
    ctx.font = `bold 14px Arial, sans-serif`;
    ctx.fillStyle = "#333333";
    ctx.textAlign = "center";
    ctx.fillText("VS", W / 2, rowMid);

    // ── Fighter 2 (right) ──
    ctx.font = `${f2Picked ? "900" : "600"} 24px 'Arial Black', Arial, sans-serif`;
    ctx.fillStyle = f2Picked ? "#C9A84C" : (pred && !f2Picked) ? "#444444" : "#BBBBBB";
    ctx.textAlign = "right";

    let f2Display = fight.fighter2Name;
    while (ctx.measureText(f2Display).width > innerW * 0.38 && f2Display.length > 4) {
      f2Display = f2Display.slice(0, -1);
    }
    if (f2Display !== fight.fighter2Name) f2Display += "…";
    ctx.fillText(f2Display, innerX + innerW, rowMid - 6);

    if (fight.fighter2Record) {
      ctx.font = `400 14px Arial, sans-serif`;
      ctx.fillStyle = "#444444";
      ctx.textAlign = "right";
      ctx.fillText(fight.fighter2Record, innerX + innerW, rowMid + 14);
    }

    // Pick marker
    if (f2Picked) {
      ctx.font = `bold 18px Arial, sans-serif`;
      ctx.fillStyle = "#C9A84C";
      ctx.textAlign = "right";
      ctx.fillText("✓", innerX + innerW - ctx.measureText(f2Display).width - 8, rowMid - 6);
    } else if (pred && !f2Picked) {
      ctx.font = `bold 18px Arial, sans-serif`;
      ctx.fillStyle = "#D20A0A";
      ctx.textAlign = "right";
      ctx.fillText("✗", innerX + innerW - ctx.measureText(f2Display).width - 8, rowMid - 6);
    }

    // ── Method badge ──
    if (pred?.pickedMethod) {
      const methodLabel =
        pred.pickedMethod === "tko_ko" ? "TKO/KO" :
        pred.pickedMethod === "submission" ? "SUB" : "DEC";
      const badgeColor = isCorrect ? "#22c55e" : isWrong ? "#ef4444" : "#C9A84C";
      const badgeBg = isCorrect ? "rgba(34,197,94,0.12)" : isWrong ? "rgba(239,68,68,0.12)" : "rgba(201,168,76,0.12)";
      ctx.font = `bold 13px Arial, sans-serif`;
      ctx.textAlign = "center";
      const bw = Math.max(ctx.measureText(methodLabel).width + 18, 60);
      const bh = 26;
      const bx = W / 2 - bw / 2;
      const by = rowMid + 18;
      drawRoundedRect(ctx, bx, by, bw, bh, 6);
      ctx.fillStyle = badgeBg;
      ctx.fill();
      ctx.strokeStyle = badgeColor;
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, bx, by, bw, bh, 6);
      ctx.stroke();
      ctx.fillStyle = badgeColor;
      ctx.textBaseline = "middle";
      ctx.fillText(methodLabel, W / 2, by + bh / 2);
      ctx.textBaseline = "alphabetic";
    }

    // No pick
    if (!pred) {
      ctx.font = `400 14px Arial, sans-serif`;
      ctx.fillStyle = "#2A2A2A";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("— no pick —", W / 2, rowMid);
      ctx.textBaseline = "alphabetic";
    }

    rowY += ROW_H + ROW_GAP;
  }

  // ── FOOTER ───────────────────────────────────────────────────────────────────
  const footerY = rowY + 16;

  ctx.strokeStyle = "#1E1E1E";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, footerY);
  ctx.lineTo(W - PAD, footerY);
  ctx.stroke();

  ctx.font = `bold 28px 'Arial Black', Arial, sans-serif`;
  ctx.fillStyle = "#C9A84C";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(`@${username}`, PAD, footerY + 36);

  const pickCount = fightsWithPreds.filter((f) => f.userPrediction).length;
  ctx.font = `500 20px Arial, sans-serif`;
  ctx.fillStyle = "#444444";
  ctx.textAlign = "center";
  ctx.fillText(`${pickCount}/${fights.length} picks made`, W / 2, footerY + 36);

  ctx.font = `500 20px Arial, sans-serif`;
  ctx.fillStyle = "#333333";
  ctx.textAlign = "right";
  ctx.fillText("fightcred.app", W - PAD, footerY + 36);

  ctx.textBaseline = "alphabetic";

  // ── Gold bottom bar ───────────────────────────────────────────────────────────
  ctx.fillStyle = "#C9A84C";
  ctx.fillRect(0, H - 7, W, 7);

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
      } catch { /* fall through to download */ }
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
            className="bg-[#1A1A1A] border border-[#333] rounded-2xl overflow-hidden max-w-sm w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#333] flex-shrink-0">
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

            {/* Scrollable image preview */}
            <div className="p-3 overflow-y-auto flex-1">
              <img
                src={imageUrl}
                alt="Your picks card"
                className="w-full rounded-xl border border-[#333]"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-3 flex-shrink-0 border-t border-[#222]">
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
