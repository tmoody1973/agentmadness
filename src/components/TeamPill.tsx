"use client";

import { getSeedColor } from "../lib/types";
import type { Team } from "../lib/types";
import { cn } from "../lib/utils";

interface TeamPillProps {
  team: Team | undefined;
  isWinner?: boolean;
  onTeamClick?: (team: Team) => void;
}

export function TeamPill({ team, isWinner, onTeamClick }: TeamPillProps) {
  if (!team) {
    return (
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-7 items-center justify-center rounded bg-white/10 text-xs font-bold text-white/30">
          ?
        </span>
        <span className="text-sm text-white/30 font-medium">TBD</span>
      </div>
    );
  }

  const seedColor = getSeedColor(team.seed);

  return (
    <div className="flex items-center gap-2 min-w-0">
      <span
        className="flex h-6 w-7 shrink-0 items-center justify-center rounded text-xs font-extrabold text-white"
        style={{ backgroundColor: seedColor }}
      >
        {team.seed}
      </span>
      <span
        className={cn(
          "truncate text-sm leading-tight font-semibold",
          isWinner ? "text-white font-bold" : "text-gray-200",
          onTeamClick && "hover:underline cursor-pointer hover:text-white"
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
  );
}
