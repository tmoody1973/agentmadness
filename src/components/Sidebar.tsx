"use client";

import { motion, AnimatePresence } from "motion/react";
import { TypeAnimation } from "react-type-animation";
import type { Game, Team } from "../lib/types";
import { getTeamById } from "../lib/utils";
import { getSeedColor, ROUND_LABELS } from "../lib/types";
import { AudioPlayer } from "./AudioPlayer";

// ---------------------------------------------------------------------------
// Win probability helpers
// ---------------------------------------------------------------------------

const UPSET_RATES: Record<string, number> = {
  "1v16": 0.015,
  "2v15": 0.06,
  "3v14": 0.13,
  "4v13": 0.20,
  "5v12": 0.35,
  "6v11": 0.37,
  "7v10": 0.39,
  "8v9": 0.48,
};

function getWinProbability(teamA: Team, teamB: Team): number {
  // Same-seed matchups (First Four): use efficiency differential
  if (teamA.seed === teamB.seed) {
    const effA = teamA.adjOE - teamA.adjDE;
    const effB = teamB.adjOE - teamB.adjDE;
    const diff = effA - effB;
    // Convert efficiency gap to probability (logistic-style)
    // +10 net eff advantage ≈ 70% win probability
    const prob = 1 / (1 + Math.pow(10, -diff / 15));
    return Math.max(0.15, Math.min(0.85, prob));
  }

  const hi = Math.min(teamA.seed, teamB.seed);
  const lo = Math.max(teamA.seed, teamB.seed);
  const historicalRate = UPSET_RATES[`${hi}v${lo}`] ?? 0.3;
  // Return the probability that teamA wins
  const favoriteIsA = teamA.seed <= teamB.seed;
  return favoriteIsA ? 1 - historicalRate : historicalRate;
}

