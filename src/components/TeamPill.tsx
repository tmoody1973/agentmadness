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
      <div className="flex items-center gap-1.5">
        <span className="flex h-4 w-5 items-center justify-center rounded-sm text-[10px] font-bold bg-gray-700 text-gray-500">
          ?
        </span>
        <span className="text-[11px] text-gray-500 italic">TBD</span>
      </div>
    );
  }

  const seedColor = getSeedColor(team.seed);

  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <span
        className="flex h-4 w-5 shrink-0 items-center justify-center rounded-sm text-[10px] font-bold text-white"
        style={{ backgroundColor: seedColor }}
      >
        {team.seed}
      </span>
      <span
        className={cn(
          "truncate text-[11px] leading-tight",
          isWinner ? "font-bold text-white" : "text-gray-300",
          onTeamClick && "hover:underline cursor-pointer"
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
