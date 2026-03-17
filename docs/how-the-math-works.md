# How AgentMadness Calculates Win Probabilities

*A plain-English walkthrough of every calculation in the submission generator — no math background needed.*

---

## Start Here: What Are We Doing?

Kaggle asks us one question 132,132 times: **"If Team A plays Team B, what's the probability Team A wins?"**

We answer with a number between 0 and 1:
- **0.95** means "we're very confident Team A wins"
- **0.50** means "coin flip, no idea"
- **0.05** means "we're very confident Team B wins"

To generate that number, we ask **four different experts** (our models), then blend their answers together. Each expert looks at different information.

---

## Expert 1: The Efficiency Expert (KenPom-Style)

### What it looks at
How many points each team scores and allows **per 100 possessions**.

### Why "per 100 possessions" matters

Imagine two teams:
- **Team Fast**: Scores 85 points per game, plays at 75 possessions per game
- **Team Slow**: Scores 65 points per game, plays at 55 possessions per game

Team Fast scores more total points, but who's actually better at scoring?

```
Team Fast: 85 points / 75 possessions = 1.13 points per possession
Team Slow: 65 points / 55 possessions = 1.18 points per possession
```

Team Slow is actually MORE efficient! They score more per opportunity. Raw points are misleading because fast teams get more chances.

### The two numbers

For each team, we compute:
- **Adjusted Offensive Efficiency (adjOE)**: points scored per 100 possessions
- **Adjusted Defensive Efficiency (adjDE)**: points ALLOWED per 100 possessions

A great team has **high offense** (they score a lot) and **low defense** (they don't let opponents score).

### Efficiency Margin

```
Efficiency Margin = adjOE - adjDE
```

This is the single most important number in college basketball analytics.

| Efficiency Margin | What It Means | Example |
|------------------|---------------|---------|
| +25 or higher | Elite team, national title contender | Duke, UConn |
| +15 to +25 | Very good, Sweet 16 caliber | Houston, Iowa St |
| +5 to +15 | Solid tournament team | Louisville, BYU |
| 0 to +5 | Bubble team or low seed | Utah St, Missouri |
| Below 0 | Below average | Most non-tournament teams |

### How we estimate possessions

We don't have a "possessions" column in the data. We estimate it from box scores:

```
Possessions ≈ Field Goal Attempts - Offensive Rebounds + Turnovers + (0.475 × Free Throw Attempts)
```

**Why this formula works:**

A possession ends when you either:
1. **Shoot** (field goal attempt) — unless you get your own rebound (offensive rebound)
2. **Turn it over** (turnover)
3. **Go to the free throw line** — but not every free throw ends a possession (and-1s, technical fouls), so we multiply by 0.475 instead of 1.0

So: `shots taken - got-your-own-rebound-back + gave-it-away + partial-free-throws` ≈ total possessions.

### Recency weighting

Not all games are created equal. A team's performance in February matters more than November. Players get injured, chemistry develops, coaches adjust.

We apply **exponential weighting**:

```
weight = e^(dayNum / maxDayNum × 2)
```

In human terms:
- **A game on the last day of the season** counts about **7.4 times** more than a game on the first day
- **A mid-season game** counts about **2.7 times** more
- This captures teams that are **peaking** (getting hot) vs **slumping** (falling apart)

### Converting efficiency to win probability

Now we have an efficiency margin for each team. How do we turn that into a probability?

The **logistic function**:

```
P(Team A wins) = 1 / (1 + 10^(-(marginA - marginB) / 11))
```

Don't panic. Let me break this down piece by piece.

**Step 1: Find the gap**
```
gap = marginA - marginB
```
If Duke has margin +25 and Siena has margin -5, the gap is 30.

**Step 2: Scale the gap**
```
scaled = gap / 11
```
The number 11 comes from calibrating against years of college basketball data. It means "an 11-point efficiency gap translates to roughly a 72% win probability." We divide by 11 to normalize.

For Duke vs Siena: `30 / 11 = 2.73`

**Step 3: Apply the formula**
```
P = 1 / (1 + 10^(-2.73))
P = 1 / (1 + 10^(-2.73))
P = 1 / (1 + 0.00186)
P = 1 / 1.00186
P = 0.998 → 99.8%
```

**Why this formula and not something simpler?**

You might think: "Why not just say whoever has the higher margin wins 100%?" Because basketball has randomness. The better team doesn't always win. The logistic function captures this — it gives high confidence when the gap is huge, moderate confidence when teams are close, and 50/50 when teams are equal.

Here's what different gaps produce:

| Efficiency Gap | Probability | In English |
|---------------|-------------|-----------|
| 0 | 50.0% | Dead even |
| 3 | 55.8% | Slight edge |
| 5 | 61.1% | Small favorite |
| 10 | 71.9% | Solid favorite |
| 15 | 81.2% | Clear favorite |
| 20 | 88.0% | Strong favorite |
| 30 | 95.3% | Dominant |

**Why base 10?** The logistic function can use any base. Base 10 is common in sports analytics because it maps nicely to "orders of magnitude" of team strength. Other fields use base `e` (2.718). The principle is identical — only the scaling factor changes.

---

## Expert 2: The Bradley-Terry Expert

### What it looks at
Who beat whom. Not how efficient they were — just wins and losses.

### The key insight
Beating a strong team should count more than beating a weak team. But how do you know who's strong? By looking at who THEY beat. It's circular — and that's exactly what Bradley-Terry solves.

### How it works (a story)

Imagine you're ranking 5 teams. You start by assuming they're all equally strong (strength = 1.0 each).

**Round 1 of adjustments:**

Team A won 8 out of 10 games. But given everyone's current strength (1.0), we'd EXPECT them to win 5 out of 10 (50% chance each game). They won MORE than expected, so we increase their strength:

```
new_strength = actual_wins / expected_wins × old_strength
new_strength = 8 / 5 × 1.0 = 1.6
```

Team B won 3 out of 10 games. We expected 5. They won FEWER than expected:

```
new_strength = 3 / 5 × 1.0 = 0.6
```

**Round 2 of adjustments:**

Now Team A has strength 1.6 and Team B has strength 0.6. We recalculate expected wins using these NEW strengths.

If Team C played against both A and B:
- vs Team A (1.6): Expected win probability = C's strength / (C's strength + 1.6)
- vs Team B (0.6): Expected win probability = C's strength / (C's strength + 0.6)

