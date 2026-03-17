"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { TournamentToggle } from "../../components/TournamentToggle";
import { SimControls } from "../../components/SimControls";
import { StatsOverlay } from "../../components/StatsOverlay";
import { Bracket } from "../../components/Bracket";
import { MobileBracket } from "../../components/MobileBracket";
import { Sidebar } from "../../components/Sidebar";
import { MobileBottomSheet } from "../../components/MobileBottomSheet";
import { LiveFeed } from "../../components/LiveFeed";
import { OnboardingModal } from "../../components/OnboardingModal";
import type { Game, Team } from "../../lib/types";

const ZOOM_MIN = 0.4;
const ZOOM_MAX = 1.5;
const ZOOM_DEFAULT = 0.75;
const ZOOM_STEP = 0.1;

// ─── SimSettings ──────────────────────────────────────────────────────────────

function SliderRow({
  label,
  description,
  value,
  onChange,
  lowLabel,
  highLabel,
}: {
  label: string;
  description: string;
  value: number;
  onChange: (v: number) => void;
  lowLabel: string;
  highLabel: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-white">{label}</span>
        <span className="text-xs font-mono text-[#00E5A0] tabular-nums">{value}</span>
      </div>
      <p className="text-[10px] text-white/40 mb-2">{description}</p>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full accent-[#00E5A0] h-1.5"
      />
      <div className="flex justify-between text-[9px] text-white/30 mt-0.5">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}

function SimSettings({ tournamentId }: { tournamentId: string }) {
  const updateParams = useMutation(api.userTournament.updateSimParams);
  const [chaos, setChaos] = useState(50);
  const [seedBias, setSeedBias] = useState(50);
  const [recency, setRecency] = useState(50);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await updateParams({
      tournamentId: tournamentId as Id<"tournaments">,
      simParams: { chaosLevel: chaos, homeCourtBoost: seedBias, recencyWeight: recency },
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#1C2636] p-4 mb-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-[#00E5A0] mb-4">
        Simulation Settings
      </h3>

      <div className="flex flex-col gap-4">
        <SliderRow
          label="Chaos Level"
          description="Higher = more upsets and wild outcomes"
          value={chaos}
          onChange={setChaos}
          lowLabel="Chalk"
          highLabel="Madness"
        />
        <SliderRow
          label="Seed Advantage"
          description="Higher = higher seeds win more often"
          value={seedBias}
          onChange={setSeedBias}
          lowLabel="Anyone's game"
          highLabel="Chalk city"
        />
        <SliderRow
          label="Recency Weight"
          description="Higher = late-season performance matters more"
          value={recency}
          onChange={setRecency}
          lowLabel="Full season"
          highLabel="Hot streaks"
        />
      </div>

      <button
        onClick={handleSave}
        className="mt-4 w-full rounded-lg bg-white/5 border border-white/10 py-2 text-xs font-semibold uppercase tracking-wider text-white/60 hover:bg-white/10 hover:text-white transition-colors"
      >
        {saved ? "Saved!" : "Save Settings"}
      </button>
    </div>
  );
}

// ─── CreateBracketCTA ─────────────────────────────────────────────────────────

function CreateBracketCTA({
  gender,
  onCreated,
}: {
  gender: "men" | "women";
  onCreated: () => void;
}) {
  const createMyTournament = useMutation(api.userTournament.createMyTournament);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    try {
      await createMyTournament({ gender });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create bracket");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="rounded-xl border border-[#00E5A0]/30 bg-[#00E5A0]/5 p-4 mb-4 text-center">
      <p className="text-xs text-white/60 mb-3">
        You&apos;re viewing the shared template bracket. Create your own copy to simulate independently.
      </p>
      {error && (
        <p className="text-xs text-red-400 mb-2">{error}</p>
      )}
      <button
        onClick={handleCreate}
        disabled={creating}
        className="rounded-lg bg-[#00E5A0] px-4 py-2 text-sm font-bold uppercase tracking-wide text-[#0A0E17] hover:bg-[#00C890] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {creating ? "Creating…" : "Create My Bracket"}
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const { isSignedIn } = useAuth();
  const [activeTournamentId, setActiveTournamentId] = useState<string | null>(null);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [announcerEnabled, setAnnouncerEnabled] = useState(true);
  const [zoom, setZoom] = useState(ZOOM_DEFAULT);
  const [activeGender, setActiveGender] = useState<"men" | "women">("men");

  const bracketScrollRef = useRef<HTMLDivElement>(null);

  const tournaments = useQuery(api.bracket.getTournaments, {});

  // Per-user tournament queries (only run when signed in)
  const myMenTournament = useQuery(
    api.userTournament.getMyTournament,
    isSignedIn ? { gender: "men" } : "skip"
  );
  const myWomenTournament = useQuery(
    api.userTournament.getMyTournament,
    isSignedIn ? { gender: "women" } : "skip"
  );

  // Determine the active user tournament for the current gender
  const myTournament = activeGender === "men" ? myMenTournament : myWomenTournament;
  const hasMyTournament = myTournament !== null && myTournament !== undefined;

  // Template tournament for the current gender (fallback / preview)
  const templateTournament = tournaments?.find(
    (t) => t.gender === activeGender && !t.userId
  );

  // Resolve the effective tournament: prefer user's own, fall back to template
  const resolvedTournamentId =
    activeTournamentId ??
    (isSignedIn && hasMyTournament ? myTournament?._id : templateTournament?._id) ??
    tournaments?.[0]?._id ??
    null;

  const effectiveTournamentId = resolvedTournamentId;

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

  // Whether the current bracket is the user's own (not read-only)
  const isMyBracket =
    isSignedIn && hasMyTournament && effectiveTournamentId === myTournament?._id;

  // Whether to show the "Create My Bracket" CTA
  const showCreateCTA = isSignedIn && !hasMyTournament;

  // Mobile bottom sheet is open when a game or team is selected
  const isMobileSheetOpen = !!(selectedGame || selectedTeam);

  // Sync activeGender when tournaments load by detecting which gender is active
  useEffect(() => {
    if (!tournaments || !effectiveTournamentId) return;
    const activeTournament = tournaments.find((t) => t._id === effectiveTournamentId);
    if (activeTournament) {
      setActiveGender(activeTournament.gender as "men" | "women");
    }
  }, [effectiveTournamentId, tournaments]);

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

  const handleTournamentCreated = useCallback(() => {
    // After creating, clear any manually selected tournament so the new one is auto-selected
    setActiveTournamentId(null);
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

  // Sidebar extra content (shared between desktop sidebar and mobile sheet)
  const sidebarExtraContent = (
    <>
      {showCreateCTA && (
        <CreateBracketCTA
          gender={activeGender}
          onCreated={handleTournamentCreated}
        />
      )}
      {isMyBracket && !selectedGame && !selectedTeam && (
        <SimSettings tournamentId={effectiveTournamentId!} />
      )}
    </>
  );

  return (
    <div className="flex h-screen bg-[#0A0E17] text-[#F8FAFC] overflow-hidden">
      <OnboardingModal />

      {/* ── Main area ── */}
      <div className="flex flex-1 flex-col min-w-0 lg:overflow-hidden">
        {/* Header */}
        <header className="shrink-0 z-30 border-b border-white/5 bg-[#0A0E17]/90 backdrop-blur-sm">
          {/* Top row: logo + sign in */}
          <div className="flex items-center justify-between px-3 md:px-6 py-2">
            <a href="/" className="flex items-center gap-2 shrink-0">
              <span className="text-xl">🏀</span>
              <h1 className="text-base md:text-xl font-extrabold uppercase tracking-tight text-white leading-none">
                Agent<span className="text-[#00E5A0]">Madness</span>
              </h1>
            </a>

            {/* Desktop: toggle + leaderboard + auth in one row */}
            <div className="hidden md:flex items-center gap-4">
              {tournaments && tournaments.length > 1 && (
                <TournamentToggle
                  tournaments={tournaments}
                  activeTournamentId={effectiveTournamentId ?? ""}
                  onSelect={setActiveTournamentId}
                />
              )}
              <a href="/leaderboard" className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] hover:text-white transition-colors">
                Leaderboard
              </a>
              {!isSignedIn ? (
                <SignInButton mode="modal">
                  <button className="rounded-lg bg-[#00E5A0] px-4 py-2 text-sm font-bold uppercase tracking-wide text-[#0A0E17] hover:bg-[#00C890] transition-colors">
                    Sign in
                  </button>
                </SignInButton>
              ) : (
                <UserButton />
              )}
            </div>

            {/* Mobile: just auth button */}
            <div className="flex md:hidden items-center gap-2">
              {!isSignedIn ? (
                <SignInButton mode="modal">
                  <button className="rounded-lg bg-[#00E5A0] px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-[#0A0E17] min-h-[36px]">
                    Sign in
                  </button>
                </SignInButton>
              ) : (
                <UserButton />
              )}
            </div>
          </div>

          {/* Mobile: toggle row below logo */}
          {tournaments && tournaments.length > 1 && (
            <div className="flex md:hidden items-center justify-between px-3 pb-2 gap-2">
              <TournamentToggle
                tournaments={tournaments}
                activeTournamentId={effectiveTournamentId ?? ""}
                onSelect={setActiveTournamentId}
              />
              <a href="/leaderboard" className="text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8] shrink-0">
                Board
              </a>
            </div>
          )}
        </header>

        {/* Champion banner */}
        {tournament?.champion && (
          <div className="shrink-0 z-20 px-3 md:px-4 py-2">
            <div className="rounded-xl bg-[#FFB800]/10 border border-[#FFB800]/30 px-4 py-2 text-center text-sm font-bold uppercase tracking-wide text-[#FFB800]">
              🏆 Tournament Complete! Champion:{" "}
              {teams?.find((t) => t._id === tournament.champion)?.name ?? "Unknown"}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="shrink-0 px-3 md:px-4 py-2 flex flex-col gap-2">
          {tournament && effectiveTournamentId && isMyBracket && (
            <SimControls
              tournament={tournament}
              tournamentId={effectiveTournamentId}
              announcerEnabled={announcerEnabled}
              onAnnouncerToggle={setAnnouncerEnabled}
              upsetCount={tournament.upsetCount}
            />
          )}

          {/* Read-only notice for unauthenticated users or when viewing template */}
          {(!isSignedIn || (!isMyBracket && !showCreateCTA)) && tournament && (
            <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-center text-xs text-white/50">
              {!isSignedIn
                ? "Sign in to simulate your own bracket"
                : "Viewing shared template bracket — read only"}
            </div>
          )}

          {tournament && teams && upsets !== undefined && (
            <StatsOverlay
              tournament={tournament}
              teams={teams}
              upsets={upsets as Game[]}
            />
          )}
        </div>

        {/* Live feed */}
        {games && teams && (tournament?.status === "simulating" || tournament?.status === "completed") && (
          <div className="shrink-0 border-b border-white/5 bg-[#0D1220]">
            <div className="flex items-center gap-2 px-4 pt-2 pb-1">
              <div className="h-2 w-2 rounded-full bg-[#FF8C00] animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#FF8C00]">
                Live Feed
              </span>
            </div>
            <LiveFeed
              games={games}
              teams={teams}
              onSelectGame={handleSelectGame}
            />
          </div>
        )}

        {/* Desktop bracket scroll area */}
        <div
          ref={bracketScrollRef}
          className="hidden lg:flex flex-1 overflow-auto relative"
        >
          {tournament && teams && games && (
            <div
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "top center",
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

        {/* Mobile bracket */}
        <div className="flex lg:hidden flex-1 min-h-0">
          {tournament && teams && games && (
            <MobileBracket
              tournament={tournament}
              teams={teams}
              games={games}
              onSelectGame={handleSelectGame}
              onTeamClick={handleTeamClick}
            />
          )}
        </div>
      </div>

      {/* ── Desktop Sidebar ── */}
      {teams && (
        <div className="hidden lg:block shrink-0">
          <Sidebar
            selectedGame={selectedGame}
            selectedTeam={selectedTeam}
            teams={teams}
            onClose={handleSidebarClose}
            announcerEnabled={announcerEnabled}
            extraContent={sidebarExtraContent}
          />
        </div>
      )}

      {/* ── Mobile Bottom Sheet ── */}
      {teams && (
        <MobileBottomSheet
          isOpen={isMobileSheetOpen}
          onClose={handleSidebarClose}
        >
          <Sidebar
            selectedGame={selectedGame}
            selectedTeam={selectedTeam}
            teams={teams}
            onClose={handleSidebarClose}
            announcerEnabled={announcerEnabled}
            extraContent={sidebarExtraContent}
            variant="sheet"
          />
        </MobileBottomSheet>
      )}

      {/* ── Zoom controls (floating, desktop only) ── */}
      <div
        className="hidden lg:flex fixed bottom-4 z-20 items-center gap-1 rounded-xl border border-white/10 bg-[#111827]/90 backdrop-blur-md px-2 py-1.5 shadow-xl"
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
