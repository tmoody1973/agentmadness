"use client";

import { getSeedColor } from "../lib/types";
import type { Team } from "../lib/types";
import { cn } from "../lib/utils";

interface TeamPillProps {
  team: Team | undefined;
  score?: number;
  isWinner?: boolean;
  isEliminated?: boolean;
}

export function TeamPill({ team, score, isWinner, isEliminated }: TeamPillProps) {
  if (!team) {
    return (
      <div className="flex items-center gap-2 py-1.5 px-2">
        <span className="flex h-5 w-5 items-center justify-center rounded text-xs font-bold bg-gray-700 text-gray-500">
          ?
        </span>
        <span className="text-sm text-gray-500 italic">TBD</span>
      </div>
    );
  }

  const seedColor = getSeedColor(team.seed);

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 py-1.5 px-2 rounded transition-all",
        isWinner && "bg-green-900/30",
        isEliminated && "opacity-40"
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-xs font-bold text-white"
          style={{ backgroundColor: seedColor }}
        >
          {team.seed}
        </span>
        <span
          className={cn(
            "truncate text-sm",
            isWinner ? "font-bold text-white" : "text-gray-300"
          )}
        >
          {team.name}
        </span>
      </div>
      {score !== undefined && (
        <span
          className={cn(
            "shrink-0 text-sm font-mono",
            isWinner ? "font-bold text-white" : "text-gray-400"
          )}
        >
          {score}
        </span>
      )}
    </div>
  );
}
