import type { Gender, UpsetRates, TeamExperience } from "./types";
import { readCSV } from "./parse-kaggle";

// Parse seed number from a seed code like "W01", "X16a", "Z11b"
function parseSeedNumber(seedCode: string): number {
  const match = seedCode.slice(1).match(/^(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

interface SeedRow {
  season: number;
  seed: string;
  teamId: number;
}

interface ResultRow {
  season: number;
  wTeamId: number;
  lTeamId: number;
}

function loadSeeds(gender: Gender): SeedRow[] {
  const rows = readCSV(`${gender}NCAATourneySeeds.csv`);
  if (rows.length < 2) return [];
  const headers = rows[0];
  const idxSeason = headers.indexOf("Season");
  const idxSeed = headers.indexOf("Seed");
  const idxTeam = headers.indexOf("TeamID");

  return rows.slice(1).map((row) => ({
    season: parseInt(row[idxSeason]),
    seed: row[idxSeed],
    teamId: parseInt(row[idxTeam]),
  }));
}

function loadResults(gender: Gender): ResultRow[] {
  const rows = readCSV(`${gender}NCAATourneyCompactResults.csv`);
  if (rows.length < 2) return [];
  const headers = rows[0];
  const idxSeason = headers.indexOf("Season");
  const idxWTeam = headers.indexOf("WTeamID");
  const idxLTeam = headers.indexOf("LTeamID");

  return rows.slice(1).map((row) => ({
    season: parseInt(row[idxSeason]),
    wTeamId: parseInt(row[idxWTeam]),
    lTeamId: parseInt(row[idxLTeam]),
  }));
}

export function computeUpsetRates(gender: Gender): UpsetRates {
  const seedRows = loadSeeds(gender);
  const results = loadResults(gender);

  // Build lookup: season+teamId -> seed number
  const seedLookup = new Map<string, number>();
  for (const s of seedRows) {
    const key = `${s.season}_${s.teamId}`;
    const num = parseSeedNumber(s.seed);
    // If a team appears multiple times (First Four), keep the base seed
    if (!seedLookup.has(key) || seedLookup.get(key)! > num) {
      seedLookup.set(key, num);
    }
  }

  // Count matchups and upsets per seed pair
  // upset = higher seed (worse) team beats lower seed (better) team
  const matchupCount: Record<string, number> = {};
  const upsetCount: Record<string, number> = {};

  for (const result of results) {
    const wSeed = seedLookup.get(`${result.season}_${result.wTeamId}`);
    const lSeed = seedLookup.get(`${result.season}_${result.lTeamId}`);

    if (wSeed === undefined || lSeed === undefined) continue;

    // In NCAA tournament, seeds 1-16 where 1 is best
    // Upset happens when winner has higher seed number than loser
    const higherSeed = Math.max(wSeed, lSeed);
    const lowerSeed = Math.min(wSeed, lSeed);

    // Only track expected matchups (not same-seed)
    if (higherSeed === lowerSeed) continue;

    const key = `${lowerSeed}v${higherSeed}`;
    matchupCount[key] = (matchupCount[key] ?? 0) + 1;

    // Winner was the higher-seeded (worse) team = upset
    if (wSeed > lSeed) {
      upsetCount[key] = (upsetCount[key] ?? 0) + 1;
    }
  }

  const upsetRates: UpsetRates = {};
  for (const key of Object.keys(matchupCount)) {
    const total = matchupCount[key];
    const upsets = upsetCount[key] ?? 0;
    upsetRates[key] = Math.round((upsets / total) * 1000) / 1000;
  }

  return upsetRates;
}

export function computeTournamentExperience(gender: Gender): TeamExperience {
  const seedRows = loadSeeds(gender);

  const experienceCount: TeamExperience = {};
  const seenThisSeason = new Set<string>();

  for (const s of seedRows) {
    // Count each program's appearances (once per season)
    const key = `${s.season}_${s.teamId}`;
    if (seenThisSeason.has(key)) continue;
    seenThisSeason.add(key);

    experienceCount[s.teamId] = (experienceCount[s.teamId] ?? 0) + 1;
  }

  return experienceCount;
}
