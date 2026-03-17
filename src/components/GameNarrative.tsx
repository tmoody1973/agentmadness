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
    <div className="rounded-2xl border border-white/10 bg-gray-900/95 backdrop-blur-md shadow-2xl px-5 py-4 flex flex-col gap-3">
      {/* Score line */}
      {winner && loser && (
        <div className="flex items-center gap-3 text-sm">
          <span className="font-bold text-white">
            #{winner.seed} {winner.name}{" "}
            <span className="text-green-400">{game.winnerScore}</span>
          </span>
          <span className="text-gray-500">vs</span>
          <span className="text-gray-400">
            #{loser.seed} {loser.name}{" "}
            <span className="text-gray-500">{game.loserScore}</span>
          </span>
          {game.isUpset && (
            <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
              🔥 UPSET
            </span>
          )}
        </div>
      )}

      {/* Narrative typewriter */}
      {game.gameNarrative && (
        <div className="text-sm text-gray-300 leading-relaxed min-h-[3em]">
          <TypeAnimation
            key={game._id}
            sequence={[game.gameNarrative]}
            speed={70}
            cursor={false}
          />
        </div>
      )}

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
        {game.mvp && (
          <span className="text-yellow-400">⭐ MVP: {game.mvp}</span>
        )}
        {game.winProbability !== undefined && (
          <span>
            Win prob:{" "}
            <span className="text-white">
              {Math.round(game.winProbability * 100)}%
            </span>
          </span>
        )}
        {game.keyMoment && (
          <span className="text-gray-400 italic">&ldquo;{game.keyMoment}&rdquo;</span>
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
