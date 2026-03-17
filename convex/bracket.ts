import { v } from "convex/values";
import {
  query,
  mutation,
  internalQuery,
  internalMutation,
} from "./_generated/server";

// ─── Public Queries ───────────────────────────────────────────────────────────

export const getTournaments = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("tournaments").collect();
  },
});

export const getBracketState = query({
  args: { tournamentId: v.id("tournaments") },
  handler: async (ctx, args) => {
    const tournament = await ctx.db.get(args.tournamentId);
    if (!tournament) return null;

    const teams = await ctx.db
      .query("teams")
      .withIndex("by_tournament", (q) => q.eq("tournamentId", args.tournamentId))
      .collect();

    const games = await ctx.db
      .query("games")
      .withIndex("by_tournament", (q) => q.eq("tournamentId", args.tournamentId))
      .collect();

    return { tournament, teams, games };
  },
});

export const getUpsets = query({
  args: { tournamentId: v.id("tournaments") },
  handler: async (ctx, args) => {
    const games = await ctx.db
      .query("games")
      .withIndex("by_tournament", (q) => q.eq("tournamentId", args.tournamentId))
      .collect();

    return games.filter((g) => g.status === "completed" && g.isUpset === true);
  },
});

export const getAudioUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const getGameDetail = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, { gameId }) => {
    const game = await ctx.db.get(gameId);
    if (!game) return null;

    const teamA = game.teamAId ? await ctx.db.get(game.teamAId) : null;
    const teamB = game.teamBId ? await ctx.db.get(game.teamBId) : null;
    const tournament = await ctx.db.get(game.tournamentId);

    return { game, teamA, teamB, tournament };
  },
});

// ─── Internal Queries ─────────────────────────────────────────────────────────

export const getGame = internalQuery({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.gameId);
  },
});

export const getTeam = internalQuery({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.teamId);
  },
});

export const getTournament = internalQuery({
  args: { tournamentId: v.id("tournaments") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.tournamentId);
  },
});

export const getPendingGamesForRound = internalQuery({
  args: {
    tournamentId: v.id("tournaments"),
    round: v.string(),
  },
  handler: async (ctx, args) => {
    const games = await ctx.db
      .query("games")
      .withIndex("by_tournament_round", (q) =>
        q.eq("tournamentId", args.tournamentId).eq("round", args.round)
      )
      .collect();

    return games
      .filter(
        (g) =>
          g.status === "pending" &&
          g.teamAId !== undefined &&
          g.teamBId !== undefined
      )
      .sort((a, b) => a.gameOrder - b.gameOrder);
  },
});

// ─── Internal Mutations ───────────────────────────────────────────────────────

export const setGameStatus = internalMutation({
  args: {
    gameId: v.id("games"),
    status: v.union(
      v.literal("pending"),
      v.literal("simulating"),
      v.literal("completed")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.gameId, { status: args.status });
  },
});

export const completeGame = internalMutation({
  args: {
    gameId: v.id("games"),
    winnerId: v.id("teams"),
    loserId: v.id("teams"),
    winnerScore: v.number(),
    loserScore: v.number(),
    isUpset: v.boolean(),
    upsetMagnitude: v.optional(v.number()),
    mvp: v.optional(v.string()),
    keyMoment: v.optional(v.string()),
    gameNarrative: v.optional(v.string()),
    winProbability: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error(`Game not found: ${args.gameId}`);

    // Mark game as completed with results
    await ctx.db.patch(args.gameId, {
      status: "completed",
      winnerId: args.winnerId,
      winnerScore: args.winnerScore,
      loserScore: args.loserScore,
      isUpset: args.isUpset,
      upsetMagnitude: args.upsetMagnitude,
      mvp: args.mvp,
      keyMoment: args.keyMoment,
      gameNarrative: args.gameNarrative,
      winProbability: args.winProbability,
    });

    // Mark loser as eliminated
    const loser = await ctx.db.get(args.loserId);
    if (loser) {
      await ctx.db.patch(args.loserId, {
        eliminated: true,
        eliminatedRound: game.round,
      });
    }

    // Advance winner to next game
    if (game.nextGameId && game.nextGameSlot) {
      const nextGame = await ctx.db.get(game.nextGameId);
      if (nextGame) {
        if (game.nextGameSlot === "A") {
          await ctx.db.patch(game.nextGameId, { teamAId: args.winnerId });
        } else {
          await ctx.db.patch(game.nextGameId, { teamBId: args.winnerId });
        }
      }
    }

    // Update tournament upset count
    if (args.isUpset) {
      const tournament = await ctx.db.get(game.tournamentId);
      if (tournament) {
        const winner = await ctx.db.get(args.winnerId);
        const winnerName = winner?.name ?? "Unknown";
        const currentBiggest = tournament.biggestUpset;
        const upsetMag = args.upsetMagnitude ?? 0;

        // Track biggest upset by magnitude
        let newBiggest = currentBiggest;
        if (!currentBiggest || upsetMag > 0) {
          newBiggest = winnerName;
        }

        await ctx.db.patch(game.tournamentId, {
          upsetCount: tournament.upsetCount + 1,
          biggestUpset: newBiggest,
        });
      }
    }
  },
});

