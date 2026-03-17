"use client";

import { useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { Tournament } from "../lib/types";
import { ROUND_LABELS } from "../lib/types";
import { cn } from "../lib/utils";

interface SimControlsProps {
  tournament: Tournament;
  tournamentId: string;
  announcerEnabled: boolean;
  onAnnouncerToggle: (enabled: boolean) => void;
  upsetCount: number;
}

const SPEEDS = [
  { label: "Instant", value: 0 },
  { label: "Fast", value: 500 },
  { label: "Dramatic", value: 2000 },
] as const;

export function SimControls({
  tournament,
  tournamentId,
  announcerEnabled,
  onAnnouncerToggle,
  upsetCount,
}: SimControlsProps) {
  const runSimulateRound = useAction(api.simulate.runSimulateRound);
  const runSimulateAll = useAction(api.simulate.runSimulateAll);
  const setSpeed = useMutation(api.bracket.setSpeed);
  const resetTournament = useMutation(api.bracket.resetTournament);

  const isSimulating = tournament.status === "simulating";
  const isCompleted = tournament.status === "completed";
  const id = tournamentId as Id<"tournaments">;

  const currentRoundLabel =
    ROUND_LABELS[tournament.currentRound as keyof typeof ROUND_LABELS] ??
    tournament.currentRound;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-gray-900/80 px-4 py-3">
      {/* Round info */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 uppercase tracking-wider">
          Round
        </span>
        <span className="rounded bg-blue-900/50 px-2 py-0.5 text-sm font-semibold text-blue-300">
          {currentRoundLabel}
        </span>
        {upsetCount > 0 && (
          <span className="flex items-center gap-1 rounded bg-red-900/50 px-2 py-0.5 text-sm font-semibold text-red-300">
            🔥 {upsetCount} upsets
          </span>
        )}
      </div>

      <div className="h-5 w-px bg-white/10" />

      {/* Speed selector */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500 mr-1">Speed:</span>
        {SPEEDS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setSpeed({ tournamentId: id, speed: value })}
            className={cn(
              "rounded px-2 py-1 text-xs font-medium transition-all",
              tournament.speed === value
                ? "bg-white/15 text-white"
                : "text-gray-500 hover:text-white"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="h-5 w-px bg-white/10" />

      {/* Simulate buttons */}
      <div className="flex items-center gap-2">
        <button
          disabled={isSimulating || isCompleted}
          onClick={() =>
            runSimulateRound({
              tournamentId: id,
              round: tournament.currentRound,
            })
          }
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm font-semibold transition-all",
            isSimulating || isCompleted
              ? "cursor-not-allowed opacity-40 bg-gray-700 text-gray-400"
              : "bg-blue-600 text-white hover:bg-blue-500 active:scale-95"
          )}
        >
          {isSimulating ? (
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full border-2 border-blue-300 border-t-transparent animate-spin" />
              Simulating…
            </span>
          ) : (
            "▶ Simulate Round"
          )}
        </button>

        <button
          disabled={isSimulating || isCompleted}
          onClick={() => runSimulateAll({ tournamentId: id })}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm font-semibold transition-all",
            isSimulating || isCompleted
              ? "cursor-not-allowed opacity-40 bg-gray-700 text-gray-400"
              : "bg-purple-600 text-white hover:bg-purple-500 active:scale-95"
          )}
        >
          ⚡ Simulate All
        </button>
      </div>

      <div className="h-5 w-px bg-white/10" />

      {/* Announcer toggle */}
      <button
        onClick={() => onAnnouncerToggle(!announcerEnabled)}
        className={cn(
          "rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
          announcerEnabled
            ? "bg-green-800/60 text-green-300 border border-green-600/40"
            : "bg-gray-800 text-gray-500 border border-white/10"
        )}
      >
        🎙 Announcer {announcerEnabled ? "ON" : "OFF"}
      </button>

      {/* Reset button */}
      <button
        onClick={() => resetTournament({ tournamentId: id })}
        className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-red-400 transition-colors"
      >
        ↺ Reset
      </button>
    </div>
  );
}