Now beating Team A counts for more, and beating Team B counts for less. We adjust everyone's strength again.

**Repeat 100 times.**

After 100 rounds, the strengths stabilize. A team that went 25-5 against a brutal schedule might end up with strength 3.0. A team that went 28-2 against a weak schedule might only be 2.0.

### Converting to win probability

Once we have strengths:

```
P(A beats B) = strength_A / (strength_A + strength_B)
```

If Duke has strength 3.5 and Siena has strength 0.8:

```
P = 3.5 / (3.5 + 0.8) = 3.5 / 4.3 = 81.4%
```

**Why this matters:** Two teams can have identical efficiency margins but very different Bradley-Terry ratings. A team from a weak conference might have great efficiency numbers (they crushed bad teams), but Bradley-Terry knows their wins weren't impressive because their opponents were weak.

---

## Expert 3: The Seed Expert

### What it looks at
The number the NCAA committee assigned to each team (1-16, where 1 is best).

### Why include this?
The committee watches every game, reads every scouting report, and considers things our stats can't see — injuries reported that morning, team chemistry, coaching drama, travel advantages. Their seed is informed expert judgment.

### The formula

```
P(Team A wins) = 1 / (1 + 10^((seedA - seedB) / 5))
```

Same logistic shape as KenPom, but using seeds instead of efficiency. The /5 scaling means:

| Seed Matchup | Probability |
|-------------|-------------|
| 1 vs 16 | 99.0% |
| 1 vs 8 | 83.4% |
| 4 vs 5 | 44.0% |
| 5 vs 12 | 83.4% |
| 8 vs 9 | 44.0% |

**Wait — 5 vs 12 at 83%?** But historically 12-seeds win 35% of the time! That's why this model gets a LOW weight (10%) in the blend. It's directionally useful but poorly calibrated on its own.

