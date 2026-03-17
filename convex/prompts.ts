import type { Doc } from "./_generated/dataModel";

// ─── Types ────────────────────────────────────────────────────────────────────

type Team = Doc<"teams">;

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
  const matchupKey = getMatchupKey(favorite.seed, underdog.seed);
  const rates = upsetRates ?? DEFAULT_UPSET_RATES;
  const historicalRate = rates[matchupKey] ?? DEFAULT_UPSET_RATES[matchupKey] ?? 0.15;

  // Efficiency differential: higher = better for favorite
  const favEff = favorite.adjOE - favorite.adjDE;
  const undEff = underdog.adjOE - underdog.adjDE;
  const effGap = favEff - undEff;
  // Normalize: typical gap range ~[-30, 30]
  const normalizedEffGap = clamp((effGap + 30) / 60, 0, 1);

  // Combined volatility: higher = more random
  const combinedVol = (favorite.volatility + underdog.volatility) / 2;
  // Normalize: typical range [8, 25]
  const normalizedCombinedVol = clamp((combinedVol - 8) / 17, 0, 1);

  // Tournament experience gap: higher = better for favorite
  const expGap = favorite.tournamentExperience - underdog.tournamentExperience;
  // Normalize: typical range [-20, 40]
  const normalizedExpGap = clamp((expGap + 20) / 60, 0, 1);

  // Weighted upset probability formula
  const upsetProb =
    historicalRate * 0.35 +
    (1 - normalizedEffGap) * 0.30 +
    normalizedCombinedVol * 0.20 +
    (1 - normalizedExpGap) * 0.10;

  return clamp(upsetProb, 0.02, 0.98);
}

// ─── Prompt Builder ───────────────────────────────────────────────────────────

export function buildRefereePrompt(
  teamA: Team,
  teamB: Team,
  upsetRates?: Record<string, number>
): string {
  // Determine favorite (lower seed number = better)
  const favorite = teamA.seed <= teamB.seed ? teamA : teamB;
  const underdog = teamA.seed <= teamB.seed ? teamB : teamA;

  const upsetProb = computeUpsetProbability(favorite, underdog, upsetRates);
  const favoriteWinProb = clamp(1 - upsetProb, 0.02, 0.98);

  const formatTeam = (team: Team, label: string): string => {
    return `## ${label}: ${team.name} (Seed #${team.seed})
- Region: ${team.region}
- Conference: ${team.conference.toUpperCase()}
- Record: ${team.record}
- NET Ranking: ${team.netRanking || "N/A"}
- Adjusted Offensive Efficiency: ${team.adjOE.toFixed(1)}
- Adjusted Defensive Efficiency: ${team.adjDE.toFixed(1)}
- Net Efficiency: ${(team.adjOE - team.adjDE).toFixed(1)}
- Adjusted Tempo: ${team.adjTempo.toFixed(1)}
- Volatility: ${team.volatility.toFixed(1)}
- Tournament Experience: ${team.tournamentExperience} tournament appearances
- Clutch Rating: ${team.clutchRating}/10
- Depth Score: ${team.depthScore}/10
- Key Players: ${team.keyPlayers}
- Style Traits: ${team.styleTraits.join(", ")}
${team.perplexityContext ? `- Context: ${team.perplexityContext}` : ""}`;
  };

  return `You are a March Madness referee AI simulating a tournament game. Your task is to produce a realistic and narratively engaging game result in JSON format.

${formatTeam(teamA, "Team A")}

${formatTeam(teamB, "Team B")}

## Game Analysis

Favorite: ${favorite.name} (Seed #${favorite.seed}) — Win Probability: ${(favoriteWinProb * 100).toFixed(1)}%
Underdog: ${underdog.name} (Seed #${underdog.seed}) — Upset Probability: ${(upsetProb * 100).toFixed(1)}%

This upset probability is a hard constraint derived from historical seed matchup rates, efficiency differentials, team volatility, and tournament experience. You MUST respect this probability when determining the winner. Specifically:
- If you choose the underdog to win, it should only happen approximately ${(upsetProb * 100).toFixed(0)}% of the time
- The favorite (${favorite.name}) should win approximately ${(favoriteWinProb * 100).toFixed(0)}% of the time

## Instructions

Simulate this game as if it just happened in the NCAA Tournament. Create a compelling, realistic narrative that reflects both teams' actual strengths, weaknesses, and playing styles.

Scores should be realistic for college basketball (typically 60-90 points, close games within 5-10 points for upsets, larger margins for expected outcomes).

The MVP should be a player who had a decisive impact (use names from keyPlayers if available, otherwise invent a realistic player name).

The keyMoment should describe the single most important play or sequence that decided the game.

The gameNarrative should be 2-3 sentences capturing the game's story arc.

## Required Output

Respond with ONLY valid JSON (no markdown, no explanation) in this exact format:
{
  "winner": "<team name — must be exactly '${teamA.name}' or '${teamB.name}'>",
  "loser": "<team name — the other team>",
  "winnerScore": <integer>,
  "loserScore": <integer>,
  "isUpset": <boolean — true if the underdog (${underdog.name}) wins>,
  "upsetMagnitude": <number from 1-10 indicating how shocking the upset was, or 0 if no upset>,
  "mvp": "<player name>",
  "keyMoment": "<1-2 sentence description of the decisive moment>",
  "gameNarrative": "<2-3 sentence narrative of the game>",
  "winProbability": <decimal probability that the winner was favored to win, e.g. 0.75>
}`;
}
