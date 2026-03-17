"use client";

import { useState } from "react";
import type { Tournament, Team, Game } from "../lib/types";
import { ROUND_ORDER, ROUND_LABELS } from "../lib/types";
import { getTeamById } from "../lib/utils";
import { TeamLogo } from "./TeamLogo";
import { getSeedColor } from "../lib/types";
import { cn } from "../lib/utils";

interface MobileBracketProps {
  tournament: Tournament;
  teams: Team[];
  games: Game[];
  onSelectGame: (gameId: string) => void;
  onTeamClick?: (team: Team) => void;
}

export function MobileBracket({
  tournament,
  teams,
  games,
  onSelectGame,
  onTeamClick,
}: MobileBracketProps) {
  const [activeRound, setActiveRound] = useState<string>(
    tournament.currentRound || "FIRST_FOUR"
  );

  const roundGames = games
    .filter((g) => g.round === activeRound)
    .sort((a, b) => a.gameOrder - b.gameOrder);

  // Group by region
  const regions = new Map<string, Game[]>();
  for (const game of roundGames) {
    const region = game.region ?? "Final Four";
    const list = regions.get(region) ?? [];
    list.push(game);
    regions.set(region, list);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Round tabs - horizontally scrollable */}
      <div
        className="shrink-0 border-b border-white/5 bg-[#0D1220] no-scrollbar"
        style={{ overflowX: "scroll", WebkitOverflowScrolling: "touch" }}
      >
        <div className="flex gap-1.5 px-3 py-2" style={{ width: "max-content" }}>
          {ROUND_ORDER.map((round) => {
            const count = games.filter((g) => g.round === round).length;
            const completed = games.filter(
              (g) => g.round === round && g.status === "completed"
            ).length;
            const isActive = activeRound === round;
            const isCurrent = tournament.currentRound === round;

            return (
              <button
                key={round}
                onClick={() => setActiveRound(round)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors min-h-[44px]",
                  isActive
                    ? "bg-[#00E5A0] text-[#0A0E17]"
                    : isCurrent
                      ? "bg-[#00E5A0]/20 text-[#00E5A0] border border-[#00E5A0]/30"
                      : "bg-white/5 text-white/40 hover:text-white/60"
                )}
              >
                {ROUND_LABELS[round as keyof typeof ROUND_LABELS] ?? round}
                {count > 0 && (
                  <span className="ml-1.5 text-[9px] opacity-60">
                    {completed}/{count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Game list */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {roundGames.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-white/20 text-sm uppercase tracking-wider">
            No games in this round yet
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {Array.from(regions.entries()).map(([region, regionGames]) => (
              <div key={region}>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#94A3B8] mb-2 px-1">
                  {region}
                </h3>
                <div className="flex flex-col gap-2">
                  {regionGames.map((game) => (
                    <MobileGameCard
                      key={game._id}
                      game={game}
                      teams={teams}
                      onSelect={onSelectGame}
                      onTeamClick={onTeamClick}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MobileGameCard({
  game,
  teams,
  onSelect,
  onTeamClick,
}: {
  game: Game;
  teams: Team[];
  onSelect: (id: string) => void;
  onTeamClick?: (team: Team) => void;
}) {
  const teamA = getTeamById(teams, game.teamAId);
  const teamB = getTeamById(teams, game.teamBId);
  const isCompleted = game.status === "completed";
  const isSimulating = game.status === "simulating";
  const isUpset = isCompleted && game.isUpset;

  const scoreA = isCompleted
    ? game.winnerId === game.teamAId
      ? game.winnerScore
      : game.loserScore
    : undefined;
  const scoreB = isCompleted
    ? game.winnerId === game.teamBId
      ? game.winnerScore
      : game.loserScore
    : undefined;

  return (
    <button
      onClick={() => onSelect(game._id)}
      className={cn(
        "w-full rounded-xl border-2 p-3 text-left transition-all",
        isUpset && "border-[#F44771]/40 bg-[#F44771]/5",
        isSimulating && "border-[#FF8C00]/40 bg-[#FF8C00]/5 animate-pulse",
        isCompleted && !isUpset && "border-[#00E5A0]/20 bg-[#1E293B]",
        !isCompleted && !isSimulating && "border-white/10 bg-[#1E293B]"
      )}
    >
      {/* Status bar */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isSimulating && (
            <div className="h-2 w-2 rounded-full bg-[#FF8C00] animate-pulse" />
          )}
          {isUpset && (
            <span className="text-[10px] font-bold text-[#F44771] uppercase">
              🔥 UPSET
            </span>
          )}
          {isCompleted && !isUpset && (
            <span className="text-[10px] font-bold text-[#00E5A0] uppercase">
              FINAL
            </span>
          )}
          {!isCompleted && !isSimulating && game.scheduledTime && (
            <span className="text-[10px] text-white/30">{game.scheduledTime}</span>
          )}
        </div>
        {game.tvChannel && !isCompleted && (
          <span className="text-[10px] text-white/20 font-medium">
            {game.tvChannel}
          </span>
        )}
      </div>

      {/* Team A */}
      <MobileTeamRow
        team={teamA}
        score={scoreA}
        isWinner={game.winnerId === game.teamAId}
        isLoser={isCompleted && game.winnerId !== game.teamAId}
        onTeamClick={onTeamClick}
      />

      <div className="h-px bg-white/5 my-1.5" />

      {/* Team B */}
      <MobileTeamRow
        team={teamB}
        score={scoreB}
        isWinner={game.winnerId === game.teamBId}
        isLoser={isCompleted && game.winnerId !== game.teamBId}
        onTeamClick={onTeamClick}
      />

      {/* MVP line */}
      {isCompleted && game.mvp && (
        <div className="mt-2 pt-2 border-t border-white/5 text-[11px] text-[#FFB800]">
          ⭐ MVP: {game.mvp}
        </div>
      )}
    </button>
  );
}

function MobileTeamRow({
  team,
  score,
  isWinner,
  isLoser,
  onTeamClick,
}: {
  team: Team | undefined;
  score: number | undefined;
  isWinner: boolean;
  isLoser: boolean;
  onTeamClick?: (team: Team) => void;
}) {
  if (!team) {
    return (
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-white/10" />
          <span className="text-sm text-white/20 font-medium">TBD</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between py-1 rounded-lg px-1",
        isWinner && "bg-[#00E5A0]/10",
        isLoser && "opacity-40"
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <TeamLogo teamName={team.name} size={24} />
        <span
          className="flex h-6 w-7 shrink-0 items-center justify-center rounded text-xs font-bold text-white"
          style={{ backgroundColor: getSeedColor(team.seed) }}
        >
          {team.seed}
        </span>
        <span
          className={cn(
            "text-sm font-semibold truncate",
            isWinner ? "text-white font-bold" : "text-gray-200"
          )}
          onClick={(e) => {
            if (onTeamClick) {
              e.stopPropagation();
              onTeamClick(team);
            }
          }}
        >
          {team.name}
        </span>
      </div>
      {score !== undefined && (
        <span
          className={cn(
            "text-lg font-mono font-bold tabular-nums ml-2",
            isWinner ? "text-[#00E5A0]" : "text-white/30"
          )}
        >
          {score}
        </span>
      )}
    </div>
  );
}
