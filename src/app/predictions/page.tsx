"use client";

import { useState } from "react";
import { TeamLogo } from "../../components/TeamLogo";
import { getSeedColor } from "../../lib/types";
import {
  predictionHighlights,
  type PredictionMatchup,
} from "../../data/prediction-highlights";

// ── Constants ─────────────────────────────────────────────────────────────────

const ENSEMBLE_WEIGHTS = [
  { label: "KenPom Efficiency", weight: 55, color: "#00E5A0", desc: "Adjusted offensive + defensive efficiency margin" },
  { label: "Bradley-Terry", weight: 30, color: "#4B8DF8", desc: "Iterative win-probability rating from all games" },
  { label: "Seed-Based", weight: 10, color: "#FFB800", desc: "Historical seed win rates, logistic adjusted" },
  { label: "Conf Tourney", weight: 5, color: "#F44771", desc: "Conference champion momentum signal" },
];

const REGIONS = ["East", "South", "West", "Midwest"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function confidenceLabel(prob: number): { label: string; color: string } {
  const conf = Math.max(prob, 1 - prob);
  if (conf >= 0.80) return { label: "High Confidence", color: "#00E5A0" };
  if (conf >= 0.60) return { label: "Favored", color: "#4B8DF8" };
  return { label: "Toss-Up", color: "#FFB800" };
}

function isUpsetPick(m: PredictionMatchup): boolean {
  // We favor the higher-seeded (worse) team
  if (m.teamA.seed > m.teamB.seed && m.probA > 0.5) return true;
  if (m.teamB.seed > m.teamA.seed && m.probA < 0.5) return true;
  return false;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MatchupRow({ matchup }: { matchup: PredictionMatchup }) {
  const { probA } = matchup;
  const probB = 1 - probA;
  const upset = isUpsetPick(matchup);
  const { label: confLabel, color: confColor } = confidenceLabel(probA);

  const favorA = probA >= 0.5;

  return (
    <div className={`rounded-xl border transition-all ${upset ? "border-[#F44771]/40 bg-[#F44771]/5" : "border-white/8 bg-[#1C2636]"} p-4 mb-2`}>
      {upset && (
        <div className="flex justify-end mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#F44771] bg-[#F44771]/15 px-2 py-0.5 rounded-full border border-[#F44771]/30">
            Upset Pick
          </span>
        </div>
      )}

      {/* Team A */}
      <div className="mb-1.5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="text-[11px] font-bold w-6 text-center shrink-0"
              style={{ color: getSeedColor(matchup.teamA.seed) }}
            >
              {matchup.teamA.seed}
            </span>
            <TeamLogo teamName={matchup.teamA.name} size={20} />
            <span className={`text-sm font-semibold truncate ${favorA ? "text-white" : "text-white/50"}`}>
              {matchup.teamA.name}
            </span>
          </div>
          <span className={`text-sm font-mono font-bold shrink-0 ml-2 ${favorA ? "text-white" : "text-white/40"}`}>
            {(probA * 100).toFixed(0)}%
          </span>
        </div>
        {/* Probability bar A */}
        <div className="h-1.5 rounded-full bg-white/8 overflow-hidden ml-8">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${probA * 100}%`,
              background: favorA ? confColor : "rgba(255,255,255,0.2)",
            }}
          />
        </div>
      </div>

      {/* Team B */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="text-[11px] font-bold w-6 text-center shrink-0"
              style={{ color: getSeedColor(matchup.teamB.seed) }}
            >
              {matchup.teamB.seed}
            </span>
            <TeamLogo teamName={matchup.teamB.name} size={20} />
            <span className={`text-sm font-semibold truncate ${!favorA ? "text-white" : "text-white/50"}`}>
              {matchup.teamB.name}
            </span>
          </div>
          <span className={`text-sm font-mono font-bold shrink-0 ml-2 ${!favorA ? "text-white" : "text-white/40"}`}>
            {(probB * 100).toFixed(0)}%
          </span>
        </div>
        {/* Probability bar B */}
        <div className="h-1.5 rounded-full bg-white/8 overflow-hidden ml-8">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${probB * 100}%`,
              background: !favorA ? confColor : "rgba(255,255,255,0.2)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function UpsetCard({ matchup }: { matchup: PredictionMatchup }) {
  const probUnderdog =
    matchup.teamA.seed > matchup.teamB.seed ? matchup.probA : 1 - matchup.probA;
  const underdog =
    matchup.teamA.seed > matchup.teamB.seed ? matchup.teamA : matchup.teamB;
  const favorite =
    matchup.teamA.seed > matchup.teamB.seed ? matchup.teamB : matchup.teamA;
  const seedDiff = Math.abs(matchup.teamA.seed - matchup.teamB.seed);

  return (
    <div className="bg-[#F44771]/8 border border-[#F44771]/25 rounded-xl p-4 hover:border-[#F44771]/40 transition-all">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[#F44771] text-sm font-bold">Seed +{seedDiff}</span>
        <span className="text-white/30 text-xs">{matchup.gender === "men" ? "Men's" : "Women's"} {matchup.region}</span>
      </div>

      <div className="flex items-center gap-2 mb-1.5">
        <TeamLogo teamName={underdog.name} size={22} />
        <div>
          <div className="flex items-center gap-1.5">
            <span
              className="text-xs font-bold"
              style={{ color: getSeedColor(underdog.seed) }}
            >
              #{underdog.seed}
            </span>
            <span className="text-white text-sm font-bold">{underdog.name}</span>
          </div>
          <span className="text-[#F44771] text-xs font-semibold">
            We give {(probUnderdog * 100).toFixed(0)}% chance to win
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-white/40 text-xs mt-2 ml-1">
        <span>vs #{favorite.seed}</span>
        <TeamLogo teamName={favorite.name} size={16} />
        <span>{favorite.name}</span>
      </div>

      {/* Visual bar */}
      <div className="mt-3 h-2 rounded-full bg-white/8 overflow-hidden">
        <div
          className="h-full rounded-full bg-[#F44771]"
          style={{ width: `${probUnderdog * 100}%` }}
        />
      </div>
    </div>
  );
}

function ChampionshipCard({ matchup }: { matchup: PredictionMatchup }) {
  const favorA = matchup.probA >= 0.5;
  const winner = favorA ? matchup.teamA : matchup.teamB;
  const loser = favorA ? matchup.teamB : matchup.teamA;
  const winProb = favorA ? matchup.probA : 1 - matchup.probA;

  return (
    <div className="bg-[#1C2636] border border-white/8 rounded-xl p-4 hover:border-[#00E5A0]/30 transition-all">
      <div className="text-[10px] text-white/30 uppercase tracking-wider mb-3">
        {matchup.gender === "men" ? "Men's" : "Women's"} · 1-Seed Matchup
      </div>
      <div className="flex items-center gap-2 mb-2">
        <TeamLogo teamName={winner.name} size={28} />
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate">{winner.name}</p>
          <p className="text-[#00E5A0] text-xs font-semibold">{(winProb * 100).toFixed(0)}% to win</p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-white/40">
        <TeamLogo teamName={loser.name} size={20} />
        <span className="text-xs">vs {loser.name} ({((1 - winProb) * 100).toFixed(0)}%)</span>
      </div>
      <div className="mt-3 h-1.5 bg-white/8 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-[#00E5A0]"
          style={{ width: `${winProb * 100}%` }}
        />
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PredictionsPage() {
  const [gender, setGender] = useState<"men" | "women">("men");
  const [menuOpen, setMenuOpen] = useState(false);

  const { firstRoundMatchups, upsetPicks, championshipMatchups, mostConfident, biggestTossups, stats } =
    predictionHighlights;

  const filteredFirst = firstRoundMatchups.filter((m) => m.gender === gender);
  const filteredUpsets = upsetPicks.filter((m) => m.gender === gender);
  const filteredChamp = championshipMatchups.filter((m) => m.gender === gender);

  return (
    <div className="min-h-screen bg-[#0A0E17] text-[#F8FAFC]">
      {/* ── Navigation ──────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0A0E17]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <a href="/" className="text-[#00E5A0] font-extrabold text-lg tracking-tight uppercase">
            AgentMadness
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="/simulator" className="text-sm text-white/60 hover:text-white uppercase tracking-wider font-semibold transition-colors">
              Simulator
            </a>
            <a href="/predictions" className="text-sm text-[#00E5A0] uppercase tracking-wider font-semibold">
              Predictions
            </a>
            <a href="/leaderboard" className="text-sm text-white/60 hover:text-white uppercase tracking-wider font-semibold transition-colors">
              Leaderboard
            </a>
            <a href="/learn" className="text-sm text-white/60 hover:text-white uppercase tracking-wider font-semibold transition-colors">
              Learn
            </a>
            <a href="/simulator" className="text-sm bg-[#00E5A0] text-[#0A0E17] font-bold uppercase tracking-wider px-4 py-1.5 rounded hover:bg-[#00c98e] transition-colors">
              Launch →
            </a>
          </nav>

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex items-center justify-center h-11 w-11 text-white text-2xl"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-[#0A0E17]/95 backdrop-blur-md flex flex-col items-center justify-center gap-8 md:hidden">
          <button
            className="absolute top-4 right-4 flex items-center justify-center h-11 w-11 text-white text-2xl"
            onClick={() => setMenuOpen(false)}
          >
            ✕
          </button>
          {[
            { label: "Simulator", href: "/simulator" },
            { label: "Predictions", href: "/predictions" },
            { label: "Leaderboard", href: "/leaderboard" },
            { label: "Learn", href: "/learn" },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="text-2xl font-bold uppercase tracking-wider text-white"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}

      <div className="pt-14">
        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <section className="relative py-16 md:py-24 px-4 md:px-6 overflow-hidden border-b border-white/5">
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#00E5A0]/5 via-transparent to-[#4B8DF8]/5" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#00E5A0]/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />

          <div className="relative max-w-6xl mx-auto">
            <p className="text-[#00E5A0] text-xs font-semibold uppercase tracking-[0.25em] mb-4">
              /Kaggle Submission · March Machine Learning Mania 2026
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold uppercase tracking-tighter text-white leading-[0.9] mb-6">
              Our<br />
              <span className="text-[#00E5A0]">Predictions</span>
            </h1>
            <p className="text-white/50 text-base md:text-lg max-w-2xl mb-8 leading-relaxed">
              132,133 matchup probabilities. Every possible game in both tournaments.
              Built with a 4-model ensemble — KenPom efficiency, Bradley-Terry ratings,
              seed history, and conference tournament momentum.
            </p>
          </div>
        </section>

        {/* ── Model Breakdown ───────────────────────────────────────────────── */}
        <section className="py-12 md:py-16 px-4 md:px-6 border-b border-white/5">
          <div className="max-w-6xl mx-auto">
            <p className="text-[#00E5A0] text-xs font-semibold uppercase tracking-[0.25em] mb-2">
              /Model Architecture
            </p>
            <h2 className="text-2xl md:text-3xl font-extrabold uppercase tracking-tight text-white mb-8">
              4-Model Ensemble
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {ENSEMBLE_WEIGHTS.map((model) => (
                <div
                  key={model.label}
                  className="bg-[#1C2636] border border-white/8 rounded-xl p-5 hover:border-white/15 transition-all"
                >
                  {/* Weight bar */}
                  <div className="flex items-end justify-between mb-3">
                    <span
                      className="text-3xl md:text-4xl font-mono font-extrabold"
                      style={{ color: model.color }}
                    >
                      {model.weight}%
                    </span>
                  </div>
                  {/* Visual bar */}
                  <div className="h-1.5 rounded-full bg-white/8 overflow-hidden mb-3">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${model.weight}%`, background: model.color }}
                    />
                  </div>
                  <p className="text-white text-sm font-bold mb-1">{model.label}</p>
                  <p className="text-white/40 text-xs leading-relaxed">{model.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Stats Bar ─────────────────────────────────────────────────────── */}
        <section className="py-8 px-4 md:px-6 border-b border-white/5 bg-[#1C2636]/40">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
              {[
                {
                  value: stats.totalPredictions.toLocaleString(),
                  label: "Total Predictions",
                  color: "#00E5A0",
                },
                {
                  value: `${(stats.avgConfidence * 100).toFixed(1)}%`,
                  label: "Avg Confidence",
                  color: "#4B8DF8",
                },
                {
                  value: stats.predictionsAbove90.toLocaleString(),
                  label: "Above 90% Conf",
                  color: "#00E5A0",
                },
                {
                  value: stats.tossups4555.toLocaleString(),
                  label: "True Toss-Ups",
                  color: "#FFB800",
                },
                {
                  value: stats.predictionsBelow10.toLocaleString(),
                  label: "Extreme Upsets",
                  color: "#F44771",
                },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p
                    className="text-xl md:text-2xl font-mono font-extrabold"
                    style={{ color: stat.color }}
                  >
                    {stat.value}
                  </p>
                  <p className="text-[10px] text-white/40 uppercase tracking-[0.15em] mt-0.5">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── First Round Predictions ───────────────────────────────────────── */}
        <section className="py-12 md:py-16 px-4 md:px-6 border-b border-white/5">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <p className="text-[#00E5A0] text-xs font-semibold uppercase tracking-[0.25em] mb-2">
                  /Round of 64
                </p>
                <h2 className="text-2xl md:text-3xl font-extrabold uppercase tracking-tight text-white">
                  First Round Predictions
                </h2>
              </div>

              {/* Gender toggle */}
              <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
                {(["men", "women"] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition-all ${
                      gender === g
                        ? "bg-[#00E5A0] text-[#0A0E17]"
                        : "text-white/50 hover:text-white"
                    }`}
                  >
                    {g === "men" ? "Men's" : "Women's"}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {REGIONS.map((region) => {
                const regionGames = filteredFirst.filter((m) => m.region === region);
                return (
                  <div key={region}>
                    <h3 className="text-white/50 text-xs font-bold uppercase tracking-[0.2em] mb-3 px-1">
                      {region} Region
                    </h3>
                    <div>
                      {regionGames.map((m, i) => (
                        <MatchupRow key={`${m.teamA.id}-${m.teamB.id}-${i}`} matchup={m} />
                      ))}
                      {regionGames.length === 0 && (
                        <p className="text-white/20 text-sm text-center py-8">No matchups found</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Upset Alert ───────────────────────────────────────────────────── */}
        {filteredUpsets.length > 0 && (
          <section className="py-12 md:py-16 px-4 md:px-6 border-b border-white/5">
            <div className="max-w-6xl mx-auto">
              <p className="text-[#F44771] text-xs font-semibold uppercase tracking-[0.25em] mb-2">
                /Model Alert
              </p>
              <h2 className="text-2xl md:text-3xl font-extrabold uppercase tracking-tight text-white mb-2">
                Upset Picks
              </h2>
              <p className="text-white/40 text-sm mb-8 max-w-xl">
                Matchups where our ensemble model favors the higher-seeded (underdog) team.
                The efficiency gap is smaller than seed suggests.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUpsets.map((m, i) => (
                  <UpsetCard key={`${m.teamA.id}-${m.teamB.id}-${i}`} matchup={m} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Championship Predictions ──────────────────────────────────────── */}
        {filteredChamp.length > 0 && (
          <section className="py-12 md:py-16 px-4 md:px-6 border-b border-white/5">
            <div className="max-w-6xl mx-auto">
              <p className="text-[#4B8DF8] text-xs font-semibold uppercase tracking-[0.25em] mb-2">
                /Elite Matchups
              </p>
              <h2 className="text-2xl md:text-3xl font-extrabold uppercase tracking-tight text-white mb-2">
                1-Seed vs 1-Seed
              </h2>
              <p className="text-white/40 text-sm mb-8 max-w-xl">
                Championship-caliber clashes. Every possible matchup between the four #1 seeds —
                the teams our model rates as the tournament favorites.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredChamp.map((m, i) => (
                  <ChampionshipCard key={`${m.teamA.id}-${m.teamB.id}-${i}`} matchup={m} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Most Confident + Biggest Toss-ups ─────────────────────────────── */}
        <section className="py-12 md:py-16 px-4 md:px-6 border-b border-white/5">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Most Confident */}
            <div>
              <p className="text-[#00E5A0] text-xs font-semibold uppercase tracking-[0.25em] mb-2">
                /High Confidence
              </p>
              <h3 className="text-xl md:text-2xl font-extrabold uppercase tracking-tight text-white mb-6">
                Most Lopsided
              </h3>
              <div className="space-y-2">
                {mostConfident.map((m, i) => {
                  const conf = Math.max(m.probA, 1 - m.probA);
                  const fav = m.probA >= 0.5 ? m.teamA : m.teamB;
                  const dog = m.probA >= 0.5 ? m.teamB : m.teamA;
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 bg-[#1C2636] border border-white/5 rounded-lg px-4 py-3"
                    >
                      <span className="text-[#00E5A0] font-mono font-bold text-sm w-10 shrink-0">
                        {(conf * 100).toFixed(0)}%
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <TeamLogo teamName={fav.name} size={16} />
                          <span className="text-white text-xs font-semibold truncate">
                            {fav.name}
                          </span>
                          <span className="text-white/30 text-xs shrink-0">over</span>
                          <span className="text-white/50 text-xs truncate">{dog.name}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-white/30 shrink-0">
                        {m.gender === "men" ? "M" : "W"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Biggest Toss-ups */}
            <div>
              <p className="text-[#FFB800] text-xs font-semibold uppercase tracking-[0.25em] mb-2">
                /Coin Flip
              </p>
              <h3 className="text-xl md:text-2xl font-extrabold uppercase tracking-tight text-white mb-6">
                Biggest Toss-Ups
              </h3>
              <div className="space-y-2">
                {biggestTossups.map((m, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 bg-[#1C2636] border border-white/5 rounded-lg px-4 py-3"
                  >
                    <span className="text-[#FFB800] font-mono font-bold text-sm w-10 shrink-0">
                      {(m.probA * 100).toFixed(0)}%
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <TeamLogo teamName={m.teamA.name} size={16} />
                        <span className="text-white text-xs font-semibold truncate">
                          {m.teamA.name}
                        </span>
                        <span className="text-white/30 text-xs shrink-0">vs</span>
                        <TeamLogo teamName={m.teamB.name} size={16} />
                        <span className="text-white/70 text-xs truncate">{m.teamB.name}</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-white/30 shrink-0">
                      {m.gender === "men" ? "M" : "W"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── How to Read This ─────────────────────────────────────────────── */}
        <section className="py-12 md:py-16 px-4 md:px-6 border-b border-white/5">
          <div className="max-w-6xl mx-auto">
            <p className="text-[#00E5A0] text-xs font-semibold uppercase tracking-[0.25em] mb-2">
              /Guide
            </p>
            <h2 className="text-2xl md:text-3xl font-extrabold uppercase tracking-tight text-white mb-8">
              How to Read This
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: "Win Probability",
                  color: "#00E5A0",
                  body: "A prediction of 0.75 means our model thinks Team A wins 75 out of 100 times that matchup is played. It's not a guarantee — it's a distribution.",
                },
                {
                  title: "Upset Picks",
                  color: "#F44771",
                  body: "An upset pick means our ensemble favors the worse-seeded team. This happens when the efficiency gap is smaller than seed suggests — the selection committee sometimes under-seeds a strong team.",
                },
                {
                  title: "Toss-Ups",
                  color: "#FFB800",
                  body: "Predictions near 50% mean our model has high uncertainty. In these games, anything can happen — and that's where March Madness lives.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="bg-[#1C2636] border border-white/8 rounded-xl p-6"
                >
                  <h3
                    className="text-sm font-extrabold uppercase tracking-tight mb-3"
                    style={{ color: item.color }}
                  >
                    {item.title}
                  </h3>
                  <p className="text-white/50 text-sm leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <a
                href="/learn"
                className="inline-flex items-center gap-2 border border-[#00E5A0]/30 text-[#00E5A0] font-bold uppercase tracking-wider px-6 py-3 rounded-lg text-sm hover:bg-[#00E5A0]/10 transition-all"
              >
                Full Methodology →
              </a>
              <a
                href="/simulator"
                className="inline-flex items-center gap-2 bg-[#00E5A0] text-[#0A0E17] font-extrabold uppercase tracking-wider px-6 py-3 rounded-lg text-sm hover:bg-[#00c98e] transition-all"
              >
                Run the Tournament →
              </a>
            </div>
          </div>
        </section>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <footer className="py-10 px-4 md:px-6 border-t border-white/5">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-[#00E5A0] font-extrabold uppercase tracking-tight">
              AgentMadness
            </span>
            <div className="flex items-center gap-6 text-sm text-white/30">
              <a href="/simulator" className="hover:text-white/60 transition-colors">Simulator</a>
              <a href="/predictions" className="hover:text-white/60 transition-colors">Predictions</a>
              <a href="/leaderboard" className="hover:text-white/60 transition-colors">Leaderboard</a>
              <a href="/learn" className="hover:text-white/60 transition-colors">Learn</a>
            </div>
            <p className="text-xs text-white/20">
              Built with Claude AI · March 2026
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
