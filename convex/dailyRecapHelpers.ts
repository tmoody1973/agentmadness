import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

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
      .withIndex("by_date_gender", (q) =>
        q.eq("date", args.date).eq("gender", args.gender)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }

    return ctx.db.insert("dailyRecaps", args);
  },
});

export const getRecapsByGender = query({
  args: { gender: v.union(v.literal("men"), v.literal("women")) },
  handler: async (ctx, { gender }) => {
    return ctx.db
      .query("dailyRecaps")
      .withIndex("by_gender", (q) => q.eq("gender", gender))
      .order("desc")
      .collect();
  },
});

export const getLatestRecap = query({
  args: { gender: v.union(v.literal("men"), v.literal("women")) },
  handler: async (ctx, { gender }) => {
    return ctx.db
      .query("dailyRecaps")
      .withIndex("by_gender", (q) => q.eq("gender", gender))
      .order("desc")
      .first();
  },
});

export const getRecapAudioUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    return ctx.storage.getUrl(storageId);
  },
});

export const getRecapImageUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    return ctx.storage.getUrl(storageId);
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

// Update template bracket with real First Four results
export const updateFirstFourResult = internalMutation({
  args: {
    tournamentId: v.id("tournaments"),
    bracketSlot: v.string(), // e.g. "Y16", "Z11"
    winnerName: v.string(),
    winnerScore: v.number(),
    loserScore: v.number(),
  },
  handler: async (ctx, { tournamentId, bracketSlot, winnerName, winnerScore, loserScore }) => {
    // Find the game by bracket slot
    const games = await ctx.db
      .query("games")
      .withIndex("by_tournament", (q) => q.eq("tournamentId", tournamentId))
      .collect();
    
    const game = games.find((g) => g.bracketSlot === bracketSlot);
    if (!game) throw new Error(`Game not found for slot ${bracketSlot}`);
    
    // Find both teams
    const teamA = game.teamAId ? await ctx.db.get(game.teamAId) : null;
    const teamB = game.teamBId ? await ctx.db.get(game.teamBId) : null;
    
    if (!teamA || !teamB) throw new Error("Teams not found");
    
    const winner = teamA.name === winnerName ? teamA : teamB;
    const loser = teamA.name === winnerName ? teamB : teamA;
    
    // Update game
    await ctx.db.patch(game._id, {
      status: "completed" as const,
      winnerId: winner._id,
      winnerScore,
      loserScore,
      isUpset: false,
      upsetMagnitude: 0,
      mvp: "Real game result",
      keyMoment: "Actual tournament result",
      gameNarrative: `${winner.name} defeated ${loser.name} ${winnerScore}-${loserScore} in the First Four.`,
      winProbability: 0.5,
    });
    
    // Mark loser eliminated
    await ctx.db.patch(loser._id, {
      eliminated: true,
      eliminatedRound: "FIRST_FOUR",
    });
    
    // Advance winner to next game
    if (game.nextGameId && game.nextGameSlot) {
      const patch = game.nextGameSlot === "A"
        ? { teamAId: winner._id }
        : { teamBId: winner._id };
      await ctx.db.patch(game.nextGameId, patch);
    }
    
    return { winner: winner.name, loser: loser.name };
  },
});
