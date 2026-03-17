import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ─── Get or create a user's personal tournament for a given gender ─────────────

export const getMyTournament = query({
  args: { gender: v.union(v.literal("men"), v.literal("women")) },
  handler: async (ctx, { gender }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const tournament = await ctx.db
      .query("tournaments")
      .filter((q) =>
        q.and(
          q.eq(q.field("gender"), gender),
          q.eq(q.field("userId"), identity.subject)
        )
      )
      .first();

    return tournament;
  },
});

// ─── Create a personal tournament copy from the template ──────────────────────

export const createMyTournament = mutation({
  args: { gender: v.union(v.literal("men"), v.literal("women")) },
  handler: async (ctx, { gender }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Authentication required");

    // Check if user already has a tournament for this gender
    const existing = await ctx.db
      .query("tournaments")
      .filter((q) =>
        q.and(
          q.eq(q.field("gender"), gender),
          q.eq(q.field("userId"), identity.subject)
        )
      )
      .first();

    if (existing) return existing._id;

    // Find the template tournament (no userId)
    const template = await ctx.db
      .query("tournaments")
      .filter((q) =>
        q.and(
          q.eq(q.field("gender"), gender),
          q.or(
            q.eq(q.field("userId"), undefined),
            q.eq(q.field("userId"), null)
          )
        )
      )
      .first();

    if (!template) throw new Error("No template tournament found. Run seed first.");

    // Clone tournament
    const tournamentId = await ctx.db.insert("tournaments", {
      name: template.name,
      year: template.year,
      gender: template.gender,
      status: "ready",
      currentRound: "FIRST_FOUR",
      currentGameIndex: 0,
      speed: 500,
      upsetCount: 0,
      userId: identity.subject,
      simParams: { chaosLevel: 50, homeCourtBoost: 50, recencyWeight: 50 },
    });

    // Clone all teams
    const templateTeams = await ctx.db
      .query("teams")
      .withIndex("by_tournament", (q) => q.eq("tournamentId", template._id))
      .collect();

    const teamIdMap = new Map<string, string>(); // old ID → new ID

    for (const team of templateTeams) {
      const { _id, _creationTime, tournamentId: _tid, ...teamData } = team;
      const newId = await ctx.db.insert("teams", {
        ...teamData,
        tournamentId,
        eliminated: false,
        eliminatedRound: undefined,
      });
      teamIdMap.set(_id, newId);
    }

    // Clone all games
    const templateGames = await ctx.db
      .query("games")
      .withIndex("by_tournament", (q) => q.eq("tournamentId", template._id))
      .collect();

    const gameIdMap = new Map<string, string>(); // old game ID → new game ID

    // First pass: create games
    for (const game of templateGames) {
      const { _id, _creationTime, tournamentId: _tid, nextGameId, winnerId, ...gameData } = game;
      const newId = await ctx.db.insert("games", {
        ...gameData,
        tournamentId,
        teamAId: game.teamAId ? (teamIdMap.get(game.teamAId) as any) : undefined,
        teamBId: game.teamBId ? (teamIdMap.get(game.teamBId) as any) : undefined,
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
        nextGameId: undefined,
      });
      gameIdMap.set(_id, newId);
    }

    // Second pass: wire nextGameId
    for (const game of templateGames) {
      if (game.nextGameId) {
        const newGameId = gameIdMap.get(game._id);
        const newNextGameId = gameIdMap.get(game.nextGameId);
        if (newGameId && newNextGameId) {
          await ctx.db.patch(newGameId as any, {
            nextGameId: newNextGameId as any,
            nextGameSlot: game.nextGameSlot,
          });
        }
      }
    }

    return tournamentId;
  },
});

// ─── Update simulation parameters ─────────────────────────────────────────────

export const updateSimParams = mutation({
  args: {
    tournamentId: v.id("tournaments"),
    simParams: v.object({
      chaosLevel: v.number(),
      homeCourtBoost: v.number(),
      recencyWeight: v.number(),
    }),
  },
  handler: async (ctx, { tournamentId, simParams }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Authentication required");

    const tournament = await ctx.db.get(tournamentId);
    if (!tournament || tournament.userId !== identity.subject) {
      throw new Error("Not your tournament");
    }

    await ctx.db.patch(tournamentId, { simParams });
  },
});
