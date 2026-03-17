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
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏆</span>
            <div>
              <h1 className="text-xl font-bold">Leaderboard</h1>
              <p className="text-xs text-gray-400">Aggregate results across all AI simulations</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
              ← Back to Bracket
            </a>
            <div className="flex rounded-lg border border-white/10 overflow-hidden">
              <button
                onClick={() => setGender("men")}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  gender === "men"
                    ? "bg-blue-600 text-white"
                    : "bg-transparent text-gray-400 hover:text-white"
                }`}
              >
                Men's
              </button>
              <button
                onClick={() => setGender("women")}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  gender === "women"
                    ? "bg-pink-600 text-white"
                    : "bg-transparent text-gray-400 hover:text-white"
                }`}
              >
                Women's
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
            <StatCard label="Max Upsets" value={upsetStats.maxUpsets} />
            <StatCard label="Cinderella Champions" value={upsetStats.cinderellaChampions} subtitle="(5+ seed)" />
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          {/* Championship leaderboard — main column */}
          <div className="col-span-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">
              Championship Probability
            </h2>
            <div className="rounded-xl border border-white/10 bg-gray-900/50 overflow-hidden">
              {/* Header row */}
              <div className="grid grid-cols-[40px_1fr_100px_100px_100px] gap-2 px-4 py-2 border-b border-white/10 text-xs text-gray-500 uppercase tracking-wider">
                <span>#</span>
                <span>Team</span>
                <span className="text-right">Titles</span>
                <span className="text-right">Final Four</span>
                <span className="text-right">Win %</span>
              </div>

              {leaderboard?.teams.length === 0 && (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">
                  No simulations completed yet. Run a tournament to see results!
                </div>
              )}

              {leaderboard?.teams.map((team, idx) => (
                <div
                  key={team.name}
                  className="grid grid-cols-[40px_1fr_100px_100px_100px] gap-2 px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors items-center"
                >
                  <span className="text-sm font-mono text-gray-500">{idx + 1}</span>
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-5 w-6 shrink-0 items-center justify-center rounded-sm text-[10px] font-bold text-white"
                      style={{ backgroundColor: getSeedColor(team.bestSeed) }}
                    >
                      {team.bestSeed}
                    </span>
                    <span className="text-sm font-medium text-white truncate">{team.name}</span>
                  </div>
                  <span className="text-right text-sm font-mono text-white">{team.championshipWins}</span>
                  <span className="text-right text-sm font-mono text-gray-400">{team.finalFourAppearances}</span>
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-12 h-1.5 rounded-full bg-gray-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-yellow-400"
                        style={{ width: `${team.championshipPct}%` }}
                      />
                    </div>
                    <span className="text-sm font-mono text-yellow-400 w-10 text-right">
                      {team.championshipPct}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent results — sidebar */}
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">
              Recent Simulations
            </h2>
            <div className="flex flex-col gap-2">
              {recentResults?.length === 0 && (
                <div className="rounded-lg border border-white/10 bg-gray-900/50 px-4 py-6 text-center text-gray-500 text-sm">
                  No results yet
                </div>
              )}
              {recentResults?.map((result) => (
                <div
                  key={result._id}
                  className="rounded-lg border border-white/10 bg-gray-900/50 px-3 py-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🏆</span>
                      <span className="text-sm font-medium text-white">
                        #{result.championSeed} {result.champion}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(result.completedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-400">
                      {result.upsetCount} upsets
                    </span>
                    {result.biggestUpset && (
                      <span className="text-xs text-red-400">
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

function StatCard({ label, value, subtitle }: { label: string; value: number; subtitle?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-gray-900/50 px-4 py-3 text-center">
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-gray-400 mt-0.5">{label}</div>
      {subtitle && <div className="text-[10px] text-gray-600">{subtitle}</div>}
    </div>
  );
}
