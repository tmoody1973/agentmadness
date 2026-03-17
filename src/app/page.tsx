"use client";

import { useState } from "react";

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0A0E17] text-[#F8FAFC] scroll-smooth">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0A0E17]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <a href="/" className="text-[#00E5A0] font-extrabold text-lg tracking-tight uppercase">
            AgentMadness
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="/simulator" className="text-sm text-white/60 hover:text-white uppercase tracking-wider font-semibold transition-colors">
              Simulator
            </a>
            <a href="/leaderboard" className="text-sm text-white/60 hover:text-white uppercase tracking-wider font-semibold transition-colors">
              Leaderboard
            </a>
            <a href="/predictions" className="text-sm text-white/60 hover:text-white uppercase tracking-wider font-semibold transition-colors">
              Predictions
            </a>
            <a href="/learn" className="text-sm text-white/60 hover:text-white uppercase tracking-wider font-semibold transition-colors">
              Learn
            </a>
            <a href="#about" className="text-sm text-white/60 hover:text-white uppercase tracking-wider font-semibold transition-colors">
              About
            </a>
            <a href="/simulator" className="text-sm bg-[#00E5A0] text-[#0A0E17] font-bold uppercase tracking-wider px-4 py-1.5 rounded hover:bg-[#00c98e] transition-colors">
              Launch →
            </a>
          </nav>

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex items-center justify-center h-11 w-11 text-white text-2xl"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </header>

      {/* Mobile full-screen menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-[#0A0E17]/95 backdrop-blur-md flex flex-col items-center justify-center gap-8 md:hidden">
          <button
            className="absolute top-4 right-4 flex items-center justify-center h-11 w-11 text-white text-2xl"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
          <a
            href="/simulator"
            onClick={() => setMenuOpen(false)}
            className="text-2xl font-bold uppercase tracking-wider text-white"
          >
            Simulator
          </a>
          <a
            href="/leaderboard"
            onClick={() => setMenuOpen(false)}
            className="text-2xl font-bold uppercase tracking-wider text-white"
          >
            Leaderboard
          </a>
          <a
            href="/predictions"
            onClick={() => setMenuOpen(false)}
            className="text-2xl font-bold uppercase tracking-wider text-white"
          >
            Predictions
          </a>
          <a
            href="/learn"
            onClick={() => setMenuOpen(false)}
            className="text-2xl font-bold uppercase tracking-wider text-white"
          >
            Learn
          </a>
          <a
            href="#about"
            onClick={() => setMenuOpen(false)}
            className="text-2xl font-bold uppercase tracking-wider text-white"
          >
            About
          </a>
          <a
            href="/simulator"
            onClick={() => setMenuOpen(false)}
            className="bg-[#00E5A0] text-[#0A0E17] font-bold uppercase tracking-wider px-8 py-4 rounded-lg text-lg"
          >
            Launch →
          </a>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          HERO — full-bleed image with overlay
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[90vh] flex items-end overflow-hidden">
        {/* Background image */}
        <img
          src="/images/bailey-burton-o5UlVmTwVz8-unsplash.jpg"
          alt="NCAA basketball on court"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E17] via-[#0A0E17]/70 to-[#0A0E17]/30" />
        {/* Teal accent glow */}
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#00E5A0]/10 rounded-full blur-[120px]" />

        <div className="relative max-w-6xl mx-auto px-4 md:px-6 pb-16 pt-32 w-full">
          <p className="text-[#00E5A0] text-xs font-semibold uppercase tracking-[0.25em] mb-4">
            🏀 AI-Powered Tournament Simulator
          </p>

          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-9xl font-extrabold uppercase tracking-tighter text-white leading-[0.85] mb-6">
            Agent<br />
            <span className="text-[#00E5A0]">Madness</span>
          </h1>

          <p className="text-lg md:text-xl lg:text-2xl text-white/70 max-w-xl mb-10 leading-relaxed font-light">
            68 teams become AI agents. Claude simulates every game.
            ElevenLabs calls every upset. The bracket fills in real time.
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-12">
            <a
              href="/simulator"
              className="inline-flex items-center justify-center gap-2 bg-[#00E5A0] text-[#0A0E17] font-extrabold uppercase tracking-wider px-8 py-4 rounded-lg text-base hover:bg-[#00c98e] transition-all hover:scale-105"
            >
              Launch Simulator →
            </a>
            <a
              href="/leaderboard"
              className="inline-flex items-center justify-center gap-2 border-2 border-white/20 text-white font-bold uppercase tracking-wider px-8 py-4 rounded-lg text-base hover:border-white/40 hover:bg-white/5 transition-all"
            >
              View Leaderboard
            </a>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap gap-6">
            {[
              { value: "136", label: "Teams" },
              { value: "134", label: "Games" },
              { value: "$0.22", label: "Per Run" },
              { value: "40+", label: "Years of Data" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl md:text-3xl lg:text-4xl font-mono font-extrabold text-[#00E5A0]">
                  {stat.value}
                </p>
                <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] mt-0.5">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          HOW IT WORKS — 3 cards with accent image
          ═══════════════════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-16 md:py-24 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-[#00E5A0] text-xs font-semibold uppercase tracking-[0.25em] mb-3">
            /How It Works
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold uppercase tracking-tight text-white mb-4">
            Three Layers.<br />
            <span className="text-white/40">One Tournament.</span>
          </h2>
          <p className="text-white/50 text-base md:text-lg max-w-2xl mb-10 md:mb-14">
            Each team is a data profile. Each game is a Claude API call.
            The bracket is a tree. The agents are the leaves. Claude is the wind.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                number: "01",
                title: "Team Agents",
                color: "#00E5A0",
                description:
                  "Each team carries its full identity: KenPom efficiency ratings, key players, play style, volatility score, and Perplexity-enriched scouting reports. No two agents are alike.",
              },
              {
                number: "02",
                title: "Referee Engine",
                color: "#FFB800",
                description:
                  "Claude analyzes both team profiles, applies our data-driven upset algorithm, and simulates a realistic game — scores, MVP, key moment, and a broadcast-quality narrative.",
              },
              {
                number: "03",
                title: "Live Bracket",
                color: "#FF3B5C",
                description:
                  "Results push to every connected client in real time via Convex. The bracket animates. Upsets shake the screen. ElevenLabs v3 reads every result like a sports announcer.",
              },
            ].map((step) => (
              <div
                key={step.number}
                className="group bg-[#1C2636] border border-white/5 rounded-2xl p-6 md:p-8 hover:border-white/15 transition-all duration-300"
              >
                <div
                  className="text-4xl md:text-5xl font-mono font-extrabold mb-6 opacity-30 group-hover:opacity-60 transition-opacity"
                  style={{ color: step.color }}
                >
                  {step.number}
                </div>
                <h3 className="text-xl font-extrabold uppercase tracking-tight text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-sm text-white/50 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          FULL-WIDTH PHOTO BREAK — game action
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative h-[30vh] md:h-[50vh] overflow-hidden">
        <img
          src="/images/logan-weaver-lgnwvr-xtPs2_MlPYc-unsplash.jpg"
          alt="Basketball game action"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E17]/90 via-[#0A0E17]/40 to-[#0A0E17]/90" />
        <div className="relative h-full flex items-center justify-center px-4">
          <div className="text-center">
            <p className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-extrabold uppercase tracking-tighter text-white">
              Proven Stats.
            </p>
            <p className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-extrabold uppercase tracking-tighter text-[#FFB800]">
              Real Results.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          THE STACK
          ═══════════════════════════════════════════════════════════════════════ */}
      <section id="stack" className="relative py-16 md:py-24 px-4 md:px-6 overflow-hidden">
        {/* Background arena atmosphere */}
        <img
          src="/images/luke-miller-6IoovRPa93g-unsplash.jpg"
          alt="Basketball arena"
          className="absolute inset-0 w-full h-full object-cover opacity-10"
        />
        <div className="absolute inset-0 bg-[#0A0E17]/90" />

        <div className="relative max-w-6xl mx-auto">
          <p className="text-[#00E5A0] text-xs font-semibold uppercase tracking-[0.25em] mb-3">
            /The Stack
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold uppercase tracking-tight text-white mb-2">
            No Agent Framework.
          </h2>
          <p className="text-white/40 text-base md:text-lg mb-10 md:mb-12">
            Deliberate choice. Raw API calls. Full control.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-10">
            {[
              { name: "Next.js 16", role: "Frontend", desc: "App Router + React 19" },
              { name: "Convex", role: "Real-Time DB", desc: "Zero-latency push" },
              { name: "Claude AI", role: "Simulation", desc: "Sonnet via fetch()" },
              { name: "ElevenLabs", role: "TTS v3", desc: "Broadcast announcer" },
            ].map((tech) => (
              <div
                key={tech.name}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-4 md:px-5 md:py-5 hover:border-[#00E5A0]/30 transition-colors"
              >
                <p className="font-extrabold text-white text-base md:text-lg uppercase tracking-tight">{tech.name}</p>
                <p className="text-[10px] text-[#00E5A0] uppercase tracking-[0.15em] mt-1 font-semibold">
                  {tech.role}
                </p>
                <p className="text-xs text-white/30 mt-1">{tech.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 md:gap-3 text-sm">
            {[
              "Kaggle Data",
              "Perplexity Enrichment",
              "Bradley-Terry Model",
              "KenPom Analytics",
              "Clerk Auth",
              "Vercel Deploy",
            ].map((tag) => (
              <span
                key={tag}
                className="bg-white/5 border border-white/10 rounded-full px-3 md:px-4 py-1.5 text-white/40 text-xs font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          FEATURES — 2x3 grid
          ═══════════════════════════════════════════════════════════════════════ */}
      <section id="features" className="py-16 md:py-24 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-[#00E5A0] text-xs font-semibold uppercase tracking-[0.25em] mb-3">
            /Features
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold uppercase tracking-tight text-white mb-10 md:mb-14">
            Built for the Bracket.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: "🎯",
                title: "Upset Algorithm",
                description: "5-signal ensemble: historical rates, efficiency gap, volatility, experience, and AI-interpreted momentum. Cinderellas happen here.",
                accent: "#00E5A0",
              },
              {
                icon: "🎙️",
                title: "AI Announcer",
                description: "ElevenLabs v3 TTS reads every result with real broadcast energy. Upsets get the full treatment.",
                accent: "#FFB800",
              },
              {
                icon: "⚡",
                title: "Real-Time Bracket",
                description: "Convex reactive push. Zero polling. The bracket updates live as each game resolves.",
                accent: "#FF3B5C",
              },
              {
                icon: "🏆",
                title: "Leaderboard",
                description: "Track champions across all simulations. Championship probability, Final Four rates, Cinderella tracking.",
                accent: "#00E5A0",
              },
              {
                icon: "🔍",
                title: "AI Scouting Reports",
                description: "Perplexity pulls current injuries, streaks, and analyst takes. Claude generates style profiles.",
                accent: "#FFB800",
              },
              {
                icon: "📊",
                title: "Kaggle Competition",
                description: "Our ensemble model generates tournament predictions. Bradley-Terry + efficiency + seeds = competitive submission.",
                accent: "#FF3B5C",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group bg-[#1C2636] border border-white/5 rounded-2xl p-6 md:p-7 hover:border-white/15 transition-all duration-300"
              >
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3
                  className="text-base font-extrabold uppercase tracking-tight mb-2"
                  style={{ color: feature.accent }}
                >
                  {feature.title}
                </h3>
                <p className="text-sm text-white/50 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          GAME ACTION PHOTO BREAK
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative h-[30vh] md:h-[35vh] overflow-hidden">
        <img
          src="/images/logan-weaver-lgnwvr-31zFmHWBaDE-unsplash.jpg"
          alt="Basketball tip-off"
          className="absolute inset-0 w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E17] via-transparent to-[#0A0E17]/60" />
        <div className="relative h-full flex items-end justify-center pb-8 md:pb-10 px-4">
          <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold uppercase tracking-tighter text-white text-center">
            Both Brackets. <span className="text-[#00E5A0]">136 Teams.</span>
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          BUILT BY
          ═══════════════════════════════════════════════════════════════════════ */}
      <section id="about" className="py-16 md:py-24 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-[#00E5A0] text-xs font-semibold uppercase tracking-[0.25em] mb-3">
            /Built By
          </p>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-8">
            <div className="bg-[#1C2636] border border-white/5 rounded-2xl p-7 md:p-10">
              <h2 className="text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-white mb-1">
                Tarik Moody
              </h2>
              <p className="text-sm text-white/40 uppercase tracking-wider mb-8 font-medium">
                Director of Strategy & Innovation · Radio Milwaukee
              </p>

              <blockquote className="border-l-3 border-[#00E5A0] pl-6 mb-8">
                <p className="text-lg md:text-xl italic text-white/60 leading-relaxed">
                  &ldquo;The bracket is a tree. The agents are the leaves.
                  Claude is the wind.&rdquo;
                </p>
              </blockquote>

              <p className="text-sm text-white/40 leading-relaxed mb-8">
                I call my development methodology &ldquo;bumwad coding&rdquo; — named after the tracing paper architects use to iterate on designs.
                Every project starts with a blueprint. Only after the architecture is solid do I start writing code, usually with Claude Code as my pair programmer.
              </p>

              <div className="flex flex-wrap gap-3">
                <a href="https://tarikmoody.com" target="_blank" rel="noopener noreferrer"
                  className="text-sm border border-white/15 text-white/60 hover:text-white hover:border-white/30 font-semibold uppercase tracking-wider px-5 py-2.5 rounded-lg transition-colors min-h-[44px] flex items-center">
                  tarikmoody.com
                </a>
                <a href="https://theintersection.fm" target="_blank" rel="noopener noreferrer"
                  className="text-sm border border-white/15 text-white/60 hover:text-white hover:border-white/30 font-semibold uppercase tracking-wider px-5 py-2.5 rounded-lg transition-colors min-h-[44px] flex items-center">
                  The Intersection
                </a>
                <a href="https://x.com/tarikmoody" target="_blank" rel="noopener noreferrer"
                  className="text-sm border border-white/15 text-white/60 hover:text-white hover:border-white/30 font-semibold uppercase tracking-wider px-5 py-2.5 rounded-lg transition-colors min-h-[44px] flex items-center">
                  @tarikmoody
                </a>
              </div>
            </div>

            {/* Ball close-up accent photo */}
            <div className="relative rounded-2xl overflow-hidden hidden md:block">
              <img
                src="/images/ben-hershey-5nk3wSFUWZc-unsplash.jpg"
                alt="NCAA basketball close-up"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E17]/60 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          CTA BANNER
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-20 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-r from-[#00E5A0]/10 via-[#FFB800]/5 to-[#FF3B5C]/10 border border-white/10 rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold uppercase tracking-tighter text-white mb-4">
              Your Simulation<br />
              <span className="text-[#00E5A0]">Starts Now.</span>
            </h2>
            <p className="text-white/50 text-base md:text-lg mb-8 max-w-lg mx-auto">
              68 teams. 67 games. Every matchup simulated by AI.
              Every upset earned by data. Every story told in real time.
            </p>
            <a
              href="/simulator"
              className="inline-flex items-center gap-2 bg-[#00E5A0] text-[#0A0E17] font-extrabold uppercase tracking-wider px-8 md:px-10 py-4 md:py-5 rounded-xl text-base md:text-lg hover:bg-[#00c98e] transition-all hover:scale-105 min-h-[44px]"
            >
              Launch AgentMadness →
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 md:px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-[#00E5A0] font-extrabold uppercase tracking-tight">
            AgentMadness
          </span>
          <div className="flex items-center gap-6 text-sm text-white/30">
            <a href="/simulator" className="hover:text-white/60 transition-colors">Simulator</a>
            <a href="/predictions" className="hover:text-white/60 transition-colors">Predictions</a>
            <a href="/leaderboard" className="hover:text-white/60 transition-colors">Leaderboard</a>
            <a href="#about" className="hover:text-white/60 transition-colors">About</a>
          </div>
          <p className="text-xs text-white/20">
            Built with Claude AI · March 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
