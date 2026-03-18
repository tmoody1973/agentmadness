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
