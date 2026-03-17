/**
 * generate-prediction-highlights.ts
 *
 * Reads the Kaggle Stage 2 submission CSV and generates a curated
 * highlights data file for the /predictions page.
 *
 * Run: npx tsx scripts/generate-prediction-highlights.ts
 */

import * as fs from "fs";
import * as path from "path";

const DATA_DIR = path.resolve(__dirname, "../../DOCS/march-machine-learning-mania-2026");
const SUBMISSION_CSV = path.resolve(__dirname, "output/kaggle-submission-stage2.csv");
const OUT_FILE = path.resolve(__dirname, "../src/data/prediction-highlights.ts");

// ── Types ─────────────────────────────────────────────────────────────────────

interface PredictionMatchup {
  teamA: { name: string; seed: number; id: number };
  teamB: { name: string; seed: number; id: number };
  probA: number;
  gender: "men" | "women";
  region?: string;
}

// ── Loaders ───────────────────────────────────────────────────────────────────

function loadTeamNames(): Map<number, string> {
  const result = new Map<number, string>();
  for (const fname of ["MTeams.csv", "WTeams.csv"]) {
    const raw = fs.readFileSync(path.join(DATA_DIR, fname), "utf-8");
    const lines = raw.trim().split("\n");
    const headers = lines[0].split(",").map((h) => h.trim());
    const idIdx = headers.indexOf("TeamID");
    const nameIdx = headers.indexOf("TeamName");
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].trim().split(",");
      if (!cols[idIdx]) continue;
      const id = parseInt(cols[idIdx], 10);
      const name = cols[nameIdx]?.trim() ?? `Team ${id}`;
      if (!isNaN(id)) result.set(id, name);
    }
  }
  return result;
}

interface SeedInfo {
  seed: number;
  region: string;
  gender: "men" | "women";
}

function loadSeeds(): Map<number, SeedInfo> {
  const result = new Map<number, SeedInfo>();

  const REGION_MAP: Record<string, string> = {
    W: "East",
    X: "South",
    Y: "West",
    Z: "Midwest",
  };

  const files: Array<{ fname: string; gender: "men" | "women" }> = [
    { fname: "MNCAATourneySeeds.csv", gender: "men" },
    { fname: "WNCAATourneySeeds.csv", gender: "women" },
  ];

  for (const { fname, gender } of files) {
    const raw = fs.readFileSync(path.join(DATA_DIR, fname), "utf-8");
    const lines = raw.trim().split("\n");
    const headers = lines[0].split(",").map((h) => h.trim());
    const seasonIdx = headers.indexOf("Season");
    const seedIdx = headers.indexOf("Seed");
    const teamIdx = headers.indexOf("TeamID");

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].trim().split(",");
      if (!cols[seasonIdx]) continue;
      const season = parseInt(cols[seasonIdx], 10);
      if (season !== 2026) continue;

      const seedCode = cols[seedIdx]?.trim() ?? "";
      const teamId = parseInt(cols[teamIdx], 10);
      if (isNaN(teamId)) continue;

      const regionLetter = seedCode.charAt(0);
      const region = REGION_MAP[regionLetter] ?? regionLetter;
      const match = seedCode.slice(1).match(/^(\d+)/);
      const seedNum = match ? parseInt(match[1], 10) : 8;

      result.set(teamId, { seed: seedNum, region, gender });
    }
  }

  return result;
}

function loadPredictions(): Map<string, number> {
  const result = new Map<string, number>();
  const raw = fs.readFileSync(SUBMISSION_CSV, "utf-8");
  const lines = raw.trim().split("\n");
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const [id, pred] = line.split(",");
    result.set(id.trim(), parseFloat(pred));
  }
  return result;
}

// ── Lookup helpers ─────────────────────────────────────────────────────────────

function getPred(
  predictions: Map<string, number>,
  id1: number,
  id2: number,
): { probA: number; id1: number; id2: number } {
  // CSV always has smaller ID first
  const [lo, hi] = id1 < id2 ? [id1, id2] : [id2, id1];
  const key = `2026_${lo}_${hi}`;
  const raw = predictions.get(key);
  if (raw === undefined) return { probA: 0.5, id1: lo, id2: hi };

  // raw is prob(lo wins). If caller gave id1 > id2, flip
  const prob = id1 === lo ? raw : 1 - raw;
  return { probA: prob, id1, id2 };
}

// ── Main ───────────────────────────────────────────────────────────────────────

