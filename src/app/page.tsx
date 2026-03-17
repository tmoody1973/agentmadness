"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { TournamentToggle } from "../components/TournamentToggle";
import { SimControls } from "../components/SimControls";
import { StatsOverlay } from "../components/StatsOverlay";
import { Bracket } from "../components/Bracket";
import { GameNarrative } from "../components/GameNarrative";
import type { Game } from "../lib/types";

export default function Home() {
  const [activeTournamentId, setActiveTournamentId] = useState<string | null>(
    null
  );
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [announcerEnabled, setAnnouncerEnabled] = useState(false);

  const tournaments = useQuery(api.bracket.getTournaments, {});

  // Auto-select first tournament when data arrives
  const effectiveTournamentId =
    activeTournamentId ?? tournaments?.[0]?._id ?? null;

  const bracketState = useQuery(
    api.bracket.getBracketState,
    effectiveTournamentId
      ? { tournamentId: effectiveTournamentId as Id<"tournaments"> }
      : "skip"
  );

  const upsets = useQuery(
    api.bracket.getUpsets,
    effectiveTournamentId
      ? { tournamentId: effectiveTournamentId as Id<"tournaments"> }
      : "skip"
  );

  const isLoading = !tournaments || (effectiveTournamentId && !bracketState);

  const selectedGame: Game | null =
    selectedGameId && bracketState?.games
      ? (bracketState.games.find((g: Game) => g._id === selectedGameId) ?? null)
      : null;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
          <p className="text-gray-400 text-sm">Loading bracket…</p>
        </div>
      </div>
    );
  }

  if (!tournaments || tournaments.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="text-5xl mb-4">🏀</div>
          <h1 className="text-2xl font-bold text-white mb-2">
            No Tournaments Found
          </h1>
          <p className="text-gray-400">
            Run the seed script to initialize the tournament data.
          </p>
        </div>
      </div>
    );
  }

  const { tournament, teams, games } = bracketState ?? {};

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-gray-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏆</span>
            <div>
              <h1 className="text-lg font-bold leading-tight text-white">
                March Madness Sim
              </h1>
              <p className="text-xs text-gray-500">2025 NCAA Tournament</p>
            </div>
          </div>

          {tournaments && tournaments.length > 1 && (
            <TournamentToggle
              tournaments={tournaments}
              activeTournamentId={effectiveTournamentId ?? ""}
              onSelect={setActiveTournamentId}
            />
          )}
        </div>
      </header>

      {/* Champion celebration overlay */}
      {tournament?.champion && (
        <div className="sticky top-16 z-20 mx-auto max-w-screen-2xl px-4 py-2">
          <div className="rounded-xl bg-yellow-500/10 border border-yellow-400/30 px-4 py-2 text-center text-sm font-semibold text-yellow-300">
            🏆 Tournament Complete! Champion:{" "}
            {teams?.find((t) => t._id === tournament.champion)?.name ?? "Unknown"}
          </div>
        </div>
      )}

      <main className="mx-auto max-w-screen-2xl px-4 py-4 flex flex-col gap-4">
        {tournament && effectiveTournamentId && (
          <SimControls
            tournament={tournament}
            tournamentId={effectiveTournamentId}
            announcerEnabled={announcerEnabled}
            onAnnouncerToggle={setAnnouncerEnabled}
            upsetCount={tournament.upsetCount}
          />
        )}

        {tournament && teams && upsets !== undefined && (
          <StatsOverlay
            tournament={tournament}
            teams={teams}
            upsets={upsets as Game[]}
          />
        )}

        {tournament && teams && games && (
          <Bracket
            tournament={tournament}
            teams={teams}
            games={games}
            onSelectGame={setSelectedGameId}
            selectedGameId={selectedGameId ?? undefined}
          />
        )}
      </main>

      {/* Game narrative panel */}
      {teams && (
        <GameNarrative
          game={selectedGame}
          teams={teams}
          announcerEnabled={announcerEnabled}
        />
      )}
    </div>
  );
}
