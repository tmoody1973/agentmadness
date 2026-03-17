"use client";

import { motion, AnimatePresence } from "motion/react";
import { TypeAnimation } from "react-type-animation";
import type { Game, Team } from "../lib/types";
import { getTeamById } from "../lib/utils";
import { AudioPlayer } from "./AudioPlayer";

interface GameNarrativeProps {
  game: Game | null;
  teams: Team[];
  announcerEnabled: boolean;
}

export function GameNarrative({ game, teams, announcerEnabled }: GameNarrativeProps) {
  return (
    <AnimatePresence>
      {game && game.status === "completed" && (
        <motion.div
          key={game._id}
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4"
        >
          <NarrativePanel
            game={game}
            teams={teams}
            announcerEnabled={announcerEnabled}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function NarrativePanel({
  game,
  teams,
  announcerEnabled,
}: {
  game: Game;
  teams: Team[];
  announcerEnabled: boolean;
}) {
  const winner = getTeamById(teams, game.winnerId);
  const loser =
    game.teamAId === game.winnerId
      ? getTeamById(teams, game.teamBId)
      : getTeamById(teams, game.teamAId);

  return (
    <div className="rounded-2xl border border-white/5 bg-[#111827]/95 backdrop-blur-md shadow-2xl px-5 py-4 flex flex-col gap-3">
      {/* Score line */}
      {winner && loser && (
        <div className="flex items-center gap-3 text-sm">
          <span className="font-extrabold uppercase tracking-tight text-white">
            #{winner.seed} {winner.name}{" "}
            <span className="text-[#00E5A0] font-mono tabular-nums">{game.winnerScore}</span>
          </span>
          <span className="text-[#475569] text-xs font-semibold">vs</span>
          <span className="text-[#94A3B8]">
            #{loser.seed} {loser.name}{" "}
            <span className="text-[#475569] font-mono tabular-nums">{game.loserScore}</span>
          </span>
          {game.isUpset && (
            <span className="ml-auto rounded-full bg-[#FF3B5C] px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
              🔥 UPSET
            </span>
          )}
        </div>
      )}

      {/* Narrative typewriter */}
      {game.gameNarrative && (
        <div className="text-sm text-[#94A3B8] leading-relaxed min-h-[3em]">
          <TypeAnimation
            key={game._id}
            sequence={[game.gameNarrative]}
            speed={70}
            cursor={false}
          />
        </div>
      )}

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-[#475569]">
        {game.mvp && (
          <span className="text-[#FFB800] font-bold">⭐ MVP: {game.mvp}</span>
        )}
        {game.winProbability !== undefined && (
          <span>
            Win prob:{" "}
            <span className="text-[#00E5A0] font-mono tabular-nums font-bold">
              {Math.round(game.winProbability * 100)}%
            </span>
          </span>
        )}
        {game.keyMoment && (
          <span className="text-[#94A3B8] italic">&ldquo;{game.keyMoment}&rdquo;</span>
        )}
      </div>

      {/* Audio player */}
      {announcerEnabled && game.audioStorageId && (
        <AudioPlayer
          storageId={game.audioStorageId}
          autoPlay={announcerEnabled}
        />
      )}
    </div>
  );
}
