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
    <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-[#111827] p-1">
      {mens && (
        <button
          onClick={() => onSelect(mens._id)}
          className={`rounded-lg px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
            activeTournamentId === mens._id
              ? "bg-[#3B82F6] text-white shadow"
              : "bg-white/5 border border-white/10 text-[#94A3B8] hover:text-white hover:border-white/20"
          }`}
        >
          🏀 Men&apos;s
        </button>
      )}
      {womens && (
        <button
          onClick={() => onSelect(womens._id)}
          className={`rounded-lg px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
            activeTournamentId === womens._id
              ? "bg-[#A855F7] text-white shadow"
              : "bg-white/5 border border-white/10 text-[#94A3B8] hover:text-white hover:border-white/20"
          }`}
        >
          🏀 Women&apos;s
        </button>
      )}
    </div>
  );
}
