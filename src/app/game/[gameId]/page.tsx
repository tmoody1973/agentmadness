"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import Link from "next/link";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import type { Team, Game } from "../../../lib/types";
import { getSeedColor, ROUND_LABELS } from "../../../lib/types";
import { TeamLogo } from "../../../components/TeamLogo";
import { AudioPlayer } from "../../../components/AudioPlayer";
import { MarkdownContent } from "../../../components/MarkdownContent";

// ---------------------------------------------------------------------------
// Constants
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getWinProbability(teamA: Team, teamB: Team): number {
  if (teamA.seed === teamB.seed) {
    const effA = teamA.adjOE - teamA.adjDE;
    const effB = teamB.adjOE - teamB.adjDE;
    const diff = effA - effB;
    const prob = 1 / (1 + Math.pow(10, -diff / 15));
    return Math.max(0.15, Math.min(0.85, prob));
  }
  const hi = Math.min(teamA.seed, teamB.seed);
  const lo = Math.max(teamA.seed, teamB.seed);
  const historicalRate = UPSET_RATES[`${hi}v${lo}`] ?? 0.3;
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

function ScoreBoard({
  game,
  teamA,
  teamB,
}: {
  game: Game;
  teamA: Team | null;
  teamB: Team | null;
}) {
  const isCompleted = game.status === "completed";
  const isSimulating = game.status === "simulating";

  const scoreA = isCompleted
    ? game.winnerId === game.teamAId
      ? game.winnerScore
      : game.loserScore
    : undefined;
  const scoreB = isCompleted
    ? game.winnerId === game.teamBId
      ? game.winnerScore
      : game.loserScore
    : undefined;

  const winnerIsA = game.winnerId === game.teamAId;
  const winnerIsB = game.winnerId === game.teamBId;

  const maxScore = Math.max(scoreA ?? 0, scoreB ?? 0, 1);

  function TeamRow({
    team,
    score,
    isWinner,
  }: {
    team: Team | null;
    score?: number;
    isWinner: boolean;
  }) {
    const barWidth = score !== undefined ? Math.round((score / maxScore) * 100) : 0;
    const dimmed = isCompleted && !isWinner;

    return (
      <div
        className={`flex items-center gap-4 px-6 py-4 transition-opacity ${dimmed ? "opacity-40" : "opacity-100"}`}
      >
        {/* Logo */}
        <div className="shrink-0">
          {team ? (
            <TeamLogo teamName={team.name} size={52} />
          ) : (
            <div className="w-[52px] h-[52px] rounded-full bg-white/10 flex items-center justify-center text-white/30 text-xl font-bold">
              ?
            </div>
          )}
        </div>

        {/* Name + record */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {team && (
              <span
                className="flex h-5 w-6 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white"
                style={{ backgroundColor: getSeedColor(team.seed) }}
              >
                {team.seed}
              </span>
            )}
            <span className="font-extrabold text-white text-xl uppercase tracking-tight truncate">
              {team?.name ?? "TBD"}
            </span>
          </div>
          {team && (
            <div className="text-[11px] font-medium text-[#475569] uppercase tracking-wider">
              {team.conference} · {team.record}
            </div>
          )}
          {/* Score bar */}
          {isCompleted && score !== undefined && (
            <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden max-w-[200px]">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${barWidth}%`,
                  backgroundColor: isWinner ? "#00E5A0" : "#FF3B5C",
                }}
              />
            </div>
          )}
        </div>

        {/* Score */}
        <div className="shrink-0 text-right">
          {isCompleted && score !== undefined ? (
            <span
              className={`text-4xl font-extrabold font-mono tabular-nums ${
                isWinner ? "text-[#00E5A0]" : "text-[#475569]"
              }`}
            >
              {score}
            </span>
          ) : (
            <span className="text-[#475569] text-sm font-semibold">—</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#111827] border border-white/5 rounded-xl overflow-hidden">
      <TeamRow team={teamA} score={scoreA} isWinner={isCompleted && winnerIsA} />
      <div className="h-px bg-white/5 mx-4" />

      {/* Center status label */}
      <div className="flex items-center justify-center py-2">
        {isCompleted ? (
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#94A3B8]">FINAL</span>
            {game.isUpset && (
              <span className="rounded-full bg-[#FF3B5C]/15 border border-[#FF3B5C]/40 px-2.5 py-0.5 text-[10px] font-bold text-[#FF3B5C] uppercase tracking-wider">
                UPSET
              </span>
            )}
          </div>
        ) : isSimulating ? (
          <span className="animate-pulse text-[11px] font-bold uppercase tracking-[0.2em] text-[#FF8C00]">
            SIMULATING...
          </span>
        ) : (
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#475569]">UPCOMING</span>
        )}
      </div>

      <div className="h-px bg-white/5 mx-4" />
      <TeamRow team={teamB} score={scoreB} isWinner={isCompleted && winnerIsB} />
    </div>
  );
}

function StatsComparisonTable({ teamA, teamB }: { teamA: Team; teamB: Team }) {
  const effA = teamA.adjOE - teamA.adjDE;
  const effB = teamB.adjOE - teamB.adjDE;

  const rows: { label: string; valA: number; valB: number; higherIsBetter: boolean; format?: (n: number) => string }[] = [
    {
      label: "ADJ. OE",
      valA: teamA.adjOE,
      valB: teamB.adjOE,
      higherIsBetter: true,
      format: (n) => n.toFixed(1),
    },
    {
      label: "ADJ. DE",
      valA: teamA.adjDE,
      valB: teamB.adjDE,
      higherIsBetter: false,
      format: (n) => n.toFixed(1),
    },
    {
      label: "TEMPO",
      valA: teamA.adjTempo,
      valB: teamB.adjTempo,
      higherIsBetter: true,
      format: (n) => n.toFixed(1),
    },
    {
      label: "EFF. MARGIN",
      valA: effA,
      valB: effB,
      higherIsBetter: true,
      format: (n) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}`,
    },
    {
      label: "VOLATILITY",
      valA: teamA.volatility,
      valB: teamB.volatility,
      higherIsBetter: false,
      format: (n) => n.toFixed(1),
    },
    {
      label: "CLUTCH",
      valA: teamA.clutchRating,
      valB: teamB.clutchRating,
      higherIsBetter: true,
      format: (n) => n.toFixed(1),
    },
  ];

  return (
    <div className="bg-[#111827] border border-white/5 rounded-xl overflow-x-auto">
      <div className="px-4 py-3 border-b border-white/5">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#94A3B8]">Key Stats Comparison</h2>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-3 px-4 py-2 border-b border-white/5 min-w-[300px]">
        <span className="text-[11px] font-bold uppercase text-white truncate">{teamA.name}</span>
        <span className="text-[9px] font-semibold uppercase tracking-wider text-[#475569] text-center self-center" />
        <span className="text-[11px] font-bold uppercase text-white truncate text-right">{teamB.name}</span>
      </div>

      {rows.map((row) => {
        const fmt = row.format ?? ((n: number) => n.toFixed(1));
        const aBetter = row.higherIsBetter ? row.valA > row.valB : row.valA < row.valB;
        const bBetter = row.higherIsBetter ? row.valB > row.valA : row.valB < row.valA;

        return (
          <div key={row.label} className="grid grid-cols-3 items-center px-4 py-2.5 border-b border-white/5 last:border-0">
            <span
              className={`text-sm font-bold font-mono tabular-nums ${
                aBetter ? "text-white" : "text-[#475569]"
              }`}
            >
              {fmt(row.valA)}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#475569] text-center">
              {row.label}
            </span>
            <span
              className={`text-sm font-bold font-mono tabular-nums text-right ${
                bBetter ? "text-white" : "text-[#475569]"
              }`}
            >
              {fmt(row.valB)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function WinProbabilitySection({
  game,
  teamA,
  teamB,
}: {
  game: Game;
  teamA: Team;
  teamB: Team;
}) {
  const probA = getWinProbability(teamA, teamB);
  const pctA = Math.round(probA * 100);
  const pctB = 100 - pctA;
  const historicalNote = getHistoricalNote(teamA.seed, teamB.seed);

  return (
    <div className="bg-[#111827] border border-white/5 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#94A3B8]">Win Probability</h2>
      </div>
      <div className="px-4 py-4 flex flex-col gap-3">
        <div className="flex justify-between text-sm font-bold">
          <span className="text-[#00E5A0] truncate max-w-[140px]">{teamA.name}</span>
          <span className="text-[#FF3B5C] truncate max-w-[140px] text-right">{teamB.name}</span>
        </div>

        {/* Bar */}
        <div className="relative h-4 rounded-full overflow-hidden bg-[#1A2235]">
          <div
            className="absolute inset-y-0 left-0 transition-all duration-700"
            style={{ width: `${pctA}%`, backgroundColor: "#00E5A0" }}
          />
          <div
            className="absolute inset-y-0 right-0 transition-all duration-700"
            style={{ width: `${pctB}%`, backgroundColor: "#FF3B5C" }}
          />
        </div>

        <div className="flex justify-between text-lg font-extrabold font-mono tabular-nums">
          <span className="text-[#00E5A0]">{pctA}%</span>
          <span className="text-[#FF3B5C]">{pctB}%</span>
        </div>

        {historicalNote && (
          <p className="text-[11px] text-[#475569] italic">{historicalNote}</p>
        )}

        {game.status === "completed" && game.winProbability !== undefined && (
          <p className="text-[11px] text-[#475569]">
            Simulated win probability:{" "}
            <span className="text-[#94A3B8] font-mono">
              {Math.round(game.winProbability * 100)}%
            </span>{" "}
            in favor of {teamA.name}
          </p>
        )}
      </div>
    </div>
  );
}

function GameNarrativeSection({ game, teamA, teamB }: { game: Game; teamA: Team | null; teamB: Team | null }) {
  if (game.status !== "completed") return null;
  if (!game.gameNarrative && !game.mvp && !game.keyMoment) return null;

  return (
    <div className="bg-[#111827] border border-white/5 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#94A3B8]">Game Narrative</h2>
      </div>
      <div className="px-4 py-4 flex flex-col gap-4">
        {game.gameNarrative && (
          <p className="text-sm text-[#94A3B8] leading-relaxed">{game.gameNarrative}</p>
        )}

        {game.mvp && (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#475569]">MVP</span>
            <span className="text-[#FFB800] font-bold text-sm">⭐ {game.mvp}</span>
          </div>
        )}

        {game.keyMoment && (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#475569]">Key Moment</span>
            <p className="text-sm text-[#94A3B8] italic leading-relaxed">&ldquo;{game.keyMoment}&rdquo;</p>
          </div>
        )}

        {game.audioStorageId && (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#475569]">Announcer Audio</span>
            <AudioPlayer storageId={game.audioStorageId} autoPlay={false} />
          </div>
        )}
      </div>
    </div>
  );
}

function TeamProfileSection({ team }: { team: Team }) {
  const effMargin = (team.adjOE - team.adjDE).toFixed(1);
  const isPositive = team.adjOE - team.adjDE > 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <TeamLogo teamName={team.name} size={40} />
        <div className="min-w-0">
          <div className="font-extrabold text-white text-base uppercase tracking-tight truncate">{team.name}</div>
          <div className="text-[10px] text-[#475569] uppercase tracking-wider">
            {team.conference} · {team.region} · {team.record}
          </div>
        </div>
        <span
          className="ml-auto flex h-6 w-7 shrink-0 items-center justify-center rounded text-[11px] font-bold text-white"
          style={{ backgroundColor: getSeedColor(team.seed) }}
        >
          {team.seed}
        </span>
      </div>

      {/* Status */}
      <div
        className={`rounded-lg px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-center ${
          team.eliminated
            ? "bg-[#FF3B5C]/10 border border-[#FF3B5C]/30 text-[#FF3B5C]"
            : "bg-[#00E5A0]/10 border border-[#00E5A0]/30 text-[#00E5A0]"
        }`}
      >
        {team.eliminated
          ? `Eliminated — ${team.eliminatedRound ?? "unknown round"}`
          : "Still Dancing"}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: "Adj OE", value: team.adjOE.toFixed(1), sub: "pts/100" },
          { label: "Adj DE", value: team.adjDE.toFixed(1), sub: "pts/100" },
          { label: "Tempo", value: team.adjTempo.toFixed(1), sub: "poss/g" },
          {
            label: "Net Eff",
            value: `${isPositive ? "+" : ""}${effMargin}`,
            highlight: isPositive,
            sub: "margin",
          },
        ].map((s) => (
          <div key={s.label} className="bg-[#0A0E17] border border-white/5 rounded-lg px-3 py-2.5 text-center">
            <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#475569] mb-0.5">{s.label}</div>
            <div
              className={`text-lg font-bold font-mono tabular-nums ${
                "highlight" in s && s.highlight ? "text-[#00E5A0]" : "text-white"
              }`}
            >
              {s.value}
            </div>
            {s.sub && <div className="text-[9px] text-[#475569] mt-0.5">{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* Style traits */}
      {team.styleTraits.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {team.styleTraits.map((trait) => (
            <span
              key={trait}
              className="rounded-full bg-white/5 border border-white/15 px-2.5 py-0.5 text-[10px] font-medium text-[#94A3B8]"
            >
              {trait}
            </span>
          ))}
        </div>
      )}

      {/* Key players */}
      {team.keyPlayers && (
        <div className="flex flex-col gap-1">
          <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#475569]">Key Players</div>
          <MarkdownContent content={team.keyPlayers} />
        </div>
      )}

      {/* AI scouting */}
      {team.perplexityContext && (
        <div className="rounded-lg bg-[#0A0E17] border border-white/5 p-3 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#94A3B8]">
              AI Scouting Report
            </span>
            <span className="text-[9px] font-medium text-[#00E5A0] bg-[#00E5A0]/10 border border-[#00E5A0]/20 rounded px-1.5 py-0.5">
              Perplexity + Claude
            </span>
          </div>
          <MarkdownContent content={team.perplexityContext} />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading / Error states
// ---------------------------------------------------------------------------

function LoadingState() {
  return (
    <div className="min-h-screen bg-[#0A0E17] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/10 border-t-[#00E5A0]" />
        <p className="text-[#475569] text-sm uppercase tracking-wider font-semibold">Loading game...</p>
      </div>
    </div>
  );
}

function NotFoundState() {
  return (
    <div className="min-h-screen bg-[#0A0E17] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 px-6 text-center">
        <p className="text-4xl font-extrabold text-white">404</p>
        <p className="text-[#94A3B8] text-sm">Game not found.</p>
        <Link
          href="/simulator"
          className="text-[#00E5A0] text-sm font-semibold hover:underline underline-offset-2"
        >
          Back to Bracket
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function GameDetailPage() {
  const params = useParams();
  const gameId = params.gameId as Id<"games">;

  const result = useQuery(api.bracket.getGameDetail, { gameId });

  if (result === undefined) return <LoadingState />;
  if (result === null) return <NotFoundState />;

  const { game, teamA, teamB, tournament } = result;

  const roundLabel =
    ROUND_LABELS[game.round as keyof typeof ROUND_LABELS] ?? game.round;

  return (
    <div className="min-h-screen bg-[#0A0E17] text-[#F8FAFC]">
      {/* Page header */}
      <div className="sticky top-0 z-10 bg-[#0A0E17]/95 backdrop-blur border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between gap-4">
          <Link
            href="/simulator"
            className="flex items-center gap-1.5 text-[#475569] hover:text-white transition-colors text-sm font-medium shrink-0"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Back to Bracket</span>
            <span className="sm:hidden">Back</span>
          </Link>

          <div className="flex items-center gap-2 min-w-0">
            {game.region && (
              <span className="text-[10px] font-medium text-[#475569] uppercase truncate hidden sm:block">
                {game.region}
              </span>
            )}
            {game.region && (
              <span className="text-[#475569] hidden sm:block">&middot;</span>
            )}
            <span className="rounded bg-[#1A2235] border border-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#3B82F6] shrink-0">
              {roundLabel}
            </span>
            {tournament && (
              <span className="text-[10px] text-[#475569] truncate hidden md:block">
                {tournament.name} {tournament.year}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* Scoreboard */}
        <ScoreBoard game={game} teamA={teamA} teamB={teamB} />

        {/* Stats comparison — only when both teams are known */}
        {teamA && teamB && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StatsComparisonTable teamA={teamA} teamB={teamB} />
            <WinProbabilitySection game={game} teamA={teamA} teamB={teamB} />
          </div>
        )}

        {/* Game narrative */}
        <GameNarrativeSection game={game} teamA={teamA} teamB={teamB} />

        {/* Team profiles */}
        {(teamA || teamB) && (
          <div className="bg-[#111827] border border-white/5 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#94A3B8]">Team Profiles</h2>
            </div>
            <div className="px-4 py-4 grid grid-cols-1 lg:grid-cols-2 gap-8 divide-y lg:divide-y-0 lg:divide-x divide-white/5">
              {teamA && (
                <div className="pb-6 lg:pb-0 lg:pr-6">
                  <TeamProfileSection team={teamA} />
                </div>
              )}
              {teamB && (
                <div className="pt-6 lg:pt-0 lg:pl-6">
                  <TeamProfileSection team={teamB} />
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
