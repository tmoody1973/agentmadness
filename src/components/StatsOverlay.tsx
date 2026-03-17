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
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-white/5 bg-[#111827]/60 px-4 py-2.5">
      <Stat label="Current Round" value={currentRoundLabel} />
      <div className="h-4 w-px bg-white/10" />
      <Stat label="Teams Alive" value={`${aliveCount}`} mono />
      <div className="h-4 w-px bg-white/10" />
      <Stat label="Upsets" value={`${tournament.upsetCount}`} highlight="danger" mono />
      {biggestUpsetDesc && (
        <>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#94A3B8]">
              Biggest Upset
            </span>
            <span className="text-xs font-bold text-[#FF3B5C]">
              {biggestUpsetDesc}
            </span>
          </div>
        </>
      )}
      {tournament.champion && (
        <>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#94A3B8]">
              🏆 Champion
            </span>
            <span className="text-xs font-bold text-[#FFB800]">
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
  mono,
}: {
  label: string;
  value: string;
  highlight?: "danger" | "gold" | "teal";
  mono?: boolean;
}) {
  const valueColor =
    highlight === "danger"
      ? "text-[#FF3B5C]"
      : highlight === "gold"
      ? "text-[#FFB800]"
      : highlight === "teal"
      ? "text-[#00E5A0]"
      : "text-white";

  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#94A3B8]">
        {label}
      </span>
      <span className={`text-sm font-extrabold uppercase tracking-tight ${valueColor} ${mono ? "font-mono tabular-nums" : ""}`}>
        {value}
      </span>
    </div>
  );
}
