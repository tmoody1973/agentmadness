"use node";

import { v } from "convex/values";
import { internalAction, action } from "./_generated/server";
import { internal } from "./_generated/api";
import { buildRefereePrompt } from "./prompts";

// ─── Constants ────────────────────────────────────────────────────────────────

const CLAUDE_MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 1024;
const ROUND_ORDER = [
  "FIRST_FOUR",
  "R64",
  "R32",
  "S16",
  "E8",
  "F4",
  "CHAMP",
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface GameResult {
  winner: string;
  loser: string;
  winnerScore: number;
  loserScore: number;
  isUpset: boolean;
  upsetMagnitude: number;
  mvp: string;
  keyMoment: string;
  gameNarrative: string;
  winProbability: number;
}

async function callClaudeApi(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: MAX_TOKENS,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const content = data.content?.[0];
  if (!content || content.type !== "text") {
    throw new Error("Unexpected Claude API response structure");
  }

  return content.text as string;
}

function parseGameResult(raw: string): GameResult {
  // Strip markdown code blocks if present
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  const parsed = JSON.parse(cleaned);

  // Validate required fields
  const required = [
    "winner",
    "loser",
    "winnerScore",
    "loserScore",
    "isUpset",
    "mvp",
    "keyMoment",
    "gameNarrative",
    "winProbability",
  ];

  for (const field of required) {
    if (parsed[field] === undefined) {
      throw new Error(`Missing field in game result: ${field}`);
    }
  }

  return parsed as GameResult;
}

function deterministicFallback(
  teamAName: string,
  teamBName: string,
  teamASeed: number,
  teamBSeed: number
): GameResult {
  // Favorite wins based on seed
  const favoriteIsA = teamASeed <= teamBSeed;
  const winner = favoriteIsA ? teamAName : teamBName;
  const loser = favoriteIsA ? teamBName : teamAName;

  return {
    winner,
    loser,
    winnerScore: 72,
    loserScore: 65,
    isUpset: false,
    upsetMagnitude: 0,
    mvp: "Star Player",
    keyMoment: "A decisive run in the final minutes sealed the victory.",
    gameNarrative: `${winner} controlled the game from start to finish, defeating ${loser} in a competitive matchup. The favorites executed their game plan and advanced to the next round.`,
    winProbability: 0.7,
  };
}

// ─── simulateGame (internalAction) ───────────────────────────────────────────

export const simulateGame = internalAction({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    // Fetch the game
    const game = await ctx.runQuery(internal.bracket.getGame, {
      gameId: args.gameId,
    });
    if (!game) throw new Error(`Game not found: ${args.gameId}`);
    if (!game.teamAId || !game.teamBId) {
      throw new Error(`Game ${args.gameId} missing teams — cannot simulate`);
    }

    // Fetch both teams
    const [teamA, teamB] = await Promise.all([
      ctx.runQuery(internal.bracket.getTeam, { teamId: game.teamAId }),
      ctx.runQuery(internal.bracket.getTeam, { teamId: game.teamBId }),
    ]);
    if (!teamA || !teamB) {
      throw new Error(`Teams not found for game ${args.gameId}`);
    }

    // Mark as simulating
    await ctx.runMutation(internal.bracket.setGameStatus, {
      gameId: args.gameId,
      status: "simulating",
    });

    // Build prompt and call Claude
    const prompt = buildRefereePrompt(teamA, teamB);

    let result: GameResult;

    try {
      const rawResponse = await callClaudeApi(prompt);
      try {
        result = parseGameResult(rawResponse);
      } catch {
        // Retry once on malformed JSON
        console.warn(`Malformed JSON on first attempt for game ${args.gameId}, retrying...`);
        const retryResponse = await callClaudeApi(prompt);
        result = parseGameResult(retryResponse);
      }
    } catch (error) {
      // Deterministic fallback on total failure
      console.error(`Claude API failed for game ${args.gameId}:`, error);
      result = deterministicFallback(
        teamA.name,
        teamB.name,
        teamA.seed,
        teamB.seed
      );
    }

    // Determine winner/loser IDs
    const winnerId =
      result.winner === teamA.name ? game.teamAId : game.teamBId;
    const loserId =
      result.loser === teamA.name ? game.teamAId : game.teamBId;

    // Complete the game
    await ctx.runMutation(internal.bracket.completeGame, {
      gameId: args.gameId,
      winnerId,
      loserId,
      winnerScore: result.winnerScore,
      loserScore: result.loserScore,
      isUpset: result.isUpset,
      upsetMagnitude: result.upsetMagnitude > 0 ? result.upsetMagnitude : undefined,
      mvp: result.mvp,
      keyMoment: result.keyMoment,
      gameNarrative: result.gameNarrative,
      winProbability: result.winProbability,
    });

    // Schedule TTS generation
    await ctx.scheduler.runAfter(0, internal.tts.generateAudio, {
      gameId: args.gameId,
      narrative: result.gameNarrative,
    });
  },
});

