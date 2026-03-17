import * as fs from "fs";
import * as path from "path";
import type { Gender, TeamStats } from "./types";
import { DATA_DIR } from "./parse-kaggle";

const TARGET_SEASON = 2026;

// Recency weighting: weight = exp(dayNum / maxDayNum * 2)
// Early-season games (low dayNum) ~ exp(0) = 1
// Late-season games (high dayNum) ~ exp(2) ≈ 7.4x more weight

function calcPossessions(fga: number, or: number, to: number, fta: number): number {
  return fga - or + to + 0.475 * fta;
}

function stdDev(values: number[], weights: number[]): number {
  if (values.length === 0) return 0;
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  if (totalWeight === 0) return 0;
  const mean = values.reduce((sum, v, i) => sum + v * weights[i], 0) / totalWeight;
  const variance =
    values.reduce((sum, v, i) => sum + weights[i] * (v - mean) ** 2, 0) / totalWeight;
  return Math.sqrt(variance);
}

interface WeightedAccumulator {
  wins: number;
  losses: number;
  weightedPointsScored: number;
  weightedPointsAllowed: number;
  weightedPossessions: number;
  totalWeight: number;
  margins: number[];
  marginWeights: number[];
}

function createAccumulator(): WeightedAccumulator {
  return {
    wins: 0,
    losses: 0,
    weightedPointsScored: 0,
    weightedPointsAllowed: 0,
    weightedPossessions: 0,
    totalWeight: 0,
    margins: [],
    marginWeights: [],
  };
}

export function computeWeightedTeamStats(gender: Gender): Map<number, TeamStats> {
  const filename = `${gender}RegularSeasonDetailedResults.csv`;
  const filepath = path.join(DATA_DIR, filename);

  const raw = fs.readFileSync(filepath, "utf-8");
  const lines = raw.split("\n").filter((l) => l.trim().length > 0);

  if (lines.length < 2) return new Map();

  const headers = lines[0].split(",").map((h) => h.trim());
  const idx = (name: string) => headers.indexOf(name);

  // First pass: find max DayNum for 2026 to compute relative weights
  let maxDayNum = 1;

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    const season = parseInt(cols[idx("Season")], 10);
    if (season !== TARGET_SEASON) continue;
    const dayNum = parseInt(cols[idx("DayNum")], 10);
    if (!isNaN(dayNum) && dayNum > maxDayNum) {
      maxDayNum = dayNum;
    }
  }

  const accumulators = new Map<number, WeightedAccumulator>();

  const getOrCreate = (teamId: number): WeightedAccumulator => {
    if (!accumulators.has(teamId)) {
      accumulators.set(teamId, createAccumulator());
    }
    return accumulators.get(teamId)!;
  };

  // Second pass: accumulate stats with recency weights
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    const season = parseInt(cols[idx("Season")], 10);
    if (season !== TARGET_SEASON) continue;

    const dayNum = parseInt(cols[idx("DayNum")], 10);
    const wTeamId = parseInt(cols[idx("WTeamID")], 10);
    const lTeamId = parseInt(cols[idx("LTeamID")], 10);
    const wScore = parseInt(cols[idx("WScore")], 10);
    const lScore = parseInt(cols[idx("LScore")], 10);

    const wFGA = parseInt(cols[idx("WFGA")], 10);
    const wFTA = parseInt(cols[idx("WFTA")], 10);
    const wOR = parseInt(cols[idx("WOR")], 10);
    const wTO = parseInt(cols[idx("WTO")], 10);

    const lFGA = parseInt(cols[idx("LFGA")], 10);
    const lFTA = parseInt(cols[idx("LFTA")], 10);
    const lOR = parseInt(cols[idx("LOR")], 10);
    const lTO = parseInt(cols[idx("LTO")], 10);

    // Recency weight: exp(dayNum / maxDayNum * 2)
    const weight = Math.exp((dayNum / maxDayNum) * 2);

    const wPoss = calcPossessions(wFGA, wOR, wTO, wFTA);
    const lPoss = calcPossessions(lFGA, lOR, lTO, lFTA);
    const avgPoss = (wPoss + lPoss) / 2;

    // Winner stats
    const wAcc = getOrCreate(wTeamId);
    wAcc.wins += 1;
    wAcc.weightedPointsScored += wScore * weight;
    wAcc.weightedPointsAllowed += lScore * weight;
    wAcc.weightedPossessions += avgPoss * weight;
    wAcc.totalWeight += weight;
    wAcc.margins.push(wScore - lScore);
    wAcc.marginWeights.push(weight);

    // Loser stats
    const lAcc = getOrCreate(lTeamId);
    lAcc.losses += 1;
    lAcc.weightedPointsScored += lScore * weight;
    lAcc.weightedPointsAllowed += wScore * weight;
    lAcc.weightedPossessions += avgPoss * weight;
    lAcc.totalWeight += weight;
    lAcc.margins.push(lScore - wScore);
    lAcc.marginWeights.push(weight);
  }

  const result = new Map<number, TeamStats>();

  for (const [teamId, acc] of accumulators.entries()) {
    const gamesPlayed = acc.wins + acc.losses;
    if (gamesPlayed === 0) continue;

    const adjOE =
      acc.weightedPossessions > 0
        ? (acc.weightedPointsScored / acc.weightedPossessions) * 100
        : 0;
    const adjDE =
      acc.weightedPossessions > 0
        ? (acc.weightedPointsAllowed / acc.weightedPossessions) * 100
        : 0;
    const adjTempo = acc.totalWeight > 0
      ? acc.weightedPossessions / acc.totalWeight
      : 0;

    result.set(teamId, {
      teamId,
      wins: acc.wins,
      losses: acc.losses,
      adjOE: Math.round(adjOE * 10) / 10,
      adjDE: Math.round(adjDE * 10) / 10,
      adjTempo: Math.round(adjTempo * 10) / 10,
      volatility: Math.round(stdDev(acc.margins, acc.marginWeights) * 10) / 10,
      gamesPlayed,
    });
  }

  return result;
}
