import type {
  MatchResultViolation,
  MatchSets,
} from "../../domain/match/match-result";
import { validateMatchResult } from "../../domain/match/match-result";
import { isPlayerId } from "../../domain/player/player-id";
import type { MatchRepository } from "../ports/match-repository";
import type { PlayerRepository } from "../ports/player-repository";

export type RecordMatchInput = {
  reporterId: string;
  partnerId: string;
  opponentOneId: string;
  opponentTwoId: string;
  sets: MatchSets;
};

export type RecordMatchResult =
  | { status: "recorded"; matchId: string }
  | { status: "duplicate-players"; playerIds: readonly string[] }
  | { status: "unknown-players"; playerIds: readonly string[] }
  | { status: "invalid-result"; violations: readonly MatchResultViolation[] };

export class RecordMatch {
  constructor(
    private readonly matches: MatchRepository,
    private readonly players: PlayerRepository,
  ) {}

  async execute(input: RecordMatchInput): Promise<RecordMatchResult> {
    const chosenIds = [
      input.partnerId,
      input.opponentOneId,
      input.opponentTwoId,
    ];

    const duplicates = chosenIds.filter(
      (id, index) =>
        id === input.reporterId || chosenIds.indexOf(id) !== index,
    );

    if (duplicates.length > 0) {
      return { status: "duplicate-players", playerIds: duplicates };
    }

    const violations = validateMatchResult(input.sets);

    if (violations.length > 0) {
      return { status: "invalid-result", violations };
    }

    const malformed = chosenIds.filter((id) => !isPlayerId(id));

    if (malformed.length > 0) {
      return { status: "unknown-players", playerIds: malformed };
    }

    const existingIds = new Set(await this.players.findExistingIds(chosenIds));
    const unknown = chosenIds.filter((id) => !existingIds.has(id));

    if (unknown.length > 0) {
      return { status: "unknown-players", playerIds: unknown };
    }

    const match = await this.matches.create({
      reporterId: input.reporterId,
      participants: [
        { playerId: input.reporterId, side: "A" },
        { playerId: input.partnerId, side: "A" },
        { playerId: input.opponentOneId, side: "B" },
        { playerId: input.opponentTwoId, side: "B" },
      ],
      sets: input.sets,
    });

    return { status: "recorded", matchId: match.id };
  }
}
