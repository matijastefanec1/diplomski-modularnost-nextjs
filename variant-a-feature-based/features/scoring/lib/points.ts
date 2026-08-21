export type MatchSide = "A" | "B";

export type PlayerScoringInput = {
  readonly playerId: string;
  readonly pointsBefore: number;
  readonly scoredMatchesInWindow: number;
};

export type MatchSidePlayers = readonly [PlayerScoringInput, PlayerScoringInput];

export type MatchScoringInput = {
  readonly teamA: MatchSidePlayers;
  readonly teamB: MatchSidePlayers;
  readonly winningSide: MatchSide;
};

export type PointsAward = {
  readonly playerId: string;
  readonly basePoints: number;
  readonly activityBonus: number;
  readonly totalPoints: number;
};

// rubovi uključivi, razlika točno 100 daje 30 bodova
const STRENGTH_GAP = 100;
const WIN_VS_STRONGER = 30;
const WIN_VS_SIMILAR = 20;
const WIN_VS_WEAKER = 12;
const LOSS_VS_STRONGER = 5;
const LOSS = 0;
const ACTIVITY_BONUS = 5;
const MIN_MATCHES_FOR_BONUS = 3;

export function sideStrength(players: MatchSidePlayers): number {
  return Math.round((players[0].pointsBefore + players[1].pointsBefore) / 2);
}

// R = snaga protivnika - naša snaga
// veliki pozitivan R nosi najviše bodova (ja sam autsajder)
// veliki negativan R nosi najmanje bodova (ja sam favorit)
function calcBasePoints(won: boolean, strengthDifference: number): number {
  if (!won) {
    return strengthDifference >= STRENGTH_GAP
      ? LOSS_VS_STRONGER
      : LOSS;
  }

  if (strengthDifference >= STRENGTH_GAP) {
    return WIN_VS_STRONGER;
  }

  if (strengthDifference <= -STRENGTH_GAP) {
    return WIN_VS_WEAKER;
  }

  return WIN_VS_SIMILAR;
}

function activityBonusFor(player: PlayerScoringInput): number {
  // +1 jer aktualni meč još nije SCORED (baza ga ne broji)
  const matchesInWindow = player.scoredMatchesInWindow + 1;
  return matchesInWindow >= MIN_MATCHES_FOR_BONUS ? ACTIVITY_BONUS : 0;
}

function toAward(
  player: PlayerScoringInput,
  won: boolean,
  strengthDifference: number,
): PointsAward {
  const basePoints = calcBasePoints(won, strengthDifference);
  const activityBonus = activityBonusFor(player);

  return {
    playerId: player.playerId,
    basePoints,
    activityBonus,
    totalPoints: basePoints + activityBonus,
  };
}

export function assignMatchPoints(
  input: MatchScoringInput,
): readonly PointsAward[] {
  const strengthA = sideStrength(input.teamA);
  const strengthB = sideStrength(input.teamB);
  const teamAWon = input.winningSide === "A";

  return [
    ...input.teamA.map((player) =>
      toAward(player, teamAWon, strengthB - strengthA),
    ),
    ...input.teamB.map((player) =>
      toAward(player, !teamAWon, strengthA - strengthB),
    ),
  ];
}
