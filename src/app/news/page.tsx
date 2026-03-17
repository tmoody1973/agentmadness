"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useAction } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { SignInButton } from "@clerk/nextjs";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RecapGame {
  teamAName: string;
  teamASeed: number;
  teamBName: string;
  teamBSeed: number;
  ourPrediction: number;
  actualWinner: string;
  actualScoreWinner?: number;
  actualScoreLoser?: number;
  weWereRight: boolean;
  isUpset: boolean;
}

interface DailyRecap {
  _id: Id<"dailyRecaps">;
  date: string;
  gender: "men" | "women";
  title: string;
  summary: string;
  script: string;
  audioStorageId?: Id<"_storage">;
  games: RecapGame[];
  accuracy: number;
  totalGames: number;
  correctPicks: number;
  biggestSurprise?: string;
  createdAt: number;
}

// ─── Podcast Audio Player ─────────────────────────────────────────────────────

function PodcastPlayer({ storageId }: { storageId: Id<"_storage"> | undefined }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const url = useQuery(
    api.dailyRecapHelpers.getRecapAudioUrl,
    storageId ? { storageId } : "skip"
  );

  useEffect(() => {
    if (url && audioRef.current) {
      audioRef.current.src = url;
    }
  }, [url]);

  const togglePlay = () => {
    if (!audioRef.current || !url) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (audioRef.current.ended) audioRef.current.currentTime = 0;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = pct * duration;
  };

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (!storageId) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 px-4 py-3">
        <div className="h-10 w-10 shrink-0 rounded-full bg-white/10 flex items-center justify-center text-white/30 text-lg">
          ▶
        </div>
        <p className="text-sm text-white/30 italic">Audio generating...</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-4">
      <audio
        ref={audioRef}
        onLoadedMetadata={(e) => setDuration((e.target as HTMLAudioElement).duration)}
        onTimeUpdate={(e) => setCurrentTime((e.target as HTMLAudioElement).currentTime)}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="flex items-center gap-4 mb-3">
        <button
          onClick={togglePlay}
          disabled={!url}
          className="h-12 w-12 shrink-0 rounded-full bg-[#00E5A0] text-[#0A0E17] flex items-center justify-center text-lg font-bold hover:bg-[#00c98e] transition-colors disabled:opacity-40"
          aria-label={isPlaying ? "Pause" : "Play podcast"}
        >
          {isPlaying ? "⏸" : "▶"}
        </button>

        <div className="flex-1 min-w-0">
          <div
            className="h-2.5 rounded-full bg-white/10 overflow-hidden cursor-pointer mb-1.5"
            onClick={handleSeek}
            role="slider"
            aria-label="Seek audio"
          >
            <div
              className="h-full bg-[#00E5A0] transition-all duration-100"
              style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : "0%" }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-white/30 font-mono tabular-nums">
            <span>{formatTime(currentTime)}</span>
            <span>{duration > 0 ? formatTime(duration) : "--:--"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Game Row ─────────────────────────────────────────────────────────────────

function GameRow({ game }: { game: RecapGame }) {
  const loser = game.actualWinner === game.teamAName ? game.teamBName : game.teamAName;
  const calledUpset = game.isUpset && game.weWereRight;

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center gap-2 rounded-xl border px-4 py-3 transition-colors ${
        game.weWereRight
          ? "border-[#00E5A0]/20 bg-[#00E5A0]/5"
          : "border-[#FF3B5C]/20 bg-[#FF3B5C]/5"
      }`}
    >
      {/* Result icon */}
      <div className="shrink-0 text-xl">
        {game.weWereRight ? "✅" : "❌"}
      </div>

      {/* Game info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">
          <span className="text-white/50">#{game.teamASeed}</span> {game.teamAName}
          <span className="mx-2 text-white/30">vs</span>
          <span className="text-white/50">#{game.teamBSeed}</span> {game.teamBName}
        </p>
        <p className="text-xs text-white/50 mt-0.5">
          <span className="font-medium text-white/70">{game.actualWinner}</span> def.{" "}
          {loser}
          {game.actualScoreWinner !== undefined && game.actualScoreLoser !== undefined && (
            <span className="ml-1 font-mono">
              {game.actualScoreWinner}–{game.actualScoreLoser}
            </span>
          )}
        </p>
      </div>

      {/* Our prediction */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="text-right">
          <p className="text-[10px] text-white/30 uppercase tracking-wider">Our call</p>
          <p className={`text-xs font-mono font-bold ${game.weWereRight ? "text-[#00E5A0]" : "text-[#FF3B5C]"}`}>
            {Math.round(game.ourPrediction * 100)}% → {game.weWereRight ? "CORRECT" : "WRONG"}
          </p>
        </div>
        {calledUpset && (
          <span className="bg-[#FFB800] text-[#0A0E17] text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full">
            Called it!
          </span>
        )}
        {game.isUpset && !calledUpset && (
          <span className="bg-[#FF3B5C]/80 text-white text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full">
            Upset
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Recap Card ───────────────────────────────────────────────────────────────

function RecapCard({ recap, isActive, onClick }: {
  recap: DailyRecap;
  isActive: boolean;
  onClick: () => void;
}) {
  const accuracyPct = Math.round(recap.accuracy * 100);
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-xl border px-4 py-3 transition-all w-full ${
        isActive
          ? "border-[#00E5A0]/50 bg-[#00E5A0]/10"
          : "border-white/10 bg-white/5 hover:border-white/20"
      }`}
    >
      <p className="text-xs text-white/40 font-mono">{recap.date}</p>
      <p className="text-sm font-semibold text-white mt-0.5 line-clamp-1">{recap.title}</p>
      <p className="text-xs text-[#00E5A0] font-bold mt-1">{accuracyPct}% correct</p>
    </button>
  );
}

