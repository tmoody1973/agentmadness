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
        <span className="flex h-5 w-6 items-center justify-center rounded text-[11px] font-bold bg-[#1A2235] text-[#475569]">
          ?
        </span>
        <span className="text-[13px] text-[#475569] italic">TBD</span>
      </div>
    );
  }

  const seedColor = getSeedColor(team.seed);

  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <span
        className="flex h-5 w-6 shrink-0 items-center justify-center rounded text-[11px] font-bold text-white"
        style={{ backgroundColor: seedColor }}
      >
        {team.seed}
      </span>
      <span
        className={cn(
          "truncate text-[13px] leading-tight",
          isWinner ? "font-bold text-white" : "text-[#94A3B8]",
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
