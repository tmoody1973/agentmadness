import * as fs from "fs";
import * as path from "path";
import { DATA_DIR } from "./parse-kaggle";

const TARGET_SEASON = 2026;

export interface ConfTourneyData {
  confTourneyWins: number;
  confTourneyLosses: number;
  isConfChampion: boolean;
}

interface ConfGame {
  confAbbrev: string;
  dayNum: number;
  winner: number;
  loser: number;
}

function readConfTourneyGames(filename: string): ConfGame[] {
  const filepath = path.join(DATA_DIR, filename);

  if (!fs.existsSync(filepath)) {
    console.warn(`Warning: ${filename} not found`);
    return [];
  }

  const raw = fs.readFileSync(filepath, "utf-8");
  const lines = raw.split("\n");

  if (lines.length === 0) return [];

  const headers = lines[0].split(",").map((h) => h.trim());
  const seasonIdx = headers.indexOf("Season");
  const confIdx = headers.indexOf("ConfAbbrev");
  const dayIdx = headers.indexOf("DayNum");
  const wTeamIdx = headers.indexOf("WTeamID");
  const lTeamIdx = headers.indexOf("LTeamID");

  const games: ConfGame[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(",");
    const season = parseInt(cols[seasonIdx], 10);
    if (season !== TARGET_SEASON) continue;

    const confAbbrev = cols[confIdx]?.trim() ?? "";
    const dayNum = parseInt(cols[dayIdx], 10);
    const winner = parseInt(cols[wTeamIdx], 10);
    const loser = parseInt(cols[lTeamIdx], 10);

    if (!isNaN(winner) && !isNaN(loser) && !isNaN(dayNum)) {
      games.push({ confAbbrev, dayNum, winner, loser });
    }
  }

  return games;
}

export function parseConfTourneyData(gender: "men" | "women"): Map<number, ConfTourneyData> {
  const filename = gender === "men" ? "MConferenceTourneyGames.csv" : "WConferenceTourneyGames.csv";
  const games = readConfTourneyGames(filename);

  if (games.length === 0) {
    return new Map();
  }

  // Track wins/losses per team
  const winsMap = new Map<number, number>();
  const lossesMap = new Map<number, number>();

  // Find the last game (highest DayNum) per conference to identify champions
  // The winner of the highest DayNum game in each conf is the champion
  const lastDayByConf = new Map<string, number>();

  for (const g of games) {
    const current = lastDayByConf.get(g.confAbbrev) ?? 0;
    if (g.dayNum > current) {
      lastDayByConf.set(g.confAbbrev, g.dayNum);
    }
  }

  const champions = new Set<number>();

  for (const g of games) {
    // Accumulate wins
    winsMap.set(g.winner, (winsMap.get(g.winner) ?? 0) + 1);
    // Accumulate losses
    lossesMap.set(g.loser, (lossesMap.get(g.loser) ?? 0) + 1);

    // Champion: winner of the last game in each conference
    const lastDay = lastDayByConf.get(g.confAbbrev) ?? 0;
    if (g.dayNum === lastDay) {
      champions.add(g.winner);
    }
  }

  const result = new Map<number, ConfTourneyData>();

  // Collect all teams that appeared in conf tourney
  const allTeams = new Set<number>();
  for (const g of games) {
    allTeams.add(g.winner);
    allTeams.add(g.loser);
  }

  for (const teamId of allTeams) {
    result.set(teamId, {
      confTourneyWins: winsMap.get(teamId) ?? 0,
      confTourneyLosses: lossesMap.get(teamId) ?? 0,
      isConfChampion: champions.has(teamId),
    });
  }

  return result;
}