### For non-tournament teams
Teams without a seed (didn't make the tournament) get a default seed of 8.5 — right in the middle. This makes the seed model basically say "I don't know" for those matchups, which is the right answer.

---

## Expert 4: The Momentum Expert

### What it looks at
Did the team win their conference tournament?

### Why it matters
A team that just won 3-4 games in 3-4 days to become conference champion enters March Madness with momentum, confidence, and game-sharpness. A team that lost in their first conference tournament game might be deflated.

### How we use it

```
If Team A is a conference champion and Team B is not:
  Add 0.03 to Team A's probability (3% boost)

If Team B is the champion:
  Subtract 0.03 from Team A's probability
```

That's it. A small, simple nudge. We don't overthink it — it's a noisy signal (small sample size), so it gets a small weight.

---

## Blending the Experts Together

Now we have four probabilities for each matchup. We blend them with weights:

```
Final = 0.55 × KenPom + 0.30 × Bradley-Terry + 0.10 × Seed + 0.05 × Momentum
```

### Why these weights?

- **KenPom gets 55%** because efficiency margin is the single most proven predictor of college basketball outcomes. It's been validated over 20+ years by the analytics community.

- **Bradley-Terry gets 30%** because it captures something efficiency misses — strength of schedule. A team that's efficient against bad opponents isn't as impressive as one that's efficient against good opponents.

- **Seeds get 10%** because committee judgment adds real value, but it's noisy and sometimes political. A 10% voice in the conversation is about right.

- **Momentum gets 5%** because conference tournament results are a real signal, but it's a tiny sample (3-4 games) so we don't trust it much.

### Example: Duke (#1 seed) vs Northern Iowa (#12 seed)

```
KenPom says:  Duke 91.2%  (efficiency gap is huge)
Bradley-Terry: Duke 85.3%  (Duke beat great teams, UNI played a weaker schedule)
Seeds say:    Duke 83.4%  (1 vs 12 historical advantage)
Momentum:     50% + 0.03 = 53% (UNI won their conf tourney, Duke didn't)

Final = 0.55 × 0.912 + 0.30 × 0.853 + 0.10 × 0.834 + 0.05 × 0.53
     = 0.502 + 0.256 + 0.083 + 0.027
     = 0.868 → Duke 86.8%
```

Notice how the momentum expert slightly pulled Duke's number down (because Northern Iowa won their conference tournament). But KenPom and Bradley-Terry overwhelm it because the efficiency gap is so large.

---

## The Variants: What Changes?

We generate multiple submissions by adjusting the blend:

### Upset-Heavy Variant
After calculating the blended probability, we **push it 20% toward 0.50**:

```
adjusted = prediction + (0.50 - prediction) × 0.20
```

If we predicted Duke 86.8%:
```
adjusted = 0.868 + (0.50 - 0.868) × 0.20
         = 0.868 + (-0.368) × 0.20
         = 0.868 - 0.074
         = 0.794 → Duke 79.4%
```

This makes every prediction less extreme — more room for upsets. We're saying "I'm less sure than my models suggest."

**When this wins:** Tournaments with lots of upsets (like 2023 when FDU beat Purdue and Princeton made the Sweet 16).

### Chalk-Heavy Variant
We **push 15% AWAY from 0.50**:

```
adjusted = prediction + (0.50 - prediction) × (-0.15)
```

Duke goes from 86.8% to:
```
adjusted = 0.868 + (-0.368) × (-0.15)
         = 0.868 + 0.055
         = 0.923 → Duke 92.3%
```

This makes predictions more extreme — stronger favorites get even higher probabilities. We're saying "I'm MORE sure than my models suggest."

**When this wins:** Chalk tournaments where the favorites dominate (like 2008 when all four #1 seeds made the Final Four).

### Bradley-Terry Heavy Variant
Same blend concept, but BT gets 50% weight instead of 30%, and KenPom drops to 35%.

**When this wins:** When strength of schedule matters more than raw efficiency — when big-conference teams outperform mid-majors despite similar stat lines.

---

## The Safety Clamp

Every prediction gets clamped:

```
prediction = max(0.01, min(0.99, prediction))
```

We NEVER predict 0.00 or 1.00. Why?

The scoring formula (Brier Score) calculates:
```
penalty = (prediction - actual)²
```

If you predict 1.00 (100% certain Team A wins) and Team A LOSES:
```
penalty = (1.00 - 0)² = 1.00 → Maximum possible penalty
```

If you predict 0.99 (99% certain) and Team A loses:
```
penalty = (0.99 - 0)² = 0.98 → Still terrible, but not the worst
```

If you predict 0.95 and Team A loses:
```
penalty = (0.95 - 0)² = 0.90 → Bad but survivable
```

**The rule:** Leave room for miracles. UMBC beat #1 Virginia in 2018. FDU beat #1 Purdue in 2023. A 16-seed has beaten a 1-seed twice in history — it's rare but real. If you say it's impossible (1.00) and it happens, your score takes the maximum hit.

---

## Putting It All Together

When you run the submission generator, here's the flow for ONE row:

```
1. Read IDs: "2026_1181_1373" → Duke (1181) vs Siena (1373)

2. Look up Duke's stats:
   - adjOE: 121.3, adjDE: 94.1, margin: +27.2
   - Bradley-Terry strength: 3.8
   - Seed: 1
   - Won conference tourney: No

3. Look up Siena's stats:
   - adjOE: 105.2, adjDE: 108.7, margin: -3.5
   - Bradley-Terry strength: 0.6
   - Seed: 16
   - Won conference tourney: Yes

4. Ask each expert:
   - KenPom: 1/(1+10^(-(27.2-(-3.5))/11)) = 97.8%
   - Bradley-Terry: 3.8/(3.8+0.6) = 86.4%
   - Seed: 1/(1+10^((1-16)/5)) = 99.0%
   - Momentum: 50% - 3% = 47% (Siena is conf champ, slight boost)

5. Blend:
   0.55 × 0.978 + 0.30 × 0.864 + 0.10 × 0.990 + 0.05 × 0.47
   = 0.538 + 0.259 + 0.099 + 0.024
   = 0.920

6. Clamp: max(0.01, min(0.99, 0.920)) = 0.920

7. Write: "2026_1181_1373,0.920000"
```

Repeat 132,132 times. That's your submission.

---

## Your Submission Strategy

| Submission | Description | Best When |
|-----------|-------------|-----------|
| **Ensemble** (submitted) | Balanced blend of all 4 experts | Most tournaments |
| **Simple** | KenPom only, no blend | When efficiency is all that matters |
| **Upset-heavy** | Predictions pushed toward 50/50 | Wild tournament with lots of upsets |
| **Chalk-heavy** | Predictions pushed toward extremes | Favorites dominate |
| **BT-heavy** | Bradley-Terry gets 50% weight | Strength of schedule matters most |

**Select 2 final submissions.** Pick the ensemble (safe baseline) plus whichever variant matches your gut feeling about this year's tournament.

---

*Generated by AgentMadness · March 2026*
