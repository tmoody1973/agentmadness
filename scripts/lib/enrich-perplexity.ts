import type { RawTeam } from "./types";

const PERPLEXITY_API_KEY = process.env["PERPLEXITY_API_KEY"];
const RATE_LIMIT_MS = 200;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function queryTeamContext(team: RawTeam): Promise<string> {
  const prompt = `Brief current context for ${team.name} (seed ${team.seed} in ${team.region} region) 2026 NCAA Tournament: key players, recent form, notable storylines. 2-3 sentences max.`;

  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 150,
    }),
  });

  if (!response.ok) {
    throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0]?.message?.content ?? "";
}

export async function enrichWithPerplexity(
  teams: RawTeam[]
): Promise<Map<number, string>> {
  const contexts = new Map<number, string>();

  if (!PERPLEXITY_API_KEY) {
    console.log("  [Perplexity] Skipping: PERPLEXITY_API_KEY not set");
    return contexts;
  }

  console.log(`  [Perplexity] Enriching ${teams.length} teams...`);

  for (const team of teams) {
    try {
      const context = await queryTeamContext(team);
      contexts.set(team.teamId, context);
      process.stdout.write(".");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`\n  [Perplexity] Failed for ${team.name}: ${message}`);
    }
    await sleep(RATE_LIMIT_MS);
  }

  console.log(`\n  [Perplexity] Done: ${contexts.size}/${teams.length} enriched`);
  return contexts;
}
