"use client";

import type { Game, Team } from "../lib/types";
import { getGamesByRound, getGamesByRegion } from "../lib/utils";
import { MatchupCard } from "./MatchupCard";
import { cn } from "../lib/utils";

interface RegionBracketProps {
  games: Game[];
  teams: Team[];
  regionName: string;
  direction: "ltr" | "rtl";
  onSelectGame: (gameId: string) => void;
  selectedGameId?: string;
}

const REGION_ROUNDS = ["R64", "R32", "S16", "E8"] as const;

const REGION_COLORS: Record<string, string> = {
  East: "#3b82f6",
  South: "#22c55e",
  West: "#f97316",
  Midwest: "#a855f7",
  "Fort Worth 1": "#3b82f6",
  "Sacramento 4": "#22c55e",
  "Fort Worth 3": "#f97316",
  "Sacramento 2": "#a855f7",
};

export function RegionBracket({
  games,
  teams,
  regionName,
  direction,
  onSelectGame,
  selectedGameId,
}: RegionBracketProps) {
  const regionGames = getGamesByRegion(games, regionName);
  const accentColor = REGION_COLORS[regionName] ?? "#6b7280";

  const roundGames = REGION_ROUNDS.map((round) =>
    getGamesByRound(regionGames as Game[], round)
  );

  const columns = direction === "rtl" ? [...roundGames].reverse() : roundGames;
  const roundLabels =
    direction === "rtl"
      ? ["E8", "S16", "R32", "R64"]
      : ["R64", "R32", "S16", "E8"];
  const roundDisplayLabels: Record<string, string> = {
    R64: "R64",
    R32: "R32",
    S16: "Sweet 16",
    E8: "Elite 8",
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Region header */}
      <div className="flex items-center gap-2 px-1">
        <div
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: accentColor }}
        />
        <span
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: accentColor }}
        >
          {regionName}
        </span>
      </div>

      {/* Bracket columns */}
      <div
        className={cn(
          "flex gap-3 items-start",
          direction === "rtl" && "flex-row-reverse"
        )}
      >
        {columns.map((colGames, colIdx) => {
          const roundKey = roundLabels[colIdx];
          const gamesCount = colGames.length;
          // Vertical spacing grows with each round to create tree structure
          const spacingClass = [
            "gap-1",
            "gap-9",
            "gap-28",
            "gap-56",
          ][colIdx] ?? "gap-1";

          return (
            <div key={roundKey} className="flex flex-col items-stretch">
              <div className="mb-1 text-center text-xs text-gray-600 font-medium">
                {roundDisplayLabels[roundKey] ?? roundKey}
              </div>
              <div className={cn("flex flex-col", spacingClass)}>
                {(colGames as Game[]).map((game) => (
                  <MatchupCard
                    key={game._id}
                    game={game}
                    teams={teams}
                    onSelect={onSelectGame}
                    isSelected={selectedGameId === game._id}
                  />
                ))}
                {gamesCount === 0 && (
                  <div className="text-xs text-gray-700 italic px-2">—</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
