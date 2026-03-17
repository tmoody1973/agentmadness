export type Gender = "M" | "W";

export interface RawTeam {
  teamId: number;
  name: string;
  seed: number;
  seedCode: string; // e.g. "W01", "X16a"
  region: string; // e.g. "East", "South"
  conference: string;
}

export interface TeamStats {
  teamId: number;
  wins: number;
  losses: number;
  adjOE: number; // adjusted offensive efficiency per 100 possessions
  adjDE: number; // adjusted defensive efficiency per 100 possessions
  adjTempo: number; // average possessions per game
  volatility: number; // std dev of scoring margin
  gamesPlayed: number;
}

// Upset rates keyed like "1v16", "5v12" etc.
export type UpsetRates = Record<string, number>;

// teamId -> number of tournament appearances
export type TeamExperience = Record<number, number>;

export interface SlotWiring {
  slot: string;
  strongSeed: string;
  weakSeed: string;
}

export interface BracketTeam extends RawTeam {
  stats: TeamStats;
  tournamentExperience: number;
  keyPlayers: string[];
  styleTraits: string[];
  clutchRating: number; // 1-10
  depthScore: number; // 1-10
  perplexityContext: string;
  netRanking: number;
}

export type Round =
  | "FIRST_FOUR"
  | "R64"
  | "R32"
  | "S16"
  | "E8"
  | "F4"
  | "CHAMP";

export interface BracketGame {
  round: Round;
  region: string;
  bracketSlot: string; // kaggle slot name
  gameOrder: number;
  teamASeedCode: string;
  teamBSeedCode: string;
  nextSlot: string | null; // slot this game feeds into
  nextGameSlot: string | null; // alias for UI wiring
  scheduledTime: string;
  venue: string;
  tvChannel: string;
}

export interface BracketData {
  teams: BracketTeam[];
  games: BracketGame[];
  upsetRates: UpsetRates;
  validation: {
    teamCount: number;
    gameCount: number;
    firstFourCount: number;
    warnings: string[];
  };
}
