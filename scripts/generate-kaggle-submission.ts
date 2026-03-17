import * as fs from "fs";
import * as path from "path";
import { computeTeamStats } from "./lib/compute-stats";
import { computeWeightedTeamStats } from "./lib/compute-stats-weighted";
import { computeBradleyTerry, btWinProbability } from "./lib/bradley-terry";
import { parseConfTourneyData } from "./lib/conf-tourney";
import { DATA_DIR } from "./lib/parse-kaggle";
import type { TeamStats } from "./lib/types";
import type { ConfTourneyData } from "./lib/conf-tourney";

const TARGET_SEASON = 2026;

// Ensemble weights — tuned for log loss
const W_KENPOM = 0.50;
const W_BT = 0.30;
const W_SEED = 0.10;
const W_CONF = 0.05;
const W_RECENCY = 0.05;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function parseTournamentSeeds(): Map<number, number> {
  const result = new Map<number, number>();

  for (const filename of ["MNCAATourneySeeds.csv", "WNCAATourneySeeds.csv"]) {
    const filepath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filepath)) {
      console.warn(`Warning: ${filename} not found`);
      continue;
    }

    const raw = fs.readFileSync(filepath, "utf-8");
    const lines = raw.split("\n");
    if (lines.length === 0) continue;

    const headers = lines[0].split(",").map((h) => h.trim());
    const seasonIdx = headers.indexOf("Season");
    const seedIdx = headers.indexOf("Seed");
    const teamIdx = headers.indexOf("TeamID");

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.split(",");
      const season = parseInt(cols[seasonIdx], 10);
      if (season !== TARGET_SEASON) continue;

      const seedCode = cols[seedIdx]?.trim() ?? "";
      const teamId = parseInt(cols[teamIdx], 10);

      // Extract numeric seed from codes like "W01", "X16a", "Z11b"
      const match = seedCode.slice(1).match(/^(\d+)/);
      const seedNum = match ? parseInt(match[1], 10) : 8;

      if (!isNaN(teamId)) {
        result.set(teamId, seedNum);
      }
    }
  }

  return result;
}

function kenpomWinProbability(effMargin1: number, effMargin2: number): number {
  return 1 / (1 + Math.pow(10, -(effMargin1 - effMargin2) / 11));
}

function ensembleWinProbability(
  teamId1: number,
  teamId2: number,
  weightedStats: Map<number, TeamStats>,
  btStrengthsMen: Map<number, number>,
  btStrengthsWomen: Map<number, number>,
  seeds: Map<number, number>,
  confDataMen: Map<number, ConfTourneyData>,
  confDataWomen: Map<number, ConfTourneyData>,
): number {
  const s1 = weightedStats.get(teamId1);
  const s2 = weightedStats.get(teamId2);

  const effMargin1 = s1 ? s1.adjOE - s1.adjDE : 0;
  const effMargin2 = s2 ? s2.adjOE - s2.adjDE : 0;

  // 1. KenPom logistic (using unweighted stats)
  const pKenPom = kenpomWinProbability(effMargin1, effMargin2);

  // 2. Bradley-Terry — pick correct map based on team ID range
  // Men's IDs: 1100-1499, Women's: 3100-3499
  const isWomen1 = teamId1 >= 3000;
  const isWomen2 = teamId2 >= 3000;
  const btMap1 = isWomen1 ? btStrengthsWomen : btStrengthsMen;
  const btMap2 = isWomen2 ? btStrengthsWomen : btStrengthsMen;
  const bt1 = btMap1.get(teamId1) ?? 1.0;
  const bt2 = btMap2.get(teamId2) ?? 1.0;
  const pBT = btWinProbability(bt1, bt2);

  // 3. Seed-based (lower seed number = better)
  const seed1 = seeds.get(teamId1) ?? 8.5;
  const seed2 = seeds.get(teamId2) ?? 8.5;
  const pSeed = 1 / (1 + Math.pow(10, (seed1 - seed2) / 5));

  // 4. Conference tournament adjustment
  const confMap1 = isWomen1 ? confDataWomen : confDataMen;
  const confMap2 = isWomen2 ? confDataWomen : confDataMen;
  const c1 = confMap1.get(teamId1);
  const c2 = confMap2.get(teamId2);

  let confAdj = 0;
  if (c1?.isConfChampion && !c2?.isConfChampion) confAdj = 0.03;
  if (c2?.isConfChampion && !c1?.isConfChampion) confAdj = -0.03;

  // 5. Ensemble blend
  // W_RECENCY component: recency is already baked into weightedStats (which use recency-weighted adjOE/adjDE)
  // So we use pKenPom (from recency-weighted stats) for the recency component
  const pEnsemble =
    W_KENPOM * pKenPom +
    W_BT * pBT +
    W_SEED * pSeed +
    W_CONF * (0.5 + confAdj) +
    W_RECENCY * pKenPom;

  return clamp(pEnsemble, 0.01, 0.99);
}

