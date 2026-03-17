import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import { DATA_DIR } from "./parse-kaggle";

export interface TeamRankings {
  teamId: number;
  kenPomRank: number | null;
  netRank: number | null;
  apRank: number | null;
  sagarinRank: number | null;
  compositeRank: number; // average of available rankings
}

const TARGET_SEASON = 2026;

// Systems we care about: POM = KenPom, SAG = Sagarin, AP = AP Poll, NET = NCAA NET
const KEY_SYSTEMS = new Set(["POM", "SAG", "AP", "NET", "MOR", "RTH", "USA"]);

interface RankEntry {
  rankingDayNum: number;
  rank: number;
}

/**
 * Parse rankings CSV line-by-line (file is ~129MB) to avoid loading it all into memory.
 * For each team + system, we keep only the entry with the highest RankingDayNum (latest).
 */
export async function parseRankings(gender: "men" | "women"): Promise<Map<number, TeamRankings>> {
  const prefix = gender === "men" ? "M" : "W";
  const filename = `${prefix}MasseyOrdinals.csv`;
  const filepath = path.join(DATA_DIR, filename);

  if (!fs.existsSync(filepath)) {
    console.log(`   [rankings] ${filename} not found — skipping rankings for ${gender}`);
    return new Map();
  }

  // teamId -> systemName -> { rankingDayNum, rank }
  const latestByTeamSystem = new Map<number, Map<string, RankEntry>>();

  const fileStream = fs.createReadStream(filepath, { encoding: "utf-8" });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let isFirstLine = true;
  let seasonIdx = 0;
  let dayNumIdx = 1;
  let systemIdx = 2;
  let teamIdIdx = 3;
  let rankIdx = 4;

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (isFirstLine) {
      // Parse header to get column indices robustly
      const headers = trimmed.split(",").map((h) => h.trim());
      seasonIdx = headers.indexOf("Season");
      dayNumIdx = headers.indexOf("RankingDayNum");
      systemIdx = headers.indexOf("SystemName");
      teamIdIdx = headers.indexOf("TeamID");
      rankIdx = headers.indexOf("OrdinalRank");
      isFirstLine = false;
      continue;
    }

    const cols = trimmed.split(",");
    const season = parseInt(cols[seasonIdx]);
    if (season !== TARGET_SEASON) continue;

    const systemName = cols[systemIdx]?.trim();
    if (!systemName || !KEY_SYSTEMS.has(systemName)) continue;

    const teamId = parseInt(cols[teamIdIdx]);
    const rankingDayNum = parseInt(cols[dayNumIdx]);
    const ordinalRank = parseInt(cols[rankIdx]);

    if (isNaN(teamId) || isNaN(rankingDayNum) || isNaN(ordinalRank)) continue;

    // Keep only the latest day's ranking per team per system
    let systemMap = latestByTeamSystem.get(teamId);
    if (!systemMap) {
      systemMap = new Map();
      latestByTeamSystem.set(teamId, systemMap);
    }

    const existing = systemMap.get(systemName);
    if (!existing || rankingDayNum > existing.rankingDayNum) {
      systemMap.set(systemName, { rankingDayNum, rank: ordinalRank });
    }
  }

  // Build final TeamRankings map
  const result = new Map<number, TeamRankings>();

  for (const [teamId, systemMap] of latestByTeamSystem.entries()) {
    const kenPomRank = systemMap.get("POM")?.rank ?? null;
    const sagarinRank = systemMap.get("SAG")?.rank ?? null;
    const apRank = systemMap.get("AP")?.rank ?? null;

    // For NET, try exact "NET" first, then fall back to null
    const netRank = systemMap.get("NET")?.rank ?? null;

    // Composite: average of all available rankings across all key systems
    const allRanks: number[] = [];
    for (const [, entry] of systemMap.entries()) {
      allRanks.push(entry.rank);
    }
    const compositeRank =
      allRanks.length > 0
        ? Math.round(allRanks.reduce((a, b) => a + b, 0) / allRanks.length)
        : 999;

    result.set(teamId, { teamId, kenPomRank, netRank, apRank, sagarinRank, compositeRank });
  }

  return result;
}
