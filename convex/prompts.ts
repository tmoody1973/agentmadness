import type { Doc } from "./_generated/dataModel";

// ─── Types ────────────────────────────────────────────────────────────────────

type Team = Doc<"teams">;

export interface SimParams {
  chaosLevel: number;
  homeCourtBoost: number;
  recencyWeight: number;
}

// ─── Default Upset Rates ──────────────────────────────────────────────────────

const DEFAULT_UPSET_RATES: Record<string, number> = {
  "1v16": 0.015,
  "2v15": 0.06,
  "3v14": 0.13,
  "4v13": 0.20,
  "5v12": 0.35,
  "6v11": 0.37,
  "7v10": 0.39,
  "8v9": 0.48,
};

// ─── Upset Probability Calculator ────────────────────────────────────────────

function getMatchupKey(seedA: number, seedB: number): string {
  const lower = Math.min(seedA, seedB);
  const higher = Math.max(seedA, seedB);
  return `${lower}v${higher}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function computeUpsetProbability(
  favorite: Team,
  underdog: Team,
  upsetRates?: Record<string, number>
): number {
  // Same-seed matchups: use efficiency
  if (favorite.seed === underdog.seed) {
    const effFav = favorite.adjOE - favorite.adjDE;
    const effUnd = underdog.adjOE - underdog.adjDE;
    const diff = effFav - effUnd;
    const prob = 1 / (1 + Math.pow(10, -diff / 15));
    return clamp(1 - prob, 0.15, 0.85);
  }

  const matchupKey = getMatchupKey(favorite.seed, underdog.seed);
  const rates = upsetRates ?? DEFAULT_UPSET_RATES;
  const historicalRate = rates[matchupKey] ?? DEFAULT_UPSET_RATES[matchupKey] ?? 0.15;

  // Efficiency differential
  const favEff = favorite.adjOE - favorite.adjDE;
  const undEff = underdog.adjOE - underdog.adjDE;
  const effGap = favEff - undEff;
  const normalizedEffGap = clamp((effGap + 30) / 60, 0, 1);

  // Combined volatility
  const combinedVol = (favorite.volatility + underdog.volatility) / 2;
  const normalizedCombinedVol = clamp((combinedVol - 8) / 17, 0, 1);

  // Tournament experience gap
  const expGap = favorite.tournamentExperience - underdog.tournamentExperience;
  const normalizedExpGap = clamp((expGap + 20) / 60, 0, 1);

  const upsetProb =
    historicalRate * 0.35 +
    (1 - normalizedEffGap) * 0.30 +
    normalizedCombinedVol * 0.20 +
    (1 - normalizedExpGap) * 0.10;

  return clamp(upsetProb, 0.02, 0.98);
}

// ─── Pre-determine winner using Math.random() ───────────────────────────────

export interface PreDeterminedResult {
  winner: Team;
  loser: Team;
  isUpset: boolean;
  upsetMagnitude: number;
  upsetProbability: number;
  favoriteWinProb: number;
}

export function determineWinner(
  teamA: Team,
  teamB: Team,
  upsetRates?: Record<string, number>,
  simParams?: SimParams
): PreDeterminedResult {
  const favorite = teamA.seed <= teamB.seed ? teamA : teamB;
  const underdog = teamA.seed <= teamB.seed ? teamB : teamA;

  const baseUpsetProb = computeUpsetProbability(favorite, underdog, upsetRates);

  // Apply chaos multiplier from sim settings
  let upsetProb = baseUpsetProb;
  if (simParams) {
    const chaosMultiplier = 1 + (simParams.chaosLevel - 50) / 100; // 0.5 to 1.5
    upsetProb = clamp(baseUpsetProb * chaosMultiplier, 0.02, 0.98);
  }

  // THE KEY: Roll the dice! This is where randomness actually happens.
  const roll = Math.random();
  const isUpset = roll < upsetProb;

  const winner = isUpset ? underdog : favorite;
  const loser = isUpset ? favorite : underdog;
  const upsetMagnitude = isUpset ? Math.abs(favorite.seed - underdog.seed) : 0;

  return {
    winner,
    loser,
    isUpset,
    upsetMagnitude,
    upsetProbability: upsetProb,
    favoriteWinProb: 1 - upsetProb,
  };
}

// ─── Prompt Builder (now tells Claude WHO won) ───────────────────────────────

export function buildRefereePrompt(
  teamA: Team,
  teamB: Team,
  predetermined: PreDeterminedResult,
): string {
  const { winner, loser, isUpset, upsetProbability, favoriteWinProb } = predetermined;

  const formatTeam = (team: Team, label: string): string => {
    return `## ${label}: ${team.name} (Seed #${team.seed})
- Region: ${team.region}
- Conference: ${team.conference.toUpperCase()}
- Record: ${team.record}
- Adjusted Offensive Efficiency: ${team.adjOE.toFixed(1)}
- Adjusted Defensive Efficiency: ${team.adjDE.toFixed(1)}
- Net Efficiency: ${(team.adjOE - team.adjDE).toFixed(1)}
- Adjusted Tempo: ${team.adjTempo.toFixed(1)}
- Volatility: ${team.volatility.toFixed(1)}
- Clutch Rating: ${team.clutchRating}/10
- Depth Score: ${team.depthScore}/10
- Key Players: ${team.keyPlayers}
- Style Traits: ${team.styleTraits.join(", ")}
${team.perplexityContext ? `- Context: ${team.perplexityContext}` : ""}`;
  };

  const avgTempo = (teamA.adjTempo + teamB.adjTempo) / 2;

  return `You are writing the recap for an NCAA Tournament game that has ALREADY BEEN DECIDED.

${formatTeam(teamA, "Team A")}

${formatTeam(teamB, "Team B")}

## RESULT (ALREADY DETERMINED — DO NOT CHANGE)

**WINNER: ${winner.name}** (Seed #${winner.seed})
**LOSER: ${loser.name}** (Seed #${loser.seed})
${isUpset ? `\n🔥 THIS IS AN UPSET! A #${winner.seed} seed has knocked off a #${loser.seed} seed! (Historical upset probability was ${(upsetProbability * 100).toFixed(1)}%)` : ""}

## Your Job

Write the game narrative for this result. The winner has ALREADY been decided — your job is to explain HOW and WHY it happened.

1. **Generate realistic scores** based on both teams' tempo (~${avgTempo.toFixed(0)} possessions) and efficiency.
   - ${isUpset ? "This was an upset — make it a close, dramatic game. The underdog likely won by 1-6 points." : "The favorite won — the margin should reflect the efficiency gap. Could be close (1-5 pts) or a blowout (10-20+ pts)."}

2. **Pick an MVP** from the WINNER's key players. Use a real name from their roster.

3. **Write a key moment** — the single play or run that decided the game. Short, punchy, broadcaster style.

4. **Write a 2-3 sentence game narrative** in ESPN broadcast style — vivid, energetic, dramatic. This will be read aloud by a TTS announcer.

RESPOND WITH ONLY THIS JSON (no markdown, no backticks):
{
  "winner": "${winner.name}",
  "loser": "${loser.name}",
  "winnerScore": <realistic integer>,
  "loserScore": <realistic integer>,
  "isUpset": ${isUpset},
  "upsetMagnitude": ${predetermined.upsetMagnitude},
  "mvp": "<player name from winner's roster>",
  "keyMoment": "<1-2 sentence key play>",
  "gameNarrative": "<2-3 sentence broadcast recap>",
  "winProbability": ${favoriteWinProb.toFixed(4)}
}`;
}
