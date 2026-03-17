"use node";

import { v } from "convex/values";
import { internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { MEN_BRACKET_2026, WOMEN_BRACKET_2026 } from "../src/data/bracket-2026";
import type { BracketData } from "../scripts/lib/types";

// ─── Internal Mutations ──────────────────────────────────────────────────────

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

// ─── Seed Action ─────────────────────────────────────────────────────────────

async function seedBracket(
  ctx: { runMutation: Function },
  bracket: BracketData,
  name: string,
  gender: "men" | "women"
): Promise<void> {
  const tournamentId = await ctx.runMutation(internal.init.createTournament, {
    name,
    year: 2026,
    gender,
  });

  // Build a map from seedCode → teamId in DB
  const seedCodeToDbId = new Map<string, any>();

  for (const team of bracket.teams) {
    const record = `${team.stats.wins}-${team.stats.losses}`;
    const dbId = await ctx.runMutation(internal.init.createTeam, {
      tournamentId,
      teamKey: `${team.teamId}`,
      name: team.name,
      seed: team.seed,
      region: team.region,
      conference: team.conference,
      record,
      netRanking: team.netRanking,
      adjOE: team.stats.adjOE,
      adjDE: team.stats.adjDE,
      adjTempo: team.stats.adjTempo,
      volatility: team.stats.volatility,
      tournamentExperience: team.tournamentExperience,
      clutchRating: team.clutchRating,
      depthScore: team.depthScore,
      keyPlayers: team.keyPlayers.join(", "),
      styleTraits: team.styleTraits,
      perplexityContext: team.perplexityContext || undefined,
      eliminated: false,
    });
    seedCodeToDbId.set(team.seedCode, dbId);
  }

  // First pass: create all games, storing gameId by bracketSlot
  const bracketSlotToDbId = new Map<string, any>();

  for (const game of bracket.games) {
    const teamAId = seedCodeToDbId.get(game.teamASeedCode);
    const teamBId = seedCodeToDbId.get(game.teamBSeedCode);

    const dbId = await ctx.runMutation(internal.init.createGame, {
      tournamentId,
      round: game.round,
      region: game.region || undefined,
      bracketSlot: game.bracketSlot,
      gameOrder: game.gameOrder,
      teamAId: teamAId ?? undefined,
      teamBId: teamBId ?? undefined,
      scheduledTime: game.scheduledTime || undefined,
      venue: game.venue || undefined,
      tvChannel: game.tvChannel || undefined,
    });

    bracketSlotToDbId.set(game.bracketSlot, dbId);
  }

  // Build a map from nextSlot → array of [gameOrder, bracketSlot] to determine A/B
  const nextSlotFeeders = new Map<string, Array<{ gameOrder: number; bracketSlot: string }>>();
  for (const game of bracket.games) {
    if (game.nextSlot) {
      const feeders = nextSlotFeeders.get(game.nextSlot) ?? [];
      feeders.push({ gameOrder: game.gameOrder, bracketSlot: game.bracketSlot });
      nextSlotFeeders.set(game.nextSlot, feeders);
    }
  }

  // Second pass: wire nextGameId + nextGameSlot
  for (const game of bracket.games) {
    if (!game.nextSlot) continue;

    const nextDbId = bracketSlotToDbId.get(game.nextSlot);
    if (!nextDbId) continue;

    const currentDbId = bracketSlotToDbId.get(game.bracketSlot);
    if (!currentDbId) continue;

    // Determine if this game's winner goes to slot A or B
    const feeders = nextSlotFeeders.get(game.nextSlot) ?? [];
    const sortedFeeders = [...feeders].sort((a, b) => a.gameOrder - b.gameOrder);
    const slotIndex = sortedFeeders.findIndex((f) => f.bracketSlot === game.bracketSlot);
    const nextGameSlot: "A" | "B" = slotIndex === 0 ? "A" : "B";

    await ctx.runMutation(internal.init.wireNextGame, {
      gameId: currentDbId,
      nextGameId: nextDbId,
      nextGameSlot,
    });
  }
}

export const seedAll = internalAction({
  args: {},
  handler: async (ctx) => {
    await seedBracket(ctx, MEN_BRACKET_2026, "NCAA Men's Tournament 2026", "men");
    await seedBracket(ctx, WOMEN_BRACKET_2026, "NCAA Women's Tournament 2026", "women");
  },
});