function getHistoricalNote(seedA: number, seedB: number): string | null {
  const hi = Math.min(seedA, seedB);
  const lo = Math.max(seedA, seedB);
  const key = `${hi}v${lo}`;
  const rate = UPSET_RATES[key];
  if (!rate) return null;
  const pct = Math.round(rate * 100);
  return `#${hi} seeds win ~${100 - pct}% of the time vs #${lo} seeds`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SidebarHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 px-4 py-3 shrink-0">
      <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#94A3B8]">{title}</span>
      <button
        onClick={onClose}
        className="rounded-md p-1 text-[#475569] hover:bg-white/10 hover:text-white transition-colors"
        aria-label="Close sidebar"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

function StatBox({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-[#0A0E17] border border-white/5 rounded-lg px-3 py-2.5 text-center">
      <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#475569] mb-0.5">{label}</div>
      <div className={`text-xl font-bold font-mono tabular-nums ${highlight ? "text-[#00E5A0]" : "text-white"}`}>
        {value}
      </div>
      {sub && <div className="text-[9px] text-[#475569] mt-0.5">{sub}</div>}
    </div>
  );
}

function WinProbBar({ prob, labelA, labelB }: { prob: number; labelA: string; labelB: string }) {
  const pctA = Math.round(prob * 100);
  const pctB = 100 - pctA;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-[10px] font-medium text-[#94A3B8]">
        <span className="truncate max-w-[120px]">{labelA}</span>
        <span className="truncate max-w-[120px] text-right">{labelB}</span>
      </div>
      <div className="flex h-3 rounded-full overflow-hidden bg-[#1A2235]">
        <div
          className="transition-all duration-500"
          style={{ width: `${pctA}%`, backgroundColor: "#00E5A0" }}
        />
        <div
          className="transition-all duration-500"
          style={{ width: `${pctB}%`, backgroundColor: "#FF3B5C" }}
        />
      </div>
      <div className="flex justify-between text-[11px] font-bold font-mono tabular-nums">
        <span className="text-[#00E5A0]">{pctA}%</span>
        <span className="text-[#FF3B5C]">{pctB}%</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Game Panel
// ---------------------------------------------------------------------------

function GamePanel({
  game,
  teams,
  announcerEnabled,
}: {
  game: Game;
  teams: Team[];
  announcerEnabled: boolean;
}) {
  const teamA = getTeamById(teams, game.teamAId);
  const teamB = getTeamById(teams, game.teamBId);
  const winner = getTeamById(teams, game.winnerId);
  const loser =
    game.teamAId === game.winnerId
      ? getTeamById(teams, game.teamBId)
      : getTeamById(teams, game.teamAId);

  const roundLabel =
    ROUND_LABELS[game.round as keyof typeof ROUND_LABELS] ?? game.round;

  const probA =
    teamA && teamB ? getWinProbability(teamA, teamB) : 0.5;
  const historicalNote =
    teamA && teamB ? getHistoricalNote(teamA.seed, teamB.seed) : null;

  const isPending = game.status === "pending";
  const isCompleted = game.status === "completed";

  return (
    <div className="flex flex-col gap-4 px-4 py-4 overflow-y-auto">
      {/* Round label */}
      <div className="flex items-center gap-2">
        <span className="rounded bg-[#1A2235] border border-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#3B82F6]">
          {roundLabel}
        </span>
        {game.region && (
          <span className="text-[10px] font-medium text-[#475569]">{game.region}</span>
        )}
      </div>

      {/* Score or teams */}
      {isCompleted && winner && loser ? (
        <div className="flex flex-col gap-2">
          <div className={`flex items-center justify-between rounded-lg px-3 py-2 ${game.isUpset ? "bg-[#FF3B5C]/10 border border-[#FF3B5C]/30" : "bg-[#00E5A0]/10 border border-[#00E5A0]/20"}`}>
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="flex h-5 w-6 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white"
                style={{ backgroundColor: getSeedColor(winner.seed) }}
              >
                {winner.seed}
              </span>
              <span className="font-bold text-white text-sm truncate">{winner.name}</span>
            </div>
            <span className="text-[#00E5A0] font-mono font-bold text-sm ml-2 shrink-0 tabular-nums">
              {game.winnerId === game.teamAId ? game.winnerScore : game.loserScore}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-lg px-3 py-2 bg-[#0A0E17] border border-white/5 opacity-60">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="flex h-5 w-6 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white"
                style={{ backgroundColor: getSeedColor(loser.seed) }}
              >
                {loser.seed}
              </span>
              <span className="text-[#94A3B8] text-sm truncate">{loser.name}</span>
            </div>
            <span className="text-[#475569] font-mono text-sm ml-2 shrink-0 tabular-nums">
              {game.winnerId === game.teamAId ? game.loserScore : game.winnerScore}
            </span>
          </div>

          {game.isUpset && (
            <div className="flex items-center gap-2 rounded-lg bg-[#FF3B5C]/10 border border-[#FF3B5C]/30 px-3 py-2">
              <span className="text-[#FF3B5C] text-sm font-bold uppercase tracking-wide">🔥 UPSET</span>
              {game.upsetMagnitude !== undefined && (
                <span className="text-xs text-[#FF3B5C]/70 font-mono tabular-nums">
                  Magnitude: {game.upsetMagnitude.toFixed(1)}
                </span>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {[teamA, teamB].map((t, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg px-3 py-2 bg-[#0A0E17] border border-white/5">
              {t ? (
                <>
                  <span
                    className="flex h-5 w-6 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white"
                    style={{ backgroundColor: getSeedColor(t.seed) }}
                  >
                    {t.seed}
                  </span>
                  <span className="text-[#F8FAFC] text-sm font-semibold truncate">{t.name}</span>
                  <span className="ml-auto text-[10px] text-[#475569] font-mono shrink-0">{t.record}</span>
                </>
              ) : (
                <span className="text-[#475569] text-sm italic">TBD</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Win probability (always show for pending, show historical for completed) */}
      {teamA && teamB && (
        <div className="flex flex-col gap-1.5">
          <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#94A3B8]">
            {isPending ? "Win Probability" : "Pre-game Probability"}
          </div>
          <WinProbBar
            prob={probA}
            labelA={teamA.name}
            labelB={teamB.name}
          />
          {historicalNote && (
            <p className="text-[10px] text-[#475569] italic">{historicalNote}</p>
          )}
        </div>
      )}

      {/* Completed game details */}
      {isCompleted && (
        <>
          {game.mvp && (
            <div className="flex flex-col gap-1">
              <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#94A3B8]">MVP</div>
              <div className="text-sm text-[#FFB800] font-bold">⭐ {game.mvp}</div>
            </div>
          )}

          {game.keyMoment && (
            <div className="flex flex-col gap-1">
              <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#94A3B8]">Key Moment</div>
              <p className="text-xs text-[#94A3B8] italic leading-relaxed">
                &ldquo;{game.keyMoment}&rdquo;
              </p>
            </div>
          )}

          {game.gameNarrative && (
            <div className="flex flex-col gap-1">
              <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#94A3B8]">Narrative</div>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                <TypeAnimation
                  key={game._id}
                  sequence={[game.gameNarrative]}
                  speed={80}
                  cursor={false}
                />
              </p>
            </div>
          )}

          {announcerEnabled && game.audioStorageId && (
            <div className="flex flex-col gap-1">
              <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#94A3B8]">Announcer Audio</div>
              <AudioPlayer storageId={game.audioStorageId} autoPlay={announcerEnabled} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Team Panel
// ---------------------------------------------------------------------------

function TeamPanel({ team }: { team: Team }) {
  const seedColor = getSeedColor(team.seed);
  const effMargin = (team.adjOE - team.adjDE).toFixed(1);
  const isPositive = team.adjOE - team.adjDE > 0;

  return (
    <div className="flex flex-col gap-4 px-4 py-4 overflow-y-auto">
      {/* Team header */}
      <div className="flex items-center gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
          style={{ backgroundColor: seedColor }}
        >
          {team.seed}
        </span>
        <div className="min-w-0">
          <div className="font-extrabold text-white text-lg uppercase tracking-tight truncate">{team.name}</div>
          <div className="text-[10px] font-medium text-[#94A3B8]">
            {team.conference.toUpperCase()} · {team.region} · {team.record}
          </div>
        </div>
      </div>

      {/* Status badge */}
      <div className={`rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wide text-center ${team.eliminated ? "bg-[#FF3B5C]/10 border border-[#FF3B5C]/30 text-[#FF3B5C]" : "bg-[#00E5A0]/10 border border-[#00E5A0]/30 text-[#00E5A0]"}`}>
        {team.eliminated
          ? `Eliminated in ${team.eliminatedRound ?? "unknown round"}`
          : "Still Dancing 💃"}
      </div>

      {/* Core stats */}
      <div className="flex flex-col gap-1">
        <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#94A3B8] mb-1">Advanced Stats</div>
        <div className="grid grid-cols-2 gap-2">
          <StatBox label="Adj OE" value={team.adjOE.toFixed(1)} sub="pts/100" />
          <StatBox label="Adj DE" value={team.adjDE.toFixed(1)} sub="pts/100" />
          <StatBox label="Tempo" value={team.adjTempo.toFixed(1)} sub="poss/g" />
          <StatBox
            label="Net Eff"
            value={`${isPositive ? "+" : ""}${effMargin}`}
            sub="margin"
            highlight={isPositive}
          />
        </div>
      </div>

      {/* Upset factors */}
      <div className="flex flex-col gap-1">
        <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#94A3B8] mb-1">Upset Factors</div>
        <div className="grid grid-cols-2 gap-2">
          <StatBox label="Volatility" value={team.volatility.toFixed(1)} sub="/10" />
          <StatBox label="Experience" value={team.tournamentExperience.toFixed(1)} sub="/10" />
          <StatBox label="Clutch" value={team.clutchRating.toFixed(1)} sub="/10" />
          <StatBox label="Depth" value={team.depthScore.toFixed(1)} sub="/10" />
        </div>
      </div>

      {/* Style traits */}
      {team.styleTraits.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#94A3B8]">Playing Style</div>
          <div className="flex flex-wrap gap-1.5">
            {team.styleTraits.map((trait) => (
              <span
                key={trait}
                className="rounded-full bg-white/5 border border-white/15 px-2.5 py-0.5 text-[10px] font-medium text-[#94A3B8] hover:border-white/25 transition-colors"
              >
                {trait}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Key players */}
      {team.keyPlayers && (
        <div className="flex flex-col gap-1">
          <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#94A3B8]">Key Players</div>
          <p className="text-xs text-[#94A3B8] leading-relaxed">{team.keyPlayers}</p>
        </div>
      )}

      {/* AI scouting report */}
      {team.perplexityContext && (
        <div className="flex flex-col gap-1 rounded-lg bg-[#0A0E17] border border-white/5 p-3">
          <div className="flex items-center gap-1.5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#94A3B8]">🔍 AI Scouting Report</div>
            <span className="text-[9px] font-medium text-[#00E5A0] bg-[#00E5A0]/10 border border-[#00E5A0]/20 rounded px-1.5 py-0.5">Perplexity + Claude</span>
          </div>
          <p className="text-xs text-[#94A3B8] leading-relaxed">{team.perplexityContext}</p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
      <div className="text-4xl">🏀</div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-extrabold uppercase tracking-tight text-white">March Madness Agent Sim</p>
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#00E5A0]">
          AI-powered simulation
        </p>
      </div>
      <div className="text-[11px] text-[#475569] leading-relaxed">
        Click any matchup card to view game details,
        or click a team name to view their full profile.
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Sidebar export
// ---------------------------------------------------------------------------

interface SidebarProps {
  selectedGame: Game | null;
  selectedTeam: Team | null;
  teams: Team[];
  onClose: () => void;
  announcerEnabled: boolean;
}

export function Sidebar({
  selectedGame,
  selectedTeam,
  teams,
  onClose,
  announcerEnabled,
}: SidebarProps) {
  const mode =
    selectedTeam ? "team" : selectedGame ? "game" : "empty";

  return (
    <aside
      className="flex flex-col bg-[#111827] border-l border-white/5 overflow-hidden shrink-0 shadow-xl"
      style={{ width: 350 }}
    >
      <AnimatePresence mode="wait">
        {mode === "game" && selectedGame && (
          <motion.div
            key={`game-${selectedGame._id}`}
            className="flex flex-col h-full"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <SidebarHeader title="Matchup Details" onClose={onClose} />
            <div className="flex-1 overflow-y-auto">
              <GamePanel
                game={selectedGame}
                teams={teams}
                announcerEnabled={announcerEnabled}
              />
            </div>
          </motion.div>
        )}

        {mode === "team" && selectedTeam && (
          <motion.div
            key={`team-${selectedTeam._id}`}
            className="flex flex-col h-full"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <SidebarHeader title="Team Profile" onClose={onClose} />
            <div className="flex-1 overflow-y-auto">
              <TeamPanel team={selectedTeam} />
            </div>
          </motion.div>
        )}

        {mode === "empty" && (
          <motion.div
            key="empty"
            className="flex flex-col h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <EmptyState />
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}
