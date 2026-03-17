import type { Gender, TeamStats } from "./types";
import { readCSV } from "./parse-kaggle";

const TARGET_SEASON = 2026;

interface GameRow {
  wTeamId: number;
  lTeamId: number;
  wScore: number;
  lScore: number;
  wFGA: number;
  wFGM3: number; // Not used directly but kept for clarity
  wFGA3: number;
  wFTA: number;
  wOR: number;
  wTO: number;
  lFGA: number;
  lFGA3: number;
  lFTA: number;
  lOR: number;
  lTO: number;
}

// Possessions formula: FGA - OR + TO + 0.475 * FTA
function calcPossessions(fga: number, or: number, to: number, fta: number): number {
  return fga - or + to + 0.475 * fta;
}

interface TeamAccumulator {
  wins: number;
  losses: number;
  totalPointsScored: number;
  totalPointsAllowed: number;
  totalPossessions: number;
  margins: number[];
}

function createAccumulator(): TeamAccumulator {
  return {
    wins: 0,
    losses: 0,
    totalPointsScored: 0,
    totalPointsAllowed: 0,
    totalPossessions: 0,
    margins: [],
  };
}

function stdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function computeTeamStats(gender: Gender): Map<number, TeamStats> {
  const filename = `${gender}RegularSeasonDetailedResults.csv`;
  const rows = readCSV(filename);
  if (rows.length < 2) return new Map();

  const headers = rows[0];
  const idx = (name: string) => headers.indexOf(name);

  const accumulators = new Map<number, TeamAccumulator>();

  const getOrCreate = (teamId: number): TeamAccumulator => {
    if (!accumulators.has(teamId)) {
      accumulators.set(teamId, createAccumulator());
    }
    return accumulators.get(teamId)!;
  };

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const season = parseInt(row[idx("Season")]);
    if (season !== TARGET_SEASON) continue;

    const wTeamId = parseInt(row[idx("WTeamID")]);
    const lTeamId = parseInt(row[idx("LTeamID")]);
    const wScore = parseInt(row[idx("WScore")]);
    const lScore = parseInt(row[idx("LScore")]);

    const wFGA = parseInt(row[idx("WFGA")]);
    const wFTA = parseInt(row[idx("WFTA")]);
    const wOR = parseInt(row[idx("WOR")]);
    const wTO = parseInt(row[idx("WTO")]);

    const lFGA = parseInt(row[idx("LFGA")]);
    const lFTA = parseInt(row[idx("LFTA")]);
    const lOR = parseInt(row[idx("LOR")]);
    const lTO = parseInt(row[idx("LTO")]);

    const wPoss = calcPossessions(wFGA, wOR, wTO, wFTA);
    const lPoss = calcPossessions(lFGA, lOR, lTO, lFTA);
    const avgPoss = (wPoss + lPoss) / 2;

    // Winner stats
    const wAcc = getOrCreate(wTeamId);
    wAcc.wins += 1;
    wAcc.totalPointsScored += wScore;
    wAcc.totalPointsAllowed += lScore;
    wAcc.totalPossessions += avgPoss;
    wAcc.margins.push(wScore - lScore);

    // Loser stats
    const lAcc = getOrCreate(lTeamId);
    lAcc.losses += 1;
    lAcc.totalPointsScored += lScore;
    lAcc.totalPointsAllowed += wScore;
    lAcc.totalPossessions += avgPoss;
    lAcc.margins.push(lScore - wScore);
  }

  const result = new Map<number, TeamStats>();

  for (const [teamId, acc] of accumulators.entries()) {
    const gamesPlayed = acc.wins + acc.losses;
    if (gamesPlayed === 0) continue;

    const avgPossPerGame = acc.totalPossessions / gamesPlayed;
    const adjOE = avgPossPerGame > 0
      ? (acc.totalPointsScored / acc.totalPossessions) * 100
      : 0;
    const adjDE = avgPossPerGame > 0
      ? (acc.totalPointsAllowed / acc.totalPossessions) * 100
      : 0;

    result.set(teamId, {
      teamId,
      wins: acc.wins,
      losses: acc.losses,
      adjOE: Math.round(adjOE * 10) / 10,
      adjDE: Math.round(adjDE * 10) / 10,
      adjTempo: Math.round(avgPossPerGame * 10) / 10,
      volatility: Math.round(stdDev(acc.margins) * 10) / 10,
      gamesPlayed,
    });
  }

  return result;
}

export function defaultStats(teamId: number): TeamStats {
  return {
    teamId,
    wins: 0,
    losses: 0,
    adjOE: 100,
    adjDE: 100,
    adjTempo: 68,
    volatility: 10,
    gamesPlayed: 0,
  };
}
