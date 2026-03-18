import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

// ─── Internal Mutations for Seeding ─────────────────────────────────────────
// These MUST be in a non-"use node" file — only actions can use Node.js runtime

export const createTournament = internalMutation({
  args: {
    name: v.string(),
    year: v.number(),
    gender: v.union(v.literal("men"), v.literal("women")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("tournaments", {
      name: args.name,
      year: args.year,
      gender: args.gender,
      status: "ready",
      currentRound: "FIRST_FOUR",
      currentGameIndex: 0,
      speed: 500,
      upsetCount: 0,
    });
  },
});

export const createTeam = internalMutation({
  args: {
    tournamentId: v.id("tournaments"),
    teamKey: v.string(),
    name: v.string(),
    seed: v.number(),
    region: v.string(),
    conference: v.string(),
    record: v.string(),
    netRanking: v.number(),
    adjOE: v.float64(),
    adjDE: v.float64(),
    adjTempo: v.float64(),
    volatility: v.float64(),
    tournamentExperience: v.float64(),
    clutchRating: v.float64(),
    depthScore: v.float64(),
    keyPlayers: v.string(),
    styleTraits: v.array(v.string()),
    perplexityContext: v.optional(v.string()),
    coach: v.optional(v.string()),
    kenPomRank: v.optional(v.number()),
    apRank: v.optional(v.number()),
    compositeRank: v.optional(v.number()),
    eliminated: v.boolean(),
    eliminatedRound: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("teams", { ...args });
  },
});

export const createGame = internalMutation({
  args: {
    tournamentId: v.id("tournaments"),
    round: v.string(),
    region: v.optional(v.string()),
    bracketSlot: v.string(),
    gameOrder: v.number(),
    teamAId: v.optional(v.id("teams")),
    teamBId: v.optional(v.id("teams")),
    scheduledTime: v.optional(v.string()),
    venue: v.optional(v.string()),
    tvChannel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("games", {
      ...args,
      status: "pending",
    });
  },
});

export const wireNextGame = internalMutation({
  args: {
    gameId: v.id("games"),
    nextGameId: v.id("games"),
    nextGameSlot: v.union(v.literal("A"), v.literal("B")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.gameId, {
      nextGameId: args.nextGameId,
      nextGameSlot: args.nextGameSlot,
    });
  },
});

// ─── Daily Recap Storage ─────────────────────────────────────────────────────

const gameSchema = v.object({
  teamAName: v.string(),
  teamASeed: v.number(),
  teamBName: v.string(),
  teamBSeed: v.number(),
  ourPrediction: v.number(),
  actualWinner: v.string(),
  actualScoreWinner: v.optional(v.number()),
  actualScoreLoser: v.optional(v.number()),
  weWereRight: v.boolean(),
  isUpset: v.boolean(),
});

export const storeRecap = internalMutation({
  args: {
    date: v.string(),
    gender: v.union(v.literal("men"), v.literal("women")),
    title: v.string(),
    summary: v.string(),
    script: v.string(),
    audioStorageId: v.optional(v.id("_storage")),
    imageStorageId: v.optional(v.id("_storage")),
    games: v.array(gameSchema),
    accuracy: v.number(),
    totalGames: v.number(),
    correctPicks: v.number(),
    biggestSurprise: v.optional(v.string()),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("dailyRecaps")
      .withIndex("by_date_gender", (q) => q.eq("date", args.date).eq("gender", args.gender))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }
    return ctx.db.insert("dailyRecaps", args);
  },
});

export const deleteRecap = internalMutation({
  args: { date: v.string(), gender: v.union(v.literal("men"), v.literal("women")) },
  handler: async (ctx, { date, gender }) => {
    const recap = await ctx.db
      .query("dailyRecaps")
      .withIndex("by_date_gender", (q) => q.eq("date", date).eq("gender", gender))
      .first();
    if (recap) {
      if (recap.audioStorageId) await ctx.storage.delete(recap.audioStorageId);
      if (recap.imageStorageId) await ctx.storage.delete(recap.imageStorageId);
      await ctx.db.delete(recap._id);
    }
  },
});

export const createManualRecap = internalMutation({
  args: {
    date: v.string(),
    gender: v.union(v.literal("men"), v.literal("women")),
    title: v.string(),
    summary: v.string(),
    script: v.string(),
    games: v.array(v.object({
      teamAName: v.string(),
      teamASeed: v.number(),
      teamBName: v.string(),
      teamBSeed: v.number(),
      ourPrediction: v.number(),
      actualWinner: v.string(),
      actualScoreWinner: v.optional(v.number()),
      actualScoreLoser: v.optional(v.number()),
      weWereRight: v.boolean(),
      isUpset: v.boolean(),
    })),
    accuracy: v.number(),
    totalGames: v.number(),
    correctPicks: v.number(),
    biggestSurprise: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("dailyRecaps")
      .withIndex("by_date_gender", (q) => q.eq("date", args.date).eq("gender", args.gender))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { ...args, createdAt: Date.now() });
      return existing._id;
    }
    return ctx.db.insert("dailyRecaps", { ...args, createdAt: Date.now() });
  },
});

export const updateFirstFourResult = internalMutation({
  args: {
    tournamentId: v.id("tournaments"),
    bracketSlot: v.string(),
    winnerName: v.string(),
    winnerScore: v.number(),
    loserScore: v.number(),
  },
  handler: async (ctx, { tournamentId, bracketSlot, winnerName, winnerScore, loserScore }) => {
    const games = await ctx.db
      .query("games")
      .withIndex("by_tournament", (q) => q.eq("tournamentId", tournamentId))
      .collect();
    const game = games.find((g) => g.bracketSlot === bracketSlot);
    if (!game) throw new Error("Game not found for slot " + bracketSlot);
    const teamA = game.teamAId ? await ctx.db.get(game.teamAId) : null;
    const teamB = game.teamBId ? await ctx.db.get(game.teamBId) : null;
    if (!teamA || !teamB) throw new Error("Teams not found");
    const winner = teamA.name === winnerName ? teamA : teamB;
    const loser = teamA.name === winnerName ? teamB : teamA;
    await ctx.db.patch(game._id, {
      status: "completed",
      winnerId: winner._id,
      winnerScore,
      loserScore,
      isUpset: false,
      upsetMagnitude: 0,
      mvp: "Real result",
      keyMoment: "Actual tournament result",
      gameNarrative: winner.name + " defeated " + loser.name + " " + winnerScore + "-" + loserScore + " in the First Four.",
      winProbability: 0.5,
    });
    await ctx.db.patch(loser._id, { eliminated: true, eliminatedRound: "FIRST_FOUR" });
    if (game.nextGameId && game.nextGameSlot) {
      const patch = game.nextGameSlot === "A" ? { teamAId: winner._id } : { teamBId: winner._id };
      await ctx.db.patch(game.nextGameId, patch);
    }
    return { winner: winner.name, loser: loser.name };
  },
});
