import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tournaments: defineTable({
    name: v.string(),
    year: v.number(),
    gender: v.union(v.literal("men"), v.literal("women")),
    status: v.union(
      v.literal("ready"),
      v.literal("simulating"),
      v.literal("paused"),
      v.literal("completed")
    ),
    currentRound: v.string(),
    currentGameIndex: v.number(),
    speed: v.number(),
    upsetCount: v.number(),
    biggestUpset: v.optional(v.string()),
    champion: v.optional(v.string()),
  }),

  teams: defineTable({
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
    eliminated: v.boolean(),
    eliminatedRound: v.optional(v.string()),
  })
    .index("by_tournament", ["tournamentId"])
    .index("by_tournament_region", ["tournamentId", "region"]),

  games: defineTable({
    tournamentId: v.id("tournaments"),
    round: v.string(),
    region: v.optional(v.string()),
    bracketSlot: v.string(),
    gameOrder: v.number(),
    teamAId: v.optional(v.id("teams")),
    teamBId: v.optional(v.id("teams")),
    status: v.union(
      v.literal("pending"),
      v.literal("simulating"),
      v.literal("completed")
    ),
    winnerId: v.optional(v.id("teams")),
    winnerScore: v.optional(v.number()),
    loserScore: v.optional(v.number()),
    isUpset: v.optional(v.boolean()),
    upsetMagnitude: v.optional(v.number()),
    mvp: v.optional(v.string()),
    keyMoment: v.optional(v.string()),
    gameNarrative: v.optional(v.string()),
    winProbability: v.optional(v.float64()),
    audioStorageId: v.optional(v.id("_storage")),
    scheduledTime: v.optional(v.string()),
    venue: v.optional(v.string()),
    tvChannel: v.optional(v.string()),
    nextGameId: v.optional(v.id("games")),
    nextGameSlot: v.optional(v.union(v.literal("A"), v.literal("B"))),
  })
    .index("by_tournament", ["tournamentId"])
    .index("by_tournament_round", ["tournamentId", "round"])
    .index("by_order", ["tournamentId", "gameOrder"]),
});
