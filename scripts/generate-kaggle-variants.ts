import * as fs from "fs";
import * as path from "path";
import { computeTeamStats } from "./lib/compute-stats";
import { computeWeightedTeamStats } from "./lib/compute-stats-weighted";
import { computeBradleyTerry, btWinProbability } from "./lib/bradley-terry";
import { parseConfTourneyData } from "./lib/conf-tourney";

const DATA_DIR = path.resolve(__dirname, "../../DOCS/march-machine-learning-mania-2026");
const OUT_DIR = path.resolve(__dirname, "output");

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function kenPomProb(effA: number, effB: number): number {
  return 1 / (1 + Math.pow(10, -(effA - effB) / 11));
}

// Parse seeds
function parseSeeds(): Map<number, number> {
  const seeds = new Map<number, number>();
  for (const prefix of ["M", "W"]) {
    const file = path.join(DATA_DIR, `${prefix}NCAATourneySeeds.csv`);
    const lines = fs.readFileSync(file, "utf-8").trim().split("\n").slice(1);
    for (const line of lines) {
      const parts = line.split(",");
      if (parts[0] === "2026") {
        const seedNum = parseInt(parts[1].substring(1).replace(/[ab]/, ""));
        seeds.set(parseInt(parts[2]), seedNum);
      }
    }
  }
  return seeds;
}

// Read the sample submission IDs
function readSampleIds(): string[] {
  const file = path.join(DATA_DIR, "SampleSubmissionStage2.csv");
  const lines = fs.readFileSync(file, "utf-8").trim().split("\n");
  return lines.slice(1).map((line) => line.split(",")[0]);
}

// ─── Generate a submission with given parameters ────────────────────────────

interface ModelWeights {
  kenpom: number;
  bt: number;
  seed: number;
  conf: number;
  upsetBoost: number; // 0 = neutral, positive = more upsets, negative = more chalk
}

