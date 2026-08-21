import { expect, test } from "@playwright/test";

import {
  chooseParticipants,
  fillSetScore,
  MATCH_PATH_PATTERN,
  openRecordMatchForm,
  PARTICIPANT_LABELS,
  setScoreBlock,
  submitRecordMatchForm,
} from "./support/match-recording";
import {
  closeContexts,
  expectNoRuntimeErrors,
  openAnonymousPage,
  signUpPlayerInNewContext,
  signUpPlayersInNewContexts,
  submitSignInForm,
} from "./support/player-account";

const SET_SCORE_INVALID_MESSAGE = "Rezultat seta nije valjan. Dopušteni su 6:0 do 6:4, 7:5 i 7:6.";
const THIRD_SET_NOT_ALLOWED_MESSAGE = "Treći set nije dopušten jer je meč odlučen nakon dva seta.";
const MISSING_THIRD_SET_MESSAGE = "Unesi treći set jer je nakon dva seta rezultat 1:1.";

const expectedEmptyHistory = "Još nema mečeva Ovdje će se prikazati povijest mečeva nakon prve evidencije.";

test("renders the record screen contract", async ({ browser, baseURL }) => {
  const reporter = await signUpPlayerInNewContext(browser, baseURL);
  const page = reporter.page;

  await openRecordMatchForm(page);

  await expect(
    page.getByRole("heading", { level: 1, name: "Evidencija meča" }),
  ).toBeVisible();
  await expect(
    page.getByText("Odaberi suigrača i protivnike te unesi rezultat po setovima."),
  ).toBeVisible();

  for (const label of Object.values(PARTICIPANT_LABELS)) {
    await expect(page.getByLabel(label, { exact: true })).toBeVisible();
  }

  for (const setNumber of [1, 2]) {
    await expect(
      page.getByLabel(`${setNumber}. set - tvoja strana`, { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByLabel(`${setNumber}. set - protivnici`, { exact: true }),
    ).toBeVisible();
  }

  await expect(setScoreBlock(page, 3)).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Evidentiraj meč" }),
  ).toBeVisible();

  expectNoRuntimeErrors([reporter]);
  await closeContexts([reporter]);
});

test("sends an anonymous visitor to sign in and back to the record screen", async ({
  browser,
  baseURL,
}) => {
  const owner = await signUpPlayerInNewContext(browser, baseURL);
  const visitor = await openAnonymousPage(browser, baseURL);

  await visitor.page.goto("/matches/new");

  await expect(visitor.page).toHaveURL(
    `/sign-in?callbackUrl=${encodeURIComponent("/matches/new")}`,
  );
  await expect(visitor.page.getByTestId("sign-in-page")).toBeVisible();

  await submitSignInForm(visitor.page, {
    email: owner.account.email,
    password: owner.account.password,
  });

  await visitor.page.waitForURL("/matches/new");
  await expect(visitor.page.getByTestId("record-match-form")).toBeVisible();

  expectNoRuntimeErrors([owner, visitor]);
  await closeContexts([owner, visitor]);
});

test("refuses every invalid result and records nothing", async ({
  browser,
  baseURL,
}) => {
  test.slow();

  const players = await signUpPlayersInNewContexts(browser, baseURL, 4);
  const [reporter, partner, opponentOne, opponentTwo] = players;
  const page = reporter.page;

  await openRecordMatchForm(page);
  await chooseParticipants(page, {
    partner: partner.account.name,
    opponentOne: opponentOne.account.name,
    opponentTwo: opponentTwo.account.name,
  });

  await fillSetScore(page, 1, { own: "6", opponent: "5" });
  await fillSetScore(page, 2, { own: "6", opponent: "4" });
  await submitRecordMatchForm(page);

  await expect(setScoreBlock(page, 1)).toContainText(SET_SCORE_INVALID_MESSAGE);
  await expect(page).toHaveURL(/\/matches\/new$/u);

  await fillSetScore(page, 1, { own: "6", opponent: "4" });
  await fillSetScore(page, 2, { own: "7", opponent: "4" });
  await submitRecordMatchForm(page);

  await expect(setScoreBlock(page, 2)).toContainText(SET_SCORE_INVALID_MESSAGE);
  await expect(setScoreBlock(page, 1)).not.toContainText(
    SET_SCORE_INVALID_MESSAGE,
  );

  await fillSetScore(page, 2, { own: "4", opponent: "6" });

  await expect(setScoreBlock(page, 3)).toBeVisible();

  await submitRecordMatchForm(page);

  await expect(setScoreBlock(page, 3)).toContainText(MISSING_THIRD_SET_MESSAGE);

  await fillSetScore(page, 3, { own: "6", opponent: "4" });
  await fillSetScore(page, 2, { own: "6", opponent: "4" });
  await submitRecordMatchForm(page);

  await expect(setScoreBlock(page, 3)).toContainText(
    THIRD_SET_NOT_ALLOWED_MESSAGE,
  );
  await expect(page).toHaveURL(/\/matches\/new$/u);
  await expect(page).not.toHaveURL(MATCH_PATH_PATTERN);

  await expect(page.getByLabel("Suigrač", { exact: true })).toHaveValue(
    partner.account.name,
  );

  for (const player of players) {
    await player.page.goto(player.profilePath);
    await expect(player.page.getByTestId("match-history-empty")).toHaveText(
      expectedEmptyHistory,
      { useInnerText: true },
    );
  }

  expectNoRuntimeErrors(players);
  await closeContexts(players);
});
