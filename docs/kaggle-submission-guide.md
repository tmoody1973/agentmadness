# Understanding Your Kaggle Submission File

*A beginner's guide to what's inside the CSV, why it looks the way it does, and why we submit two versions.*

---

## What's in the CSV file?

Open `scripts/output/kaggle-submission-stage2.csv` and you'll see something like this:

```
ID,Pred
2026_1101_1102,0.870117
2026_1101_1103,0.132939
2026_1101_1104,0.055197
2026_1181_1373,0.987234
```

That's it — just two columns: **ID** and **Pred**. Let's break down what each means.

---

## Column 1: ID

The ID tells Kaggle which two teams you're predicting. The format is:

```
2026_1181_1373
 │     │     │
 │     │     └── Team B's ID (higher number always second)
 │     └──────── Team A's ID (lower number always first)
 └────────────── The year (2026)
```

**Important rule:** The lower team ID is ALWAYS first. So if Duke is team 1181 and Siena is team 1373, the ID is `2026_1181_1373` — never `2026_1373_1181`.

**Where do these team IDs come from?** The Kaggle dataset has a file called `MTeams.csv` that maps IDs to names:

```
1181 = Duke
1373 = Siena
1104 = Alabama
1222 = Houston
```

Men's teams are in the 1100-1499 range. Women's teams are in the 3100-3499 range. Your file includes BOTH.

---

## Column 2: Pred

This is **your prediction** — the probability that **Team A** (the lower ID) beats **Team B** (the higher ID).

```
2026_1181_1373,0.987234
```

This line says: "I predict Duke (1181) has a **98.7% chance** of beating Siena (1373)."

Some examples of what different values mean:

| Pred Value | What You're Saying |
|-----------|-------------------|
| 0.99 | "Team A almost certainly wins" |
| 0.75 | "Team A is a solid favorite" |
| 0.50 | "It's a coin flip — I have no idea" |
| 0.25 | "Team B is a solid favorite" |
| 0.01 | "Team B almost certainly wins" |

**Notice:** A prediction of 0.25 for Team A means you think Team B has a 75% chance. The value is always FROM Team A's perspective.

---

## Why 132,132 rows?

You're not just predicting the games that will actually happen in the tournament. You're predicting **every possible pairing** of every tournament team.

- 68 men's tournament teams → every pair = 68 × 67 / 2 = **2,278 pairs**
- 68 women's tournament teams → every pair = **2,278 pairs**

But the file also includes teams from past seasons (2022-2025) for validation. That's why there are 132,132 total rows.

Kaggle only SCORES the rows where the game actually happens in the 2026 tournament. The rest are ignored. But you still have to submit predictions for all of them.

---

## How Kaggle Scores You

After each real tournament game, Kaggle checks your prediction:

**The scoring formula (Brier Score):**
```
Score = (prediction - actual result)²
```

Where `actual result` is 1 if Team A won, 0 if Team B won.

**Example: Duke (1181) vs Siena (1373)**

You predicted: `0.987` (Duke wins 98.7% of the time)

- **If Duke wins** (actual = 1): Score = (0.987 - 1)² = **0.000169** → Tiny penalty. Great!
- **If Siena wins** (actual = 0): Score = (0.987 - 0)² = **0.974169** → MASSIVE penalty. Ouch.

**Example: A 5-seed vs 12-seed matchup**

You predicted: `0.65` (5-seed wins 65%)

- **If 5-seed wins** (actual = 1): Score = (0.65 - 1)² = **0.1225** → Small-medium penalty
- **If 12-seed wins** (actual = 0): Score = (0.65 - 0)² = **0.4225** → Medium penalty

**The lesson:** Being confident and RIGHT is rewarded. Being confident and WRONG is punished severely. Being wishy-washy (0.50) is safe but won't win the competition.

Your final score is the **average** of all these penalties across every game actually played. **Lower score = better.**

---

## Why We Clamp to [0.01, 0.99]

You might wonder: why not predict 1.0 for Duke over a 16-seed? Because:

```
If Duke loses and you predicted 1.0:
Score = (1.0 - 0)² = 1.0  ← Maximum possible penalty for ONE game
```

And with log loss (used in some variants of this competition):
```
log(1.0 - 1.0) = log(0) = NEGATIVE INFINITY
```

**One overconfident wrong prediction destroys your entire submission.** That's why we clamp every prediction to [0.01, 0.99]. We never say "impossible" because in March Madness, nothing is impossible (ask UMBC, who beat #1 Virginia in 2018).

---

## Why Submit TWO Models?

Kaggle lets you select **2 final submissions** for scoring. This is your insurance policy.

### The Ensemble Model (your primary submission)
This blends 4 different approaches:
- **55% KenPom efficiency** — how many points teams score/allow per 100 possessions
- **30% Bradley-Terry** — iterative strength ratings from game results
- **10% Seed-based** — NCAA committee's expert judgment
- **5% Conference tournament** — recent momentum

This model is **calibrated** — it's cautious where the data is uncertain and confident where the data is clear. It should perform well on average.

### The Simple Model (your backup submission)
This uses ONLY efficiency margin:
```
P(Team A wins) = 1 / (1 + 10^(-(effA - effB) / 11))
```

It's simpler and sometimes simpler is better. If the ensemble model's extra signals (Bradley-Terry, seeds, conf tourney) add noise instead of signal, the simple model might win.

### Why both?
You don't know in advance which will score better. By submitting both:
- If the tournament plays out normally (favorites mostly win) → ensemble probably wins
- If there's unusual chaos (tons of upsets) → simple model might be more robust
- Kaggle takes your **better-scoring** submission for prizes, so you can't lose by having a backup

It's like hedging your bet. Zero downside, potential upside.

---

## What Happens After You Submit

1. **Before games start:** Leaderboard shows 0.0 for everyone (no games to score yet)
2. **As games are played:** Your score updates automatically. You don't need to do anything.
3. **After the tournament ends (~April 6):** Final scores are calculated. Top entries win prizes from the $50,000 pool.
4. **You cannot change your predictions after March 19.** What you submit is final.

---

## Quick Cheat Sheet

| Question | Answer |
|----------|--------|
| What file do I upload? | `scripts/output/kaggle-submission-stage2.csv` |
| How many rows? | 132,133 (1 header + 132,132 predictions) |
| What's in each row? | Team A ID, Team B ID, probability A beats B |
| Score range? | 0 (perfect) to 1 (worst). Lower is better. |
| How many submissions? | 5 per 12 hours. Select 2 as final. |
| Deadline? | March 19, 2026 |
| Do I update daily? | No. Submit once, you're done. |
| Why two submissions? | Hedge your bet. Kaggle takes your better score. |

---

*Generated by AgentMadness · March 2026*
