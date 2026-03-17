"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import ConfettiExplosion from "react-confetti-explosion";
import type { Game, Team } from "../lib/types";
import { getTeamById } from "../lib/utils";
import { TeamPill } from "./TeamPill";
import { cn } from "../lib/utils";

interface MatchupCardProps {
  game: Game;
  teams: Team[];
  onSelect?: (gameId: string) => void;
  isSelected?: boolean;
}

const variants = {
  pending: {
    opacity: 0.55,
    scale: 0.97,
    borderColor: "rgba(255,255,255,0.08)",
    boxShadow: "none",
  },
  simulating: {
    opacity: 1,
    scale: 1,
    borderColor: "#f97316",
    boxShadow: "0 0 12px 2px rgba(249,115,22,0.5)",
  },
  completed: {
    opacity: 1,
    scale: 1,
    borderColor: "rgba(34,197,94,0.35)",
    boxShadow: "none",
  },
  upset: {
    opacity: 1,
    scale: 1,
    borderColor: "#ef4444",
    boxShadow: "0 0 14px 3px rgba(239,68,68,0.55)",
  },
};

const shakeKeyframes = {
  x: [0, -4, 4, -4, 4, -2, 2, 0],
  transition: { duration: 0.5 },
};

export function MatchupCard({ game, teams, onSelect, isSelected }: MatchupCardProps) {
  const teamA = getTeamById(teams, game.teamAId);
  const teamB = getTeamById(teams, game.teamBId);
  const [showConfetti, setShowConfetti] = useState(false);
  const [prevStatus, setPrevStatus] = useState(game.status);

  useEffect(() => {
    if (
      prevStatus !== "completed" &&
      game.status === "completed" &&
      game.isUpset
    ) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
    setPrevStatus(game.status);
  }, [game.status, game.isUpset, prevStatus]);

  const isUpset = game.status === "completed" && game.isUpset;
  const variantKey: keyof typeof variants =
    isUpset ? "upset" : (game.status as keyof typeof variants);

  const winnerAScore =
    game.winnerId === game.teamAId ? game.winnerScore : game.loserScore;
  const winnerBScore =
    game.winnerId === game.teamBId ? game.winnerScore : game.loserScore;

  const animateProps = isUpset
    ? { ...variants.upset, ...shakeKeyframes }
    : variantKey;

  return (
    <motion.div
      className={cn(
        "relative cursor-pointer rounded-lg border bg-gray-900 p-1 select-none overflow-visible",
        isSelected && "ring-2 ring-blue-500"
      )}
      variants={variants}
      animate={animateProps}
      initial={variantKey}
      onClick={() => onSelect?.(game._id)}
      whileHover={{ scale: 1.02 }}
      style={{ borderWidth: 1, minWidth: 160 }}
    >
      {showConfetti && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
          <ConfettiExplosion
            force={0.5}
            duration={2500}
            particleCount={40}
            width={300}
          />
        </div>
      )}

      {game.status === "simulating" && (
        <motion.div
          className="absolute inset-0 rounded-lg bg-orange-500/10"
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}

      <TeamPill
        team={teamA}
        score={game.status === "completed" ? winnerAScore : undefined}
        isWinner={game.winnerId === game.teamAId}
        isEliminated={
          game.status === "completed" && game.winnerId !== game.teamAId
        }
      />

      <div className="mx-2 h-px bg-white/5" />

      <TeamPill
        team={teamB}
        score={game.status === "completed" ? winnerBScore : undefined}
        isWinner={game.winnerId === game.teamBId}
        isEliminated={
          game.status === "completed" && game.winnerId !== game.teamBId
        }
      />

      {game.status === "pending" && (game.scheduledTime || game.tvChannel) && (
        <div className="mt-1 flex flex-wrap gap-x-2 px-2 pb-1">
          {game.tvChannel && (
            <span className="text-xs text-gray-500">{game.tvChannel}</span>
          )}
          {game.scheduledTime && (
            <span className="text-xs text-gray-500">{game.scheduledTime}</span>
          )}
        </div>
      )}

      {game.status === "completed" && game.mvp && (
        <div className="mt-1 px-2 pb-1">
          <span className="text-xs text-yellow-400">⭐ {game.mvp}</span>
        </div>
      )}

      {isUpset && (
        <div className="absolute -top-2 -right-2 rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white shadow-lg">
          UPSET
        </div>
      )}
    </motion.div>
  );
}
