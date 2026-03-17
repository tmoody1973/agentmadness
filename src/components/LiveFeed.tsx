"use client";

import { useEffect, useRef, useState } from "react";
import type { Game, Team } from "../lib/types";
import { getTeamById } from "../lib/utils";
import { TeamLogo } from "./TeamLogo";
import {
  Marquee,
  MarqueeContent,
  MarqueeEdge,
  MarqueeItem,
} from "./ui/marquee";

interface LiveFeedProps {
  games: Game[];
  teams: Team[];
  onSelectGame?: (gameId: string) => void;
}

interface FeedItem {
  id: string;
  game: Game;
  winner: Team | undefined;
  loser: Team | undefined;
  type: "completed" | "upset" | "simulating";
}

export function LiveFeed({ games, teams, onSelectGame }: LiveFeedProps) {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const initializedRef = useRef(false);

  // Build feed from completed + simulating games
  useEffect(() => {
    const items: FeedItem[] = [];

    for (const game of games) {
      if (game.status === "completed") {
        const winner = getTeamById(teams, game.winnerId);
        const loserId = game.teamAId === game.winnerId ? game.teamBId : game.teamAId;
        const loser = getTeamById(teams, loserId);
        items.push({
          id: game._id,
          game,
          winner,
          loser,
          type: game.isUpset ? "upset" : "completed",
        });
      } else if (game.status === "simulating") {
        const teamA = getTeamById(teams, game.teamAId);
        const teamB = getTeamById(teams, game.teamBId);
        items.push({
          id: game._id,
          game,
          winner: teamA,
          loser: teamB,
          type: "simulating",
        });
      }
    }

    items.sort((a, b) => a.game.gameOrder - b.game.gameOrder);
    setFeedItems(items);
  }, [games, teams]);

  if (feedItems.length === 0) {
    return (
      <div className="flex items-center justify-center py-2 text-[10px] text-white/20 uppercase tracking-wider">
        No results yet
      </div>
    );
  }

  return (
    <Marquee pauseOnHover aria-label="Game results ticker">
      <MarqueeContent>
        {feedItems.map((item) => (
          <MarqueeItem key={item.id} asChild>
            <button
              onClick={() => onSelectGame?.(item.game._id)}
              className={`flex items-center gap-2 shrink-0 rounded-lg px-3 py-1.5 transition-colors cursor-pointer ${
                item.type === "upset"
                  ? "bg-[#F44771]/10 border border-[#F44771]/20"
                  : item.type === "simulating"
                    ? "bg-[#FF8C00]/5 border border-[#FF8C00]/15"
                    : "bg-white/[0.03] border border-white/5"
              }`}
            >
              {item.type === "simulating" ? (
                <>
                  <div className="h-1.5 w-1.5 rounded-full bg-[#FF8C00] animate-pulse" />
                  <span className="text-[11px] text-[#FF8C00] font-medium whitespace-nowrap">
                    {item.winner?.name} vs {item.loser?.name}
                  </span>
                </>
              ) : (
                <>
                  {item.type === "upset" && <span className="text-[10px]">🔥</span>}
                  <TeamLogo teamName={item.winner?.name ?? ""} size={14} />
                  <span className="text-[11px] font-bold text-white whitespace-nowrap">
                    {item.winner?.name}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-[#00E5A0] tabular-nums">
                    {item.game.winnerScore}
                  </span>
                  <span className="text-[10px] text-white/15">-</span>
                  <span className="text-[11px] text-white/30 whitespace-nowrap">
                    {item.loser?.name}
                  </span>
                  <span className="text-[11px] font-mono text-white/20 tabular-nums">
                    {item.game.loserScore}
                  </span>
                </>
              )}
            </button>
          </MarqueeItem>
        ))}
      </MarqueeContent>
      <MarqueeEdge side="left" />
      <MarqueeEdge side="right" />
    </Marquee>
  );
}