function generateSubmission(
  ids: string[],
  weights: ModelWeights,
  allStats: Map<number, any>,
  btStrengths: Map<number, number>,
  seeds: Map<number, number>,
  confData: Map<number, any>,
): string[] {
  const output: string[] = ["ID,Pred"];

  for (const id of ids) {
    const parts = id.split("_");
    const teamId1 = parseInt(parts[1]);
    const teamId2 = parseInt(parts[2]);

    const s1 = allStats.get(teamId1);
    const s2 = allStats.get(teamId2);
    const eff1 = s1 ? s1.adjOE - s1.adjDE : 0;
    const eff2 = s2 ? s2.adjOE - s2.adjDE : 0;

    // KenPom
    const pKenPom = kenPomProb(eff1, eff2);

    // Bradley-Terry
    const bt1 = btStrengths.get(teamId1) ?? 1;
    const bt2 = btStrengths.get(teamId2) ?? 1;
    const pBT = btWinProbability(bt1, bt2);

    // Seed-based
    const seed1 = seeds.get(teamId1) ?? 8.5;
    const seed2 = seeds.get(teamId2) ?? 8.5;
    const pSeed = 1 / (1 + Math.pow(10, (seed1 - seed2) / 5));

    // Conf tourney
    const c1 = confData.get(teamId1);
    const c2 = confData.get(teamId2);
    let confAdj = 0;
    if (c1?.isConfChampion && !c2?.isConfChampion) confAdj = 0.03;
    if (c2?.isConfChampion && !c1?.isConfChampion) confAdj = -0.03;

    // Blend
    let pred =
      weights.kenpom * pKenPom +
      weights.bt * pBT +
      weights.seed * pSeed +
      weights.conf * (0.5 + confAdj);

    // Upset boost: push predictions toward 0.5 (more uncertain = more upsets)
    if (weights.upsetBoost !== 0) {
      const boost = weights.upsetBoost;
      // Positive boost: shrink toward 0.5 (more upsets)
      // Negative boost: push away from 0.5 (more chalk)
      pred = pred + (0.5 - pred) * boost;
    }

    pred = clamp(pred, 0.01, 0.99);
    output.push(`${id},${pred.toFixed(6)}`);
  }

  return output;
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("Loading data...");

  // Stats
  const menStats = computeWeightedTeamStats("M");
  const womenStats = computeWeightedTeamStats("W");
  const allStats = new Map([...menStats, ...womenStats]);

  // Bradley-Terry
  const menBT = computeBradleyTerry("men");
  const womenBT = computeBradleyTerry("women");
  const btStrengths = new Map([...menBT.strengths, ...womenBT.strengths]);

  // Seeds
  const seeds = parseSeeds();

  // Conf tourney
  const menConf = parseConfTourneyData("men");
  const womenConf = parseConfTourneyData("women");
  const confData = new Map([...menConf, ...womenConf]);

  // Sample IDs
  const ids = readSampleIds();

  console.log(`Stats: ${allStats.size} teams, BT: ${btStrengths.size} teams, Seeds: ${seeds.size}`);
  console.log(`Generating variants...\n`);

  fs.mkdirSync(OUT_DIR, { recursive: true });

  // ── Variant 1: Upset-heavy (push predictions toward 0.5 by 20%) ──
  const upsetHeavy = generateSubmission(ids, {
    kenpom: 0.50,
    bt: 0.25,
    seed: 0.15,
    conf: 0.10,
    upsetBoost: 0.20, // 20% push toward 0.5
  }, allStats, btStrengths, seeds, confData);

  const upsetPath = path.join(OUT_DIR, "kaggle-upset-heavy.csv");
  fs.writeFileSync(upsetPath, upsetHeavy.join("\n") + "\n");

  const upsetPreds = upsetHeavy.slice(1).map((l) => parseFloat(l.split(",")[1]));
  console.log(`Upset-heavy: ${upsetPreds.length} rows`);
  console.log(`  Range: [${Math.min(...upsetPreds).toFixed(3)}, ${Math.max(...upsetPreds).toFixed(3)}]`);
  console.log(`  Mean: ${(upsetPreds.reduce((a, b) => a + b, 0) / upsetPreds.length).toFixed(4)}`);
  console.log(`  >0.9: ${upsetPreds.filter((p) => p > 0.9).length}, <0.1: ${upsetPreds.filter((p) => p < 0.1).length}`);
  console.log();

  // ── Variant 2: Chalk-heavy (push predictions away from 0.5 by 15%) ──
  const chalkHeavy = generateSubmission(ids, {
    kenpom: 0.55,
    bt: 0.30,
    seed: 0.10,
    conf: 0.05,
    upsetBoost: -0.15, // 15% push away from 0.5
  }, allStats, btStrengths, seeds, confData);

  const chalkPath = path.join(OUT_DIR, "kaggle-chalk-heavy.csv");
  fs.writeFileSync(chalkPath, chalkHeavy.join("\n") + "\n");

  const chalkPreds = chalkHeavy.slice(1).map((l) => parseFloat(l.split(",")[1]));
  console.log(`Chalk-heavy: ${chalkPreds.length} rows`);
  console.log(`  Range: [${Math.min(...chalkPreds).toFixed(3)}, ${Math.max(...chalkPreds).toFixed(3)}]`);
  console.log(`  Mean: ${(chalkPreds.reduce((a, b) => a + b, 0) / chalkPreds.length).toFixed(4)}`);
  console.log(`  >0.9: ${chalkPreds.filter((p) => p > 0.9).length}, <0.1: ${chalkPreds.filter((p) => p < 0.1).length}`);
  console.log();

  // ── Variant 3: BT-heavy (trust Bradley-Terry more) ──
  const btHeavy = generateSubmission(ids, {
    kenpom: 0.35,
    bt: 0.50,
    seed: 0.10,
    conf: 0.05,
    upsetBoost: 0,
  }, allStats, btStrengths, seeds, confData);

  const btPath = path.join(OUT_DIR, "kaggle-bt-heavy.csv");
  fs.writeFileSync(btPath, btHeavy.join("\n") + "\n");

  const btPreds = btHeavy.slice(1).map((l) => parseFloat(l.split(",")[1]));
  console.log(`BT-heavy: ${btPreds.length} rows`);
  console.log(`  Range: [${Math.min(...btPreds).toFixed(3)}, ${Math.max(...btPreds).toFixed(3)}]`);
  console.log(`  Mean: ${(btPreds.reduce((a, b) => a + b, 0) / btPreds.length).toFixed(4)}`);
  console.log(`  >0.9: ${btPreds.filter((p) => p > 0.9).length}, <0.1: ${btPreds.filter((p) => p < 0.1).length}`);

  console.log("\n=== FILES GENERATED ===");
  console.log(`  ${upsetPath}`);
  console.log(`  ${chalkPath}`);
  console.log(`  ${btPath}`);
  console.log("\nSubmission strategy:");
  console.log("  Primary:  kaggle-submission-stage2.csv (balanced ensemble)");
  console.log("  Backup:   Pick ONE of the variants that contrasts your primary");
  console.log("  - If you think March will be wild → use upset-heavy");
  console.log("  - If you think chalk dominates  → use chalk-heavy");
  console.log("  - If you trust game results     → use bt-heavy");
}

main().catch(console.error);
