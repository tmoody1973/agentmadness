# How AgentMadness Predicts March Madness
## A Plain-English Guide to the Data Science Behind the Simulator

*Written for Tarik Moody — designed to build your data science intuition for this project and beyond.*

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

```
Possessions = Field Goal Attempts - Offensive Rebounds + Turnovers + (0.475 × Free Throw Attempts)
```

This formula estimates how many times a team had the ball. Then:

```
Adjusted Offensive Efficiency (adjOE) = (Total Points Scored / Total Possessions) × 100
Adjusted Defensive Efficiency (adjDE) = (Total Points Allowed / Total Possessions) × 100
```

A team with adjOE of 115 and adjDE of 95 has an **efficiency margin** of +20. That's elite — they score 20 more points per 100 possessions than they allow.

### Converting to win probability

We use a **logistic function** (the most important function in data science — you'll see it everywhere):

```
P(Team A wins) = 1 / (1 + 10^(-(marginA - marginB) / 11))
```

The number 11 is a scaling factor calibrated to college basketball. Here's the intuition:

| Efficiency gap | Win probability |
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

```
For each team:
  actual_wins = number of games they won
  expected_wins = sum of [my_strength / (my_strength + opponent_strength)] for every game
  new_strength = actual_wins / expected_wins × old_strength
```

Then normalize all strengths so they average out to 1.0.

### Why this is brilliant

- A team that beats strong teams gets more credit than a team that beats weak teams
- Strength of schedule is **automatically** accounted for
- After 100 iterations, the ratings converge to the "true" relative strength

### Win probability from Bradley-Terry

Dead simple:

```
P(A beats B) = strength(A) / (strength(A) + strength(B))
```

If Team A has strength 2.5 and Team B has strength 1.0:
```
P = 2.5 / (2.5 + 1.0) = 71.4%
```

**Why we add this to the ensemble:** It captures information that raw efficiency misses — specifically, WHO you played and how you performed relative to their strength. Two teams with identical efficiency margins can have very different Bradley-Terry ratings if one played a harder schedule.

---

## Model 3: Seed-Based Baseline

### The concept

The NCAA selection committee assigns seeds 1-16 to each team. These seeds contain expert judgment that isn't always captured by statistics — things like injuries, team drama, recent trends.

### How we use it

Convert seed difference to probability:

```
P(Team A wins) = 1 / (1 + 10^((seedA - seedB) / 5))
```

A 1-seed vs a 16-seed: `1 / (1 + 10^((1-16)/5))` = `1 / (1 + 10^(-3))` = 99.9%

A 5-seed vs a 12-seed: `1 / (1 + 10^((5-12)/5))` = `1 / (1 + 10^(-1.4))` = 96.2%

Wait — 96%? That's too high. Historical data says 12-seeds win 36% of the time. That's why this model gets a LOW weight (10%) in our ensemble. It's useful as a signal but wrong on its own.

**Why we include it anyway:** For teams we have limited data on (small conferences, late-season additions), the committee's seed is the best information we have. It also captures resume factors that stats miss.

---

## Model 4: Conference Tournament Momentum

### The concept

Teams enter March Madness in very different emotional states. A mid-major that just won their conference championship is playing with house money and confidence. A power-conference team that lost in the first round of their conference tournament might be deflated.

### How we use it

We parse `MConferenceTourneyGames.csv` to find:
- Which teams won their conference tournament (champions)
- Win/loss record in the conference tournament

Conference champions get a +3% probability boost. This is small but meaningful — over 132,000 predictions, small edges compound.

**The data science principle:** This is a **feature** — a piece of information we add to our model because we believe it predicts the outcome. Good data science is often about finding clever features, not clever algorithms.

---

## Model 5: Recency Weighting

### The problem

A team's performance in November might look nothing like their performance in March. Injuries, player development, chemistry — teams change dramatically over a season.

### The solution

Instead of treating all games equally when computing efficiency, we apply **exponential weighting**:

```
weight = exp(dayNum / maxDayNum × 2)
```

This means:
- Games on the last day of the season get weight ~7.4
- Games on the first day get weight ~1.0
- Games in the middle get weight ~2.7

A late-season blowout win counts 7x more than an early-season one.

**The data science principle:** This is **feature engineering** — transforming raw data to better capture the signal. Recency weighting is used everywhere in data science, from stock price prediction to recommendation systems. The general principle: **recent data is usually more relevant than old data.**

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

```
Final probability =
  0.55 × KenPom logistic (recency-weighted efficiency)
  + 0.30 × Bradley-Terry
  + 0.10 × Seed-based
  + 0.05 × Conference tournament adjustment
```

### Why these specific weights?

- **Efficiency gets 55%** because it's the single strongest predictor
- **Bradley-Terry gets 30%** because it's the best complement (captures different information)
- **Seeds get 10%** because committee judgment adds value but is noisy
- **Conference tournament gets 5%** because it's a small signal on a small sample

These weights are inspired by what works in the Kaggle competition. Top competitors typically weight KenPom-style models at 50-60% and Bradley-Terry at 25-35%.

### The critical clamp

```
probability = max(0.01, min(0.99, probability))
```

We NEVER predict 0% or 100%. Why? Because of how **log loss** (the scoring metric) works.

---

## Log Loss: Why Confidence Matters

### What it is

Log loss measures how good your probability predictions are. The formula:

```
Log Loss = -1/N × Σ [y × log(p) + (1-y) × log(1-p)]
```

Where `y` is the actual result (1 if Team A won, 0 if they lost) and `p` is your predicted probability.

### The intuition

- Predict 0.9 and Team A wins → small penalty (you were right and confident)
- Predict 0.6 and Team A wins → moderate penalty (you were right but unsure)
- Predict 0.6 and Team A loses → moderate penalty (you were wrong but unsure)
- Predict 0.9 and Team A loses → **HUGE penalty** (you were wrong and confident)
- Predict 1.0 and Team A loses → **INFINITE penalty** (log(0) = -∞)

This is why we clamp to [0.01, 0.99]. A single prediction of 1.0 that's wrong would give us infinite log loss and destroy our entire submission.

### What makes a good log loss score?

- **0.693** = predicting 50% for every game (baseline, no skill)
- **0.55-0.60** = decent model
- **0.45-0.50** = competitive on Kaggle
- **<0.45** = top 10% territory

The key insight: **log loss rewards calibration**. If you predict 70% for a group of games, roughly 70% of them should actually be won by the predicted team. Being well-calibrated matters more than being extreme.

---

## The Upset Algorithm (In-App Simulation)

The simulator uses a different approach than the Kaggle submission because it has a different goal. Kaggle wants calibrated probabilities. The simulator wants **entertaining, realistic outcomes** with appropriate chaos.

### How it works

Five signals are weighted to compute an upset probability:

```
upsetProbability =
  0.35 × historicalSeedRate        (how often this seed matchup produces upsets)
  + 0.30 × (1 - efficiencyGap)    (closer efficiency = more upset potential)
  + 0.20 × combinedVolatility     (volatile teams = more chaos)
  + 0.10 × (1 - experienceGap)    (less experience = more upset potential)
  + 0.05 × momentum               (Perplexity context, if available)
```

### Signal breakdown

**Historical Seed Rate (35% weight)**
40 years of NCAA Tournament data tells us exactly how often each seed matchup produces an upset:

| Matchup | Upset Rate | Translation |
|---------|-----------|-------------|
| 1 vs 16 | 1.5% | Almost never (2 times ever) |
| 2 vs 15 | 6% | About once every 2 years |
| 5 vs 12 | 35% | The famous "upset special" — happens every year |
| 8 vs 9 | 48% | Basically a coin flip |

**Efficiency Gap (30% weight)**
The difference in adjOE - adjDE between the two teams, normalized to 0-1. A bigger gap means the favorite is genuinely better, making an upset less likely.

**Combined Volatility (20% weight)**
We compute each team's game-to-game scoring variance. A team that wins by 20, loses by 5, wins by 30, loses by 2 is VOLATILE. When two volatile teams play, anything can happen. This is what makes March Madness what it is.

```
volatility = standard deviation of scoring margin across all regular season games
```

High volatility + high upset rate = MADNESS.

**Tournament Experience (10% weight)**
How many times has this program appeared in the NCAA Tournament historically? Kansas (50+ appearances) handles tournament pressure better than Cal Baptist (2nd appearance ever). This captures the "been there before" factor.

**Momentum (5% weight)**
If Perplexity enrichment is available, Claude interprets qualitative factors: injuries, hot streaks, coaching changes. This is the smallest weight because it's the noisiest signal.

### Same-Seed Matchups (First Four)

For 16-vs-16 or 11-vs-11 matchups, the historical rate is meaningless. Instead, we shift to pure efficiency:

```
P(upset) = 0.55 × efficiencyProb + 0.25 × volatility + 0.20 × experience
```

This produces differentiated probabilities (like 47% vs 53%) instead of flat 50/50.

### How Claude Uses This

The computed probability is injected into the referee prompt as a **constraint**:

> "Computed upset probability for this matchup: 34.2%. Use this probability to decide the winner — respect it."

Claude then generates a realistic narrative that explains WHY the result happened. If the 12-seed wins, Claude writes about the scoring run that broke the game open, the defensive stand in the final minutes, the star player who rose to the moment. The math decides the winner; Claude tells the story.

---

## Key Data Science Concepts (Reusable Anywhere)

### 1. Logistic Function
Converts any number to a probability (0-1). Used everywhere: medical diagnosis, spam filtering, credit scoring, March Madness.

### 2. Ensemble Learning
Blend multiple models to outperform any individual model. The secret weapon of Kaggle winners.

### 3. Feature Engineering
The art of finding informative signals in raw data. Recency weighting, conference tournament outcomes, volatility scores — these are all features we engineered from raw game data.

### 4. Calibration
Your probabilities should mean what they say. If you predict 70%, it should happen 70% of the time. Calibration matters more than accuracy.

### 5. Log Loss
Rewards calibrated confidence, severely punishes overconfident wrong predictions. Never predict 0% or 100%.

### 6. Bradley-Terry
Iterative algorithm for estimating relative strength from pairwise comparisons. Works for any competition: chess, sports, A/B testing, even ranking search results.

### 7. Exponential Weighting
Recent observations matter more than old ones. Apply `exp(t/T)` weighting to give recent data exponentially more influence.

---

## How to Apply This to Other Projects

| This Project | General Principle | Other Applications |
|-------------|------------------|-------------------|
| Efficiency margin | Normalize metrics to remove confounding variables | Revenue per employee (not total revenue), CTR (not total clicks) |
| Bradley-Terry | Iterative strength estimation from comparisons | Product ranking, search relevance, player ratings |
| Recency weighting | Recent data > old data | Stock prediction, recommendation systems, trend detection |
| Ensemble blending | Multiple weak models > one strong model | Any prediction task |
| Log loss | Measure probability calibration | Medical AI, weather forecasting, risk assessment |
| Upset algorithm | Combine quantitative + qualitative signals | Content recommendation, fraud detection |
| Perplexity enrichment | Augment structured data with unstructured context | Any data pipeline that could benefit from real-time web context |

---

*Built by Tarik Moody for the AgentMadness project, March 2026.*
