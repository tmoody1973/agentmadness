"use client";

import { motion } from "motion/react";
import type { Game, Team } from "../lib/types";
import { getGamesByRound, getTeamById } from "../lib/utils";
import { MatchupCard } from "./MatchupCard";

interface FinalFourProps {
  games: Game[];
  teams: Team[];
  onSelectGame: (gameId: string) => void;
  selectedGameId?: string;
  champion?: string;
}

export function FinalFour({
  games,
  teams,
  onSelectGame,
  selectedGameId,
  champion,
}: FinalFourProps) {
  const f4Games = getGamesByRound(games, "F4") as Game[];
  const champGames = getGamesByRound(games, "CHAMP") as Game[];
  const champGame = champGames[0] ?? null;
  const championTeam = champion ? getTeamById(teams, champion) : undefined;

  return (
    <div className="flex flex-col items-center gap-4 px-2">
      {/* Header */}
      <div className="text-center">
        <div className="text-xs font-semibold uppercase tracking-widest text-yellow-400">
          Final Four
        </div>
      </div>

      {/* Semifinal games */}
      <div className="flex flex-col gap-6 w-full">
        {f4Games.map((game) => (
          <motion.div
            key={game._id}
            initial={{ scale: 0.95, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center text-xs text-gray-500 mb-1">
              Semifinal
            </div>
            <MatchupCard
              game={game}
              teams={teams}
              onSelect={onSelectGame}
              isSelected={selectedGameId === game._id}
            />
          </motion.div>
        ))}
      </div>

      {/* Divider */}
      <div className="w-full h-px bg-yellow-400/20" />

      {/* Championship game */}
      {champGame && (
        <motion.div
          className="w-full"
          initial={{ scale: 0.9, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="text-center text-xs font-bold text-yellow-400 mb-1 uppercase tracking-wider">
            🏆 Championship
          </div>
          <div className="ring-1 ring-yellow-400/40 rounded-xl p-1 bg-yellow-900/10">
            <MatchupCard
              game={champGame}
              teams={teams}
              onSelect={onSelectGame}
              isSelected={selectedGameId === champGame._id}
            />
          </div>
        </motion.div>
      )}

      {/* Champion banner */}
      {championTeam && (
        <motion.div
          className="flex flex-col items-center gap-2 rounded-xl bg-yellow-400/10 border border-yellow-400/30 px-6 py-4 text-center"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <div className="text-3xl">🏆</div>
          <div className="text-xs text-yellow-400 uppercase tracking-widest font-semibold">
            Champion
          </div>
          <div className="text-lg font-bold text-white">
            {championTeam.name}
          </div>
          <div className="text-sm text-gray-400">
            #{championTeam.seed} seed · {championTeam.conference}
          </div>
        </motion.div>
      )}
    </div>
  );
}