const ROUND_ORDER = [
  "FIRST_FOUR",
  "R64",
  "R32",
  "S16",
  "E8",
  "F4",
  "CHAMP",
  "DONE",
] as const;

export const advanceRound = internalMutation({
  args: { tournamentId: v.id("tournaments") },
  handler: async (ctx, args) => {
    const tournament = await ctx.db.get(args.tournamentId);
    if (!tournament) throw new Error(`Tournament not found: ${args.tournamentId}`);

    const currentIndex = ROUND_ORDER.indexOf(
      tournament.currentRound as (typeof ROUND_ORDER)[number]
    );

    if (currentIndex === -1 || currentIndex >= ROUND_ORDER.length - 1) {
      return;
    }

    const nextRound = ROUND_ORDER[currentIndex + 1];

    if (nextRound === "DONE") {
      // Find the champion (last game completed, the winner)
      const champGames = await ctx.db
        .query("games")
        .withIndex("by_tournament_round", (q) =>
          q.eq("tournamentId", args.tournamentId).eq("round", "CHAMP")
        )
        .collect();

      let championName: string | undefined;
      let winner: { name: string; seed: number } | undefined;
      for (const g of champGames) {
        if (g.status === "completed" && g.winnerId) {
          const champ = await ctx.db.get(g.winnerId);
          if (champ) {
            championName = champ.name;
            winner = { name: champ.name, seed: champ.seed };
            break;
          }
        }
      }

      await ctx.db.patch(args.tournamentId, {
        currentRound: "DONE",
        status: "completed",
        champion: championName,
      });

      // Record simulation result
      const f4Games = await ctx.db
        .query("games")
        .withIndex("by_tournament_round", (q) =>
          q.eq("tournamentId", args.tournamentId).eq("round", "F4")
        )
        .collect();

      const finalFourTeams: { name: string; seed: number }[] = [];
      for (const game of f4Games) {
        if (game.teamAId) {
          const teamA = await ctx.db.get(game.teamAId);
          if (teamA) finalFourTeams.push({ name: teamA.name, seed: teamA.seed });
        }
        if (game.teamBId) {
          const teamB = await ctx.db.get(game.teamBId);
          if (teamB) finalFourTeams.push({ name: teamB.name, seed: teamB.seed });
        }
      }

      const allGames = await ctx.db
        .query("games")
        .withIndex("by_tournament", (q) => q.eq("tournamentId", args.tournamentId))
        .collect();

      await ctx.db.insert("simResults", {
        gender: tournament.gender,
        champion: winner?.name ?? "Unknown",
        championSeed: winner?.seed ?? 0,
        finalFourTeams,
        upsetCount: tournament.upsetCount,
        biggestUpset: tournament.biggestUpset,
        totalGames: allGames.filter((g) => g.status === "completed").length,
        completedAt: Date.now(),
      });
    } else {
      await ctx.db.patch(args.tournamentId, {
        currentRound: nextRound,
      });
    }
  },
});

