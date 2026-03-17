import * as fs from "fs";
import * as path from "path";
import { DATA_DIR } from "./parse-kaggle";

const TARGET_SEASON = 2026;
const NUM_ITERATIONS = 100;

export interface BTResult {
  strengths: Map<number, number>; // teamId → strength rating
}

interface GameRecord {
  winner: number;
  loser: number;
}

function readCompactResults(filename: string): GameRecord[] {
  const filepath = path.join(DATA_DIR, filename);
  const raw = fs.readFileSync(filepath, "utf-8");
  const lines = raw.split("\n");

  if (lines.length === 0) return [];

  const headers = lines[0].split(",").map((h) => h.trim());
  const seasonIdx = headers.indexOf("Season");
  const wTeamIdx = headers.indexOf("WTeamID");
  const lTeamIdx = headers.indexOf("LTeamID");

  const records: GameRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(",");
    const season = parseInt(cols[seasonIdx], 10);
    if (season !== TARGET_SEASON) continue;

    const winner = parseInt(cols[wTeamIdx], 10);
    const loser = parseInt(cols[lTeamIdx], 10);

    if (!isNaN(winner) && !isNaN(loser)) {
      records.push({ winner, loser });
    }
  }

  return records;
}

export function computeBradleyTerry(gender: "men" | "women"): BTResult {
  const prefix = gender === "men" ? "M" : "W";
  const games = readCompactResults(`${prefix}RegularSeasonCompactResults.csv`);

  if (games.length === 0) {
    return { strengths: new Map() };
  }

  // Collect all unique teams
  const teamSet = new Set<number>();
  for (const g of games) {
    teamSet.add(g.winner);
    teamSet.add(g.loser);
  }
  const teams = Array.from(teamSet);
  const n = teams.length;

  // Initialize strengths to 1.0
  const strengths = new Map<number, number>();
  for (const t of teams) {
    strengths.set(t, 1.0);
  }

  // Precompute wins per team and game list per team
  const winsCount = new Map<number, number>();
  const teamGames = new Map<number, number[]>(); // teamId -> list of opponent indices

  for (const t of teams) {
    winsCount.set(t, 0);
    teamGames.set(t, []);
  }

  for (const g of games) {
    winsCount.set(g.winner, (winsCount.get(g.winner) ?? 0) + 1);
    // Both teams add each other as opponents
    teamGames.get(g.winner)!.push(g.loser);
    teamGames.get(g.loser)!.push(g.winner);
  }

  // Bradley-Terry iterative algorithm
  for (let iter = 0; iter < NUM_ITERATIONS; iter++) {
    const newStrengths = new Map<number, number>();

    for (const team of teams) {
      const wins = winsCount.get(team) ?? 0;
      const opponents = teamGames.get(team) ?? [];

      if (opponents.length === 0) {
        newStrengths.set(team, strengths.get(team) ?? 1.0);
        continue;
      }

      const sTeam = strengths.get(team) ?? 1.0;

      // Expected wins = sum over all games of: strength[team] / (strength[team] + strength[opponent])
      let expectedWins = 0;
      for (const opp of opponents) {
        const sOpp = strengths.get(opp) ?? 1.0;
        expectedWins += sTeam / (sTeam + sOpp);
      }

      if (expectedWins === 0) {
        newStrengths.set(team, sTeam);
      } else {
        newStrengths.set(team, (wins / expectedWins) * sTeam);
      }
    }

    // Normalize so strengths sum to N
    let total = 0;
    for (const s of newStrengths.values()) {
      total += s;
    }
    const scale = n / total;
    for (const [t, s] of newStrengths.entries()) {
      newStrengths.set(t, s * scale);
    }

    // Update strengths in-place by rebuilding the map
    for (const [t, s] of newStrengths.entries()) {
      strengths.set(t, s);
    }
  }

  return { strengths };
}

export function btWinProbability(strengthA: number, strengthB: number): number {
  if (strengthA + strengthB === 0) return 0.5;
  return strengthA / (strengthA + strengthB);
}
