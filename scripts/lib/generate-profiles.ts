import type { RawTeam, TeamStats } from "./types";

const ANTHROPIC_API_KEY = process.env["ANTHROPIC_API_KEY"];
const BATCH_SIZE = 8;

interface TeamProfile {
  teamId: number;
  keyPlayers: string[];
  styleTraits: string[];
  clutchRating: number;
  depthScore: number;
}

function defaultProfile(teamId: number): TeamProfile {
  return {
    teamId,
    keyPlayers: ["Star Player", "Key Contributor"],
    styleTraits: ["Physical", "Balanced"],
    clutchRating: 5,
    depthScore: 5,
  };
}

async function generateBatchProfiles(
  batch: Array<{ team: RawTeam; stats: TeamStats; context: string }>
): Promise<TeamProfile[]> {
  const teamDescriptions = batch
    .map(
      ({ team, stats, context }) =>
        `TeamID: ${team.teamId}, Name: ${team.name}, Seed: ${team.seed}, Region: ${team.region}, ` +
        `Conference: ${team.conference}, Record: ${stats.wins}-${stats.losses}, ` +
        `AdjOE: ${stats.adjOE}, AdjDE: ${stats.adjDE}, Tempo: ${stats.adjTempo}` +
        (context ? `, Context: ${context}` : "")
    )
    .join("\n");

  const prompt = `You are analyzing NCAA tournament teams. For each team below, generate a JSON profile.

Teams:
${teamDescriptions}

Return a JSON array with one object per team in the same order:
[
  {
    "teamId": number,
    "keyPlayers": ["Player 1", "Player 2"] (2-3 real or plausible names),
    "styleTraits": ["Trait 1", "Trait 2"] (2-3 playing style descriptors),
    "clutchRating": number (1-10, based on seed/stats),
    "depthScore": number (1-10, based on conference/record)
  }
]

Return ONLY the JSON array, no other text.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; text: string }>;
  };
  const text = data.content[0]?.text ?? "[]";

  try {
    const profiles = JSON.parse(text) as TeamProfile[];
    return profiles;
  } catch {
    console.warn("  [Profiles] Failed to parse Claude response, using defaults");
    return batch.map(({ team }) => defaultProfile(team.teamId));
  }
}

export async function generateProfiles(
  teams: RawTeam[],
  statsMap: Map<number, TeamStats>,
  perplexityContexts: Map<number, string>
): Promise<Map<number, TeamProfile>> {
  const profiles = new Map<number, TeamProfile>();

  if (!ANTHROPIC_API_KEY) {
    console.log("  [Profiles] Skipping Claude enrichment: ANTHROPIC_API_KEY not set");
    for (const team of teams) {
      profiles.set(team.teamId, defaultProfile(team.teamId));
    }
    return profiles;
  }

  console.log(`  [Profiles] Generating profiles for ${teams.length} teams in batches of ${BATCH_SIZE}...`);

  for (let i = 0; i < teams.length; i += BATCH_SIZE) {
    const batch = teams.slice(i, i + BATCH_SIZE).map((team) => ({
      team,
      stats: statsMap.get(team.teamId) ?? {
        teamId: team.teamId,
        wins: 0,
        losses: 0,
        adjOE: 100,
        adjDE: 100,
        adjTempo: 68,
        volatility: 10,
        gamesPlayed: 0,
      },
      context: perplexityContexts.get(team.teamId) ?? "",
    }));

    try {
      const batchProfiles = await generateBatchProfiles(batch);
      for (const profile of batchProfiles) {
        profiles.set(profile.teamId, profile);
      }
      console.log(`  [Profiles] Batch ${Math.floor(i / BATCH_SIZE) + 1} complete`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`  [Profiles] Batch failed: ${message}, using defaults`);
      for (const { team } of batch) {
        profiles.set(team.teamId, defaultProfile(team.teamId));
      }
    }
  }

  return profiles;
}
