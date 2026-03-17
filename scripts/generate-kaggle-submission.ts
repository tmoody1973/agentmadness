import * as fs from "fs";
import * as path from "path";
import { computeTeamStats } from "./lib/compute-stats";
import { DATA_DIR } from "./lib/parse-kaggle";

function winProbability(effMarginA: number, effMarginB: number): number {
  const diff = effMarginA - effMarginB;
  return 1 / (1 + Math.pow(10, -diff / 11));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function main(): void {
  console.log("Computing team stats for men's and women's teams...");

  const menStats = computeTeamStats("M");
  const womenStats = computeTeamStats("W");

  // Merge into one map (men IDs: 1100-1499, women IDs: 3100-3499)
  const allStats = new Map([...menStats, ...womenStats]);

  console.log(`Stats computed for ${allStats.size} teams`);

  // Read sample submission to get all required ID pairs
  const samplePath = path.join(DATA_DIR, "SampleSubmissionStage2.csv");
  const raw = fs.readFileSync(samplePath, "utf-8");
  const lines = raw.trim().split("\n");
  const header = lines[0]; // "ID,Pred"

  const output: string[] = [header];
  let computed = 0;
  let defaulted = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const id = line.split(",")[0];
    const parts = id.split("_");
    // Format: 2026_TeamID1_TeamID2 (lower ID always first)
    const teamId1 = parseInt(parts[1], 10);
    const teamId2 = parseInt(parts[2], 10);

    const stats1 = allStats.get(teamId1);
    const stats2 = allStats.get(teamId2);

    let pred: number;

    if (stats1 && stats2) {
      const effMargin1 = stats1.adjOE - stats1.adjDE;
      const effMargin2 = stats2.adjOE - stats2.adjDE;
      pred = winProbability(effMargin1, effMargin2);
      computed++;
    } else {
      // No 2026 stats — default to 0.5 (neutral)
      pred = 0.5;
      defaulted++;
    }

    // Clamp to [0.01, 0.99] — critical to avoid log loss catastrophe
    pred = clamp(pred, 0.01, 0.99);

    output.push(`${id},${pred.toFixed(6)}`);
  }

  // Write output CSV
  const outDir = path.resolve(__dirname, "output");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "kaggle-submission-stage2.csv");
  fs.writeFileSync(outPath, output.join("\n") + "\n");

  console.log(`\nSubmission generated: ${outPath}`);
  console.log(`  Computed: ${computed} pairs`);
  console.log(`  Defaulted (no stats): ${defaulted} pairs`);
  console.log(`  Total: ${output.length - 1} rows`);
}

main();
