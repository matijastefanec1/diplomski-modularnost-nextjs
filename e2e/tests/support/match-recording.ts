import { expect, type Page, type Locator } from "@playwright/test";

export type SetScoreInput = {
  own: string;
  opponent: string;
};

export type MatchParticipantNames = {
  partner: string;
  opponentOne: string;
  opponentTwo: string;
};

export const MATCH_PATH_PATTERN = /\/matches\/[0-9a-f-]{36}$/u;

export const PARTICIPANT_LABELS = {
  partner: "Suigrač",
  opponentOne: "Prvi protivnik",
  opponentTwo: "Drugi protivnik",
} as const;

export async function openRecordMatchForm(page: Page): Promise<void> {
  await page.goto("/matches/new");

  await expect(page.getByTestId("record-match-page")).toBeVisible();
  await expect(page.getByTestId("record-match-form")).toBeVisible();
}

export async function chooseParticipant(
  page: Page,
  label: string,
  playerName: string,
): Promise<void> {
  const field = page.getByLabel(label, { exact: true });

  await field.fill(playerName);

  await field
    .locator("..")
    .getByRole("option", { name: playerName, exact: true })
    .click();
}

export async function chooseParticipants(
  page: Page,
  names: MatchParticipantNames,
): Promise<void> {
  await chooseParticipant(page, PARTICIPANT_LABELS.partner, names.partner);
  await chooseParticipant(
    page,
    PARTICIPANT_LABELS.opponentOne,
    names.opponentOne,
  );
  await chooseParticipant(
    page,
    PARTICIPANT_LABELS.opponentTwo,
    names.opponentTwo,
  );
}

export async function fillSetScore(
  page: Page,
  setNumber: number,
  score: SetScoreInput,
): Promise<void> {
  await page
    .getByLabel(`${setNumber}. set - tvoja strana`, { exact: true })
    .fill(score.own);
  await page
    .getByLabel(`${setNumber}. set - protivnici`, { exact: true })
    .fill(score.opponent);
}

export async function fillSetScores(
  page: Page,
  scores: readonly SetScoreInput[],
): Promise<void> {
  for (const [index, score] of scores.entries()) {
    await fillSetScore(page, index + 1, score);
  }
}

export function submitRecordMatchForm(page: Page): Promise<void> {
  return page.getByRole("button", { name: "Evidentiraj meč" }).click();
}

export function setScoreBlock(page: Page, setNumber: number): Locator {
  return page.getByTestId(`set-score-${setNumber}`);
}

export async function recordMatch(
  page: Page,
  names: MatchParticipantNames,
  scores: readonly SetScoreInput[],
): Promise<string> {
  await openRecordMatchForm(page);
  await chooseParticipants(page, names);
  await fillSetScores(page, scores);
  await submitRecordMatchForm(page);
  await page.waitForURL(MATCH_PATH_PATTERN);

  return new URL(page.url()).pathname;
}
