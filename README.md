# AgentMadness

> AI-powered NCAA Tournament bracket simulator. 136 teams. 134 games. Every matchup simulated by Claude AI.

## Overview

AgentMadness transforms every NCAA Tournament team into an AI agent profile, then uses Claude to simulate realistic game outcomes complete with scores, narratives, and broadcast-quality audio commentary via ElevenLabs. Both men's and women's brackets are fully supported.

**Live:** [agentmadness-seven.vercel.app](https://agentmadness-seven.vercel.app)

**Kaggle:** Submitted to [March Machine Learning Mania 2026](https://www.kaggle.com/competitions/march-machine-learning-mania-2026) with a 4-model ensemble.

## Features

- **Real-time bracket simulation** — Convex reactive push, zero polling
- **AI referee engine** — Claude Sonnet simulates every game with scores, MVP, key moments, and narrative
- **AI announcer** — ElevenLabs v3 TTS reads every result with broadcast energy
- **AI scouting reports** — Perplexity-enriched team profiles with current-season context
- **Data-driven upset algorithm** — 5-signal ensemble: historical rates, efficiency, volatility, experience, momentum
- **Per-user tournaments** — Each user gets their own bracket with adjustable chaos/seed/recency sliders
- **Kaggle competition** — 4-model ensemble generates 132,133 matchup predictions
- **Daily news + podcast** — AI-generated recaps comparing predictions vs real results, with Gemini hero images
- **Leaderboard** — Track champions across all simulations
- **Team logos** — ESPN CDN integration
- **Mobile optimized** — Round-by-round tab view, bottom sheet, marquee ticker

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 · TypeScript · Tailwind CSS v4 · Motion (v12.37) |
| UI | shadcn/ui · diceui/marquee |
| Backend | Convex (real-time state, mutations, actions) |
| AI Simulation | Claude API via `fetch()` — structured JSON output |
| TTS | ElevenLabs v3 — broadcast-style announcer |
| Data Enrichment | Perplexity API — current-season team context |
| Image Generation | Gemini 3.1 Flash (Nano Banana 2) — daily recap hero images |
| Auth | Clerk — sign-in, rate limiting (3 runs/user/day) |
| Data Source | Kaggle March Machine Learning Mania 2026 |
| Deploy | Vercel (frontend) + Convex Cloud (backend) |
| Agent Framework | None — deliberate architectural choice |

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/simulator` | Interactive bracket simulator |
| `/predictions` | Kaggle submission visualized with plain-English explainers |
| `/leaderboard` | Championship probability tracker across all simulations |
| `/news` | Daily ESPN-style recaps with AI podcast |
| `/learn` | Data science methodology guide |
| `/game/[gameId]` | Individual game detail pages |

## Quick Start

### Prerequisites

- Node.js 20+
- npm
- Convex account
- Clerk account

### Installation

```bash
git clone https://github.com/tmoody1973/agentmadness.git
cd agentmadness
npm install
```

### Environment Variables

Create `.env.local`:

```env
# Convex
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# API Keys (also set in Convex Dashboard → Environment Variables)
ANTHROPIC_API_KEY=sk-ant-...
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=...
PERPLEXITY_API_KEY=...
GEMINI_API_KEY=...
```

Set Convex environment variables:

```bash
npx convex env set ANTHROPIC_API_KEY sk-ant-...
npx convex env set ELEVENLABS_API_KEY ...
npx convex env set ELEVENLABS_VOICE_ID ...
npx convex env set GEMINI_API_KEY ...
```

### Development

```bash
# Start Convex dev server
npx convex dev

# Start Next.js dev server (separate terminal)
npm run dev
```

### Seed the Database

```bash
# Generate bracket data from Kaggle CSVs
npx tsx scripts/build-bracket-data.ts

# Seed Convex with tournament data
npx convex run init:seedAll
```

### Generate Kaggle Submission

```bash
# Ensemble model
npx tsx scripts/generate-kaggle-submission.ts

# Variant models (upset-heavy, chalk-heavy, BT-heavy)
npx tsx scripts/generate-kaggle-variants.ts
```

## Project Structure

```
madness-sim/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── simulator/            # Bracket simulator
│   │   ├── predictions/          # Kaggle predictions dashboard
│   │   ├── leaderboard/          # Championship tracker
│   │   ├── news/                 # Daily recaps + podcast
│   │   ├── learn/                # Data science guide
│   │   └── game/[gameId]/        # Game detail pages
│   ├── components/
│   │   ├── Bracket.tsx           # Full tournament bracket layout
│   │   ├── RegionBracket.tsx     # Single region CSS Grid bracket
│   │   ├── MatchupCard.tsx       # Animated game card (4 states)
│   │   ├── LiveFeed.tsx          # Marquee ticker feed
│   │   ├── Sidebar.tsx           # Matchup details + team profiles
│   │   ├── MobileBracket.tsx     # Mobile round-tab view
│   │   ├── ScoutingReport.tsx    # Collapsible AI scouting sections
│   │   ├── TeamLogo.tsx          # ESPN CDN logos
│   │   └── OnboardingModal.tsx   # First-time user guide
│   └── data/
│       ├── bracket-2026.ts       # Generated bracket data
│       └── team-logos.ts         # ESPN team ID mapping
├── convex/
│   ├── schema.ts                 # Database schema
│   ├── bracket.ts                # Queries + mutations
│   ├── simulate.ts               # Claude API simulation engine
│   ├── tts.ts                    # ElevenLabs TTS
│   ├── prompts.ts                # Referee prompt + upset algorithm
│   ├── dailyRecap.ts             # News + podcast pipeline
│   ├── userTournament.ts         # Per-user bracket management
│   └── leaderboard.ts            # Aggregate stats
├── scripts/
│   ├── build-bracket-data.ts     # Kaggle → bracket data pipeline
│   ├── generate-kaggle-submission.ts  # Ensemble model submission
│   ├── generate-kaggle-variants.ts    # Variant submissions
│   └── lib/
│       ├── compute-stats.ts      # Efficiency ratings
│       ├── bradley-terry.ts      # Bradley-Terry model
│       ├── enrich-perplexity.ts  # AI scouting reports
│       └── generate-profiles.ts  # Claude team profiles
└── docs/
    ├── analytics-guide.md        # Full methodology
    ├── how-the-math-works.md     # Plain-English math guide
    └── kaggle-submission-guide.md # Beginner's Kaggle guide
```

## Upset Algorithm

5-signal weighted ensemble:

| Signal | Weight | Source |
|--------|--------|--------|
| Historical seed upset rate | 35% | 40 years of tournament data |
| Efficiency differential | 30% | Recency-weighted adjOE/adjDE |
| Combined volatility | 20% | Game-to-game scoring variance |
| Tournament experience | 10% | Program appearance count |
| Momentum | 5% | Perplexity context |

## Kaggle Ensemble Model

4-model blend for competition submission:

| Model | Weight |
|-------|--------|
| KenPom efficiency logistic | 55% |
| Bradley-Terry ratings | 30% |
| Seed-based logistic | 10% |
| Conference tournament momentum | 5% |

## Cost Per Run

| Component | Cost |
|-----------|------|
| Claude simulation (67 games) | ~$0.11 |
| ElevenLabs TTS (67 games) | ~$3.30 |
| Perplexity enrichment (one-time) | ~$0.50 |
| Gemini hero image (per recap) | ~$0.01 |
| **Total per tournament** | **~$3.91** |
| **Without TTS** | **~$0.61** |

## Built By

**Tarik Moody** — Director of Strategy & Innovation, Radio Milwaukee

> "The bracket is a tree. The agents are the leaves. Claude is the wind."

- [tarikmoody.com](https://tarikmoody.com)
- [The Intersection](https://theintersection.fm)
- [@tarikmoody](https://x.com/tarikmoody)

## License

MIT
