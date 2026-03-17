"use client";

import { MarkdownContent } from "../../components/MarkdownContent";

const GUIDE_CONTENT = `
# How AgentMadness Predicts March Madness

*A plain-English guide to the data science behind the simulator — designed for anyone who wants to understand the methodology and apply it to their own projects.*

---

## The Big Picture

We're trying to answer one question: **if Team A plays Team B, what's the probability Team A wins?**

Everything in this project — the upset algorithm, the simulation engine, the Kaggle submission — comes back to that single question. We answer it by combining multiple "models" (different ways of estimating that probability), each with its own strengths and weaknesses.

Think of it like asking five different basketball experts for their prediction. Each expert looks at different things. We blend their answers together because the crowd is smarter than any individual.

---

## Model 1: The Efficiency Model (KenPom-Style)

### What it measures
How many points a team scores and allows **per 100 possessions**. This removes pace of play from the equation — a team that plays fast and scores 85 points isn't necessarily better than a team that plays slow and scores 65.

### How we compute it

From every game in the 2026 regular season, we extract:

\`\`\`
Possessions = Field Goal Attempts - Offensive Rebounds + Turnovers + (0.475 × Free Throw Attempts)
\`\`\`

This formula estimates how many times a team had the ball. Then:

\`\`\`
Adjusted Offensive Efficiency (adjOE) = (Total Points Scored / Total Possessions) × 100
Adjusted Defensive Efficiency (adjDE) = (Total Points Allowed / Total Possessions) × 100
\`\`\`

A team with adjOE of 115 and adjDE of 95 has an **efficiency margin** of +20. That's elite — they score 20 more points per 100 possessions than they allow.

### Converting to win probability

We use a **logistic function** (the most important function in data science — you'll see it everywhere):

\`\`\`
P(Team A wins) = 1 / (1 + 10^(-(marginA - marginB) / 11))
\`\`\`

The number 11 is a scaling factor calibrated to college basketball. Here's the intuition:

| Efficiency Gap | Win Probability |
|---------------|-----------------|
| +0 (equal teams) | 50% |
| +5 (small edge) | 61% |
| +10 (solid favorite) | 72% |
| +15 (clear favorite) | 81% |
| +20 (dominant) | 88% |
| +30 (mismatch) | 95% |

**Why this works:** Efficiency margin is the single best predictor of college basketball outcomes. KenPom has proven this over 20+ years. It's better than win-loss record, better than rankings, better than the eye test.

**Where it falls short:** It treats all games equally. A blowout win over a weak team in November counts the same as a close loss to a top-10 team in February. It also can't capture "intangibles" like coaching, clutch play, or tournament experience.

---

## Model 2: Bradley-Terry

### The concept

Imagine you have a tournament of chess players. You don't know how good they are, but you can see who beat whom. The Bradley-Terry model works backward from results to estimate each player's true strength.

### How it works (step by step)

1. **Start:** Give every team a strength of 1.0
2. **Look at reality:** Count how many games each team actually won
3. **Look at expectation:** For each game a team played, calculate how likely they were to win given current strengths
4. **Adjust:** If a team won MORE games than expected, increase their strength. If fewer, decrease it.
5. **Repeat** 100 times until the strengths stabilize

The math for one iteration:

\`\`\`
For each team:
  actual_wins = number of games they won
  expected_wins = sum of [my_strength / (my_strength + opponent_strength)] for every game
  new_strength = actual_wins / expected_wins × old_strength
\`\`\`

Then normalize all strengths so they average out to 1.0.

### Why this is brilliant

- A team that beats strong teams gets more credit than a team that beats weak teams
- Strength of schedule is **automatically** accounted for
- After 100 iterations, the ratings converge to the "true" relative strength

### Win probability from Bradley-Terry

Dead simple:

\`\`\`
P(A beats B) = strength(A) / (strength(A) + strength(B))
\`\`\`

If Team A has strength 2.5 and Team B has strength 1.0:

\`\`\`
P = 2.5 / (2.5 + 1.0) = 71.4%
\`\`\`

**Why we add this to the ensemble:** It captures information that raw efficiency misses — specifically, WHO you played and how you performed relative to their strength. Two teams with identical efficiency margins can have very different Bradley-Terry ratings if one played a harder schedule.

---

## Model 3: Seed-Based Baseline

### The concept

The NCAA selection committee assigns seeds 1-16 to each team. These seeds contain expert judgment that isn't always captured by statistics — things like injuries, team drama, recent trends.

### How we use it

Convert seed difference to probability:

\`\`\`
P(Team A wins) = 1 / (1 + 10^((seedA - seedB) / 5))
\`\`\`

A 1-seed vs a 16-seed produces 99.9%. A 5-seed vs a 12-seed produces 96.2%.

Wait — 96%? That's too high. Historical data says 12-seeds win 36% of the time. That's why this model gets a LOW weight (10%) in our ensemble. It's useful as a signal but wrong on its own.

**Why we include it anyway:** For teams we have limited data on (small conferences, late-season additions), the committee's seed is the best information we have.

---

## Model 4: Conference Tournament Momentum

### The concept

Teams enter March Madness in very different emotional states. A mid-major that just won their conference championship is playing with house money and confidence. A power-conference team that lost in the first round of their conference tournament might be deflated.

### How we use it

We parse conference tournament results to find which teams are champions. Conference champions get a +3% probability boost. This is small but meaningful.

**The data science principle:** This is a **feature** — a piece of information we add to our model because we believe it predicts the outcome. Good data science is often about finding clever features, not clever algorithms.

---

## Model 5: Recency Weighting

### The problem

A team's performance in November might look nothing like their performance in March. Injuries, player development, chemistry — teams change dramatically over a season.

### The solution

Instead of treating all games equally when computing efficiency, we apply **exponential weighting**:

\`\`\`
weight = exp(dayNum / maxDayNum × 2)
\`\`\`

This means:
- Games on the last day of the season get weight ~7.4
- Games on the first day get weight ~1.0
- Games in the middle get weight ~2.7

A late-season blowout win counts 7x more than an early-season one.

**The data science principle:** This is **feature engineering** — transforming raw data to better capture the signal. Recency weighting is used everywhere in data science, from stock prediction to recommendation systems.

---

## The Ensemble: Blending It All Together

### Why blend?

Each model has blind spots:
- **Efficiency** misses strength of schedule
- **Bradley-Terry** is slow to react to recent changes
- **Seeds** are based on committee judgment (sometimes wrong)
- **Conference tournaments** are small sample sizes

By blending, we cancel out individual errors. This is called **ensemble learning** and it's one of the most powerful ideas in data science. Almost every Kaggle competition winner uses some form of ensembling.

### Our weights

\`\`\`
Final probability =
  0.55 × KenPom logistic (recency-weighted efficiency)
  + 0.30 × Bradley-Terry
  + 0.10 × Seed-based
  + 0.05 × Conference tournament adjustment
\`\`\`

### Why these specific weights?

- **Efficiency gets 55%** because it's the single strongest predictor
- **Bradley-Terry gets 30%** because it's the best complement (captures different information)
- **Seeds get 10%** because committee judgment adds value but is noisy
- **Conference tournament gets 5%** because it's a small signal on a small sample

---

## Log Loss: Why Confidence Matters

### What it is

Log loss measures how good your probability predictions are. It's the scoring metric for the Kaggle competition.

### The intuition

- Predict 0.9 and Team A wins → small penalty (you were right and confident)
- Predict 0.6 and Team A wins → moderate penalty (you were right but unsure)
- Predict 0.6 and Team A loses → moderate penalty (you were wrong but unsure)
- Predict 0.9 and Team A loses → **HUGE penalty** (you were wrong and confident)
- Predict 1.0 and Team A loses → **INFINITE penalty**

This is why we clamp predictions to [0.01, 0.99]. A single prediction of 1.0 that's wrong would destroy our entire submission.

### What makes a good log loss score?

| Score | Meaning |
|-------|---------|
| 0.693 | Predicting 50% for every game (no skill) |
| 0.55-0.60 | Decent model |
| 0.45-0.50 | Competitive on Kaggle |
| < 0.45 | Top 10% territory |

**The key insight:** Log loss rewards **calibration**. If you predict 70% for a group of games, roughly 70% of them should actually be won by the predicted team.

---

## The Upset Algorithm (In-App Simulation)

The simulator uses a different approach than the Kaggle submission because it has a different goal. Kaggle wants calibrated probabilities. The simulator wants **entertaining, realistic outcomes** with appropriate chaos.

### Five signals, weighted

\`\`\`
upsetProbability =
  0.35 × historicalSeedRate
  + 0.30 × (1 - efficiencyGap)
  + 0.20 × combinedVolatility
  + 0.10 × (1 - experienceGap)
  + 0.05 × momentum
\`\`\`

### Historical Seed Rate (35% weight)

40 years of NCAA Tournament data tells us exactly how often each seed matchup produces an upset:

| Matchup | Upset Rate | Translation |
|---------|-----------|-------------|
| 1 vs 16 | 1.5% | Almost never (2 times ever) |
| 2 vs 15 | 6% | About once every 2 years |
| 3 vs 14 | 13% | About once per tournament |
| 4 vs 13 | 20% | One per year |
| 5 vs 12 | 35% | The famous "upset special" |
| 6 vs 11 | 37% | Nearly a coin flip |
| 7 vs 10 | 39% | Toss-up |
| 8 vs 9 | 48% | Dead even |

### Volatility (20% weight)

We compute each team's game-to-game scoring variance. A team that wins by 20, loses by 5, wins by 30, loses by 2 is VOLATILE. When two volatile teams play, anything can happen. This is what makes March Madness what it is.

\`\`\`
volatility = standard deviation of scoring margin across all regular season games
\`\`\`

High volatility + high upset rate = **MADNESS**.

### How Claude Uses the Algorithm

The computed probability is injected into the referee prompt as a **constraint**:

> "Computed upset probability for this matchup: 34.2%. Use this probability to decide the winner — respect it."

Claude then generates a realistic narrative that explains WHY the result happened. The math decides the winner; Claude tells the story.

---

## Key Concepts for Your Other Projects

These principles work far beyond basketball:

| Concept | What It Does | Use It For |
|---------|-------------|-----------|
| **Logistic Function** | Converts any number to a probability (0-1) | Medical diagnosis, spam filtering, credit scoring |
| **Ensemble Learning** | Blend multiple models to outperform any individual | Any prediction task |
| **Feature Engineering** | Find informative signals in raw data | Recommendation systems, fraud detection |
| **Calibration** | Probabilities should mean what they say | Weather forecasting, risk assessment |
| **Log Loss** | Measure probability quality | Any classification task |
| **Bradley-Terry** | Estimate strength from pairwise comparisons | Product ranking, A/B testing, search results |
| **Exponential Weighting** | Recent data matters more | Stock prediction, trend detection |

---

*Built by Tarik Moody for the AgentMadness project · March 2026*
`;