// ─── Generate Button ──────────────────────────────────────────────────────────

function GenerateButton({ date, gender }: { date: string; gender: "men" | "women" }) {
  const { isSignedIn } = useAuth();
  const generateRecap = useAction(api.dailyRecap.generateDailyRecap);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await generateRecap({ date, gender });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate recap");
    } finally {
      setLoading(false);
    }
  };

  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <button className="text-sm border border-white/15 text-white/50 hover:text-white hover:border-white/30 font-semibold uppercase tracking-wider px-5 py-2.5 rounded-lg transition-colors">
          Sign In to Generate Recap
        </button>
      </SignInButton>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="text-sm bg-[#00E5A0] text-[#0A0E17] font-extrabold uppercase tracking-wider px-5 py-2.5 rounded-lg hover:bg-[#00c98e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Generating..." : `Generate ${date} Recap`}
      </button>
      {error && <p className="text-xs text-[#FF3B5C]">{error}</p>}
      {success && <p className="text-xs text-[#00E5A0]">Recap generated successfully!</p>}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NewsPage() {
  const [gender, setGender] = useState<"men" | "women">("men");
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedRecapId, setSelectedRecapId] = useState<Id<"dailyRecaps"> | null>(null);

  const recaps = useQuery(api.dailyRecapHelpers.getRecapsByGender, { gender }) as DailyRecap[] | undefined;

  // Auto-select the latest recap
  const activeRecap = recaps
    ? (selectedRecapId
        ? recaps.find((r) => r._id === selectedRecapId) ?? recaps[0]
        : recaps[0])
    : null;

  const today = new Date().toISOString().split("T")[0];
  const upsets = activeRecap?.games.filter((g) => g.isUpset).length ?? 0;

  return (
    <div className="min-h-screen bg-[#0A0E17] text-[#F8FAFC]">
      {/* ── Nav ── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0A0E17]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <a href="/" className="text-[#00E5A0] font-extrabold text-lg tracking-tight uppercase">
            AgentMadness
          </a>

          <nav className="hidden md:flex items-center gap-6">
            {[
              { href: "/simulator", label: "Simulator" },
              { href: "/news", label: "News" },
              { href: "/leaderboard", label: "Leaderboard" },
              { href: "/predictions", label: "Predictions" },
              { href: "/learn", label: "Learn" },
            ].map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className={`text-sm uppercase tracking-wider font-semibold transition-colors ${
                  href === "/news" ? "text-[#00E5A0]" : "text-white/60 hover:text-white"
                }`}
              >
                {label}
              </a>
            ))}
            <a href="/simulator" className="text-sm bg-[#00E5A0] text-[#0A0E17] font-bold uppercase tracking-wider px-4 py-1.5 rounded hover:bg-[#00c98e] transition-colors">
              Launch →
            </a>
          </nav>

          <button
            className="md:hidden flex items-center justify-center h-11 w-11 text-white text-2xl"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-[#0A0E17]/95 backdrop-blur-md flex flex-col items-center justify-center gap-8 md:hidden">
          <button
            className="absolute top-4 right-4 flex items-center justify-center h-11 w-11 text-white text-2xl"
            onClick={() => setMenuOpen(false)}
          >
            ✕
          </button>
          {[
            { href: "/simulator", label: "Simulator" },
            { href: "/news", label: "News" },
            { href: "/leaderboard", label: "Leaderboard" },
            { href: "/predictions", label: "Predictions" },
            { href: "/learn", label: "Learn" },
          ].map(({ href, label }) => (
            <a
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="text-2xl font-bold uppercase tracking-wider text-white"
            >
              {label}
            </a>
          ))}
          <a href="/simulator" onClick={() => setMenuOpen(false)} className="bg-[#00E5A0] text-[#0A0E17] font-bold uppercase tracking-wider px-8 py-4 rounded-lg text-lg">
            Launch →
          </a>
        </div>
      )}

      {/* ── Content ── */}
      <main className="max-w-6xl mx-auto px-4 md:px-6 pt-24 pb-20">

        {/* Header */}
        <div className="mb-8">
          <p className="text-[#00E5A0] text-xs font-semibold uppercase tracking-[0.25em] mb-2">
            /Daily Recap
          </p>
          <h1 className="text-3xl md:text-5xl font-extrabold uppercase tracking-tight text-white mb-2">
            AgentMadness<br />
            <span className="text-white/40">Daily</span>
          </h1>
          <p className="text-white/50 text-sm md:text-base max-w-xl">
            AI vs Reality — our simulation predictions compared against real tournament results, with an AI-generated podcast recap each day.
          </p>
        </div>

        {/* Gender toggle */}
        <div className="flex gap-2 mb-8">
          {(["men", "women"] as const).map((g) => (
            <button
              key={g}
              onClick={() => { setGender(g); setSelectedRecapId(null); }}
              className={`px-5 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors ${
                gender === g
                  ? "bg-[#00E5A0] text-[#0A0E17]"
                  : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
              }`}
            >
              {g === "men" ? "Men's" : "Women's"}
            </button>
          ))}
        </div>

        {/* No recaps empty state */}
        {recaps !== undefined && recaps.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center mb-8">
            <p className="text-4xl mb-4">🏀</p>
            <h2 className="text-xl font-extrabold uppercase tracking-tight text-white mb-2">
              No Recaps Yet
            </h2>
            <p className="text-white/40 text-sm mb-6">
              Check back after games are played today, or generate a recap below.
            </p>
            <GenerateButton date={today} gender={gender} />
          </div>
        )}

        {/* Main content when recaps exist */}
        {recaps && recaps.length > 0 && activeRecap && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
            {/* Left: active recap detail */}
            <div className="space-y-6">

              {/* Podcast player card */}
              <section className="rounded-2xl border border-white/10 bg-[#1C2636] p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="text-[10px] text-[#00E5A0] font-semibold uppercase tracking-[0.2em] mb-1">
                      Today's Podcast
                    </p>
                    <h2 className="text-lg md:text-xl font-extrabold text-white uppercase tracking-tight leading-tight">
                      {activeRecap.title}
                    </h2>
                    <p className="text-xs text-white/40 mt-1 font-mono">{activeRecap.date}</p>
                  </div>
                  <span className="shrink-0 text-3xl">🎙️</span>
                </div>

                <PodcastPlayer storageId={activeRecap.audioStorageId} />

                {activeRecap.summary && (
                  <p className="text-sm text-white/50 mt-4 leading-relaxed">
                    {activeRecap.summary}
                  </p>
                )}

                {activeRecap.biggestSurprise && (
                  <div className="mt-4 rounded-xl bg-[#FFB800]/10 border border-[#FFB800]/20 px-4 py-3">
                    <p className="text-[10px] text-[#FFB800] font-semibold uppercase tracking-wider mb-0.5">
                      Biggest Surprise
                    </p>
                    <p className="text-sm text-white/70">{activeRecap.biggestSurprise}</p>
                  </div>
                )}
              </section>

              {/* Accuracy stats */}
              <section className="rounded-2xl border border-white/10 bg-[#1C2636] p-6">
                <p className="text-[10px] text-[#00E5A0] font-semibold uppercase tracking-[0.2em] mb-4">
                  Our Accuracy Today
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      value: `${Math.round(activeRecap.accuracy * 100)}%`,
                      label: "Right",
                      color: "#00E5A0",
                    },
                    {
                      value: `${activeRecap.correctPicks}/${activeRecap.totalGames}`,
                      label: "Games",
                      color: "#FFB800",
                    },
                    {
                      value: String(upsets),
                      label: "Upsets",
                      color: "#FF3B5C",
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-xl bg-white/5 border border-white/10 px-3 py-4 text-center"
                    >
                      <p
                        className="text-2xl md:text-3xl font-extrabold font-mono"
                        style={{ color: stat.color }}
                      >
                        {stat.value}
                      </p>
                      <p className="text-[9px] text-white/30 uppercase tracking-[0.2em] mt-1">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Game-by-game */}
              {activeRecap.games.length > 0 && (
                <section className="rounded-2xl border border-white/10 bg-[#1C2636] p-6">
                  <p className="text-[10px] text-[#00E5A0] font-semibold uppercase tracking-[0.2em] mb-4">
                    Game by Game
                  </p>
                  <div className="space-y-2">
                    {activeRecap.games.map((game, i) => (
                      <GameRow key={i} game={game} />
                    ))}
                  </div>
                </section>
              )}

              {/* Script */}
              {activeRecap.script && (
                <section className="rounded-2xl border border-white/10 bg-[#1C2636] p-6">
                  <p className="text-[10px] text-[#00E5A0] font-semibold uppercase tracking-[0.2em] mb-4">
                    Podcast Script
                  </p>
                  <p className="text-sm text-white/50 leading-relaxed whitespace-pre-line">
                    {activeRecap.script}
                  </p>
                </section>
              )}
            </div>

            {/* Right: previous days + generate */}
            <div className="space-y-6 lg:sticky lg:top-20 lg:self-start">
              {/* Generate recap */}
              <div className="rounded-2xl border border-white/10 bg-[#1C2636] p-5">
                <p className="text-[10px] text-[#00E5A0] font-semibold uppercase tracking-[0.2em] mb-3">
                  Generate Recap
                </p>
                <p className="text-xs text-white/40 mb-4 leading-relaxed">
                  Fetch real results via Perplexity, write a podcast script with Claude, and generate audio with ElevenLabs.
                </p>
                <GenerateButton date={today} gender={gender} />
              </div>

              {/* Previous days */}
              <div className="rounded-2xl border border-white/10 bg-[#1C2636] p-5">
                <p className="text-[10px] text-[#00E5A0] font-semibold uppercase tracking-[0.2em] mb-3">
                  Previous Days
                </p>
                <div className="space-y-2">
                  {recaps.map((recap) => (
                    <RecapCard
                      key={recap._id}
                      recap={recap}
                      isActive={activeRecap._id === recap._id}
                      onClick={() => setSelectedRecapId(recap._id)}
                    />
                  ))}
                </div>
              </div>

              {/* Link to predictions */}
              <div className="rounded-2xl border border-white/10 bg-[#1C2636] p-5">
                <p className="text-[10px] text-white/30 font-semibold uppercase tracking-[0.2em] mb-2">
                  Methodology
                </p>
                <p className="text-xs text-white/40 mb-3 leading-relaxed">
                  Curious how we make our predictions? See the full model breakdown.
                </p>
                <a
                  href="/predictions"
                  className="text-sm text-[#00E5A0] font-semibold hover:underline"
                >
                  View Predictions →
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {recaps === undefined && (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-40 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-10 px-4 md:px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-[#00E5A0] font-extrabold uppercase tracking-tight">
            AgentMadness
          </span>
          <div className="flex items-center gap-6 text-sm text-white/30">
            <a href="/simulator" className="hover:text-white/60 transition-colors">Simulator</a>
            <a href="/news" className="hover:text-white/60 transition-colors">News</a>
            <a href="/predictions" className="hover:text-white/60 transition-colors">Predictions</a>
            <a href="/leaderboard" className="hover:text-white/60 transition-colors">Leaderboard</a>
            <a href="/learn" className="hover:text-white/60 transition-colors">Learn</a>
          </div>
          <p className="text-xs text-white/20">Built with Claude AI · March 2026</p>
        </div>
      </footer>
    </div>
  );
}
