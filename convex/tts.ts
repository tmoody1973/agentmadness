"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

const DEFAULT_VOICE_ID = "TxGEqnHWrfWFTfGW9XjX";
const ELEVENLABS_MODEL = "eleven_turbo_v2_5";

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
            text: args.narrative,
            model_id: ELEVENLABS_MODEL,
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
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
