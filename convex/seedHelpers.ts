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
