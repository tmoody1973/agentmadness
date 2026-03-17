"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

const DEFAULT_VOICE_ID = "TxGEqnHWrfWFTfGW9XjX";
const ELEVENLABS_MODEL = "eleven_v3";

/**
 * Transform a game narrative into broadcast-style announcer text.
 * ElevenLabs reads this aloud, so it needs to sound like a live call.
 */
function toBroadcastScript(
  narrative: string,
  mvp: string | undefined,
  keyMoment: string | undefined,
  winnerName: string,
  loserName: string,
  winnerScore: number,
  loserScore: number,
  isUpset: boolean
): string {
  const parts: string[] = [];

  // Opening — score announcement with energy
  if (isUpset) {
    parts.push(`What an upset! ${winnerName} takes down ${loserName}, ${winnerScore} to ${loserScore}!`);
  } else {
    parts.push(`${winnerName} defeats ${loserName}, ${winnerScore} to ${loserScore}.`);
  }

  // Key moment — the play that decided it
  if (keyMoment) {
    parts.push(keyMoment);
  }

  // Narrative — the game story
  if (narrative) {
    parts.push(narrative);
  }

  // MVP callout
  if (mvp) {
    parts.push(`${mvp} earns MVP honors for ${winnerName}.`);
  }

  // Upset exclamation
  if (isUpset) {
    parts.push("The madness continues!");
  }

  return parts.join(" ... ");
}

export const generateAudio = internalAction({
  args: {
    gameId: v.id("games"),
    narrative: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (!apiKey) {
        console.log("ELEVENLABS_API_KEY not set — skipping TTS generation");
        return;
      }

      // Get game details for richer broadcast script
      const game = await ctx.runQuery(internal.bracket.getGame, {
        gameId: args.gameId,
      });
      let broadcastText = args.narrative;

      if (game && game.winnerId) {
        const winner = await ctx.runQuery(internal.bracket.getTeam, {
          teamId: game.winnerId,
        });
        const loserId = game.teamAId === game.winnerId ? game.teamBId : game.teamAId;
        const loser = loserId
          ? await ctx.runQuery(internal.bracket.getTeam, { teamId: loserId })
          : null;

        if (winner && loser) {
          broadcastText = toBroadcastScript(
            args.narrative,
            game.mvp ?? undefined,
            game.keyMoment ?? undefined,
            winner.name,
            loser.name,
            game.winnerScore ?? 0,
            game.loserScore ?? 0,
            game.isUpset ?? false
          );
        }
      }

      const voiceId = process.env.ELEVENLABS_VOICE_ID ?? DEFAULT_VOICE_ID;

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": apiKey,
          },
          body: JSON.stringify({
            text: broadcastText,
            model_id: ELEVENLABS_MODEL,
            voice_settings: {
              stability: 0.3,          // Lower = more expressive, dynamic delivery
              similarity_boost: 0.65,  // Balanced — natural but energetic
              style: 0.7,              // Higher = more stylistic variation (announcer energy)
              use_speaker_boost: true,  // Enhances clarity
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `ElevenLabs API error ${response.status}: ${errorText}`
        );
        return;
      }

      const audioBlob = await response.blob();
      const storageId = await ctx.storage.store(audioBlob);

      await ctx.runMutation(internal.bracket.patchGameAudio, {
        gameId: args.gameId,
        audioStorageId: storageId,
      });
    } catch (error) {
      // Fire-and-forget: log but do not throw
      console.error(`TTS generation failed for game ${args.gameId}:`, error);
    }
  },
});
