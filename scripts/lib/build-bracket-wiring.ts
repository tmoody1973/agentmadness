import type { BracketGame, Round, SlotWiring } from "./types";
import type { ScheduleEntry } from "./schedule-data";

// Region letter -> region name mappings
type RegionMap = Record<string, string>;

// Detect round from Kaggle slot name
function detectRound(slot: string): Round {
  // First Four slots have no "R" prefix and look like "X16", "Y11", "Z11", "Y16"
  // They are 2-4 chars: letter + digits (no R prefix, no position suffix like R1W1)
  if (/^[WXYZ]\d+$/.test(slot)) {
    return "FIRST_FOUR";
  }

  // Round slots: R1=R64, R2=R32, R3=S16, R4=E8, R5=F4, R6=CHAMP
  const match = slot.match(/^R(\d)/);
  if (match) {
    const roundNum = parseInt(match[1]);
    switch (roundNum) {
      case 1: return "R64";
      case 2: return "R32";
      case 3: return "S16";
      case 4: return "E8";
      case 5: return "F4";
      case 6: return "CHAMP";
      default: return "R64";
    }
  }

  return "R64";
}

// Get region from slot name
function getRegionFromSlot(slot: string, regionMap: RegionMap): string {
  // First Four: e.g. "X16", "Y11"
  if (/^[WXYZ]\d+$/.test(slot)) {
    return regionMap[slot[0]] ?? slot[0];
  }

  // Round slots: e.g. "R1W1", "R3X2", "R5WX", "R6CH"
  const match = slot.match(/^R\d([WXYZ])/);
  if (match) {
    return regionMap[match[1]] ?? match[1];
  }

  // Final Four slots like R5WX span two regions
  if (slot.startsWith("R5") || slot.startsWith("R6")) {
    return "National";
  }

  return "Unknown";
}

// Find which parent slot this slot feeds into
function findNextSlot(slot: string, allSlots: SlotWiring[]): string | null {
  for (const s of allSlots) {
    if (s.strongSeed === slot || s.weakSeed === slot) {
      return s.slot;
    }
  }
  return null;
}

// Determine game order
// First Four first (alphabetical by slot), then R64, R32, S16, E8, F4, CHAMP
const ROUND_ORDER: Record<Round, number> = {
  FIRST_FOUR: 0,
  R64: 1,
  R32: 2,
  S16: 3,
  E8: 4,
  F4: 5,
  CHAMP: 6,
};

function getDefaultSchedule(): ScheduleEntry {
  return {
    scheduledTime: "TBD",
    venue: "TBD",
    tvChannel: "TBD",
  };
}

export function buildBracketWiring(
  slots: SlotWiring[],
  regionMap: RegionMap,
  schedule: Record<string, ScheduleEntry>
): BracketGame[] {
  const games: BracketGame[] = [];

  for (const slot of slots) {
    const round = detectRound(slot.slot);
    const region = getRegionFromSlot(slot.slot, regionMap);
    const nextSlot = findNextSlot(slot.slot, slots);
    const schedEntry = schedule[slot.slot] ?? getDefaultSchedule();

    games.push({
      round,
      region,
      bracketSlot: slot.slot,
      gameOrder: 0, // will be set after sorting
      teamASeedCode: slot.strongSeed,
      teamBSeedCode: slot.weakSeed,
      nextSlot,
      nextGameSlot: nextSlot,
      scheduledTime: schedEntry.scheduledTime,
      venue: schedEntry.venue,
      tvChannel: schedEntry.tvChannel,
    });
  }

  // Sort: by round order, then by slot name for determinism
  games.sort((a, b) => {
    const roundDiff = ROUND_ORDER[a.round] - ROUND_ORDER[b.round];
    if (roundDiff !== 0) return roundDiff;
    return a.bracketSlot.localeCompare(b.bracketSlot);
  });

  // Assign gameOrder
  games.forEach((g, i) => {
    g.gameOrder = i + 1;
  });

  return games;
}
