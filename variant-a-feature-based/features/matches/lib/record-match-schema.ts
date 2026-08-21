import { z } from "zod";

import {
  validateMatchResult,
  type MatchSets,
  type SetScore,
} from "./match-result";

export const PARTNER_REQUIRED_MESSAGE = "Odaberi suigrača.";
export const OPPONENT_REQUIRED_MESSAGE = "Odaberi protivnika.";
export const DUPLICATE_PLAYER_MESSAGE = "Isti igrač ne može biti odabran dvaput.";
export const UNKNOWN_PLAYER_MESSAGE = "Odabrani igrač ne postoji.";
export const SET_GAMES_MISSING_MESSAGE = "Unesi broj gemova za obje strane.";
export const SET_SCORE_INVALID_MESSAGE = "Rezultat seta nije valjan. Dopušteni su 6:0 do 6:4, 7:5 i 7:6.";
export const THIRD_SET_NOT_ALLOWED_MESSAGE = "Treći set nije dopušten jer je meč odlučen nakon dva seta.";
export const MISSING_THIRD_SET_MESSAGE = "Unesi treći set jer je nakon dva seta rezultat 1:1.";

export type RecordMatchSubmission = {
  partnerId: string;
  opponentOneId: string;
  opponentTwoId: string;
  set1Own: string;
  set1Opponent: string;
  set2Own: string;
  set2Opponent: string;
  set3Own: string;
  set3Opponent: string;
};

export const emptyRecordMatchSubmission: RecordMatchSubmission = {
  partnerId: "",
  opponentOneId: "",
  opponentTwoId: "",
  set1Own: "",
  set1Opponent: "",
  set2Own: "",
  set2Opponent: "",
  set3Own: "",
  set3Opponent: "",
};

export type RecordMatchField =
  | "partner"
  | "opponentOne"
  | "opponentTwo"
  | "set1"
  | "set2"
  | "set3";

export type RecordMatchFormState = {
  errors: Partial<Record<RecordMatchField, string>>;
  values: RecordMatchSubmission;
};

export type RecordMatchInput = {
  partnerId: string;
  opponentOneId: string;
  opponentTwoId: string;
  sets: MatchSets;
};

const GAMES_PATTERN = /^\d{1,2}$/;

const playerIdSchema = z.uuid();

function isPlayerIdShape(value: string): boolean {
  return playerIdSchema.safeParse(value).success;
}

function parseGames(value: string): number | null {
  const trimmed = value.trim();

  return GAMES_PATTERN.test(trimmed) ? Number(trimmed) : null;
}

function participantSchema(missingMessage: string) {
  return z
    .string({ error: missingMessage })
    .trim()
    .min(1, { error: missingMessage })
    .refine(isPlayerIdShape, { error: UNKNOWN_PLAYER_MESSAGE });
}

const gamesField = z
  .string({ error: SET_GAMES_MISSING_MESSAGE })
  .refine((value) => parseGames(value) !== null, {
    error: SET_GAMES_MISSING_MESSAGE,
  });

function readThirdSet(value: RecordMatchSubmission): SetScore | null {
  const teamAGames = parseGames(value.set3Own);
  const teamBGames = parseGames(value.set3Opponent);

  if (teamAGames === null || teamBGames === null) {
    return null;
  }
  return { teamAGames, teamBGames };
}

function isThirdSetStarted(value: RecordMatchSubmission): boolean {
  return value.set3Own.trim() !== "" || value.set3Opponent.trim() !== "";
}

function toMatchSets(value: RecordMatchSubmission): MatchSets {
  const first: SetScore = {
    teamAGames: Number(value.set1Own.trim()),
    teamBGames: Number(value.set1Opponent.trim()),
  };
  const second: SetScore = {
    teamAGames: Number(value.set2Own.trim()),
    teamBGames: Number(value.set2Opponent.trim()),
  };
  const third = readThirdSet(value);

  return third === null ? [first, second] : [first, second, third];
}

function participantViolations(
  value: RecordMatchSubmission,
  reporterId: string,
): readonly { field: string; message: string }[] {
  const selections = [
    { field: "partnerId", id: value.partnerId.trim() },
    { field: "opponentOneId", id: value.opponentOneId.trim() },
    { field: "opponentTwoId", id: value.opponentTwoId.trim() },
  ];
  const seen = new Set<string>([reporterId]);
  const violations: { field: string; message: string }[] = [];

  for (const selection of selections) {
    if (seen.has(selection.id)) {
      violations.push({
        field: selection.field,
        message: DUPLICATE_PLAYER_MESSAGE,
      });
      continue;
    }

    seen.add(selection.id);
  }

  return violations;
}

export function recordMatchSchema(reporterId: string) {
  return z
    .object({
      partnerId: participantSchema(PARTNER_REQUIRED_MESSAGE),
      opponentOneId: participantSchema(OPPONENT_REQUIRED_MESSAGE),
      opponentTwoId: participantSchema(OPPONENT_REQUIRED_MESSAGE),
      set1Own: gamesField,
      set1Opponent: gamesField,
      set2Own: gamesField,
      set2Opponent: gamesField,
      set3Own: z.string(),
      set3Opponent: z.string(),
    })
    .superRefine((value, ctx) => {
      for (const violation of participantViolations(value, reporterId)) {
        ctx.addIssue({
          code: "custom",
          message: violation.message,
          path: [violation.field],
        });
      }

      if (isThirdSetStarted(value) && readThirdSet(value) === null) {
        ctx.addIssue({
          code: "custom",
          message: SET_GAMES_MISSING_MESSAGE,
          path: ["set3Own"],
        });
        return;
      }

      for (const violation of validateMatchResult(toMatchSets(value))) {
        if (violation.code === "INVALID_SET_SCORE") {
          ctx.addIssue({
            code: "custom",
            message: SET_SCORE_INVALID_MESSAGE,
            path: [`set${violation.setNumber}Own`],
          });
          continue;
        }

        ctx.addIssue({
          code: "custom",
          message:
            violation.code === "THIRD_SET_NOT_ALLOWED"
              ? THIRD_SET_NOT_ALLOWED_MESSAGE
              : MISSING_THIRD_SET_MESSAGE,
          path: ["set3Own"],
        });
      }
    })
    .transform(
      (value): RecordMatchInput => ({
        partnerId: value.partnerId.trim(),
        opponentOneId: value.opponentOneId.trim(),
        opponentTwoId: value.opponentTwoId.trim(),
        sets: toMatchSets(value),
      }),
    );
}

const fieldBySubmissionKey: Record<string, RecordMatchField> = {
  partnerId: "partner",
  opponentOneId: "opponentOne",
  opponentTwoId: "opponentTwo",
  set1Own: "set1",
  set1Opponent: "set1",
  set2Own: "set2",
  set2Opponent: "set2",
  set3Own: "set3",
  set3Opponent: "set3",
};

type ValidationIssue = {
  readonly path: readonly PropertyKey[];
  readonly message: string;
};

export function toRecordMatchFieldErrors(
  issues: readonly ValidationIssue[],
): RecordMatchFormState["errors"] {
  const errors: RecordMatchFormState["errors"] = {};

  for (const issue of issues) {
    const [key] = issue.path;
    const field = typeof key === "string" ? fieldBySubmissionKey[key] : undefined;

    if (field !== undefined && errors[field] === undefined) {
      errors[field] = issue.message;
    }
  }

  return errors;
}
