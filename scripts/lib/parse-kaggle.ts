import * as fs from "fs";
import * as path from "path";
import type { Gender, RawTeam, SlotWiring } from "./types";

export const DATA_DIR = path.resolve(
  __dirname,
  "../../../DOCS/march-machine-learning-mania-2026"
);

const TARGET_SEASON = 2026;

// Men's region letter -> region name
const MEN_REGION_MAP: Record<string, string> = {
  W: "East",
  X: "South",
  Y: "Midwest",
  Z: "West",
};

// Women's region letter -> region name
const WOMEN_REGION_MAP: Record<string, string> = {
  W: "Fort Worth 1",
  X: "Sacramento 4",
  Y: "Fort Worth 3",
  Z: "Sacramento 2",
};

export function readCSV(filename: string): string[][] {
  const filepath = path.join(DATA_DIR, filename);
  const raw = fs.readFileSync(filepath, "utf-8");
  const lines = raw.split("\n").filter((l) => l.trim().length > 0);
  return lines.map((l) => l.split(",").map((c) => c.trim()));
}

function parseCSVWithHeader(filename: string): Record<string, string>[] {
  const rows = readCSV(filename);
  if (rows.length === 0) return [];
  const headers = rows[0];
  return rows.slice(1).map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] ?? "";
    });
    return obj;
  });
}

export function parseTeams(gender: Gender): RawTeam[] {
  const regionMap = gender === "M" ? MEN_REGION_MAP : WOMEN_REGION_MAP;

  // Load teams lookup
  const teamsRows = parseCSVWithHeader(`${gender}Teams.csv`);
  const teamNameById: Record<number, string> = {};
  for (const row of teamsRows) {
    teamNameById[parseInt(row["TeamID"])] = row["TeamName"];
  }

  // Load conferences for 2026
  const confRows = parseCSVWithHeader(`${gender}TeamConferences.csv`);
  const confByTeamId: Record<number, string> = {};
  for (const row of confRows) {
    if (parseInt(row["Season"]) === TARGET_SEASON) {
      confByTeamId[parseInt(row["TeamID"])] = row["ConfAbbrev"];
    }
  }

  // Load seeds for 2026
  const seedRows = parseCSVWithHeader(`${gender}NCAATourneySeeds.csv`);
  const teams: RawTeam[] = [];

  for (const row of seedRows) {
    if (parseInt(row["Season"]) !== TARGET_SEASON) continue;

    const seedCode = row["Seed"]; // e.g. "W01", "X16a"
    const teamId = parseInt(row["TeamID"]);

    // Extract region letter (first char)
    const regionLetter = seedCode[0];
    const region = regionMap[regionLetter] ?? regionLetter;

    // Extract seed number (digits, strip trailing a/b)
    const seedMatch = seedCode.slice(1).match(/^(\d+)/);
    const seed = seedMatch ? parseInt(seedMatch[1]) : 0;

    teams.push({
      teamId,
      name: teamNameById[teamId] ?? `Team_${teamId}`,
      seed,
      seedCode,
      region,
      conference: confByTeamId[teamId] ?? "Unknown",
    });
  }

  return teams;
}

export function parseSlots(gender: Gender): SlotWiring[] {
  const slotRows = parseCSVWithHeader(`${gender}NCAATourneySlots.csv`);
  const slots: SlotWiring[] = [];

  for (const row of slotRows) {
    if (parseInt(row["Season"]) !== TARGET_SEASON) continue;
    slots.push({
      slot: row["Slot"],
      strongSeed: row["StrongSeed"],
      weakSeed: row["WeakSeed"],
    });
  }

  return slots;
}
