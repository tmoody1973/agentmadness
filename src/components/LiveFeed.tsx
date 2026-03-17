"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { Game, Team } from "../lib/types";
import { getTeamById } from "../lib/utils";
import { ROUND_LABELS } from "../lib/types";
import { TeamLogo } from "./TeamLogo";

interface LiveFeedProps {
  games: Game[];
  teams: Team[];
  onSelectGame?: (gameId: string) => void;
}

interface FeedItem {
  id: string;
  game: Game;
  teamA: Team | undefined;
  teamB: Team | undefined;
  winner: Team | undefined;
  loser: Team | undefined;
  type: "completed" | "upset" | "simulating";
  timestamp: number;
}

export function LiveFeed({ games, teams, onSelectGame }: LiveFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const prevGamesRef = useRef<Map<string, string>>(new Map());
  const initializedRef = useRef(false);

  // Seed with already-completed games on first render
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const existingItems: FeedItem[] = [];
    for (const game of games) {
      if (game.status === "completed") {
        const winner = getTeamById(teams, game.winnerId);
        const loserId = game.teamAId === game.winnerId ? game.teamBId : game.teamAId;
        const loser = getTeamById(teams, loserId);
        existingItems.push({
          id: `${game._id}-done`,
          game,
          teamA: getTeamById(teams, game.teamAId),
          teamB: getTeamById(teams, game.teamBId),
          winner,
          loser,
          type: game.isUpset ? "upset" : "completed",
          timestamp: game._creationTime ?? Date.now(),
        });
        prevGamesRef.current.set(game._id, "completed");
      } else {
        prevGamesRef.current.set(game._id, game.status);
      }
    }

    if (existingItems.length > 0) {
      existingItems.sort((a, b) => a.game.gameOrder - b.game.gameOrder);
      setFeedItems(existingItems.slice(-20));
    }
  }, [games, teams]);

  // Detect game status changes for live updates
  useEffect(() => {
    if (!initializedRef.current) return;
    const prevStatuses = prevGamesRef.current;
    const newItems: FeedItem[] = [];

    for (const game of games) {
      const prevStatus = prevStatuses.get(game._id);

      // New simulating game
      if (game.status === "simulating" && prevStatus !== "simulating") {
        newItems.push({
          id: `${game._id}-sim`,
          game,
          teamA: getTeamById(teams, game.teamAId),
          teamB: getTeamById(teams, game.teamBId),
          winner: undefined,
          loser: undefined,
          type: "simulating",
          timestamp: Date.now(),
        });
      }

      // Newly completed game
      if (game.status === "completed" && prevStatus !== "completed") {
        const winner = getTeamById(teams, game.winnerId);
        const loserId = game.teamAId === game.winnerId ? game.teamBId : game.teamAId;
        const loser = getTeamById(teams, loserId);

        newItems.push({
          id: `${game._id}-done`,
          game,
          teamA: getTeamById(teams, game.teamAId),
          teamB: getTeamById(teams, game.teamBId),
          winner,
          loser,
          type: game.isUpset ? "upset" : "completed",
          timestamp: Date.now(),
        });
      }

      prevStatuses.set(game._id, game.status);
    }

    if (newItems.length > 0) {
      setFeedItems((prev) => {
        // Remove simulating items that are now completed
        const completedIds = new Set(
          newItems.filter((i) => i.type !== "simulating").map((i) => i.game._id)
        );
        const filtered = prev.filter(
          (i) => !(i.type === "simulating" && completedIds.has(i.game._id))
        );
        return [...filtered, ...newItems].slice(-50); // Keep last 50
      });
    }

    prevGamesRef.current = prevStatuses;
  }, [games, teams]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [feedItems]);

  if (feedItems.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-xs text-white/20 uppercase tracking-wider">
        Waiting for simulation...
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="flex flex-col gap-1 overflow-y-auto max-h-[200px] px-2 py-1 scrollbar-thin"
    >
      <AnimatePresence initial={false}>
        {feedItems.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20, height: 0 }}
            animate={{ opacity: 1, x: 0, height: "auto" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`rounded-lg px-3 py-2 cursor-pointer hover:bg-white/5 transition-colors ${
              item.type === "upset"
                ? "bg-[#F44771]/10 border border-[#F44771]/20"
                : item.type === "simulating"
                  ? "bg-[#FF8C00]/5 border border-[#FF8C00]/15"
                  : "bg-white/[0.02] border border-white/5"
            }`}
            onClick={() => onSelectGame?.(item.game._id)}
          >
            {item.type === "simulating" ? (
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[#FF8C00] animate-pulse" />
                <span className="text-[11px] text-[#FF8C00] font-medium">
                  Simulating
                </span>
                <span className="text-[11px] text-white/60">
                  {item.teamA?.name ?? "TBD"} vs {item.teamB?.name ?? "TBD"}
                </span>
                <span className="ml-auto text-[9px] text-white/20 uppercase tracking-wider">
                  {ROUND_LABELS[item.game.round as keyof typeof ROUND_LABELS] ?? item.game.round}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {/* Result icon */}
                <span className="text-sm shrink-0">
                  {item.type === "upset" ? "🔥" : "🏀"}
                </span>

                {/* Winner */}
                <div className="flex items-center gap-1 min-w-0">
                  {item.winner && <TeamLogo teamName={item.winner.name} size={16} />}
                  <span className="text-[11px] font-bold text-white truncate">
                    #{item.winner?.seed} {item.winner?.name}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-[#00E5A0] tabular-nums">
                    {item.game.winnerScore}
                  </span>
                </div>

                <span className="text-[10px] text-white/20 shrink-0">-</span>

                {/* Loser */}
                <div className="flex items-center gap-1 min-w-0">
                  {item.loser && <TeamLogo teamName={item.loser.name} size={16} />}
                  <span className="text-[11px] text-white/40 truncate">
                    #{item.loser?.seed} {item.loser?.name}
                  </span>
                  <span className="text-[11px] font-mono text-white/30 tabular-nums">
                    {item.game.loserScore}
                  </span>
                </div>

                {/* Round + upset badge */}
                <div className="ml-auto flex items-center gap-1.5 shrink-0">
                  {item.type === "upset" && (
                    <span className="text-[9px] font-bold text-[#F44771] uppercase tracking-wider">
                      UPSET
                    </span>
                  )}
                  <span className="text-[9px] text-white/20 uppercase tracking-wider">
                    {ROUND_LABELS[item.game.round as keyof typeof ROUND_LABELS] ?? item.game.round}
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
