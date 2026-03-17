"use client";

import type { Tournament } from "../lib/types";

interface TournamentToggleProps {
  tournaments: Tournament[];
  activeTournamentId: string;
  onSelect: (id: string) => void;
}

export function TournamentToggle({
  tournaments,
  activeTournamentId,
  onSelect,
}: TournamentToggleProps) {
  const mens = tournaments.find((t) => t.gender === "men");
  const womens = tournaments.find((t) => t.gender === "women");

  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-gray-900 p-1">
      {mens && (
        <button
          onClick={() => onSelect(mens._id)}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
            activeTournamentId === mens._id
              ? "bg-blue-600 text-white shadow"
              : "text-gray-400 hover:text-white"
          }`}
        >
          🏀 Men&apos;s
        </button>
      )}
      {womens && (
        <button
          onClick={() => onSelect(womens._id)}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
            activeTournamentId === womens._id
              ? "bg-pink-600 text-white shadow"
              : "text-gray-400 hover:text-white"
          }`}
        >
          🏀 Women&apos;s
        </button>
      )}
    </div>
  );
}
