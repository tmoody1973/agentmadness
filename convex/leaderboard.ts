import { v } from "convex/values";
import { query } from "./_generated/server";

// Get aggregated leaderboard data
export const getLeaderboard = query({
  args: { gender: v.union(v.literal("men"), v.literal("women")) },
  handler: async (ctx, { gender }) => {
    const results = await ctx.db
      .query("simResults")
      .withIndex("by_gender", (q) => q.eq("gender", gender))
      .collect();

    const totalRuns = results.length;
    if (totalRuns === 0) return { teams: [], totalRuns: 0 };

    // Aggregate championship wins and Final Four appearances
    const teamStats = new Map<string, {
      name: string;
      championshipWins: number;
      finalFourAppearances: number;
      bestSeed: number;
    }>();

    for (const result of results) {
      // Count championship
      const existing = teamStats.get(result.champion) ?? {
        name: result.champion,
        championshipWins: 0,
        finalFourAppearances: 0,
        bestSeed: 16,
      };
      existing.championshipWins++;
      existing.bestSeed = Math.min(existing.bestSeed, result.championSeed);
      teamStats.set(result.champion, existing);

      // Count Final Four appearances
      for (const team of result.finalFourTeams) {
        const ff = teamStats.get(team.name) ?? {
          name: team.name,
          championshipWins: 0,
          finalFourAppearances: 0,
          bestSeed: 16,
        };
        ff.finalFourAppearances++;
        ff.bestSeed = Math.min(ff.bestSeed, team.seed);
        teamStats.set(team.name, ff);
      }
    }

    // Sort by championship wins, then Final Four appearances
    const teams = Array.from(teamStats.values())
      .sort((a, b) => {
        if (b.championshipWins !== a.championshipWins) return b.championshipWins - a.championshipWins;
        return b.finalFourAppearances - a.finalFourAppearances;
      })
      .map((team) => ({
        ...team,
        championshipPct: totalRuns > 0 ? Math.round((team.championshipWins / totalRuns) * 100) : 0,
        finalFourPct: totalRuns > 0 ? Math.round((team.finalFourAppearances / totalRuns) * 100) : 0,
      }));

    return { teams, totalRuns };
  },
});

// Get recent simulation results
export const getRecentResults = query({
  args: { gender: v.union(v.literal("men"), v.literal("women")) },
  handler: async (ctx, { gender }) => {
    const results = await ctx.db
      .query("simResults")
      .withIndex("by_gender", (q) => q.eq("gender", gender))
      .order("desc")
      .take(20);

    return results;
  },
});

// Get upset statistics
export const getUpsetStats = query({
  args: { gender: v.union(v.literal("men"), v.literal("women")) },
  handler: async (ctx, { gender }) => {
    const results = await ctx.db
      .query("simResults")
      .withIndex("by_gender", (q) => q.eq("gender", gender))
      .collect();

    if (results.length === 0) return { avgUpsets: 0, maxUpsets: 0, cinderellaChampions: 0, totalRuns: 0 };

    const upsets = results.map((r) => r.upsetCount);
    const avgUpsets = Math.round(upsets.reduce((a, b) => a + b, 0) / upsets.length * 10) / 10;
    const maxUpsets = Math.max(...upsets);
    const cinderellaChampions = results.filter((r) => r.championSeed >= 5).length;

    return { avgUpsets, maxUpsets, cinderellaChampions, totalRuns: results.length };
  },
});
