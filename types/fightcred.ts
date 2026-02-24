/**
 * Type-only definitions for FightCred domain models.
 * These mirror the actual database schema types without importing any server code.
 */

// ─── Enums ────────────────────────────────────────────────────────────────────
export type FinishType = "finish" | "decision";
export type MethodType = "tko_ko" | "submission" | "decision" | "draw" | "nc";
export type PredictionStatus = "pending" | "correct" | "wrong" | "partial";
export type EventStatus = "upcoming" | "live" | "completed";
export type FightStatus = "upcoming" | "live" | "completed" | "cancelled";
export type CardSection = "main" | "prelim" | "early_prelim";
export type CredibilityTier = "rookie" | "contender" | "champion" | "goat";

// ─── Database Row Types ───────────────────────────────────────────────────────
export interface User {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
}

export interface UserProfile {
  id: number;
  userId: number;
  username: string;
  displayName: string | null;
  credibilityScore: number;
  tier: CredibilityTier;
  totalPicks: number;
  correctPicks: number;
  correctFinishPicks: number;
  totalFinishPicks: number;
  correctMethodPicks: number;
  totalMethodPicks: number;
  correctUnderdogPicks: number;
  totalUnderdogPicks: number;
  currentStreak: number;
  bestStreak: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Event {
  id: number;
  name: string;
  shortName: string | null;
  eventDate: Date;
  venue: string | null;
  location: string | null;
  status: EventStatus;
  ufcEventId: string | null;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Fight {
  id: number;
  eventId: number;
  fighter1Name: string;
  fighter1Record: string | null;
  fighter1ImageUrl: string | null;
  fighter1Nationality: string | null;
  fighter1Nickname: string | null;
  fighter1RecentResults: string | null;
  fighter1Ranking: string | null;
  fighter2Name: string;
  fighter2Record: string | null;
  fighter2ImageUrl: string | null;
  fighter2Nationality: string | null;
  fighter2Nickname: string | null;
  fighter2RecentResults: string | null;
  fighter2Ranking: string | null;
  weightClass: string | null;
  isTitleFight: boolean;
  isMainEvent: boolean;
  cardSection: CardSection;
  fightOrder: number;
  status: FightStatus;
  winner: string | null;
  finishType: FinishType | null;
  method: MethodType | null;
  round: number | null;
  fightTime: string | null;
  odds1: number | null;
  odds2: number | null;
  scheduledStartTime: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Prediction {
  id: number;
  userId: number;
  fightId: number;
  pickedWinner: string;
  pickedFinishType: FinishType | null;
  pickedMethod: MethodType | null;
  status: PredictionStatus;
  credibilityEarned: number;
  isLocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserFighterStat {
  id: number;
  userId: number;
  fighterName: string;
  totalPicks: number;
  correctPicks: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CredibilityLog {
  id: number;
  userId: number;
  fightId: number;
  predictionId: number;
  winnerPoints: number;
  finishTypePoints: number;
  methodPoints: number;
  bonusPoints: number;
  totalPoints: number;
  breakdown: string | null;
  createdAt: Date;
}

// ─── Computed/Joined Types ────────────────────────────────────────────────────
export interface FightWithPrediction extends Fight {
  prediction?: Prediction | null;
  predictionCount?: number;
  fighter1PickPercent?: number;
}

export interface LeaderboardEntry extends UserProfile {
  rank?: number;
}

export interface EventCredibility {
  userId: number;
  username: string;
  displayName: string | null;
  eventCredibility: number;
  correctPicks: number;
  totalPicks: number;
}

// ─── Tier helpers ─────────────────────────────────────────────────────────────
export const TIER_THRESHOLDS: Record<CredibilityTier, number> = {
  rookie: 0,
  contender: 1000,
  champion: 5000,
  goat: 15000,
};

export const TIER_LABELS: Record<CredibilityTier, string> = {
  rookie: "ROOKIE",
  contender: "CONTENDER",
  champion: "CHAMPION",
  goat: "G.O.A.T.",
};

export const TIER_COLORS: Record<CredibilityTier, string> = {
  rookie: "#9A9A9A",
  contender: "#C0C0C0",
  champion: "#C9A84C",
  goat: "#D20A0A",
};

export function getTierFromScore(score: number): CredibilityTier {
  if (score >= 15000) return "goat";
  if (score >= 5000) return "champion";
  if (score >= 1000) return "contender";
  return "rookie";
}

export function formatOdds(odds: number | null | undefined): string {
  if (odds == null) return "N/A";
  return odds > 0 ? `+${odds}` : `${odds}`;
}
