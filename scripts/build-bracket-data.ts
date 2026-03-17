import * as fs from "fs";
import * as path from "path";
import { parseTeams, parseSlots } from "./lib/parse-kaggle";
import { computeTeamStats, defaultStats } from "./lib/compute-stats";
import { computeUpsetRates, computeTournamentExperience } from "./lib/compute-upset-rates";
import { enrichWithPerplexity } from "./lib/enrich-perplexity";
import { generateProfiles } from "./lib/generate-profiles";
import { buildBracketWiring } from "./lib/build-bracket-wiring";
import { MEN_SCHEDULE, WOMEN_SCHEDULE } from "./lib/schedule-data";
import { parseRankings } from "./lib/parse-rankings";
import { parseCoaches } from "./lib/parse-coaches";
import type { BracketData, BracketTeam, Gender } from "./lib/types";

const MEN_REGION_MAP: Record<string, string> = {
  W: "East",
  X: "South",
  Y: "Midwest",
  Z: "West",
};

const WOMEN_REGION_MAP: Record<string, string> = {
  W: "Fort Worth 1",
  X: "Sacramento 4",
  Y: "Fort Worth 3",
  Z: "Sacramento 2",
};

async function buildBracket(gender: Gender): Promise<BracketData> {
  const label = gender === "M" ? "Men's" : "Women's";
  const regionMap = gender === "M" ? MEN_REGION_MAP : WOMEN_REGION_MAP;
  const schedule = gender === "M" ? MEN_SCHEDULE : WOMEN_SCHEDULE;

  console.log(`\n=== Building ${label} Bracket ===`);

  // Step 1: Parse Kaggle data
  console.log("1. Parsing Kaggle team/seed data...");
  const rawTeams = parseTeams(gender);
  console.log(`   Found ${rawTeams.length} teams`);

  const slots = parseSlots(gender);
  console.log(`   Found ${slots.length} bracket slots`);

  // Step 2: Compute team stats
  console.log("2. Computing team stats from regular season data...");
  const statsMap = computeTeamStats(gender);
  console.log(`   Computed stats for ${statsMap.size} teams`);

  // Step 3: Historical upset rates & experience
  console.log("3. Computing historical upset rates and tournament experience...");
  const upsetRates = computeUpsetRates(gender);
  const experience = computeTournamentExperience(gender);
  console.log(`   ${Object.keys(upsetRates).length} matchup types analyzed`);

  // Step 3b: Rankings and coaches
  const genderStr = gender === "M" ? "men" : "women";
  console.log("3b. Parsing rankings (Massey Ordinals)...");
  const rankingsMap = await parseRankings(genderStr);
  console.log(`   Rankings loaded for ${rankingsMap.size} teams`);

  console.log("3c. Parsing coach data...");
  const coachesMap = parseCoaches(genderStr);
  console.log(`   Coaches loaded for ${coachesMap.size} teams`);

  // Step 4: Perplexity enrichment (optional)
  console.log("4. Enriching with Perplexity (if API key set)...");
  const perplexityContexts = await enrichWithPerplexity(rawTeams, statsMap as any);

  // Step 5: Generate Claude profiles (optional)
  console.log("5. Generating Claude profiles (if API key set)...");
  const profilesMap = await generateProfiles(rawTeams, statsMap, perplexityContexts);

  // Step 6: Build bracket wiring
  console.log("6. Building bracket game wiring...");
  const games = buildBracketWiring(slots, regionMap, schedule);
  console.log(`   ${games.length} games wired`);

  // Step 7: Assemble BracketTeam[]
  console.log("7. Assembling bracket teams...");
  const teams: BracketTeam[] = rawTeams.map((rawTeam) => {
    const stats = statsMap.get(rawTeam.teamId) ?? defaultStats(rawTeam.teamId);
    const profile = profilesMap.get(rawTeam.teamId);
    const expCount = experience[rawTeam.teamId] ?? 0;
    const context = perplexityContexts.get(rawTeam.teamId) ?? "";
    const rankings = rankingsMap.get(rawTeam.teamId);
    const coachInfo = coachesMap.get(rawTeam.teamId);

    return {
      ...rawTeam,
      stats,
      tournamentExperience: expCount,
      keyPlayers: profile?.keyPlayers ?? ["Star Player", "Key Contributor"],
      styleTraits: profile?.styleTraits ?? ["Physical", "Balanced"],
      clutchRating: profile?.clutchRating ?? 5,
      depthScore: profile?.depthScore ?? 5,
      perplexityContext: context,
      netRanking: rankings?.compositeRank ?? 0,
      coach: coachInfo?.coachName ?? "Unknown",
      kenPomRank: rankings?.kenPomRank ?? null,
      apRank: rankings?.apRank ?? null,
      compositeRank: rankings?.compositeRank ?? 999,
    };
  });

  // Step 8: Validate
  const firstFourGames = games.filter((g) => g.round === "FIRST_FOUR");
  const warnings: string[] = [];

  if (teams.length !== 68) {
    warnings.push(`Expected 68 teams, got ${teams.length}`);
  }
  if (games.length < 67) {
    warnings.push(`Expected at least 67 games, got ${games.length}`);
  }
  if (firstFourGames.length !== 4) {
    warnings.push(`Expected 4 First Four games, got ${firstFourGames.length}`);
  }

  // Check for teams missing stats
  const missingStats = teams.filter((t) => t.stats.gamesPlayed === 0);
  if (missingStats.length > 0) {
    warnings.push(`${missingStats.length} teams have no regular season stats data`);
  }

  const validation = {
    teamCount: teams.length,
    gameCount: games.length,
    firstFourCount: firstFourGames.length,
    warnings,
  };

  if (warnings.length > 0) {
    console.log(`   Warnings:`);
    for (const w of warnings) {
      console.log(`     - ${w}`);
    }
  } else {
    console.log(`   Validation passed: ${teams.length} teams, ${games.length} games, ${firstFourGames.length} First Four`);
  }

  return { teams, games, upsetRates, validation };
}

