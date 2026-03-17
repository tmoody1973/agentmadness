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
    userId: v.optional(v.string()), // Clerk user ID — null for template tournaments
    simParams: v.optional(v.object({
      chaosLevel: v.number(),      // 0-100, default 50. Higher = more upsets
      homeCourtBoost: v.number(),  // 0-100, default 50. Higher = favors higher seeds
      recencyWeight: v.number(),   // 0-100, default 50. Higher = weights recent games more
    })),
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
    coach: v.optional(v.string()),
    kenPomRank: v.optional(v.number()),
    apRank: v.optional(v.number()),
    compositeRank: v.optional(v.number()),
    eliminated: v.boolean(),
    eliminatedRound: v.optional(v.string()),
  })
    .index("by_tournament", ["tournamentId"])
    .index("by_tournament_region", ["tournamentId", "region"]),

  userLimits: defineTable({
    userId: v.string(),
    date: v.string(),
    runCount: v.number(),
  }).index("by_user_date", ["userId", "date"]),

  simResults: defineTable({
    userId: v.optional(v.string()),
    gender: v.union(v.literal("men"), v.literal("women")),
    champion: v.string(),
    championSeed: v.number(),
    finalFourTeams: v.array(v.object({
      name: v.string(),
      seed: v.number(),
    })),
    upsetCount: v.number(),
    biggestUpset: v.optional(v.string()),
    totalGames: v.number(),
    completedAt: v.number(),
  })
    .index("by_gender", ["gender"])
    .index("by_champion", ["champion"]),

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

  dailyRecaps: defineTable({
    date: v.string(), // "2026-03-19"
    gender: v.union(v.literal("men"), v.literal("women")),
    title: v.string(),
    summary: v.string(),
    script: v.string(),
    audioStorageId: v.optional(v.id("_storage")),
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
    createdAt: v.number(),
  })
    .index("by_date_gender", ["date", "gender"])
    .index("by_gender", ["gender"]),
});