function simpleWinProbability(
  teamId1: number,
  teamId2: number,
  allStats: Map<number, TeamStats>,
): number {
  const stats1 = allStats.get(teamId1);
  const stats2 = allStats.get(teamId2);
  if (!stats1 || !stats2) return 0.5;
  const effMargin1 = stats1.adjOE - stats1.adjDE;
  const effMargin2 = stats2.adjOE - stats2.adjDE;
  return clamp(kenpomWinProbability(effMargin1, effMargin2), 0.01, 0.99);
}

function printStats(predictions: number[], label: string): void {
  if (predictions.length === 0) {
    console.log(`  ${label}: no predictions`);
    return;
  }

  const sorted = [...predictions].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const mean = predictions.reduce((a, b) => a + b, 0) / predictions.length;
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];

  const above90 = predictions.filter((p) => p > 0.9).length;
  const below10 = predictions.filter((p) => p < 0.1).length;
  const near50 = predictions.filter((p) => p >= 0.45 && p <= 0.55).length;

  console.log(`  ${label}:`);
  console.log(`    min=${min.toFixed(4)}, max=${max.toFixed(4)}, mean=${mean.toFixed(4)}, median=${median.toFixed(4)}`);
  console.log(`    >0.9: ${above90}, <0.1: ${below10}, near 0.5 (±0.05): ${near50}`);
}

