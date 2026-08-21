import { expect, test } from "@playwright/test";

import {
  signUpPlayersInNewContexts,
  closeContexts,
  expectNoRuntimeErrors,
  type SignedInPlayer,
} from "./support/player-account";
import type { SetScoreInput } from "./support/match-recording";
import { playConfirmedMatch } from "./support/match-play";
import { readPlayerSummary } from "./support/player-profile";

test.describe.configure({ mode: "default" });

const STARTING_POINTS = 1000;

const REPORTER_SIDE_WINS: readonly SetScoreInput[] = [
  { own: "6", opponent: "4" },
  { own: "7", opponent: "5" },
];
const OPPONENTS_WIN: readonly SetScoreInput[] = [
  { own: "4", opponent: "6" },
  { own: "5", opponent: "7" },
];

const SETUP_MATCHES = 5;
const STRONG_AFTER_SETUP = 1115;
const WEAK_AFTER_SETUP = 1015;
const ACTIVITY_BONUS = 5;

const WIN_VS_STRONGER = 30;
const WIN_VS_WEAKER = 12;
const LOSS_VS_STRONGER = 5;

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

async function expectPoints(
  player: SignedInPlayer,
  points: number,
  scoredMatchCount: number,
): Promise<void> {
  expect(await readSummaryOf(player), player.account.name).toMatchObject({
    points,
    scoredMatchCount,
  });
}

async function buildStrengthGap(
  players: readonly SignedInPlayer[],
): Promise<void> {
  const [strongOne, strongTwo, weakOne, weakTwo] = players;
  const names = participantNames(players);

  for (let match = 0; match < SETUP_MATCHES; match += 1) {
    await playConfirmedMatch(
      strongOne.page,
      weakOne.page,
      names,
      REPORTER_SIDE_WINS,
    );
  }

  await expectPoints(strongOne, STRONG_AFTER_SETUP, SETUP_MATCHES);
  await expectPoints(strongTwo, STRONG_AFTER_SETUP, SETUP_MATCHES);
  await expectPoints(weakOne, WEAK_AFTER_SETUP, SETUP_MATCHES);
  await expectPoints(weakTwo, WEAK_AFTER_SETUP, SETUP_MATCHES);
}

test("pays the weaker side thirty points for beating the stronger one", async ({
  browser,
  baseURL,
}) => {
  test.setTimeout(240_000);

  const players = await signUpPlayersInNewContexts(browser, baseURL, 4);
  const [strongOne, strongTwo, weakOne, weakTwo] = players;

  await buildStrengthGap(players);

  await playConfirmedMatch(
    strongOne.page,
    weakOne.page,
    participantNames(players),
    OPPONENTS_WIN,
  );

  const scoredMatches = SETUP_MATCHES + 1;
  const weakPoints = WEAK_AFTER_SETUP + WIN_VS_STRONGER + ACTIVITY_BONUS;
  const strongPoints = STRONG_AFTER_SETUP + ACTIVITY_BONUS;

  await expectPoints(weakOne, weakPoints, scoredMatches);
  await expectPoints(weakTwo, weakPoints, scoredMatches);
  await expectPoints(strongOne, strongPoints, scoredMatches);
  await expectPoints(strongTwo, strongPoints, scoredMatches);

  expectNoRuntimeErrors(players);
  await closeContexts(players);
});

test("pays the weaker side five points for losing to the stronger one", async ({
  browser,
  baseURL,
}) => {
  test.setTimeout(240_000);

  const players = await signUpPlayersInNewContexts(browser, baseURL, 4);
  const [strongOne, strongTwo, weakOne, weakTwo] = players;

  await buildStrengthGap(players);

  await playConfirmedMatch(
    strongOne.page,
    weakOne.page,
    participantNames(players),
    REPORTER_SIDE_WINS,
  );

  const scoredMatches = SETUP_MATCHES + 1;
  const strongPoints =
    STRONG_AFTER_SETUP + WIN_VS_WEAKER + ACTIVITY_BONUS;
  const weakPoints = WEAK_AFTER_SETUP + LOSS_VS_STRONGER + ACTIVITY_BONUS;

  await expectPoints(strongOne, strongPoints, scoredMatches);
  await expectPoints(strongTwo, strongPoints, scoredMatches);
  await expectPoints(weakOne, weakPoints, scoredMatches);
  await expectPoints(weakTwo, weakPoints, scoredMatches);

  expectNoRuntimeErrors(players);
  await closeContexts(players);
});

test("adds five points from the third scored match of the window", async ({
  browser,
  baseURL,
}) => {
  test.setTimeout(180_000);

  const players = await signUpPlayersInNewContexts(browser, baseURL, 4);
  const [winnerOne, winnerTwo, loserOne, loserTwo] = players;
  const names = participantNames(players);

  for (let match = 0; match < 2; match += 1) {
    await playConfirmedMatch(
      winnerOne.page,
      loserOne.page,
      names,
      REPORTER_SIDE_WINS,
    );
  }

  await expectPoints(winnerOne, 1040, 2);
  await expectPoints(loserOne, STARTING_POINTS, 2);

  await playConfirmedMatch(
    winnerOne.page,
    loserOne.page,
    names,
    REPORTER_SIDE_WINS,
  );

  await expectPoints(winnerOne, 1065, 3);
  await expectPoints(winnerTwo, 1065, 3);
  await expectPoints(loserOne, STARTING_POINTS + ACTIVITY_BONUS, 3);
  await expectPoints(loserTwo, STARTING_POINTS + ACTIVITY_BONUS, 3);

  expectNoRuntimeErrors(players);
  await closeContexts(players);
});