// ─── simulateRound (internal, called by simulateAll) ─────────────────────────

export const simulateRound = internalAction({
  args: {
    tournamentId: v.id("tournaments"),
    round: v.string(),
  },
  handler: async (ctx, args) => {
    const games = await ctx.runQuery(internal.bracket.getPendingGamesForRound, {
      tournamentId: args.tournamentId,
      round: args.round,
    });

    const tournament = await ctx.runQuery(internal.bracket.getTournament, {
      tournamentId: args.tournamentId,
    });

    const speed = tournament?.speed ?? 500;

    for (const game of games) {
      await ctx.runAction(internal.simulate.simulateGame, {
        gameId: game._id,
      });

      // Pacing delay between games (skip if speed === 0)
      if (speed > 0) {
        await new Promise((resolve) => setTimeout(resolve, speed));
      }
    }

    // Advance to next round
    await ctx.runMutation(internal.bracket.advanceRound, {
      tournamentId: args.tournamentId,
    });
  },
});

// ─── simulateAll (internal) ───────────────────────────────────────────────────

export const simulateAll = internalAction({
  args: { tournamentId: v.id("tournaments") },
  handler: async (ctx, args) => {
    for (const round of ROUND_ORDER) {
      const tournament = await ctx.runQuery(internal.bracket.getTournament, {
        tournamentId: args.tournamentId,
      });

      // Stop if tournament was paused or completed externally
      if (!tournament || tournament.status === "paused" || tournament.status === "completed") {
        break;
      }

      await ctx.runAction(internal.simulate.simulateRound, {
        tournamentId: args.tournamentId,
        round,
      });
    }
  },
});

// ─── Public wrappers (called by frontend) ────────────────────────────────────

export const runSimulateRound = action({
  args: {
    tournamentId: v.id("tournaments"),
    round: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required to simulate");
    }

    // Check rate limit
    const today = new Date().toISOString().split("T")[0];
    const existing = await ctx.runQuery(internal.users.getRateLimitRecord, {
      userId: identity.subject,
      date: today,
    });
    const used = existing?.runCount ?? 0;
    if (used >= 3) {
      throw new Error("Daily simulation limit reached (3 runs per day)");
    }

    await ctx.runAction(internal.simulate.simulateRound, {
      tournamentId: args.tournamentId,
      round: args.round,
    });

    await ctx.runMutation(internal.users.recordSimulationRun, {
      userId: identity.subject,
    });
  },
});

export const runSimulateAll = action({
  args: { tournamentId: v.id("tournaments") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required to simulate");
    }

    // Check rate limit
    const today = new Date().toISOString().split("T")[0];
    const existing = await ctx.runQuery(internal.users.getRateLimitRecord, {
      userId: identity.subject,
      date: today,
    });
    const used = existing?.runCount ?? 0;
    if (used >= 3) {
      throw new Error("Daily simulation limit reached (3 runs per day)");
    }

    await ctx.runAction(internal.simulate.simulateAll, {
      tournamentId: args.tournamentId,
    });

    await ctx.runMutation(internal.users.recordSimulationRun, {
      userId: identity.subject,
    });
  },
});
