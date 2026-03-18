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
  imageStorageId?: Id<"_storage">;
  games: RecapGame[];
  accuracy: number;
  totalGames: number;
  correctPicks: number;
  biggestSurprise?: string;
  createdAt: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(ts: number): string {
  const diffMs = Date.now() - ts;
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffH < 1) return "Just now";
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  return diffD === 1 ? "1d ago" : `${diffD}d ago`;
}

function accuracyColor(pct: number): string {
  if (pct >= 70) return "text-[#00E5A0]";
  if (pct >= 50) return "text-[#FFB800]";
  return "text-[#FF3B5C]";
}

function accuracyBg(pct: number): string {
  if (pct >= 70) return "bg-[#00E5A0]/10 text-[#00E5A0] border-[#00E5A0]/20";
  if (pct >= 50) return "bg-[#FFB800]/10 text-[#FFB800] border-[#FFB800]/20";
  return "bg-[#FF3B5C]/10 text-[#FF3B5C] border-[#FF3B5C]/20";
}

// ─── Podcast Audio Player ─────────────────────────────────────────────────────

function PodcastPlayer({ storageId }: { storageId: Id<"_storage"> | undefined }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const url = useQuery(
    api.bracket.getAudioUrl,
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

  return (
    <div className="rounded-xl bg-black/20 border border-white/10 px-4 py-3">
      <audio
        ref={audioRef}
        onLoadedMetadata={(e) => setDuration((e.target as HTMLAudioElement).duration)}
        onTimeUpdate={(e) => setCurrentTime((e.target as HTMLAudioElement).currentTime)}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="flex items-center gap-3">
        {/* Play button */}
        <button
          onClick={togglePlay}
          disabled={!url && !!storageId}
          className="h-10 w-10 shrink-0 rounded-full bg-[#00E5A0] text-[#0A0E17] flex items-center justify-center text-base font-bold hover:bg-[#00c98e] transition-colors disabled:opacity-40"
          aria-label={isPlaying ? "Pause" : "Play podcast"}
        >
          {isPlaying ? "⏸" : "▶"}
        </button>

        {/* Label + progress */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1">
            🎙️ Daily Podcast
          </p>
          {storageId ? (
            <>
              <div
                className="h-1.5 rounded-full bg-white/10 overflow-hidden cursor-pointer"
                onClick={handleSeek}
                role="slider"
                aria-label="Seek audio"
              >
                <div
                  className="h-full bg-[#00E5A0] transition-all duration-100"
                  style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : "0%" }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-white/30 font-mono tabular-nums mt-0.5">
                <span>{formatTime(currentTime)}</span>
                <span>{duration > 0 ? formatTime(duration) : "--:--"}</span>
              </div>
            </>
          ) : (
            <p className="text-xs text-white/30 italic">Audio generating...</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Hero Image ───────────────────────────────────────────────────────────────

function HeroImage({ storageId }: { storageId: Id<"_storage"> | undefined }) {
  const url = useQuery(
    api.bracket.getAudioUrl,
    storageId ? { storageId } : "skip"
  );

  if (!storageId || !url) {
    return (
      <div className="w-full h-[200px] rounded-t-2xl bg-gradient-to-br from-[#00E5A0]/20 via-[#0A0E17] to-[#4B8DF8]/20 flex items-center justify-center">
        <span className="text-5xl opacity-30">🏀</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt="Daily recap hero"
      className="w-full h-[200px] object-cover rounded-t-2xl"
    />
  );
}

// ─── Game Row (for detail view) ───────────────────────────────────────────────

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
      <div className="shrink-0 text-xl">{game.weWereRight ? "✅" : "❌"}</div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">
          <span className="text-white/50">#{game.teamASeed}</span> {game.teamAName}
          <span className="mx-2 text-white/30">vs</span>
          <span className="text-white/50">#{game.teamBSeed}</span> {game.teamBName}
        </p>
        <p className="text-xs text-white/50 mt-0.5">
          <span className="font-medium text-white/70">{game.actualWinner}</span> def. {loser}
          {game.actualScoreWinner !== undefined && game.actualScoreLoser !== undefined && (
            <span className="ml-1 font-mono">
              {game.actualScoreWinner}–{game.actualScoreLoser}
            </span>
          )}
        </p>
      </div>

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

// ─── News Card ────────────────────────────────────────────────────────────────

function NewsCard({ recap }: { recap: DailyRecap }) {
  const [expanded, setExpanded] = useState(false);
  const accuracyPct = Math.round(recap.accuracy * 100);

  return (
    <article className="rounded-2xl border border-white/5 bg-[#1C2636] overflow-hidden">
      {/* Hero image */}
      <HeroImage storageId={recap.imageStorageId} />

      {/* Card body */}
      <div className="p-5 space-y-4">
        {/* Title + meta */}
        <div>
          <h2 className="text-lg font-extrabold uppercase tracking-tight text-white leading-tight">
            {recap.title}
          </h2>
          <p className="text-sm text-white/50 mt-1 leading-relaxed line-clamp-3">
            {recap.summary}
          </p>
        </div>

        {/* Podcast player */}
        <PodcastPlayer storageId={recap.audioStorageId} />

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-white/40">
          <span>{timeAgo(recap.createdAt)}</span>
          <span className="text-white/20">·</span>
          <span>{recap.totalGames} games</span>
          <span className="text-white/20">·</span>
          <span className={`font-bold ${accuracyColor(accuracyPct)}`}>
            {accuracyPct}% accuracy
          </span>
          {recap.games.filter((g) => g.isUpset).length > 0 && (
            <>
              <span className="text-white/20">·</span>
              <span className="text-[#FFB800] font-semibold">
                {recap.games.filter((g) => g.isUpset).length} upsets
              </span>
            </>
          )}
        </div>

        {/* Expand/collapse toggle */}
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="text-xs text-[#00E5A0] font-semibold hover:underline focus:outline-none"
        >
          {expanded ? "▲ Hide details" : "▼ Show game breakdown"}
        </button>

        {/* Expanded detail */}
        {expanded && (
          <div className="space-y-4 pt-2 border-t border-white/5">
            {/* Biggest surprise */}
            {recap.biggestSurprise && (
              <div className="rounded-xl bg-[#FFB800]/10 border border-[#FFB800]/20 px-4 py-3">
                <p className="text-[10px] text-[#FFB800] font-semibold uppercase tracking-wider mb-0.5">
                  Biggest Surprise
                </p>
                <p className="text-sm text-white/70">{recap.biggestSurprise}</p>
              </div>
            )}

            {/* Game by game */}
            {recap.games.length > 0 && (
              <div>
                <p className="text-[10px] text-[#00E5A0] font-semibold uppercase tracking-[0.2em] mb-3">
                  Game by Game
                </p>
                <div className="space-y-2">
                  {recap.games.map((game, i) => (
                    <GameRow key={i} game={game} />
                  ))}
                </div>
              </div>
            )}

            {/* Podcast script */}
            {recap.script && (
              <div>
                <p className="text-[10px] text-[#00E5A0] font-semibold uppercase tracking-[0.2em] mb-3">
                  Podcast Script
                </p>
                <p className="text-sm text-white/50 leading-relaxed whitespace-pre-line">
                  {recap.script}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

// ─── Prediction vs Reality Sidebar ───────────────────────────────────────────

function PredictionSidebar({ recaps }: { recaps: DailyRecap[] }) {
  // Flatten all games across recaps for a unified sidebar
  const allGames = recaps.flatMap((recap) =>
    recap.games.map((game) => ({ ...game, recapDate: recap.date }))
  );

  const overallCorrect = allGames.filter((g) => g.weWereRight).length;
  const overallTotal = allGames.length;
  const overallPct = overallTotal > 0 ? Math.round((overallCorrect / overallTotal) * 100) : 0;

  return (
    <aside className="space-y-4">
      {/* Accuracy tracker */}
      <div className="rounded-2xl border border-white/5 bg-[#111827] p-4">
        <p className="text-[10px] text-[#00E5A0] font-semibold uppercase tracking-[0.2em] mb-3">
          Accuracy Tracker
        </p>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/50">Overall</span>
            <span className={`text-sm font-bold font-mono ${accuracyColor(overallPct)}`}>
              {overallPct}%
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full bg-[#00E5A0] transition-all duration-500"
              style={{ width: `${overallPct}%` }}
            />
          </div>
          {overallTotal > 0 && (
            <p className="text-[10px] text-white/30 font-mono">
              {overallCorrect}/{overallTotal} correct picks
            </p>
          )}
        </div>

        {/* Per-day accuracy */}
        {recaps.length > 0 && (
          <div className="mt-3 space-y-1.5 border-t border-white/5 pt-3">
            {recaps.map((recap) => {
              const pct = Math.round(recap.accuracy * 100);
              return (
                <div key={recap._id} className="flex items-center justify-between">
                  <span className="text-[10px] text-white/40 font-mono truncate max-w-[110px]">
                    {recap.date}
                  </span>
                  <span className={`text-[10px] font-bold font-mono ${accuracyColor(pct)}`}>
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Prediction vs Reality */}
      {allGames.length > 0 && (
        <div className="rounded-2xl border border-white/5 bg-[#111827] p-4">
          <p className="text-[10px] text-[#00E5A0] font-semibold uppercase tracking-[0.2em] mb-3">
            Prediction vs Reality
          </p>
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {allGames.map((game, i) => {
              const calledUpset = game.isUpset && game.weWereRight;
              const missedUpset = game.isUpset && !game.weWereRight;
              return (
                <div
                  key={i}
                  className={`rounded-lg border px-3 py-2 ${
                    game.weWereRight
                      ? "border-[#00E5A0]/15 bg-[#00E5A0]/5"
                      : "border-[#FF3B5C]/15 bg-[#FF3B5C]/5"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-sm shrink-0 mt-0.5">
                      {game.weWereRight ? "✅" : "❌"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white leading-tight">
                        <span className="text-white/40">#{game.teamASeed}</span> {game.teamAName}
                      </p>
                      <p className="text-[10px] text-white/40">
                        vs <span className="text-white/40">#{game.teamBSeed}</span> {game.teamBName}
                      </p>
                      <p className="text-[10px] text-white/60 mt-0.5 font-medium">
                        {game.actualWinner} won
                      </p>
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        <span
                          className={`text-[9px] font-bold font-mono ${
                            game.weWereRight ? "text-[#00E5A0]" : "text-[#FF3B5C]"
                          }`}
                        >
                          {Math.round(game.ourPrediction * 100)}% → {game.weWereRight ? "✓" : "✗"}
                        </span>
                        {calledUpset && (
                          <span className="bg-[#FFB800] text-[#0A0E17] text-[8px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-full">
                            🔥 Called it!
                          </span>
                        )}
                        {missedUpset && (
                          <span className="bg-[#FF3B5C]/70 text-white text-[8px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-full">
                            Upset
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Link to predictions */}
      <div className="rounded-2xl border border-white/5 bg-[#111827] p-4">
        <p className="text-[10px] text-white/30 font-semibold uppercase tracking-[0.2em] mb-2">
          Methodology
        </p>
        <p className="text-xs text-white/40 mb-3 leading-relaxed">
          How do we make our predictions? See the full model breakdown.
        </p>
        <a href="/predictions" className="text-sm text-[#00E5A0] font-semibold hover:underline">
          View Predictions →
        </a>
      </div>
    </aside>
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

  const recaps = useQuery(api.bracket.getRecapsByGender, { gender }) as DailyRecap[] | undefined;
  const today = new Date().toISOString().split("T")[0];

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
            <a
              href="/simulator"
              className="text-sm bg-[#00E5A0] text-[#0A0E17] font-bold uppercase tracking-wider px-4 py-1.5 rounded hover:bg-[#00c98e] transition-colors"
            >
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
          <a
            href="/simulator"
            onClick={() => setMenuOpen(false)}
            className="bg-[#00E5A0] text-[#0A0E17] font-bold uppercase tracking-wider px-8 py-4 rounded-lg text-lg"
          >
            Launch →
          </a>
        </div>
      )}

      {/* ── Content ── */}
      <main className="max-w-6xl mx-auto px-4 md:px-6 pt-24 pb-20">

        {/* Header */}
        <div className="mb-6">
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
              onClick={() => setGender(g)}
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

        {/* Loading skeleton */}
        {recaps === undefined && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-72 rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
            <div className="space-y-4">
              <div className="h-40 rounded-2xl bg-white/5 animate-pulse" />
              <div className="h-64 rounded-2xl bg-white/5 animate-pulse" />
            </div>
          </div>
        )}

        {/* Empty state */}
        {recaps !== undefined && recaps.length === 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
              <p className="text-4xl mb-4">🏀</p>
              <h2 className="text-xl font-extrabold uppercase tracking-tight text-white mb-2">
                No Recaps Yet
              </h2>
              <p className="text-white/40 text-sm mb-6">
                Check back after games are played today, or generate a recap below.
              </p>
              <GenerateButton date={today} gender={gender} />
            </div>

            {/* Sidebar placeholder */}
            <aside className="space-y-4">
              <div className="rounded-2xl border border-white/5 bg-[#111827] p-4">
                <p className="text-[10px] text-[#00E5A0] font-semibold uppercase tracking-[0.2em] mb-3">
                  Accuracy Tracker
                </p>
                <p className="text-sm text-white/30 italic">No data yet</p>
              </div>
            </aside>
          </div>
        )}

        {/* Main feed + sidebar */}
        {recaps && recaps.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">

            {/* Left: ESPN card feed */}
            <div className="space-y-6">
              {/* Generate recap control */}
              <div className="rounded-2xl border border-white/5 bg-[#1C2636] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-[10px] text-[#00E5A0] font-semibold uppercase tracking-[0.2em] mb-1">
                    Generate Recap
                  </p>
                  <p className="text-xs text-white/40 leading-relaxed">
                    Fetch real results, write a podcast script with Claude, generate audio via ElevenLabs, and create a hero image with Gemini.
                  </p>
                </div>
                <div className="shrink-0">
                  <GenerateButton date={today} gender={gender} />
                </div>
              </div>

              {/* News cards */}
              {recaps.map((recap) => (
                <NewsCard key={recap._id} recap={recap} />
              ))}
            </div>

            {/* Right: sidebar */}
            <div className="lg:sticky lg:top-20 lg:self-start">
              <PredictionSidebar recaps={recaps} />
            </div>
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
