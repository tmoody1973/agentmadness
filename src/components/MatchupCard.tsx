"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import ConfettiExplosion from "react-confetti-explosion";
import type { Game, Team } from "../lib/types";
import { getTeamById } from "../lib/utils";
import { TeamPill } from "./TeamPill";
import { cn } from "../lib/utils";

interface MatchupCardProps {
  game: Game;
  teams: Team[];
  onSelect?: (gameId: string) => void;
  onTeamClick?: (team: Team) => void;
  isSelected?: boolean;
}

const variants = {
  pending: {
    opacity: 0.5,
    borderColor: "rgba(255,255,255,0.06)",
    boxShadow: "none",
  },
  simulating: {
    opacity: 1,
    borderColor: "#f97316",
    boxShadow: "0 0 10px 2px rgba(249,115,22,0.4)",
  },
  completed: {
    opacity: 1,
    borderColor: "rgba(34,197,94,0.25)",
    boxShadow: "none",
  },
  upset: {
    opacity: 1,
    borderColor: "#ef4444",
    boxShadow: "0 0 12px 2px rgba(239,68,68,0.45)",
  },
};

export function MatchupCard({ game, teams, onSelect, onTeamClick, isSelected }: MatchupCardProps) {
  const teamA = getTeamById(teams, game.teamAId);
  const teamB = getTeamById(teams, game.teamBId);
  const [showConfetti, setShowConfetti] = useState(false);
  const [prevStatus, setPrevStatus] = useState(game.status);

  useEffect(() => {
    if (prevStatus !== "completed" && game.status === "completed" && game.isUpset) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
    setPrevStatus(game.status);
  }, [game.status, game.isUpset, prevStatus]);

  const isUpset = game.status === "completed" && game.isUpset;
  const variantKey = isUpset ? "upset" : (game.status as keyof typeof variants);

  const scoreA = game.status === "completed"
    ? (game.winnerId === game.teamAId ? game.winnerScore : game.loserScore)
    : undefined;
  const scoreB = game.status === "completed"
    ? (game.winnerId === game.teamBId ? game.winnerScore : game.loserScore)
    : undefined;

  const animateValues = isUpset
    ? { ...variants.upset, x: [0, -3, 3, -3, 3, 0] }
    : variants[variantKey];

  return (
    <motion.div
      className={cn(
        "relative cursor-pointer rounded border bg-gray-900/80 select-none overflow-visible",
        isSelected && "ring-1 ring-blue-500"
      )}
      animate={animateValues}
      transition={isUpset ? { x: { duration: 0.4 } } : { duration: 0.3 }}
      onClick={() => onSelect?.(game._id)}
      style={{ borderWidth: 1, width: 170 }}
    >
      {showConfetti && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
          <ConfettiExplosion force={0.4} duration={2000} particleCount={30} width={200} />
        </div>
      )}

      {game.status === "simulating" && (
        <motion.div
          className="absolute inset-0 rounded bg-orange-500/10"
          animate={{ opacity: [0.1, 0.25, 0.1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}

      {/* Team A */}
      <div className={cn(
        "flex items-center justify-between px-1.5 py-0.5",
        game.status === "completed" && game.winnerId === game.teamAId && "bg-green-500/10",
        game.status === "completed" && game.winnerId !== game.teamAId && "opacity-40",
      )}>
        <TeamPill team={teamA} isWinner={game.winnerId === game.teamAId} onTeamClick={onTeamClick} />
        {scoreA !== undefined && (
          <span className={cn(
            "text-xs font-mono font-bold tabular-nums",
            game.winnerId === game.teamAId ? "text-green-400" : "text-gray-500"
          )}>{scoreA}</span>
        )}
      </div>

      <div className="h-px bg-white/5" />

      {/* Team B */}
      <div className={cn(
        "flex items-center justify-between px-1.5 py-0.5",
        game.status === "completed" && game.winnerId === game.teamBId && "bg-green-500/10",
        game.status === "completed" && game.winnerId !== game.teamBId && "opacity-40",
      )}>
        <TeamPill team={teamB} isWinner={game.winnerId === game.teamBId} onTeamClick={onTeamClick} />
        {scoreB !== undefined && (
          <span className={cn(
            "text-xs font-mono font-bold tabular-nums",
            game.winnerId === game.teamBId ? "text-green-400" : "text-gray-500"
          )}>{scoreB}</span>
        )}
      </div>

      {/* Upset badge */}
      {isUpset && (
        <div className="absolute -top-1.5 -right-1.5 rounded-full bg-red-500 px-1 py-0 text-[9px] font-bold text-white shadow">
          UPSET
        </div>
      )}
    </motion.div>
  );
}
