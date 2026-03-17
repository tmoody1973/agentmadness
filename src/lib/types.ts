// NOTE: The import below requires Convex codegen to have run (`npx convex dev`).
// Run `npx convex dev` once to generate the _generated/dataModel.d.ts file.
import type { Doc } from "../../convex/_generated/dataModel";

export type Tournament = Doc<"tournaments">;
export type Team = Doc<"teams">;
export type Game = Doc<"games">;

export type TournamentStatus = "ready" | "simulating" | "paused" | "completed";
export type GameStatus = "pending" | "simulating" | "completed";
export type Gender = "men" | "women";

export type Round =
  | "FIRST_FOUR"
  | "R64"
  | "R32"
  | "S16"
  | "E8"
  | "F4"
  | "CHAMP";

export const ROUND_ORDER: Round[] = [
  "FIRST_FOUR",
  "R64",
  "R32",
  "S16",
  "E8",
  "F4",
  "CHAMP",
];

export const ROUND_LABELS: Record<Round, string> = {
  FIRST_FOUR: "First Four",
  R64: "Round of 64",
  R32: "Round of 32",
  S16: "Sweet 16",
  E8: "Elite 8",
  F4: "Final Four",
  CHAMP: "Championship",
};

export const SEED_COLORS = {
  favorites: "#3B82F6",    // 1-4 blue
  contenders: "#00E5A0",   // 5-8 teal
  dangerous: "#FFB800",    // 9-12 gold
  underdogs: "#FF3B5C",    // 13-16 hot pink
} as const;

export function getSeedColor(seed: number): string {
  if (seed <= 4) return SEED_COLORS.favorites;
  if (seed <= 8) return SEED_COLORS.contenders;
  if (seed <= 12) return SEED_COLORS.dangerous;
  return SEED_COLORS.underdogs;
}

export interface SimulationResult {
  winner: string;
  loser: string;
  winnerScore: number;
  loserScore: number;
  isUpset: boolean;
  upsetMagnitude: number;
  mvp: string;
  keyMoment: string;
  gameNarrative: string;
  winProbability: number;
}
