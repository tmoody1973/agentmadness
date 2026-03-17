"use client";

import { motion } from "motion/react";
import type { Game, Team } from "../lib/types";
import { getGamesByRound, getTeamById } from "../lib/utils";
import { MatchupCard } from "./MatchupCard";

interface FinalFourProps {
  games: Game[];
  teams: Team[];
  onSelectGame: (gameId: string) => void;
  onTeamClick?: (team: Team) => void;
  selectedGameId?: string;
  champion?: string;
}

export function FinalFour({
  games,
  teams,
  onSelectGame,
  onTeamClick,
  selectedGameId,
  champion,
}: FinalFourProps) {
  const f4Games = getGamesByRound(games, "F4") as Game[];
  const champGames = getGamesByRound(games, "CHAMP") as Game[];
  const champGame = champGames[0] ?? null;
  const championTeam = champion ? teams.find((t) => t._id === champion) : undefined;

  const [semi1, semi2] = [f4Games[0] ?? null, f4Games[1] ?? null];

  return (
    <div className="flex flex-col items-center gap-3 px-2">
      {/* Header */}
      <div className="text-center">
        <span className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#FFB800]">
          Final Four
        </span>
      </div>

      {/* Horizontal layout: Semifinal 1 — Championship — Semifinal 2 */}
      <div className="flex items-center gap-5">
        {/* Semifinal 1 */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#94A3B8]">
            Semifinal 1
          </span>
          {semi1 ? (
            <motion.div
              key={semi1._id}
              initial={{ scale: 0.95, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <MatchupCard
                game={semi1}
                teams={teams}
                onSelect={onSelectGame}
                onTeamClick={onTeamClick}
                isSelected={selectedGameId === semi1._id}
              />
            </motion.div>
          ) : (
            <EmptySlot label="TBD" />
          )}
        </div>

        {/* Connector lines + championship */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          {/* Arrow lines */}
          <div className="flex items-center gap-0">
            <div className="w-6 h-px bg-white/15" />
            <div className="flex flex-col items-center gap-1">
              {champGame ? (
                <motion.div
                  className="flex flex-col items-center gap-1"
                  initial={{ scale: 0.9, opacity: 0.6 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <span className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#FFB800]">
                    🏆 Championship
                  </span>
                  <div className="ring-1 ring-[#FFB800]/40 rounded-xl p-1 bg-[#FFB800]/5">
                    <MatchupCard
                      game={champGame}
                      teams={teams}
                      onSelect={onSelectGame}
                      onTeamClick={onTeamClick}
                      isSelected={selectedGameId === champGame._id}
                    />
                  </div>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#FFB800]">
                    🏆 Championship
                  </span>
                  <EmptySlot label="TBD" />
                </div>
              )}
            </div>
            <div className="w-6 h-px bg-white/15" />
          </div>
        </div>

        {/* Semifinal 2 */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#94A3B8]">
            Semifinal 2
          </span>
          {semi2 ? (
            <motion.div
              key={semi2._id}
              initial={{ scale: 0.95, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <MatchupCard
                game={semi2}
                teams={teams}
                onSelect={onSelectGame}
                onTeamClick={onTeamClick}
                isSelected={selectedGameId === semi2._id}
              />
            </motion.div>
          ) : (
            <EmptySlot label="TBD" />
          )}
        </div>
      </div>

      {/* Champion banner */}
      {championTeam && (
        <motion.div
          className="flex flex-col items-center gap-1.5 rounded-xl bg-[#FFB800]/10 border border-[#FFB800]/30 px-5 py-3 text-center mt-2"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <div className="text-2xl">🏆</div>
          <div className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#FFB800]">
            Champion
          </div>
          <div className="text-base font-extrabold uppercase tracking-tight text-white">{championTeam.name}</div>
          <div className="text-xs font-medium text-[#94A3B8]">
            #{championTeam.seed} seed · {championTeam.conference}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function EmptySlot({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center rounded border border-white/5 bg-[#1E2A3A] text-xs text-[#475569] italic"
      style={{ width: 200, height: 58 }}>
      {label}
    </div>
  );
}
