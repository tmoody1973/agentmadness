"use client";

import type { Tournament, Team, Game } from "../lib/types";
import { ROUND_LABELS } from "../lib/types";
import { countAliveTeams, getTeamById } from "../lib/utils";

interface StatsOverlayProps {
  tournament: Tournament;
  teams: Team[];
  upsets: Game[];
}

export function StatsOverlay({ tournament, teams, upsets }: StatsOverlayProps) {
  const aliveCount = countAliveTeams(teams);
  const currentRoundLabel =
    ROUND_LABELS[tournament.currentRound as keyof typeof ROUND_LABELS] ??
    tournament.currentRound;

  const biggestUpset = upsets.reduce<Game | null>((best, game) => {
    if (!best) return game;
    return (game.upsetMagnitude ?? 0) > (best.upsetMagnitude ?? 0)
      ? game
      : best;
  }, null);

  const biggestUpsetDesc = biggestUpset
    ? (() => {
        const winner = getTeamById(teams, biggestUpset.winnerId);
        const loser = biggestUpset.teamAId === biggestUpset.winnerId
          ? getTeamById(teams, biggestUpset.teamBId)
          : getTeamById(teams, biggestUpset.teamAId);
        if (!winner || !loser) return null;
        return `#${winner.seed} ${winner.name} over #${loser.seed} ${loser.name}`;
      })()
    : null;

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-white/10 bg-gray-900/60 px-4 py-3 text-sm">
      <Stat label="Current Round" value={currentRoundLabel} />
      <div className="h-4 w-px bg-white/10" />
      <Stat label="Teams Alive" value={`${aliveCount}`} />
      <div className="h-4 w-px bg-white/10" />
      <Stat label="🔥 Upsets" value={`${tournament.upsetCount}`} highlight="red" />
      {biggestUpsetDesc && (
        <>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 uppercase tracking-wider">
              Biggest Upset
            </span>
            <span className="text-sm text-red-300 font-medium">
              {biggestUpsetDesc}
            </span>
          </div>
        </>
      )}
      {tournament.champion && (
        <>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 uppercase tracking-wider">
              🏆 Champion
            </span>
            <span className="text-sm text-yellow-300 font-bold">
              {getTeamById(teams, tournament.champion)?.name ?? "—"}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: "red" | "yellow" | "blue";
}) {
  const valueColor =
    highlight === "red"
      ? "text-red-300"
      : highlight === "yellow"
      ? "text-yellow-300"
      : highlight === "blue"
      ? "text-blue-300"
      : "text-white";

  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-500 uppercase tracking-wider">
        {label}
      </span>
      <span className={`text-sm font-semibold ${valueColor}`}>{value}</span>
    </div>
  );
}
