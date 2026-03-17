import * as fs from "fs";
import * as path from "path";
import { DATA_DIR, readCSV } from "./parse-kaggle";

export interface CoachInfo {
  teamId: number;
  coachName: string; // formatted: "Jon Scheyer" not "jon_scheyer"
}

const TARGET_SEASON = 2026;

/**
 * Format a raw coach name like "jon_scheyer" to "Jon Scheyer".
 */
function formatCoachName(raw: string): string {
  return raw
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Parse MTeamCoaches.csv (or WTeamCoaches.csv) to get current coach for each team in 2026.
 * Takes the record with the highest LastDayNum for each team in season 2026.
 */
export function parseCoaches(gender: "men" | "women"): Map<number, CoachInfo> {
  const prefix = gender === "men" ? "M" : "W";
  const filename = `${prefix}TeamCoaches.csv`;
  const filepath = path.join(DATA_DIR, filename);

  if (!fs.existsSync(filepath)) {
    console.log(`   [coaches] ${filename} not found — skipping coaches for ${gender}`);
    return new Map();
  }

  const rows = readCSV(filename);
  if (rows.length === 0) return new Map();

  const headers = rows[0];
  const seasonIdx = headers.indexOf("Season");
  const teamIdIdx = headers.indexOf("TeamID");
  const lastDayNumIdx = headers.indexOf("LastDayNum");
  const coachNameIdx = headers.indexOf("CoachName");

  if ([seasonIdx, teamIdIdx, lastDayNumIdx, coachNameIdx].some((i) => i === -1)) {
    console.warn(`   [coaches] unexpected CSV headers in ${filename}`);
    return new Map();
  }

  // teamId -> { lastDayNum, coachName }
  const bestByTeam = new Map<number, { lastDayNum: number; coachName: string }>();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const season = parseInt(row[seasonIdx]);
    if (season !== TARGET_SEASON) continue;

    const teamId = parseInt(row[teamIdIdx]);
    const lastDayNum = parseInt(row[lastDayNumIdx]);
    const rawName = row[coachNameIdx]?.trim();

    if (isNaN(teamId) || isNaN(lastDayNum) || !rawName) continue;

    const existing = bestByTeam.get(teamId);
    if (!existing || lastDayNum > existing.lastDayNum) {
      bestByTeam.set(teamId, { lastDayNum, coachName: rawName });
    }
  }

  const result = new Map<number, CoachInfo>();
  for (const [teamId, { coachName }] of bestByTeam.entries()) {
    result.set(teamId, { teamId, coachName: formatCoachName(coachName) });
  }

  return result;
}
