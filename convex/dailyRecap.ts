"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

interface ParsedGame {
  teamAName: string;
  teamASeed: number;
  teamBName: string;
  teamBSeed: number;
  actualWinner: string;
  actualScoreWinner?: number;
  actualScoreLoser?: number;
  isUpset: boolean;
}

interface ClaudeRecapResponse {
  title?: string;
  summary?: string;
  script?: string;
  games?: ParsedGame[];
  biggestSurprise?: string;
}

export const generateDailyRecap = action({
  args: {
    date: v.string(),
    gender: v.union(v.literal("men"), v.literal("women")),
  },
  handler: async (ctx, { date, gender }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Auth required");

    // 1. Fetch real results from Perplexity
    const perplexityKey = process.env.PERPLEXITY_API_KEY;
    let realResults = "";

    if (perplexityKey) {
      const genderLabel = gender === "men" ? "men's" : "women's";
      try {
        const response = await fetch("https://api.perplexity.ai/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${perplexityKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "sonar",
            messages: [
              {
                role: "user",
                content: `List ALL ${genderLabel} NCAA Tournament basketball game results from ${date}. For each game include: winning team name, winning score, losing team name, losing score, and both teams' seeds. Format as a structured list. Include every game played that day.`,
              },
            ],
            max_tokens: 2000,
          }),
        });

        if (response.ok) {
          const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
          realResults = data.choices?.[0]?.message?.content ?? "";
        } else {
          console.warn(`Perplexity API error: ${response.status}`);
        }
      } catch (err) {
        console.warn("Perplexity fetch failed:", err);
      }
    }

    // 2. Call Claude to structure the comparison and write the podcast script
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) throw new Error("ANTHROPIC_API_KEY required");

    const genderLabel = gender === "men" ? "men's" : "women's";
    const comparisonPrompt = `You are analyzing ${genderLabel} NCAA Tournament results and comparing them against AI predictions.

Here are the real game results from ${date}:
${realResults || "No results available yet — the games haven't been played."}

For each game, identify both teams and their seeds, the actual winner and scores, and whether it was an upset (higher seed number won).

Then write a 2-4 minute podcast script (about 400-600 words) in the style of an ESPN SportsCenter anchor. The script should:
- Open with an energetic hook about the day's action
- Highlight the biggest surprises and upsets
- Mention key performances
- Close with what to watch for tomorrow
- Be written for SPOKEN delivery — short sentences, dramatic pauses (use "..." for pauses), rhetorical questions

RESPOND WITH ONLY THIS JSON (no markdown, no backticks, no trailing commas):
{
  "title": "Day title (e.g., Round of 64: Chalk Holds... Mostly)",
  "summary": "2-3 sentence summary of the day",
  "script": "The full podcast script, 400-600 words",
  "games": [
    {
      "teamAName": "Higher seed team name",
      "teamASeed": 1,
      "teamBName": "Lower seed team name",
      "teamBSeed": 16,
      "actualWinner": "Team that won",
      "actualScoreWinner": 78,
      "actualScoreLoser": 55,
      "isUpset": false
    }
  ],
  "biggestSurprise": "One sentence about the most surprising result"
}`;

    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        messages: [{ role: "user", content: comparisonPrompt }],
      }),
    });

    if (!claudeResponse.ok) {
      throw new Error(`Claude API error: ${claudeResponse.status}`);
    }

    const claudeData = await claudeResponse.json() as { content: Array<{ text: string }> };
    const text = claudeData.content[0].text;
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let recap: ClaudeRecapResponse;
    try {
      recap = JSON.parse(cleaned) as ClaudeRecapResponse;
    } catch {
      console.error("Claude raw response:", cleaned);
      throw new Error("Failed to parse Claude response as JSON");
    }

    // 3. Enrich games with our prediction logic
    // Higher seed (lower number) is the favorite — we assign baseline probability
    const games = (recap.games ?? []).map((g: ParsedGame) => {
      const favoriteIsA = g.teamASeed < g.teamBSeed;
      const ourPrediction = favoriteIsA ? 0.7 : 0.3;
      const weWereRight = favoriteIsA
        ? g.actualWinner === g.teamAName
        : g.actualWinner === g.teamBName;
      return {
        teamAName: g.teamAName,
        teamASeed: g.teamASeed,
        teamBName: g.teamBName,
        teamBSeed: g.teamBSeed,
        ourPrediction,
        actualWinner: g.actualWinner,
        actualScoreWinner: g.actualScoreWinner,
        actualScoreLoser: g.actualScoreLoser,
        weWereRight,
        isUpset: g.isUpset ?? false,
      };
    });

    const correctPicks = games.filter((g) => g.weWereRight).length;
    const accuracy = games.length > 0 ? correctPicks / games.length : 0;

    // 4. Generate podcast audio via ElevenLabs
    let audioStorageId: string | undefined;
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
    const voiceId = process.env.ELEVENLABS_VOICE_ID ?? "TxGEqnHWrfWFTfGW9XjX";

    if (elevenLabsKey && recap.script) {
      try {
        const ttsResponse = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "xi-api-key": elevenLabsKey,
            },
            body: JSON.stringify({
              text: recap.script,
              model_id: "eleven_v3",
              voice_settings: {
                stability: 0.3,
                similarity_boost: 0.65,
                style: 0.7,
                use_speaker_boost: true,
              },
            }),
          }
        );

        if (ttsResponse.ok) {
          const audioBlob = await ttsResponse.blob();
          audioStorageId = await ctx.storage.store(audioBlob);
        } else {
          console.warn(`ElevenLabs API error: ${ttsResponse.status}`);
        }
      } catch (err) {
        console.error("TTS generation failed:", err);
      }
    }

    // 5. Store the recap in the database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const storeArgs: any = {
      date,
      gender,
      title: recap.title ?? `${date} Recap`,
      summary: recap.summary ?? "",
      script: recap.script ?? "",
      games,
      accuracy,
      totalGames: games.length,
      correctPicks,
      biggestSurprise: recap.biggestSurprise,
      createdAt: Date.now(),
    };
    if (audioStorageId !== undefined) {
      storeArgs.audioStorageId = audioStorageId;
    }

    await ctx.runMutation(internal.dailyRecapHelpers.storeRecap, storeArgs);

    return { success: true, gamesCount: games.length, accuracy };
  },
});
