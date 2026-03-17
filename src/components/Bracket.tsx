"use client";

import { useState } from "react";
import type { Tournament, Team, Game } from "../lib/types";
import { getGamesByRound } from "../lib/utils";
import { RegionBracket } from "./RegionBracket";
import { FinalFour } from "./FinalFour";
import { MatchupCard } from "./MatchupCard";

interface BracketProps {
  tournament: Tournament;
  teams: Team[];
  games: Game[];
  onSelectGame: (gameId: string) => void;
  onTeamClick?: (team: Team) => void;
  selectedGameId?: string;
}

const MEN_REGIONS = {
  topLeft: "East",
  topRight: "West",
  bottomLeft: "South",
  bottomRight: "Midwest",
};

const WOMEN_REGIONS = {
  topLeft: "Fort Worth 1",
  topRight: "Sacramento 4",
  bottomLeft: "Fort Worth 3",
  bottomRight: "Sacramento 2",
};

export function Bracket({
  tournament,
  teams,
  games,
  onSelectGame,
  onTeamClick,
  selectedGameId,
}: BracketProps) {
  const [firstFourOpen, setFirstFourOpen] = useState(false);

  const isMens = tournament.gender === "men";
  const regionConfig = isMens ? MEN_REGIONS : WOMEN_REGIONS;

  const firstFourGames = getGamesByRound(games, "FIRST_FOUR") as Game[];

  return (
    <div className="flex flex-col gap-6 px-4 py-4 min-w-[1300px]">
      {/* ── Top region pair: topLeft (LTR) + topRight (RTL) ── */}
      <div className="flex items-start gap-4 justify-center">
        <RegionBracket
          games={games}
          teams={teams}
          regionName={regionConfig.topLeft}
          direction="ltr"
          onSelectGame={onSelectGame}
          onTeamClick={onTeamClick}
          selectedGameId={selectedGameId}
        />

        {/* Spacer to push FinalFour into the center on the row below */}
        <div className="flex-1 shrink-0" />

        <RegionBracket
          games={games}
          teams={teams}
          regionName={regionConfig.topRight}
          direction="rtl"
          onSelectGame={onSelectGame}
          onTeamClick={onTeamClick}
          selectedGameId={selectedGameId}
        />
      </div>

      {/* ── Final Four + Championship (centered) ── */}
      <div className="flex justify-center">
        <div className="rounded-xl border border-yellow-400/15 bg-yellow-900/5 px-4 py-4">
          <FinalFour
            games={games}
            teams={teams}
            onSelectGame={onSelectGame}
            onTeamClick={onTeamClick}
            selectedGameId={selectedGameId}
            champion={tournament.champion}
          />
        </div>
      </div>

      {/* ── Bottom region pair: bottomLeft (LTR) + bottomRight (RTL) ── */}
      <div className="flex items-start gap-4 justify-center">
        <RegionBracket
          games={games}
          teams={teams}
          regionName={regionConfig.bottomLeft}
          direction="ltr"
          onSelectGame={onSelectGame}
          onTeamClick={onTeamClick}
          selectedGameId={selectedGameId}
        />

        <div className="flex-1 shrink-0" />

        <RegionBracket
          games={games}
          teams={teams}
          regionName={regionConfig.bottomRight}
          direction="rtl"
          onSelectGame={onSelectGame}
          onTeamClick={onTeamClick}
          selectedGameId={selectedGameId}
        />
      </div>

      {/* ── First Four collapsible ── */}
      {firstFourGames.length > 0 && (
        <div className="rounded-lg border border-white/10 bg-gray-900/50 px-4 py-3">
          <button
            className="flex w-full items-center justify-between text-sm font-medium text-gray-400 hover:text-white transition-colors"
            onClick={() => setFirstFourOpen((o) => !o)}
          >
            <span>First Four ({firstFourGames.length} games)</span>
            <span>{firstFourOpen ? "▲" : "▼"}</span>
          </button>
          {firstFourOpen && (
            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
              {firstFourGames.map((game) => (
                <MatchupCard
                  key={game._id}
                  game={game}
                  teams={teams}
                  onSelect={onSelectGame}
                  onTeamClick={onTeamClick}
                  isSelected={selectedGameId === game._id}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
