"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { TournamentToggle } from "../../components/TournamentToggle";
import { SimControls } from "../../components/SimControls";
import { StatsOverlay } from "../../components/StatsOverlay";
import { Bracket } from "../../components/Bracket";
import { Sidebar } from "../../components/Sidebar";
import type { Game, Team } from "../../lib/types";

const ZOOM_MIN = 0.4;
const ZOOM_MAX = 1.5;
const ZOOM_DEFAULT = 0.75;
const ZOOM_STEP = 0.1;

export default function Home() {
  const { isSignedIn } = useAuth();
  const [activeTournamentId, setActiveTournamentId] = useState<string | null>(null);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [announcerEnabled, setAnnouncerEnabled] = useState(false);
  const [zoom, setZoom] = useState(ZOOM_DEFAULT);

  const bracketScrollRef = useRef<HTMLDivElement>(null);

  const tournaments = useQuery(api.bracket.getTournaments, {});

  const effectiveTournamentId =
    activeTournamentId ?? tournaments?.[0]?._id ?? null;

  const bracketState = useQuery(
    api.bracket.getBracketState,
    effectiveTournamentId
      ? { tournamentId: effectiveTournamentId as Id<"tournaments"> }
      : "skip"
  );

  const upsets = useQuery(
    api.bracket.getUpsets,
    effectiveTournamentId
      ? { tournamentId: effectiveTournamentId as Id<"tournaments"> }
      : "skip"
  );

  const isLoading = !tournaments || (effectiveTournamentId && !bracketState);

  const selectedGame: Game | null =
    selectedGameId && bracketState?.games
      ? (bracketState.games.find((g: Game) => g._id === selectedGameId) ?? null)
      : null;

  // Zoom with Ctrl + mouse wheel
  useEffect(() => {
    const el = bracketScrollRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      setZoom((z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round((z + delta) * 10) / 10)));
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  const handleSelectGame = useCallback((gameId: string) => {
    setSelectedGameId(gameId);
    setSelectedTeam(null);
  }, []);

  const handleTeamClick = useCallback((team: Team) => {
    setSelectedTeam(team);
    setSelectedGameId(null);
  }, []);

  const handleSidebarClose = useCallback(() => {
    setSelectedGameId(null);
    setSelectedTeam(null);
  }, []);

  const handleFitZoom = useCallback(() => {
    setZoom(ZOOM_DEFAULT);
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0E17]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-4 border-[#00E5A0] border-t-transparent animate-spin" />
          <p className="text-[#94A3B8] text-sm font-medium uppercase tracking-widest">Loading bracket…</p>
        </div>
      </div>
    );
  }

  if (!tournaments || tournaments.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0E17]">
        <div className="text-center">
          <div className="text-5xl mb-4">🏀</div>
          <h1 className="text-2xl font-extrabold uppercase tracking-tight text-white mb-2">No Tournaments Found</h1>
          <p className="text-[#94A3B8] text-sm">
            Run the seed script to initialize the tournament data.
          </p>
        </div>
      </div>
    );
  }

  const { tournament, teams, games } = bracketState ?? {};

  return (
    <div className="flex h-screen bg-[#0A0E17] text-[#F8FAFC] overflow-hidden">
      {/* ── Main area ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="shrink-0 z-30 border-b border-white/5 bg-[#0A0E17]/90 backdrop-blur-sm">
          <div className="flex items-center justify-between px-6 py-3">
            <a href="/" className="flex items-center gap-3">
              <span className="text-2xl">🏀</span>
              <div>
                <h1 className="text-xl font-extrabold uppercase tracking-tight text-white leading-none">
                  Agent<span className="text-[#00E5A0]">Madness</span>
                </h1>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
                  AI Tournament Simulator
                </p>
              </div>
            </a>

            {tournaments && tournaments.length > 1 && (
              <TournamentToggle
                tournaments={tournaments}
                activeTournamentId={effectiveTournamentId ?? ""}
                onSelect={setActiveTournamentId}
              />
            )}

            <div className="flex items-center gap-4">
              <a href="/leaderboard" className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] hover:text-white transition-colors">
                Leaderboard
              </a>
              {!isSignedIn ? (
                <SignInButton mode="modal">
                  <button className="rounded-lg bg-[#00E5A0] px-4 py-2 text-sm font-bold uppercase tracking-wide text-[#0A0E17] hover:bg-[#00C890] transition-colors">
                    Sign in to Simulate
                  </button>
                </SignInButton>
              ) : (
                <UserButton />
              )}
            </div>
          </div>
        </header>

        {/* Champion banner */}
        {tournament?.champion && (
          <div className="shrink-0 z-20 px-4 py-2">
            <div className="rounded-xl bg-[#FFB800]/10 border border-[#FFB800]/30 px-4 py-2 text-center text-sm font-bold uppercase tracking-wide text-[#FFB800]">
              🏆 Tournament Complete! Champion:{" "}
              {teams?.find((t) => t._id === tournament.champion)?.name ?? "Unknown"}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="shrink-0 px-4 py-2 flex flex-col gap-2">
          {tournament && effectiveTournamentId && (
            <SimControls
              tournament={tournament}
              tournamentId={effectiveTournamentId}
              announcerEnabled={announcerEnabled}
              onAnnouncerToggle={setAnnouncerEnabled}
              upsetCount={tournament.upsetCount}
            />
          )}

          {tournament && teams && upsets !== undefined && (
            <StatsOverlay
              tournament={tournament}
              teams={teams}
              upsets={upsets as Game[]}
            />
          )}
        </div>

        {/* Bracket scroll area */}
        <div
          ref={bracketScrollRef}
          className="flex-1 overflow-auto relative"
        >
          {tournament && teams && games && (
            <div
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "top center",
                // Ensure the transformed div takes up real space so scroll works
                // by manually computing the scaled dimensions
                width: `${100 / zoom}%`,
                minHeight: `${100 / zoom}%`,
              }}
            >
              <Bracket
                tournament={tournament}
                teams={teams}
                games={games}
                onSelectGame={handleSelectGame}
                onTeamClick={handleTeamClick}
                selectedGameId={selectedGameId ?? undefined}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Sidebar ── */}
      {teams && (
        <Sidebar
          selectedGame={selectedGame}
          selectedTeam={selectedTeam}
          teams={teams}
          onClose={handleSidebarClose}
          announcerEnabled={announcerEnabled}
        />
      )}

      {/* ── Zoom controls (floating, above sidebar) ── */}
      <div
        className="fixed bottom-4 z-20 flex items-center gap-1 rounded-xl border border-white/10 bg-[#111827]/90 backdrop-blur-md px-2 py-1.5 shadow-xl"
        style={{ right: 365 }}
      >
        <button
          onClick={() => setZoom((z) => Math.min(ZOOM_MAX, Math.round((z + ZOOM_STEP) * 10) / 10))}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#94A3B8] hover:bg-white/10 hover:text-white transition-colors text-sm font-bold"
          title="Zoom in"
        >
          +
        </button>
        <span className="text-[11px] font-mono tabular-nums text-[#94A3B8] min-w-[36px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((z) => Math.max(ZOOM_MIN, Math.round((z - ZOOM_STEP) * 10) / 10))}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#94A3B8] hover:bg-white/10 hover:text-white transition-colors text-sm font-bold"
          title="Zoom out"
        >
          −
        </button>
        <div className="w-px h-4 bg-white/10 mx-1" />
        <button
          onClick={handleFitZoom}
          className="rounded-lg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8] hover:bg-white/10 hover:text-white transition-colors"
          title="Reset zoom"
        >
          Fit
        </button>
      </div>
    </div>
  );
}
