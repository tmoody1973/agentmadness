"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { getSeedColor } from "../../lib/types";

export default function LeaderboardPage() {
  const [gender, setGender] = useState<"men" | "women">("men");

  const leaderboard = useQuery(api.leaderboard.getLeaderboard, { gender });
  const recentResults = useQuery(api.leaderboard.getRecentResults, { gender });
  const upsetStats = useQuery(api.leaderboard.getUpsetStats, { gender });

  return (
    <main className="min-h-screen bg-[#0A0E17] text-[#F8FAFC]">
      {/* Header */}
      <header className="border-b border-white/5 px-6 py-4 bg-[#0A0E17]/90 backdrop-blur-sm">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏆</span>
            <div>
              <h1 className="text-xl font-extrabold uppercase tracking-tight text-white">Leaderboard</h1>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#94A3B8]">
                Aggregate results across all AI simulations
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href="/" className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] hover:text-white transition-colors">
              ← Back to Bracket
            </a>
            <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-[#111827] p-1">
              <button
                onClick={() => setGender("men")}
                className={`rounded-lg px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                  gender === "men"
                    ? "bg-[#3B82F6] text-white"
                    : "bg-white/5 border border-white/10 text-[#94A3B8] hover:text-white hover:border-white/20"
                }`}
              >
                Men&apos;s
              </button>
              <button
                onClick={() => setGender("women")}
                className={`rounded-lg px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                  gender === "women"
                    ? "bg-[#A855F7] text-white"
                    : "bg-white/5 border border-white/10 text-[#94A3B8] hover:text-white hover:border-white/20"
                }`}
              >
                Women&apos;s
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Stats summary */}
        {upsetStats && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Simulations" value={upsetStats.totalRuns} />
            <StatCard label="Avg Upsets / Run" value={upsetStats.avgUpsets} />
            <StatCard label="Max Upsets" value={upsetStats.maxUpsets} highlight="danger" />
            <StatCard label="Cinderella Champions" value={upsetStats.cinderellaChampions} subtitle="(5+ seed)" highlight="gold" />
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          {/* Championship leaderboard — main column */}
          <div className="col-span-2">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#94A3B8] mb-3">
              Championship Probability
            </h2>
            <div className="rounded-xl border border-white/5 bg-[#151C2C] overflow-hidden">
              {/* Header row */}
              <div className="grid grid-cols-[40px_1fr_100px_100px_100px] gap-2 px-4 py-2 border-b border-white/5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#475569]">
                <span>#</span>
                <span>Team</span>
                <span className="text-right">Titles</span>
                <span className="text-right">Final Four</span>
                <span className="text-right">Win %</span>
              </div>

              {leaderboard?.teams.length === 0 && (
                <div className="px-4 py-8 text-center text-[#475569] text-sm">
                  No simulations completed yet. Run a tournament to see results!
                </div>
              )}

              {leaderboard?.teams.map((team, idx) => (
                <div
                  key={team.name}
                  className="grid grid-cols-[40px_1fr_100px_100px_100px] gap-2 px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors items-center"
                >
                  <span className="text-sm font-mono tabular-nums text-[#475569]">{idx + 1}</span>
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-5 w-6 shrink-0 items-center justify-center rounded-sm text-[10px] font-bold text-white"
                      style={{ backgroundColor: getSeedColor(team.bestSeed) }}
                    >
                      {team.bestSeed}
                    </span>
                    <span className="text-sm font-semibold text-white truncate">{team.name}</span>
                  </div>
                  <span className="text-right text-sm font-mono font-bold tabular-nums text-white">{team.championshipWins}</span>
                  <span className="text-right text-sm font-mono tabular-nums text-[#94A3B8]">{team.finalFourAppearances}</span>
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-12 h-1.5 rounded-full bg-[#1A2235] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#FFB800]"
                        style={{ width: `${team.championshipPct}%` }}
                      />
                    </div>
                    <span className="text-sm font-mono font-bold tabular-nums text-[#FFB800] w-10 text-right">
                      {team.championshipPct}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent results — sidebar */}
          <div>
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#94A3B8] mb-3">
              Recent Simulations
            </h2>
            <div className="flex flex-col gap-2">
              {recentResults?.length === 0 && (
                <div className="rounded-lg border border-white/5 bg-[#151C2C] px-4 py-6 text-center text-[#475569] text-sm">
                  No results yet
                </div>
              )}
              {recentResults?.map((result) => (
                <div
                  key={result._id}
                  className="rounded-lg border border-white/5 bg-[#151C2C] px-3 py-2.5 hover:bg-[#1A2235] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🏆</span>
                      <span className="text-sm font-bold text-white">
                        #{result.championSeed} {result.champion}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[#475569]">
                      {new Date(result.completedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] font-mono tabular-nums text-[#94A3B8]">
                      {result.upsetCount} upsets
                    </span>
                    {result.biggestUpset && (
                      <span className="text-[10px] font-bold text-[#FF3B5C]">
                        Biggest: {result.biggestUpset}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  subtitle,
  highlight,
}: {
  label: string;
  value: number;
  subtitle?: string;
  highlight?: "danger" | "gold" | "teal";
}) {
  const valueColor =
    highlight === "danger"
      ? "text-[#FF3B5C]"
      : highlight === "gold"
      ? "text-[#FFB800]"
      : highlight === "teal"
      ? "text-[#00E5A0]"
      : "text-white";

  return (
    <div className="rounded-xl border border-white/5 bg-[#151C2C] px-4 py-4 text-center">
      <div className={`text-3xl font-extrabold font-mono tabular-nums ${valueColor}`}>{value}</div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#94A3B8] mt-1">{label}</div>
      {subtitle && <div className="text-[10px] text-[#475569] mt-0.5">{subtitle}</div>}
    </div>
  );
}
