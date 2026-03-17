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
  selectedGameId?: string;
}

const MEN_REGIONS = {
  left: ["East", "South"],
  right: ["West", "Midwest"],
};

const WOMEN_REGIONS = {
  left: ["Fort Worth 1", "Fort Worth 3"],
  right: ["Sacramento 4", "Sacramento 2"],
};

export function Bracket({
  tournament,
  teams,
  games,
  onSelectGame,
  selectedGameId,
}: BracketProps) {
  const [firstFourOpen, setFirstFourOpen] = useState(false);

  const isMens = tournament.gender === "men";
  const regionConfig = isMens ? MEN_REGIONS : WOMEN_REGIONS;

  const firstFourGames = getGamesByRound(games, "FIRST_FOUR") as Game[];

  return (
    <div className="flex flex-col gap-4">
      {/* First Four collapsible section */}
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
                  isSelected={selectedGameId === game._id}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main bracket — horizontally scrollable */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 items-start min-w-[1280px]">
          {/* Left side: ltr regions */}
          <div className="flex flex-col gap-8 flex-1">
            {regionConfig.left.map((region) => (
              <RegionBracket
                key={region}
                games={games}
                teams={teams}
                regionName={region}
                direction="ltr"
                onSelectGame={onSelectGame}
                selectedGameId={selectedGameId}
              />
            ))}
          </div>

          {/* Center: Final Four */}
          <div className="w-52 shrink-0">
            <FinalFour
              games={games}
              teams={teams}
              onSelectGame={onSelectGame}
              selectedGameId={selectedGameId}
              champion={tournament.champion}
            />
          </div>

          {/* Right side: rtl regions */}
          <div className="flex flex-col gap-8 flex-1">
            {regionConfig.right.map((region) => (
              <RegionBracket
                key={region}
                games={games}
                teams={teams}
                regionName={region}
                direction="rtl"
                onSelectGame={onSelectGame}
                selectedGameId={selectedGameId}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
