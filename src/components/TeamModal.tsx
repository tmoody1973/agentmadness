"use client";

import { motion, AnimatePresence } from "motion/react";
import type { Team } from "../lib/types";
import { getSeedColor } from "../lib/types";

interface TeamModalProps {
  team: Team | null;
  onClose: () => void;
}

export function TeamModal({ team, onClose }: TeamModalProps) {
  if (!team) return null;

  const seedColor = getSeedColor(team.seed);
  const effMargin = (team.adjOE - team.adjDE).toFixed(1);
  const isPositive = team.adjOE - team.adjDE > 0;

  return (
    <AnimatePresence>
      {team && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed z-50 top-1/2 left-1/2 w-[420px] max-h-[80vh] overflow-y-auto rounded-xl border border-white/10 bg-gray-900 shadow-2xl"
            initial={{ opacity: 0, scale: 0.95, x: "-50%", y: "-50%" }}
            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
            exit={{ opacity: 0, scale: 0.95, x: "-50%", y: "-50%" }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm font-bold text-white"
                style={{ backgroundColor: seedColor }}
              >
                {team.seed}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold text-white truncate">{team.name}</h2>
                <p className="text-xs text-gray-400">
                  {team.conference.toUpperCase()} · {team.region} · {team.record}
                </p>
              </div>
              <button
                onClick={onClose}
                className="shrink-0 rounded-md p-1 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-px bg-white/5 border-b border-white/10">
              {[
                { label: "Adj OE", value: team.adjOE.toFixed(1), sub: "pts/100" },
                { label: "Adj DE", value: team.adjDE.toFixed(1), sub: "pts/100" },
                { label: "Tempo", value: team.adjTempo.toFixed(1), sub: "poss/g" },
                { label: "NET Eff", value: `${isPositive ? "+" : ""}${effMargin}`, sub: "margin", highlight: isPositive },
              ].map((stat) => (
                <div key={stat.label} className="bg-gray-900 px-3 py-3 text-center">
                  <div className="text-[10px] uppercase tracking-wider text-gray-500">{stat.label}</div>
                  <div className={`text-base font-bold tabular-nums ${stat.highlight ? "text-green-400" : "text-white"}`}>
                    {stat.value}
                  </div>
                  <div className="text-[9px] text-gray-600">{stat.sub}</div>
                </div>
              ))}
            </div>

            {/* Upset Factors */}
            <div className="grid grid-cols-4 gap-px bg-white/5 border-b border-white/10">
              {[
                { label: "Volatility", value: team.volatility.toFixed(1) },
                { label: "Experience", value: team.tournamentExperience.toFixed(1) },
                { label: "Clutch", value: team.clutchRating.toFixed(1) },
                { label: "Depth", value: team.depthScore.toFixed(1) },
              ].map((factor) => (
                <div key={factor.label} className="bg-gray-900 px-3 py-3 text-center">
                  <div className="text-[10px] uppercase tracking-wider text-gray-500">{factor.label}</div>
                  <div className="text-base font-bold text-white tabular-nums">{factor.value}</div>
                  <div className="text-[9px] text-gray-600">/10</div>
                </div>
              ))}
            </div>

            {/* Style Traits */}
            <div className="px-5 py-3 border-b border-white/10">
              <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Playing Style</div>
              <div className="flex flex-wrap gap-1.5">
                {team.styleTraits.map((trait) => (
                  <span
                    key={trait}
                    className="rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-[11px] text-gray-300"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </div>

            {/* Key Players */}
            <div className="px-5 py-3 border-b border-white/10">
              <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Key Players</div>
              <p className="text-sm text-gray-300 leading-relaxed">{team.keyPlayers}</p>
            </div>

            {/* Perplexity Context */}
            {team.perplexityContext && (
              <div className="px-5 py-3 border-b border-white/10">
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="text-[10px] uppercase tracking-wider text-gray-500">AI Scouting Report</div>
                  <span className="text-[9px] text-gray-600 bg-white/5 rounded px-1">Perplexity + Claude</span>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">{team.perplexityContext}</p>
              </div>
            )}

            {/* Status */}
            <div className="px-5 py-3">
              <div className={`text-xs font-medium ${team.eliminated ? "text-red-400" : "text-green-400"}`}>
                {team.eliminated
                  ? `Eliminated in ${team.eliminatedRound ?? "unknown round"}`
                  : "Still dancing"}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