function serializeToTypeScript(menData: BracketData, womenData: BracketData): string {
  const lines: string[] = [];

  lines.push("// AUTO-GENERATED by scripts/build-bracket-data.ts");
  lines.push("// Do not edit manually — re-run the script to regenerate");
  lines.push(`// Generated: ${new Date().toISOString()}`);
  lines.push("");
  lines.push('import type { BracketData } from "../../scripts/lib/types";');
  lines.push("");

  lines.push(`export const MEN_BRACKET_2026: BracketData = ${JSON.stringify(menData, null, 2)};`);
  lines.push("");
  lines.push(`export const WOMEN_BRACKET_2026: BracketData = ${JSON.stringify(womenData, null, 2)};`);
  lines.push("");

  return lines.join("\n");
}

async function main() {
  console.log("NCAA 2026 Bracket Data Builder");
  console.log("================================");

  try {
    const [menData, womenData] = await Promise.all([
      buildBracket("M"),
      buildBracket("W"),
    ]);

    const outputPath = path.resolve(__dirname, "../src/data/bracket-2026.ts");
    const content = serializeToTypeScript(menData, womenData);

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, content, "utf-8");

    console.log(`\n✓ Output written to: ${outputPath}`);
    console.log(`\nSummary:`);
    console.log(`  Men's:   ${menData.validation.teamCount} teams, ${menData.validation.gameCount} games`);
    console.log(`  Women's: ${womenData.validation.teamCount} teams, ${womenData.validation.gameCount} games`);

    const allWarnings = [
      ...menData.validation.warnings.map((w) => `[Men's] ${w}`),
      ...womenData.validation.warnings.map((w) => `[Women's] ${w}`),
    ];

    if (allWarnings.length > 0) {
      console.log(`\nWarnings (${allWarnings.length}):`);
      for (const w of allWarnings) {
        console.log(`  - ${w}`);
      }
      process.exit(0);
    } else {
      console.log("\nAll validations passed!");
    }
  } catch (err) {
    console.error("\nFATAL ERROR:", err);
    process.exit(1);
  }
}

main();
