import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatOdds(odds: number | null | undefined): string {
  if (odds == null) return "N/A";
  return odds > 0 ? `+${odds}` : `${odds}`;
}

export function oddsToImpliedProb(odds: number): number {
  if (odds > 0) return 100 / (odds + 100);
  return Math.abs(odds) / (Math.abs(odds) + 100);
}

export function isFavorite(odds: number | null | undefined): boolean {
  return odds != null && odds < 0;
}

export function formatRecord(record: string | null | undefined): string {
  return record ?? "0-0-0";
}

export function getTierColor(tier: string): string {
  switch (tier) {
    case "goat": return "text-yellow-400";
    case "champion": return "text-amber-500";
    case "contender": return "text-blue-400";
    default: return "text-gray-400";
  }
}

export function getTierLabel(tier: string): string {
  switch (tier) {
    case "goat": return "G.O.A.T.";
    case "champion": return "CHAMPION";
    case "contender": return "CONTENDER";
    default: return "ROOKIE";
  }
}

export function getTierBadgeClass(tier: string): string {
  switch (tier) {
    case "goat": return "bg-yellow-400/20 text-yellow-400 border border-yellow-400/40";
    case "champion": return "bg-amber-500/20 text-amber-400 border border-amber-500/40";
    case "contender": return "bg-blue-500/20 text-blue-400 border border-blue-500/40";
    default: return "bg-gray-500/20 text-gray-400 border border-gray-500/40";
  }
}

export function getMethodLabel(method: string | null | undefined): string {
  switch (method) {
    case "tko_ko": return "TKO/KO";
    case "submission": return "SUB";
    case "decision": return "DEC";
    case "draw": return "DRAW";
    case "nc": return "NC";
    default: return "—";
  }
}

export function getCardSectionLabel(section: string): string {
  switch (section) {
    case "main": return "MAIN CARD";
    case "prelim": return "PRELIMS";
    case "early_prelim": return "EARLY PRELIMS";
    default: return section.toUpperCase();
  }
}
