"use client";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0E17] text-[#F8FAFC] scroll-smooth">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0A0E17]/90 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-[#00E5A0] font-extrabold text-lg tracking-tight uppercase">
            AgentMadness
          </span>
          <nav className="flex items-center gap-6">
            <a
              href="/"
              className="text-sm text-white/60 hover:text-white uppercase tracking-wider font-semibold transition-colors"
            >
              Simulator
            </a>
            <a
              href="/leaderboard"
              className="text-sm text-white/60 hover:text-white uppercase tracking-wider font-semibold transition-colors"
            >
              Leaderboard
            </a>
            <a
              href="#about"
              className="text-sm text-white/60 hover:text-white uppercase tracking-wider font-semibold transition-colors"
            >
              About
            </a>
            <a
              href="/"
              className="text-sm bg-[#00E5A0] text-[#0A0E17] font-bold uppercase tracking-wider px-4 py-1.5 rounded hover:bg-[#00c98e] transition-colors"
            >
              Launch →
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#00E5A0]/5 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-[#FFB800]/5 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-[#FF3B5C]/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Pre-label */}
          <p className="text-[#00E5A0] text-xs font-semibold uppercase tracking-[0.2em] mb-6">
            🏀 March Madness · AI Tournament Simulator
          </p>

          {/* Logo / Brand */}
          <h1 className="text-6xl md:text-8xl font-extrabold uppercase tracking-tight text-white leading-none mb-4">
            Agent
            <span className="text-[#00E5A0]">Madness</span>
          </h1>

          {/* Hero headline */}
          <div className="mb-8">
            <p className="text-4xl md:text-6xl font-extrabold uppercase tracking-tight text-white leading-tight">
              Every Team.
            </p>
            <p className="text-4xl md:text-6xl font-extrabold uppercase tracking-tight text-white leading-tight">
              Every Game.
            </p>
            <p className="text-4xl md:text-6xl font-extrabold uppercase tracking-tight text-[#FFB800] leading-tight">
              Simulated by AI.
            </p>
          </div>

          {/* Subtext */}
          <p className="text-lg text-white/60 max-w-2xl mb-10 leading-relaxed">
            68 teams become AI agents. A Claude-powered referee simulates every
            matchup with real stats, historical upset data, and broadcast-quality
            narratives.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4 mb-16">
            <a
              href="/"
              className="inline-flex items-center gap-2 bg-[#00E5A0] text-[#0A0E17] font-bold uppercase tracking-wider px-8 py-4 rounded-lg text-base hover:bg-[#00c98e] transition-colors"
            >
              Launch Simulator →
            </a>
            <a
              href="/leaderboard"
              className="inline-flex items-center gap-2 border border-white/20 text-white font-bold uppercase tracking-wider px-8 py-4 rounded-lg text-base hover:border-white/40 hover:bg-white/5 transition-colors"
            >
              View Leaderboard
            </a>
          </div>

          {/* Stats Bar */}
          <div className="flex flex-wrap gap-4">
            {[
              { value: "136", label: "Teams" },
              { value: "134", label: "Games" },
              { value: "$0.22", label: "/ Run" },
              { value: "40+", label: "Years of Data" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-[#1C2636] border border-white/10 rounded-xl px-6 py-4 min-w-[120px]"
              >
                <p className="text-3xl font-mono font-bold text-[#00E5A0]">
                  {stat.value}
                </p>
                <p className="text-xs text-white/50 uppercase tracking-widest mt-1">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-[#00E5A0] text-xs font-semibold uppercase tracking-[0.2em] mb-3">
            /How It Works
          </p>
          <h2 className="text-3xl font-extrabold uppercase tracking-tight text-white mb-12">
            Three Layers. One Tournament.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                number: "1",
                title: "Team Agents",
                color: "#00E5A0",
                description:
                  "Each team carries its full identity: KenPom ratings, player rosters, play style, historical performance, and seed history. No two agents are the same.",
              },
              {
                number: "2",
                title: "Referee Engine",
                color: "#FFB800",
                description:
                  "Claude AI analyzes both teams and simulates a realistic game with scores, momentum swings, and broadcast-quality play-by-play narrative.",
              },
              {
                number: "3",
                title: "Bracket Animation",
                color: "#FF3B5C",
                description:
                  "Real-time animated bracket with game narratives and ElevenLabs TTS announcer calling every upset, buzzer-beater, and blowout.",
              },
            ].map((step) => (
              <div
                key={step.number}
                className="bg-[#1C2636] border border-white/10 rounded-xl p-6 hover:border-white/20 transition-colors"
              >
                <div
                  className="text-4xl font-mono font-extrabold mb-4"
                  style={{ color: step.color }}
                >
                  {step.number}.
                </div>
                <h3 className="text-xl font-extrabold uppercase tracking-tight text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-sm text-white/60 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Stack Section */}
      <section id="stack" className="py-24 px-6 bg-[#0D1220]">
        <div className="max-w-5xl mx-auto">
          <p className="text-[#00E5A0] text-xs font-semibold uppercase tracking-[0.2em] mb-3">
            /The Stack
          </p>
          <h2 className="text-3xl font-extrabold uppercase tracking-tight text-white mb-2">
            No Agent Framework.
          </h2>
          <p className="text-white/50 text-base mb-10">
            Deliberate choice. Raw API calls. Full control.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { name: "Next.js", role: "Frontend" },
              { name: "Convex", role: "Backend" },
              { name: "Claude AI", role: "Simulation" },
              { name: "ElevenLabs", role: "TTS" },
            ].map((tech) => (
              <div
                key={tech.name}
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-4 text-center hover:border-white/20 transition-colors"
              >
                <p className="font-bold text-white text-base">{tech.name}</p>
                <p className="text-xs text-white/40 uppercase tracking-wider mt-1">
                  {tech.role}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-white/50">
            <span className="bg-white/5 border border-white/10 rounded px-3 py-1.5">
              Data: Kaggle + Perplexity enrichment
            </span>
            <span className="bg-white/5 border border-white/10 rounded px-3 py-1.5">
              Deploy: Vercel + Convex Cloud
            </span>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-[#00E5A0] text-xs font-semibold uppercase tracking-[0.2em] mb-3">
            /Features
          </p>
          <h2 className="text-3xl font-extrabold uppercase tracking-tight text-white mb-12">
            Built for the Bracket.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: "🎯",
                title: "Data-Driven Upset Algorithm",
                description:
                  "Historical upset rates combined with efficiency metrics and chaos factors. Cinderellas happen here.",
              },
              {
                icon: "🎙️",
                title: "AI Announcer",
                description:
                  "ElevenLabs v3 TTS reads every game result with real broadcast energy. Turn up the volume.",
              },
              {
                icon: "📊",
                title: "Real-Time Bracket",
                description:
                  "Convex reactive push means zero polling. The bracket updates live as each game resolves.",
              },
              {
                icon: "🏆",
                title: "Leaderboard",
                description:
                  "Track champions across all simulations. Which team wins the most? The data knows.",
              },
              {
                icon: "🔍",
                title: "AI Scouting Reports",
                description:
                  "Perplexity-powered team profiles pull current season stats, trends, and analyst takes.",
              },
              {
                icon: "👥",
                title: "Both Brackets",
                description:
                  "Men's and Women's tournaments. 136 teams total. Full parity in the simulation engine.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-[#1C2636] border border-white/10 rounded-xl p-6 hover:border-white/20 transition-colors"
              >
                <div className="text-2xl mb-3">{feature.icon}</div>
                <h3 className="text-base font-extrabold uppercase tracking-tight text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-white/60 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Builder Section */}
      <section id="about" className="py-24 px-6 bg-[#0D1220]">
        <div className="max-w-5xl mx-auto">
          <p className="text-[#00E5A0] text-xs font-semibold uppercase tracking-[0.2em] mb-3">
            /Built By
          </p>

          <div className="bg-[#1C2636] border border-white/10 rounded-xl p-8 md:p-12">
            <h2 className="text-3xl font-extrabold uppercase tracking-tight text-white mb-1">
              Tarik Moody
            </h2>
            <p className="text-sm text-white/50 uppercase tracking-wider mb-8">
              Director of Strategy &amp; Innovation · Radio Milwaukee
            </p>

            <blockquote className="border-l-2 border-[#00E5A0] pl-6 mb-8">
              <p className="text-lg italic text-white/70 leading-relaxed">
                &ldquo;The bracket is a tree. The agents are the leaves.
                <br />
                Claude is the wind.&rdquo;
              </p>
              <cite className="text-xs text-[#00E5A0] uppercase tracking-widest not-italic mt-3 block">
                — Tarik Moody
              </cite>
            </blockquote>

            <div className="flex flex-wrap gap-3">
              <a
                href="https://tarikmoody.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm border border-white/20 text-white/70 hover:text-white hover:border-white/40 font-semibold uppercase tracking-wider px-4 py-2 rounded transition-colors"
              >
                tarikmoody.com
              </a>
              <a
                href="https://theintersection.fm"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm border border-white/20 text-white/70 hover:text-white hover:border-white/40 font-semibold uppercase tracking-wider px-4 py-2 rounded transition-colors"
              >
                The Intersection
              </a>
              <a
                href="https://x.com/tarikmoody"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm border border-white/20 text-white/70 hover:text-white hover:border-white/40 font-semibold uppercase tracking-wider px-4 py-2 rounded transition-colors"
              >
                @tarikmoody
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-[#00E5A0] font-extrabold uppercase tracking-tight">
            AgentMadness
          </span>
          <div className="flex items-center gap-6 text-sm text-white/40">
            <a href="/" className="hover:text-white/70 transition-colors">
              Simulator
            </a>
            <a href="/leaderboard" className="hover:text-white/70 transition-colors">
              Leaderboard
            </a>
            <a href="#about" className="hover:text-white/70 transition-colors">
              About
            </a>
          </div>
          <p className="text-xs text-white/30">
            Built with Claude AI · 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
