import { expect, test } from "@playwright/test";

import {
  closeContexts,
  expectNoRuntimeErrors,
  openAnonymousPage,
  signUpPlayersInNewContexts,
  type SignedInPlayer,
} from "./support/player-account";
import {
  confirmButton,
  DECISION_MESSAGES,
  decisionMessage,
  disputeButton,
  expectDecisionActions,
  expectNoDecisionActions,
  MATCH_STATUS_LABELS,
  matchStatus,
  openMatchPage,
} from "./support/match-page";
import { recordMatch } from "./support/match-recording";
import { readPlayerSummary } from "./support/player-profile";

const STARTING_POINTS = 1000;
const WIN_VS_SIMILAR = 20;

const TEAM_A_WINS = [
  { own: "6", opponent: "4" },
  { own: "7", opponent: "5" },
];

function participantNames(players: readonly SignedInPlayer[]) {
  const [, partner, opponentOne, opponentTwo] = players;

  return {
    partner: partner.account.name,
    opponentOne: opponentOne.account.name,
    opponentTwo: opponentTwo.account.name,
  };
}

async function readSummaryOf(player: SignedInPlayer) {
  await player.page.goto(player.profilePath);

  return readPlayerSummary(player.page);
}

test("scores a confirmed match and moves the points of all four players", async ({
  browser,
  baseURL,
}) => {
  test.slow();

  const players = await signUpPlayersInNewContexts(browser, baseURL, 4);
  const [reporter, partner, opponentOne, opponentTwo] = players;

  const matchPath = await recordMatch(
    reporter.page,
    participantNames(players),
    TEAM_A_WINS,
  );

  await expect(matchStatus(reporter.page)).toHaveText(
    MATCH_STATUS_LABELS.pending,
  );

  await openMatchPage(opponentOne.page, matchPath);
  await expectDecisionActions(opponentOne.page);
  await confirmButton(opponentOne.page).click();

  await expect(decisionMessage(opponentOne.page)).toHaveText(
    DECISION_MESSAGES.confirmed,
  );
  await expect(matchStatus(opponentOne.page)).toHaveText(
    MATCH_STATUS_LABELS.scored,
  );
  await expect(confirmButton(opponentOne.page)).toHaveCount(0);

  await openMatchPage(reporter.page, matchPath);
  await expect(matchStatus(reporter.page)).toHaveText(
    MATCH_STATUS_LABELS.scored,
  );

  const reporterSummary = await readSummaryOf(reporter);

  expect(reporterSummary.points).toBe(STARTING_POINTS + WIN_VS_SIMILAR);
  expect(reporterSummary.scoredMatchCount).toBe(1);

  expect(await readSummaryOf(partner)).toMatchObject({
    points: STARTING_POINTS + WIN_VS_SIMILAR,
    scoredMatchCount: 1,
  });
  expect(await readSummaryOf(opponentOne)).toMatchObject({
    points: STARTING_POINTS,
    scoredMatchCount: 1,
  });
  expect(await readSummaryOf(opponentTwo)).toMatchObject({
    points: STARTING_POINTS,
    scoredMatchCount: 1,
  });

  await reporter.page.goto("/leaderboard");

  const reporterRow = reporter.page
    .getByTestId("leaderboard-row")
    .filter({ has: reporter.page.locator(`a[href="${reporter.profilePath}"]`) });

  await expect(reporterRow).toHaveText(
    `${reporterSummary.rank}. ${reporter.account.name} ${
      STARTING_POINTS + WIN_VS_SIMILAR
    } 1`,
    { useInnerText: true },
  );

  expectNoRuntimeErrors(players);
  await closeContexts(players);
});

test("settles a disputed match without moving a single point", async ({
  browser,
  baseURL,
}) => {
  test.slow();

  const players = await signUpPlayersInNewContexts(browser, baseURL, 4);
  const [reporter, , opponentOne] = players;

  const matchPath = await recordMatch(
    reporter.page,
    participantNames(players),
    TEAM_A_WINS,
  );

  await openMatchPage(opponentOne.page, matchPath);
  await disputeButton(opponentOne.page).click();

  await expect(decisionMessage(opponentOne.page)).toHaveText(
    DECISION_MESSAGES.disputed,
  );
  await expect(matchStatus(opponentOne.page)).toHaveText(
    MATCH_STATUS_LABELS.disputed,
  );
  await expect(disputeButton(opponentOne.page)).toHaveCount(0);

  for (const player of players) {
    expect(await readSummaryOf(player)).toMatchObject({
      points: STARTING_POINTS,
      scoredMatchCount: 0,
    });
  }

  expectNoRuntimeErrors(players);
  await closeContexts(players);
});

test("offers the decision to the opposing side and to nobody else", async ({
  browser,
  baseURL,
}) => {
  test.slow();

  const players = await signUpPlayersInNewContexts(browser, baseURL, 5);
  const [reporter, partner, opponentOne, , stranger] = players;
  const anonymous = await openAnonymousPage(browser, baseURL);

  const matchPath = await recordMatch(
    reporter.page,
    participantNames(players),
    TEAM_A_WINS,
  );

  await expectNoDecisionActions(reporter.page);

  for (const visitor of [partner.page, stranger.page, anonymous.page]) {
    await openMatchPage(visitor, matchPath);
    await expectNoDecisionActions(visitor);
  }

  await openMatchPage(opponentOne.page, matchPath);
  await expectDecisionActions(opponentOne.page);

  await expect(matchStatus(opponentOne.page)).toHaveText(
    MATCH_STATUS_LABELS.pending,
  );

  expectNoRuntimeErrors([...players, anonymous]);
  await closeContexts([...players, anonymous]);
});

test("tells the second opponent the match has already been decided", async ({
  browser,
  baseURL,
}) => {
  test.slow();

  const players = await signUpPlayersInNewContexts(browser, baseURL, 4);
  const [reporter, , opponentOne, opponentTwo] = players;

  const matchPath = await recordMatch(
    reporter.page,
    participantNames(players),
    TEAM_A_WINS,
  );

  await openMatchPage(opponentOne.page, matchPath);
  await openMatchPage(opponentTwo.page, matchPath);

  await confirmButton(opponentOne.page).click();
  await expect(decisionMessage(opponentOne.page)).toHaveText(
    DECISION_MESSAGES.confirmed,
  );

  await confirmButton(opponentTwo.page).click();
  await expect(decisionMessage(opponentTwo.page)).toHaveText(
    DECISION_MESSAGES.alreadyDecided,
  );
  await expect(matchStatus(opponentTwo.page)).toHaveText(
    MATCH_STATUS_LABELS.scored,
  );
  await expect(confirmButton(opponentTwo.page)).toHaveCount(0);

  expect(await readSummaryOf(reporter)).toMatchObject({
    points: STARTING_POINTS + WIN_VS_SIMILAR,
    scoredMatchCount: 1,
  });

  expectNoRuntimeErrors(players);
  await closeContexts(players);
});
