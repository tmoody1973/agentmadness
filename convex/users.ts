import { v } from "convex/values";
import { internalMutation, internalQuery, query } from "./_generated/server";

const DAILY_LIMIT = 3;

// ─── recordSimulationRun (internal) ──────────────────────────────────────────

export const recordSimulationRun = internalMutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const today = new Date().toISOString().split("T")[0];

    const existing = await ctx.db
      .query("userLimits")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", userId).eq("date", today)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { runCount: existing.runCount + 1 });
    } else {
      await ctx.db.insert("userLimits", { userId, date: today, runCount: 1 });
    }
  },
});

// ─── getRateLimitRecord (internal query for use inside actions) ───────────────

export const getRateLimitRecord = internalQuery({
  args: { userId: v.string(), date: v.string() },
  handler: async (ctx, { userId, date }) => {
    return ctx.db
      .query("userLimits")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", userId).eq("date", date)
      )
      .first();
  },
});

// ─── checkRateLimit (public query for UI) ────────────────────────────────────

export const checkRateLimit = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { allowed: false, remaining: 0, authenticated: false };
    }

    const today = new Date().toISOString().split("T")[0];
    const existing = await ctx.db
      .query("userLimits")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", identity.subject).eq("date", today)
      )
      .first();

    const used = existing?.runCount ?? 0;
    const remaining = Math.max(0, DAILY_LIMIT - used);
    return { allowed: remaining > 0, remaining, authenticated: true };
  },
});
