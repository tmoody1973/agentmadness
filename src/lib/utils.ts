import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import type { Game, Team } from "./types";

export function getTeamById(
  teams: readonly Team[],
  teamId: string | undefined
): Team | undefined {
  if (!teamId) return undefined;
  return teams.find((t) => t._id === teamId);
}

export function getGamesByRound(
  games: readonly Game[],
  round: string
): readonly Game[] {
  return games
    .filter((g) => g.round === round)
    .sort((a, b) => a.gameOrder - b.gameOrder);
}

export function getGamesByRegion(
  games: readonly Game[],
  region: string
): readonly Game[] {
  return games
    .filter((g) => g.region === region)
    .sort((a, b) => a.gameOrder - b.gameOrder);
}

export function getTeamsByRegion(
  teams: readonly Team[],
  region: string
): readonly Team[] {
  return teams.filter((t) => t.region === region);
}

export function countAliveTeams(teams: readonly Team[]): number {
  return teams.filter((t) => !t.eliminated).length;
}
