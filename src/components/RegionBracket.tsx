"use client";

import type { Game, Team } from "../lib/types";
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

function getRegionGamesByRound(games: Game[], region: string, round: string): Game[] {
  return games
    .filter((g) => g.region === region && g.round === round)
    .sort((a, b) => a.gameOrder - b.gameOrder);
}

/**
 * Renders a single round column with bracket connector lines.
 * Each game is vertically centered between its two feeder games from the previous round.
 */
function RoundColumn({
  roundGames,
  teams,
  roundIndex,
  onSelectGame,
  selectedGameId,
  direction,
}: {
  roundGames: Game[];
  teams: Team[];
  roundIndex: number;
  onSelectGame: (gameId: string) => void;
  selectedGameId?: string;
  direction: "ltr" | "rtl";
}) {
  // Card height + spacing grows with rounds to center between feeders
  // R64: 8 games tight, R32: 4 games, S16: 2 games, E8: 1 game
  const cardHeight = 60; // approx px per matchup card
  const gap = cardHeight * Math.pow(2, roundIndex) - cardHeight;

  return (
    <div
      className="flex flex-col justify-around relative"
      style={{
        gap: `${gap}px`,
        paddingTop: `${gap / 2}px`,
      }}
    >
      {roundGames.map((game, idx) => (
        <div key={game._id} className="relative flex items-center">
          {/* Connector line going OUT to next round */}
          {roundIndex < 3 && (
            <div
              className={cn(
                "absolute top-1/2 w-4 border-t border-white/20",
                direction === "ltr" ? "right-0 translate-x-full" : "left-0 -translate-x-full"
              )}
            />
          )}

          {/* Connector line coming IN from previous round */}
          {roundIndex > 0 && (
            <div
              className={cn(
                "absolute top-1/2 w-4 border-t border-white/20",
                direction === "ltr" ? "left-0 -translate-x-full" : "right-0 translate-x-full"
              )}
            />
          )}

          {/* Vertical bracket merge lines (connects two feeders to one game) */}
          {roundIndex > 0 && (
            <div
              className={cn(
                "absolute border-white/20",
                direction === "ltr" ? "left-0 -translate-x-4" : "right-0 translate-x-4"
              )}
              style={{
                top: `calc(50% - ${gap / 2 + cardHeight / 2}px)`,
                height: `${gap + cardHeight}px`,
                borderLeftWidth: direction === "ltr" ? 1 : 0,
                borderRightWidth: direction === "rtl" ? 1 : 0,
              }}
            />
          )}

          <MatchupCard
            game={game}
            teams={teams}
            onSelect={onSelectGame}
            isSelected={selectedGameId === game._id}
          />
        </div>
      ))}
    </div>
  );
}

export function RegionBracket({
  games,
  teams,
  regionName,
  direction,
  onSelectGame,
  selectedGameId,
}: RegionBracketProps) {
  const accentColor = REGION_COLORS[regionName] ?? "#6b7280";

  const rounds = REGION_ROUNDS.map((round) =>
    getRegionGamesByRound(games, regionName, round)
  );

  // For RTL, reverse the visual order of columns
  const displayRounds = direction === "rtl" ? [...rounds].reverse() : rounds;
  const displayIndices = direction === "rtl" ? [3, 2, 1, 0] : [0, 1, 2, 3];

  return (
    <div className="flex flex-col gap-2">
      {/* Region header */}
      <div
        className={cn(
          "flex items-center gap-2 px-1",
          direction === "rtl" && "justify-end"
        )}
      >
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

      {/* Bracket tree */}
      <div
        className={cn(
          "flex items-start",
          direction === "rtl" && "flex-row-reverse"
        )}
        style={{ gap: "16px" }}
      >
        {displayRounds.map((roundGames, displayIdx) => (
          <RoundColumn
            key={displayIdx}
            roundGames={roundGames}
            teams={teams}
            roundIndex={displayIndices[displayIdx]}
            onSelectGame={onSelectGame}
            selectedGameId={selectedGameId}
            direction={direction}
          />
        ))}
      </div>
    </div>
  );
}
