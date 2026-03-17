import type { RawTeam, TeamStats } from "./types";

const PERPLEXITY_API_KEY = process.env["PERPLEXITY_API_KEY"];
const RATE_LIMIT_MS = 300;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function queryTeamContext(
  team: RawTeam,
  stats?: { record: string; adjOE: number; adjDE: number }
): Promise<string> {
  const statsLine = stats
    ? `Their 2025-26 record is ${stats.record}. Adjusted offensive efficiency: ${stats.adjOE.toFixed(1)}, defensive efficiency: ${stats.adjDE.toFixed(1)}.`
    : "";

  const prompt = `Write a detailed scouting report for ${team.name} basketball (${team.conference} conference) entering the 2026 NCAA Tournament as a #${team.seed} seed in the ${team.region} region. ${statsLine}

Include ALL of the following in your report:

**Key Players**: Name the top 3 players with their positions, scoring averages, and what makes them dangerous. Use real 2025-26 player data.

**Team Identity**: What is their playing style? (tempo, defensive philosophy, offensive scheme, three-point shooting, rebounding strength)

**Recent Form**: How have they played in the last month? Any winning/losing streaks? Conference tournament result?

**Strengths**: What do they do best? What matchups favor them?

**Weaknesses**: Where are they vulnerable? What type of team gives them trouble?

**Tournament Outlook**: Any injuries? Coaching tournament experience? Historical March Madness success for this program?

**X-Factor**: One thing that could determine their tournament fate.

Format with markdown headers (##) for each section. Be specific — use real player names and stats, not generic descriptions.`;

  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar",
      messages: [
        {
          role: "system",
          content:
            "You are an expert college basketball analyst writing detailed NCAA Tournament scouting reports. Use real, current 2025-26 season data. Be specific with player names, stats, and game details. Format with markdown.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 1500,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Perplexity API error: ${response.status} ${response.statusText}`
    );
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0]?.message?.content ?? "";
}

export async function enrichWithPerplexity(
  teams: RawTeam[],
  statsMap?: Map<number, { wins: number; losses: number; adjOE: number; adjDE: number }>
): Promise<Map<number, string>> {
  const contexts = new Map<number, string>();

  if (!PERPLEXITY_API_KEY) {
    console.log("  [Perplexity] Skipping: PERPLEXITY_API_KEY not set");
    return contexts;
  }

  console.log(`  [Perplexity] Enriching ${teams.length} teams...`);

  for (const team of teams) {
    try {
      const stats = statsMap?.get(team.teamId);
      const statsArg = stats
        ? { record: `${stats.wins}-${stats.losses}`, adjOE: stats.adjOE, adjDE: stats.adjDE }
        : undefined;

      const context = await queryTeamContext(team, statsArg);
      contexts.set(team.teamId, context);
      process.stdout.write(".");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`\n  [Perplexity] Failed for ${team.name}: ${message}`);
      contexts.set(team.teamId, "");
    }
    await sleep(RATE_LIMIT_MS);
  }

  console.log(
    `\n  [Perplexity] Done: ${contexts.size}/${teams.length} enriched`
  );
  return contexts;
}