function main(): void {
  console.log("=== NCAA March Machine Learning Mania 2026 — Ensemble Submission ===\n");

  // --- Load simple stats (for comparison output) ---
  console.log("Computing simple team stats (for comparison)...");
  const menStatsSimple = computeTeamStats("M");
  const womenStatsSimple = computeTeamStats("W");
  const allStatsSimple = new Map([...menStatsSimple, ...womenStatsSimple]);
  console.log(`  Simple stats: ${allStatsSimple.size} teams\n`);

  // --- Load recency-weighted stats ---
  console.log("Computing recency-weighted team stats...");
  const menStatsWeighted = computeWeightedTeamStats("M");
  const womenStatsWeighted = computeWeightedTeamStats("W");
  const allStatsWeighted = new Map([...menStatsWeighted, ...womenStatsWeighted]);
  console.log(`  Weighted stats: ${allStatsWeighted.size} teams\n`);

  // --- Bradley-Terry models ---
  console.log("Computing Bradley-Terry ratings for men's teams...");
  const { strengths: btMen } = computeBradleyTerry("men");
  console.log(`  Men's BT: ${btMen.size} teams`);

  console.log("Computing Bradley-Terry ratings for women's teams...");
  const { strengths: btWomen } = computeBradleyTerry("women");
  console.log(`  Women's BT: ${btWomen.size} teams\n`);

  // --- Conference tournament data ---
  console.log("Parsing conference tournament data...");
  const confDataMen = parseConfTourneyData("men");
  const confDataWomen = parseConfTourneyData("women");
  const menChamps = Array.from(confDataMen.values()).filter((d) => d.isConfChampion).length;
  const womenChamps = Array.from(confDataWomen.values()).filter((d) => d.isConfChampion).length;
  console.log(`  Men's conf champions identified: ${menChamps}`);
  console.log(`  Women's conf champions identified: ${womenChamps}\n`);

  // --- Tournament seeds ---
  console.log("Parsing tournament seeds...");
  const seeds = parseTournamentSeeds();
  console.log(`  Seeds loaded: ${seeds.size} teams\n`);

  // --- Read sample submission ---
  const samplePath = path.join(DATA_DIR, "SampleSubmissionStage2.csv");
  const raw = fs.readFileSync(samplePath, "utf-8");
  const lines = raw.trim().split("\n");
  const header = lines[0]; // "ID,Pred"

  const ensembleOutput: string[] = [header];
  const simpleOutput: string[] = [header];

  const ensemblePreds: number[] = [];
  const simplePreds: number[] = [];

  let ensembleComputed = 0;
  let ensembleDefaulted = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const id = line.split(",")[0];
    const parts = id.split("_");
    const teamId1 = parseInt(parts[1], 10);
    const teamId2 = parseInt(parts[2], 10);

    // Simple model prediction
    const simplePred = simpleWinProbability(teamId1, teamId2, allStatsSimple);
    simpleOutput.push(`${id},${simplePred.toFixed(6)}`);
    simplePreds.push(simplePred);

    // Ensemble model prediction
    const hasWeightedStats = allStatsWeighted.has(teamId1) && allStatsWeighted.has(teamId2);

    let ensemblePred: number;
    if (hasWeightedStats) {
      ensemblePred = ensembleWinProbability(
        teamId1,
        teamId2,
        allStatsWeighted,
        btMen,
        btWomen,
        seeds,
        confDataMen,
        confDataWomen,
      );
      ensembleComputed++;
    } else {
      // Fall back to simple if no weighted stats
      ensemblePred = simplePred;
      ensembleDefaulted++;
    }

    ensembleOutput.push(`${id},${ensemblePred.toFixed(6)}`);
    ensemblePreds.push(ensemblePred);
  }

  // --- Write outputs ---
  const outDir = path.resolve(__dirname, "output");
  fs.mkdirSync(outDir, { recursive: true });

  const ensemblePath = path.join(outDir, "kaggle-submission-stage2.csv");
  fs.writeFileSync(ensemblePath, ensembleOutput.join("\n") + "\n");

  const simplePath = path.join(outDir, "kaggle-submission-stage2-simple.csv");
  fs.writeFileSync(simplePath, simpleOutput.join("\n") + "\n");

  // --- Print summary ---
  console.log("=== Output Summary ===\n");
  console.log(`Ensemble submission: ${ensemblePath}`);
  console.log(`  Computed (ensemble): ${ensembleComputed} pairs`);
  console.log(`  Defaulted (no weighted stats): ${ensembleDefaulted} pairs`);
  console.log(`  Total rows: ${ensembleOutput.length - 1}`);
  console.log();
  console.log(`Simple submission: ${simplePath}`);
  console.log(`  Total rows: ${simpleOutput.length - 1}`);
  console.log();
  console.log("=== Prediction Statistics ===\n");
  printStats(ensemblePreds, "Ensemble model");
  console.log();
  printStats(simplePreds, "Simple KenPom model");
  console.log();

  // Verify row count (132133 data rows + 1 header = 132134 total lines)
  const expectedDataRows = 132133;
  // ensembleOutput[0] is the header; data rows start at index 1
  const ensembleDataRows = ensembleOutput.length - 1;
  const simpleDataRows = simpleOutput.length - 1;

  if (ensembleDataRows === expectedDataRows) {
    console.log(`Row count verification: PASSED (${ensembleDataRows} data rows + 1 header)`);
  } else {
    console.warn(`Row count verification: EXPECTED ${expectedDataRows} data rows, GOT ${ensembleDataRows}`);
  }
  if (simpleDataRows === expectedDataRows) {
    console.log(`Simple row count verification: PASSED (${simpleDataRows} data rows + 1 header)`);
  } else {
    console.warn(`Simple row count: EXPECTED ${expectedDataRows} data rows, GOT ${simpleDataRows}`);
  }
}

main();