function main(): void {
  console.log("Loading data...");
  const teamNames = loadTeamNames();
  const seeds = loadSeeds();
  const predictions = loadPredictions();

  console.log(`Teams: ${teamNames.size}, Seeds: ${seeds.size}, Predictions: ${predictions.size}`);

  // Build all tournament matchup pairs (R64: 1v16, 8v9, 5v12, 4v13, 6v11, 3v14, 7v10, 2v15)
  const SEED_PAIRS: Array<[number, number]> = [
    [1, 16], [8, 9], [5, 12], [4, 13], [6, 11], [3, 14], [7, 10], [2, 15],
  ];

  // Group teams by region + gender + seed
  const regionMap = new Map<string, Map<number, number[]>>(); // key: "region-gender" → seed → [teamIds]

  for (const [teamId, info] of seeds.entries()) {
    const key = `${info.region}-${info.gender}`;
    if (!regionMap.has(key)) regionMap.set(key, new Map());
    const byRegion = regionMap.get(key)!;
    if (!byRegion.has(info.seed)) byRegion.set(info.seed, []);
    byRegion.get(info.seed)!.push(teamId);
  }

  // Build first-round matchups
  const firstRoundMatchups: PredictionMatchup[] = [];

  const regions = ["East", "South", "West", "Midwest"];
  const genders: Array<"men" | "women"> = ["men", "women"];

  for (const gender of genders) {
    for (const region of regions) {
      const key = `${region}-${gender}`;
      const byRegion = regionMap.get(key);
      if (!byRegion) continue;

      for (const [seedA, seedB] of SEED_PAIRS) {
        const teamsA = byRegion.get(seedA) ?? [];
        const teamsB = byRegion.get(seedB) ?? [];

        // Take first team from each (some seeds have play-in teams, pick first)
        const idA = teamsA[0];
        const idB = teamsB[0];
        if (!idA || !idB) continue;

        const { probA } = getPred(predictions, idA, idB);

        firstRoundMatchups.push({
          teamA: {
            name: teamNames.get(idA) ?? `Team ${idA}`,
            seed: seedA,
            id: idA,
          },
          teamB: {
            name: teamNames.get(idB) ?? `Team ${idB}`,
            seed: seedB,
            id: idB,
          },
          probA,
          gender,
          region,
        });
      }
    }
  }

  console.log(`First round matchups: ${firstRoundMatchups.length}`);

  // ── Build all tournament pairs for stats + highlight categories ───────────────
  const tourneyTeams = new Set<number>();
  for (const [teamId] of seeds.entries()) tourneyTeams.add(teamId);
  const tourneyArr = Array.from(tourneyTeams);

  const allTourneyMatchups: PredictionMatchup[] = [];

  for (let i = 0; i < tourneyArr.length; i++) {
    for (let j = i + 1; j < tourneyArr.length; j++) {
      const idA = tourneyArr[i];
      const idB = tourneyArr[j];
      const seedInfoA = seeds.get(idA);
      const seedInfoB = seeds.get(idB);
      if (!seedInfoA || !seedInfoB) continue;

      // Only same-gender matchups (how the competition works)
      if (seedInfoA.gender !== seedInfoB.gender) continue;

      const key = `2026_${Math.min(idA, idB)}_${Math.max(idA, idB)}`;
      const rawPred = predictions.get(key);
      if (rawPred === undefined) continue;

      const probA = idA < idB ? rawPred : 1 - rawPred;

      allTourneyMatchups.push({
        teamA: {
          name: teamNames.get(idA) ?? `Team ${idA}`,
          seed: seedInfoA.seed,
          id: idA,
        },
        teamB: {
          name: teamNames.get(idB) ?? `Team ${idB}`,
          seed: seedInfoB.seed,
          id: idB,
        },
        probA,
        gender: seedInfoA.gender,
        region: seedInfoA.region,
      });
    }
  }

  console.log(`All tourney matchups: ${allTourneyMatchups.length}`);

  // ── Upset picks: we favor higher seed number (underdog) ─────────────────────
  const upsetPicks = allTourneyMatchups
    .filter((m) => {
      // Upset = we favor the team with the higher seed number
      const underdog =
        m.teamA.seed > m.teamB.seed ? m.teamA : m.teamB;
      const probUnderdog =
        m.teamA.seed > m.teamB.seed ? m.probA : 1 - m.probA;
      const seedDiff = Math.abs(m.teamA.seed - m.teamB.seed);
      return probUnderdog > 0.50 && seedDiff >= 2;
    })
    .sort((a, b) => {
      // Sort by seed differential then confidence
      const diffA = Math.abs(a.teamA.seed - a.teamB.seed);
      const diffB = Math.abs(b.teamA.seed - b.teamB.seed);
      if (diffB !== diffA) return diffB - diffA;
      const confA = Math.max(a.probA, 1 - a.probA);
      const confB = Math.max(b.probA, 1 - b.probA);
      return confB - confA;
    })
    .slice(0, 12);

  // ── Championship: 1-seeds vs 1-seeds ────────────────────────────────────────
  const oneSeedMatchups = allTourneyMatchups
    .filter((m) => m.teamA.seed === 1 && m.teamB.seed === 1)
    .sort((a, b) => Math.abs(b.probA - 0.5) - Math.abs(a.probA - 0.5));

  // ── Most confident ───────────────────────────────────────────────────────────
  const mostConfident = [...allTourneyMatchups]
    .sort((a, b) => {
      const confA = Math.max(a.probA, 1 - a.probA);
      const confB = Math.max(b.probA, 1 - b.probA);
      return confB - confA;
    })
    .slice(0, 10);

  // ── Biggest toss-ups ─────────────────────────────────────────────────────────
  const biggestTossups = [...allTourneyMatchups]
    .sort((a, b) => {
      const distA = Math.abs(a.probA - 0.5);
      const distB = Math.abs(b.probA - 0.5);
      return distA - distB;
    })
    .slice(0, 10);

  // ── Stats from all predictions ───────────────────────────────────────────────
  const allPreds: number[] = [];
  for (const [, pred] of predictions.entries()) {
    allPreds.push(pred);
  }
  const totalPredictions = allPreds.length;
  const avgConfidence = allPreds.reduce((s, p) => s + Math.max(p, 1 - p), 0) / totalPredictions;
  const predictionsAbove90 = allPreds.filter((p) => p > 0.9).length;
  const predictionsBelow10 = allPreds.filter((p) => p < 0.1).length;
  const tossups4555 = allPreds.filter((p) => p >= 0.45 && p <= 0.55).length;

  // ── Strip region from firstRoundMatchups for output (keep it in separate field) ─
  // Already included as `region` field, that's fine.

  // ── Write output ──────────────────────────────────────────────────────────────
  function matchupToTs(m: PredictionMatchup): string {
    const regionPart = m.region ? `, region: "${m.region}"` : "";
    return `    {
      teamA: { name: ${JSON.stringify(m.teamA.name)}, seed: ${m.teamA.seed}, id: ${m.teamA.id} },
      teamB: { name: ${JSON.stringify(m.teamB.name)}, seed: ${m.teamB.seed}, id: ${m.teamB.id} },
      probA: ${m.probA.toFixed(4)},
      gender: "${m.gender}"${regionPart},
    }`;
  }

  const output = `// AUTO-GENERATED by scripts/generate-prediction-highlights.ts
// Do not edit manually — re-run the script to regenerate
// Generated: ${new Date().toISOString()}

export interface PredictionMatchup {
  teamA: { name: string; seed: number; id: number };
  teamB: { name: string; seed: number; id: number };
  probA: number; // probability teamA wins
  gender: "men" | "women";
  region?: string;
}

export interface PredictionHighlights {
  firstRoundMatchups: PredictionMatchup[];
  upsetPicks: PredictionMatchup[];
  championshipMatchups: PredictionMatchup[];
  mostConfident: PredictionMatchup[];
  biggestTossups: PredictionMatchup[];
  stats: {
    totalPredictions: number;
    avgConfidence: number;
    predictionsAbove90: number;
    predictionsBelow10: number;
    tossups4555: number;
  };
}

export const predictionHighlights: PredictionHighlights = {
  firstRoundMatchups: [
${firstRoundMatchups.map(matchupToTs).join(",\n")}
  ],

  upsetPicks: [
${upsetPicks.map(matchupToTs).join(",\n")}
  ],

  championshipMatchups: [
${oneSeedMatchups.map(matchupToTs).join(",\n")}
  ],

  mostConfident: [
${mostConfident.map(matchupToTs).join(",\n")}
  ],

  biggestTossups: [
${biggestTossups.map(matchupToTs).join(",\n")}
  ],

  stats: {
    totalPredictions: ${totalPredictions},
    avgConfidence: ${avgConfidence.toFixed(4)},
    predictionsAbove90: ${predictionsAbove90},
    predictionsBelow10: ${predictionsBelow10},
    tossups4555: ${tossups4555},
  },
};
`;

  fs.writeFileSync(OUT_FILE, output, "utf-8");
  console.log(`\nWrote: ${OUT_FILE}`);
  console.log("\nSummary:");
  console.log(`  First round matchups: ${firstRoundMatchups.length}`);
  console.log(`  Upset picks: ${upsetPicks.length}`);
  console.log(`  Championship matchups: ${oneSeedMatchups.length}`);
  console.log(`  Most confident: ${mostConfident.length}`);
  console.log(`  Biggest tossups: ${biggestTossups.length}`);
  console.log(`  Total predictions: ${totalPredictions}`);
  console.log(`  Avg confidence: ${(avgConfidence * 100).toFixed(1)}%`);
  console.log(`  Above 90%: ${predictionsAbove90}`);
  console.log(`  Below 10%: ${predictionsBelow10}`);
  console.log(`  Tossups (45-55%): ${tossups4555}`);
}

main();
