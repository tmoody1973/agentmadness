"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";

export const generateDailyRecap = action({
  args: {
    date: v.string(),
    gender: v.union(v.literal("men"), v.literal("women")),
  },
  handler: async (ctx, { date, gender }) => {
    const perplexityKey = process.env.PERPLEXITY_API_KEY;
    if (!perplexityKey) throw new Error("PERPLEXITY_API_KEY required");

    const genderLabel = gender === "men" ? "men's" : "women's";

    // ── 1. Get our team stats for prediction lookup ──
    const templateTournament = await ctx.runQuery(api.bracket.getTemplateTournament, { gender });
    const teamsByName = new Map<string, { adjOE: number; adjDE: number; seed: number }>();

    if (templateTournament) {
      const bracketState = await ctx.runQuery(api.bracket.getBracketState, {
        tournamentId: templateTournament._id,
      });
      if (bracketState?.teams) {
        for (const team of bracketState.teams) {
          teamsByName.set(team.name, { adjOE: team.adjOE, adjDE: team.adjDE, seed: team.seed });
        }
      }
    }

    // ── 2. Call Perplexity sonar-pro for EVERYTHING — real results + article ──
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${perplexityKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          {
            role: "system",
            content: `You are an expert sports journalist and data analyst covering the NCAA March Madness tournament. You write in an energetic ESPN SportsCenter style. Always return valid JSON.`,
          },
          {
            role: "user",
            content: `Search for ALL ${genderLabel} NCAA Tournament basketball game results from ${date} (March Madness 2026).

For EACH game played that day, provide:
- Both team names (exactly as ESPN/NCAA uses them)
- Both team seed numbers
- The winning team name
- Winner's score and loser's score
- Whether it was an upset (higher seed number won)

Then write TWO things:
1. A podcast script (400-600 words) written for SPOKEN delivery — energetic, dramatic pauses with "...", rhetorical questions, ESPN SportsCenter style. Open with a hook, highlight upsets and key moments, close with tomorrow's preview.
2. A written article (600-800 words) in ESPN editorial style with clear paragraphs, game-by-game analysis, stat references, and dramatic narrative. Include a clear summary table of results at the top.

Return ONLY this JSON (no markdown backticks):
{
  "title": "Catchy day title",
  "summary": "2-3 sentence overview",
  "script": "Full podcast script for TTS",
  "article": "Full written article with markdown formatting (## headers, **bold**, tables)",
  "games": [
    {
      "teamAName": "Higher seed team",
      "teamASeed": 1,
      "teamBName": "Lower seed team",
      "teamBSeed": 16,
      "actualWinner": "Team that won",
      "actualScoreWinner": 78,
      "actualScoreLoser": 55,
      "isUpset": false
    }
  ],
  "biggestSurprise": "One sentence about the most surprising result"
}`,
          },
        ],
        max_tokens: 4000,
        search_recency_filter: "week",
        search_domain_filter: ["espn.com", "ncaa.com", "cbssports.com", "sports.yahoo.com"],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Perplexity API error: ${response.status} — ${errText}`);
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const rawContent = data.choices?.[0]?.message?.content ?? "";
    console.log("Perplexity response length:", rawContent.length);
    console.log("Perplexity first 300 chars:", rawContent.substring(0, 300));

    // Parse JSON from response
    const cleaned = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    let recap: {
      title?: string;
      summary?: string;
      script?: string;
      article?: string;
      games?: Array<{
        teamAName: string;
        teamASeed: number;
        teamBName: string;
        teamBSeed: number;
        actualWinner: string;
        actualScoreWinner?: number;
        actualScoreLoser?: number;
        isUpset?: boolean;
      }>;
      biggestSurprise?: string;
    };

    try {
      recap = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse Perplexity response as JSON:", cleaned.substring(0, 500));
      // Try to extract JSON from the response
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          recap = JSON.parse(jsonMatch[0]);
        } catch {
          throw new Error("Could not parse any JSON from Perplexity response");
        }
      } else {
        throw new Error("No JSON found in Perplexity response");
      }
    }

    console.log(`Parsed ${recap.games?.length ?? 0} games from Perplexity`);

    // ── 3. Compute our predictions for each game ──
    const UPSET_RATES: Record<string, number> = {
      "1v16": 0.015, "2v15": 0.06, "3v14": 0.13, "4v13": 0.20,
      "5v12": 0.35, "6v11": 0.37, "7v10": 0.39, "8v9": 0.48,
    };

    const games = (recap.games ?? []).map((g) => {
      const statsA = teamsByName.get(g.teamAName);
      const statsB = teamsByName.get(g.teamBName);

      let ourPrediction: number;
      if (statsA && statsB) {
        const effA = statsA.adjOE - statsA.adjDE;
        const effB = statsB.adjOE - statsB.adjDE;
        ourPrediction = 1 / (1 + Math.pow(10, -(effA - effB) / 11));
      } else {
        const hi = Math.min(g.teamASeed, g.teamBSeed);
        const lo = Math.max(g.teamASeed, g.teamBSeed);
        const upsetRate = UPSET_RATES[`${hi}v${lo}`] ?? 0.3;
        ourPrediction = g.teamASeed <= g.teamBSeed ? (1 - upsetRate) : upsetRate;
      }
      ourPrediction = Math.max(0.02, Math.min(0.98, ourPrediction));

      const wePredictedA = ourPrediction > 0.5;
      const aActuallyWon = g.actualWinner === g.teamAName;
      const weWereRight = wePredictedA === aActuallyWon;

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

    // ── 4. Generate podcast audio via ElevenLabs ──
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

    // ── 5. Generate hero image via Gemini ──
    let imageStorageId: string | undefined;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (geminiKey && games.length > 0) {
      try {
        const upsetCount = games.filter((g) => g.isUpset).length;
        const imageContext = recap.title ?? `NCAA March Madness ${genderLabel} tournament action`;

        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `Generate a dramatic, cinematic sports photography image for an NCAA March Madness basketball tournament recap: "${imageContext}" with ${upsetCount} upsets in ${games.length} games. Style: dark dramatic lighting, basketball arena atmosphere, ESPN broadcast quality. NO text or words in the image.`,
                }],
              }],
              generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
            }),
          }
        );

        if (geminiResponse.ok) {
          const geminiData = await geminiResponse.json() as any;
          const imagePart = geminiData.candidates?.[0]?.content?.parts?.find(
            (p: any) => p.inline_data != null
          );
          if (imagePart?.inline_data) {
            const imageBytes = Buffer.from(imagePart.inline_data.data, "base64");
            const imageBlob = new Blob([imageBytes], { type: imagePart.inline_data.mime_type });
            imageStorageId = await ctx.storage.store(imageBlob);
          }
        }
      } catch (err) {
        console.warn("Gemini image generation failed:", err);
      }
    }

    // ── 6. Store the recap ──
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
    if (audioStorageId) storeArgs.audioStorageId = audioStorageId;
    if (imageStorageId) storeArgs.imageStorageId = imageStorageId;

    await ctx.runMutation(internal.seedHelpers.storeRecap, storeArgs);

    return { success: true, gamesCount: games.length, accuracy };
  },
});