export default function LearnPage() {
  return (
    <div className="min-h-screen bg-[#0A0E17] text-[#F8FAFC]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0A0E17]/90 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <a href="/" className="text-[#00E5A0] font-extrabold text-lg tracking-tight uppercase">
            AgentMadness
          </a>
          <nav className="flex items-center gap-6">
            <a href="/simulator" className="text-sm text-white/60 hover:text-white uppercase tracking-wider font-semibold transition-colors">
              Simulator
            </a>
            <a href="/leaderboard" className="text-sm text-white/60 hover:text-white uppercase tracking-wider font-semibold transition-colors">
              Leaderboard
            </a>
            <a href="/" className="text-sm text-white/60 hover:text-white uppercase tracking-wider font-semibold transition-colors">
              Home
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <div className="border-b border-white/5 bg-[#0D1220]">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <p className="text-[#00E5A0] text-xs font-semibold uppercase tracking-[0.25em] mb-4">
            /Learn
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold uppercase tracking-tight text-white mb-4">
            The Data Science<br />
            <span className="text-[#FFB800]">Behind the Madness</span>
          </h1>
          <p className="text-lg text-white/50 max-w-2xl leading-relaxed">
            A plain-English guide to every model, algorithm, and technique we use —
            designed for anyone who wants to understand the methodology and apply it to their own projects.
          </p>
        </div>
      </div>

      {/* Table of Contents */}
      <div className="border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Efficiency Model", href: "#efficiency" },
              { label: "Bradley-Terry", href: "#bradley-terry" },
              { label: "Seed Model", href: "#seeds" },
              { label: "Ensemble", href: "#ensemble" },
              { label: "Log Loss", href: "#log-loss" },
              { label: "Upset Algorithm", href: "#upset" },
              { label: "Apply Anywhere", href: "#apply" },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-medium text-white/50 hover:text-white hover:border-white/20 transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <article className="max-w-4xl mx-auto px-6 py-12">
        <div className="prose-custom">
          <MarkdownContent content={GUIDE_CONTENT} />
        </div>
      </article>

      {/* CTA */}
      <div className="border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6 py-12 text-center">
          <p className="text-white/40 text-sm mb-4">Ready to see it in action?</p>
          <a
            href="/simulator"
            className="inline-flex items-center gap-2 bg-[#00E5A0] text-[#0A0E17] font-extrabold uppercase tracking-wider px-8 py-4 rounded-lg text-base hover:bg-[#00c98e] transition-all"
          >
            Launch Simulator →
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="text-[#00E5A0] font-extrabold uppercase tracking-tight text-sm">
            AgentMadness
          </span>
          <p className="text-xs text-white/20">
            Built with Claude AI · March 2026
          </p>
        </div>
      </footer>

      <style jsx global>{`
        .prose-custom h1 { font-size: 2rem; font-weight: 800; text-transform: uppercase; letter-spacing: -0.025em; color: white; margin-top: 3rem; margin-bottom: 1rem; }
        .prose-custom h2 { font-size: 1.5rem; font-weight: 800; text-transform: uppercase; letter-spacing: -0.025em; color: white; margin-top: 3rem; margin-bottom: 0.75rem; padding-top: 2rem; border-top: 1px solid rgba(255,255,255,0.05); }
        .prose-custom h3 { font-size: 1.1rem; font-weight: 700; color: #00E5A0; margin-top: 2rem; margin-bottom: 0.5rem; }
        .prose-custom h2:first-child { border-top: none; padding-top: 0; margin-top: 0; }
        .prose-custom table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; font-size: 0.875rem; }
        .prose-custom thead { border-bottom: 2px solid rgba(255,255,255,0.1); }
        .prose-custom th { text-align: left; padding: 0.5rem 1rem; color: #94A3B8; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
        .prose-custom td { padding: 0.5rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); color: #C8CED6; }
        .prose-custom tr:hover td { background: rgba(255,255,255,0.02); }
        .prose-custom code { background: rgba(255,255,255,0.05); border-radius: 4px; padding: 0.15rem 0.4rem; font-size: 0.85em; color: #FFB800; font-family: "Geist Mono", monospace; }
        .prose-custom pre { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 0.75rem; padding: 1.25rem; overflow-x: auto; margin: 1.5rem 0; }
        .prose-custom pre code { background: none; padding: 0; color: #C8CED6; font-size: 0.8rem; }
        .prose-custom blockquote { border-left: 3px solid #00E5A0; padding-left: 1.5rem; margin: 1.5rem 0; font-style: italic; color: rgba(255,255,255,0.6); }
        .prose-custom hr { border: none; border-top: 1px solid rgba(255,255,255,0.05); margin: 2.5rem 0; }
        .prose-custom strong { color: white; font-weight: 700; }
        .prose-custom em { color: #94A3B8; }
      `}</style>
    </div>
  );
}