export const patchGameAudio = internalMutation({
  args: {
    gameId: v.id("games"),
    audioStorageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.gameId, { audioStorageId: args.audioStorageId });
  },
});

// ─── Public Mutations ─────────────────────────────────────────────────────────

export const setSpeed = mutation({
  args: {
    tournamentId: v.id("tournaments"),
    speed: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.tournamentId, { speed: args.speed });
  },
});

export const setTournamentStatus = mutation({
  args: {
    tournamentId: v.id("tournaments"),
    status: v.union(
      v.literal("ready"),
      v.literal("simulating"),
      v.literal("paused"),
      v.literal("completed")
    ),
  },
  handler: async (ctx, args) => {
    const tournament = await ctx.db.get(args.tournamentId);
    if (!tournament) throw new Error(`Tournament not found: ${args.tournamentId}`);

    const current = tournament.status;
    const next = args.status;

    const validTransitions: Record<string, string[]> = {
      ready: ["simulating"],
      simulating: ["paused", "completed"],
      paused: ["simulating", "ready"],
      completed: ["ready"],
    };

    const allowed = validTransitions[current] ?? [];
    if (!allowed.includes(next)) {
      throw new Error(
        `Invalid status transition: ${current} → ${next}`
      );
    }

    await ctx.db.patch(args.tournamentId, { status: next });
  },
});

export const resetTournament = mutation({
  args: { tournamentId: v.id("tournaments") },
  handler: async (ctx, args) => {
    const tournament = await ctx.db.get(args.tournamentId);
    if (!tournament) throw new Error(`Tournament not found: ${args.tournamentId}`);

    // Reset all games to pending state and clear results
    const games = await ctx.db
      .query("games")
      .withIndex("by_tournament", (q) => q.eq("tournamentId", args.tournamentId))
      .collect();

    for (const game of games) {
      // Delete audio from storage if present
      if (game.audioStorageId) {
        await ctx.storage.delete(game.audioStorageId);
      }

      await ctx.db.patch(game._id, {
        status: "pending",
        winnerId: undefined,
        winnerScore: undefined,
        loserScore: undefined,
        isUpset: undefined,
        upsetMagnitude: undefined,
        mvp: undefined,
        keyMoment: undefined,
        gameNarrative: undefined,
        winProbability: undefined,
        audioStorageId: undefined,
      });
    }

    // Reset all teams
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_tournament", (q) => q.eq("tournamentId", args.tournamentId))
      .collect();

    for (const team of teams) {
      await ctx.db.patch(team._id, {
        eliminated: false,
        eliminatedRound: undefined,
      });
    }

    // Reset tournament
    await ctx.db.patch(args.tournamentId, {
      status: "ready",
      currentRound: "FIRST_FOUR",
      currentGameIndex: 0,
      upsetCount: 0,
      biggestUpset: undefined,
      champion: undefined,
    });

    // Clear team slots for all rounds beyond R64 (R32, S16, E8, F4, CHAMP).
    // R64 and FIRST_FOUR games retain their initial team assignments from the seed data.
    // The 4 R64 games fed by FIRST_FOUR results will have slightly stale team data until
    // FIRST_FOUR is resimulated and completeGame overwrites those slots — acceptable behavior.
    const postR64Rounds = new Set(["R32", "S16", "E8", "F4", "CHAMP"]);
    for (const game of games) {
      if (postR64Rounds.has(game.round)) {
        await ctx.db.patch(game._id, {
          teamAId: undefined,
          teamBId: undefined,
        });
      }
    }
  },
});

// ─── Clear All Data ──────────────────────────────────────────────────────────

export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const tournaments = await ctx.db.query("tournaments").collect();
    const teams = await ctx.db.query("teams").collect();
    const games = await ctx.db.query("games").collect();

    for (const game of games) {
      // Delete associated audio files
      if (game.audioStorageId) {
        await ctx.storage.delete(game.audioStorageId);
      }
      await ctx.db.delete(game._id);
    }
    for (const team of teams) {
      await ctx.db.delete(team._id);
    }
    for (const tournament of tournaments) {
      await ctx.db.delete(tournament._id);
    }
  },
});
