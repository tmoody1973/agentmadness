"use client";

import { useAction, useMutation, useQuery } from "convex/react";
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
  const rateLimit = useQuery(api.users.checkRateLimit);

  const isSimulating = tournament.status === "simulating";
  const isCompleted = tournament.status === "completed";
  const isAuthenticated = rateLimit?.authenticated ?? false;
  const rateLimitAllowed = rateLimit?.allowed ?? false;
  const remaining = rateLimit?.remaining ?? 0;
  const canSimulate = isAuthenticated && rateLimitAllowed;
  const id = tournamentId as Id<"tournaments">;

  const currentRoundLabel =
    ROUND_LABELS[tournament.currentRound as keyof typeof ROUND_LABELS] ??
    tournament.currentRound;

  return (
    <div className="rounded-xl border border-white/5 bg-[#111827]/80 px-3 md:px-4 py-3">
      {/* Mobile layout: 2-row grid */}
      <div className="flex flex-col gap-2 lg:hidden">
        {/* Row 1: Round info + status */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#94A3B8]">
            Round
          </span>
          <span className="rounded bg-[#1A2235] border border-white/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white font-mono tabular-nums">
            {currentRoundLabel}
          </span>
          {upsetCount > 0 && (
            <span className="flex items-center gap-1 rounded bg-[#FF3B5C]/10 border border-[#FF3B5C]/30 px-2 py-0.5 text-xs font-bold text-[#FF3B5C] font-mono tabular-nums">
              🔥 {upsetCount}
            </span>
          )}
          {isAuthenticated && rateLimitAllowed && (
            <span className="text-[10px] font-mono tabular-nums text-[#475569] ml-auto">
              {remaining} left
            </span>
          )}
          {isAuthenticated && !rateLimitAllowed && (
            <span className="text-xs font-bold text-[#FF3B5C] ml-auto">
              Limit reached
            </span>
          )}
        </div>

        {/* Row 2: Speed buttons + sim buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            disabled={isSimulating || isCompleted || !canSimulate}
            onClick={() =>
              runSimulateRound({
                tournamentId: id,
                round: tournament.currentRound,
              })
            }
            className={cn(
              "rounded-lg px-3 py-3 text-xs font-bold uppercase tracking-wide transition-all min-h-[44px]",
              isSimulating || isCompleted || !canSimulate
                ? "cursor-not-allowed opacity-40 bg-[#1A2235] text-[#475569]"
                : "bg-[#00E5A0] text-[#0A0E17] hover:bg-[#00C890] active:scale-95"
            )}
          >
            {isSimulating ? (
              <span className="flex items-center justify-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-full border-2 border-[#0A0E17] border-t-transparent animate-spin" />
                Simulating…
              </span>
            ) : (
              "▶ Round"
            )}
          </button>

          <button
            disabled={isSimulating || isCompleted || !canSimulate}
            onClick={() => runSimulateAll({ tournamentId: id })}
            className={cn(
              "rounded-lg px-3 py-3 text-xs font-bold uppercase tracking-wide transition-all min-h-[44px]",
              isSimulating || isCompleted || !canSimulate
                ? "cursor-not-allowed opacity-40 bg-[#1A2235] text-[#475569]"
                : "bg-[#FFB800] text-[#0A0E17] hover:bg-[#E5A600] active:scale-95"
            )}
          >
            ⚡ All
          </button>

          <button
            onClick={() => onAnnouncerToggle(!announcerEnabled)}
            className={cn(
              "rounded-lg px-3 py-3 text-xs font-semibold uppercase tracking-wider transition-all min-h-[44px]",
              announcerEnabled
                ? "bg-[#00E5A0]/10 text-[#00E5A0] border border-[#00E5A0]/30"
                : "bg-white/5 border border-white/10 text-[#94A3B8]"
            )}
          >
            🎙 {announcerEnabled ? "ON" : "OFF"}
          </button>

          <button
            onClick={() => resetTournament({ tournamentId: id })}
            className="rounded-lg px-3 py-3 text-xs font-semibold uppercase tracking-wider text-[#475569] hover:text-[#FF3B5C] transition-colors bg-white/5 border border-white/10 min-h-[44px]"
          >
            ↺ Reset
          </button>
        </div>

        {/* Speed row */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#94A3B8] mr-1">Speed:</span>
          {SPEEDS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setSpeed({ tournamentId: id, speed: value })}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all min-h-[36px]",
                tournament.speed === value
                  ? "bg-white/5 border border-[#00E5A0]/50 text-[#00E5A0]"
                  : "bg-white/5 border border-white/10 text-[#94A3B8]"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop layout: single flex row */}
      <div className="hidden lg:flex flex-wrap items-center gap-4">
        {/* Round info */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#94A3B8]">
            Round
          </span>
          <span className="rounded bg-[#1A2235] border border-white/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white font-mono tabular-nums">
            {currentRoundLabel}
          </span>
          {upsetCount > 0 && (
            <span className="flex items-center gap-1 rounded bg-[#FF3B5C]/10 border border-[#FF3B5C]/30 px-2 py-0.5 text-xs font-bold text-[#FF3B5C] font-mono tabular-nums">
              🔥 {upsetCount} upsets
            </span>
          )}
        </div>

        <div className="h-5 w-px bg-white/10" />

        {/* Speed selector */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#94A3B8] mr-1">Speed:</span>
          {SPEEDS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setSpeed({ tournamentId: id, speed: value })}
              className={cn(
                "rounded-md px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all",
                tournament.speed === value
                  ? "bg-white/5 border border-[#00E5A0]/50 text-[#00E5A0]"
                  : "bg-white/5 border border-white/10 text-[#94A3B8] hover:text-white hover:border-white/20"
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
            disabled={isSimulating || isCompleted || !canSimulate}
            onClick={() =>
              runSimulateRound({
                tournamentId: id,
                round: tournament.currentRound,
              })
            }
            className={cn(
              "rounded-lg px-6 py-2.5 text-sm font-bold uppercase tracking-wide transition-all",
              isSimulating || isCompleted || !canSimulate
                ? "cursor-not-allowed opacity-40 bg-[#1A2235] text-[#475569]"
                : "bg-[#00E5A0] text-[#0A0E17] hover:bg-[#00C890] active:scale-95"
            )}
          >
            {isSimulating ? (
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-full border-2 border-[#0A0E17] border-t-transparent animate-spin" />
                Simulating…
              </span>
            ) : (
              "▶ Simulate Round"
            )}
          </button>

          <button
            disabled={isSimulating || isCompleted || !canSimulate}
            onClick={() => runSimulateAll({ tournamentId: id })}
            className={cn(
              "rounded-lg px-6 py-2.5 text-sm font-bold uppercase tracking-wide transition-all",
              isSimulating || isCompleted || !canSimulate
                ? "cursor-not-allowed opacity-40 bg-[#1A2235] text-[#475569]"
                : "bg-[#FFB800] text-[#0A0E17] hover:bg-[#E5A600] active:scale-95"
            )}
          >
            ⚡ Simulate All
          </button>

          {/* Auth / rate-limit status */}
          {!isAuthenticated && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#475569] italic">
              Sign in to simulate
            </span>
          )}
          {isAuthenticated && !rateLimitAllowed && (
            <span className="text-xs font-bold text-[#FF3B5C]">
              Daily limit reached
            </span>
          )}
          {isAuthenticated && rateLimitAllowed && (
            <span className="text-[10px] font-mono tabular-nums text-[#475569]">
              {remaining} run{remaining !== 1 ? "s" : ""} remaining today
            </span>
          )}
        </div>

        <div className="h-5 w-px bg-white/10" />

        {/* Announcer toggle */}
        <button
          onClick={() => onAnnouncerToggle(!announcerEnabled)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all",
            announcerEnabled
              ? "bg-[#00E5A0]/10 text-[#00E5A0] border border-[#00E5A0]/30"
              : "bg-white/5 border border-white/10 text-[#94A3B8] hover:text-white hover:border-white/20"
          )}
        >
          🎙 Announcer {announcerEnabled ? "ON" : "OFF"}
        </button>

        {/* Reset button */}
        <button
          onClick={() => resetTournament({ tournamentId: id })}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#475569] hover:text-[#FF3B5C] transition-colors"
        >
          ↺ Reset
        </button>
      </div>
    </div>
  );
}
